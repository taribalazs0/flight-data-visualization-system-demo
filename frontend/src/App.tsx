import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { io } from 'socket.io-client';

const API = 'http://localhost:3000';

interface TelemetryPacket {
    db_id?: number;
    id: string;
    sequence: number;
    timestamp: string;
    temperature: number;
    voltage: number;
    altitude: number;
    rssi: number | null;
    status: string;
}

type MetricKey = 'altitude' | 'temperature' | 'voltage' | 'rssi';

interface Metric {
    key: MetricKey;
    label: string;
    unit: string;
    digits: number;
    color: string;
}

const METRICS: Metric[] = [
    { key: 'altitude', label: 'Altitude', unit: 'm', digits: 1, color: '#7eb6ff' },
    { key: 'temperature', label: 'Temperature', unit: '°C', digits: 2, color: '#d4a054' },
    { key: 'voltage', label: 'Voltage', unit: 'V', digits: 3, color: '#7dcea0' },
    { key: 'rssi', label: 'RSSI', unit: 'dBm', digits: 0, color: '#e07a5f' },
];

function formatTime(timestamp: string) {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return timestamp;
    return date.toLocaleString('en-GB', { hour12: false });
}

function formatValue(value: number | null | undefined, digits: number) {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    return value.toFixed(digits);
}

function orderOf(packet: TelemetryPacket) {
    return packet.db_id ?? packet.sequence;
}

function TelemetryChart({ packets, metric }: { packets: TelemetryPacket[]; metric: Metric }) {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const plotted = useMemo(
        () => packets
            .filter((packet) => Number.isFinite(packet[metric.key] as number))
            .sort((a, b) => orderOf(a) - orderOf(b)),
        [packets, metric.key],
    );

    const width = 720;
    const height = 260;
    const pad = { top: 16, right: 16, bottom: 28, left: 58 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;

    if (plotted.length === 0) {
        return <p className="fdvs-empty">No values to plot for this channel.</p>;
    }

    const values = plotted.map((packet) => packet[metric.key] as number);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) {
        min -= 1;
        max += 1;
    }
    const padSpan = (max - min) * 0.08;
    min -= padSpan;
    max += padSpan;

    const times = plotted.map((packet) => new Date(packet.timestamp).getTime());
    const t0 = times[0];
    const t1 = times[times.length - 1];

    const xAt = (index: number) => {
        if (plotted.length === 1 || t1 === t0) return pad.left + innerW / 2;
        return pad.left + ((times[index] - t0) / (t1 - t0)) * innerW;
    };
    const yAt = (value: number) => pad.top + ((max - value) / (max - min)) * innerH;

    const line = plotted
        .map((packet, index) => {
            const command = index === 0 ? 'M' : 'L';
            return `${command} ${xAt(index).toFixed(2)} ${yAt(packet[metric.key] as number).toFixed(2)}`;
        })
        .join(' ');

    const lastIndex = plotted.length - 1;
    const area = plotted.length > 1
        ? `${line} L ${xAt(lastIndex).toFixed(2)} ${(pad.top + innerH).toFixed(2)} L ${xAt(0).toFixed(2)} ${(pad.top + innerH).toFixed(2)} Z`
        : '';

    const activeIndex = hoverIndex ?? lastIndex;
    const active = plotted[activeIndex];
    const ticks = [0, 1, 2, 3].map((step) => {
        const value = max - ((max - min) * step) / 3;
        return { value, y: yAt(value) };
    });

    const move = (event: MouseEvent<SVGSVGElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const svgX = ((event.clientX - rect.left) / rect.width) * width;
        let nearest = 0;
        let best = Infinity;
        for (let index = 0; index < plotted.length; index += 1) {
            const distance = Math.abs(xAt(index) - svgX);
            if (distance < best) {
                best = distance;
                nearest = index;
            }
        }
        setHoverIndex(nearest);
    };

    return (
        <>
            <div className="fdvs-readout">
                <strong style={{ color: metric.color }}>
                    {formatValue(active[metric.key] as number, metric.digits)} {metric.unit}
                </strong>
                <span>{formatTime(active.timestamp)} · #{active.sequence}</span>
            </div>
            <svg
                className="fdvs-chart"
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label={`${metric.label} chart`}
                onMouseMove={move}
                onMouseLeave={() => setHoverIndex(null)}
            >
                {ticks.map((tick) => (
                    <g key={tick.value}>
                        <line
                            x1={pad.left}
                            x2={width - pad.right}
                            y1={tick.y}
                            y2={tick.y}
                            stroke="#2a3832"
                        />
                        <text x={pad.left - 8} y={tick.y + 4} textAnchor="end">
                            {formatValue(tick.value, metric.digits)}
                        </text>
                    </g>
                ))}
                {area && <path d={area} fill={metric.color} opacity="0.16" />}
                <path d={line} fill="none" stroke={metric.color} strokeWidth="2" />
                <line
                    x1={xAt(activeIndex)}
                    x2={xAt(activeIndex)}
                    y1={pad.top}
                    y2={pad.top + innerH}
                    stroke={metric.color}
                    strokeDasharray="3 3"
                    opacity="0.7"
                />
                <circle
                    cx={xAt(activeIndex)}
                    cy={yAt(active[metric.key] as number)}
                    r="4"
                    fill={metric.color}
                />
                <text x={pad.left} y={height - 8}>{formatTime(plotted[0].timestamp)}</text>
                <text x={width - pad.right} y={height - 8} textAnchor="end">
                    {formatTime(plotted[lastIndex].timestamp)}
                </text>
            </svg>
        </>
    );
}

export default function App() {
    const [metricKey, setMetricKey] = useState<MetricKey>('altitude');
    const [connected, setConnected] = useState(false);
    const [packets, setPackets] = useState<TelemetryPacket[]>([]);

    const metric = METRICS.find((item) => item.key === metricKey) ?? METRICS[0];

    useEffect(() => {
        const socket = io(API);

        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));
        socket.on('telemetry_update', (data: TelemetryPacket) => {
            setPackets((prev) => (prev.some((packet) => packet.id === data.id) ? prev : [...prev, data]));
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const tablePackets = useMemo(
        () => [...packets].sort((a, b) => orderOf(b) - orderOf(a)),
        [packets],
    );

    return (
        <div className="fdvs">
            <header className="fdvs-header">
                <div>
                    <p className="fdvs-kicker">BME Suborbitals</p>
                    <h1>FDVS Telemetry</h1>
                </div>
                <div className="fdvs-status">
                    <span className={connected ? 'fdvs-dot on' : 'fdvs-dot'} />
                    {connected ? 'Connected' : 'Disconnected'}
                </div>
            </header>

            <section className="fdvs-panel">
                <div className="fdvs-chart-head">
                    <div className="fdvs-tabs" role="tablist" aria-label="Chart channel">
                        {METRICS.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                className={item.key === metric.key ? 'active' : undefined}
                                onClick={() => setMetricKey(item.key)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
                {packets.length === 0 ? (
                    <p className="fdvs-empty">No packets in this session yet.</p>
                ) : (
                    <TelemetryChart packets={packets} metric={metric} />
                )}
            </section>

            <section className="fdvs-panel">
                <div className="fdvs-table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Sequence</th>
                                <th>Altitude</th>
                                <th>Temperature</th>
                                <th>Voltage</th>
                                <th>RSSI</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tablePackets.map((packet) => (
                                <tr key={packet.id}>
                                    <td>{formatTime(packet.timestamp)}</td>
                                    <td>{packet.sequence}</td>
                                    <td>{formatValue(packet.altitude, 1)} m</td>
                                    <td>{formatValue(packet.temperature, 2)} °C</td>
                                    <td>{formatValue(packet.voltage, 3)} V</td>
                                    <td>{packet.rssi === null ? '—' : `${formatValue(packet.rssi, 0)} dBm`}</td>
                                    <td className={packet.status === 'ok' ? 'ok' : 'warn'}>
                                        {packet.status.toUpperCase()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
