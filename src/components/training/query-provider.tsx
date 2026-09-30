"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function TrainingQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            staleTime: Infinity,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchInterval: false,
            networkMode: "always",
          },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
