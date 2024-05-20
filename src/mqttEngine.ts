import { EventEmitter } from 'events';
import * as mqtt from 'mqtt';


export default class MQTTEngine extends EventEmitter {
    private brokerUrl: string;
    private client: any = null;
    private connected: boolean = false;
    private topics: string[] = [];
    constructor(brokerUrl: string){
        super();
        this.brokerUrl = "mqtt://" + brokerUrl;

    }
    public connect(){
        this.client = mqtt.connect(this.brokerUrl);
        this.client.once('connect', () => {
            console.log('Connected to MQTT broker');
            this.connected = true;
            this.emit('connect');
        });
        this.client.on('error', (error: any) => {
            console.error('MQTT error:', error);
        });
        this.client.once('close', () => {
            console.log('Disconnected from MQTT broker');
            this.connected = false;
        });
    }
    public status(){
        return this.connected;
    }
    public subscribe(topic: string){
        if(this.topics.includes(topic)){
            console.warn('Already subscribed to', topic);
            return;
        }
        this.topics.push(topic);
        const addr = `home/${topic}`;
        this.client.subscribe(addr);
    }
    public disconnect(){
        this.client.end();
    }
    public sendMessage(device: any , message: string){
        const topic = `home/${device}`;
        this.client.publish(topic, message);
    }
    async handleMessage(){
        this.client.on('message', (topic: string, message: Buffer) => {
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
    }
}