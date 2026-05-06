import { useQuery } from "@tanstack/react-query";
import { Card } from "../../components/ui/card";
import { api } from "../../lib/api";

export function ProfilePage() {
  const me = useQuery({ queryKey: ["me"], queryFn: async () => (await api.get("/users/me")).data });
  return <Card className="border-border bg-muted p-4"><h1 className="mb-3 text-xl font-semibold">Perfil</h1><pre className="text-xs">{JSON.stringify(me.data, null, 2)}</pre></Card>;
}
