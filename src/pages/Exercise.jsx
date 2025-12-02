import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PillarPage from "@/components/shared/PillarPage";
import ActionCard from "@/components/shared/ActionCard";
import DataCard from "@/components/shared/DataCard";
import PillarAtAGlance from "@/components/shared/PillarAtAGlance";
import RecentActivity from "@/components/shared/RecentActivity";
import LogDetailModal from "@/components/shared/LogDetailModal";
import CircularProgress from "@/components/shared/CircularProgress";
import WeeklySegmentBar from "@/components/shared/WeeklySegmentBar";
import MilestonesSection from "@/components/shared/MilestonesSection";
import PillarTip from "@/components/shared/PillarTip";
import { getTipsForPillar } from "@/utils/pillarTips";
import WorkoutTemplates from "@/components/shared/WorkoutTemplates";
import WorkoutTracker from "@/components/shared/WorkoutTracker";
import ActiveMinutesWidget from "@/components/shared/ActiveMinutesWidget";
import { Dumbbell, Plus, Award, Activity, Target, X, Zap, TrendingUp, Calendar, Flame, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, differenceInDays, differenceInHours, startOfMonth } from "date-fns";
import { PILLARS } from '@/utils';
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const PILLAR = PILLARS.exercise;

export default function Exercise() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTracker, setShowTracker] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailModalType, setDetailModalType] = useState(null);

  useEffect(() => {
    async function getUser() {
      const currentUser = await api.authMe();
      setUser(currentUser);
    }
    getUser();
  }, []);

  const today = format(new Date(), 'yyyy-MM-dd');
  const thisWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const { data: workouts = [] } = useQuery({
    queryKey: ['workouts', user?.email],
    queryFn: () => api.getWorkoutLogs({ userId: user?.email }, '-date', 100),
    enabled: !!user,
    initialData: []
  });

  const { data: personalBests = [] } = useQuery({
    queryKey: ['personalBests', user?.email],
    queryFn: () => api.getPersonalBests({ userId: user?.email }, '-achievedDate', 100),
    enabled: !!user,
    initialData: []
  });

  const { data: activeMinutesData = null } = useQuery({
    queryKey: ['activeMinutes', user?.email, thisWeekStart],
    queryFn: async () => {
      const goals = await api.getActiveMinutesGoals({ 
        userId: user?.email,
        weekStartDate: thisWeekStart
      });
      return goals[0] || null;
    },
    enabled: !!user
  });

  const saveWorkoutMutation = useMutation({
    mutationFn: async (data) => {
      const workout = await api.createWorkoutLog({
        userId: user.email,
        date: today,
        ...data
      });

      if (data.personalBests?.length > 0) {
        for (const pr of data.personalBests) {
          const existing = personalBests.find(pb => pb.exerciseName === pr.exercise);
          const oneRepMax = pr.weight * (1 + pr.reps / 30);

          if (!existing) {
            await api.createPersonalBest({
              userId: user.email,
              exerciseName: pr.exercise,
              weight: pr.weight,
              reps: pr.reps,
              oneRepMax,
              achievedDate: today,
              workoutLogId: workout.id
            });
          } else if (oneRepMax > (existing.oneRepMax || 0)) {
            await api.updatePersonalBest(existing.id, {
              weight: pr.weight,
              reps: pr.reps,
              oneRepMax,
              achievedDate: today,
              workoutLogId: workout.id
            });
          }
        }
      }

      return workout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['personalBests', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['activeMinutes', user?.email, thisWeekStart] });
      setShowTracker(false);
      setSelectedTemplate(null);
    }
  });

  const updateActiveMinutesMutation = useMutation({
    mutationFn: async (minutesToAdd) => {
      if (activeMinutesData) {
        const currentDayMinutes = activeMinutesData.minutesPerDay || {};
        const newDayMinutes = (currentDayMinutes[today] || 0) + minutesToAdd;
        const updatedMinutesPerDay = { ...currentDayMinutes, [today]: newDayMinutes };
        
        const newTotal = Object.values(updatedMinutesPerDay).reduce((sum, m) => sum + m, 0);
        const daysCompleted = Object.values(updatedMinutesPerDay).filter(m => m >= activeMinutesData.dailyGoal).length;

        return api.updateActiveMinutesGoal(activeMinutesData.id, {
          minutesPerDay: updatedMinutesPerDay,
          totalMinutes: newTotal,
          daysCompleted
        });
      } else {
        const minutesPerDay = { [today]: minutesToAdd };
        return api.createActiveMinutesGoal({
          userId: user.email,
          weekStartDate: thisWeekStart,
          dailyGoal: 30,
          weeklyGoal: 210,
          minutesPerDay,
          totalMinutes: minutesToAdd,
          daysCompleted: minutesToAdd >= 30 ? 1 : 0
        });
      }
    },
    onSuccess: (data, minutesToAdd) => {
      queryClient.invalidateQueries({ queryKey: ['activeMinutes', user?.email, thisWeekStart] });
      const newTotal = (activeMinutesData?.minutesPerDay?.[today] || 0) + minutesToAdd;
      
      if (newTotal >= (activeMinutesData?.dailyGoal || 30) && 
          (activeMinutesData?.minutesPerDay?.[today] || 0) < (activeMinutesData?.dailyGoal || 30)) {
        toast.success('🎯 Daily goal reached!', { description: `${newTotal} minutes today` });
      } else {
        toast.success(`+${minutesToAdd} minutes logged`);
      }
    }
  });

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setShowTemplates(false);
    setShowTracker(true);
  };

  const handleSaveWorkout = async (workoutData) => {
    await saveWorkoutMutation.mutateAsync(workoutData);
    
    if (workoutData.duration > 0) {
      await updateActiveMinutesMutation.mutateAsync(workoutData.duration);
    }
  };

  if (!user) return null;

  const thisWeekWorkouts = workouts.filter(w => {
    const workoutDate = new Date(w.date);
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return workoutDate >= weekStart;
  }).length;

  const recentWorkouts = workouts.slice(0, 7);
  const totalSets = recentWorkouts.reduce((sum, w) => 
    sum + (w.exercises?.reduce((s, e) => s + (e.sets?.length || 0), 0) || 0), 0
  );

  const latestWorkout = workouts.length > 0 ? workouts[0] : null;
  const hoursAgoWorkout = latestWorkout 
    ? Math.round(differenceInHours(new Date(), new Date(latestWorkout.updated_date || latestWorkout.created_date)))
    : null;

  const workoutStreak = (() => {
    let streak = 0;
    let checkDate = new Date();
    
    for (let i = 0; i < 365; i++) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const hasWorkout = workouts.some(w => w.date === dateStr);
      
      if (hasWorkout) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        const yesterday = format(new Date(checkDate.getTime() - 86400000), 'yyyy-MM-dd');
        const hasYesterday = workouts.some(w => w.date === yesterday);
        if (!hasYesterday) break;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }
    
    return streak;
  })();

  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const thisMonthWorkouts = workouts.filter(w => w.date >= monthStart);
  const newPRsThisMonth = personalBests.filter(pb => pb.achievedDate >= monthStart).length;

  const milestones = [
    workoutStreak >= 7 && {
      id: 'workout-streak',
      type: 'streak',
      icon: Flame,
      title: `${workoutStreak} Day Workout Streak`,
      description: 'Consistent training',
      value: `${workoutStreak}🔥`,
      color: "#FF5733",
      isNew: workoutStreak <= 14
    },
    newPRsThisMonth >= 3 && {
      id: 'pr-month',
      type: 'achievement',
      icon: Award,
      title: 'Personal Records',
      description: `${newPRsThisMonth} new PRs this month`,
      value: `${newPRsThisMonth}🏆`,
      color: "#FFD700",
      date: format(new Date(), 'MMM yyyy'),
      isNew: true
    },
    thisMonthWorkouts.length >= 12 && {
      id: 'consistent-month',
      type: 'award',
      icon: CheckCircle2,
      title: 'Training Consistency',
      description: `${thisMonthWorkouts.length} workouts this month`,
      value: `${thisMonthWorkouts.length}💪`,
      color: PILLAR.color,
      date: format(new Date(), 'MMM yyyy'),
      isNew: true
    }
  ].filter(Boolean);

  // 7-day workout volume chart
  const weeklyVolumeData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayWorkouts = workouts.filter(w => w.date === dateStr);
    const totalSets = dayWorkouts.reduce((sum, w) => 
      sum + (w.exercises?.reduce((s, e) => s + (e.sets?.length || 0), 0) || 0), 0
    );
    
    return {
      date: format(date, 'EEE'),
      sets: totalSets,
      workouts: dayWorkouts.length
    };
  });

  const atAGlanceMetrics = [
    {
      icon: <Dumbbell />,
      label: "Workouts This Week",
      value: thisWeekWorkouts,
      subtitle: `${totalSets} sets (7d)`,
      trend: thisWeekWorkouts >= 3 ? "up" : thisWeekWorkouts >= 2 ? "stable" : "down",
      lastUpdated: hoursAgoWorkout ? `${hoursAgoWorkout}h ago` : "No workouts"
    },
    {
      icon: <Award />,
      label: "Personal Bests",
      value: personalBests.length,
      subtitle: "exercises tracked",
      trend: newPRsThisMonth > 0 ? "up" : "stable",
      message: newPRsThisMonth > 0 ? `🏆 ${newPRsThisMonth} new PR${newPRsThisMonth > 1 ? 's' : ''} this month!` : null
    },
    {
      icon: <Activity />,
      label: "Active Minutes",
      value: activeMinutesData?.totalMinutes || 0,
      subtitle: `of ${activeMinutesData?.weeklyGoal || 210} weekly`,
      progress: activeMinutesData?.totalMinutes && activeMinutesData?.weeklyGoal 
        ? (activeMinutesData.totalMinutes / activeMinutesData.weeklyGoal) * 100
        : 0,
      trend: (activeMinutesData?.totalMinutes || 0) >= (activeMinutesData?.weeklyGoal || 210) * 0.7 ? "up" : "stable"
    }
  ];

  const recentActivityData = [
    ...workouts.slice(0, 4).map(w => ({
      id: w.id,
      type: 'workout',
      icon: Dumbbell,
      title: w.templateName,
      summary: `${w.duration} min • ${w.intensity} intensity${w.personalBests?.length > 0 ? ` • ${w.personalBests.length} PR!` : ''}`,
      timestamp: w.date,
      color: w.intensity === 'intense' ? "#FF5733" : w.intensity === 'moderate' ? "#FFD700" : "#52B788",
      badges: [
        { text: `${w.duration} min`, color: PILLAR.color },
        { text: w.intensity, color: w.intensity === 'intense' ? "#FF5733" : "#FFD700" },
        ...(w.personalBests?.length > 0 ? [{ text: `${w.personalBests.length} PR`, color: "#D4AF37" }] : [])
      ],
      data: w
    })),
    ...personalBests.slice(0, 1).filter(pb => {
      const daysDiff = differenceInDays(new Date(), new Date(pb.achievedDate));
      return daysDiff <= 7;
    }).map(pb => ({
      id: pb.id,
      type: 'pr',
      icon: Award,
      title: `New PR: ${pb.exerciseName}`,
      summary: `${pb.weight}kg × ${pb.reps} reps`,
      timestamp: pb.achievedDate,
      color: "#D4AF37",
      badges: [
        { text: `${pb.weight}kg`, color: "#FFD700" },
        { text: `${pb.reps} reps`, color: "#4CC9F0" },
        { text: '🏆 NEW', color: "#D4AF37" }
      ],
      data: pb
    }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);

  const handleActivityClick = (activity) => {
    setSelectedLog(activity.data);
    setDetailModalType(activity.type);
  };

  const stats = [
    {
      icon: <Dumbbell className="w-4 h-4" />,
      label: "This Week",
      value: thisWeekWorkouts,
      subtitle: "workouts",
      color: PILLAR.color
    },
    {
      icon: <Activity className="w-4 h-4" />,
      label: "Active Min",
      value: activeMinutesData?.totalMinutes || 0,
      subtitle: "this week",
      color: "#FF9500"
    },
    {
      icon: <Target className="w-4 h-4" />,
      label: "Total Sets",
      value: totalSets,
      subtitle: "last 7 days",
      color: "#7C3AED"
    },
    {
      icon: <Award className="w-4 h-4" />,
      label: "PRs",
      value: personalBests.length,
      subtitle: "tracked",
      color: "#D4AF37"
    }
  ];

  return (
    <PillarPage pillar={PILLAR} title="Exercise & Fitness" subtitle="Track workouts, log PRs, stay active" stats={stats}>
      <PillarAtAGlance metrics={atAGlanceMetrics} color={PILLAR.color} />

      <MilestonesSection milestones={milestones} color={PILLAR.color} title="Fitness Achievements" compact={true} />

      <PillarTip tips={getTipsForPillar('exercise')} color={PILLAR.color} icon={Dumbbell} title="Fitness Tip" />

      {/* Weekly Active Minutes Bar */}
      <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6"
        style={{ boxShadow: `0 0 30px ${PILLAR.color}20` }}
      >
        <WeeklySegmentBar
          dailyData={activeMinutesData?.minutesPerDay || {}}
          dailyGoal={activeMinutesData?.dailyGoal || 30}
          weeklyGoal={activeMinutesData?.weeklyGoal || 210}
          color={PILLAR.color}
          label="Active Minutes This Week"
          unit="min"
          emptyLabel="Rest day"
        />
      </div>

      {/* Weekly Workout Volume Chart */}
      {weeklyVolumeData.some(d => d.sets > 0) && (
        <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6"
          style={{ boxShadow: `0 0 30px ${PILLAR.color}20` }}
        >
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: PILLAR.color }} />
            Weekly Training Volume
          </h3>
          
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyVolumeData}>
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.3)"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.3)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1f35',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white'
                }}
                formatter={(value, name) => {
                  if (name === 'sets') return [`${value} sets`, 'Volume'];
                  return [value, name];
                }}
              />
              <Bar 
                dataKey="sets" 
                fill={PILLAR.color}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <RecentActivity
        activities={recentActivityData}
        color={PILLAR.color}
        onItemClick={handleActivityClick}
        emptyMessage="No workouts logged yet"
        emptyIcon={Dumbbell}
        emptyAction={
          <Button
            onClick={() => setShowTemplates(true)}
            className="bg-gradient-to-r from-[#FF5733] to-[#FF8C66] text-white font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start First Workout
          </Button>
        }
      />

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <ActionCard
          icon={Dumbbell}
          title="Start Workout"
          description="Choose from templates"
          stats={`${workouts.length} total workouts`}
          color={PILLAR.color}
          onClick={() => setShowTemplates(true)}
        />
        <ActionCard
          icon={Award}
          title="Personal Bests"
          description="Track your PRs"
          stats={`${personalBests.length} exercises tracked`}
          color="#D4AF37"
          onClick={() => {}}
        />
      </div>

      {/* Personal Bests Highlights */}
      {personalBests.length > 0 && (
        <DataCard title="Recent Personal Bests" titleIcon={<Award />} color="#D4AF37">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {personalBests.slice(0, 3).map(pr => (
              <div key={pr.id} className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-[#D4AF37]" />
                  <h4 className="text-white font-bold text-sm">{pr.exerciseName}</h4>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#D4AF37]">{pr.weight}kg</div>
                  <div className="text-white/70 text-sm">× {pr.reps} reps</div>
                  <div className="text-white/40 text-xs mt-1">
                    {format(new Date(pr.achievedDate), 'MMM d')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DataCard>
      )}

      {showTemplates && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#1a1f35] border-b border-white/10 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Choose Workout</h2>
              <button onClick={() => setShowTemplates(false)} className="text-white/60 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <WorkoutTemplates onSelectTemplate={handleSelectTemplate} userLevel={user?.bio?.activityLevel || "beginner"} />
            </div>
          </div>
        </div>
      )}

      {showTracker && selectedTemplate && (
        <WorkoutTracker template={selectedTemplate} personalBests={personalBests} onClose={() => { setShowTracker(false); setSelectedTemplate(null); }} onSave={handleSaveWorkout} />
      )}

      {selectedLog && detailModalType === 'workout' && (
        <LogDetailModal log={selectedLog} onClose={() => { setSelectedLog(null); setDetailModalType(null); }} color={PILLAR.color} icon={Dumbbell} title={selectedLog.templateName} fields={[
          { key: 'duration', label: 'Duration', icon: Activity, color: "#FF9500", unit: ' min' },
          { key: 'intensity', label: 'Intensity', icon: Zap, color: "#FF5733", render: (value) => <span className="text-lg capitalize text-white/90">{value}</span> },
          { key: 'caloriesBurned', label: 'Calories Burned', icon: Flame, color: "#FFD700" },
          { key: 'exercises', label: 'Exercises', icon: Target, color: "#4CC9F0", render: (exercises) => exercises && exercises.length > 0 ? (
            <div className="space-y-2">
              {exercises.map((ex, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-2 text-sm">
                  <span className="text-white/90">{ex.name}</span>
                  <span className="text-white/60 ml-2">{ex.sets?.length || 0} sets</span>
                </div>
              ))}
            </div>
          ) : null }
        ]} />
      )}

      {selectedLog && detailModalType === 'pr' && (
        <LogDetailModal log={selectedLog} onClose={() => { setSelectedLog(null); setDetailModalType(null); }} color="#D4AF37" icon={Award} title="Personal Best" fields={[
          { key: 'exerciseName', label: 'Exercise', icon: Dumbbell, color: PILLAR.color },
          { key: 'weight', label: 'Weight', icon: Award, color: "#FFD700", unit: 'kg' },
          { key: 'reps', label: 'Reps', icon: Target, color: "#4CC9F0" },
          { key: 'oneRepMax', label: 'Estimated 1RM', icon: Zap, color: "#FF5733", render: (value) => value ? `${Math.round(value)}kg` : null }
        ]} />
      )}
    </PillarPage>
  );
}