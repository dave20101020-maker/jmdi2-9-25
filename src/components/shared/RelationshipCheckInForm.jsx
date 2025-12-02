import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Save, Heart, Star, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const RELATIONSHIP_TYPES = [
  { value: "family", label: "Family", emoji: "👨‍👩‍👧‍👦", color: "#FF5733" },
  { value: "friend", label: "Friend", emoji: "👥", color: "#FFD700" },
  { value: "partner", label: "Partner", emoji: "💑", color: "#FF69B4" },
  { value: "colleague", label: "Colleague", emoji: "💼", color: "#4CC9F0" },
  { value: "mentor", label: "Mentor", emoji: "🎓", color: "#7C3AED" },
  { value: "other", label: "Other", emoji: "🤝", color: "#52B788" }
];

export default function RelationshipCheckInForm({ onClose, onSave }) {
  const [checkIn, setCheckIn] = useState({
    person: "",
    relationshipType: "friend",
    connectionStrength: 7,
    satisfactionLevel: 7,
    lastContact: "",
    whatWorking: "",
    whatNeeds: "",
    actionItems: [],
    gratitude: ""
  });
  const [saving, setSaving] = useState(false);
  const [actionInput, setActionInput] = useState("");

  const addActionItem = () => {
    if (actionInput.trim()) {
      setCheckIn({
        ...checkIn,
        actionItems: [...checkIn.actionItems, actionInput.trim()]
      });
      setActionInput("");
    }
  };

  const removeActionItem = (index) => {
    setCheckIn({
      ...checkIn,
      actionItems: checkIn.actionItems.filter((_, i) => i !== index)
    });
  };

  const handleSave = async () => {
    if (!checkIn.person.trim()) {
      toast.error('Please enter the person\'s name');
      return;
    }

    setSaving(true);
    try {
      await onSave(checkIn);
      toast.success('Check-in saved! 💚');
    } catch (error) {
      toast.error('Failed to save check-in');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1f35] border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Heart className="w-7 h-7 text-pink-400" />
            Relationship Check-In
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Person & Type */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white mb-2 block">Person *</Label>
              <Input
                value={checkIn.person}
                onChange={(e) => setCheckIn({ ...checkIn, person: e.target.value })}
                placeholder="Who is this check-in about?"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-white mb-2 block">Last Contact</Label>
              <Input
                value={checkIn.lastContact}
                onChange={(e) => setCheckIn({ ...checkIn, lastContact: e.target.value })}
                placeholder="e.g., Yesterday, Last week"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>

          {/* Relationship Type */}
          <div>
            <Label className="text-white mb-3 block">Relationship Type *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {RELATIONSHIP_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setCheckIn({ ...checkIn, relationshipType: type.value })}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    checkIn.relationshipType === type.value
                      ? 'border-2 scale-105'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  style={checkIn.relationshipType === type.value ? {
                    backgroundColor: `${type.color}20`,
                    borderColor: type.color
                  } : {}}
                >
                  <div className="text-2xl mb-1">{type.emoji}</div>
                  <div className="text-white text-sm font-bold">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Connection Strength */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-white">Connection Strength *</Label>
              <span className="text-pink-400 font-bold text-lg">{checkIn.connectionStrength}/10</span>
            </div>
            <div className="flex gap-1 md:gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <button
                  key={num}
                  onClick={() => setCheckIn({ ...checkIn, connectionStrength: num })}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all text-xs md:text-sm ${
                    checkIn.connectionStrength === num
                      ? 'bg-pink-500 text-white scale-110'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="text-xs text-white/60 mt-2 text-center">
              How strong is your connection?
            </div>
          </div>

          {/* Satisfaction Level */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-white">Satisfaction Level *</Label>
              <span className="text-green-400 font-bold text-lg">{checkIn.satisfactionLevel}/10</span>
            </div>
            <div className="flex gap-1 md:gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <button
                  key={num}
                  onClick={() => setCheckIn({ ...checkIn, satisfactionLevel: num })}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all text-xs md:text-sm ${
                    checkIn.satisfactionLevel === num
                      ? 'bg-green-500 text-white scale-110'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="text-xs text-white/60 mt-2 text-center">
              How satisfied are you with this relationship?
            </div>
          </div>

          {/* What's Working */}
          <div>
            <Label className="text-white mb-2 block flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              What's Working Well
            </Label>
            <Textarea
              value={checkIn.whatWorking}
              onChange={(e) => setCheckIn({ ...checkIn, whatWorking: e.target.value })}
              placeholder="What do you appreciate about this relationship?"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              rows={3}
            />
          </div>

          {/* What Needs Attention */}
          <div>
            <Label className="text-white mb-2 block">What Needs Attention</Label>
            <Textarea
              value={checkIn.whatNeeds}
              onChange={(e) => setCheckIn({ ...checkIn, whatNeeds: e.target.value })}
              placeholder="What could be improved or needs more focus?"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              rows={3}
            />
          </div>

          {/* Action Items */}
          <div>
            <Label className="text-white mb-2 block">Action Items</Label>
            <div className="flex gap-2 mb-3">
              <Input
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addActionItem()}
                placeholder="What will you do to strengthen this relationship?"
                className="bg-white/10 border-white/20 text-white flex-1"
              />
              <Button
                onClick={addActionItem}
                size="sm"
                className="bg-blue-500/20 text-blue-400 border border-blue-500/40"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {checkIn.actionItems.length > 0 && (
              <div className="space-y-2">
                {checkIn.actionItems.map((action, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-white/5 rounded-lg p-3">
                    <span className="text-blue-400">•</span>
                    <span className="text-white/80 text-sm flex-1">{action}</span>
                    <button
                      onClick={() => removeActionItem(idx)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gratitude */}
          <div>
            <Label className="text-white mb-2 block flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-400" />
              Gratitude
            </Label>
            <Textarea
              value={checkIn.gratitude}
              onChange={(e) => setCheckIn({ ...checkIn, gratitude: e.target.value })}
              placeholder="What do you appreciate most about this person?"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Complete Check-In'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}