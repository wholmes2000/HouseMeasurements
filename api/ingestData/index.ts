import { TableClient } from "@azure/data-tables";

export default async function ingestData(context: any, req: any): Promise<void> {
    const connectionString: string = process.env.AzureStorageConnectionString || "";
    const tableName = "HouseMeasurementsData";

    const client = TableClient.fromConnectionString(connectionString, tableName);

    const data = req.body;

    const timestamp = new Date().toISOString();

    const entity = {
        partitionKey: "sensor1",
        rowKey: timestamp,
        temperature: data.temperature,
        humidity: data.humidity,
        pressure: data.pressure,
        timestamp: timestamp
    };

    await client.createEntity(entity);

    context.res = {
        status: 200,
        body: "Data Stored"
    };
}