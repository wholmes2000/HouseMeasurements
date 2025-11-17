import {
    LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer
} from "recharts";

export interface AxisConfig {
    key: string;
    color: string;
    name: string;
    yAxisId: "left" | "right";
}

interface GenericChartProps {
    data: any[];
    xKey: string;
    yAxes: AxisConfig[];
    title?: string;
}

export default function GenericChart({ data, xKey, yAxes, title }: GenericChartProps) {
    const minX = data.length > 0 ? Math.min(...data.map(d => new Date(d[xKey]).getTime())) : undefined;
    const maxX = data.length > 0 ? Math.max(...data.map(d => new Date(d[xKey]).getTime())) : undefined;
    const yMin = data.length
        ? Math.min(...yAxes.flatMap(axis => data.map(d => d[axis.key])))
        : undefined;

    const yMax = data.length
        ? Math.max(...yAxes.flatMap(axis => data.map(d => d[axis.key])))
        : undefined;

    // Add some padding so the line is not touching the top/bottom
    const yPadding = (yMax! - yMin!) * 0.2 || 1;

    return (
        <div style={{ width: "90%", margin: "auto" }}>
            {title && <h2>{title}</h2>}
            <ResponsiveContainer width="100%" height={600}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey={xKey}
                        type="number"
                        domain={[minX ?? "auto", maxX ?? "auto"]}
                        scale="time"
                        tickFormatter={(v) =>
                            new Date(v).toLocaleString([], { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })
                        }
                        interval="equidistantPreserveStart"
                    />
                    <YAxis
                        yAxisId="left"
                        domain={[
                            yMin !== undefined ? yMin - yPadding : "auto",
                            yMax !== undefined ? yMax + yPadding : "auto"
                        ]}
                        allowDecimals={false}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const p = payload[0].payload;
                                return (
                                    <div style={{ background: "white", border: "1px solid #ccc", padding: "8px" }}>
                                        <div><strong>Time:</strong> {new Date(p[xKey]).toISOString()}</div>
                                        {yAxes.map((axis) => (
                                            <div key={axis.key}>
                                                <span style={{ color: axis.color }}>{axis.name}:</span> {p[axis.key]}
                                            </div>
                                        ))}
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />

                    <Legend />
                    {yAxes.map((axis) => (
                        <Line
                            key={axis.key}
                            yAxisId={axis.yAxisId}
                            type="monotone"
                            dataKey={axis.key}
                            stroke={axis.color}
                            name={axis.name}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}