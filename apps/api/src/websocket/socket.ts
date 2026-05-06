import type { Server as HttpServer } from "node:http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import type { Redis } from "ioredis";
import { env, corsOrigins } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { logger } from "../utils/logger.js";
import { websocketConnections } from "../metrics/metrics.js";
import { websocketEventVersion, type RealtimeEnvelope } from "@cowork/shared";

const activeUsers = new Map<string, string>();

export function createSocketServer(httpServer: HttpServer, pub: Redis, sub: Redis) {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigins, credentials: true },
    transports: ["websocket", "polling"]
  });
  io.adapter(createAdapter(pub, sub));
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const claims = jwt.verify(token, env.JWT_ACCESS_SECRET) as { id: string; email: string; role: string; sessionId: string; type: string };
      const session = await prisma.session.findFirst({ where: { id: claims.sessionId, userId: claims.id, revokedAt: null, expiresAt: { gt: new Date() } } });
      if (!session || claims.type !== "access") return next(new Error("unauthorized"));
      socket.data.user = claims;
      return next();
    } catch (error) {
      return next(new Error("unauthorized"));
    }
  });
  io.on("connection", (socket) => {
    const user = socket.data.user as { id: string; role: string };
    const previous = activeUsers.get(user.id);
    if (previous && previous !== socket.id) io.sockets.sockets.get(previous)?.disconnect(true);
    activeUsers.set(user.id, socket.id);
    websocketConnections.inc();
    void socket.join([`user:${user.id}`, `role:${user.role}`]);
    socket.on("ticket:join", (ticketId: string) => socket.join(`ticket:${ticketId}`));
    socket.on("disconnect", () => {
      if (activeUsers.get(user.id) === socket.id) activeUsers.delete(user.id);
      websocketConnections.dec();
    });
  });
  return io;
}

export function emitRealtime<T>(io: Server | null, room: string, event: string, payload: T, correlationId: string) {
  try {
    const envelope: RealtimeEnvelope<T> = { version: websocketEventVersion, correlationId, timestamp: new Date().toISOString(), event, payload };
    io?.to(room).emit(event, envelope);
  } catch (error) {
    logger.warn("websocket_emit_degraded", { event, room, correlationId, error });
  }
}
