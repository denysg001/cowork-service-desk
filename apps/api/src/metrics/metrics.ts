import client from "prom-client";

export const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry, prefix: "cowork_" });

export const httpDuration = new client.Histogram({
  name: "cowork_http_request_duration_seconds",
  help: "HTTP request latency",
  labelNames: ["method", "route", "status"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30]
});

export const websocketConnections = new client.Gauge({
  name: "cowork_websocket_connections",
  help: "Active websocket connections"
});

registry.registerMetric(httpDuration);
registry.registerMetric(websocketConnections);
