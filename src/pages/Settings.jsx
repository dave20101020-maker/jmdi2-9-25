import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HealthIntegrations from '@/components/HealthIntegrations';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('integrations');

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account preferences and integrations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="integrations">Health Integrations</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="mt-6">
          <HealthIntegrations />
        </TabsContent>

        <TabsContent value="account" className="mt-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Account Settings</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Account management features coming soon.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Preferences</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Notification and display preferences coming soon.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
