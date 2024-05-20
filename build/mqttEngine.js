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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const mqtt = __importStar(require("mqtt"));
class MQTTEngine extends events_1.EventEmitter {
    constructor(brokerUrl) {
        super();
        this.client = null;
        this.connected = false;
        this.topics = [];
        this.brokerUrl = "mqtt://" + brokerUrl;
    }
    connect() {
        this.client = mqtt.connect(this.brokerUrl);
        this.client.once('connect', () => {
            console.log('Connected to MQTT broker');
            this.connected = true;
            this.emit('connect');
        });
        this.client.on('error', (error) => {
            console.error('MQTT error:', error);
        });
        this.client.once('close', () => {
            console.log('Disconnected from MQTT broker');
            this.connected = false;
        });
    }
    status() {
        return this.connected;
    }
    subscribe(topic) {
        if (this.topics.includes(topic)) {
            console.warn('Already subscribed to', topic);
            return;
        }
        this.topics.push(topic);
        const addr = `home/${topic}`;
        this.client.subscribe(addr);
    }
    disconnect() {
        this.client.end();
    }
    sendMessage(device, message) {
        const topic = `home/${device}`;
        this.client.publish(topic, message);
    }
    handleMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            this.client.on('message', (topic, message) => {
                switch (topic) {
                    case 'home/sensor':
                        console.log('Sensor data:', message.toString());
                        this.emit('sensor', message.toString());
                        break;
                    case 'home/unlocked':
                        this.emit('unlocked', message.toString());
                        break;
                    default:
                        console.warn('Unknown topic:', topic);
                        this.emit('warning', topic, message.toString());
                }
            });
        });
    }
}
exports.default = MQTTEngine;
//# sourceMappingURL=mqttEngine.js.map