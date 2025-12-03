import React from 'react'
import { PILLARS } from '@/utils'
import PillarDashboard from './PillarDashboard'

export default function DietDashboard() {
  return <PillarDashboard pillar={PILLARS.diet} coachAgent="nutrition_coach" />
}
