"use client";

import { useLoading } from "@/app/contexts/LoadingContext";

export default function GlobalLoader() {
  const { activeCount } = useLoading();
  if (activeCount <= 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "grid",
        placeItems: "center",
        zIndex: 9999,
        backdropFilter: "blur(1px)",
      }}
      aria-live="polite"
      aria-busy="true"
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "6px solid rgba(255,255,255,0.35)",
          borderTopColor: "#fff",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
