// app/loading.tsx
export default function RouteLoading() {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "5px solid rgba(255,255,255,255.15)",
          borderTopColor: "currentColor",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
