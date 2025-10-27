"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";

type Ctx = {
  activeCount: number;
  start: () => void;
  stop: () => void;
  withLoading<T>(fn: () => Promise<T>): Promise<T>;
};

const LoadingContext = createContext<Ctx | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [activeCount, setActiveCount] = useState(0);

  const start = () => setActiveCount((c) => c + 1);
  const stop = () => setActiveCount((c) => Math.max(0, c - 1));

  async function withLoading<T>(fn: () => Promise<T>) {
    start();
    try {
      return await fn();
    } finally {
      stop(); // runs on success or error
    }
  }

  const value = useMemo(
    () => ({ activeCount, start, stop, withLoading }),
    [activeCount],
  );

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
}

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading must be used inside LoadingProvider");
  return ctx;
}
