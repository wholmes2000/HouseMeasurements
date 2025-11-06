import { TableClient } from "@azure/data-tables";
import { HttpRequest } from "@azure/functions";

const getData = async function (context: any, req: HttpRequest): Promise<void> {
    const connectionString = process.env.MY_TABLE_STORAGE_CONNECTION_STRING;
    const sensorId = process.env.MY_SENSOR_NAME;
    const tableName = process.env.MY_TABLE_NAME;

    if (!connectionString) {
        context.log.error("Environment variable MY_TABLE_STORAGE_CONNECTION_STRING is missing");
        context.res = { status: 500, body: "Server configuration error" };
        return;
    }

    if (!sensorId) {
        context.log.error("Environment variable MY_SENSOR_NAME is missing");
        context.res = { status: 500, body: "Server configuration error" };
        return;
    }

    if (!tableName) {
        context.log.error("Environment variable MY_TABLE_NAME is missing");
        context.res = { status: 500, body: "Server configuration error" };
        return;
    }

    const client = TableClient.fromConnectionString(connectionString, tableName);

    // Properly type query parameters
    interface QueryParams {
        start?: string;
        end?: string;
    }

    const { start: startParam, end: endParam } = req.query as QueryParams;

    const startTime = startParam ? new Date(startParam) : new Date(0);
    const endTime = endParam ? new Date(endParam) : new Date();

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        context.res = { status: 400, body: "Invalid start or end date" };
        return;
    }

    // Add 23:59:59.999 to endTime so the end date is inclusive
    const endOfDay = new Date(endTime.getTime());
    endOfDay.setHours(23, 59, 59, 999);

    const startRowKey = startTime.toISOString();
    const endRowKey = endOfDay.toISOString();

    const filter = `PartitionKey eq '${sensorId}' and RowKey ge '${startRowKey}' and RowKey le '${endRowKey}'`;

    try {
        const entities = client.listEntities({ queryOptions: { filter } });
        const results: any[] = [];

        for await (const entity of entities) {
            results.push({
                timestamp: entity.timestamp,
                temperature: entity.temperature,
                humidity: entity.humidity,
                pressure: entity.pressure
            });
        }

        context.res = {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: results
        };
        context.log.info(`Returned ${results.length} readings`);
    } catch (err) {
        context.log.error("Error fetching data:", err);
        context.res = { status: 500, body: "Failed to fetch data" };
    }
};

export default getData;