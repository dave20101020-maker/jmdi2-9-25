import React from 'react';
import { createPageUrl } from '@/utils';
import { 
  getHabitStreak, 
  isHabitDueToday, 
  formatHabitTime 
} from '@/utils/habitUtils';

export default function Habits() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">My Habits</h1>
      <p>Loading habits...</p>
    </div>
  );
}