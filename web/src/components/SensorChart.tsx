import { useEffect, useState, useCallback } from "react";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from "recharts";

interface Reading {
    timestamp: string;
    temperature: number;
    humidity: number;
    pressure: number;
}

export default function SensorChart() {
    const [data, setData] = useState<Reading[]>([]);
    const [startDate, setStartDate] = useState<string>(() => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)); // default 24h ago
    const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10)); // default today

    const fetchData = useCallback(async () => {
        const startIso = new Date(startDate).toISOString();
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        const endIso = endDateObj.toISOString();

        const url = `/api/getData?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`;
        const res = await fetch(url);
        const json = await res.json();
        const mapped = json.map((r: Reading) => ({
            ...r,
            timestamp: new Date(r.timestamp).getTime()
        }));
        setData(mapped);
    }, [startDate, endDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div style={{ width: "90%", margin: "auto" }}>
            <h2>House Sensor Dashboard</h2>

            <div style={{ marginBottom: "1rem" }}>
                <label>Start Date: </label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

                <label style={{ marginLeft: "1rem" }}>End Date: </label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

                <button style={{ marginLeft: "1rem" }} onClick={fetchData}>Update</button>
            </div>

            <LineChart width={900} height={500} data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="timestamp"
                    type="number"
                    domain={[new Date(startDate).getTime(), new Date(endDate).getTime()]}
                    scale="time"
                    tickFormatter={(value) => new Date(value).toLocaleString()}
                />
                <YAxis yAxisId="left" label={{ value: 'Temperature °C / Humidity %', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Pressure hPa', angle: -90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="red" name="Temperature °C" />
                <Line yAxisId="left" type="monotone" dataKey="humidity" stroke="blue" name="Humidity %" />
                <Line yAxisId="right" type="monotone" dataKey="pressure" stroke="green" name="Pressure hPa" />
            </LineChart>
        </div>
    );
}