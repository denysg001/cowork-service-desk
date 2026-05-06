import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useFilterStore = create(
  persist<{
    ticketStatus: string;
    query: string;
    setTicketStatus: (ticketStatus: string) => void;
    setQuery: (query: string) => void;
    reset: () => void;
  }>(
    (set) => ({
      ticketStatus: "",
      query: "",
      setTicketStatus: (ticketStatus) => set({ ticketStatus }),
      setQuery: (query) => set({ query }),
      reset: () => set({ ticketStatus: "", query: "" })
    }),
    { name: "cowork-route-filters" }
  )
);
