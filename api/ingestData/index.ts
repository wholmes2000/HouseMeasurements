import { TableClient } from "@azure/data-tables";
import { HttpRequest } from "@azure/functions";

interface SensorReading {
    temperature: number;
    humidity: number;
    pressure: number;
}

interface IngestDataBody {
    nickname?: string;
    uid: string;
    timestamp?: string;
    readings: SensorReading & Record<string, unknown>;
}

const ingestData = async function (context: any, req: HttpRequest): Promise<void> {
    const connectionString = process.env.MY_TABLE_STORAGE_CONNECTION_STRING;
    const tableName = process.env.MY_TABLE_NAME;

    if (!connectionString || !tableName) {
        context.log.error("Missing environment variables");
        context.res = { status: 500, body: "Server configuration error" };
        return;
    }

    const client = TableClient.fromConnectionString(connectionString, tableName);

    // Body parsing
    let body: IngestDataBody;
    try {
        if (req.body && typeof req.body === "object") {
            body = req.body as unknown as IngestDataBody;
        } else if (req.body && typeof req.body === "string") {
            body = JSON.parse(req.body) as IngestDataBody;
        } else {
            const rawText = await req.text();
            body = JSON.parse(rawText) as IngestDataBody;
        }
    } catch (err) {
        context.log.error("Error parsing body:", err);
        context.res = { status: 400, body: "Invalid JSON body" };
        return;
    }

    // Validation
    if (
        !body.uid ||
        !body.readings ||
        typeof body.readings.temperature !== "number" ||
        typeof body.readings.humidity !== "number" ||
        typeof body.readings.pressure !== "number"
    ) {
        context.log.error("Invalid or missing fields:", body);
        context.res = { status: 400, body: "Missing or invalid uid or readings" };
        return;
    }

    // Entity creation
    const partitionKey = body.nickname?.trim() || "sensor1";
    const parsedDate = body.timestamp ? new Date(body.timestamp) : new Date();
    const rowKey = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString();

    const { temperature, humidity, pressure } = body.readings;
    const { uid } = body;

    const entity = { partitionKey, rowKey, temperature, humidity, pressure, uid, timestamp: rowKey };

    try {
        await client.createEntity(entity);
        context.log.info(`✅ Data stored: ${JSON.stringify(entity)}`);
        context.res = { status: 200, body: { message: "Data stored", rowKey } };
    } catch (err) {
        context.log.error("Error storing entity:", err);
        context.res = { status: 500, body: "Failed to store data" };
    }
};

export default ingestData;