import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { storageProvider } from "../../services/storage.js";

export async function uploadRoutes(app: FastifyInstance) {
  const storage = storageProvider();
  app.post("/tickets/:id/attachments", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const file = await request.file();
    if (!file) return reply.badRequest("File is required");
    const chunks: Buffer[] = [];
    for await (const chunk of file.file) chunks.push(chunk as Buffer);
    const stored = await storage.put({ filename: file.filename, buffer: Buffer.concat(chunks) });
    const attachment = await prisma.attachment.create({
      data: { ticketId: id, filename: file.filename, url: stored.key, mimeType: stored.mime, size: stored.sizeBytes, checksum: stored.checksum }
    });
    return reply.code(201).send(attachment);
  });

  app.delete("/tickets/:id/attachments/:attachmentId", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id, attachmentId } = z.object({ id: z.string().uuid(), attachmentId: z.string().uuid() }).parse(request.params);
    await prisma.attachment.updateMany({ where: { id: attachmentId, ticketId: id, deletedAt: null }, data: { deletedAt: new Date() } });
    return reply.code(204).send();
  });
}
