import React from 'react'
import { PILLARS } from '@/utils'
import PillarDashboard from './PillarDashboard'

export default function SocialDashboard() {
  return <PillarDashboard pillar={PILLARS.social} coachAgent="relationship_coach" />
}
