import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/components/shared/Utils";
import { Check, X, Crown, Zap, TrendingUp, Download, Palette, Gift, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addDays } from "date-fns";
import { toast } from "sonner";

const FREE_FEATURES = [
  { text: "Track all 8 pillars", included: true },
  { text: "Unlimited daily entries", included: true },
  { text: "Basic dashboard", included: true },
  { text: "Last 30 days of data", included: true },
  { text: "Simple analytics", included: true },
  { text: "Basic AI coaching (5 messages/day)", included: true },
  { text: "1 active goal at a time", included: true },
  { text: "Advanced analytics & insights", included: false },
  { text: "Data export (CSV, PDF, JSON)", included: false },
  { text: "Unlimited AI coaching", included: false },
  { text: "Streak freezes", included: false },
  { text: "Ad-free experience", included: false },
];

const PREMIUM_FEATURES = [
  { icon: "💬", title: "Unlimited AI Coaching", desc: "Talk to your AI coaches anytime, unlimited messages" },
  { icon: "📊", title: "Advanced Analytics", desc: "Correlation insights, predictive trends, custom date ranges" },
  { icon: "📥", title: "Data Export", desc: "Download your data in CSV, PDF, or JSON anytime" },
  { icon: "🎯", title: "Multiple Goals", desc: "Track up to 10 active goals simultaneously" },
  { icon: "🧊", title: "Streak Freezes", desc: "3 freeze days per month to protect your streak" },
  { icon: "🎨", title: "Custom Themes", desc: "Dark Galaxy, Ocean Depths, Forest Zen, and more" },
  { icon: "⚡", title: "Priority AI Response", desc: "Faster, more detailed coach responses" },
  { icon: "🚫", title: "Ad-Free", desc: "Clean, distraction-free experience" },
  { icon: "🔔", title: "Weekly PDF Reports", desc: "Comprehensive progress summaries" },
  { icon: "👑", title: "Premium Badge", desc: "Show your commitment on leaderboards" },
];

const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes! Cancel anytime in your profile settings. No questions asked."
  },
  {
    q: "What happens if I cancel?",
    a: "You'll keep all your data and revert to the free tier. Your entries, goals, and progress stay with you forever."
  },
  {
    q: "Is there a discount?",
    a: "Yes! Our annual plan saves you 33% compared to monthly billing - that's $40 in savings per year."
  },
  {
    q: "Can I switch between plans?",
    a: "Absolutely! Upgrade or downgrade at any time. Changes take effect immediately."
  },
  {
    q: "Do you offer refunds?",
    a: "Yes! 30-day money-back guarantee if you're not satisfied. No hassle, just email us."
  },
  {
    q: "Is my data safe?",
    a: "Your data is encrypted, private, and belongs to you. We never share or sell your information."
  }
];

export default function Upgrade() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startingTrial, setStartingTrial] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('annual'); // 'monthly' or 'annual'
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    async function getData() {
      const currentUser = await api.authMe();
      setUser(currentUser);
      
      const subs = await api.getSubscription({ userId: currentUser.email });
      if (subs.length > 0) {
        setSubscription(subs[0]);
      }
      
      setLoading(false);
    }
    getData();
  }, []);

  const handleStartTrial = async () => {
    setStartingTrial(true);
    try {
      const trialEnd = addDays(new Date(), 7);
      
      if (subscription) {
        await api.updateSubscription(subscription.id, {
          tier: 'Trial',
          status: 'trial',
          trialEndDate: format(trialEnd, 'yyyy-MM-dd'),
          trialUsed: true
        });
      } else {
        await api.createSubscription({
          userId: user.email,
          tier: 'Trial',
          status: 'trial',
          startDate: format(new Date(), 'yyyy-MM-dd'),
          trialEndDate: format(trialEnd, 'yyyy-MM-dd'),
          trialUsed: true
        });
      }
      
      toast.success("Welcome to Premium! 🌟", {
        description: "Your 7-day free trial has started"
      });
      
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Failed to start trial:", error);
      toast.error("Failed to start trial. Please try again.");
    }
    setStartingTrial(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-white/60 text-base">Loading...</div>
      </div>
    );
  }

  const isPremium = subscription?.tier === 'Premium' && subscription?.status === 'active';
  const isTrial = subscription?.tier === 'Trial' && subscription?.status === 'trial';
  const hasUsedTrial = subscription?.trialUsed;

  if (isPremium) {
    return (
      <div className="min-h-screen pb-24 px-6 pt-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center"
            style={{ boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' }}
          >
            <Crown className="w-12 h-12 text-[#0A1628]" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-3">You're Premium! 👑</h1>
          <p className="text-white/70 mb-8 text-base">
            Enjoying the full NorthStar experience with all premium features unlocked.
          </p>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <h3 className="text-white font-bold mb-4 text-lg">Your Premium Benefits:</h3>
            <div className="grid md:grid-cols-2 gap-3 text-left">
              {PREMIUM_FEATURES.map((feature, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-xl">{feature.icon}</span>
                  <div>
                    <div className="text-white font-medium text-sm">{feature.title}</div>
                    <div className="text-white/60 text-xs">{feature.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Button
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="btn-primary px-8 py-6 text-base"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (isTrial) {
    const daysLeft = subscription?.trialEndDate 
      ? Math.ceil((new Date(subscription.trialEndDate) - new Date()) / (1000 * 60 * 60 * 24))
      : 0;

    return (
      <div className="min-h-screen pb-24 px-6 pt-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-pulse"
            style={{ boxShadow: '0 0 40px rgba(16, 185, 129, 0.6)' }}
          >
            <Zap className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-3">Your Premium Trial 🎉</h1>
          <p className="text-2xl font-bold text-green-400 mb-2">{daysLeft} days remaining</p>
          <p className="text-white/70 mb-8 text-base">
            You're experiencing the full power of NorthStar Premium!
          </p>
          
          <div className="bg-gradient-to-r from-[#D4AF37]/20 to-[#F4D03F]/20 border border-[#D4AF37]/40 rounded-2xl p-6 mb-6">
            <h3 className="text-white font-bold mb-4 text-lg">Continue Your Journey</h3>
            <p className="text-white/80 mb-4 text-base">
              Don't lose access to unlimited AI coaching, advanced analytics, and all premium features.
            </p>
            
            <div className="flex gap-3 mb-4">
              <div className="flex-1 p-4 bg-white/5 border border-white/10 rounded-xl text-left">
                <div className="text-xs text-white/60 mb-1">Monthly</div>
                <div className="text-2xl font-bold text-white">$9.99</div>
                <div className="text-xs text-white/60">per month</div>
              </div>
              
              <div className="flex-1 p-4 bg-gradient-to-br from-[#D4AF37]/20 to-[#F4D03F]/20 border-2 border-[#D4AF37] rounded-xl text-left relative">
                <div className="absolute -top-2 right-2 px-2 py-0.5 bg-[#D4AF37] text-[#0A1628] text-xs font-bold rounded-full">
                  SAVE 33%
                </div>
                <div className="text-xs text-white/60 mb-1">Annual</div>
                <div className="text-2xl font-bold text-white">$79.99</div>
                <div className="text-xs text-white/60">$6.67/month</div>
              </div>
            </div>
            
            <p className="text-sm text-white/60 mb-4">
              Payment details will be added when trial ends. Cancel anytime before then.
            </p>
            
            <Button
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="btn-primary w-full py-6 text-base"
            >
              Continue with Trial
            </Button>
          </div>
          
          <button
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="text-white/60 hover:text-white text-sm"
          >
            I'll decide later
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-6 pt-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-full text-[#D4AF37] text-sm font-bold mb-4">
            TRANSFORM YOUR LIFE
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Unlock Your Full Potential
          </h1>
          <p className="text-xl text-white/70 mb-6">
            Get unlimited AI coaching, advanced insights, and premium features
          </p>
          {!hasUsedTrial && (
            <p className="text-green-400 font-bold text-lg">
              🎉 Start your 7-day free trial today!
            </p>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Monthly Plan */}
          <div className={`bg-white/5 border rounded-2xl p-8 transition-all ${
            selectedPlan === 'monthly' ? 'border-[#D4AF37] shadow-lg' : 'border-white/10'
          }`}
            style={selectedPlan === 'monthly' ? { boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)' } : {}}
          >
            <div className="text-center mb-6">
              <h3 className="text-white font-bold text-xl mb-2">Monthly</h3>
              <div className="text-5xl font-bold text-white mb-1">$9.99</div>
              <div className="text-white/60 text-sm">per month</div>
            </div>
            
            <Button
              onClick={() => setSelectedPlan('monthly')}
              className={`w-full mb-4 py-6 text-base font-bold ${
                selectedPlan === 'monthly' ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {selectedPlan === 'monthly' ? 'Selected' : 'Select Monthly'}
            </Button>
            
            <div className="text-xs text-white/60 text-center">
              Billed monthly • Cancel anytime
            </div>
          </div>

          {/* Annual Plan - RECOMMENDED */}
          <div className="bg-gradient-to-br from-[#D4AF37]/20 to-[#F4D03F]/20 border-2 border-[#D4AF37] rounded-2xl p-8 relative"
            style={{ boxShadow: '0 0 40px rgba(212, 175, 55, 0.4)' }}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] rounded-full text-[#0A1628] text-xs font-bold">
              BEST VALUE • SAVE 33%
            </div>
            
            <div className="text-center mb-6">
              <h3 className="text-white font-bold text-xl mb-2">Annual</h3>
              <div className="text-5xl font-bold text-white mb-1">$79.99</div>
              <div className="text-white/60 text-sm mb-1">per year</div>
              <div className="text-[#D4AF37] text-base font-bold">Only $6.67/month</div>
              <div className="text-green-400 text-sm mt-2">💰 Save $40 per year</div>
            </div>
            
            <Button
              onClick={() => setSelectedPlan('annual')}
              className="btn-primary w-full mb-4 py-6 text-base"
            >
              {selectedPlan === 'annual' ? 'Selected ✓' : 'Select Annual'}
            </Button>
            
            <div className="text-xs text-white/60 text-center">
              Billed annually • Cancel anytime
            </div>
          </div>
        </div>

        {/* Trial CTA */}
        {!hasUsedTrial && (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 border border-green-500/40 rounded-2xl p-8 mb-12 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Try Premium Free for 7 Days</h2>
            <p className="text-white/70 mb-6 text-base">
              Full access to all premium features. No credit card required. Cancel anytime.
            </p>
            <Button
              onClick={handleStartTrial}
              disabled={startingTrial}
              className="btn-primary px-12 py-6 text-lg"
            >
              {startingTrial ? 'Starting Trial...' : 'Start Free Trial'}
            </Button>
            <p className="text-white/50 text-xs mt-3">
              After trial, choose a plan or continue with free tier
            </p>
          </div>
        )}

        {/* Feature Comparison */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Premium Features</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {PREMIUM_FEATURES.map((feature, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/8 transition-all">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{feature.icon}</div>
                  <div>
                    <h3 className="text-white font-bold mb-1">{feature.title}</h3>
                    <p className="text-white/70 text-sm">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Comparison Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Feature Comparison</h2>
          <div className="space-y-3">
            {FREE_FEATURES.map((feature, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                <span className="text-white text-sm">{feature.text}</span>
                <div className="flex items-center gap-4">
                  <div className="w-20 text-center">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-400 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-white/30 mx-auto" />
                    )}
                    <div className="text-xs text-white/60 mt-1">Free</div>
                  </div>
                  <div className="w-20 text-center">
                    <Check className="w-5 h-5 text-[#D4AF37] mx-auto" />
                    <div className="text-xs text-[#D4AF37] mt-1">Premium</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Proof */}
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/40 rounded-2xl p-8 mb-12 text-center">
          <h3 className="text-white font-bold text-xl mb-4">Join 1,247 Premium Members</h3>
          <p className="text-white/80 mb-6 text-base">
            "NorthStar Premium transformed my daily routine. The AI coaching is like having a personal wellness team!"
          </p>
          <div className="text-[#D4AF37]">⭐⭐⭐⭐⭐</div>
          <p className="text-white/60 text-sm mt-2">Sarah K., Premium Member</p>
        </div>

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-all"
                >
                  <span className="text-white font-bold text-base">{faq.q}</span>
                  {expandedFaq === i ? (
                    <ChevronUp className="w-5 h-5 text-white/60" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/60" />
                  )}
                </button>
                {expandedFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-white/80 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Trust Signals */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-8 text-white/60 text-sm mb-4">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Secure payment
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              30-day guarantee
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Cancel in 1 click
            </div>
          </div>
        </div>

        {/* Final CTA */}
        {!hasUsedTrial ? (
          <div className="text-center">
            <Button
              onClick={handleStartTrial}
              disabled={startingTrial}
              className="btn-primary px-12 py-6 text-lg mb-3"
            >
              {startingTrial ? 'Starting...' : 'Start 7-Day Free Trial'}
            </Button>
            <p className="text-white/50 text-sm">
              No payment required • Cancel anytime
            </p>
          </div>
        ) : (
          <div className="text-center">
            <Button
              onClick={() => toast.info("Payment integration coming soon!")}
              className="btn-primary px-12 py-6 text-lg mb-3"
            >
              Upgrade to Premium
            </Button>
            <p className="text-white/50 text-sm">
              You've already used your free trial
            </p>
          </div>
        )}
      </div>
    </div>
  );
}