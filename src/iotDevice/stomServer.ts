import { SerialPort } from "serialport";
const Readline = require('@serialport/parser-readline');
import MQTTEngine from "../mqttEngine";

const parser = new Readline.ReadlineParser({ delimiter: '\r\n' });
let port: SerialPort<any>;
let ardState = false;
let mqttEngine = new MQTTEngine('192.168.1.31');
mqttEngine.connect();

mqttEngine.on('connect', () => {
    mqttEngine.subscribe('sensor');
    mqttEngine.subscribe('led');
    mqttEngine.handleMessage();
});

function arduinoPort() {
    return new Promise((resolve, reject) => {
        SerialPort.list()
            .then(ports => {
                const arduinoPorts = ports.filter(port => {
                    return port.manufacturer && port.manufacturer.toLowerCase().includes('arduino');
                });
                if (arduinoPorts.length > 0) {
                    resolve(arduinoPorts[0].path);
                } else {
                    reject(new Error('Arduino Port not Found'));
                }
            })
            .catch(err => {
                reject(err);
            });
    });
}
arduinoPort()
    .then(portPath => {
        port = new SerialPort({path: portPath as string, baudRate: 9600 })
        port.pipe(parser);
        ardState = true;
        parser.on('data', (data: string) => {
            const parts = data.trim().split(' ');
            if (parts.length == 3) {
                const temperature = parseFloat(parts[0]);
                const humidity = parseFloat(parts[1]);
                const doorUnlock = parts[2];
                mqttEngine.sendMessage('sensor', `${temperature},${humidity},${doorUnlock}`);
            }
            else if (parts.length == 4) {
                const temperature = parseFloat(parts[0]);
                const humidity = parseFloat(parts[1]);
                const doorUnlock = parts[2];
                const motionOut = parts[3];
                mqttEngine.sendMessage('sensor', `${temperature},${humidity},${doorUnlock}`);
                mqttEngine.sendMessage('motion', motionOut);
            }
        }
        );    
    })
    mqttEngine.on('led', (message) => {
        if (message === 'off') {
            port.write('LEDOFF')
        } else if (message === 'on') {
            port.write('LEDON')
        } else if (message === 'sensor') {
            port.write('LEDSENSOR');
        }
    });