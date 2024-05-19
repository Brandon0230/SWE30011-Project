"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const serialport_1 = require("serialport");
const Readline = require('@serialport/parser-readline');
const mqttEngine_1 = __importDefault(require("../mqttEngine"));
const parser = new Readline.ReadlineParser({ delimiter: '\r\n' });
let port;
let ardState = false;
let mqttEngine = new mqttEngine_1.default('192.168.1.31');
mqttEngine.connect();
mqttEngine.on('connect', () => {
    mqttEngine.subscribe('sensor');
    mqttEngine.subscribe('doorbell');
    mqttEngine.handleMessage();
});
function arduinoPort() {
    return new Promise((resolve, reject) => {
        serialport_1.SerialPort.list()
            .then(ports => {
            const arduinoPorts = ports.filter(port => {
                return port.manufacturer && port.manufacturer.toLowerCase().includes('arduino');
            });
            if (arduinoPorts.length > 0) {
                resolve(arduinoPorts[0].path);
            }
            else {
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
    port = new serialport_1.SerialPort({ path: portPath, baudRate: 9600 });
    port.pipe(parser);
    ardState = true;
    parser.on('data', (data) => {
        const parts = data.trim().split(' ');
        if (parts.length === 2) {
            const temperature = parseFloat(parts[0]);
            const humidity = parseFloat(parts[1]);
            console.log(temperature);
            mqttEngine.sendMessage('sensor', `${temperature},${humidity}`);
        }
        else if (parts.length == 3) {
            const temperature = parseFloat(parts[0]);
            const humidity = parseFloat(parts[1]);
            const motionOut = parts[2];
            console.log(temperature);
            mqttEngine.sendMessage('sensor', `${temperature},${humidity}`);
            mqttEngine.sendMessage('motion', motionOut);
        }
        else if (parts.length == 4) {
            const temperature = parseFloat(parts[0]);
            const humidity = parseFloat(parts[1]);
            const motionOut = parts[2];
            const doorUnlock = parts[3];
            console.log(temperature);
            mqttEngine.sendMessage('sensor', `${temperature},${humidity}`);
            mqttEngine.sendMessage('motion', motionOut);
            mqttEngine.sendMessage('door', doorUnlock);
        }
    });
    mqttEngine.on('sensor', (args) => {
        if (port) {
            switch (args) {
                case 'on':
                    port.write('y');
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
//# sourceMappingURL=stomServer.js.map