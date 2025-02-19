Module.register("MMM-MyTransitTime", {

	// Default module config.
	defaults: {
		apiKey: "YOUR_API_KEY",
		origin: "YOUR_ORIGIN_ADDRESS",
		destination: "YOUR_DESTINATION_ADDRESS",
		mode: "transit",
		interval: 60000, // 1min
		showTransitDetails: true, // Set to true to display step-by-step transit details
		customLabel: "Estimated Time to Get to Work", // Custom label for the module
		debounceDelay: 30000, // 30sec by default, adjust as needed
		scheduleExtraBeginTime: "2024-11-02 14:30", // début des appels a Google Map a - YYYY-MM-DDTHH:mm"
		scheduleExtraFinishTime: "2024-11-02 15:30", // arret des appels a Google Map a. ex : 2024-11-02T14:30"
		startHours: "22:00",
		endHours: "22:10", 
	},

	getScripts: function () {
		return [
			this.file('node_modules/moment-timezone/moment-timezone.js'),
			this.file('node_modules/moment-timezone/builds/moment-timezone-with-data.min.js'),
		]
	},

	getStyles: function() {
		return [
			//this.file('anotherfile.css'), // this file will be loaded straight from the module folder.
		]
	},

  // Initialize the module.
	start: function () {
		const { apiKey, origin, destination, mode, scheduleExtraBeginTime, scheduleExtraFinishTime, startHours, endHours } = this.config;

		this.loopInterval = this.config.interval;
		const tz = "America/Toronto";

		// Définir les limites de l'intervalle (7h30 et 8h30)
		this.startHours = moment.tz(startHours, "HH:mm", tz);
		this.endHours = moment.tz(endHours, "HH:mm", tz);
		this.specificExtraDateTimeBegin = moment.tz(scheduleExtraBeginTime, "YYYY-MM-DD HH:mm", tz);
		this.specificExtraDateTimeFinish = moment.tz(scheduleExtraFinishTime, "YYYY-MM-DD HH:mm", tz);

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
		if (this.isSpecificSchedule()) {
			console.log("Nous sommes en semaine entre 7h30 et 8h30 à Montréal. Prochain appel = ", this.loopInterval);
			this.sendSocketNotification('GET_TRANSIT', this.apiUrl);
		} else {
			console.log("Prochain appel = ", this.loopInterval," ms");
			this.sendSocketNotification('STANDBY', this.loopInterval);
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
						//const walkingIcon = document.createElement("i");
						//walkingIcon.className = "fas fa-walking"; // FontAwesome walking icon
						//listItem.appendChild(walkingIcon);
						//textSpan.textContent = `Gambade - ${detail}`;
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
		const startTime = moment.tz(timezone).set({ year: 2000, month: 0, day: 1, hour: 22, minute: 0, second: 0 });
		const endTime = moment.tz(timezone).set({ year: 2000, month: 0, day: 1, hour: 23, minute: 0, second: 0 });

		// Vérifier si l'heure actuelle est dans cet intervalle
		const isBetween730And830 = montrealMomentNow.isBetween(startTime, endTime, "minute", "[]")
		//const isBetween730And830 = montrealMomentNow.isBetween(this.startHours, this.endHours, null, "[]"); // [) inclut 7:30, exclut 8:30
		
		// Vérifier si c'est un jour de semaine et dans la plage horaire spécifiée
		const isWeekend = montrealMomentNow.day() === 0 || montrealMomentNow.day() === 6;
		const isWithinSpecificRange = montrealMomentNow.isBetween(this.specificExtraDateTimeBegin, this.specificExtraDateTimeFinish, null, '[]');

		if ((isWeekend || !isBetween730And830) && !isWithinSpecificRange) {
			this.loopInterval = this.config.interval; // 30 minutes
			console.log("[MMM-MyTransitTime] R.A.S ");
			return false;
		} else {
			this.loopInterval = this.config.interval;
			console.log("[MMM-MyTransitTime] let's Go !");
			return true;
		}
	},

});
