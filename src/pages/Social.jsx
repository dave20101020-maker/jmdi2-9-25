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
import MilestonesSection from "@/components/shared/MilestonesSection";
import PillarTip from "@/components/shared/PillarTip";
import { getTipsForPillar } from "@/utils/pillarTips";
import InteractionLogger from "@/components/shared/InteractionLogger";
import RelationshipCheckInForm from "@/components/shared/RelationshipCheckInForm";
import ChallengeCard from "@/components/shared/ChallengeCard";
import ChallengeForm from "@/components/shared/ChallengeForm";
import { PILLARS } from '@/utils';
import { Users, MessageCircle, Heart, Trophy, Plus, TrendingUp, Calendar, Clock, Smile, Target, AlertCircle, CheckCircle2, Star, UserPlus, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, differenceInDays, differenceInHours, startOfMonth } from "date-fns";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const PILLAR = PILLARS.social;

export default function Social() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showInteractionLogger, setShowInteractionLogger] = useState(false);
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [showChallengeForm, setShowChallengeForm] = useState(false);
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

  const { data: interactions = [] } = useQuery({
    queryKey: ['socialInteractions', user?.email],
    queryFn: () => api.getSocialInteractions({ userId: user?.email }, '-timestamp', 100),
    enabled: !!user,
    initialData: []
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['relationshipCheckIns', user?.email],
    queryFn: () => api.getRelationshipCheckIns({ userId: user?.email }, '-date', 100),
    enabled: !!user,
    initialData: []
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['groupChallenges', user?.email],
    queryFn: async () => {
      const allChallenges = await api.getGroupChallenges();
      return allChallenges.filter(c => 
        c.createdBy === user?.email || 
        c.participants?.some(p => p.email === user?.email)
      );
    },
    enabled: !!user,
    initialData: []
  });

  const saveInteractionMutation = useMutation({
    mutationFn: (data) => api.createSocialInteraction({
      userId: user.email,
      date: today,
      timestamp: new Date().toISOString(),
      ...data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialInteractions', user?.email] });
      setShowInteractionLogger(false);
    }
  });

  const saveCheckInMutation = useMutation({
    mutationFn: (data) => api.createRelationshipCheckIn({
      userId: user.email,
      date: today,
      ...data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationshipCheckIns', user?.email] });
      setShowCheckInForm(false);
    }
  });

  const saveChallengeMutation = useMutation({
    mutationFn: (data) => api.createGroupChallenge({
      createdBy: user.email,
      participants: [{
        email: user.email,
        name: user.full_name,
        joinedDate: today,
        progress: 0
      }],
      updates: [],
      ...data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupChallenges', user?.email] });
      setShowChallengeForm(false);
    }
  });

  const joinChallengeMutation = useMutation({
    mutationFn: async (challengeId) => {
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) return;

      const newParticipants = [
        ...(challenge.participants || []),
        {
          email: user.email,
          name: user.full_name,
          joinedDate: today,
          progress: 0
        }
      ];

      return api.updateGroupChallenge(challengeId, {
        participants: newParticipants
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupChallenges', user?.email] });
      toast.success('Joined challenge! 🎉');
    }
  });

  const leaveChallengeMutation = useMutation({
    mutationFn: async (challengeId) => {
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) return;

      const newParticipants = challenge.participants.filter(p => p.email !== user.email);

      return api.updateGroupChallenge(challengeId, {
        participants: newParticipants
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupChallenges', user?.email] });
      toast.success('Left challenge');
    }
  });

  const updateChallengeMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateGroupChallenge(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupChallenges', user?.email] });
    }
  });

  if (!user) return null;

  const recentInteractions = interactions.slice(0, 7);
  const avgQuality = recentInteractions.length > 0
    ? Math.round(recentInteractions.reduce((sum, i) => sum + i.quality, 0) / recentInteractions.length * 10) / 10
    : 0;

  const deependConnections = interactions.filter(i => i.deepened).length;

  const activeChallenges = challenges.filter(c => 
    c.isActive && 
    new Date(c.endDate) >= new Date()
  );

  const latestInteraction = interactions.length > 0 ? interactions[0] : null;
  const hoursAgoInteraction = latestInteraction 
    ? Math.round(differenceInHours(new Date(), new Date(latestInteraction.timestamp)))
    : null;

  const weeklyInteractions = interactions.filter(i => {
    const daysDiff = differenceInDays(new Date(), new Date(i.date));
    return daysDiff <= 7;
  }).length;

  const avgConnectionStrength = checkIns.slice(0, 5).length > 0
    ? Math.round(
        checkIns.slice(0, 5).reduce((sum, c) => sum + (c.connectionStrength || 0), 0) / 
        Math.min(checkIns.length, 5) * 10
      ) / 10
    : 0;

  // NEW: Unique people interacted with
  const uniquePeople = [...new Set(interactions.map(i => i.withWhom))].length;

  // Weekly interaction quality trend
  const weeklyQualityData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayInteractions = interactions.filter(int => int.date === dateStr);
    const avgQual = dayInteractions.length > 0
      ? Math.round(dayInteractions.reduce((sum, int) => sum + int.quality, 0) / dayInteractions.length * 10) / 10
      : null;
    
    return {
      date: format(date, 'EEE'),
      quality: avgQual,
      count: dayInteractions.length
    };
  });

  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const thisMonthDeepened = interactions.filter(i => i.deepened && i.date >= monthStart).length;

  const milestones = [
    thisMonthDeepened >= 5 && {
      id: 'deepened-connections',
      type: 'achievement',
      icon: Heart,
      title: 'Connection Builder',
      description: `${thisMonthDeepened} deepened connections this month`,
      value: `${thisMonthDeepened}💫`,
      color: "#FF69B4",
      date: format(new Date(), 'MMM yyyy'),
      isNew: true
    },
    uniquePeople >= 10 && {
      id: 'social-circle',
      type: 'award',
      icon: UserPlus,
      title: 'Diverse Social Circle',
      description: 'Unique people connected with',
      value: uniquePeople,
      color: PILLAR.color,
      isNew: false
    },
    activeChallenges.length >= 2 && {
      id: 'active-challenger',
      type: 'streak',
      icon: Trophy,
      title: 'Active Challenger',
      description: `${activeChallenges.length} challenges ongoing`,
      value: `${activeChallenges.length}🏆`,
      color: "#52B788",
      isNew: true
    }
  ].filter(Boolean);

  const atAGlanceMetrics = [
    {
      icon: <MessageCircle />,
      label: "Interactions (7d)",
      value: weeklyInteractions,
      subtitle: `avg quality ${avgQuality}/10`,
      trend: avgQuality >= 7 ? "up" : avgQuality >= 5 ? "stable" : "down",
      lastUpdated: hoursAgoInteraction ? `${hoursAgoInteraction}h ago` : "No data"
    },
    {
      icon: <Heart />,
      label: "Connection Quality",
      value: avgConnectionStrength > 0 ? `${avgConnectionStrength}/10` : "—",
      subtitle: "recent check-ins",
      progress: avgConnectionStrength * 10,
      trend: avgConnectionStrength >= 7 ? "up" : "stable"
    },
    {
      icon: <Trophy />,
      label: "Active Challenges",
      value: activeChallenges.length,
      subtitle: `${challenges.length} total`,
      trend: activeChallenges.length >= 2 ? "up" : activeChallenges.length >= 1 ? "stable" : "down",
      message: activeChallenges.length === 0 ? "Join or create a challenge to connect!" : null
    }
  ];

  const recentActivityData = [
    ...interactions.slice(0, 3).map(i => ({
      id: i.id,
      type: 'interaction',
      icon: MessageCircle,
      title: `${i.interactionType.replace('_', ' ')} with ${i.withWhom}`,
      summary: `Quality: ${i.quality}/10 • ${i.duration}${i.deepened ? ' • Deepened connection!' : ''}`,
      timestamp: i.timestamp,
      color: i.quality >= 7 ? "#52B788" : i.quality >= 5 ? "#FFD700" : "#FF5733",
      badges: [
        { text: `Quality ${i.quality}/10`, color: i.quality >= 7 ? "#52B788" : "#FFD700" },
        { text: i.interactionType.replace('_', ' '), color: "#4CC9F0" },
        ...(i.deepened ? [{ text: '💫 Deepened', color: "#FF69B4" }] : [])
      ],
      data: i
    })),
    ...checkIns.slice(0, 2).map(c => ({
      id: c.id,
      type: 'checkIn',
      icon: Heart,
      title: `Check-In: ${c.person}`,
      summary: `${c.relationshipType} • Connection: ${c.connectionStrength}/10`,
      timestamp: c.date,
      color: "#FF69B4",
      badges: [
        { text: c.relationshipType, color: "#7C3AED" },
        { text: `Strength ${c.connectionStrength}/10`, color: "#FF69B4" }
      ],
      data: c
    }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);

  const handleActivityClick = (activity) => {
    setSelectedLog(activity.data);
    setDetailModalType(activity.type);
  };

  const stats = [
    {
      icon: <MessageCircle className="w-4 h-4" />,
      label: "Interactions",
      value: interactions.length,
      subtitle: "logged",
      color: "#FFD700"
    },
    {
      icon: <Heart className="w-4 h-4" />,
      label: "Deepened",
      value: deependConnections,
      subtitle: "connections",
      color: "#FF69B4"
    },
    {
      icon: <Users className="w-4 h-4" />,
      label: "Check-ins",
      value: checkIns.length,
      subtitle: "completed",
      color: "#4CC9F0"
    },
    {
      icon: <Trophy className="w-4 h-4" />,
      label: "Challenges",
      value: activeChallenges.length,
      subtitle: "active",
      color: "#52B788"
    }
  ];

  return (
    <PillarPage pillar={PILLAR} title="Social Wellness" subtitle="Connections, interactions, and challenges" stats={stats}>
      <PillarAtAGlance metrics={atAGlanceMetrics} color={PILLAR.color} />

      <MilestonesSection milestones={milestones} color={PILLAR.color} title="Social Achievements" compact={true} />

      <PillarTip tips={getTipsForPillar('social')} color={PILLAR.color} icon={Heart} title="Connection Tip" />

      {/* Weekly Interaction Quality Trend */}
      {weeklyQualityData.some(d => d.quality !== null) && (
        <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6"
          style={{ boxShadow: `0 0 30px ${PILLAR.color}20` }}
        >
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: PILLAR.color }} />
            Connection Quality This Week
          </h3>
          
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyQualityData}>
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.3)"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                domain={[0, 10]}
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
                  if (name === 'quality') return [`${value}/10`, 'Avg Quality'];
                  return [value, name];
                }}
              />
              <Bar 
                dataKey="quality" 
                fill={PILLAR.color}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          
          <div className="text-center text-white/60 text-xs mt-2">
            {weeklyInteractions} interactions • {uniquePeople} unique people
          </div>
        </div>
      )}

      {/* Social Metrics Circles */}
      <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6"
        style={{ boxShadow: `0 0 30px ${PILLAR.color}20` }}
      >
        <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
          <Target className="w-5 h-5" style={{ color: PILLAR.color }} />
          Social Health Metrics
        </h3>
        
        <div className="flex flex-col md:flex-row items-center justify-around gap-8">
          <CircularProgress
            value={avgQuality}
            max={10}
            size={140}
            strokeWidth={10}
            color="#FFD700"
            label="Avg Quality"
            subtitle="Last 7 days"
            showPercentage={false}
            icon={<Star />}
          />

          <CircularProgress
            value={deependConnections}
            max={Math.max(deependConnections, 10)}
            size={140}
            strokeWidth={10}
            color="#FF69B4"
            label="Deepened"
            subtitle="Connections"
            showPercentage={false}
            icon={<Heart />}
          />

          <CircularProgress
            value={uniquePeople}
            max={Math.max(uniquePeople, 20)}
            size={140}
            strokeWidth={10}
            color={PILLAR.color}
            label="Unique People"
            subtitle="Connected with"
            showPercentage={false}
            icon={<Users />}
          />
        </div>
      </div>

      <RecentActivity
        activities={recentActivityData}
        color={PILLAR.color}
        onItemClick={handleActivityClick}
        emptyMessage="No social activity logged yet"
        emptyIcon={Users}
        emptyAction={
          <Button
            onClick={() => setShowInteractionLogger(true)}
            className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log First Interaction
          </Button>
        }
      />

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <ActionCard
          icon={MessageCircle}
          title="Log Interaction"
          description="Track connections"
          stats={`${interactions.length} logged`}
          color="#FFD700"
          onClick={() => setShowInteractionLogger(true)}
        />
        <ActionCard
          icon={Heart}
          title="Relationship Check-In"
          description="Strengthen bonds"
          stats={`${checkIns.length} check-ins`}
          color="#FF69B4"
          onClick={() => setShowCheckInForm(true)}
        />
        <ActionCard
          icon={Trophy}
          title="Create Challenge"
          description="Connect through goals"
          stats={`${challenges.length} available`}
          color="#52B788"
          onClick={() => setShowChallengeForm(true)}
        />
      </div>

      {/* Active Challenges Overview */}
      {activeChallenges.length > 0 && (
        <DataCard title="My Active Challenges" titleIcon={<Trophy />} color="#52B788">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeChallenges.slice(0, 2).map(challenge => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                user={user}
                onJoin={(id) => joinChallengeMutation.mutate(id)}
                onLeave={(id) => leaveChallengeMutation.mutate(id)}
                onUpdate={(id, data) => updateChallengeMutation.mutate({ id, data })}
              />
            ))}
          </div>
        </DataCard>
      )}

      {showInteractionLogger && (
        <InteractionLogger onClose={() => setShowInteractionLogger(false)} onSave={(data) => saveInteractionMutation.mutateAsync(data)} />
      )}

      {showCheckInForm && (
        <RelationshipCheckInForm onClose={() => setShowCheckInForm(false)} onSave={(data) => saveCheckInMutation.mutateAsync(data)} />
      )}

      {showChallengeForm && (
        <ChallengeForm onClose={() => setShowChallengeForm(false)} onSave={(data) => saveChallengeMutation.mutateAsync(data)} user={user} />
      )}

      {selectedLog && detailModalType === 'interaction' && (
        <LogDetailModal log={selectedLog} onClose={() => { setSelectedLog(null); setDetailModalType(null); }} color="#FFD700" icon={MessageCircle} title={`Interaction with ${selectedLog.withWhom}`} fields={[
          { key: 'interactionType', label: 'Type', icon: MessageCircle, color: "#4CC9F0" },
          { key: 'quality', label: 'Quality', icon: TrendingUp, color: "#52B788", unit: '/10' },
          { key: 'duration', label: 'Duration', icon: Clock, color: "#7C3AED" },
          { key: 'activities', label: 'Activities', icon: Smile, color: "#FF69B4" },
          { key: 'mood', label: 'Mood After', icon: Heart, color: "#FFD700" },
          { key: 'deepened', label: 'Deepened Connection', icon: Heart, color: "#FF69B4", render: (value) => <span className="text-lg text-white/90">{value ? '💫 Yes!' : '—'}</span> }
        ]} />
      )}

      {selectedLog && detailModalType === 'checkIn' && (
        <LogDetailModal log={selectedLog} onClose={() => { setSelectedLog(null); setDetailModalType(null); }} color="#FF69B4" icon={Heart} title={`Relationship with ${selectedLog.person}`} fields={[
          { key: 'relationshipType', label: 'Type', icon: Users, color: "#7C3AED" },
          { key: 'connectionStrength', label: 'Connection Strength', icon: Heart, color: "#FF69B4", unit: '/10' },
          { key: 'satisfactionLevel', label: 'Satisfaction', icon: Smile, color: "#52B788", unit: '/10' },
          { key: 'lastContact', label: 'Last Contact', icon: Calendar, color: "#4CC9F0" },
          { key: 'whatWorking', label: "What's Working", icon: CheckCircle2, color: "#52B788" },
          { key: 'whatNeeds', label: 'What Needs Attention', icon: AlertCircle, color: "#FFD700" },
          { key: 'actionItems', label: 'Action Items', icon: Target, color: "#4CC9F0" },
          { key: 'gratitude', label: 'Gratitude', icon: Heart, color: "#FF69B4" }
        ]} />
      )}
    </PillarPage>
  );
}