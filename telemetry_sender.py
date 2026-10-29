"""Szimulált rakéta-telemetria küldése HTTP-n keresztül.

Egy csomag mezői:
- id: egyedi azonosító
- sequence: a csomag sorszáma
- timestamp: a küldés ideje (UTC, ISO 8601)
- temperature: hőmérséklet Celsius fokban
- voltage: feszültség voltban
- altitude: magasság méterben
- rssi: jelerősség dBm-ben
- status: "ok" vagy "warning"

Futtatás:

    python telemetry_sender.py
    python telemetry_sender.py --count 10 --interval 0.5
    python telemetry_sender.py --url http://localhost:3000/api/telemetry

Alapértelmezett URL: http://localhost:3000/api/telemetry

Példa csomag:

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
"""

import argparse
import json
import random
import time
import uuid
from datetime import datetime, timezone
from urllib.request import Request, urlopen


def create_point(sequence):
    voltage = 12.1 + random.uniform(-0.15, 0.15)
    rssi = int(random.uniform(-85, -45))

    return {
        "id": str(uuid.uuid4()),
        "sequence": sequence,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "temperature": round(20.0 + random.uniform(-2.5, 2.5), 2),
        "voltage": round(voltage, 3),
        "altitude": round(max(0.0, 120.0 + sequence * 0.8 + random.uniform(-5.0, 5.0)), 2),
        "rssi": rssi,
        "status": "warning" if voltage < 12.0 or rssi < -75 else "ok",
    }


def send_point(url, point):
    request = Request(
        url,
        data=json.dumps(point).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    urlopen(request, timeout=5).close()


def main():
    parser = argparse.ArgumentParser(description="Szimulált telemetria küldése.")
    parser.add_argument("--url", default="http://localhost:3000/api/telemetry")
    parser.add_argument("--interval", type=float, default=1.0, help="Másodperc két csomag között.")
    parser.add_argument("--count", type=int, default=0, help="Csomagok száma; 0 = Ctrl+C-ig fut.")
    args = parser.parse_args()

    print(f"Telemetria küldése ide: {args.url} (leállítás: Ctrl+C)")

    sequence = 1
    try:
        while args.count == 0 or sequence <= args.count:
            point = create_point(sequence)
            try:
                send_point(args.url, point)
                print(f"#{sequence} elküldve: altitude={point['altitude']}m, "
                      f"voltage={point['voltage']}V, status={point['status']}")
            except Exception as error:
                print(f"#{sequence} hiba: {error}")
            sequence += 1
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\nLeállítva.")


if __name__ == "__main__":
    main()