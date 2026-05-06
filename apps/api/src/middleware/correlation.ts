import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";

export async function correlationPlugin(app: FastifyInstance) {
  app.addHook("onRequest", async (request, reply) => {
    request.correlationId = request.headers["x-correlation-id"]?.toString() ?? randomUUID();
    reply.header("x-correlation-id", request.correlationId);
  });
}
