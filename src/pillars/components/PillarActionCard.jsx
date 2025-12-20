import MissionControlCard from "../../missionControl/components/MissionControlCard";

export default function PillarActionCard({
  title,
  description,
  onClick,
  disabled = false,
  children,
}) {
  return (
    <MissionControlCard
      title={title}
      description={description}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </MissionControlCard>
  );
}
