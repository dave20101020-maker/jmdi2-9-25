import React from "react";
import PillarPage from "./PillarPage";
import SleepPillar from "./SleepPillar";

const buildPillarScreen = (pillarId: string, displayName: string) => {
  const Component = () => <PillarPage pillarIdOverride={pillarId} />;
  Component.displayName = `${displayName}PillarPage`;
  return Component;
};

export const SleepPillarPage = () => <SleepPillar />;
export const DietPillarPage = buildPillarScreen("diet", "Diet");
export const ExercisePillarPage = buildPillarScreen("exercise", "Exercise");
export const PhysicalHealthPillarPage = buildPillarScreen(
  "physical-health",
  "PhysicalHealth"
);
export const MentalHealthPillarPage = buildPillarScreen(
  "mental-health",
  "MentalHealth"
);
export const FinancesPillarPage = buildPillarScreen("finances", "Finances");
export const SocialPillarPage = buildPillarScreen("social", "Social");
export const SpiritualityPillarPage = buildPillarScreen(
  "spirituality",
  "Spirituality"
);

const pillarScreens = {
  sleep: SleepPillarPage,
  diet: DietPillarPage,
  exercise: ExercisePillarPage,
  "physical-health": PhysicalHealthPillarPage,
  "mental-health": MentalHealthPillarPage,
  finances: FinancesPillarPage,
  social: SocialPillarPage,
  spirituality: SpiritualityPillarPage,
};

export default pillarScreens;
