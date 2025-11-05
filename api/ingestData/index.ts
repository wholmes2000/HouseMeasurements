import { TableClient } from "@azure/data-tables";
import { HttpRequest } from "@azure/functions";

interface SensorReading {
    temperature: number;
    humidity: number;
    pressure: number;
}

const ingestData = async function (context: any, req: HttpRequest): Promise<void> {
    const connectionString = process.env.MY_TABLE_STORAGE_CONNECTION_STRING;
    const tableName = "HouseMeasurementsData";

    if (!connectionString) {
        context.log.error("Environment variable MY_TABLE_STORAGE_CONNECTION_STRING is missing");
        context.res = { status: 500, body: "Server configuration error" };
        return;
    }

    const client = TableClient.fromConnectionString(connectionString, tableName);

    // Safely convert body
    let body: SensorReading | undefined;
    try {
        // If req.body is a string, parse it. Otherwise cast from unknown
        body = typeof req.body === "string"
            ? JSON.parse(req.body)
            : (req.body as unknown as SensorReading);
    } catch (err) {
        context.res = { status: 400, body: "Invalid JSON body" };
        return;
    }

    if (
        !body ||
        typeof body.temperature !== "number" ||
        typeof body.humidity !== "number" ||
        typeof body.pressure !== "number"
    ) {
        context.res = { status: 400, body: "Missing or invalid temperature, humidity, or pressure" };
        return;
    }

    const { temperature, humidity, pressure } = body;
    const timestamp = new Date().toISOString();

    const entity = {
        partitionKey: "sensor1",
        rowKey: timestamp,
        temperature,
        humidity,
        pressure,
        timestamp
    };

    try {
        await client.createEntity(entity);
        context.log.info(`Data stored: ${JSON.stringify(entity)}`);
        context.res = { status: 200, body: { message: "Data stored", rowKey: timestamp } };
    } catch (err) {
        context.log.error("Error storing entity:", err);
        context.res = { status: 500, body: "Failed to store data" };
    }
};

export default ingestData;