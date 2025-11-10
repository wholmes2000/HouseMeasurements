import { useEffect, useState, useCallback } from "react";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
    ResponsiveContainer
} from "recharts";

interface Reading {
    rowKey: string;
    temperature: number;
    humidity: number;
    pressure: number;
}

export default function SensorChart() {
    const [data, setData] = useState<Reading[]>([]);
    const [startDate, setStartDate] = useState<string>(() => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)); // default 24h ago
    const [startTime, setStartTime] = useState<string>("00:00");
    const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10)); // default today
    const [endTime, setEndTime] = useState<string>("23:59");

    const fetchData = useCallback(async () => {
        const startIso = new Date(`${startDate}T${startTime}:00`).toISOString();
        const endIso = new Date(`${endDate}T${endTime}:59.999`).toISOString();

        const url = `/api/getData?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`;
        const res = await fetch(url);
        const json = await res.json();
        const mapped = json.map((r: Reading) => ({
            ...r,
            rowKey: new Date(r.rowKey).getTime()
        }));
        setData(mapped);
    }, [startDate, startTime, endDate, endTime]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div style={{ width: "90%", margin: "auto" }}>
            <h2>House Sensor Dashboard</h2>

            <div style={{ marginBottom: "1rem" }}>
                <label>Start Date: </label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />

                <label style={{ marginLeft: "1rem" }}>End Date: </label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />

                <button style={{ marginLeft: "1rem" }} onClick={fetchData}>Update</button>
            </div>

            <ResponsiveContainer width="100%" height={900}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="rowKey"
                        type="number"
                        domain={[
                            data.length > 0 ? Math.min(...data.map((d) => new Date(d.rowKey).getTime())) : 'auto',
                            data.length > 0 ? Math.max(...data.map((d) => new Date(d.rowKey).getTime())) : 'auto',
                        ]}
                        scale="time"
                        tickFormatter={(value) => new Date(value).toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        interval={'equidistantPreserveStart'}
                    />
                    <YAxis yAxisId="left" label={{ value: 'Temperature °C / Humidity %', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Pressure hPa', angle: -90, position: 'insideRight' }} />
                    <Tooltip
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length > 0) {
                                const point = payload[0].payload;
                                // rowKey is a time of reading
                                const isoString = new Date(point.rowKey).toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                                return (
                                    <div style={{
                                        background: "white",
                                        border: "1px solid #ccc",
                                        padding: "8px"
                                    }}>
                                        <div><strong>Time:</strong> {isoString}</div>
                                        <div><span style={{ color: "red" }}>Temperature:</span> {point.temperature} °C</div>
                                        <div><span style={{ color: "blue" }}>Humidity:</span> {point.humidity} %</div>
                                        <div><span style={{ color: "green" }}>Pressure:</span> {point.pressure} hPa</div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="red" name="Temperature °C" />
                    <Line yAxisId="left" type="monotone" dataKey="humidity" stroke="blue" name="Humidity %" />
                    <Line yAxisId="right" type="monotone" dataKey="pressure" stroke="green" name="Pressure hPa" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}