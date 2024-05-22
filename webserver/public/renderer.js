document.addEventListener("DOMContentLoaded", () => {
	const socket = io(); // Create a socket.io server instance
	const statusbox = document.getElementById("Status");
	const tempData = {
		x: [],
		y: [],
	};
	const humidData = {
		x: [],
		y: [],
	};
	let tempChart;
	let humidityChart;
	socket.on("err", (data) => {
		statusbox.innerHTML = data;
	});

	socket.on("conn", (data) => {
		statusbox.innerHTML = "Connected";
	});
	function updateDoorStatus(status) {
		const doorStatusElement = document.getElementById("doorStatus");
		const doorIcon = document.getElementById("doorIcon");
		const doorText = document.getElementById("doorText");

		if (status === "1") {
			// example 1 is open 0 is locked
			doorStatusElement.className = "door-status unlocked";
			doorIcon.src =
				"SWE30011-Project-latest-backend/build/webserver/public/img/locked-icon.png"; //
			doorText.innerHTML = "Unlocked";
		} else {
			doorStatusElement.className = "door-status locked";
			doorIcon.src =
				"SWE30011-Project-latest-backend/build/webserver/public/img/locked-icon.png"; //
			doorText.innerHTML = "Locked";
		}
	}
	function generateCharts() {
		const ctx = document.getElementById("temperatureChart");

		tempChart = new Chart(ctx, {
			type: "line",
			data: {
				labels: tempData.x, // Use chart labels if needed
				datasets: [
					{
						label: "Temperature",
						data: tempData.y,
						backgroundColor: "rgba(255, 99, 132, 0.2)",
						borderColor: "rgba(255, 99, 132, 1)",
						borderWidth: 1,
					},
				],
			},
			options: {
				scales: {
					x: {
						type: "time", // Use time scale for y-axis
						time: {
							unit: "second", // Display time in seconds
							displayFormats: {
								second: "h:mm:ss a", // Format for the time axis labels
							},
						},
						title: {
							display: true,
							text: "Time",
						},
					},
				},
			},
		});
		const ctx2 = document.getElementById("humidityChart");

		humidityChart = new Chart(ctx2, {
			type: "line",
			data: {
				labels: humidData.x, // Use chart labels if needed
				datasets: [
					{
						label: "Humidity",
						data: humidData.y,
						backgroundColor: "rgba(255, 99, 132, 0.2)",
						borderColor: "rgba(255, 99, 132, 1)",
						borderWidth: 1,
					},
				],
			},
			options: {
				scales: {
					x: {
						type: "time", // Use time scale for y-axis
						time: {
							unit: "second", // Display time in seconds
							displayFormats: {
								second: "h:mm:ss a", // Format for the time axis labels
							},
						},
						title: {
							display: true,
							text: "Time",
						},
					},
				},
			},
		});
	}

	function loadData() {
		let lastUpdateTime = 0;
		socket.on("temp", (data) => {
			const temp = document.getElementById("Temp");
			const updateChart = (chart, data) => {
				switch (chart) {
					case "temp": {
						const currentTime = Date.now();
						tempData.x.push(currentTime);
						tempData.y.push(data);

							// Ensure that only the last 20 seconds of data are displayed
							const twentySecondsAgo = currentTime - 20 * 1000;
							// Filter out data points older than twentySecondsAgo
							tempData.x = tempData.x.filter((time) => time >= twentySecondsAgo);
							tempData.y = tempData.y.slice(-tempData.x.length); // Update y data accordingly

							// Update the chart
							tempChart.data.labels = tempData.x;
							tempChart.data.datasets[0].data = tempData.y;
							tempChart.update();
							break;
					}
				}
			}
			const currentTime = Date.now();
			if (currentTime - lastUpdateTime >= 1000) {
				temp.textContent = `${data} °C`;
				console.log(data);
				updateChart("temp", data);
				lastUpdateTime = currentTime;
			}
		});
	}
	function load2Data() {
		let lastUpdateTime = 0;
		const humid = document.getElementById("Humid");
		socket.on("hum", (data) => {
			if (!Number.isNaN(data)) {
				humid.textContent = `${data} %`;
				function updateChart2(chart, data) {
					switch (chart) {
						case "hum": {
							const currentTime = Date.now();
							humidData.x.push(currentTime);
							humidData.y.push(data);

							// Ensure that only the last 20 seconds of data are displayed
							const twentySecondsAgo = currentTime - 20 * 1000;
							// Filter out data points older than twentySecondsAgo
							humidData.x = humidData.x.filter(
								(time) => time >= twentySecondsAgo,
							);
							humidData.y = humidData.y.slice(-humidData.x.length); // Update y data accordingly

							// Update the chart
							humidityChart.data.labels = humidData.x;
							humidityChart.data.datasets[0].data = humidData.y;
							humidityChart.update();
							break;
						}
					}
				}
				const currentTime = Date.now();
				if (currentTime - lastUpdateTime >= 1000) {
					humid.textContent = `${data} %`;
					updateChart2("hum", data);
					lastUpdateTime = currentTime;
				}
			}
		});
	}
	function loadButtonData() {
		socket.on("buttonOut", (data) => {
			const currentLiveTime = new Date().toLocaleTimeString();
			const currentDate = new Date().toLocaleDateString("en-GB");
			const button = document.getElementById("doorButton");
			button.innerHTML = `<div>${data} at ${currentLiveTime} on ${currentDate}${button.innerHTML}</div>`;
		});
	}

	function changeLightStatus() {
		const onButton = document.getElementById("onButton");
		const offButton = document.getElementById("offButton");
		const sensorButton = document.getElementById("sensorButton");
		const doorUnlocked = document.getElementById("doorUnlocked");
		const socket = io();

		document.getElementById("offButton").addEventListener("click", () => {
			socket.emit("led", "off");
		});

		document.getElementById("onButton").addEventListener("click", () => {
			socket.emit("led", "on");
		});

		document.getElementById("sensorButton").addEventListener("click", () => {
			socket.emit("led", "sensor");
		});
	}
	changeLightStatus();
	loadData();
	load2Data();
	loadButtonData();
	generateCharts();
	updateDoorStatus();
});
