import React from 'react'
import { PILLARS } from '@/utils'
import PillarDashboard from './PillarDashboard'

export default function ExerciseDashboard() {
  return <PillarDashboard pillar={PILLARS.exercise} coachAgent="fitness_coach" />
}
