//js app
var http = require('http');
const express = require('express');
var fs = require('fs');
var {SerialPort} = require("serialport");
var socketIO = require('socket.io');
const Readline = require('@serialport/parser-readline');
const path = require('path');
const {Console} = require('console');
const { eventNames } = require('process');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const parser = new Readline.ReadlineParser({ delimiter: '\r\n' });
const sqlite3 = require("sqlite3").verbose();
const dataBase1 = new sqlite3.Database('sensorData.db');

var sensorData = {
    temp: 0, humidity: 0, button_pressed: ""
}
var port;
var ardState = false;
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
        port = new SerialPort({ path: portPath, baudRate: 9600 })
        port.pipe(parser);
        ardState = true;
    })
    .catch(err => {
        console.error(err);
        
    });

    app.use(express.static(path.join(__dirname, '..', 'public')));

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    });

io.on('connection', socket => {
    if (ardState) {
        socket.emit('conn', 'Connected')
        let canWriteToDB = true;
        parser.on('data', data => {
            
            const parts = data.trim().split(' ');
            if (parts.length === 2) {
                const temperature = parseFloat(parts[0]);
                const humidity = parseFloat(parts[1]);
                socket.emit('temp', temperature);
                socket.emit('hum', humidity);
                sensorData.temp = temperature;
                sensorData.humidity = humidity;
            }
            else if (parts.length == 4) {
                const temperature = parseFloat(parts[0]);
                const humidity = parseFloat(parts[1]);
                const buttonOut = parts[2] + " " + parts[3];
                socket.emit('temp', temperature);
                socket.emit('hum', humidity);
                socket.emit('buttonOut', buttonOut);
                sensorData.temp = temperature;
                sensorData.humidity = humidity;
                sensorData.button_pressed = buttonOut;

            }
            parseAllSQL(socket);
        });
        setInterval(() => {
            if (canWriteToDB) {
                canWriteToDB = false;
                saveDataToDB(createLiveDateTime(), sensorData.temp, sensorData.humidity, sensorData.button_pressed);
                setTimeout(() => {
                    canWriteToDB = true;
                }, 1200);
            }
        }, 1200);
        socket.on('turnOn', ()=> {
            if(port) {
                port.write('x');
            }
        });
            socket.on('turnOff', ()=> {
                if(port) {
                    port.write('y');
                }
        });
        socket.on('sensorOn', ()=> {
            if(port) {
                port.write('z');
            }
    });
    } else {
        socket.emit('err', 'Arduino Not Found');
    }
});
server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
function saveDataToDB(dateTime, temperature, humidity, buttonPressed) {
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
function outputSQLData(sql, rowName) {

    dataBase1.get(sql, [], (err, row) => {
        if (err) {
          return console.error(err.message);
        }
        if(row)
        {
            io.emit(rowName, row[rowName])
        }   
    });
}

