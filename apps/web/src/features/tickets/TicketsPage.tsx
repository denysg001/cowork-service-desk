import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTicketSchema, type TicketDto } from "@cowork/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus, RefreshCw } from "lucide-react";
import { z } from "zod";
import { api } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";

export function TicketsPage() {
  const queryClient = useQueryClient();
  const tickets = useQuery({
    queryKey: ["tickets"],
    queryFn: async () => (await api.get<{ data: TicketDto[] }>("/tickets", { params: { page: 1, limit: 50 } })).data
  });
  const form = useForm<z.infer<typeof createTicketSchema>>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: { title: "", description: "", location: "Recepção", priority: "MEDIUM" }
  });
  const create = useMutation({
    mutationFn: async (values: z.infer<typeof createTicketSchema>) => api.post("/tickets", { ...values, idempotencyKey: crypto.randomUUID() }),
    onSuccess: async () => {
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["tickets"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
  return (
    <div className="grid grid-cols-[1fr_360px] gap-5">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Tickets</h1>
          <Button aria-label="Atualizar" className="h-8 w-8 px-0" onClick={() => void tickets.refetch()}><RefreshCw size={16} /></Button>
        </div>
        <div className="overflow-hidden rounded-md border border-border bg-white">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">#</th><th>Título</th><th>Status</th><th>Prioridade</th><th>Local</th><th>Atualizado</th></tr>
            </thead>
            <tbody>
              {tickets.data?.data.map((ticket) => (
                <tr className="border-t border-border" key={ticket.id}>
                  <td className="p-3 font-mono">{ticket.number}</td>
                  <td className="max-w-72 truncate">{ticket.title}</td>
                  <td>{ticket.status}</td>
                  <td>{ticket.priority}</td>
                  <td>{ticket.location}</td>
                  <td>{new Date(ticket.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Card className="p-4">
        <h2 className="mb-3 text-base font-semibold">Novo ticket</h2>
        <form className="space-y-3" onSubmit={form.handleSubmit((values) => create.mutate(values))}>
          <Input placeholder="Título" {...form.register("title")} />
          <Textarea placeholder="Descrição" {...form.register("description")} />
          <Input placeholder="Local" {...form.register("location")} />
          <select className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm" {...form.register("priority")}>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>
          <Button disabled={create.isPending} type="submit"><Plus size={16} />Criar</Button>
        </form>
      </Card>
    </div>
  );
}
