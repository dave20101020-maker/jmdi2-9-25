import { api } from "@/utils/apiClient";
import * as aiClient from "@/api/aiClient";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, FileText, Lightbulb, X, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { toast } from "sonner";

const CONTENT_TYPES = {
  quick_read: {
    icon: BookOpen,
    label: "2-Min Quick Read",
    prompt: (pillar) => `Generate a 2-minute quick read article about ${pillar}. Focus on actionable tips or an interesting insight. Keep it concise and engaging for a user wanting rapid insights to improve this pillar. Use markdown format. Maximum 200 words. Include a catchy title.`,
    color: "#FF6B9D"
  },
  blog: {
    icon: FileText,
    label: "5-Min Blog Post",
    prompt: (pillar) => `Generate a 5-minute blog post (around 500 words) about ${pillar}. Cover a specific aspect like 'the importance of X' or 'how to overcome Y challenge'. Provide practical, evidence-based advice with an encouraging tone. Use markdown format with headers and bullet points. Include a compelling title.`,
    color: "#4ECDC4"
  },
  fact: {
    icon: Lightbulb,
    label: "Quick Fact",
    prompt: (pillar) => `Provide one surprising, lesser-known, or scientifically-backed fact about ${pillar} and its impact on overall wellbeing. Keep it to 1-2 sentences maximum. Make it memorable and insightful.`,
    color: "#FFD93D"
  }
};

export default function AIContentButtons({ pillar, pillarName, color = "#D4AF37" }) {
  const [selectedType, setSelectedType] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  const loadContent = async (type) => {
    setSelectedType(type);
    setLoading(true);
    
    try {
      // Try to get existing content from today
      const today = format(new Date(), 'yyyy-MM-dd');
      const existing = await api.getPillarContent({
        pillar,
        contentType: type,
        generatedDate: today
      });

      if (existing.length > 0) {
        setContent(existing[0]);
      } else {
        // Generate new content
        await generateNewContent(type);
      }
    } catch (error) {
      console.error("Error loading content:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewContent = async (type) => {
    setLoading(true);
    try {
      const prompt = CONTENT_TYPES[type].prompt(pillarName);
      
      // Use aiClient to send message to orchestrator
      const result = await aiClient.sendMessage({
        message: prompt,
        pillar: pillar
      });

      // Check for crisis response
      if (result.isCrisis) {
        toast.error('Crisis detected. Please reach out for support.');
        return;
      }

      // Check for error
      if (result.error) {
        toast.error(result.message || 'Failed to generate content');
        return;
      }

      let title, mainContent;
      const responseText = result.text;
      
      if (type === 'fact') {
        title = "Did You Know?";
        mainContent = responseText;
      } else {
        // Extract title from markdown (first # heading)
        const lines = responseText.split('\n');
        const titleLine = lines.find(line => line.startsWith('#'));
        title = titleLine ? titleLine.replace(/^#+\s*/, '') : `${pillarName} Insight`;
        mainContent = lines.filter(line => !line.startsWith('#')).join('\n').trim();
      }

      const newContent = {
        title,
        content: mainContent,
        pillar,
        contentType: type,
        generatedDate: format(new Date(), 'yyyy-MM-dd')
      };

      setContent(newContent);
      toast.success('Content generated successfully!');
    } catch (error) {
      console.error("Error generating content:", error);
      toast.error('Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedType(null);
    setContent(null);
  };

  // Handle ESC key and focus trap
  useEffect(() => {
    if (!selectedType) return;

    const handleEsc = (e) => {
      if (e.key === 'Escape') closeModal();
    };

    const handleKeyDown = (e) => {
      if (!modalRef.current) return;
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleEsc);
    document.addEventListener('keydown', handleKeyDown);
    
    // Focus close button on modal open
    if (closeButtonRef.current) {
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedType]);

  return (
    <>
      <div className="grid grid-cols-3 gap-3 mb-6" role="group" aria-label="Content type options">
        {Object.entries(CONTENT_TYPES).map(([type, config]) => {
          const Icon = config.icon;
          return (
            <motion.button
              key={type}
              onClick={() => loadContent(type)}
              aria-label={`Load ${config.label}`}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all group focus:outline-none focus:ring-2 focus:ring-white"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              style={{ boxShadow: `0 0 15px ${config.color}20` }}
            >
              <Icon className="w-6 h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" style={{ color: config.color }} aria-hidden="true" />
              <p className="text-white text-xs font-medium text-center">{config.label}</p>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedType && (
          <motion.div
            role="presentation"
            aria-hidden="true"
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-labelledby="content-title"
              aria-modal="true"
              className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-[#1a1f35] border-b border-white/10 p-5 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  {React.createElement(CONTENT_TYPES[selectedType].icon, {
                    className: "w-6 h-6",
                    style: { color: CONTENT_TYPES[selectedType].color },
                    "aria-hidden": "true"
                  })}
                  <h2 id="content-title" className="text-xl font-bold text-white">{CONTENT_TYPES[selectedType].label}</h2>
                </div>
                <div className="flex items-center gap-2">
                  {content && !loading && (
                    <Button
                      onClick={() => generateNewContent(selectedType)}
                      variant="ghost"
                      size="sm"
                      aria-label="Generate new content"
                      className="text-white/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  )}
                  <button
                    ref={closeButtonRef}
                    onClick={closeModal}
                    className="text-white/60 hover:text-white transition-colors rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="Close dialog (press Escape)"
                    title="Close (Escape)"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" style={{ color }} />
                    <p className="text-white/60">Generating personalized content...</p>
                  </div>
                ) : content ? (
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-4">{content.title}</h3>
                    {selectedType === 'fact' ? (
                      <p className="text-white/80 text-lg leading-relaxed">{content.content}</p>
                    ) : (
                      <ReactMarkdown
                        className="prose prose-invert prose-sm max-w-none"
                        components={{
                          h1: ({children}) => <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>,
                          h2: ({children}) => <h2 className="text-xl font-bold text-white mb-3 mt-6">{children}</h2>,
                          h3: ({children}) => <h3 className="text-lg font-semibold text-white mb-2 mt-4">{children}</h3>,
                          p: ({children}) => <p className="text-white/80 mb-4 leading-relaxed">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside text-white/80 mb-4 space-y-2">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside text-white/80 mb-4 space-y-2">{children}</ol>,
                          strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                        }}
                      >
                        {content.content}
                      </ReactMarkdown>
                    )}
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
