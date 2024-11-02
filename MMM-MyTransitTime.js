Module.register("MMM-MyTransitTime", {
  // Default module config.
  defaults: {
	apiKey: "YOUR_API_KEY",
	origin: "YOUR_ORIGIN_ADDRESS",
	destination: "YOUR_DESTINATION_ADDRESS",
	mode: "transit",
	interval: 30000, // 30 sec
	showTransitDetails: true, // Set to true to display step-by-step transit details
	customLabel: "Estimated Time to Get to Work", // Custom label for the module
	debounceDelay: 5000, // 5 seconds by default, adjust as needed
  },

  // Initialize the module.
	start: function () {
		Log.info("[MMM-MyTransitTime] Starting module:" + this.name );
		const { apiKey, origin, destination, mode } = this.config;

		this.apiUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}&transit_mode=subway&transit_mode=bus&language=fr&key=${apiKey}`;

		this.scheduleUpdate();
	},

   // Schedule the next update.
	scheduleUpdate: function () {
		setInterval(() => {
			this.getTransit();
		}, this.config.interval);
	},

	// Send GET_TRANSIT
	getTransit: function() {
		this.sendSocketNotification('GET_TRANSIT', this.apiUrl);
	},

	// RECEIVE TRANSIT_TIME_RESULT
	socketNotificationReceived: function (notification, payload) {
		if (notification === "TRANSIT_TIME_RESULT") {
		  console.log("[MMM-MyTransitTime] Received TRANSIT_TIME_RESULT notification.");
		  this.transitTime = payload.transitTime;
		  this.transitDetails = payload.transitDetails;
		  this.updateDom();
	
		  // Schedule the next update.
		  this.scheduleUpdate();
		}
		this.updateDom(5000);
	  },

	  // Override dom generator.
	getDom: function () {
		console.log("[MMM-MyTransitTime] getDom func ");
		const wrapper = document.createElement("div");
		wrapper.className = "my-transit-time";
		if (this.transitTime) {
			const timeElement = document.createElement("div");
			timeElement.className = "transit-time right-aligned"; // Add a class for right alignment
			timeElement.textContent = `Transit Time: ${this.transitTime}`;
			wrapper.appendChild(timeElement);
			if (this.config.showTransitDetails && this.transitDetails) {
				const detailsList = document.createElement("ul");
				detailsList.className = "transit-details";

				this.transitDetails.forEach((detail) => {
					const listItem = document.createElement("li");
					const textSpan = document.createElement("span");

					if (detail.includes("WALKING")) {
						const walkingIcon = document.createElement("i");
						walkingIcon.className = "fas fa-walking"; // FontAwesome walking icon
						listItem.appendChild(walkingIcon);
						textSpan.textContent = `YOO - ${detail}`;
					} else if (detail.includes("Métro")) {
						const metroIcon = document.createElement("i");
						metroIcon.className = "fas fa-subway"; // FontAwesome subway/train icon
						listItem.appendChild(metroIcon);
						textSpan.textContent = detail;
						// Extract the line name from the detail and append it
						//const lineName = detail.match(/Take (.*?) from/)[1]; // Adjust regex if needed
						//textSpan.textContent = `${lineName} - ${detail}`;
					} else if (detail.includes("Bus")) {
						const busIcon = document.createElement("i");
						busIcon.className = "fas fa-bus"; // FontAwesome bus icon
						listItem.appendChild(busIcon);
						textSpan.textContent = detail;
					}

					listItem.appendChild(textSpan);
					detailsList.appendChild(listItem);
				});

				wrapper.appendChild(detailsList);
			}
		} else {
			const errorMessage = document.createElement("div");
			errorMessage.className = "error-message";
			errorMessage.textContent = "No transit data available.";
			wrapper.appendChild(errorMessage);
		}
		return wrapper;
	},

	// Debounce function to limit the rate of API requests.
	debounce: function (func, delay) {
		console.log("[MMM-MyTransitTime] init debounce :) ");
		var timeout;
		return function (...args) {
			const context = this;
			clearTimeout(timeout);
			timeout = setTimeout(() => func.apply(context, args), delay);
		};
	},
});
