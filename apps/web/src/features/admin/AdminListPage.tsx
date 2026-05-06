import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../../components/ui/card";
import { api } from "../../lib/api";

export function AdminListPage() {
  const { resource = "users" } = useParams();
  const query = useQuery({ queryKey: ["admin", resource], queryFn: async () => (await api.get(`/${resource}`)).data, enabled: !["audit", "settings"].includes(resource) });
  if (["audit", "settings"].includes(resource)) return <Card className="border-border bg-muted p-4">{resource} em preparação operacional.</Card>;
  return (
    <Card className="border-border bg-muted p-4">
      <h1 className="mb-3 text-lg font-semibold">{resource}</h1>
      <pre className="max-h-[620px] overflow-auto text-xs text-muted-foreground">{JSON.stringify(query.data?.data ?? [], null, 2)}</pre>
    </Card>
  );
}
