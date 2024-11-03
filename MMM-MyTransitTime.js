Module.register("MMM-MyTransitTime", {

  // Default module config.
  defaults: {
	apiKey: "YOUR_API_KEY",
	origin: "YOUR_ORIGIN_ADDRESS",
	destination: "YOUR_DESTINATION_ADDRESS",
	mode: "transit",
	interval: 180000, // 3min
	showTransitDetails: true, // Set to true to display step-by-step transit details
	customLabel: "Estimated Time to Get to Work", // Custom label for the module
	debounceDelay: 120000, // 2 min by default, adjust as needed
	scheduleExtraBeginTime: "2024-11-02 14:30", // début des appels a Google Map a - YYYY-MM-DDTHH:mm"
	scheduleExtraFinishTime: "2024-11-02 15:30", // arret des appels a Google Map a. ex : 2024-11-02T14:30"
  },

  // Initialize the module.
	start: function () {
		Log.info("[MMM-MyTransitTime] Starting module:" + this.name );

		this.moment = require('moment-timezone');
		const { apiKey, origin, destination, mode, scheduleExtraBeginTime, scheduleExtraFinishTime } = this.config;

		this.loopInterval = this.config.interval;

		// Définir les limites de l'intervalle (7h30 et 8h30)
		this.startHours = moment.tz("07:30", "HH:mm", "America/Toronto");
		this.endHours = moment.tz("08:30", "HH:mm", "America/Toronto");
		this.specificExtraDateTimeBegin = moment.tz(scheduleExtraBeginTime, "YYYY-MM-DD HH:mm", "America/Toronto");
		this.specificExtraDateTimeFinish = moment.tz(scheduleExtraFinishTime, "YYYY-MM-DD HH:mm", "America/Toronto");

		// call Google Maps - API Destination
		this.apiUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}&transit_mode=subway&transit_mode=bus&language=fr&key=${apiKey}`;

		// Apply debounce to getTransit
		this.getTransitDebounced = this.debounce(this.getTransit.bind(this), this.config.debounceDelay);

		this.scheduleUpdate();
	},

   // Schedule the next update.
	scheduleUpdate: function () {
		setInterval(() => {
			this.getTransitDebounced();
		}, this.loopInterval);
	},

	// Send GET_TRANSIT
	getTransit: function () {
		// Vérifiez si l'heure actuelle se situe dans la plage de pause et week-end
		if (isSpecificSchedule()) {
			console.log("Nous sommes en semaine entre 7h30 et 8h30 à Montréal.");
			this.sendSocketNotification('GET_TRANSIT', this.apiUrl);
		} else {
			return;
		}
	},

	// RECEIVE TRANSIT_TIME_RESULT
	socketNotificationReceived: function (notification, payload) {
		if (notification === "TRANSIT_TIME_RESULT") {
		  console.log("[MMM-MyTransitTime] Received TRANSIT_TIME_RESULT notification.");
		  this.transitTime = payload.transitTime;
		  this.transitDetails = payload.transitDetails;
		  this.updateDom();
		}
		this.updateDom(3000);
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
						textSpan.textContent = `Gambade - ${detail}`;
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

	isSpecificSchedule: function () {
		// Obtenir l'heure actuelle à Montréal
		const montrealMomentNow = moment.tz("America/Toronto");

		// Vérifier si l'heure actuelle est dans cet intervalle
		const isBetween730And830 = montrealMomentNow.isBetween(this.startHours, this.endHours, null, "[]"); // [) inclut 7:30, exclut 8:30
		// Vérifier si c'est un jour de semaine et dans la plage horaire spécifiée
		const isWeekend = montrealMomentNow.day() === 0 && montrealTime.day() === 6; // ni samedi, ni dimanche
		const isWithinSpecificRange = montrealTime.isBetween(this.specificExtraDateTimeBegin, this.specificExtraDateTimeFinish, null, '[]');

		if (isWeekend || !isBetween730And830 || !isWithinSpecificRange) {
			this.loopInterval = 60 * 60 * 1000; // 1 heure
			return false;
		} else {
			this.loopInterval = this.config.interval;
			return true;
		}
	},

});
