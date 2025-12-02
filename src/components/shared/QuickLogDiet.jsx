import { api } from "@/utils/apiClient";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MEAL_OPTIONS = [
  { value: 8, label: 'Balanced', emoji: '🥗', color: '#52B788', description: 'Nutritious & well-rounded' },
  { value: 6, label: 'Light', emoji: '🍃', color: '#4CC9F0', description: 'Lighter portions or snacks' },
  { value: 5, label: 'Heavy', emoji: '🍔', color: '#FF7F50', description: 'Indulgent or large meal' }
];

export default function QuickLogDiet({ onSuccess, yesterdayValue = null, user }) {
  const [selectedMeal, setSelectedMeal] = useState(yesterdayValue || 8);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      let photoUrl = null;
      
      // Upload photo if provided
      if (photoFile) {
        setUploading(true);
        // TODO: Implement file upload
        // const uploadResult = await api.uploadFile({
        //   file: photoFile
        // });
        // photoUrl = uploadResult.file_url;
        setUploading(false);
      }
      
      // Calculate score
      const waterScore = 70; // Default mid-range
      const score = Math.round(selectedMeal * 10 * 0.6 + waterScore * 0.4);
      
      // Create entry
      const today = new Date().toISOString().split('T')[0];
      await api.createEntry({
        pillar: 'diet',
        date: today,
        score: score,
        meal_quality: selectedMeal,
        water_glasses: 6,
        notes: photoUrl ? `Meal photo: ${photoUrl}` : 'Quick log entry',
        created_by: user.email
      });
      
      setSaving(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving diet entry:', error);
      setSaving(false);
      alert('Failed to save entry. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Select Chips */}
      <div>
        <h3 className="text-white font-bold mb-3">How was your meal?</h3>
        <div className="grid grid-cols-3 gap-3">
          {MEAL_OPTIONS.map((option) => (
            <motion.button
              key={option.value}
              onClick={() => setSelectedMeal(option.value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                selectedMeal === option.value
                  ? 'border-white/60 bg-white/20'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
              style={selectedMeal === option.value ? {
                borderColor: option.color,
                backgroundColor: `${option.color}20`,
                boxShadow: `0 0 20px ${option.color}40`
              } : {}}
            >
              {selectedMeal === option.value && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-[#0A1628]" />
                </div>
              )}
              <div className="text-center">
                <div className="text-3xl mb-2">{option.emoji}</div>
                <div className="text-white font-bold text-sm mb-1">{option.label}</div>
                <div className="text-white/60 text-xs">{option.description}</div>
              </div>
            </motion.button>
          ))}
        </div>
        {yesterdayValue && (
          <p className="text-white/40 text-xs mt-2 text-center">
            Yesterday: {MEAL_OPTIONS.find(o => o.value === yesterdayValue)?.label || 'N/A'}
          </p>
        )}
      </div>

      {/* Photo Upload */}
      <div>
        <h3 className="text-white font-bold mb-3">Add meal photo (optional)</h3>
        <div className="flex gap-3">
          <label className="flex-1 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all">
              <Camera className="w-5 h-5" />
              <span className="text-sm font-medium">Take Photo</span>
            </div>
          </label>
          
          <label className="flex-1 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all">
              <Upload className="w-5 h-5" />
              <span className="text-sm font-medium">Upload</span>
            </div>
          </label>
        </div>

        {photoPreview && (
          <div className="mt-4 relative">
            <img
              src={photoPreview}
              alt="Meal preview"
              className="w-full h-48 object-cover rounded-xl"
            />
            <button
              onClick={() => {
                setPhotoFile(null);
                setPhotoPreview(null);
              }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving || uploading}
        className="w-full bg-gradient-to-r from-[#52B788] to-[#4CC9F0] text-white font-bold hover:shadow-lg py-6 text-lg"
        style={{ boxShadow: '0 0 20px rgba(82, 183, 136, 0.4)' }}
      >
        {uploading ? 'Uploading photo...' : saving ? 'Saving...' : 'Log Meal'}
      </Button>
    </div>
  );
}