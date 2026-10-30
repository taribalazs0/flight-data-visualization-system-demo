// this module receives the POST requests sent my the telemetry_sender python script
// saves the data using the database.js module
// sends out connected WebSocket to client

const express = require('express');
const { insertTelemetry, database } = require('./database')

module.exports = (io) => {
    const router = express.Router();

    router.get('/', (req, res) => {
        database.all(
            `SELECT db_id, id, sequence, timestamp, temperature, voltage, altitude, rsii AS rssi, status
             FROM telemetry
             ORDER BY db_id ASC`,
            (err, rows) => {
                if (err) {
                    console.error("DATABASE ERROR: ", err);
                    return res.status(500).json({
                        error: "FAILED TO READ DATA"
                    });
                }

                res.status(200).json(rows);
            }
        );
    });

    // telling the server to list specifically for HTTP POST requests on this route
    router.post('/', (req, res) => { 
        // 1. the python script sends the JSON payload
        // 2. Express intercepts it
        // 3. parses the JSON
        // 4. attaches it to req.body
        const telemetryData = req.body;
        
        // saving to database
        insertTelemetry(telemetryData, (err, insertId) => {
            if(err) {
                console.error("DATABASE ERROR: ", err);
                return res.status(500).json({
                    error: "FAILED TO SAVE DATA"
                });
            }

            // Sending data to frontend with websockeet
            // Broadcasting a message to all currently connected websocket clients
            io.emit('telemetry_update', telemetryData);

            console.log(`BACKEND >>> DATA PROCESSED AND SENT THROUGH`);
            res.status(200).json({
                message: "OK",
                id: insertId
            });
        });

    });

    return router
}