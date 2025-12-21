export default function PillarCurtainLayout({
  pillarId,
  title,
  insight,
  action,
  children,
}) {
  return (
    <section className="pillar-curtain" data-pillar={pillarId}>
      <header className="pillar-curtain__header">
        <h1>{title}</h1>
        {insight && <p className="pillar-curtain__insight">{insight}</p>}
      </header>
      <div className="pillar-curtain__action">
        <div className="pillar-curtain__primary-action">{action}</div>
      </div>

      {children && <div className="pillar-curtain__support">{children}</div>}
    </section>
  );
}
