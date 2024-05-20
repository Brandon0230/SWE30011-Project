"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = __importDefault(require("socket.io"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const mqttEngine_1 = __importDefault(require("../mqttEngine"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.default.Server(server);
const mqttEngine = new mqttEngine_1.default('192.168.1.31');
const dataBase1 = new sqlite3_1.default.Database('sensorData.db');
let sensorData = { temp: 0, humidity: 0, unlocked: 0 };
mqttEngine.connect();
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'public', 'index.html'));
});
mqttEngine.on('connect', () => {
    mqttEngine.subscribe('sensor');
    mqttEngine.subscribe('doorbell');
    mqttEngine.handleMessage();
});
io.on('connection', socket => {
    socket.emit('conn', 'Connected');
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
    socket.on('turnOn', () => {
        mqttEngine.sendMessage('sensor', 'on');
    });
    socket.on('turnOff', () => {
        mqttEngine.sendMessage('sensor', 'off');
    });
    socket.on('sensorOn', () => {
        mqttEngine.sendMessage('sensor', 'on');
    });
    mqttEngine.on('sensor', (args) => {
        console.log(args);
        const parts = args.split(',');
        sensorData.temp = parseFloat(parts[0]);
        console.log(sensorData.temp);
        sensorData.humidity = parseFloat(parts[1]);
        sensorData.unlocked = parts[2];
        io.emit('temp', sensorData.temp);
        io.emit('hum', sensorData.humidity);
        io.emit('doorUnlocked', sensorData.unlocked);
    });
});
server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
function saveDataToDB(dateTime, temperature, humidity, buttonPressed) {
    dataBase1.run('CREATE TABLE IF NOT EXISTS sensorData (datetime TEXT, temperature REAL, humidity REAL, button_pressed INTEGER)');
    dataBase1.serialize(() => {
        dataBase1.run('INSERT INTO sensorData (datetime, temperature, humidity, button_pressed) VALUES (?,?,?,?)', [dateTime, temperature, humidity, buttonPressed]);
    });
}
function createLiveDateTime() {
    const currentLiveTime = new Date().toLocaleTimeString();
    const currentDate = (new Date()).toLocaleDateString('en-GB');
    return (currentDate + " - " + currentLiveTime);
}
function parseAllSQL() {
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
        if (row) {
            io.emit(rowName, row[rowName]);
        }
    });
}
//# sourceMappingURL=app.js.map