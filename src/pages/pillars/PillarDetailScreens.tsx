import React from "react";
import PillarPage from "./PillarPage";

const buildPillarScreen = (pillarId: string) => () =>
  <PillarPage pillarIdOverride={pillarId} />;

export const SleepPillarPage = buildPillarScreen("sleep");
export const DietPillarPage = buildPillarScreen("diet");
export const ExercisePillarPage = buildPillarScreen("exercise");
export const PhysicalHealthPillarPage = buildPillarScreen("physical-health");
export const MentalHealthPillarPage = buildPillarScreen("mental-health");
export const FinancesPillarPage = buildPillarScreen("finances");
export const SocialPillarPage = buildPillarScreen("social");
export const SpiritualityPillarPage = buildPillarScreen("spirituality");

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
