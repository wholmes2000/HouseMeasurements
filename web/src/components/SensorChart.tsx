import { useEffect, useState, useCallback } from "react";
import GenericChart from "./GenericChart";

interface Reading {
    rowKey: string | Date;
    temperature: number;
    humidity: number;
    pressure: number;
}

export default function SensorChart() {
    const [rawData, setRawData] = useState<Reading[]>([]);
    const [data, setData] = useState<Reading[]>([]);
    const [startDate, setStartDate] = useState<string>(() => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    const [startTime, setStartTime] = useState<string>("00:00");
    const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
    const [endTime, setEndTime] = useState<string>("23:59");
    const [smoothPoints, setSmoothPoints] = useState<number>(1);

    const smoothReadings = useCallback((inputData: Reading[], points: number): Reading[] => {
        if (!points || points <= 1) return inputData;

        const smoothArray = (arr: number[]) => {
            const result: number[] = [];
            for (let i = 0; i < arr.length; i++) {
                const start = Math.max(0, i - Math.floor(points / 2));
                const end = Math.min(arr.length - 1, i + Math.floor(points / 2));
                const subset = arr.slice(start, end + 1);
                const avg = subset.reduce((a, b) => a + b, 0) / subset.length;
                result.push(avg);
            }
            return result;
        };

        const temps = smoothArray(inputData.map((p) => p.temperature));
        const hums = smoothArray(inputData.map((p) => p.humidity));
        const press = smoothArray(inputData.map((p) => p.pressure));

        return inputData.map((p, i) => ({
            ...p,
            temperature: temps[i],
            humidity: hums[i],
            pressure: press[i],
        }));
    }, []);

    const fetchData = useCallback(async () => {
        const API_ROOT = process.env.REACT_APP_API_ROOT || "";

        const startIso = new Date(`${startDate}T${startTime}:00`).toISOString();
        const endIso = new Date(`${endDate}T${endTime}:59.999`).toISOString();

        try {
            const res = await fetch(`${API_ROOT}/api/getData?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`);
            const json = await res.json();

            if (!json.measurements || !Array.isArray(json.measurements)) {
                console.error("No measurements array returned from API", json);
                setRawData([]);
                setData([]);
                return;
            }

            const mapped: Reading[] = json.measurements.map((r: Reading) => ({ ...r, rowKey: new Date(r.rowKey) }));
            setRawData(mapped);

            // Apply smoothing using the current value at the time of fetch
            const initialSmoothPoints = smoothPoints > 1 ? smoothPoints : 1;
            setData(smoothReadings(mapped, initialSmoothPoints));
        } catch (err) {
            console.error("Error fetching data:", err);
            setRawData([]);
            setData([]);
        }
    }, [startDate, startTime, endDate, endTime, smoothReadings]); // note: removed smoothPoints from dependencies

    const applySmoothing = useCallback(() => {
        setData(smoothReadings(rawData, smoothPoints));
    }, [rawData, smoothPoints, smoothReadings]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
                <div style={{ marginTop: "1rem" }}>
                    <label>Smoothing (points): </label>
                    <input
                        type="number"
                        value={smoothPoints}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") setSmoothPoints(NaN as any);
                            else setSmoothPoints(parseInt(val));
                        }}
                        style={{ width: "80px", marginRight: "0.5rem" }}
                    />
                    <button onClick={applySmoothing}>Apply Smoothing</button>
                </div>
            </div>

            <div style={{ marginTop: "2rem" }}>
                <GenericChart data={data} xKey="rowKey" yAxes={[{ key: "temperature", color: "red", name: "Temperature °C", yAxisId: "left" }]} title="Temperature" />
            </div>

            <div style={{ marginTop: "2rem" }}>
                <GenericChart data={data} xKey="rowKey" yAxes={[{ key: "humidity", color: "blue", name: "Humidity %", yAxisId: "left" }]} title="Humidity" />
            </div>

            <div style={{ marginTop: "2rem" }}>
                <GenericChart data={data} xKey="rowKey" yAxes={[{ key: "pressure", color: "green", name: "Pressure hPa", yAxisId: "left" }]} title="Pressure" />
            </div>
        </div>
    );
}