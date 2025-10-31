import { TableClient } from "@azure/data-tables";

export default async function (context: any, req: any): Promise<void> {
    const connectionString: string = process.env.AzureStorageConnectionString || "";
    const tableName = "HouseMeasurementsData";

    const client = TableClient.fromConnectionString(connectionString, tableName);

    const data = req.body;

    const entity = {
        partitionKey: "sensor1",
        rowKey: Date.now().toString(),
        temperature: data.temperature,
        humidity: data.humidity,
        pressure: data.pressure,
        timestamp: new Date().toISOString()
    };

    await client.createEntity(entity);

    context.res = {
        status: 200,
        body: "Data stored"
    };
}