import { useQuery } from "@tanstack/react-query";
import { Card } from "../../components/ui/card";
import { api } from "../../lib/api";

export function ChatPage() {
  const tickets = useQuery({ queryKey: ["tickets", "chat"], queryFn: async () => (await api.get("/tickets", { params: { page: 1, limit: 20 } })).data });
  return (
    <div className="grid grid-cols-[320px_1fr] gap-4">
      <Card className="border-border bg-muted p-3">
        <h1 className="mb-3 font-semibold">Chat</h1>
        {tickets.data?.data?.map((ticket: { id: string; number: number; title: string }) => <div className="rounded border-b border-border p-2 font-mono text-sm" key={ticket.id}>#{ticket.number} {ticket.title}</div>)}
      </Card>
      <Card className="border-border bg-muted p-4">
        <div className="mb-3 flex gap-2 text-sm"><span className="rounded bg-primary px-2 py-1">CLIENT</span><span className="rounded border border-border px-2 py-1">INTERNAL</span></div>
        <p className="text-muted-foreground">Selecione um ticket para abrir a conversa operacional.</p>
      </Card>
    </div>
  );
}
