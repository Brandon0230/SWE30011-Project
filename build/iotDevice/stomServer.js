"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const serialport_1 = require("serialport");
const Readline = __importStar(require("@serialport/parser-readline"));
const mqttEngine_1 = __importDefault(require("../mqttEngine"));
const parser = new Readline.ReadlineParser({ delimiter: '\r\n' });
let port;
let ardState = false;
let mqttEngine = new mqttEngine_1.default('mqtt://test.mosquitto.org');
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
    });
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
//# sourceMappingURL=stomServer.js.map