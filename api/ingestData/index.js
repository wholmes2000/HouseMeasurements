"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ingestData;
const data_tables_1 = require("@azure/data-tables");
async function ingestData(context, req) {
    const connectionString = process.env.AzureStorageConnectionString || "";
    const tableName = "HouseMeasurementsData";
    const client = data_tables_1.TableClient.fromConnectionString(connectionString, tableName);
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
