const STORAGE_KEY = 'northstar.dashboard.modules.v1';

const defaultModules = [
  { id: 'sleep', component: 'SleepSummaryCard', enabled: true, showOn: 'dashboard' },
  { id: 'habits', component: 'HabitChecklist', enabled: true, showOn: 'dashboard' },
  { id: 'pillars', component: 'PillarProgressGrid', enabled: true, showOn: 'dashboard' },
  { id: 'readiness', component: 'DailyReadinessCard', enabled: false, showOn: 'dashboard' },
  { id: 'trends', component: 'WeeklyTrendsCard', enabled: true, showOn: 'dashboard' },
  { id: 'actions', component: 'QuickActions', enabled: true, showOn: 'dashboard' },
];

export function useDashboardModules() {
  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultModules;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return defaultModules;
      return parsed;
    } catch (e) {
      return defaultModules;
    }
  };

  const save = (modules) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
  };

  return { defaultModules, load, save, STORAGE_KEY };
}
