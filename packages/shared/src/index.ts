import { z } from "zod";

export const apiVersion = "v1";
export const websocketEventVersion = 1;

export const uuidSchema = z.string().uuid();
export const isoDateSchema = z.string().datetime();

export const roleValues = ["CLIENT", "OPERATOR", "ADMIN"] as const;
export const ticketStatusValues = [
  "NEW",
  "TRIAGE",
  "SCHEDULED",
  "IN_PROGRESS",
  "WAITING_CLIENT",
  "WAITING_SUPPLIER",
  "PAUSED",
  "RESOLVED",
  "CLOSED",
  "CANCELLED"
] as const;
export const priorityValues = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const slaStatusValues = ["OK", "AT_RISK", "BREACHED"] as const;
export const messageTypeValues = ["CLIENT", "INTERNAL"] as const;

export const roleSchema = z.enum(roleValues);
export const ticketStatusSchema = z.enum(ticketStatusValues);
export const prioritySchema = z.enum(priorityValues);
export const slaStatusSchema = z.enum(slaStatusValues);
export const messageTypeSchema = z.enum(messageTypeValues);

export type Role = z.infer<typeof roleSchema>;
export type TicketStatus = z.infer<typeof ticketStatusSchema>;
export type Priority = z.infer<typeof prioritySchema>;
export type SlaStatus = z.infer<typeof slaStatusSchema>;
export type MessageType = z.infer<typeof messageTypeSchema>;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
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

export const createTicketSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().min(1).max(8000),
  priority: prioritySchema.default("MEDIUM"),
  categoryId: uuidSchema,
  companyId: uuidSchema.optional(),
  roomId: uuidSchema.optional(),
  scheduledAt: isoDateSchema.optional(),
  idempotencyKey: z.string().min(16).max(128).optional()
});

export const updateTicketSchema = z.object({
  title: z.string().min(3).max(160).optional(),
  description: z.string().min(1).max(8000).optional(),
  priority: prioritySchema.optional(),
  categoryId: uuidSchema.optional(),
  roomId: uuidSchema.nullable().optional(),
  operatorId: uuidSchema.nullable().optional(),
  supplierId: uuidSchema.nullable().optional(),
  scheduledAt: isoDateSchema.nullable().optional(),
  diagnosis: z.string().max(4000).optional(),
  action: z.string().max(4000).optional(),
  validation: z.string().max(4000).optional(),
  conclusion: z.string().max(4000).optional(),
  version: z.number().int().positive()
});

export const changeTicketStatusSchema = z.object({
  status: ticketStatusSchema,
  version: z.number().int().positive(),
  reason: z.string().max(1000).optional(),
  scheduledAt: isoDateSchema.optional(),
  diagnosis: z.string().max(4000).optional(),
  action: z.string().max(4000).optional(),
  validation: z.string().max(4000).optional(),
  conclusion: z.string().max(4000).optional()
});

export const createMessageSchema = z.object({
  content: z.string().min(1).max(8000),
  idempotencyKey: z.string().min(16).max(128).optional()
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type ChangeTicketStatusInput = z.infer<typeof changeTicketStatusSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;

export type TicketDto = {
  id: string;
  number: number;
  title: string;
  description: string;
  priority: Priority;
  status: TicketStatus;
  slaStatus: SlaStatus;
  categoryId: string;
  companyId: string;
  roomId: string | null;
  requesterId: string;
  operatorId: string | null;
  supplierId: string | null;
  slaDeadline: string | null;
  scheduledAt: string | null;
  diagnosis: string | null;
  action: string | null;
  validation: string | null;
  conclusion: string | null;
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
