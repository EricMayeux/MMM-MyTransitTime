const NodeHelper = require("node_helper");
const request = require("request");

module.exports = NodeHelper.create({
	socketNotificationReceived: function(notification, payload) {
		if (notification === "GET_TRANSIT_TIME") {
			console.log("[MMM-MyTransitTime] Received GET_TRANSIT_TIME notification.");
			const { apiKey, origin, destination, mode } = payload;
			const apiUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}&transit_mode=subway&transit_mode=bus&language=fr&key=${apiKey}`;

			console.log("[MMM-MyTransitTime] Requesting data from API URL:", apiUrl);

			request(apiUrl, (error, response, body) => {
				if (!error && response.statusCode == 200) {
					console.log("[MMM-MyTransitTime] Successful response from Google Maps API.");

					// Log the API response data
					console.debug("[MMM-MyTransitTime] API Response Data:", body);
					const data = JSON.parse(body);
					if (data.routes[0] && data.routes[0].legs[0]) {
						const transitTime = data.routes[0].legs[0].duration.text;

						const transitSteps = data.routes[0].legs[0].steps.map(step => {
							if (step.travel_mode === "WALKING") {
								console.log("Je suis walking dead l-26");
								return `${step.travel_mode}: Marche ${step.distance.text} (${step.duration.text})`;
							} else if (step.travel_mode === "TRANSIT") {
								console.log("Je suis transit l-29");
								if (step.transit_details.line.vehicle.type === "SUBWAY") {
									console.log("Je suis tromé l-31");
									return `Métro ${step.transit_details.line.name} depuis ${step.transit_details.departure_stop.name} vers ${step.transit_details.arrival_stop.name} (départ: ${step.transit_details.departure_time.text} - arrivée: ${step.transit_details.arrival_time.text})`;
								} else if (step.transit_details.line.vehicle.type === "BUS") {
									console.log("Je suis bus l-34");
									return `Bus numéro ${step.transit_details.line.name} à ${step.transit_details.departure_time.text} (arrivée : ${step.transit_details.arrival_time.text})`;
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
		}
	}
});
