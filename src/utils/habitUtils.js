// Habit utility functions

export const getHabitStreak = (habit) => {
  return habit?.streakCount || 0;
};

export const isHabitDueToday = (habit) => {
  if (!habit?.frequency) return true;
  
  const today = new Date().getDay();
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = daysOfWeek[today];
  
  if (typeof habit.frequency === 'string') {
    return habit.frequency === 'daily' || habit.frequency === todayName;
  }
  
  if (Array.isArray(habit.frequency)) {
    return habit.frequency.includes(todayName);
  }
  
  return true;
};

export const formatHabitTime = (time) => {
  if (!time) return '';
  
  // If it's a Date object, format it
  if (time instanceof Date) {
    return time.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  // If it's a string time like "14:30"
  if (typeof time === 'string') {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const isAM = hour < 12;
    const display12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${display12}:${minutes} ${isAM ? 'AM' : 'PM'}`;
  }
  
  return '';
};
