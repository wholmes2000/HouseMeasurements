import { TableClient } from "@azure/data-tables";

export default async function getData(context: any, req: any): Promise<void> {
    const connectionString: string = process.env.AzureStorageConnectionString || "";
    const tableName = "HouseMeasurementsData";

    const client = TableClient.fromConnectionString(connectionString, tableName);

    const sensorId = "sensor1";

    // Parse optional start/end timestamps
    const startParam: string | undefined = req.query.start;
    const endParam: string | undefined = req.query.end;

    const startTime = startParam ? new Date(startParam) : new Date(0); // default epoch
    const endTime = endParam ? new Date(endParam) : new Date(); // default now

    // Build ISO string RowKeys for filtering
    const startRowKey = startTime.toISOString();
    const endRowKey = endTime.toISOString();

    // Azure Table Storage server-side filter by PartitionKey + RowKey range
    const filter = `PartitionKey eq '${sensorId}' and RowKey ge '${startRowKey}' and RowKey le '${endRowKey}'`;

    const entities = client.listEntities({
        queryOptions: { filter }
    });

    const results: any[] = [];

    for await (const entity of entities) {
        // Already filtered by Azure; just push values
        results.push({
            timestamp: entity.timestamp,
            temperature: entity.temperature,
            humidity: entity.humidity,
            pressure: entity.pressure
        });
    }

    context.res = {
        headers: { "Content-Type": "application/json" },
        body: results
    };
}