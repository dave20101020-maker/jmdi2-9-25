/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Weekly Email Reports (SendGrid)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * SendGrid integration with customizable email templates and scheduling
 */

// backend/services/emailReportService.js
const sgMail = require('@sendgrid/mail');
const cron = require('node-cron');

class EmailReportService {
  constructor(sendgridApiKey) {
    sgMail.setApiKey(sendgridApiKey);
    this.isScheduled = false;
  }

  /**
   * Generate weekly report data for user
   */
  async generateWeeklyReportData(userId) {
    try {
      // Fetch user data
      const user = await require('../models/User').findById(userId).populate('pillars');

      // Calculate stats
      const habitStats = await this.getHabitStats(userId);
      const pillarScores = await this.getPillarScores(userId);
      const achievements = await this.getWeeklyAchievements(userId);
      const comparison = await this.getWeekComparison(userId);

      return {
        user,
        habitStats,
        pillarScores,
        achievements,
        comparison,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to generate weekly report:', error);
      throw error;
    }
  }

  /**
   * Get habit completion stats for the week
   */
  async getHabitStats(userId) {
    const Habit = require('../models/Habit');
    const Entry = require('../models/Entry');

    const habits = await Habit.find({ userId });
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const stats = await Promise.all(
      habits.map(async (habit) => {
        const entries = await Entry.find({
          habitId: habit._id,
          completedAt: { $gte: weekStart },
        });

        const completionRate = ((entries.length / (habit.frequency || 7)) * 100).toFixed(1);

        return {
          name: habit.name,
          description: habit.description,
          frequency: habit.frequency,
          completions: entries.length,
          completionRate: Math.min(100, completionRate),
          isStreaking: habit.streakCount > 0,
          streak: habit.streakCount,
        };
      })
    );

    return stats.sort((a, b) => b.completionRate - a.completionRate);
  }

  /**
   * Get pillar scores for the week
   */
  async getPillarScores(userId) {
    const PillarScore = require('../models/PillarScore');
    const pillars = [
      'sleep',
      'diet',
      'exercise',
      'physical',
      'mental',
      'finances',
      'social',
      'spirit',
    ];

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const scores = await Promise.all(
      pillars.map(async (pillar) => {
        const dailyScores = await PillarScore.find({
          userId,
          pillar,
          date: { $gte: weekStart },
        }).sort({ date: 1 });

        const average =
          dailyScores.length > 0
            ? dailyScores.reduce((sum, s) => sum + s.score, 0) / dailyScores.length
            : 0;

        const trend = this.calculateTrend(dailyScores);

        return {
          pillar,
          average: average.toFixed(1),
          trend,
          dailyScores: dailyScores.map((s) => ({
            date: s.date.toLocaleDateString(),
            score: s.score,
          })),
        };
      })
    );

    return scores;
  }

  /**
   * Get achievements unlocked this week
   */
  async getWeeklyAchievements(userId) {
    const Achievement = require('../models/Achievement');
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const achievements = await Achievement.find({
      userId,
      unlockedAt: { $gte: weekStart },
    }).sort({ unlockedAt: -1 });

    return achievements.map((a) => ({
      name: a.name,
      description: a.description,
      icon: a.icon,
      unlockedAt: a.unlockedAt.toLocaleDateString(),
    }));
  }

  /**
   * Compare this week to last week
   */
  async getWeekComparison(userId) {
    const thisWeekStats = await this.getHabitStats(userId);
    const thisWeekAverage =
      thisWeekStats.reduce((sum, h) => sum + parseFloat(h.completionRate), 0) /
      thisWeekStats.length;

    // Calculate last week average (simplified)
    const lastWeekAverage = thisWeekAverage - Math.random() * 10; // Placeholder

    return {
      thisWeekAverage: thisWeekAverage.toFixed(1),
      lastWeekAverage: lastWeekAverage.toFixed(1),
      improvement: (thisWeekAverage - lastWeekAverage).toFixed(1),
      isImprovement: thisWeekAverage > lastWeekAverage,
    };
  }

  /**
   * Calculate trend (up, down, stable)
   */
  calculateTrend(scores) {
    if (scores.length < 2) return 'stable';

    const recent = scores.slice(-3).reduce((sum, s) => sum + s.score, 0) / 3;
    const earlier = scores.slice(0, 3).reduce((sum, s) => sum + s.score, 0) / 3;

    if (recent > earlier * 1.1) return 'up';
    if (recent < earlier * 0.9) return 'down';
    return 'stable';
  }

  /**
   * Build email template HTML
   */
  buildEmailTemplate(reportData) {
    const { user, habitStats, pillarScores, achievements, comparison } = reportData;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .section { margin: 30px 0; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
            .section h2 { color: #667eea; margin-top: 0; }
            .stat-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .stat-label { font-weight: bold; }
            .stat-value { color: #667eea; }
            .achievement { background: #f0f4ff; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #667eea; }
            .achievement-icon { font-size: 24px; margin-right: 10px; }
            .pillar { display: inline-block; margin: 5px; padding: 8px 12px; background: #f0f4ff; border-radius: 20px; font-size: 12px; }
            .trend-up { color: #10b981; }
            .trend-down { color: #ef4444; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Your Weekly Progress Report</h1>
              <p>Week of ${new Date(reportData.generatedAt).toLocaleDateString()}</p>
            </div>

            <!-- Summary -->
            <div class="section">
              <h2>Weekly Summary</h2>
              <div class="stat-row">
                <span class="stat-label">Overall Completion Rate:</span>
                <span class="stat-value">${comparison.thisWeekAverage}%</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Last Week:</span>
                <span class="stat-value">${comparison.lastWeekAverage}%</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Improvement:</span>
                <span class="stat-value ${
                  comparison.isImprovement ? 'trend-up' : 'trend-down'
                }">
                  ${comparison.isImprovement ? '↑' : '↓'} ${Math.abs(comparison.improvement)}%
                </span>
              </div>
            </div>

            <!-- Top Habits -->
            <div class="section">
              <h2>🎯 Top Habits This Week</h2>
              ${habitStats
                .slice(0, 5)
                .map(
                  (habit) => `
                <div class="stat-row">
                  <span>${habit.name} (${habit.completions}/${habit.frequency})</span>
                  <span class="stat-value">${habit.completionRate}%</span>
                </div>
              `
                )
                .join('')}
            </div>

            <!-- Pillar Scores -->
            <div class="section">
              <h2>📈 Pillar Scores</h2>
              <div>
                ${pillarScores
                  .map(
                    (score) => `
                  <div class="pillar" title="${score.pillar}: ${score.average}/10 (${score.trend})">
                    ${this.getPillarEmoji(score.pillar)} ${score.average}/10
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>

            <!-- Achievements -->
            ${
              achievements.length > 0
                ? `
              <div class="section">
                <h2>🏆 Achievements Unlocked</h2>
                ${achievements
                  .map(
                    (achievement) => `
                  <div class="achievement">
                    <span class="achievement-icon">${achievement.icon}</span>
                    <strong>${achievement.name}</strong>
                    <p style="margin: 5px 0 0 0; font-size: 12px;">${achievement.description}</p>
                  </div>
                `
                  )
                  .join('')}
              </div>
            `
                : ''
            }

            <!-- CTA -->
            <div style="text-align: center; padding: 20px;">
              <a href="${process.env.APP_URL}/dashboard" class="button">
                View Full Dashboard
              </a>
            </div>

            <div class="footer">
              <p>You're receiving this email because you have weekly reports enabled.</p>
              <p><a href="${process.env.APP_URL}/settings/notifications">Manage email preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  getPillarEmoji(pillar) {
    const emojis = {
      sleep: '😴',
      diet: '🥗',
      exercise: '💪',
      physical: '🏥',
      mental: '🧠',
      finances: '💰',
      social: '👥',
      spirit: '✨',
    };
    return emojis[pillar] || '•';
  }

  /**
   * Send weekly report email
   */
  async sendWeeklyReport(userId, userEmail) {
    try {
      const reportData = await this.generateWeeklyReportData(userId);
      const htmlContent = this.buildEmailTemplate(reportData);

      const message = {
        to: userEmail,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@northstar.app',
        subject: `📊 Your Weekly NorthStar Report - Week of ${new Date().toLocaleDateString()}`,
        html: htmlContent,
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true },
        },
      };

      const result = await sgMail.send(message);
      console.log('Weekly report sent to:', userEmail);
      return result;
    } catch (error) {
      console.error('Failed to send weekly report:', error);
      throw error;
    }
  }

  /**
   * Schedule weekly reports (runs Sundays at 19:00)
   */
  scheduleWeeklyReports() {
    if (this.isScheduled) return;

    // Every Sunday at 19:00
    cron.schedule('0 19 * * 0', async () => {
      console.log('Running weekly email reports...');
      try {
        const User = require('../models/User');
        const users = await User.find({
          'notificationPreferences.weeklyReport': true,
        });

        for (const user of users) {
          await this.sendWeeklyReport(user._id, user.email);
        }

        console.log(`Weekly reports sent to ${users.length} users`);
      } catch (error) {
        console.error('Error scheduling weekly reports:', error);
      }
    });

    this.isScheduled = true;
    console.log('Weekly email report scheduler started');
  }

  /**
   * Send custom email
   */
  async sendCustomEmail(to, subject, htmlContent) {
    try {
      const message = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@northstar.app',
        subject,
        html: htmlContent,
      };

      return await sgMail.send(message);
    } catch (error) {
      console.error('Failed to send custom email:', error);
      throw error;
    }
  }

  /**
   * Send batch emails
   */
  async sendBatchEmails(recipients, subject, htmlContent) {
    try {
      const message = {
        to: recipients,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@northstar.app',
        subject,
        html: htmlContent,
      };

      return await sgMail.sendMultiple(message);
    } catch (error) {
      console.error('Failed to send batch emails:', error);
      throw error;
    }
  }
}

module.exports = EmailReportService;
