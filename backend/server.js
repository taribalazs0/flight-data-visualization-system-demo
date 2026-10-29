// Wiring togeher the websocket server and the telemetry router
// Initializing WebSocket server on port:3000
// Initializing Socket.IO

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors());

// looks specificaly
app.use(express.json());

// Initializing Socket.IO
// enabling cors for frontend
const io = new Server(server, {
    cors: {
        origin: "-", // exact url of frontend
        methods: ["GET", "POST"]
    }
});

// Monitoring client connection
io.on('connection', (socket) => {
    console.log(`WEBSOCKET >>> NEW CLIENT JOINED: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`WEBSOCKET >>> CLIENT DISCONNECTED: ${socket.id}`)
    });
});

// connecting routes
const telemetryRoute = require('./telemetryRoute')(io);
app.use('./api/telemetry', telemetryRoute);

// Lets start the server!

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`FDVS BACKEND RUNNING ON http://localhost:${PORT}`);
});



