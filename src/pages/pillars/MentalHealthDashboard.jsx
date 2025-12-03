import React from 'react'
import { PILLARS } from '@/utils'
import PillarDashboard from './PillarDashboard'

export default function MentalHealthDashboard() {
  return <PillarDashboard pillar={PILLARS.mental_health} coachAgent="mental_health_coach" />
}
