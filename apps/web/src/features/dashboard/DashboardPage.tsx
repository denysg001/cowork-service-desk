import { useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Bell, Building2, LayoutDashboard, LogOut, Map, MessageSquare, TicketCheck } from "lucide-react";
import { api } from "../../lib/api";
import { connectSocket } from "../../lib/socket";
import { useAuthStore } from "../../stores/auth";
import { Button } from "../../components/ui/button";

export function DashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { accessToken, user, logout } = useAuthStore();
  const summary = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get("/dashboard/summary")).data,
    enabled: Boolean(accessToken)
  });

  useEffect(() => {
    const socket = connectSocket(accessToken, queryClient);
    return () => {
      socket?.removeAllListeners();
      socket?.disconnect();
    };
  }, [accessToken, queryClient]);

  if (!accessToken) {
    navigate("/login");
    return null;
  }

  async function handleLogout() {
    await api.post("/auth/logout").catch(() => undefined);
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-muted">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Activity className="text-primary" size={22} />
            <strong>Coworking Service Desk</strong>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{user?.email}</span>
            <Button aria-label="Sair" className="h-8 w-8 px-0" onClick={handleLogout}><LogOut size={16} /></Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-[220px_1fr] gap-5 px-4 py-5">
        <aside className="space-y-2">
          <NavLink className="flex h-9 items-center gap-2 rounded-md px-3 text-sm hover:bg-muted" to="/dashboard"><LayoutDashboard size={16} />Dashboard</NavLink>
          <NavLink className="flex h-9 items-center gap-2 rounded-md px-3 text-sm hover:bg-muted" to="/tickets"><TicketCheck size={16} />Tickets</NavLink>
          <NavLink className="flex h-9 items-center gap-2 rounded-md px-3 text-sm hover:bg-muted" to="/chat"><MessageSquare size={16} />Chat</NavLink>
          <NavLink className="flex h-9 items-center gap-2 rounded-md px-3 text-sm hover:bg-muted" to="/map"><Map size={16} />Mapa</NavLink>
          <NavLink className="flex h-9 items-center gap-2 rounded-md px-3 text-sm hover:bg-muted" to="/reports"><Activity size={16} />Relatórios</NavLink>
          <NavLink className="flex h-9 items-center gap-2 rounded-md px-3 text-sm hover:bg-muted" to="/admin/users"><Building2 size={16} />Admin</NavLink>
          <NavLink className="flex h-9 items-center gap-2 rounded-md px-3 text-sm hover:bg-muted" to="/notifications"><Bell size={16} />Notificações</NavLink>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-md border border-border bg-muted p-2"><strong className="block text-base">{summary.data?.open ?? "-"}</strong>Abertos</div>
            <div className="rounded-md border border-border bg-muted p-2"><strong className="block text-base">{summary.data?.urgent ?? "-"}</strong>Críticos</div>
            <div className="rounded-md border border-border bg-muted p-2"><strong className="block text-base">{summary.data?.paused ?? "-"}</strong>Pausados</div>
          </div>
        </aside>
        <section>
          <Outlet />
        </section>
      </div>
    </div>
  );
}
