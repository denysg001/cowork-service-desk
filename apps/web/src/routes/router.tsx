import type { QueryClient } from "@tanstack/react-query";
import { createBrowserRouter } from "react-router-dom";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { LoginPage } from "../features/auth/LoginPage";
import { TicketsPage } from "../features/tickets/TicketsPage";

export function router(_queryClient: QueryClient) {
  return createBrowserRouter([
    { path: "/login", element: <LoginPage /> },
    {
      path: "/",
      element: <DashboardPage />,
      children: [
        { index: true, element: <TicketsPage /> },
        { path: "notifications", element: <div className="rounded-md border border-border bg-white p-4">Notificações in-app permanecem disponíveis quando SMTP degrada.</div> }
      ]
    }
  ]);
}
