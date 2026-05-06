import type { QueryClient } from "@tanstack/react-query";
import { createBrowserRouter } from "react-router-dom";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { LoginPage } from "../features/auth/LoginPage";
import { TicketsPage } from "../features/tickets/TicketsPage";
import { OperationsHome } from "../features/dashboard/OperationsHome";
import { ChatPage } from "../features/chat/ChatPage";
import { MapPage } from "../features/map/MapPage";
import { ReportsPage } from "../features/reports/ReportsPage";
import { AdminPage } from "../features/admin/AdminPage";
import { AdminListPage } from "../features/admin/AdminListPage";
import { ProfilePage } from "../features/profile/ProfilePage";

export function router(_queryClient: QueryClient) {
  return createBrowserRouter([
    { path: "/login", element: <LoginPage /> },
    {
      path: "/",
      element: <DashboardPage />,
      children: [
        { index: true, element: <OperationsHome /> },
        { path: "dashboard", element: <OperationsHome /> },
        { path: "tickets", element: <TicketsPage /> },
        { path: "tickets/new", element: <TicketsPage /> },
        { path: "tickets/:id", element: <TicketsPage /> },
        { path: "tickets/:id/edit", element: <TicketsPage /> },
        { path: "ticket/new", element: <TicketsPage /> },
        { path: "my-tickets", element: <TicketsPage /> },
        { path: "chat", element: <ChatPage /> },
        { path: "map", element: <MapPage /> },
        { path: "reports", element: <ReportsPage /> },
        { path: "profile", element: <ProfilePage /> },
        { path: "admin", element: <AdminPage />, children: [{ path: ":resource", element: <AdminListPage /> }] },
        { path: "notifications", element: <div className="rounded-md border border-border bg-muted p-4">Notificações in-app permanecem disponíveis quando SMTP degrada.</div> }
      ]
    }
  ]);
}
