import React from 'react'
import { PILLARS } from '@/utils'
import PillarDashboard from './PillarDashboard'

export default function SleepDashboard() {
  return <PillarDashboard pillar={PILLARS.sleep} coachAgent="sleep_coach" />
}
