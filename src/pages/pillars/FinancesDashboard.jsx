import React from 'react'
import { PILLARS } from '@/utils'
import PillarDashboard from './PillarDashboard'

export default function FinancesDashboard() {
  return <PillarDashboard pillar={PILLARS.finances} coachAgent="financial_coach" />
}
