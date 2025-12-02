import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl, COLORS } from '@/utils';
import { ArrowLeft, Users, UserPlus, Search, Send, CheckCircle2, XCircle, Clock, Shield, Edit2, Save, X, Trash2, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Connections() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("friends");
  
  const [searchEmail, setSearchEmail] = useState('');
  const [searchMessage, setSearchMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    async function getUser() {
      const currentUser = await api.authMe();
      setUser(currentUser);
    }
    getUser();
  }, []);
  
  const { data: allConnections = [], isLoading } = useQuery({
    queryKey: ['connections', user?.email],
    queryFn: async () => {
      const sent = await api.getConnections({ userId: user?.email });
      const received = await api.getConnections({ friendEmail: user?.email });
      return [...sent, ...received];
    },
    enabled: !!user,
    initialData: []
  });
  
  const createConnectionMutation = useMutation({
    mutationFn: (data) => api.createConnection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', user?.email] });
      setSearchEmail('');
      setSearchMessage('');
      toast.success('Friend request sent! 📨');
    },
    onError: (error) => {
      toast.error('Failed to send request', {
        description: 'Please try again'
      });
      console.error(error);
    }
  });
  
  const updateConnectionMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateConnection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', user?.email] });
      toast.success('Connection updated! ✓');
    },
    onError: (error) => {
      toast.error('Failed to update connection');
      console.error(error);
    }
  });
  
  const deleteConnectionMutation = useMutation({
    mutationFn: (id) => api.deleteConnection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', user?.email] });
      toast.success('Connection removed');
    },
    onError: (error) => {
      toast.error('Failed to remove connection');
      console.error(error);
    }
  });
  
  const myFriends = allConnections.filter(c => c.status === 'accepted');
  const sentRequests = allConnections.filter(c => c.status === 'pending' && c.userId === user?.email);
  const receivedRequests = allConnections.filter(c => c.status === 'pending' && c.friendEmail === user?.email);
  const blockedUsers = allConnections.filter(c => c.status === 'blocked');
  
  const filteredFriends = myFriends.filter(conn => {
    const friendEmail = conn.userId === user?.email ? conn.friendEmail : conn.userId;
    const friendName = conn.userId === user?.email ? (conn.friendName || conn.nickname) : conn.friendName;
    const nickname = conn.nickname || '';
    
    const query = searchQuery.toLowerCase();
    return (
      friendEmail.toLowerCase().includes(query) ||
      friendName?.toLowerCase().includes(query) ||
      nickname.toLowerCase().includes(query)
    );
  });
  
  const handleSendRequest = () => {
    if (!searchEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    
    if (searchEmail.toLowerCase() === user.email.toLowerCase()) {
      toast.error("You can't add yourself as a friend");
      return;
    }
    
    const existingConnection = allConnections.find(c => 
      (c.userId === user.email && c.friendEmail === searchEmail) ||
      (c.friendEmail === user.email && c.userId === searchEmail)
    );
    
    if (existingConnection) {
      if (existingConnection.status === 'accepted') {
        toast.error('Already connected with this user');
      } else if (existingConnection.status === 'pending') {
        toast.error('Request already pending');
      } else if (existingConnection.status === 'blocked') {
        toast.error('Cannot connect with this user');
      }
      return;
    }
    
    createConnectionMutation.mutate({
      userId: user.email,
      friendEmail: searchEmail.trim(),
      friendName: '',
      status: 'pending'
    });
  };
  
  const handleAcceptRequest = (connectionId) => {
    updateConnectionMutation.mutate({
      id: connectionId,
      data: { status: 'accepted' }
    });
  };
  
  const handleDeclineRequest = (connectionId) => {
    if (confirm('Decline this friend request?')) {
      deleteConnectionMutation.mutate(connectionId);
    }
  };
  
  const handleBlockUser = (connectionId) => {
    if (confirm('Block this user? They will not be able to send you requests.')) {
      updateConnectionMutation.mutate({
        id: connectionId,
        data: { status: 'blocked' }
      });
    }
  };
  
  const handleRemoveFriend = (connectionId) => {
    if (confirm('Remove this friend?')) {
      deleteConnectionMutation.mutate(connectionId);
    }
  };
  
  const handleCancelRequest = (connectionId) => {
    if (confirm('Cancel this friend request?')) {
      deleteConnectionMutation.mutate(connectionId);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FFD700]/20 animate-pulse" />
          <p className="text-white/60">Loading connections...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pb-24 px-4 sm:px-6 pt-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <button
            onClick={() => navigate(createPageUrl("Profile"))}
            className="text-white/60 hover:text-white transition-colors"
            aria-label="Back to profile"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6 md:w-7 md:h-7 text-[#FFD700]" />
              Connections
            </h1>
            <p className="text-white/60 text-sm">Manage your friends and requests</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-[#1a1f35] border border-white/20 rounded-xl p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <div className="text-white/70 text-xs md:text-sm">Friends</div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-green-400">{myFriends.length}</div>
          </div>
          
          <div className="bg-[#1a1f35] border border-white/20 rounded-xl p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-400" />
              <div className="text-white/70 text-xs md:text-sm">Pending</div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-blue-400">{receivedRequests.length}</div>
            <div className="text-xs text-white/60">requests</div>
          </div>
          
          <div className="bg-[#1a1f35] border border-white/20 rounded-xl p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Send className="w-4 h-4 text-yellow-400" />
              <div className="text-white/70 text-xs md:text-sm">Sent</div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-yellow-400">{sentRequests.length}</div>
            <div className="text-xs text-white/60">requests</div>
          </div>
          
          <div className="bg-[#1a1f35] border border-white/20 rounded-xl p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-red-400" />
              <div className="text-white/70 text-xs md:text-sm">Blocked</div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-red-400">{blockedUsers.length}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            onClick={() => setActiveTab("friends")}
            className={`py-2 md:py-3 px-2 md:px-4 rounded-xl font-bold transition-all text-xs md:text-base ${
              activeTab === "friends"
                ? 'bg-[#FFD700] text-[#0A1628]'
                : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4 md:w-5 md:h-5 inline mr-1 md:mr-2" />
            <span className="hidden sm:inline">Friends</span>
            <span className="sm:hidden">({myFriends.length})</span>
            <span className="hidden sm:inline ml-1">({myFriends.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("find")}
            className={`py-2 md:py-3 px-2 md:px-4 rounded-xl font-bold transition-all text-xs md:text-base ${
              activeTab === "find"
                ? 'bg-[#FFD700] text-[#0A1628]'
                : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
            }`}
          >
            <UserPlus className="w-4 h-4 md:w-5 md:h-5 inline mr-1 md:mr-2" />
            <span className="hidden sm:inline">Find</span>
            <span className="sm:hidden">Add</span>
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`relative py-2 md:py-3 px-2 md:px-4 rounded-xl font-bold transition-all text-xs md:text-base ${
              activeTab === "requests"
                ? 'bg-[#FFD700] text-[#0A1628]'
                : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
            }`}
          >
            <Clock className="w-4 h-4 md:w-5 md:h-5 inline mr-1 md:mr-2" />
            <span className="hidden sm:inline">Requests</span>
            <span className="sm:hidden">({receivedRequests.length + sentRequests.length})</span>
            <span className="hidden sm:inline ml-1">({receivedRequests.length + sentRequests.length})</span>
            {receivedRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                {receivedRequests.length}
              </span>
            )}
          </button>
        </div>
        
        {activeTab === "friends" && (
          <div className="space-y-4">
            {myFriends.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search friends by name or email..."
                    className="bg-white/10 border-white/20 text-white pl-10"
                  />
                </div>
              </div>
            )}
            
            {filteredFriends.length === 0 ? (
              <div className="text-center py-12 md:py-16">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 max-w-lg mx-auto">
                  <div className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-6" aria-hidden="true">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      <circle cx="100" cy="100" r="20" fill="#FFD700" opacity="0.8" />
                      <text x="100" y="108" textAnchor="middle" fill="#0A1628" fontSize="20" fontWeight="bold">👤</text>
                      
                      <circle cx="50" cy="50" r="15" fill="none" stroke="#FFD700" strokeWidth="2" opacity="0.3" strokeDasharray="3,3" />
                      <line x1="100" y1="100" x2="65" y2="65" stroke="#FFD700" strokeWidth="2" opacity="0.2" strokeDasharray="3,3" />
                      
                      <circle cx="150" cy="50" r="15" fill="none" stroke="#FFD700" strokeWidth="2" opacity="0.3" strokeDasharray="3,3" />
                      <line x1="100" y1="100" x2="135" y2="65" stroke="#FFD700" strokeWidth="2" opacity="0.2" strokeDasharray="3,3" />
                      
                      <circle cx="50" cy="150" r="15" fill="none" stroke="#FFD700" strokeWidth="2" opacity="0.3" strokeDasharray="3,3" />
                      <line x1="100" y1="100" x2="65" y2="135" stroke="#FFD700" strokeWidth="2" opacity="0.2" strokeDasharray="3,3" />
                      
                      <circle cx="150" cy="150" r="15" fill="none" stroke="#FFD700" strokeWidth="2" opacity="0.3" strokeDasharray="3,3" />
                      <line x1="100" y1="100" x2="135" y2="135" stroke="#FFD700" strokeWidth="2" opacity="0.2" strokeDasharray="3,3" />
                    </svg>
                  </div>
                  
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    {myFriends.length === 0 ? 'Start Your Network' : 'No Matches'}
                  </h2>
                  <p className="text-white/70 mb-6 text-sm md:text-base px-4">
                    {myFriends.length === 0 
                      ? 'Connect with friends to share milestones, celebrate achievements, and stay motivated together!'
                      : 'Try a different search term to find your friends'
                    }
                  </p>
                  {myFriends.length === 0 && (
                    <div className="space-y-4">
                      <Button
                        onClick={() => setActiveTab("find")}
                        className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0A1628] font-bold w-full sm:w-auto"
                        style={{ boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)' }}
                      >
                        <UserPlus className="w-5 h-5 mr-2" />
                        Find Friends
                      </Button>
                      
                      <div className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 border border-blue-500/30 rounded-xl p-4 md:p-6 text-left">
                        <h3 className="text-white font-bold mb-3 text-sm md:text-base">Why Connect?</h3>
                        <ul className="space-y-2 text-xs md:text-sm text-white/80">
                          <li className="flex items-start gap-2">
                            <span className="text-[#FFD700] flex-shrink-0 mt-0.5">•</span>
                            <span>Share and celebrate milestones together</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-[#FFD700] flex-shrink-0 mt-0.5">•</span>
                            <span>Stay motivated with friendly competition</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-[#FFD700] flex-shrink-0 mt-0.5">•</span>
                            <span>View your friends' progress on the leaderboard</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-[#FFD700] flex-shrink-0 mt-0.5">•</span>
                            <span>Build accountability and support</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFriends.map(conn => (
                  <FriendCard
                    key={conn.id}
                    connection={conn}
                    currentUserEmail={user.email}
                    onRemove={() => handleRemoveFriend(conn.id)}
                    onUpdate={(data) => updateConnectionMutation.mutate({ id: conn.id, data })}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === "find" && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                Send Friend Request
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-white mb-2 block text-sm md:text-base">Friend's Email</Label>
                  <Input
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="friend@example.com"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                
                <div>
                  <Label className="text-white mb-2 block text-sm md:text-base">Message (Optional)</Label>
                  <Textarea
                    value={searchMessage}
                    onChange={(e) => setSearchMessage(e.target.value)}
                    placeholder="Hi! Let's connect on NorthStar..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    rows={3}
                  />
                </div>
                
                <Button
                  onClick={handleSendRequest}
                  disabled={!searchEmail.trim() || createConnectionMutation.isPending}
                  className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0A1628] font-bold"
                >
                  <Send className="w-5 h-5 mr-2" />
                  {createConnectionMutation.isPending ? 'Sending...' : 'Send Request'}
                </Button>
              </div>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 md:p-6">
              <h3 className="text-base md:text-lg font-bold text-white mb-3">How It Works</h3>
              <ul className="space-y-2 text-sm text-white/80">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1 flex-shrink-0">1.</span>
                  <span>Enter your friend's email address and send a request</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1 flex-shrink-0">2.</span>
                  <span>They'll receive the request and can accept or decline</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1 flex-shrink-0">3.</span>
                  <span>Once accepted, you can view each other's public milestones</span>
                </li>
              </ul>
            </div>
          </div>
        )}
        
        {activeTab === "requests" && (
          <div className="space-y-6">
            {receivedRequests.length > 0 && (
              <div>
                <h3 className="text-base md:text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                  Received Requests ({receivedRequests.length})
                </h3>
                <div className="space-y-3">
                  {receivedRequests.map(request => (
                    <div
                      key={request.id}
                      className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 md:p-5"
                    >
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg md:text-xl font-bold flex-shrink-0">
                            {request.userId[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-bold break-all">{request.userId}</div>
                            <div className="text-white/60 text-xs md:text-sm">
                              Sent {format(new Date(request.created_date), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:flex gap-2 mt-4">
                        <Button
                          onClick={() => handleAcceptRequest(request.id)}
                          className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/40 font-bold"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => handleDeclineRequest(request.id)}
                          variant="ghost"
                          className="border border-white/20 text-white/60 hover:bg-white/10 hover:text-white"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Decline
                        </Button>
                        <Button
                          onClick={() => handleBlockUser(request.id)}
                          variant="ghost"
                          className="col-span-2 sm:col-span-1 border border-red-500/40 text-red-400 hover:bg-red-500/20"
                        >
                          <Shield className="w-4 h-4 mr-2 sm:mr-0" />
                          <span className="sm:hidden">Block</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {sentRequests.length > 0 && (
              <div>
                <h3 className="text-base md:text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Send className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
                  Sent Requests ({sentRequests.length})
                </h3>
                <div className="space-y-3">
                  {sentRequests.map(request => (
                    <div
                      key={request.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-white font-medium break-all">{request.friendEmail}</div>
                            <div className="text-white/60 text-xs">
                              Sent {format(new Date(request.created_date), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleCancelRequest(request.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:bg-red-500/20 w-full sm:w-auto"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {blockedUsers.length > 0 && (
              <div>
                <h3 className="text-base md:text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 md:w-5 md:h-5 text-red-400" />
                  Blocked Users ({blockedUsers.length})
                </h3>
                <div className="space-y-3">
                  {blockedUsers.map(blocked => {
                    const blockedEmail = blocked.userId === user?.email ? blocked.friendEmail : blocked.userId;
                    return (
                      <div
                        key={blocked.id}
                        className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Shield className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <span className="text-white font-medium break-all">{blockedEmail}</span>
                          </div>
                          <Button
                            onClick={() => deleteConnectionMutation.mutate(blocked.id)}
                            size="sm"
                            variant="ghost"
                            className="text-white/60 hover:text-white w-full sm:w-auto"
                          >
                            Unblock
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {receivedRequests.length === 0 && sentRequests.length === 0 && blockedUsers.length === 0 && (
              <div className="text-center py-12 md:py-16">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 max-w-md mx-auto">
                  <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <Clock className="w-10 h-10 md:w-12 md:h-12 text-white/40" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-2">All Caught Up!</h2>
                  <p className="text-white/70 text-sm md:text-base">No pending requests at the moment</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FriendCard({ connection, currentUserEmail, onRemove, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(connection.nickname || '');
  
  const friendEmail = connection.userId === currentUserEmail ? connection.friendEmail : connection.userId;
  const friendName = connection.userId === currentUserEmail ? connection.friendName : '';
  const displayName = connection.nickname || friendName || friendEmail;
  
  const handleSaveNickname = () => {
    onUpdate({ nickname });
    setIsEditing(false);
    toast.success('Nickname updated!');
  };
  
  const handleCancelEdit = () => {
    setNickname(connection.nickname || '');
    setIsEditing(false);
  };
  
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 hover:bg-white/10 transition-all">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-white text-xl md:text-2xl font-bold flex-shrink-0">
          {displayName[0].toUpperCase()}
        </div>
        
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Set a nickname..."
                className="bg-white/10 border-white/20 text-white"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveNickname}
                  size="sm"
                  className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/40"
                >
                  <Save className="w-3 h-3 mr-2" />
                  Save
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  size="sm"
                  variant="ghost"
                  className="flex-1 text-white/60 hover:text-white"
                >
                  <X className="w-3 h-3 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h4 className="text-white font-bold text-base md:text-lg break-all">{displayName}</h4>
                {connection.nickname && (
                  <span className="px-2 py-0.5 bg-[#FFD700]/20 border border-[#FFD700]/40 rounded-full text-[#FFD700] text-xs font-bold w-fit">
                    Nickname
                  </span>
                )}
              </div>
              <div className="text-white/60 text-sm mb-2 flex items-center gap-2 break-all">
                <Mail className="w-3 h-3 flex-shrink-0" />
                {friendEmail}
              </div>
              <div className="text-white/40 text-xs">
                Connected since {format(new Date(connection.created_date), 'MMM d, yyyy')}
              </div>
            </>
          )}
        </div>
        
        {!isEditing && (
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 sm:flex-none p-2 rounded-lg bg-white/10 border border-white/20 text-white/60 hover:text-[#FFD700] hover:bg-white/20 transition-all"
              aria-label="Edit nickname"
            >
              <Edit2 className="w-4 h-4 mx-auto sm:mx-0" />
            </button>
            <button
              onClick={onRemove}
              className="flex-1 sm:flex-none p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all"
              aria-label="Remove friend"
            >
              <Trash2 className="w-4 h-4 mx-auto sm:mx-0" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}