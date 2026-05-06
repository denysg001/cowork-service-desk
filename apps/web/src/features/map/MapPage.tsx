import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Card } from "../../components/ui/card";

export function MapPage() {
  const rooms = useQuery({ queryKey: ["rooms", "map"], queryFn: async () => (await api.get("/rooms/map")).data });
  return (
    <div>
      <h1 className="mb-3 text-xl font-semibold">Mapa Visual</h1>
      <Card className="relative aspect-[16/9] border-border bg-muted p-4">
        {rooms.data?.map((room: { id: string; name: string; positionX: string; positionY: string; width: string; height: string }) => (
          <div className="absolute grid place-items-center rounded border border-primary/70 bg-primary/15 text-xs" key={room.id} style={{ left: `${Number(room.positionX) * 100}%`, top: `${Number(room.positionY) * 100}%`, width: `${Number(room.width) * 100}%`, height: `${Number(room.height) * 100}%` }}>
            {room.name}
          </div>
        ))}
      </Card>
    </div>
  );
}
