### Documentation for BME Suborbitals Ground Support Onboarding project


## Problems solved

- Shows incoming rocket telemetry on a live chart and in a table.
- Stores every packet in a SQLite database.
- Reads the full history back from that database.

## Setup

Install the backend packages from the workspace root:

npm install

Start the frontend:

cd frontend
npm install
npm run dev

In a second terminal, start the backend from `backend/src`
(the SQLite file is created in the current directory):

cd backend/src
node server.js

Open http://localhost:5173

Optional simulated telemetry, from the workspace root:

python telemetry_sender.py

## How to use it

Start the backend and the frontend as described in Setup, then open http://localhost:5173.

The page has two views:

- Live shows packets received since the page was opened.
- All data loads every packet saved in the database.

The chart tabs are Altitude, Temperature, Voltage, and RSSI. The table lists time, sequence, the four measurements, and status (`ok` or `warning`).

To see data arrive, run the simulator from the workspace root:

    python telemetry_sender.py

Stop it with Ctrl+C. A short run:

    python telemetry_sender.py --count 10 --interval 0.5

## Communication

The simulator, or any other client, sends one JSON packet per HTTP POST to `http://localhost:3000/api/telemetry`.
```json
{
  "id": "c1f3f4a5-1d4c-4d7b-8c3e-2b4a6f5e7d8c",
  "sequence": 1,
  "timestamp": "2026-10-03T12:00:00+00:00",
  "temperature": 21.34,
  "voltage": 12.08,
  "altitude": 123.7,
  "rssi": -61,
  "status": "ok"
}

## Guideline for tests

No tests yet