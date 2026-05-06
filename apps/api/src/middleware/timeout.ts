import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";
import { timeoutError } from "../utils/errors.js";

export async function timeoutPlugin(app: FastifyInstance) {
  app.addHook("onRequest", async (request, reply) => {
    const timer = setTimeout(() => {
      if (!reply.sent) void reply.code(503).send(timeoutError());
    }, env.REQUEST_TIMEOUT_MS);
    request.raw.setTimeout(env.REQUEST_TIMEOUT_MS);
    reply.raw.on("finish", () => clearTimeout(timer));
    reply.raw.on("close", () => clearTimeout(timer));
  });
}
