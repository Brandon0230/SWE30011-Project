import { SerialPort } from "serialport";
import * as Readline from "@serialport/parser-readline";
import MQTTEngine from "../mqttEngine";

const parser = new Readline.ReadlineParser({ delimiter: '\r\n' });
let port: SerialPort<any>;
let ardState = false;
let mqttEngine = new MQTTEngine('mqtt://test.mosquitto.org');
mqttEngine.connect();

mqttEngine.on('connect', () => {
    mqttEngine.subscribe('sensor');
    mqttEngine.subscribe('doorbell');
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
        port = new SerialPort({ path: portPath as string, baudRate: 9600 })
        port.pipe(parser);
        ardState = true;
        parser.on('data', data => {
            const parts = data.trim().split(' ');
            if (parts.length === 2) {
                const temperature = parseFloat(parts[0]);
                const humidity = parseFloat(parts[1]);
                mqttEngine.sendMessage('sensor', `${temperature},${humidity}`);
            }
            else if (parts.length == 4) {
                const temperature = parseFloat(parts[0]);
                const humidity = parseFloat(parts[1]);
                const buttonOut = parts[2] + " " + parts[3];
                mqttEngine.sendMessage('sensor', `${temperature},${humidity}`);
                mqttEngine.sendMessage('doorbell', buttonOut);

            }
        }
        );
        mqttEngine.on('doorbell', (args) => {
            if (port) {
                switch (args) {
                    case 'on':
                        port.write('x');
                        break;
                    case 'off':
                        port.write('y');
                        break;
                    default:
                        console.warn('Unknown sensor command:', args);
                        break;
                }
            }
        });
        mqttEngine.on('sensor', (args) => {
            if (port) {
                switch (args) {
                    case 'on':
                        port.write('z');
                        break;
                    case 'off':
                        port.write('z');
                        break;
                    default:
                        console.warn('Unknown sensor command:', args);
                        break;
                }
            }
        });
    })
    .catch(err => {
        console.error(err);
        
});