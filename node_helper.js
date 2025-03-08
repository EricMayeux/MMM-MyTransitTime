const NodeHelper = require("node_helper");
const request = require("request");

module.exports = NodeHelper.create({

	start: function() {
		console.log("[MMM-MyTransitTime] start node_helper.");
	},

	getGoogleMapInfo: function(url) {
		request({
            url: url,
            method: 'GET'
        }, (error, response, body) => {
				if (!error && response.statusCode == 200) {
					console.log("[MMM-MyTransitTime] Successful response from Google Maps API.");

					var data = JSON.parse(body);

					if (data.routes[0] && data.routes[0].legs[0]) {
						var transitTime = data.routes[0].legs[0].duration.text;

						var transitSteps = data.routes[0].legs[0].steps.map(step => {
							if (step.travel_mode === "WALKING") {
								//return `${step.travel_mode}: Marche ${step.distance.text} (${step.duration.text})`;
								return `Gambade (${step.duration.text})`;
							} else if (step.travel_mode === "TRANSIT") {
								if (step.transit_details.line.vehicle.type === "SUBWAY") {
									return `Métro ${step.transit_details.line.name} depuis ${step.transit_details.departure_stop.name} vers ${step.transit_details.arrival_stop.name} (départ: ${step.transit_details.departure_time.text} - arrivée: ${step.transit_details.arrival_time.text})`;
								} else if (step.transit_details.line.vehicle.type === "BUS") {
									return `Bus numéro ${step.transit_details.line.short_name} à ${step.transit_details.departure_time.text}\n(arrivée : ${step.transit_details.arrival_time.text})`;
								}
							}
						});

						console.log("[MMM-MyTransitTime] Transit steps:", transitSteps);
						console.log("[MMM-MyTransitTime] Sending transit details to frontend.");
						this.sendSocketNotification("TRANSIT_TIME_RESULT", {
							transitTime: transitTime,
							transitDetails: transitSteps
						});
					} else {
						console.error("[MMM-MyTransitTime] No routes or legs found in API response.");
					}
				} else {
					console.error("[MMM-MyTransitTime] Error fetching transit time:", error);
				}
			});
	},
	getWaitingInfo: function() {
		return `Attente du prochain créneau horaire ;-)`;
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === "GET_TRANSIT") {
			console.log("[MMM-MyTransitTime] Received GET_TRANSIT notification.");
			this.getGoogleMapInfo(payload);	
		} else if (notification === "STANDBY"){
			console.log("[MMM-MyTransitTime] STANDBY. ", payload);
			this.getWaitingInfo();
		}
	}

});
