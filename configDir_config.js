/* Config Sample
 *
 * For more information on how you can configure this file
 * see https://docs.magicmirror.builders/configuration/introduction.html
 * and https://docs.magicmirror.builders/modules/configuration.html
 *
 * You can use environment variables using a `config.js.template` file instead of `config.js`
 * which will be converted to `config.js` while starting. For more information
 * see https://docs.magicmirror.builders/configuration/introduction.html#enviromnent-variables
 */
let config = {
        address: "localhost",   // Address to listen on, can be:
                                                        // - "localhost", "127.0.0.1", "::1" to liste>                                                        // - another specific IPv4/6 to listen on a s>                                                        // - "0.0.0.0", "::" to listen on any interfa>                                                        // Default, when address config is left out o>        port: 8080,
        basePath: "/",  // The URL path where MagicMirror² is hosted. If you are using a Reverse proxy                                                                        // you must set the sub path >        ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"],  // Set [] to allow all IP addresses
                                                                        // or add a specific IPv4 of >                                                                        // ["127.0.0.1", "::ffff:127.>                                                                        // or IPv4 range of 192.168.3>                                                                        // ["127.0.0.1", "::ffff:127.>
        useHttps: false,                        // Support HTTPS or not, default "false" will use HTTP        httpsPrivateKey: "",    // HTTPS private key path, only require when useHttps is true
        httpsCertificate: "",   // HTTPS Certificate path, only require when useHttps is true

        language: "fr",
        locale: "fr-CA",
        logLevel: ["INFO", "LOG", "WARN", "ERROR"], // Add "DEBUG" for even more logging
        timeFormat: 24,
        units: "metric",

        modules: [
                {
                        module: "alert",
                },
                {
                        module: "updatenotification",
                        position: "top_bar"
                },
                {
                        module: "clock",
                        position: "top_left"
                },
                {
                        module: "calendar",
                        header: "CA Holidays",
                        position: "top_left",
                        config: {
                                calendars: [
                                        {
                                                fetchInterval: 7 * 24 * 60 * 60 * 1000,
                                                symbol: "calendar-check",
                                                url: "https://canada-holidays.ca/ics/QC/2024"
                                        }
                                ]
                        }
                },
                {
                        module: "weather",
                        position: "top_right",
                        config: {
                                weatherProvider: "openmeteo",
                                type: "current",
                                lat: 45.4948933,
                                lon: -73.551081
                        }
                },
                {
                        module: "weather",
                        position: "top_right",
                        header: "Weather Forecast",
                        config: {
                                weatherProvider: "openmeteo",
                                type: "forecast",
                                lat: 45.4948933,
                                lon: -73.551081
                        }
                },
                {
                        module: "newsfeed",
                        position: "bottom_bar",
                        config: {
                                feeds: [
                                        {
                                                title: "Grands titres - Radio Canada",
                                                url: "https://ici.radio-canada.ca/rss/4159"
                                        }
                                ],
                                showSourceTitle: true,
                                showPublishDate: true,
                                broadcastNewsFeeds: true,
                                broadcastNewsUpdates: true
                        }
                },
                {
                        module: "newsfeed",
                        position: "bottom_bar",
                        config: {
                                feeds:[
                                        {
                                                title: "Techno - Radio Canada",
                                                url: "https://ici.radio-canada.ca/rss/4169"
                                        }
                                ],
                                showSourceTitle: true,
                                showPublishDate: true,
                                broadcastNewsFeeds: true,
                                broadcastNewsUpdates: true
                        }
                },
                {
                        module: "newsfeed",
                        position: "bottom_bar",
                        config: {
                                feeds: [
                                        {
                                                title: "Grand Montreal - Radio Canada",
                                                url: "https://ici.radio-canada.ca/rss/4201"
                                        }
                                ],
                                showSourceTitle: true,
                                showPublishDate: true,
                                broadcastNewsFeeds: true,
                                broadcastNewsUpdates: true
                        }
                },
                {
                        module: "MMM-MyTransitTime",
                        position: "top_left",
                        config: {
                                apiKey: "API_Key_TO_CHANGE
                                origin: "43 rue Levis, Longueuil, Canada",
                                destination: "800 rue Saint-Jacques, Montréal, Canada",
                                mode: "transit",
                                interval: 180000,
                                showTransitDetails: true,
                                customLabel: "Time to Work",
                                debounceDelay: 120000,
                                scheduleExtraBeginTime: "2025-01-18 20:47",
                                scheduleExtraFinishTime: "2025-01-18 20:51",
                        }
                },
        ]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") { module.exports = config; }
