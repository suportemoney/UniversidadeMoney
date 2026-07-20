/** Skeleton de carregamento para grids de cards */
export default function PageSkeleton({ cards = 4, tipo = "card" }) {
  if (tipo === "stats") {
    return (
      <div className="dash-skeleton-stats">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="dash-skeleton dash-skeleton--stat" />
        ))}
      </div>
    );
  }

  return (
    <div className="dash-skeleton-grid">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="dash-skeleton dash-skeleton--card" style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  );
}
