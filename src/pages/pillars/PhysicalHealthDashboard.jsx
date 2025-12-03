import React from 'react'
import { PILLARS } from '@/utils'
import PillarDashboard from './PillarDashboard'

export default function PhysicalHealthDashboard() {
  return <PillarDashboard pillar={PILLARS.physical_health} coachAgent="physical_health_coach" />
}
