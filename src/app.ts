const mqtt = require('mqtt');

// Create a client instance
const client = mqtt.connect('mqtt://broker.example.com');

const iotTopic:string = 'sensor';


// Handle connection event
client.on('connect', () => {
    console.log('Connected to MQTT broker');

    // Subscribe to a topic
    client.subscribe('home/topic');

   
});


 // Publish a message to a topic
 client.publish('home/topic', 'Hello, MQTT!');

// Handle message event
client.on('message', (topic: string, message: { toString: () => any; }) => {
    switch (topic){
        case 'home/topic':
            //do something
            break;
        default:
            console.log(`Received message on topic "${topic}": ${message.toString()}`);
    }
    
});

// Handle error event
client.on('error', (error: any) => {
    console.error('MQTT error:', error);
});

// Handle close event
client.on('close', () => {
    console.log('Disconnected from MQTT broker');
});