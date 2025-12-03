/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Push Notifications System
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * OneSignal/Firebase integration with smart scheduling and notification UI
 */

// src/notifications/pushNotificationManager.js
import React, { useEffect, useState } from 'react';

/**
 * Push Notification Manager
 */
export class PushNotificationManager {
  static async initializeOneSignal(appId) {
    try {
      // Load OneSignal SDK
      window.OneSignal = window.OneSignal || [];
      window.OneSignal.push(function () {
        window.OneSignal.init({
          appId: appId,
          allowLocalhostAsSecureOrigin: true,
        });
      });

      // Request permission
      const permission = await window.OneSignal.Notifications.requestPermission();
      return permission;
    } catch (error) {
      console.error('OneSignal initialization failed:', error);
    }
  }

  static async initializeFirebase(config) {
    try {
      const messaging = await import('firebase/messaging').then((m) => m.getMessaging());
      const token = await messaging.getToken({
        vapidKey: config.vapidKey,
      });
      return token;
    } catch (error) {
      console.error('Firebase messaging initialization failed:', error);
    }
  }

  static async sendNotification(title, options = {}) {
    try {
      if (window.OneSignal) {
        await window.OneSignal.Notifications.sendNotification({
          headings: { en: title },
          contents: { en: options.body || '' },
          data: options.data || {},
          channelId: options.channelId || 'default',
        });
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  static scheduleNotification(title, options = {}) {
    const { delay = 0, repeat, channelId = 'default' } = options;

    if (repeat) {
      // Schedule recurring notification
      return setInterval(
        () => this.sendNotification(title, options),
        delay
      );
    } else {
      // Schedule one-time notification
      return setTimeout(
        () => this.sendNotification(title, options),
        delay
      );
    }
  }

  static cancelScheduledNotification(id) {
    clearTimeout(id);
    clearInterval(id);
  }

  static async subscribe(userId, preferences = {}) {
    try {
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          preferences,
        }),
      });
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
    }
  }

  static async unsubscribe(userId) {
    try {
      await fetch(`/api/notifications/unsubscribe/${userId}`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to unsubscribe from notifications:', error);
    }
  }

  static async updatePreferences(userId, preferences) {
    try {
      await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          preferences,
        }),
      });
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
    }
  }
}

/**
 * Predefined notification templates
 */
export const NotificationTemplates = {
  habitReminder: (habitName) => ({
    title: `Time to ${habitName}!`,
    body: `Don't break your streak. Complete your habit now!`,
    icon: '🎯',
    data: { type: 'habit_reminder' },
  }),

  achievementUnlocked: (achievement) => ({
    title: `🏆 Achievement Unlocked!`,
    body: `You've earned "${achievement}"`,
    data: { type: 'achievement' },
  }),

  streakMilestone: (habit, days) => ({
    title: `🔥 ${days}-Day Streak!`,
    body: `Amazing work on "${habit}"!`,
    data: { type: 'milestone', habit, days },
  }),

  friendChallenge: (friendName, challenge) => ({
    title: `⚡ ${friendName} challenged you!`,
    body: `Take on the "${challenge}" challenge!`,
    data: { type: 'challenge', friendName },
  }),

  leaderboardUpdate: (rank, total) => ({
    title: `📊 Leaderboard Update`,
    body: `You're now ranked #${rank} out of ${total}!`,
    data: { type: 'leaderboard', rank },
  }),

  meditationReminder: () => ({
    title: `🧘 Time to Meditate`,
    body: `Your scheduled meditation is ready`,
    data: { type: 'meditation' },
  }),

  weeklyReport: () => ({
    title: `📈 Your Weekly Report`,
    body: `See how you've progressed this week!`,
    data: { type: 'weekly_report' },
  }),

  pillarsCheckIn: () => ({
    title: `✅ Time for Your Daily Check-in`,
    body: `Update your progress across all pillars`,
    data: { type: 'checkin' },
  }),

  friendActivity: (friendName, activity) => ({
    title: `👥 ${friendName} ${activity}`,
    body: `Check out what they accomplished!`,
    data: { type: 'friend_activity', friendName },
  }),

  motivationalQuote: (quote) => ({
    title: `💡 Daily Inspiration`,
    body: quote,
    data: { type: 'motivation' },
  }),
};

/**
 * Push Notification UI Component
 */
export const NotificationCenter = ({ notifications = [], onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 space-y-2 z-50 max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg text-white animate-slide-in ${
            notification.type === 'error'
              ? 'bg-red-500'
              : notification.type === 'success'
              ? 'bg-green-500'
              : notification.type === 'warning'
              ? 'bg-yellow-500'
              : 'bg-blue-500'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {notification.title && (
                <h4 className="font-semibold">{notification.title}</h4>
              )}
              {notification.body && (
                <p className="text-sm mt-1">{notification.body}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(notification.id)}
              className="flex-shrink-0 text-white hover:opacity-75"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Hook for managing notifications
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const notify = (title, options = {}) => {
    const id = Date.now();
    const notification = {
      id,
      title,
      body: options.body,
      type: options.type || 'info',
      duration: options.duration || 5000,
    };

    setNotifications((prev) => [...prev, notification]);

    // Auto-dismiss after duration
    if (options.duration !== Infinity) {
      setTimeout(() => {
        dismiss(id);
      }, options.duration);
    }

    return id;
  };

  const dismiss = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const success = (title, body = '') =>
    notify(title, { body, type: 'success', duration: 3000 });

  const error = (title, body = '') =>
    notify(title, { body, type: 'error', duration: 5000 });

  const warning = (title, body = '') =>
    notify(title, { body, type: 'warning', duration: 4000 });

  const info = (title, body = '') =>
    notify(title, { body, type: 'info', duration: 4000 });

  return {
    notifications,
    notify,
    dismiss,
    success,
    error,
    warning,
    info,
  };
};

/**
 * Notification Scheduler Component
 */
export const NotificationScheduler = () => {
  const [schedule, setSchedule] = useState({
    habitReminders: true,
    habitReminderTime: '08:00',
    dailyCheckIn: true,
    dailyCheckInTime: '20:00',
    weeklyReport: true,
    weeklyReportDay: 'Sunday',
    weeklyReportTime: '19:00',
    meditationReminder: false,
    meditationReminderTime: '07:00',
    friendUpdates: true,
    achievementNotifications: true,
    leaderboardUpdates: true,
  });

  const handleScheduleChange = (field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveSchedule = async () => {
    try {
      await PushNotificationManager.updatePreferences(
        // Get userId from context/auth
        'userId',
        schedule
      );
    } catch (error) {
      console.error('Failed to save schedule:', error);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <h3 className="text-lg font-semibold">Notification Preferences</h3>

      {/* Habit Reminders */}
      <div className="space-y-2">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={schedule.habitReminders}
            onChange={(e) => handleScheduleChange('habitReminders', e.target.checked)}
          />
          <span>Daily habit reminders</span>
        </label>
        {schedule.habitReminders && (
          <input
            type="time"
            value={schedule.habitReminderTime}
            onChange={(e) => handleScheduleChange('habitReminderTime', e.target.value)}
            className="ml-6 px-3 py-2 border border-gray-300 rounded-lg"
          />
        )}
      </div>

      {/* Daily Check-in */}
      <div className="space-y-2">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={schedule.dailyCheckIn}
            onChange={(e) => handleScheduleChange('dailyCheckIn', e.target.checked)}
          />
          <span>Daily pillar check-in reminder</span>
        </label>
        {schedule.dailyCheckIn && (
          <input
            type="time"
            value={schedule.dailyCheckInTime}
            onChange={(e) => handleScheduleChange('dailyCheckInTime', e.target.value)}
            className="ml-6 px-3 py-2 border border-gray-300 rounded-lg"
          />
        )}
      </div>

      {/* Weekly Report */}
      <div className="space-y-2">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={schedule.weeklyReport}
            onChange={(e) => handleScheduleChange('weeklyReport', e.target.checked)}
          />
          <span>Weekly progress report</span>
        </label>
        {schedule.weeklyReport && (
          <div className="ml-6 flex gap-2">
            <select
              value={schedule.weeklyReportDay}
              onChange={(e) => handleScheduleChange('weeklyReportDay', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
                (day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                )
              )}
            </select>
            <input
              type="time"
              value={schedule.weeklyReportTime}
              onChange={(e) => handleScheduleChange('weeklyReportTime', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Other toggles */}
      <div className="space-y-2">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={schedule.friendUpdates}
            onChange={(e) => handleScheduleChange('friendUpdates', e.target.checked)}
          />
          <span>Friend activity updates</span>
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={schedule.achievementNotifications}
            onChange={(e) => handleScheduleChange('achievementNotifications', e.target.checked)}
          />
          <span>Achievement notifications</span>
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={schedule.leaderboardUpdates}
            onChange={(e) => handleScheduleChange('leaderboardUpdates', e.target.checked)}
          />
          <span>Leaderboard ranking updates</span>
        </label>
      </div>

      <button
        onClick={saveSchedule}
        className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Save Preferences
      </button>
    </div>
  );
};

export default {
  PushNotificationManager,
  NotificationTemplates,
  NotificationCenter,
  useNotifications,
  NotificationScheduler,
};
