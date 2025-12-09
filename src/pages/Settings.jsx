import React, { useEffect, useState, useContext } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HealthIntegrations from "@/components/HealthIntegrations";
import { AppSettingsContext } from "@/context/AppSettingsContext.jsx";

export default function Settings() {
  const { settings, setSetting } = useContext(AppSettingsContext);
  const [activeTab, setActiveTab] = useState("integrations");
  const [reduceMotion, setReduceMotion] = useState(settings.reduceMotion);
  const [theme, setTheme] = useState(settings.theme);
  const [notifications, setNotifications] = useState(settings.notifications);
  const [persona, setPersona] = useState(
    settings.aiCoach?.persona || "Supportive Guide"
  );
  const [tone, setTone] = useState(settings.aiCoach?.tone || "warm");
  const [model, setModel] = useState(settings.aiCoach?.model || "default");

  useEffect(() => {
    setSetting("reduceMotion", reduceMotion);
  }, [reduceMotion, setSetting]);
  useEffect(() => {
    setSetting("theme", theme);
  }, [theme, setSetting]);
  useEffect(() => {
    setSetting("notifications", notifications);
  }, [notifications, setSetting]);
  useEffect(() => {
    setSetting("aiCoach", { persona, tone, model });
  }, [persona, tone, model, setSetting]);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-white/60">
          Manage your account preferences and integrations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integrations">Health Integrations</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="ai">AI Coach</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="mt-6">
          <HealthIntegrations />
        </TabsContent>

        <TabsContent value="account" className="mt-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Account Settings</h2>
            <p className="text-white/60">
              Account management features coming soon.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Preferences</h2>
            <div className="flex items-center justify-between bg-white/5 dark:bg-white/10 border border-white/10 rounded-2xl p-4">
              <div>
                <div className="text-sm font-medium">Reduced Motion</div>
                <div className="text-xs text-white/60">
                  Minimize animations for comfort and battery life.
                </div>
              </div>
              <button
                type="button"
                className="px-3 py-1 rounded-full bg-white/10 text-sm text-white hover:bg-white/15"
                aria-pressed={reduceMotion}
                onClick={() => setReduceMotion((v) => !v)}
              >
                {reduceMotion ? "On" : "Off"}
              </button>
            </div>
            <div className="flex items-center justify-between bg-white/5 dark:bg-white/10 border border-white/10 rounded-2xl p-4">
              <div>
                <div className="text-sm font-medium">Theme</div>
                <div className="text-xs text-white/60">
                  Choose light, dark, or follow system.
                </div>
              </div>
              <select
                className="bg-transparent border border-white/20 rounded-lg px-2 py-1 text-sm"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div className="flex items-center justify-between bg-white/5 dark:bg-white/10 border border-white/10 rounded-2xl p-4">
              <div>
                <div className="text-sm font-medium">Notifications</div>
                <div className="text-xs text-white/60">
                  Enable in-app notifications.
                </div>
              </div>
              <button
                type="button"
                className="px-3 py-1 rounded-full bg-white/10 text-sm text-white hover:bg-white/15"
                aria-pressed={notifications}
                onClick={() => setNotifications((v) => !v)}
              >
                {notifications ? "On" : "Off"}
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">AI Coach Settings</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-white/5 dark:bg-white/10 border border-white/10 rounded-2xl p-4">
                <div className="text-sm font-medium mb-2">Persona</div>
                <input
                  type="text"
                  className="w-full bg-transparent border border-white/20 rounded-lg px-2 py-1 text-sm"
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  placeholder="e.g., Supportive Guide"
                />
              </div>
              <div className="bg-white/5 dark:bg-white/10 border border-white/10 rounded-2xl p-4">
                <div className="text-sm font-medium mb-2">Tone</div>
                <select
                  className="w-full bg-transparent border border-white/20 rounded-lg px-2 py-1 text-sm"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                >
                  <option value="warm">Warm</option>
                  <option value="neutral">Neutral</option>
                  <option value="direct">Direct</option>
                </select>
              </div>
              <div className="bg-white/5 dark:bg-white/10 border border-white/10 rounded-2xl p-4 md:col-span-2">
                <div className="text-sm font-medium mb-2">Model</div>
                <select
                  className="w-full bg-transparent border border-white/20 rounded-lg px-2 py-1 text-sm"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  <option value="default">Default</option>
                  <option value="fast">Fast (cheaper)</option>
                  <option value="accurate">Accurate (slower)</option>
                </select>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
