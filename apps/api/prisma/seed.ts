import bcrypt from "bcrypt";
import { prisma } from "../src/db/prisma.js";

const password = (value: string) => bcrypt.hash(value, 12);

async function main() {
  const [adminHash, operHash, clientHash] = await Promise.all([password("admin123"), password("oper123"), password("client123")]);

  const companies = await Promise.all(
    ["TechCorp Ltda", "Consultoria Alpha", "Startup Beta"].map((name) =>
      prisma.company.upsert({ where: { id: companyId(name) }, update: {}, create: { id: companyId(name), name, document: `${name.length}0000000001` } })
    )
  );

  const users = await Promise.all([
    prisma.user.upsert({ where: { email: "admin@coworking.com" }, update: {}, create: { email: "admin@coworking.com", name: "Admin Coworking", role: "ADMIN", passwordHash: adminHash } }),
    prisma.user.upsert({ where: { email: "op1@coworking.com" }, update: {}, create: { email: "op1@coworking.com", name: "Operador 1", role: "OPERATOR", passwordHash: operHash } }),
    prisma.user.upsert({ where: { email: "op2@coworking.com" }, update: {}, create: { email: "op2@coworking.com", name: "Operador 2", role: "OPERATOR", passwordHash: operHash } }),
    ...companies.flatMap((company, index) =>
      [1, 2].map((n) =>
        prisma.user.upsert({
          where: { email: `cliente${n}.${index + 1}@coworking.com` },
          update: {},
          create: { email: `cliente${n}.${index + 1}@coworking.com`, name: `Cliente ${n} ${company.name}`, role: "CLIENT", companyId: company.id, passwordHash: clientHash }
        })
      )
    )
  ]);

  const categories = await Promise.all(
    [
      ["TI", 4],
      ["Limpeza", 2],
      ["Elétrica", 8],
      ["Hidráulica", 12],
      ["Climatização", 6],
      ["Segurança", 4]
    ].map(([name, slaHours]) =>
      prisma.category.upsert({ where: { id: categoryId(String(name)) }, update: {}, create: { id: categoryId(String(name)), name: String(name), slaHours: Number(slaHours) } })
    )
  );

  const suppliers = await Promise.all(
    ["Manutenção Prime", "ClimaService", "Secure Facilities"].map((name) =>
      prisma.supplier.upsert({ where: { id: supplierId(name) }, update: {}, create: { id: supplierId(name), name, email: `${slug(name)}@example.com` } })
    )
  );

  const rooms = [];
  for (let floor = 1; floor <= 3; floor++) {
    for (let i = 1; i <= 6; i++) {
      const name = `Sala ${floor}${String(i).padStart(2, "0")}`;
      rooms.push(
        await prisma.room.upsert({
          where: { qrCode: `ROOM-${floor}-${i}` },
          update: {},
          create: {
            name,
            floor: `${floor}º andar`,
            qrCode: `ROOM-${floor}-${i}`,
            positionX: ((i - 1) % 3) * 0.3 + 0.05,
            positionY: Math.floor((i - 1) / 3) * 0.32 + 0.08,
            width: 0.22,
            height: 0.2
          }
        })
      );
    }
  }

  const operators = users.filter((user) => user.role === "OPERATOR");
  const clients = users.filter((user) => user.role === "CLIENT");
  for (let i = 0; i < 50; i++) {
    const client = clients[i % clients.length]!;
    const category = categories[i % categories.length]!;
    const status = ticketStatusFor(i)!;
    const priority = i < 5 ? "CRITICAL" : i % 3 === 0 ? "HIGH" : "MEDIUM";
    const ticket = await prisma.ticket.create({
      data: {
        title: `Chamado operacional ${String(i + 1).padStart(2, "0")}`,
        description: `Ocorrência seed para validação operacional ${i + 1}`,
        status,
        priority,
        categoryId: category.id,
        companyId: client.companyId!,
        roomId: rooms[i % rooms.length]!.id,
        requesterId: client.id,
        operatorId: operators[i % operators.length]!.id,
        supplierId: i % 4 === 0 ? suppliers[i % suppliers.length]!.id : null,
        slaStatus: i < 5 ? "BREACHED" : i < 10 ? "AT_RISK" : "OK",
        slaDeadline: new Date(Date.now() + (i < 5 ? -1 : i < 10 ? 1 : 8) * 60 * 60 * 1000),
        scheduledAt: status === "SCHEDULED" ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
        diagnosis: status === "RESOLVED" || status === "CLOSED" ? "Diagnóstico registrado no seed." : null,
        action: status === "RESOLVED" || status === "CLOSED" ? "Ação operacional executada." : null,
        validation: status === "RESOLVED" || status === "CLOSED" ? "Validação feita com usuário." : null,
        conclusion: status === "RESOLVED" || status === "CLOSED" ? "Chamado resolvido." : null
      }
    });
    await prisma.ticketHistory.create({ data: { ticketId: ticket.id, userId: operators[i % operators.length]!.id, action: "seed.created", toStatus: ticket.status } });
    await prisma.auditLog.create({ data: { userId: operators[i % operators.length]!.id, action: "seed", entity: "Ticket", entityId: ticket.id, after: ticket, correlationId: "seed" } });
    await prisma.message.create({ data: { ticketId: ticket.id, userId: client.id, type: "CLIENT", content: "Mensagem inicial do cliente." } });
    await prisma.message.create({ data: { ticketId: ticket.id, userId: operators[i % operators.length]!.id, type: "INTERNAL", content: "Nota interna de triagem." } });
  }

  await prisma.featureFlag.createMany({
    data: [
      { key: "company_manager_role", enabled: false, description: "Future COMPANY_MANAGER role" },
      { key: "ai_ticket_summary", enabled: false, description: "Future AI ticket summaries" }
    ],
    skipDuplicates: true
  });
}

function ticketStatusFor(i: number) {
  const statuses = ["NEW", "TRIAGE", "SCHEDULED", "IN_PROGRESS", "WAITING_CLIENT", "WAITING_SUPPLIER", "PAUSED", "RESOLVED", "CLOSED"] as const;
  return statuses[i % statuses.length];
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function companyId(name: string) {
  return `00000000-0000-4000-8000-${String(Math.abs(hash(name))).padStart(12, "0").slice(0, 12)}`;
}

function categoryId(name: string) {
  return `00000000-0000-4001-8000-${String(Math.abs(hash(name))).padStart(12, "0").slice(0, 12)}`;
}

function supplierId(name: string) {
  return `00000000-0000-4002-8000-${String(Math.abs(hash(name))).padStart(12, "0").slice(0, 12)}`;
}

function hash(value: string) {
  return [...value].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 999999999999, 7);
}

main().finally(async () => prisma.$disconnect());
