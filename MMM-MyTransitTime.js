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
	console.log("[MMM-MyTransitTime] Starting module:");
	this.transitTime = null;

	// Définir la fonction avec debounce
    //this.fetchTransitData = this.debounce(this.fetchTransitData.bind(this), this.config.debounceDelay);
	//this.fetchTransitData = this.fetchTransitData.bind(this);

	// Schedule the first update.
	console.log("[MMM-MyTransitTime] before scheduleUpdate");
	this.scheduleUpdate();
	console.log("[MMM-MyTransitTime] after scheduleUpdate() func ");

	// remplace ligne 20
	this.fetchTransitData = this.fetchTransitData.bind(this);
  },

  // Override dom generator.
  getDom: function () {
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
					  textSpan.textContent = `YO - ${detail}`;
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

  // Helper function to extract Google transit icon from detail
  getGoogleTransitIcon: function (detail) {
	  console.log("[MMM-MyTransitTime] getGoogleTransitIcon func ");
	  const icon = detail.match(/icon:(.*?),/);
	  if (icon) {
		  return icon[1].trim();
	  }
	  return "";
  },


  // Override notification handler.
  notificationReceived: function (notification, payload, sender) {
	if (notification === "DOM_OBJECTS_CREATED") {
	  console.log("[MMM-MyTransitTime] DOM objects are ready, triggering the first update.");
	  // DOM objects are ready, trigger the first update.
	  this.sendSocketNotification("GET_TRANSIT_TIME", this.config);
	}
  },

  // Override socket notification handler.
  socketNotificationReceived: function (notification, payload) {
	console.log("[MMM-MyTransitTime] socketNotificationReceived func.");
	if (notification === "TRANSIT_TIME_RESULT") {
	  console.log("[MMM-MyTransitTime] Received TRANSIT_TIME_RESULT notification.");
	  this.transitTime = payload.transitTime;
	  this.transitDetails = payload.transitDetails;
	  this.updateDom();

	  // Schedule the next update.
	  this.scheduleUpdate();
	}
  },

  // Schedule the next update.
  scheduleUpdate: function () {
    const self = this;
    setInterval(() => {
        console.log("[MMM-MyTransitTime] Scheduling the next update.");
        self.fetchTransitData();  // Appel direct de fetchTransitData, déjà géré par debounce
    }, this.config.interval);
  },

  // Fetch transit data from the Google API.
  fetchTransitData: function () {
	console.log("[MMM-MyTransitTime] fetchTransitData est appelé !!");
	const { apiKey, origin, destination, mode } = this.config;
	const apiUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}&transit_mode=subway&transit_mode=bus&language=fr&key=${apiKey}`;

	// Make an HTTP request to the API
	fetch(apiUrl)
	  .then((response) => {
		if (!response.ok) {
		  throw new Error("Network response was not ok");
		}
		return response.json();
	  })
	  .then((data) => {
		// Process the API response and extract transit information
		const transitTime = data.routes[0].legs[0].duration.text;
		const transitSteps = data.routes[0].legs[0].steps.map((step) => {
			if (step.travel_mode === "WALKING") {
				console.log("Je suis walking dead l-145");
				return `1-1-1 ${step.travel_mode}: ${step.distance.text} (${step.duration.text})`;
			} else if (step.travel_mode === "TRANSIT") {
				console.log("Je suis transit l-148");
				if (step.transit_details.line.vehicle.type === "SUBWAY") {
					console.log("Je suis tromé l-150");
					return `2-2-2 Métro ${step.transit_details.line.name} depuis ${step.transit_details.departure_stop.name} vers ${step.transit_details.arrival_stop.name} (départ: ${step.transit_details.departure_time.text} - arrivée: ${step.transit_details.arrival_time.text})`;
				} else if (step.transit_details.line.vehicle.type === "BUS") {
					console.log("Je suis bus l-153");
					return `3-3-3 Bus numéro ${step.transit_details.line.name} à ${step.transit_details.departure_time.text} (arrivée : ${step.transit_details.arrival_time.text})`;
				}
			}
		  });

		// Send the transit information to the front-end
		this.sendSocketNotification("TRANSIT_TIME_RESULT", {
		  transitTime: transitTime,
		  transitDetails: transitSteps,
		});
	  })
	  .catch((error) => {
		console.error("[MMM-MyTransitTime] Error fetching transit data:", error);
	  });
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
