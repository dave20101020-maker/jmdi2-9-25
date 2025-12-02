import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, Check, X, Users, Flame, MessageCircle, Share2, Trophy, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const PILLARS = {
  sleep: { name: "Sleep", color: "#6B46C1", icon: "🌙" },
  diet: { name: "Diet", color: "#52B788", icon: "🥗" },
  exercise: { name: "Exercise", color: "#FF5733", icon: "💪" },
  physical_health: { name: "Physical Health", color: "#FF7F50", icon: "❤️" },
  mental_health: { name: "Mental Health", color: "#4CC9F0", icon: "🧠" },
  finances: { name: "Finances", color: "#2E8B57", icon: "💰" },
  social: { name: "Social", color: "#FFD700", icon: "👥" },
  spirituality: { name: "Spirituality", color: "#7C3AED", icon: "✨" }
};

function FriendProfileModal({ friendEmail, onClose }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    async function getUser() {
      const currentUser = await api.authMe();
      setUser(currentUser);
    }
    getUser();
  }, []);
  
  const { data: friendEntries = [] } = useQuery({
    queryKey: ['friendEntries', friendEmail],
    queryFn: () => api.getEntries({ created_by: friendEmail }, '-date', 30),
    enabled: !!friendEmail,
    initialData: []
  });
  
  const { data: friendMilestones = [] } = useQuery({
    queryKey: ['friendMilestones', friendEmail],
    queryFn: () => api.getMilestones({ userId: friendEmail, isPublic: true }, '-created_date', 10),
    enabled: !!friendEmail,
    initialData: []
  });
  
  const { data: myMilestones = [] } = useQuery({
    queryKey: ['myMilestones'],
    queryFn: () => api.getMilestones({ userId: user?.email, isPublic: true }, '-created_date', 10),
    enabled: !!user,
    initialData: []
  });
  
  // Calculate 7-day average scores per pillar
  const last7Days = friendEntries.slice(0, 7);
  const radarData = Object.entries(PILLARS).map(([id, pillar]) => {
    const pillarEntries = last7Days.filter(e => e.pillar === id);
    const avgScore = pillarEntries.length > 0
      ? Math.round(pillarEntries.reduce((sum, e) => sum + e.score, 0) / pillarEntries.length)
      : 0;
    
    return {
      pillar: pillar.name,
      score: avgScore,
      fullMark: 100
    };
  });
  
  // Find shared milestones (same type and pillar)
  const sharedMilestones = friendMilestones.filter(fm =>
    myMilestones.some(mm => mm.type === fm.type && mm.pillar === fm.pillar)
  );
  
  const friendName = friendEmail.split('@')[0];
  const friendStreak = Math.floor(Math.random() * 30); // Placeholder - would need to fetch real data
  
  const handleMessage = () => {
    const shareData = {
      title: 'NorthStar - Let\'s Connect!',
      text: `Hey! Let's keep each other accountable on our growth journey. Check out NorthStar!`,
      url: window.location.origin
    };
    
    if (navigator.share) {
      navigator.share(shareData)
        .then(() => toast.success('Shared! 📤'))
        .catch((err) => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      toast.success('Copied to clipboard! 📋');
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0A1628] bg-opacity-95 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center text-2xl font-bold text-[#0A1628]">
                {friendName[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{friendName}</h2>
                <p className="text-white/60 text-sm">{friendEmail}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            {friendStreak > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/20 border border-orange-500/40 rounded-lg">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="text-white font-bold">{friendStreak} day streak</span>
              </div>
            )}
            
            <Button
              onClick={handleMessage}
              className="flex-1 bg-[#4CC9F0]/20 hover:bg-[#4CC9F0]/30 text-[#4CC9F0] border border-[#4CC9F0]/40 font-bold"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Message
            </Button>
          </div>
        </div>
        
        {/* 7-Day Pillar Radar Chart */}
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
            7-Day Performance
          </h3>
          
          {last7Days.length > 0 ? (
            <div className="bg-white/5 rounded-xl p-4">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
                  <PolarAngleAxis 
                    dataKey="pillar" 
                    tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fill: 'rgba(255, 255, 255, 0.5)' }}
                  />
                  <Radar 
                    name="Score" 
                    dataKey="score" 
                    stroke="#D4AF37" 
                    fill="#D4AF37" 
                    fillOpacity={0.6} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-white/60">
              <p>No recent activity to display</p>
            </div>
          )}
        </div>
        
        {/* Shared Milestones */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#F4D03F]" />
            Shared Milestones ({sharedMilestones.length})
          </h3>
          
          {sharedMilestones.length > 0 ? (
            <div className="space-y-3">
              {sharedMilestones.map(milestone => {
                const pillar = PILLARS[milestone.pillar];
                return (
                  <div key={milestone.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37]/30 to-[#F4D03F]/30 flex items-center justify-center text-2xl flex-shrink-0">
                        {milestone.icon || '🏆'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="text-white font-bold">{milestone.title}</div>
                            <div className="text-white/70 text-sm">
                              {pillar && `${pillar.icon} ${pillar.name}`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[#F4D03F] font-bold">+{milestone.points}</div>
                            <div className="text-white/60 text-xs">points</div>
                          </div>
                        </div>
                        <p className="text-white/80 text-sm mb-2">{milestone.description}</p>
                        <div className="text-white/60 text-xs">
                          {format(new Date(milestone.created_date), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-white/40" />
              <p className="text-white/60 text-sm">
                No shared milestones yet. Keep achieving goals together!
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Friends() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFriend, setSelectedFriend] = useState(null);
  
  useEffect(() => {
    async function getUser() {
      const currentUser = await api.authMe();
      setUser(currentUser);
    }
    getUser();
  }, []);
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const { data: connections = [] } = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.getConnections({
      $or: [{ userId: user?.email }, { friendEmail: user?.email }]
    }),
    enabled: !!user,
    initialData: []
  });
  
  const { data: searchResults = [] } = useQuery({
    queryKey: ['userSearch', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return [];
      
      // Search for users by email or name
      // Note: This is a simplified search - in production, you'd have a dedicated search endpoint
      return [];
    },
    enabled: !!user && debouncedSearch.length >= 2,
    initialData: []
  });
  
  const acceptedConnections = connections.filter(c => c.status === 'accepted');
  const pendingRequests = connections.filter(c => 
    c.status === 'pending' && c.friendEmail === user?.email
  );
  
  const addFriendMutation = useMutation({
    mutationFn: async (email) => {
      const existing = connections.find(c => 
        (c.userId === user.email && c.friendEmail === email) ||
        (c.friendEmail === user.email && c.userId === email)
      );
      
      if (existing) {
        throw new Error('Connection already exists');
      }
      
      return api.createConnection({
        userId: user.email,
        friendEmail: email,
        friendName: email.split('@')[0],
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['connections']);
      toast.success('Friend request sent! 📤', {
        description: 'They\'ll see your request in their Friends tab'
      });
    },
    onError: (error) => {
      toast.error('Failed to send request', {
        description: error.message
      });
    }
  });
  
  const respondToRequestMutation = useMutation({
    mutationFn: ({ connectionId, accept }) => 
      api.updateConnection(connectionId, { 
        status: accept ? 'accepted' : 'blocked' 
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['connections']);
      if (variables.accept) {
        toast.success('Friend request accepted! 🎉', {
          description: 'You can now see each other\'s progress'
        });
      } else {
        toast.success('Request declined', {
          description: 'The request has been removed'
        });
      }
    }
  });
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#D4AF37]/20 animate-pulse" />
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="min-h-screen pb-24 px-6 pt-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Users className="w-8 h-8 text-[#D4AF37]" />
              Friends
            </h1>
            <p className="text-white/70">Connect and grow together</p>
          </div>
          
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username or email..."
                className="pl-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl h-12"
              />
            </div>
            
            {/* Search Results */}
            {debouncedSearch.length >= 2 && (
              <div className="mt-3 bg-[#1a1f35] border border-white/20 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white/80 mb-3">Search Results</h3>
                
                {searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map(result => {
                      const isAlreadyConnected = connections.some(c => 
                        (c.userId === user.email && c.friendEmail === result.email) ||
                        (c.friendEmail === user.email && c.userId === result.email)
                      );
                      
                      return (
                        <div key={result.email} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37]/30 to-[#F4D03F]/30 flex items-center justify-center text-lg font-bold text-white">
                              {(result.full_name || result.email)[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="text-white font-bold">{result.full_name || result.email.split('@')[0]}</div>
                              <div className="text-white/60 text-sm">{result.email}</div>
                            </div>
                            {result.streak_days > 0 && (
                              <div className="flex items-center gap-1 ml-2">
                                <Flame className="w-4 h-4 text-orange-400" />
                                <span className="text-orange-400 text-sm font-bold">{result.streak_days}</span>
                              </div>
                            )}
                          </div>
                          
                          {!isAlreadyConnected ? (
                            <Button
                              size="sm"
                              onClick={() => addFriendMutation.mutate(result.email)}
                              disabled={addFriendMutation.isPending}
                              className="bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] font-bold"
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Add
                            </Button>
                          ) : (
                            <span className="text-green-400 text-sm font-bold">✓ Connected</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-white/60 text-sm">No users found. Try a different search.</p>
                    <p className="text-white/40 text-xs mt-2">Search by email or username</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 mb-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Pending Requests ({pendingRequests.length})
              </h3>
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37]/30 to-[#F4D03F]/30 flex items-center justify-center text-lg font-bold text-white">
                        {(req.friendName || req.userId)[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-bold">{req.friendName || req.userId.split('@')[0]}</div>
                        <div className="text-white/60 text-sm">{req.userId}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => respondToRequestMutation.mutate({ connectionId: req.id, accept: true })}
                        disabled={respondToRequestMutation.isPending}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => respondToRequestMutation.mutate({ connectionId: req.id, accept: false })}
                        disabled={respondToRequestMutation.isPending}
                        className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Friends List */}
          <div className="bg-[#1a1f35] border border-white/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Your Friends ({acceptedConnections.length})
            </h2>
            
            {acceptedConnections.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-white/40" />
                <h3 className="text-lg font-bold text-white mb-2">No Friends Yet</h3>
                <p className="text-white/70 mb-4">Search for friends above to get started!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {acceptedConnections.map(conn => {
                  const friendEmail = conn.userId === user.email ? conn.friendEmail : conn.userId;
                  const friendName = conn.userId === user.email ? conn.friendName : conn.userId.split('@')[0];
                  const friendStreak = Math.floor(Math.random() * 30); // Placeholder
                  
                  return (
                    <button
                      key={conn.id}
                      onClick={() => setSelectedFriend(friendEmail)}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all text-left"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#D4AF37]/30 to-[#F4D03F]/30 flex items-center justify-center text-xl font-bold text-white">
                          {friendName[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-bold">{friendName}</div>
                          <div className="text-white/60 text-sm">{friendEmail}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        {friendStreak > 0 && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 border border-orange-500/40 rounded-lg">
                            <Flame className="w-4 h-4 text-orange-400" />
                            <span className="text-orange-400 font-bold text-sm">{friendStreak} days</span>
                          </div>
                        )}
                        
                        <div className="text-green-400 text-sm font-medium flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          Connected
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Profile Modal */}
      <AnimatePresence>
        {selectedFriend && (
          <FriendProfileModal
            friendEmail={selectedFriend}
            onClose={() => setSelectedFriend(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}