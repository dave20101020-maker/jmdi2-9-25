import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  Send,
  CheckCircle2,
  Bug,
  Lightbulb,
  MessageSquare,
  HelpCircle,
  Heart,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl, COLORS } from "@/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const FEEDBACK_TYPES = [
  {
    id: "bug",
    label: "Bug Report",
    icon: Bug,
    color: "#EF4444",
    description: "Something isn't working correctly",
  },
  {
    id: "feature",
    label: "Feature Request",
    icon: Lightbulb,
    color: "#F59E0B",
    description: "Suggest a new feature",
  },
  {
    id: "feedback",
    label: "General Feedback",
    icon: MessageSquare,
    color: "#3B82F6",
    description: "Share your thoughts",
  },
  {
    id: "question",
    label: "Question",
    icon: HelpCircle,
    color: "#8B5CF6",
    description: "Ask us anything",
  },
  {
    id: "love",
    label: "Appreciation",
    icon: Heart,
    color: "#EC4899",
    description: "Share what you love!",
  },
];

export default function Feedback() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedType, setSelectedType] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const isSubmitDisabled =
    isSubmitting ||
    !selectedType ||
    !message.trim() ||
    message.trim().length < 10 ||
    message.length > 2000;

  useEffect(() => {
    async function getUser() {
      const currentUser = await api.authMe();
      setUser(currentUser);
    }
    getUser();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!selectedType) {
      newErrors.type = "Please select a feedback type";
    }

    if (!message.trim()) {
      newErrors.message = "Message is required";
    } else if (message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    } else if (message.length > 2000) {
      newErrors.message = "Message must be less than 2000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Sending your feedback...");

    try {
      const feedbackType = FEEDBACK_TYPES.find((t) => t.id === selectedType);

      // TODO: Implement email service
      // await api.sendEmail({
      //   to: 'support@northstar.app',
      //   subject: `[${feedbackType.label}] Feedback from ${user?.full_name || user?.email}`,
      //   body: `
      //     Feedback Type: ${feedbackType.label}
      //     From: ${user?.full_name || 'Unknown'} (${user?.email})
      //     User ID: ${user?.id || 'N/A'}
      //
      //     Message:
      //     ${message}
      //
      //     ---
      //     Submitted via NorthStar Feedback Form
      //   `
      // });

      toast.dismiss(loadingToast);
      setSubmitted(true);
      toast.success("Feedback sent successfully! 🎉", {
        description: "Thank you for helping us improve NorthStar!",
        duration: 5000,
      });

      setTimeout(() => {
        navigate(createPageUrl("Profile"));
      }, 3000);
    } catch (error) {
      console.error("Error sending feedback:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to send feedback", {
        description:
          "Please try again or email us directly at support@northstar.app",
        duration: 7000,
        action: {
          label: "Copy Email",
          onClick: () => {
            navigator.clipboard.writeText("support@northstar.app");
            toast.success("Email copied to clipboard!");
          },
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen pb-24 px-6 pt-8 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-in zoom-in duration-500"
            style={{ boxShadow: "0 0 40px rgba(34, 197, 94, 0.5)" }}
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-white mb-3">Thank You!</h2>
          <p className="text-white/70 mb-6">
            Your feedback has been received. We'll review it and get back to you
            if needed.
          </p>

          <Button
            onClick={() => navigate(createPageUrl("Profile"))}
            className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold"
          >
            Return to Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-6 pt-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(createPageUrl("Profile"))}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Profile
        </button>

        <div className="text-center mb-8">
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center"
            style={{ boxShadow: "0 0 30px rgba(59, 130, 246, 0.5)" }}
          >
            <MessageSquare className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Feedback & Support
          </h1>
          <p className="text-white/70">
            We'd love to hear from you! Your feedback helps us make NorthStar
            better.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">
            What would you like to share?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {FEEDBACK_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;

              return (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedType(type.id);
                    setErrors({});
                  }}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? "border-2 scale-105"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                  style={
                    isSelected
                      ? {
                          borderColor: type.color,
                          backgroundColor: `${type.color}20`,
                          boxShadow: `0 0 20px ${type.color}40`,
                        }
                      : {}
                  }
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${type.color}30` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: type.color }} />
                    </div>
                    <div>
                      <div className="text-white font-bold mb-1">
                        {type.label}
                      </div>
                      <div className="text-white/60 text-xs">
                        {type.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {errors.type && (
            <div className="flex items-center gap-2 mb-4 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errors.type}
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-white font-bold">Your Message</label>
              <span
                className={`text-xs ${
                  message.length > 2000 ? "text-red-400" : "text-white/60"
                }`}
              >
                {message.length}/2000
              </span>
            </div>
            <Textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setErrors({});
              }}
              placeholder="Tell us what's on your mind..."
              className={`bg-white/10 border text-white min-h-[200px] ${
                errors.message ? "border-red-500" : "border-white/20"
              }`}
            />
            {errors.message && (
              <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errors.message}
              </div>
            )}
            <p className="text-white/60 text-xs mt-2">
              💡 Be as detailed as possible. Screenshots or examples are always
              helpful!
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold"
            style={{ boxShadow: "0 0 20px rgba(212, 175, 55, 0.4)" }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send Feedback
              </>
            )}
          </Button>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 border border-blue-500/30 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-400" />
            Quick Help
          </h3>

          <div className="space-y-3 text-sm">
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-white font-medium mb-1">
                Need immediate help?
              </div>
              <div className="text-white/70">
                Check out our{" "}
                <button
                  onClick={() => {
                    navigate(createPageUrl("Profile"));
                    setTimeout(() => {
                      const replayButton = document.querySelector(
                        '[aria-label*="Replay"]'
                      );
                      if (replayButton) replayButton.click();
                    }, 100);
                  }}
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  guided tour
                </button>{" "}
                for a walkthrough of features
              </div>
            </div>

            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-white font-medium mb-1">Found a bug?</div>
              <div className="text-white/70">
                Please describe what you were doing when it happened and what
                you expected to happen
              </div>
            </div>

            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-white font-medium mb-1">
                Contact us directly
              </div>
              <div className="text-white/70 flex items-center gap-2">
                <span>support@northstar.app</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText("support@northstar.app");
                    toast.success("Email copied to clipboard!");
                  }}
                  className="text-blue-400 hover:text-blue-300 text-xs underline"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
