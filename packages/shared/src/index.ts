import { z } from "zod";

export const apiVersion = "v1";
export const websocketEventVersion = 1;

export const uuidSchema = z.string().uuid();
export const isoDateSchema = z.string().datetime();

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional()
});

export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  order: string[];
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    correlationId: string;
    details?: unknown;
  };
};

export type ApiPage<T> = {
  data: T[];
  meta: PageMeta;
};

export const ticketStatusValues = ["OPEN", "IN_PROGRESS", "PAUSED", "RESOLVED", "CLOSED"] as const;
export const ticketPriorityValues = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const ticketStatusSchema = z.enum(ticketStatusValues);
export const ticketPrioritySchema = z.enum(ticketPriorityValues);
export type TicketStatus = z.infer<typeof ticketStatusSchema>;
export type TicketPriority = z.infer<typeof ticketPrioritySchema>;

export const createTicketSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().min(1).max(8000),
  priority: ticketPrioritySchema.default("MEDIUM"),
  location: z.string().min(1).max(120),
  idempotencyKey: z.string().min(16).max(128).optional()
});

export const updateTicketSchema = z.object({
  title: z.string().min(3).max(160).optional(),
  description: z.string().min(1).max(8000).optional(),
  priority: ticketPrioritySchema.optional(),
  status: ticketStatusSchema.optional(),
  version: z.number().int().nonnegative()
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;

export type TicketDto = {
  id: string;
  number: number;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  location: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type RealtimeEnvelope<T> = {
  version: number;
  correlationId: string;
  timestamp: string;
  event: string;
  payload: T;
};

export function makePageMeta(page: number, limit: number, total: number, order: string[]): PageMeta {
  return { page, limit, total, totalPages: Math.ceil(total / limit), order };
}
