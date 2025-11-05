"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_tables_1 = require("@azure/data-tables");
const getData = async function (context, req) {
    const connectionString = process.env.MY_TABLE_STORAGE_CONNECTION_STRING;
    const tableName = "HouseMeasurementsData";
    if (!connectionString) {
        context.log.error("Environment variable MY_TABLE_STORAGE_CONNECTION_STRING is missing");
        context.res = { status: 500, body: "Server configuration error" };
        return;
    }
    const client = data_tables_1.TableClient.fromConnectionString(connectionString, tableName);
    const sensorId = "sensor1";
    const { start: startParam, end: endParam } = req.query;
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
        const results = [];
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
    }
    catch (err) {
        context.log.error("Error fetching data:", err);
        context.res = { status: 500, body: "Failed to fetch data" };
    }
};
exports.default = getData;
