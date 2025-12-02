
import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { format, differenceInHours, subDays, startOfWeek, addDays } from "date-fns";
import { toast } from "sonner";

import PillarPage from "@/components/shared/PillarPage";
import ActionCard from "@/components/shared/ActionCard";
import DataCard from "@/components/shared/DataCard";
import PillarAtAGlance from "@/components/shared/PillarAtAGlance";
import RecentActivity from "@/components/shared/RecentActivity";
import LogDetailModal from "@/components/shared/LogDetailModal";
import PillarTip from "@/components/shared/PillarTip";
import { getTipsForPillar } from "@/utils/pillarTips";
import SymptomLogger from "@/components/shared/SymptomLogger";
import MedicationTracker from "@/components/shared/MedicationTracker";
import HealthCheckIn from "@/components/shared/HealthCheckIn";

import { PILLARS } from '@/utils';
import { Activity, Stethoscope, Pill, CheckCircle2, TrendingUp, AlertCircle, Heart, Zap, Plus, Edit2, Trash2, Clock, Target, Calendar as CalendarIcon, X } from "lucide-react";

const PILLAR = PILLARS.physical_health;

export default function PhysicalHealth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState("overview");
  const [showSymptomLogger, setShowSymptomLogger] = useState(false);
  const [showMedicationTracker, setShowMedicationTracker] = useState(false);
  const [showHealthCheckIn, setShowHealthCheckIn] = useState(false);
  const [editingMedication, setEditingMedication] = useState(null);
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

  const { data: symptoms = [] } = useQuery({
    queryKey: ['symptoms', user?.email],
    queryFn: () => api.getSymptoms({ userId: user?.email }, '-timestamp', 100),
    enabled: !!user,
    initialData: []
  });

  const { data: medications = [] } = useQuery({
    queryKey: ['medications', user?.email],
    queryFn: () => api.getMedications({ userId: user?.email }, '-created_date', 100),
    enabled: !!user,
    initialData: []
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['healthCheckIns', user?.email],
    queryFn: () => api.getHealthCheckIns({ userId: user?.email }, '-date', 100),
    enabled: !!user,
    initialData: []
  });

  const saveSymptomMutation = useMutation({
    mutationFn: (data) => api.logSymptom({
      userId: user.email,
      date: today,
      timestamp: new Date().toISOString(),
      ...data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['symptoms', user?.email] });
      setShowSymptomLogger(false);
    }
  });

  const saveMedicationMutation = useMutation({
    mutationFn: (data) => {
      if (editingMedication) {
        return api.updateMedication(editingMedication.id, data);
      }
      return api.createMedication({
        userId: user.email,
        takenDates: [],
        ...data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications', user?.email] });
      setShowMedicationTracker(false);
      setEditingMedication(null);
    }
  });

  const updateMedicationMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateMedication(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications', user?.email] });
    }
  });

  const deleteMedicationMutation = useMutation({
    mutationFn: (id) => api.deleteMedication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications', user?.email] });
      toast.success('Medication deleted');
    }
  });

  const saveCheckInMutation = useMutation({
    mutationFn: (data) => api.logHealthCheckIn({
      userId: user.email,
      date: today,
      ...data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthCheckIns', user?.email] });
      setShowHealthCheckIn(false);
    }
  });

  const handleMarkMedicationTaken = (medication, time) => {
    const takenDates = medication.takenDates || [];
    const todayEntry = { date: today, time, taken: true };
    
    const existingIdx = takenDates.findIndex(t => t.date === today && t.time === time);
    let newTakenDates;
    
    if (existingIdx >= 0) {
      newTakenDates = takenDates.map((t, idx) => 
        idx === existingIdx ? { ...t, taken: !t.taken } : t
      );
    } else {
      newTakenDates = [...takenDates, todayEntry];
    }

    updateMedicationMutation.mutate({
      id: medication.id,
      data: { takenDates: newTakenDates }
    });

    toast.success(`${medication.name} marked as taken 💊`);
  };

  if (!user) return null;

  const activeMedications = medications.filter(m => m.isActive);
  const todaySymptoms = symptoms.filter(s => s.date === today);
  const todayCheckIn = checkIns.find(c => c.date === today);
  
  const recentSymptoms = symptoms.slice(0, 7);
  const avgSeverity = recentSymptoms.length > 0
    ? Math.round(recentSymptoms.reduce((sum, s) => sum + s.severity, 0) / recentSymptoms.length * 10) / 10
    : 0;

  const recentCheckIns = checkIns.slice(0, 7);
  const avgEnergy = recentCheckIns.length > 0
    ? Math.round(recentCheckIns.reduce((sum, c) => sum + (c.energyLevel || 0), 0) / recentCheckIns.length * 10) / 10
    : 0;

  // Calculate "At a Glance" metrics
  const latestCheckIn = checkIns.length > 0 ? checkIns[0] : null;
  const hoursAgoCheckIn = latestCheckIn 
    ? Math.round(differenceInHours(new Date(), new Date(latestCheckIn.updated_date || latestCheckIn.created_date)))
    : null;

  const energyTrend = checkIns.length >= 2 
    ? (checkIns[0].energyLevel || 0) > (checkIns[1].energyLevel || 0) ? "up" : 
      (checkIns[0].energyLevel || 0) < (checkIns[1].energyLevel || 0) ? "down" : "stable"
    : "stable";

  const medicationAdherence = activeMedications.length > 0
    ? Math.round(
        activeMedications.reduce((sum, m) => {
          const todayLog = m.takenDates?.find(t => t.date === today); 
          return sum + (todayLog?.taken ? 100 : 0);
        }, 0) / activeMedications.length
      )
    : 0;

  // NEW: Current symptoms (last 24 hours)
  const currentSymptoms = symptoms.filter(s => {
    const hoursDiff = differenceInHours(new Date(), new Date(s.timestamp));
    return hoursDiff <= 24;
  }).sort((a, b) => b.severity - a.severity);

  // NEW: Medication calendar data (last 7 days)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const medicationCalendarData = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const takenCount = activeMedications.reduce((count, med) => {
      const dayLog = med.takenDates?.find(t => t.date === dateStr);
      return count + (dayLog?.taken ? 1 : 0);
    }, 0);
    
    return {
      date: dateStr,
      day: format(date, 'EEE')[0],
      takenCount,
      totalCount: activeMedications.length,
      isToday: dateStr === today,
      percentage: activeMedications.length > 0 ? (takenCount / activeMedications.length) * 100 : 0
    };
  });

  const atAGlanceMetrics = [
    {
      icon: <Zap />,
      label: "Energy Level (7d avg)",
      value: avgEnergy > 0 ? `${avgEnergy}/10` : "—",
      subtitle: "feeling",
      trend: energyTrend,
      progress: avgEnergy * 10,
      lastUpdated: hoursAgoCheckIn ? `${hoursAgoCheckIn}h ago` : "No check-ins"
    },
    {
      icon: <Pill />,
      label: "Medication Adherence",
      value: `${medicationAdherence}%`,
      subtitle: `${activeMedications.length} active`,
      progress: medicationAdherence,
      trend: medicationAdherence >= 80 ? "up" : medicationAdherence >= 50 ? "stable" : "down"
    },
    {
      icon: <AlertCircle />,
      label: "Recent Symptoms",
      value: recentSymptoms.length,
      subtitle: `avg severity ${avgSeverity}/10`,
      trend: avgSeverity <= 3 ? "up" : avgSeverity <= 6 ? "stable" : "down",
      message: recentSymptoms.length === 0 
        ? "✨ No symptoms logged recently - feeling great!"
        : avgSeverity > 7
        ? "⚠️ High symptom severity - consider checking in with healthcare provider"
        : null
    }
  ];

  // NEW: Recent Activity Data
  const recentActivityData = [
    ...symptoms.slice(0, 2).map(s => ({
      id: s.id,
      type: 'symptom',
      icon: AlertCircle,
      title: s.symptomType,
      summary: `Severity: ${s.severity}/10 • ${s.duration} duration${s.bodyPart ? ` • ${s.bodyPart}` : ''}`,
      timestamp: s.timestamp,
      color: s.severity >= 7 ? "#FF5733" : s.severity >= 4 ? "#FFD700" : "#52B788",
      badges: [
        { text: `Severity ${s.severity}/10`, color: s.severity >= 7 ? "#FF5733" : "#FFD700" },
        ...(s.bodyPart ? [{ text: s.bodyPart, color: "#4CC9F0" }] : [])
      ],
      data: s
    })),
    ...checkIns.slice(0, 2).map(c => ({
      id: c.id,
      type: 'checkIn',
      icon: Activity,
      title: "Health Check-In",
      summary: `Energy: ${c.energyLevel}/10 • Pain: ${c.painLevel || 0}/10 • ${c.digestion ? c.digestion + ' digestion' : 'Digestion not specified'}`,
      timestamp: c.date,
      color: "#52B788",
      badges: [
        { text: `Energy ${c.energyLevel}/10`, color: "#52B788" },
        ...(c.painLevel > 0 ? [{ text: `Pain ${c.painLevel}/10`, color: "#FF5733" }] : [])
      ],
      data: c
    })),
    // Changed to allow up to 1 active medication in recent activity (from original request)
    ...medications.slice(0, 1).filter(m => m.isActive).map(m => ({
      id: m.id,
      type: 'medication',
      icon: Pill,
      title: m.name,
      summary: `${m.dosage} • ${m.frequency.replace('_', ' ')}${m.withFood ? ' • With food' : ''}`,
      timestamp: m.created_date,
      color: "#4CC9F0",
      badges: [
        { text: m.type, color: "#4CC9F0" },
        { text: m.frequency.replace('_', ' '), color: "#7C3AED" }
      ],
      data: m
    }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5); // Display top 5 recent activities

  const handleActivityClick = (activity) => {
    setSelectedLog(activity.data);
    setDetailModalType(activity.type);
  };

  const stats = [
    {
      icon: <Activity className="w-4 h-4" />,
      label: "Symptoms",
      value: symptoms.length,
      subtitle: "logged",
      color: "#FF5733"
    },
    {
      icon: <Pill className="w-4 h-4" />,
      label: "Medications",
      value: activeMedications.length,
      subtitle: "active",
      color: "#4CC9F0"
    },
    {
      icon: <CheckCircle2 className="w-4 h-4" />,
      label: "Check-ins",
      value: checkIns.length,
      subtitle: "completed",
      color: "#52B788"
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      label: "Avg Energy",
      value: avgEnergy,
      subtitle: "/10",
      color: "#FFD700"
    }
  ];

  const todayMedsDue = activeMedications.reduce((count, med) => {
    if (med.frequency === "as_needed") return count;
    return count + (med.times?.length || 0);
  }, 0);

  const todayMedsTaken = activeMedications.reduce((count, med) => {
    const takenToday = (med.takenDates || []).filter(t => 
      t.date === today && t.taken
    ).length;
    return count + takenToday;
  }, 0);


  return (
    <PillarPage pillar={PILLAR} title="Physical Health" subtitle="Symptoms, medications, and wellness" stats={stats}>
      {/* At a Glance Section */}
      <PillarAtAGlance metrics={atAGlanceMetrics} color={PILLAR.color} />

      {/* NEW: Pro Tip Section */}
      <PillarTip
        tips={getTipsForPillar('physical_health')}
        color={PILLAR.color}
        icon={Heart}
        title="Health Tip"
      />

      {/* NEW: Last Health Check-In Summary */}
      {latestCheckIn && (
        <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 mb-6"
          style={{ boxShadow: `0 0 30px #52B78820` }}
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#52B78820', border: '1px solid #52B78840' }}
            >
              <Stethoscope className="w-6 h-6 text-[#52B788]" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-white font-bold">Last Health Check-In</h3>
                <span className="text-white/40 text-xs">
                  {format(new Date(latestCheckIn.date), 'MMM d, yyyy')}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="text-white/60 text-xs mb-1">Energy</div>
                  <div className="text-2xl font-bold" style={{ 
                    color: latestCheckIn.energyLevel >= 7 ? "#52B788" : latestCheckIn.energyLevel >= 4 ? "#FFD700" : "#FF5733"
                  }}>
                    {latestCheckIn.energyLevel}/10
                  </div>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="text-white/60 text-xs mb-1">Pain</div>
                  <div className="text-2xl font-bold" style={{ 
                    color: latestCheckIn.painLevel >= 7 ? "#FF5733" : latestCheckIn.painLevel >= 4 ? "#FFD700" : "#52B788"
                  }}>
                    {latestCheckIn.painLevel || 0}/10
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Current Symptoms Panel (Last 24h) */}
      {currentSymptoms.length > 0 && (
        <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 mb-6"
          style={{ boxShadow: `0 0 30px #FF573320` }}
        >
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#FF5733]" />
            Current Symptoms (24h)
          </h3>
          
          <div className="space-y-2">
            {currentSymptoms.slice(0, 5).map(symptom => {
              const severityColor = symptom.severity >= 7 ? "#FF5733" : symptom.severity >= 4 ? "#FFD700" : "#52B788";
              const hoursAgo = Math.round(differenceInHours(new Date(), new Date(symptom.timestamp)));
              
              return (
                <div 
                  key={symptom.id}
                  className="bg-white/5 border rounded-xl p-3 flex items-center gap-3"
                  style={{ borderColor: `${severityColor}40` }}
                >
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-lg"
                    style={{ 
                      backgroundColor: `${severityColor}20`,
                      border: `2px solid ${severityColor}`,
                      color: severityColor
                    }}
                  >
                    {symptom.severity}
                  </div>
                  
                  <div className="flex-1">
                    <div className="text-white font-semibold capitalize">{symptom.symptomType}</div>
                    <div className="text-white/60 text-xs flex items-center gap-2">
                      {symptom.bodyPart && <span>• {symptom.bodyPart}</span>}
                      <span>• {symptom.duration}</span>
                      <span>• {hoursAgo}h ago</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NEW: Medication Adherence Mini Calendar */}
      {activeMedications.length > 0 && (
        <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 mb-6"
          style={{ boxShadow: `0 0 30px #4CC9F020` }}
        >
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Pill className="w-5 h-5 text-[#4CC9F0]" />
            Medication Adherence This Week
          </h3>
          
          <div className="grid grid-cols-7 gap-2">
            {medicationCalendarData.map((day) => {
              const adherenceColor = day.percentage === 100 ? "#52B788" : day.percentage >= 50 ? "#FFD700" : day.percentage > 0 ? "#FF5733" : "#1a1f35";
              
              return (
                <div key={day.date} className="text-center">
                  <div className="text-white/60 text-xs mb-1 font-medium">{day.day}</div>
                  <div 
                    className="w-full h-12 rounded-lg flex flex-col items-center justify-center text-xs font-bold transition-all hover:scale-105"
                    style={{ 
                      backgroundColor: day.totalCount === 0 ? 'rgba(255,255,255,0.05)' : `${adherenceColor}30`,
                      border: day.isToday ? `2px solid ${PILLAR.color}` : `1px solid ${adherenceColor}40`
                    }}
                  >
                    {day.totalCount > 0 ? (
                      <>
                        <div style={{ color: adherenceColor }}>
                          {day.takenCount}/{day.totalCount}
                        </div>
                        {day.takenCount === day.totalCount && <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5" />}
                        {day.takenCount > 0 && day.takenCount < day.totalCount && <Clock className="w-3 h-3 text-yellow-400 mt-0.5" />}
                        {day.takenCount === 0 && <X className="w-3 h-3 text-red-400 mt-0.5" />}
                      </>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </div>
                  <div className="text-white/40 text-xs mt-1">{format(new Date(day.date), 'd')}</div>
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center justify-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#52B78860' }} />
              <span className="text-white/60">All taken</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#FFD70060' }} />
              <span className="text-white/60">Partial</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#FF573360' }} />
              <span className="text-white/60">Missed</span>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Recent Activity Section */}
      <RecentActivity
        activities={recentActivityData}
        color={PILLAR.color}
        onItemClick={handleActivityClick}
        emptyMessage="No health activity logged yet"
        emptyIcon={Activity}
        emptyAction={
          <Button
            onClick={() => setShowHealthCheckIn(true)}
            className="bg-gradient-to-r from-[#FF7F50] to-[#FF6347] text-white font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            First Health Check-In
          </Button>
        }
      />

      {/* View Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {[
          { id: "overview", label: "Overview" },
          { id: "symptoms", label: "Symptoms" },
          { id: "medications", label: "Meds" },
          { id: "check-ins", label: "Check-Ins" }
        ].map(view => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={`py-2.5 px-2 rounded-xl font-bold transition-all text-sm ${
              activeView === view.id
                ? 'text-white'
                : 'bg-[#1a1f35] border border-white/20 text-white hover:bg-white/5'
            }`}
            style={activeView === view.id ? {
              background: `linear-gradient(to right, ${PILLAR.color}, ${PILLAR.color}CC)`,
              boxShadow: `0 0 20px ${PILLAR.color}40`
            } : {}}
          >
            {view.label}
          </button>
        ))}
      </div>

      {activeView === "overview" && (
        <div className="space-y-4 md:space-y-6">
          {!todayCheckIn && (
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/40 rounded-2xl p-4 md:p-6 backdrop-blur-sm"
              style={{ boxShadow: '0 0 30px rgba(82, 183, 136, 0.2)' }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-white font-bold text-base md:text-lg mb-1">Daily Health Check-In</h3>
                  <p className="text-white/70 text-sm">Haven't checked in today - how are you feeling?</p>
                </div>
                <Button
                  onClick={() => setShowHealthCheckIn(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold whitespace-nowrap w-full sm:w-auto"
                >
                  Check In
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <ActionCard
              icon={AlertCircle}
              title="Log Symptom"
              description="Track and identify patterns"
              stats={`${symptoms.length} total logged`}
              color="#FF8C66"
              onClick={() => setShowSymptomLogger(true)}
            />
            <ActionCard
              icon={Pill}
              title="Add Medication"
              description="Track meds & supplements"
              stats={`${activeMedications.length} active`}
              color="#4CC9F0"
              onClick={() => {
                setEditingMedication(null);
                setShowMedicationTracker(true);
              }}
            />
            <ActionCard
              icon={CheckCircle2}
              title="Health Check-In"
              description="Daily wellness tracking"
              stats={`${checkIns.length} check-ins`}
              color="#52B788"
              onClick={() => setShowHealthCheckIn(true)}
            />
          </div>

          {activeMedications.length > 0 && (
            <DataCard
              title="Today's Medications"
              titleIcon={<Pill />}
              color="#4CC9F0"
            >
              <div className="text-white/60 text-sm mb-4">
                {todayMedsTaken}/{todayMedsDue} taken
              </div>
              <div className="space-y-3">
                {activeMedications.filter(m => m.frequency !== "as_needed").map(med => {
                  const typeEmoji = med.type === 'medication' ? '💊' :
                                  med.type === 'supplement' ? '🧪' : '🌟';
                  
                  return (
                    <div key={med.id} className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl md:text-2xl">{typeEmoji}</span>
                          <div>
                            <div className="text-white font-bold text-sm md:text-base">{med.name}</div>
                            <div className="text-white/60 text-xs">{med.dosage}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {med.times?.map((time, idx) => {
                          const isTaken = (med.takenDates || []).some(t => 
                            t.date === today && t.time === time && t.taken
                          );
                          
                          return (
                            <button
                              key={idx}
                              onClick={() => handleMarkMedicationTaken(med, time)}
                              className={`px-3 py-2 rounded-lg border transition-all flex items-center gap-2 text-sm ${
                                isTaken
                                  ? 'bg-green-500/20 border-green-500/40 text-green-400'
                                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                              }`}
                            >
                              {isTaken && <CheckCircle2 className="w-4 h-4" />}
                              <span>{time}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </DataCard>
          )}

          {todaySymptoms.length > 0 && (
            <DataCard
              title="Today's Symptoms"
              titleIcon={<AlertCircle />}
              color="#FF8C66"
            >
              <div className="space-y-3">
                {todaySymptoms.map(symptom => {
                  const severityColor = symptom.severity <= 3 ? '#52B788' :
                                      symptom.severity <= 6 ? '#FFD700' : '#FF5733';
                  
                  return (
                    <div key={symptom.id} className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="text-white font-bold capitalize text-sm md:text-base">{symptom.symptomType}</div>
                          <div className="text-white/60 text-xs">
                            {format(new Date(symptom.timestamp), 'h:mm a')}
                            {symptom.bodyPart && ` • ${symptom.bodyPart}`}
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="font-bold text-lg md:text-xl" style={{ color: severityColor }}>
                            {symptom.severity}/10
                          </div>
                          <div className="text-white/60 text-xs">{symptom.duration}</div>
                        </div>
                      </div>
                      {symptom.triggers?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {symptom.triggers.map(trigger => (
                            <span key={trigger} className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                              {trigger}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </DataCard>
          )}
        </div>
      )}

      {activeView === "symptoms" && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-lg md:text-xl font-bold text-white">Symptom History</h2>
            <Button
              onClick={() => setShowSymptomLogger(true)}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold w-full sm:w-auto"
            >
              <Plus className="w-4 md:w-5 h-4 md:h-5 mr-2" />
              Log Symptom
            </Button>
          </div>

          {symptoms.length === 0 ? (
            <div className="text-center py-12 md:py-16 bg-white/5 border border-white/10 rounded-2xl px-4">
              <AlertCircle className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 text-orange-400" />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">No Symptoms Logged</h3>
              <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
                Track symptoms to identify patterns and triggers over time
              </p>
              <Button
                onClick={() => setShowSymptomLogger(true)}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold"
              >
                Log First Symptom
              </Button>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {symptoms.map(symptom => {
                const severityColor = symptom.severity <= 3 ? '#52B788' :
                                    symptom.severity <= 6 ? '#FFD700' : '#FF5733';
                
                return (
                  <div key={symptom.id} className="bg-[#1a1f35] border border-white/20 rounded-2xl p-4 md:p-5 backdrop-blur-sm">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 md:gap-4 mb-3">
                      <div className="flex-1">
                        <div className="text-white font-bold text-base md:text-lg capitalize mb-1">
                          {symptom.symptomType}
                        </div>
                        <div className="text-white/60 text-xs md:text-sm">
                          {format(new Date(symptom.timestamp), 'MMM d, yyyy - h:mm a')}
                          {symptom.bodyPart && ` • ${symptom.bodyPart}`}
                        </div>
                      </div>
                      <div className="text-left md:text-right">
                        <div className="text-2xl md:text-3xl font-bold" style={{ color: severityColor }}>
                          {symptom.severity}
                        </div>
                        <div className="text-white/60 text-xs">severity</div>
                        <div className="text-white/60 text-xs capitalize mt-1">{symptom.duration}</div>
                      </div>
                    </div>

                    {symptom.triggers?.length > 0 && (
                      <div className="mb-3">
                        <div className="text-white/70 text-xs mb-2">Triggers:</div>
                        <div className="flex flex-wrap gap-1 md:gap-2">
                          {symptom.triggers.map(trigger => (
                            <span key={trigger} className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                              {trigger}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {symptom.relievedBy?.length > 0 && (
                      <div className="mb-3">
                        <div className="text-white/70 text-xs mb-2">Relieved by:</div>
                        <div className="flex flex-wrap gap-1 md:gap-2">
                          {symptom.relievedBy.map(relief => (
                            <span key={relief} className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                              {relief}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {symptom.notes && (
                      <p className="text-white/70 text-sm pt-3 border-t border-white/10">{symptom.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeView === "medications" && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-lg md:text-xl font-bold text-white">Medications & Supplements</h2>
            <Button
              onClick={() => {
                setEditingMedication(null);
                setShowMedicationTracker(true);
              }}
              className="bg-gradient-to-r from-[#4CC9F0] to-[#5EE0FF] text-white font-bold w-full sm:w-auto"
            >
              <Plus className="w-4 md:w-5 h-4 md:h-5 mr-2" />
              Add New
            </Button>
          </div>

          {medications.length === 0 ? (
            <div className="text-center py-12 md:py-16 bg-white/5 border border-white/10 rounded-2xl px-4">
              <Pill className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 text-[#4CC9F0]" />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">No Medications</h3>
              <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
                Add medications or supplements to track and get reminders
              </p>
              <Button
                onClick={() => setShowMedicationTracker(true)}
                className="bg-gradient-to-r from-[#4CC9F0] to-[#5EE0FF] text-white font-bold"
              >
                Add First Medication
              </Button>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {medications.map(med => {
                const typeEmoji = med.type === 'medication' ? '💊' :
                                med.type === 'supplement' ? '🧪' : '🌟';
                const typeColor = med.type === 'medication' ? '#4CC9F0' :
                                 med.type === 'supplement' ? '#52B788' : '#FFD700';
                
                const todayTaken = (med.takenDates || []).filter(t => 
                  t.date === today && t.taken
                ).length;
                const todayTotal = med.frequency === "as_needed" ? 0 : (med.times?.length || 0);

                return (
                  <div key={med.id} className="bg-[#1a1f35] border border-white/20 rounded-2xl p-4 md:p-5 backdrop-blur-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-2 md:gap-3 flex-1">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-2xl md:text-3xl flex-shrink-0"
                          style={{ backgroundColor: `${typeColor}20` }}
                        >
                          {typeEmoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-bold text-sm md:text-lg truncate">{med.name}</div>
                          <div className="text-white/60 text-xs md:text-sm">{med.dosage}</div>
                          {med.purpose && (
                            <div className="text-white/60 text-xs mt-1 line-clamp-1">For: {med.purpose}</div>
                          )}
                        </div>
                      </div>
                      {!med.isActive && (
                        <span className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded-full whitespace-nowrap">
                          Inactive
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-4 text-xs md:text-sm">
                      <span className="text-white/70 capitalize">
                        {med.frequency.replace('_', ' ')}
                      </span>
                      {med.withFood && (
                        <>
                          <span className="text-white/40">•</span>
                          <span className="text-white/70">With food</span>
                        </>
                      )}
                      {todayTotal > 0 && (
                        <>
                          <span className="text-white/40">•</span>
                          <span className="text-green-400 font-bold">
                            {todayTaken}/{todayTotal} today
                          </span>
                        </>
                      )}
                    </div>

                    {med.times && med.times.length > 0 && med.frequency !== "as_needed" && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {med.times.map((time, idx) => {
                          const isTaken = (med.takenDates || []).some(t => 
                            t.date === today && t.time === time && t.taken
                          );
                          
                          return (
                            <button
                              key={idx}
                              onClick={() => handleMarkMedicationTaken(med, time)}
                              className={`px-3 py-2 rounded-lg border transition-all flex items-center gap-2 text-sm ${
                                isTaken
                                  ? 'bg-green-500/20 border-green-500/40 text-green-400'
                                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                              }`}
                            >
                              {isTaken && <CheckCircle2 className="w-4 h-4" />}
                              <span>{time}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10">
                      <Button
                        onClick={() => {
                          setEditingMedication(med);
                          setShowMedicationTracker(true);
                        }}
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 text-xs"
                      >
                        <Edit2 className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        onClick={() => updateMedicationMutation.mutate({
                          id: med.id,
                          data: { isActive: !med.isActive }
                        })}
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 text-xs"
                      >
                        {med.isActive ? 'Pause' : 'Resume'}
                      </Button>
                      <Button
                        onClick={() => {
                          if (confirm('Delete this medication?')) {
                            deleteMedicationMutation.mutate(med.id);
                          }
                        }}
                        size="sm"
                        variant="outline"
                        className="border-red-500/40 text-red-400 hover:bg-red-500/20 text-xs"
                      >
                        <Trash2 className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeView === "check-ins" && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-lg md:text-xl font-bold text-white">Health Check-Ins</h2>
            <Button
              onClick={() => setShowHealthCheckIn(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold w-full sm:w-auto"
            >
              <Plus className="w-4 md:w-5 h-4 md:h-5 mr-2" />
              New Check-In
            </Button>
          </div>

          {checkIns.length === 0 ? (
            <div className="text-center py-12 md:py-16 bg-white/5 border border-white/10 rounded-2xl px-4">
              <CheckCircle2 className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 text-green-400" />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Start Daily Check-Ins</h3>
              <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
                Regular check-ins help you monitor your overall health and spot trends
              </p>
              <Button
                onClick={() => setShowHealthCheckIn(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold"
              >
                First Check-In
              </Button>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {checkIns.map(checkIn => {
                const energyColor = checkIn.energyLevel >= 7 ? '#52B788' :
                                  checkIn.energyLevel >= 4 ? '#FFD700' : '#FF5733';
                const concernColor = checkIn.concernLevel === 'none' ? '#52B788' :
                                    checkIn.concernLevel === 'minor' ? '#FFD700' :
                                    checkIn.concernLevel === 'moderate' ? '#FF8C66' : '#FF5733';

                return (
                  <div key={checkIn.id} className="bg-[#1a1f35] border border-white/20 rounded-2xl p-4 md:p-5 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                      <div className="flex-1">
                        <div className="text-white font-bold text-base md:text-lg">
                          {format(new Date(checkIn.date), 'EEEE, MMMM d')}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-2 text-xs md:text-sm">
                          <span style={{ color: energyColor }}>
                            Energy: {checkIn.energyLevel}/10
                          </span>
                          <span className="text-white/40">•</span>
                          <span className="text-white/70">
                            Pain: {checkIn.painLevel}/10
                          </span>
                          <span className="text-white/40">•</span>
                          <span className="text-white/70 capitalize">
                            {checkIn.digestion} digestion
                          </span>
                        </div>
                      </div>
                      <div 
                        className="px-3 py-1 rounded-full text-xs md:text-sm font-bold whitespace-nowrap self-start"
                        style={{ backgroundColor: `${concernColor}20`, color: concernColor }}
                      >
                        {checkIn.concernLevel.replace('_', ' ')}
                      </div>
                    </div>

                    {checkIn.currentSymptoms?.length > 0 && (
                      <div className="mb-3">
                        <div className="text-white/70 text-xs mb-2">Symptoms:</div>
                        <div className="flex flex-wrap gap-1 md:gap-2">
                          {checkIn.currentSymptoms.map(symptom => (
                            <span key={symptom} className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {checkIn.notes && (
                      <p className="text-white/70 text-sm pt-3 border-t border-white/10">{checkIn.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showSymptomLogger && (
        <SymptomLogger
          onClose={() => setShowSymptomLogger(false)}
          onSave={(data) => saveSymptomMutation.mutateAsync(data)}
        />
      )}

      {showMedicationTracker && (
        <MedicationTracker
          onClose={() => {
            setShowMedicationTracker(false);
            setEditingMedication(null);
          }}
          onSave={(data) => saveMedicationMutation.mutateAsync(data)}
          medication={editingMedication}
        />
      )}

      {showHealthCheckIn && (
        <HealthCheckIn
          onClose={() => setShowHealthCheckIn(false)}
          onSave={(data) => saveCheckInMutation.mutateAsync(data)}
        />
      )}

      {/* NEW: Detail Modals */}
      {selectedLog && detailModalType === 'symptom' && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => {
            setSelectedLog(null);
            setDetailModalType(null);
          }}
          color="#FF5733"
          icon={AlertCircle}
          title="Symptom Log"
          fields={[
            { key: 'symptomType', label: 'Symptom', icon: AlertCircle, color: "#FF5733" },
            { key: 'severity', label: 'Severity', icon: TrendingUp, color: "#FFD700", unit: '/10' },
            { key: 'bodyPart', label: 'Body Part', icon: Activity, color: "#4CC9F0" },
            { key: 'duration', label: 'Duration', icon: Clock, color: "#7C3AED" },
            { key: 'triggers', label: 'Possible Triggers', icon: AlertCircle, color: "#FF5733" },
            { key: 'relievedBy', label: 'Relieved By', icon: CheckCircle2, color: "#52B788" }
          ]}
        />
      )}

      {selectedLog && detailModalType === 'checkIn' && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => {
            setSelectedLog(null);
            setDetailModalType(null);
          }}
          color="#52B788"
          icon={Activity}
          title="Health Check-In"
          fields={[
            { key: 'energyLevel', label: 'Energy Level', icon: Zap, color: "#52B788", unit: '/10' },
            { key: 'painLevel', label: 'Pain Level', icon: AlertCircle, color: "#FF5733", unit: '/10' },
            { key: 'digestion', label: 'Digestion', icon: Heart, color: "#4CC9F0" },
            { key: 'currentSymptoms', label: 'Current Symptoms', icon: AlertCircle, color: "#FF5733" },
            { key: 'medicationAdherence', label: 'Medication Adherence', icon: Pill, color: "#4CC9F0", unit: '%' },
            { 
              key: 'exerciseCompleted', 
              label: 'Exercise Today', 
              icon: Activity,
              color: "#52B788",
              render: (value) => <span className="text-white/90">{value ? '✅ Yes' : '❌ No'}</span>
            },
            { key: 'concernLevel', label: 'Concern Level', icon: AlertCircle, color: "#FFD700" }
          ]}
        />
      )}

      {selectedLog && detailModalType === 'medication' && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => {
            setSelectedLog(null);
            setDetailModalType(null);
          }}
          color="#4CC9F0"
          icon={Pill}
          title="Medication Details"
          fields={[
            { key: 'name', label: 'Name', icon: Pill, color: "#4CC9F0" },
            { key: 'type', label: 'Type', icon: Activity, color: "#7C3AED" },
            { key: 'dosage', label: 'Dosage', icon: TrendingUp, color: "#FFD700" },
            { key: 'frequency', label: 'Frequency', icon: Clock, color: "#52B788" },
            { 
              key: 'times', 
              label: 'Times to Take', 
              icon: Clock,
              color: "#4CC9F0",
              render: (times) => times && times.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {times.map((t, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
                      {t}
                    </span>
                  ))}
                </div>
              ) : null
            },
            { 
              key: 'withFood', 
              label: 'Take With Food', 
              icon: Heart,
              color: "#52B788",
              render: (value) => <span className="text-white/90">{value ? '✅ Yes' : '❌ No'}</span>
            },
            { key: 'purpose', label: 'Purpose', icon: Target, color: "#FFD700" },
            { key: 'sideEffects', label: 'Side Effects', icon: AlertCircle, color: "#FF5733" }
          ]}
        />
      )}
    </PillarPage>
  );
}
