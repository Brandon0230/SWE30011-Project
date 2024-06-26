document.addEventListener('DOMContentLoaded', function() {
const socket = io(); // Create a socket.io server instance
const statusbox = document.getElementById('Status');
var tempData = {
    x: [], 
    y: []  
};
var humidData = {
    x: [],
    y: []
};
var tempChart, humidityChart;
var doorButtonPress = false;
socket.on('err', function(data){
    statusbox.innerHTML = data;
});
socket.on('conn', function(data){
    statusbox.innerHTML = 'Connected'
});
function generateCharts(){
    const ctx = document.getElementById('temperatureChart');
    
  tempChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: tempData.x, // Use chart labels if needed
        datasets: [{
            label: 'Temperature',
            data: tempData.y,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            x: {
                type: 'time', // Use time scale for y-axis
                time: {
                    unit: 'second', // Display time in seconds
                    displayFormats: {
                        second: 'h:mm:ss a' // Format for the time axis labels
                    },
                },
                title: {
                    display: true,
                    text: 'Time'
                }
            }
        }
    }
  });
  const ctx2 = document.getElementById('humidityChart');

 humidityChart = new Chart(ctx2, {
    type: 'line',
    data: {
        labels: humidData.x, // Use chart labels if needed
        datasets: [{
            label: 'Humidity',
            data: humidData.y,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            x: {
                type: 'time', // Use time scale for y-axis
                time: {
                    unit: 'second', // Display time in seconds
                    displayFormats: {
                        second: 'h:mm:ss a' // Format for the time axis labels
                    },
                },
                title: {
                    display: true,
                    text: 'Time'
                }
            }
        }
    }
  });
}

function loadTempData() {
    let lastUpdateTime = 0;
    socket.on('temp', function(data) {
        var temp = document.getElementById('Temp');
        function updateChart(chart, data){
            switch (chart) {
                case 'temp':
                    const currentTime = Date.now();
                    tempData.x.push(currentTime);
                    tempData.y.push(data);
        
                    // Ensure that only the last 20 seconds of data are displayed
                    const twentySecondsAgo = currentTime - (20 * 1000); 
                    tempData.x = tempData.x.filter(time => time >= twentySecondsAgo);
                    tempData.y = tempData.y.slice(-tempData.x.length); 
        
                    // Update the chart
                    tempChart.data.labels = tempData.x;
                    tempChart.data.datasets[0].data = tempData.y;
                    tempChart.update();
                    break;
            }
        }       
        var currentTime = Date.now()
        if(currentTime - lastUpdateTime >= 1000) {
        temp.textContent = data + " °C";
        console.log(data);
        updateChart('temp', data);
        lastUpdateTime = currentTime;
        }
    });
}
function loadHumData() {
    let lastUpdateTime = 0;
    socket.on('hum', function(data) {
        if (data !== NaN){
            var humid = document.getElementById('Humid');
            humid.textContent = data + " %";
            function updateChart2(chart, data){
                switch (chart) {
                    case 'hum':
                        const currentTime = Date.now();
                        humidData.x.push(currentTime);
                        humidData.y.push(data);
            
                        // Ensure that only the last 20 seconds of data are displayed
                        const twentySecondsAgo = currentTime - (20 * 1000); 
                        humidData.x = humidData.x.filter(time => time >= twentySecondsAgo);
                        humidData.y = humidData.y.slice(-humidData.x.length);
            
                        // Update the chart
                        humidityChart.data.labels = humidData.x;
                        humidityChart.data.datasets[0].data = humidData.y;
                        humidityChart.update();
                        break;
                }
            }       
            var currentTime = Date.now()
            if(currentTime - lastUpdateTime >= 1000) {
            humid.textContent = data + " %";
            updateChart2('hum', data);
            lastUpdateTime = currentTime;
            }
        }
        
    });
}
function loadButtonData() {
    socket.on('buttonOut', function(data) {
        doorButtonPress = true;
        const currentLiveTime = new Date().toLocaleTimeString();
        const currentDate = (new Date()).toLocaleDateString('en-GB');
        var button = document.getElementById('doorButton');
        button.innerHTML = `<div>${data} at ${currentLiveTime} on ${currentDate}</div>` + button.innerHTML;
    });
        if(doorButtonPress) {
            return "Button Pressed";
        }
        else{
            return " ";
        }
    
}

function changeLightStatus() {
    const onButton = document.getElementById('onButton');
    const offButton = document.getElementById('offButton');
    const sensorButton = document.getElementById('sensorButton');
    const lightText = document.getElementById('lightState');
    const slider = document.getElementById('tempSlider');
    const sliderValue = document.getElementById('tempSliderVal');
    const socket = io();

    onButton.addEventListener('click', () => {
        socket.emit('turnOn');
        lightText.textContent = "Light On";
    });
    offButton.addEventListener('click', () => {
        socket.emit('turnOff');
        lightText.textContent = "Light Off";
    });
    sensorButton.addEventListener('click', () => {
        socket.emit('sensorOn');
        lightText.textContent = "Sensor On";
        console.log('sensor');
    });
    slider.addEventListener('click', () => {
        socket.emit('tempSliderVal', slider.value);
        sliderValue.textContent = slider.value;
    });
}
function updateAllSQLHTML() {
    updateSQLonPage("averageTemp", "tempAvg");
    updateSQLonPage("averageHum", "humidAvg");
    updateSQLonPage("maxTemp", "tempMax");
    updateSQLonPage("maxHum", "humidMax");
}

function updateSQLonPage(socketName, htmlID) {
    const htmlElement = document.getElementById(htmlID);
    socket.on(socketName, function(data) {
        htmlElement.textContent = data.toFixed(2);
    });
}

changeLightStatus();
loadTempData();
loadHumData();
let doorButton = loadButtonData();
generateCharts();
updateAllSQLHTML();
});
