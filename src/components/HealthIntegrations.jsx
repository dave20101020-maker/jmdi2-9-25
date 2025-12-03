import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, CheckCircle, Clock } from "lucide-react";

/**
 * Health Integrations Component
 *
 * Displays all wearable device integrations (active and coming soon)
 * Placeholders for: Apple HealthKit, Oura, WHOOP, Garmin
 */

const IntegrationCard = ({ integration }) => {
  const isComingSoon = integration.status === "coming_soon";
  const isConnected = integration.status === "connected";

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Logo placeholder */}
            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl">
              {integration.icon || "📱"}
            </div>
            <div>
              <CardTitle className="text-lg">{integration.name}</CardTitle>
              <CardDescription className="text-sm">
                {integration.description}
              </CardDescription>
            </div>
          </div>

          {/* Status Badge */}
          <div>
            {isConnected && (
              <Badge
                variant="success"
                className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            )}
            {isComingSoon && (
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
              >
                <Clock className="w-3 h-3 mr-1" />
                Coming Soon
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {integration.info}
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isConnected ? "outline" : "default"}
                  disabled={isComingSoon}
                  className="ml-4"
                >
                  {isConnected ? "Disconnect" : "Connect"}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-sm">
                  {isComingSoon
                    ? integration.comingSoonMessage ||
                      "This integration is not yet available. We're working on it!"
                    : isConnected
                    ? "Disconnect this integration"
                    : "Connect your account to sync health data"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Additional requirements info for coming soon integrations */}
        {isComingSoon && integration.requiresOAuth && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Requires OAuth implementation
                {integration.requiresBusinessAgreement &&
                  " and business partnership agreement"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

IntegrationCard.propTypes = {
  integration: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    icon: PropTypes.string,
    status: PropTypes.string.isRequired,
    info: PropTypes.string,
    requiresOAuth: PropTypes.bool,
    requiresBusinessAgreement: PropTypes.bool,
    comingSoonMessage: PropTypes.string,
  }).isRequired,
};

export default function HealthIntegrations() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Define all integrations (active + coming soon)
    const allIntegrations = [
      // Coming Soon integrations
      {
        id: "healthconnect",
        name: "Health Connect",
        description: "Android health data platform",
        icon: "🤖",
        status: "coming_soon",
        info: "Steps, heart rate, sleep, nutrition",
        requiresOAuth: false,
        requiresBusinessAgreement: false,
        comingSoonMessage:
          "Health Connect integration requires an Android app. We're working on mobile support!",
      },
      {
        id: "fitbit",
        name: "Fitbit",
        description: "Connect your Fitbit devices",
        icon: "⌚",
        status: "coming_soon",
        info: "Activity, sleep, heart rate data",
        requiresOAuth: true,
        requiresBusinessAgreement: false,
        comingSoonMessage:
          "Fitbit integration requires OAuth setup. Coming soon!",
      },
      {
        id: "strava",
        name: "Strava",
        description: "Sync your athletic activities",
        icon: "🏃",
        status: "coming_soon",
        info: "Running, cycling, workout data",
        requiresOAuth: true,
        requiresBusinessAgreement: false,
        comingSoonMessage:
          "Strava integration requires OAuth implementation. In development!",
      },
      {
        id: "apple",
        name: "Apple HealthKit",
        description: "Sync data from Apple Health app",
        icon: "🍎",
        status: "coming_soon",
        info: "Steps, heart rate, sleep, workouts",
        requiresOAuth: false,
        requiresBusinessAgreement: true,
        comingSoonMessage:
          "Apple HealthKit integration requires an iOS app with HealthKit entitlements. We're working on the mobile app!",
      },
      {
        id: "oura",
        name: "Oura Ring",
        description: "Connect your Oura Ring",
        icon: "💍",
        status: "coming_soon",
        info: "Sleep, readiness, activity scores",
        requiresOAuth: true,
        requiresBusinessAgreement: false,
        comingSoonMessage:
          "Oura integration requires OAuth setup and API access. Coming soon!",
      },
      {
        id: "whoop",
        name: "WHOOP",
        description: "Sync WHOOP strap data",
        icon: "📊",
        status: "coming_soon",
        info: "Strain, recovery, sleep performance",
        requiresOAuth: true,
        requiresBusinessAgreement: false,
        comingSoonMessage:
          "WHOOP integration requires OAuth implementation. We're building it!",
      },
      {
        id: "garmin",
        name: "Garmin Connect",
        description: "Connect Garmin devices",
        icon: "🏃",
        status: "coming_soon",
        info: "Activities, health stats, wellness",
        requiresOAuth: true,
        requiresBusinessAgreement: true,
        comingSoonMessage:
          "Garmin integration requires OAuth and a Garmin Developer Agreement. In progress!",
      },
    ];

    setIntegrations(allIntegrations);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading integrations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Health Integrations</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Connect your wearable devices and health apps to automatically sync
          your data with NorthStar.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>

      {/* Info box */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                More integrations coming soon
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                We&apos;re actively working on adding support for more wearable
                devices and health platforms. Check back regularly for updates,
                or let us know which integrations you&apos;d like to see next!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
