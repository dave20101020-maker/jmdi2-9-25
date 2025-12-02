import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Users, Calendar, TrendingUp, MessageSquare, Send } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";

export default function ChallengeCard({ challenge, user, onJoin, onLeave, onUpdate }) {
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const [progressValue, setProgressValue] = useState("");

  const isParticipant = challenge.participants?.some(p => p.email === user?.email);
  const isCreator = challenge.createdBy === user?.email;
  const userParticipant = challenge.participants?.find(p => p.email === user?.email);

  const daysLeft = differenceInDays(new Date(challenge.endDate), new Date());
  const isActive = daysLeft >= 0;
  
  const avgProgress = challenge.participants?.length > 0
    ? challenge.participants.reduce((sum, p) => sum + (p.progress || 0), 0) / challenge.participants.length
    : 0;

  const categoryColors = {
    fitness: "#FF5733",
    mindfulness: "#7C3AED",
    learning: "#4CC9F0",
    creativity: "#FFD700",
    social: "#FF69B4",
    health: "#52B788",
    productivity: "#4169E1",
    other: "#808080"
  };

  const handlePostUpdate = () => {
    if (!updateMessage.trim() && !progressValue) {
      toast.error('Please add a message or progress update');
      return;
    }

    const updates = challenge.updates || [];
    const newUpdate = {
      userId: user.email,
      userName: user.full_name,
      message: updateMessage.trim(),
      timestamp: new Date().toISOString()
    };

    let newParticipants = [...challenge.participants];
    if (progressValue) {
      const participantIndex = newParticipants.findIndex(p => p.email === user.email);
      if (participantIndex >= 0) {
        newParticipants[participantIndex].progress = parseFloat(progressValue);
      }
    }

    onUpdate(challenge.id, {
      updates: [...updates, newUpdate],
      participants: newParticipants
    });

    setUpdateMessage("");
    setProgressValue("");
    setShowUpdateForm(false);
    toast.success('Update posted! 📢');
  };

  return (
    <div 
      className="bg-[#1a1f35] border border-white/20 rounded-2xl p-5 hover:bg-white/5 transition-all"
      style={{ boxShadow: `0 0 20px ${categoryColors[challenge.category]}20` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ 
              backgroundColor: `${categoryColors[challenge.category]}20`,
              boxShadow: `0 0 10px ${categoryColors[challenge.category]}40`
            }}
          >
            {challenge.emoji || "🎯"}
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg">{challenge.title}</h3>
            <p className="text-white/60 text-sm capitalize">{challenge.category}</p>
          </div>
        </div>
        {isActive && (
          <div className="px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-full">
            <span className="text-green-400 text-xs font-bold">{daysLeft}d left</span>
          </div>
        )}
      </div>

      <p className="text-white/80 text-sm mb-4">{challenge.description}</p>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/70 text-sm">Group Progress</span>
          <span className="font-bold" style={{ color: categoryColors[challenge.category] }}>
            {avgProgress.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{
              width: `${avgProgress}%`,
              backgroundColor: categoryColors[challenge.category]
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-white/60" />
            <span className="text-white/60 text-xs">Participants</span>
          </div>
          <div className="text-white font-bold">{challenge.participants?.length || 0}</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-white/60" />
            <span className="text-white/60 text-xs">Duration</span>
          </div>
          <div className="text-white font-bold text-sm">
            {format(new Date(challenge.startDate), 'MMM d')} - {format(new Date(challenge.endDate), 'MMM d')}
          </div>
        </div>
      </div>

      {/* User Progress (if participant) */}
      {isParticipant && userParticipant && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-blue-400 text-xs mb-1">Your Progress</div>
              <div className="text-white font-bold">{userParticipant.progress || 0}%</div>
            </div>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
        </div>
      )}

      {/* Recent Updates */}
      {challenge.updates?.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-white/60" />
            <span className="text-white/70 text-sm font-medium">Recent Updates</span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {challenge.updates.slice(-3).reverse().map((update, idx) => (
              <div key={idx} className="bg-white/5 rounded-lg p-2 text-sm">
                <div className="text-white/60 text-xs mb-1">
                  <span className="font-bold text-white">{update.userName}</span>
                  {' • '}
                  {format(new Date(update.timestamp), 'MMM d, h:mm a')}
                </div>
                <div className="text-white/80">{update.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {!isParticipant && isActive && (
          <Button
            onClick={() => onJoin(challenge.id)}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold"
          >
            <Users className="w-4 h-4 mr-2" />
            Join Challenge
          </Button>
        )}

        {isParticipant && !showUpdateForm && (
          <Button
            onClick={() => setShowUpdateForm(true)}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Post Update
          </Button>
        )}

        {showUpdateForm && (
          <div className="space-y-2 border border-white/20 rounded-lg p-3">
            <Input
              type="number"
              value={progressValue}
              onChange={(e) => setProgressValue(e.target.value)}
              placeholder="Update progress % (optional)"
              className="bg-white/10 border-white/20 text-white"
            />
            <Input
              value={updateMessage}
              onChange={(e) => setUpdateMessage(e.target.value)}
              placeholder="Share your progress or thoughts..."
              className="bg-white/10 border-white/20 text-white"
            />
            <div className="flex gap-2">
              <Button
                onClick={handlePostUpdate}
                size="sm"
                className="flex-1 bg-blue-500/20 text-blue-400 border border-blue-500/40"
              >
                <Send className="w-4 h-4 mr-2" />
                Post
              </Button>
              <Button
                onClick={() => setShowUpdateForm(false)}
                size="sm"
                variant="outline"
                className="border-white/20 text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isParticipant && !isCreator && (
          <Button
            onClick={() => {
              if (confirm('Leave this challenge?')) {
                onLeave(challenge.id);
              }
            }}
            variant="outline"
            size="sm"
            className="w-full border-red-500/40 text-red-400 hover:bg-red-500/20"
          >
            Leave Challenge
          </Button>
        )}
      </div>
    </div>
  );
}