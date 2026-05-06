import { io, type Socket } from "socket.io-client";
import { QueryClient } from "@tanstack/react-query";

let socket: Socket | null = null;

export function connectSocket(token: string | null, queryClient: QueryClient) {
  socket?.removeAllListeners();
  socket?.disconnect();
  if (!token) return null;
  socket = io("/", { auth: { token }, reconnection: true, reconnectionAttempts: Infinity });
  socket.on("connect", () => {
    void queryClient.invalidateQueries();
  });
  socket.on("reconnect", () => {
    void queryClient.invalidateQueries();
  });
  socket.on("ticket.created", () => void queryClient.invalidateQueries({ queryKey: ["tickets"] }));
  socket.on("ticket.updated", () => void queryClient.invalidateQueries({ queryKey: ["tickets"] }));
  socket.on("disconnect", () => {
    void queryClient.invalidateQueries({ queryKey: ["tickets"] });
  });
  return socket;
}
