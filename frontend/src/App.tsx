import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// We strictly structure our packets
interface TelemetryPacket {
    id: string;
    sequence: number;
    timestamp: string;
    temperature: number;
    voltage: number;
    altitude: number;
    rssi: number;
    status: string;
}

export default function App() {
    // We tell React: "Allocate an array that is strictly allowed to hold TelemetryPacket objects"

    const [telemetry, setTelemetry] = useState<TelemetryPacket[]>([]);

    // This runs only once, when the UI loads
    useEffect(() => {
        // connect to backend on port:3000
        const socket = io('http://localhost:3000');

        socket.on('connect', () => {
            console.log('Connected to FDVS Backed: ', socket.id);
        });


        // listen to the telemetry data/packet we receive from telemetryRoute.js
        socket.on('telemetry_update', (data: TelemetryPacket) => {
            // update the state: add the newest packet to the front of the array
            // we only keep the 15 most recents packets so we dont run out of RAM
            setTelemetry((prev) => [data, ...prev].slice(0, 15));
        });

    // Cleanup function: Disconnect the socket when the component unmounts
        return () => {
            socket.disconnect();
        };
}, []);

    // The UI Rendering (JSX)
    return (
        <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#121212', color: '#e0e0e0', minHeight: '100vh' }}>
            <h1 style={{ borderBottom: '1px solid #444', paddingBottom: '10px' }}>
                BME Suborbitals - FDVS Telemetry 🚀
            </h1>

            <div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
                {telemetry.length === 0 ? (
                    <p style={{ color: '#888' }}>Waiting for rocket payload...</p>
                ) : (
                    telemetry.map((packet) => (
                        <div
                            key={packet.id}
                            style={{
                                border: '1px solid #333',
                                padding: '15px',
                                backgroundColor: '#1e1e1e',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <div><strong>SEQ:</strong> {packet.sequence}</div>
                            <div><strong>ALT:</strong> {packet.altitude.toFixed(1)} m</div>
                            <div><strong>TEMP:</strong> {packet.temperature.toFixed(2)} °C</div>
                            <div><strong>VOLT:</strong> {packet.voltage.toFixed(2)} V</div>
                            <div><strong>RSSI:</strong> {packet.rssi} dBm</div>
                            <div style={{
                                color: packet.status === 'ok' ? '#4caf50' : '#f44336',
                                fontWeight: 'bold'
                            }}>
                                {packet.status.toUpperCase()}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
