import express from "express";
import socketIO from "socket.io";
import http from "http";
import path from "path";
import sqlite3 from "sqlite3";
import MQTTEngine from "../mqttEngine";
import mqtt from "mqtt/*";


const app = express();
const server = http.createServer(app);
const io = new socketIO.Server(server);
const mqttEngine = new MQTTEngine('192.168.1.31');
const dataBase1 = new sqlite3.Database('sensorData.db');
let sensorData = {temp: 0, humidity: 0, unlocked: 0};

mqttEngine.connect();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

mqttEngine.on('connect', () => {
    mqttEngine.subscribe('sensor');
    mqttEngine.subscribe('button');
    mqttEngine.subscribe('led');
    mqttEngine.handleMessage();
});

io.on('connection', socket => {
    socket.emit('conn', 'Connected')
        let canWriteToDB = true;
        parseAllSQL();
        setInterval(() => {
            if (canWriteToDB) {
                canWriteToDB = false;
                saveDataToDB(createLiveDateTime(), sensorData.temp, sensorData.humidity, sensorData.unlocked);
                setTimeout(() => {
                    canWriteToDB = true;
                }, 1200);
            }
        }, 1200);
        socket.on('turnOn', ()=> {
            mqttEngine.sendMessage('sensor', 'on');
           
        });
            socket.on('turnOff', ()=> {
                mqttEngine.sendMessage('sensor', 'off');
               
        });
        socket.on('sensorOn', ()=> {
            mqttEngine.sendMessage('sensor', 'on');
        });
        mqttEngine.on('sensor', (args) => {
            const parts = args.split(',');
            sensorData.temp = parseFloat(parts[0]);
            sensorData.humidity = parseFloat(parts[1]);
            sensorData.unlocked = parts[2];
            io.emit('temp', sensorData.temp);
            io.emit('hum', sensorData.humidity);
            io.emit('doorUnlocked', sensorData.unlocked);
        });
        socket.on('led', (message) => {
            if (message === 'off') {
                mqttEngine.sendMessage('led', 'off');
            } else if (message === 'on') {
                mqttEngine.sendMessage('led', 'on');
            } else if (message === 'sensor') {
                mqttEngine.sendMessage('led', 'sensor');
            }
        });
});
server.listen(3000, () => {
    console.log('Server is running on port 3000');
});

function saveDataToDB(dateTime: string, temperature: number, humidity: number, buttonPressed: number) {

    dataBase1.run('CREATE TABLE IF NOT EXISTS sensorData (datetime TEXT, temperature REAL, humidity REAL, button_pressed INTEGER)');
    dataBase1.serialize(() => {
       dataBase1.run('INSERT INTO sensorData (datetime, temperature, humidity, button_pressed) VALUES (?,?,?,?)',
       [dateTime, temperature, humidity, buttonPressed]);
   });
}
function createLiveDateTime() {
   const currentLiveTime = new Date().toLocaleTimeString();
   const currentDate = (new Date()).toLocaleDateString('en-GB');
   return (currentDate + " - " + currentLiveTime);
}
function parseAllSQL()
{
   outputSQLData("SELECT AVG(temperature) as averageTemp FROM sensorData", "averageTemp"); //temp avg
   outputSQLData("SELECT AVG(humidity) as averageHum FROM sensorData", "averageHum"); //hum avg
   outputSQLData("SELECT MAX(temperature) as maxTemp FROM sensorData", "maxTemp"); //max temp
   outputSQLData("SELECT MAX(humidity) as maxHum FROM sensorData", "maxHum"); //max hum
}
function outputSQLData(sql: string, rowName: string) {

     dataBase1.get(sql, [], (err, row: {[key: string]: any}) => {
             if (err) {
                 return console.error(err.message);
             }
             if(row)
             {
                     io.emit(rowName, row[rowName])
             }   
     });
}