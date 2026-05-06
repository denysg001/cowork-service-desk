import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "../../components/ui/card";
import { api } from "../../lib/api";

export function ReportsPage() {
  const sla = useQuery({ queryKey: ["reports", "sla"], queryFn: async () => (await api.get("/reports/sla")).data });
  const data = sla.data?.map((item: { slaStatus: string; _count: number }) => ({ name: item.slaStatus, count: item._count })) ?? [];
  return (
    <div>
      <h1 className="mb-3 text-xl font-semibold">Relatórios</h1>
      <Card className="h-72 border-border bg-muted p-4">
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#2dd4bf" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
