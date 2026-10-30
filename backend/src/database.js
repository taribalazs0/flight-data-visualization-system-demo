// This module is used for database creation and the backup of incoming telemetry

const { Statement } = require('sqlite3');

// Import sqlite3 into project
// Attach .verbose() to get more detailed error messages to help with debugging
const sqlite3 = require('sqlite3').verbose();

// Connect to database
const database = new sqlite3.Database('telemetry.db');

// Creating table, if it does not exist yet

database.serialize(() => {
    database.run(`
        CREATE TABLE IF NOT EXISTS telemetry (
            db_id INTEGER PRIMARY KEY AUTOINCREMENT,
            id TEXT,
            sequence INTEGER,
            timestamp TEXT,
            temperature REAL,
            voltage REAL,
            altitude REAl,
            rsii INTEGER,
            status TEXT
        ) 
        `);
});

// Saving data

const insertTelemetry = (data, callback) => {
    const statement = database.prepare(`
        INSERT INTO telemetry (id, sequence, timestamp, temperature, voltage, altitude, rsii, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
        `); // ? : placeholders

    // The table column is named rsii; packets use rssi.
    statement.run(
        data.id, data.sequence, data.timestamp, data.temperature,
        data.voltage, data.altitude, data.rssi ?? data.rsii ?? null, data.status,

        // Callback function which runs immediately after the database
        // finishes attempting to insert our data

        // if(callback) checks if we provided a follow up function
        function(err) { if (callback) callback(err, this.lastID); }
    );

    // frees up sys memory and database resources allocated to our INSERT command
    // we have to explicitly tell SQLite to prevent memory leaks (because we used databse.prepare())
    statement.finalize();
};

    // exporting database and insertTelemetry()
module.exports = {
    database,
    insertTelemetry
};
