export default function PillarCurtainLayout({
  title,
  insight,
  action,
  children,
}) {
  return (
    <section className="pillar-curtain">
      <header className="pillar-curtain__header">
        <h1>{title}</h1>
        {insight && <p className="pillar-curtain__insight">{insight}</p>}
      </header>

      <div className="pillar-curtain__action">{action}</div>

      {children && <div className="pillar-curtain__support">{children}</div>}
    </section>
  );
}
