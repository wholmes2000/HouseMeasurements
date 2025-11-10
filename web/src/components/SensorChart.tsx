import { useEffect, useState, useCallback } from "react";
import GenericChart, { AxisConfig } from "./GenericChart";

interface Reading {
    rowKey: string;
    temperature: number;
    humidity: number;
    pressure: number;
}

export default function SensorChart() {
    const [data, setData] = useState<Reading[]>([]);
    const [startDate, setStartDate] = useState<string>(() => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    const [startTime, setStartTime] = useState<string>("00:00");
    const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
    const [endTime, setEndTime] = useState<string>("23:59");

    const fetchData = useCallback(async () => {
        const startIso = new Date(`${startDate}T${startTime}:00`).toISOString();
        const endIso = new Date(`${endDate}T${endTime}:59.999`).toISOString();

        const res = await fetch(`/api/getData?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`);
        const json = await res.json();
        setData(json.map((r: Reading) => ({ ...r, rowKey: new Date(r.rowKey).getTime() })));
    }, [startDate, startTime, endDate, endTime]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const chartConfig: AxisConfig[] = [
        { key: "temperature", color: "red", name: "Temperature °C", yAxisId: "left" },
        { key: "humidity", color: "blue", name: "Humidity %", yAxisId: "left" },
        { key: "pressure", color: "green", name: "Pressure hPa", yAxisId: "right" },
    ];

    return (
        <div>
            <div style={{ marginBottom: "1rem" }}>
                <label>Start Date:</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                <label style={{ marginLeft: "1rem" }}>End Date:</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                <button style={{ marginLeft: "1rem" }} onClick={fetchData}>Update</button>
            </div>

            <GenericChart data={data} xKey="rowKey" yAxes={chartConfig} title="House Sensor Dashboard" />
        </div>
    );
}