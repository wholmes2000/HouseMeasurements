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
    readings: SensorReading & { [key: string]: any };
}

const ingestData = async function (context: any, req: HttpRequest): Promise<void> {
    const connectionString = process.env.MY_TABLE_STORAGE_CONNECTION_STRING;
    const tableName = process.env.MY_TABLE_NAME;

    if (!connectionString) {
        context.log.error("Environment variable MY_TABLE_STORAGE_CONNECTION_STRING is missing");
        context.res = { status: 500, body: "Server configuration error" };
        return;
    }

    if (!tableName) {
        context.log.error("Environment variable MY_TABLE_NAME is missing");
        context.res = { status: 500, body: "Server configuration error" };
        return;
    }

    const client = TableClient.fromConnectionString(connectionString, tableName);

    // Safely convert body
    let body: IngestDataBody | undefined;
    try {
        // If req.body is a string, parse it. Otherwise cast from unknown
        body = typeof req.body === "string"
            ? JSON.parse(req.body)
            : (req.body as unknown as IngestDataBody);
    } catch (err) {
        context.res = { status: 400, body: "Invalid JSON body" };
        return;
    }

    if (
        !body ||
        typeof body.uid !== "string" ||
        typeof body.readings !== "object" ||
        body.readings === null ||
        typeof body.readings.temperature !== "number" ||
        typeof body.readings.humidity !== "number" ||
        typeof body.readings.pressure !== "number"
    ) {
        context.res = { status: 400, body: "Missing or invalid uid or readings with temperature, humidity, or pressure" };
        return;
    }

    const partitionKey = body.nickname && body.nickname.trim() !== "" ? body.nickname : "sensor1";

    let rowKey = new Date().toISOString();
    if (body.timestamp) {
        const parsedDate = new Date(body.timestamp);
        if (!isNaN(parsedDate.getTime())) {
            rowKey = parsedDate.toISOString();
        }
    }

    const { temperature, humidity, pressure } = body.readings;
    const { uid } = body;

    const entity = {
        partitionKey,
        rowKey,
        temperature,
        humidity,
        pressure,
        uid,
        timestamp: rowKey
    };

    try {
        await client.createEntity(entity);
        context.log.info(`Data stored: ${JSON.stringify(entity)}`);
        context.res = { status: 200, body: { message: "Data stored", rowKey } };
    } catch (err) {
        context.log.error("Error storing entity:", err);
        context.res = { status: 500, body: "Failed to store data" };
    }
};

export default ingestData;