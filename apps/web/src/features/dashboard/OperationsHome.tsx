import { useQuery } from "@tanstack/react-query";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "../../components/ui/card";
import { api } from "../../lib/api";

export function OperationsHome() {
  const summary = useQuery({ queryKey: ["dashboard"], queryFn: async () => (await api.get("/dashboard/summary")).data });
  const data = [
    { name: "Abertos", value: summary.data?.open ?? 0, color: "#2dd4bf" },
    { name: "Críticos", value: summary.data?.urgent ?? 0, color: "#f43f5e" },
    { name: "Pausados", value: summary.data?.paused ?? 0, color: "#f59e0b" }
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Centro de Operações</h1>
      <div className="grid grid-cols-3 gap-3">
        {data.map((item) => <Card className="border-border bg-muted p-4" key={item.name}><span className="text-sm text-muted-foreground">{item.name}</span><strong className="block text-3xl">{item.value}</strong></Card>)}
      </div>
      <Card className="h-72 border-border bg-muted p-4">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95}>
              {data.map((entry) => <Cell fill={entry.color} key={entry.name} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
