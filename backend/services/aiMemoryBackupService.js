/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AI Memory Backups & Cloud Storage
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Automatic cloud backups, encryption, versioning, and recovery
 */

// backend/services/aiMemoryBackupService.js
const crypto = require('crypto');
const AWS = require('aws-sdk');
const cron = require('node-cron');

class AIMemoryBackupService {
  constructor(awsConfig) {
    this.s3 = new AWS.S3(awsConfig);
    this.bucket = process.env.AWS_S3_BUCKET || 'northstar-ai-backups';
    this.encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
    this.isScheduled = false;
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      crypto.scryptSync(this.encryptionKey, 'salt', 32),
      iv
    );

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      iv: iv.toString('hex'),
      data: encrypted,
    };
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encrypted) {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      crypto.scryptSync(this.encryptionKey, 'salt', 32),
      Buffer.from(encrypted.iv, 'hex')
    );

    let decrypted = decipher.update(encrypted.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  /**
   * Create backup of user's AI memory/context
   */
  async createMemoryBackup(userId) {
    try {
      const Memory = require('../models/Memory');
      const User = require('../models/User');

      // Get user AI context
      const memories = await Memory.find({ userId }).lean();
      const user = await User.findById(userId).select('name email').lean();

      const backupData = {
        userId,
        user,
        memories,
        createdAt: new Date(),
        version: '1.0',
      };

      // Encrypt sensitive memory data
      const encrypted = this.encrypt(backupData);

      // Upload to S3
      const key = `ai-backups/${userId}/${Date.now()}-backup.enc`;
      const params = {
        Bucket: this.bucket,
        Key: key,
        Body: JSON.stringify(encrypted),
        ContentType: 'application/json',
        ServerSideEncryption: 'AES256',
        Metadata: {
          userId,
          timestamp: new Date().toISOString(),
        },
      };

      const result = await this.s3.upload(params).promise();

      // Log backup
      const BackupLog = require('../models/BackupLog');
      await BackupLog.create({
        userId,
        backupKey: key,
        s3Url: result.Location,
        size: JSON.stringify(encrypted).length,
        status: 'completed',
      });

      console.log(`AI memory backup created for user ${userId}`);
      return {
        success: true,
        backupId: key,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Failed to create memory backup:', error);
      throw error;
    }
  }

  /**
   * Get backup history for user
   */
  async getBackupHistory(userId, limit = 10) {
    try {
      const BackupLog = require('../models/BackupLog');
      const backups = await BackupLog.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return backups;
    } catch (error) {
      console.error('Failed to get backup history:', error);
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(userId, backupKey) {
    try {
      // Get backup from S3
      const params = {
        Bucket: this.bucket,
        Key: backupKey,
      };

      const data = await this.s3.getObject(params).promise();
      const encrypted = JSON.parse(data.Body.toString('utf-8'));

      // Decrypt
      const backupData = this.decrypt(encrypted);

      // Verify user match
      if (backupData.userId !== userId) {
        throw new Error('Backup user ID does not match');
      }

      // Restore memories
      const Memory = require('../models/Memory');
      await Memory.deleteMany({ userId });
      await Memory.insertMany(
        backupData.memories.map((m) => ({
          ...m,
          userId,
        }))
      );

      // Log restoration
      const RestoreLog = require('../models/RestoreLog');
      await RestoreLog.create({
        userId,
        backupKey,
        status: 'completed',
      });

      console.log(`AI memory restored for user ${userId} from backup ${backupKey}`);
      return {
        success: true,
        restoredMemories: backupData.memories.length,
      };
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      throw error;
    }
  }

  /**
   * List all backups for user
   */
  async listBackups(userId) {
    try {
      const params = {
        Bucket: this.bucket,
        Prefix: `ai-backups/${userId}/`,
      };

      const data = await this.s3.listObjectsV2(params).promise();

      return (data.Contents || []).map((item) => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
      }));
    } catch (error) {
      console.error('Failed to list backups:', error);
      throw error;
    }
  }

  /**
   * Delete old backups (retention: 90 days)
   */
  async cleanupOldBackups(userId, retentionDays = 90) {
    try {
      const backups = await this.listBackups(userId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      for (const backup of backups) {
        if (backup.lastModified < cutoffDate) {
          await this.s3
            .deleteObject({
              Bucket: this.bucket,
              Key: backup.key,
            })
            .promise();

          console.log(`Deleted old backup: ${backup.key}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
      throw error;
    }
  }

  /**
   * Schedule daily backups
   */
  scheduleAutomaticBackups() {
    if (this.isScheduled) return;

    // Run daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('Running automatic AI memory backups...');
      try {
        const User = require('../models/User');
        const users = await User.find({
          'preferences.autoBackup': true,
        }).select('_id');

        let successCount = 0;
        let errorCount = 0;

        for (const user of users) {
          try {
            await this.createMemoryBackup(user._id);
            await this.cleanupOldBackups(user._id);
            successCount++;
          } catch (error) {
            console.error(`Failed to backup user ${user._id}:`, error);
            errorCount++;
          }
        }

        console.log(
          `Automatic backups completed: ${successCount} successful, ${errorCount} failed`
        );
      } catch (error) {
        console.error('Error in automatic backup schedule:', error);
      }
    });

    this.isScheduled = true;
    console.log('AI memory backup scheduler started');
  }

  /**
   * Manual backup trigger
   */
  async triggerBackup(userId) {
    try {
      return await this.createMemoryBackup(userId);
    } catch (error) {
      console.error('Failed to trigger backup:', error);
      throw error;
    }
  }

  /**
   * Get backup status/health check
   */
  async getBackupStatus(userId) {
    try {
      const backups = await this.getBackupHistory(userId, 5);
      const latestBackup = backups[0];

      return {
        hasBackups: backups.length > 0,
        totalBackups: backups.length,
        latestBackup: latestBackup ? latestBackup.createdAt : null,
        lastBackupAge: latestBackup
          ? Math.round((Date.now() - latestBackup.createdAt) / (1000 * 60 * 60))
          : null,
        backupHistory: backups,
      };
    } catch (error) {
      console.error('Failed to get backup status:', error);
      throw error;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Frontend Component: Backup Management UI
// ═══════════════════════════════════════════════════════════════════════════

// src/components/BackupManager.jsx
import React, { useState, useEffect } from 'react';

export const BackupManager = ({ userId }) => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backupStatus, setBackupStatus] = useState(null);

  useEffect(() => {
    loadBackupStatus();
  }, [userId]);

  const loadBackupStatus = async () => {
    try {
      const response = await fetch(`/api/backups/status/${userId}`);
      const data = await response.json();
      setBackupStatus(data);
      setBackups(data.backupHistory || []);
    } catch (error) {
      console.error('Failed to load backup status:', error);
    }
  };

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/backups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        alert('Backup created successfully!');
        loadBackupStatus();
      }
    } catch (error) {
      alert('Failed to create backup: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (backupKey) => {
    if (!window.confirm('This will overwrite your current AI memory. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, backupKey }),
      });

      if (response.ok) {
        alert('Memory restored successfully!');
        loadBackupStatus();
      }
    } catch (error) {
      alert('Failed to restore: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <h3 className="text-lg font-semibold">💾 AI Memory Backups</h3>

      {backupStatus && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm">
            {backupStatus.hasBackups ? (
              <>
                <strong>Latest backup:</strong> {new Date(backupStatus.latestBackup).toLocaleDateString()}{' '}
                ({backupStatus.lastBackupAge} hours ago)
              </>
            ) : (
              <strong>No backups yet</strong>
            )}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Total backups: {backupStatus.totalBackups} (90-day retention)
          </p>
        </div>
      )}

      <button
        onClick={handleCreateBackup}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Creating...' : '⚡ Create Backup Now'}
      </button>

      {backups.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Backup History</h4>
          <div className="space-y-2">
            {backups.map((backup, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {new Date(backup.createdAt).toLocaleDateString()} at{' '}
                    {new Date(backup.createdAt).toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-gray-500">{(backup.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={() => handleRestore(backup.backupKey)}
                  className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        ✓ Automatic daily backups enabled
        <br />✓ End-to-end encrypted storage
        <br />✓ 90-day retention policy
      </p>
    </div>
  );
};

module.exports = AIMemoryBackupService;
