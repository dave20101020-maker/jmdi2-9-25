import React from 'react'
import { PILLARS } from '@/utils'
import PillarDashboard from './PillarDashboard'

export default function SpiritualityDashboard() {
  return <PillarDashboard pillar={PILLARS.spirituality} coachAgent="spirituality_coach" />
}
