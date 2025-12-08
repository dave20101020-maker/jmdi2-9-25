/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AI Memory Backups & Cloud Storage
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Automatic cloud backups, encryption, versioning, and recovery
 * Backend service for managing AI memory persistence and disaster recovery
 */

const crypto = require("crypto");
const fs = require("fs").promises;
const path = require("path");

/**
 * AI Memory Backup Service
 * Handles backup, restore, and encryption of AI memory/context data
 */
class AIMemoryBackupService {
  constructor(config = {}) {
    this.backupDir =
      config.backupDir || path.join(process.cwd(), "backups", "ai-memory");
    this.encryptionKey =
      config.encryptionKey ||
      process.env.BACKUP_ENCRYPTION_KEY ||
      "default-key-change-in-production";
    this.retentionDays = config.retentionDays || 90;
    this.maxBackupsPerUser = config.maxBackupsPerUser || 30;
    this.isScheduled = false;

    // Ensure backup directory exists
    this._ensureBackupDirectory();
  }

  /**
   * Ensure backup directory exists
   */
  async _ensureBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create backup directory:", error);
    }
  }

  /**
   * Encrypt sensitive data using AES-256-CBC
   */
  encrypt(data) {
    try {
      const iv = crypto.randomBytes(16);
      const key = crypto.scryptSync(this.encryptionKey, "salt", 32);
      const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

      let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
      encrypted += cipher.final("hex");

      return {
        iv: iv.toString("hex"),
        data: encrypted,
        version: "1.0",
      };
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encrypted) {
    try {
      const key = crypto.scryptSync(this.encryptionKey, "salt", 32);
      const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        key,
        Buffer.from(encrypted.iv, "hex")
      );

      let decrypted = decipher.update(encrypted.data, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return JSON.parse(decrypted);
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Failed to decrypt data");
    }
  }

  /**
   * Create backup of user's AI memory/context
   */
  async createMemoryBackup(userId, memoryData) {
    try {
      const timestamp = Date.now();
      const backupData = {
        userId,
        memories: memoryData || [],
        createdAt: new Date().toISOString(),
        version: "1.0",
        metadata: {
          count: memoryData?.length || 0,
          timestamp,
        },
      };

      // Encrypt the backup data
      const encrypted = this.encrypt(backupData);

      // Create user-specific backup directory
      const userBackupDir = path.join(this.backupDir, userId.toString());
      await fs.mkdir(userBackupDir, { recursive: true });

      // Save encrypted backup to file
      const backupFileName = `backup-${timestamp}.enc.json`;
      const backupPath = path.join(userBackupDir, backupFileName);
      await fs.writeFile(backupPath, JSON.stringify(encrypted, null, 2));

      // Cleanup old backups
      await this.cleanupOldBackups(userId);

      console.log(
        `AI memory backup created for user ${userId}: ${backupFileName}`
      );

      return {
        success: true,
        backupId: backupFileName,
        path: backupPath,
        timestamp: new Date(),
        size: JSON.stringify(encrypted).length,
      };
    } catch (error) {
      console.error("Failed to create memory backup:", error);
      throw error;
    }
  }

  /**
   * Get backup history for user
   */
  async getBackupHistory(userId, limit = 10) {
    try {
      const userBackupDir = path.join(this.backupDir, userId.toString());

      try {
        await fs.access(userBackupDir);
      } catch {
        return []; // No backups exist
      }

      const files = await fs.readdir(userBackupDir);
      const backupFiles = files
        .filter((f) => f.startsWith("backup-") && f.endsWith(".enc.json"))
        .sort()
        .reverse()
        .slice(0, limit);

      const backups = await Promise.all(
        backupFiles.map(async (fileName) => {
          const filePath = path.join(userBackupDir, fileName);
          const stats = await fs.stat(filePath);

          return {
            fileName,
            path: filePath,
            size: stats.size,
            createdAt: stats.mtime,
            timestamp: parseInt(
              fileName.match(/backup-(\d+)\.enc\.json/)?.[1] || "0"
            ),
          };
        })
      );

      return backups;
    } catch (error) {
      console.error("Failed to get backup history:", error);
      return [];
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(userId, backupFileName) {
    try {
      const backupPath = path.join(
        this.backupDir,
        userId.toString(),
        backupFileName
      );

      // Read encrypted backup
      const encryptedData = await fs.readFile(backupPath, "utf8");
      const encrypted = JSON.parse(encryptedData);

      // Decrypt and verify
      const backupData = this.decrypt(encrypted);

      if (
        backupData.userId !== userId &&
        backupData.userId !== userId.toString()
      ) {
        throw new Error("Backup user ID does not match");
      }

      console.log(
        `AI memory restored for user ${userId} from backup ${backupFileName}`
      );

      return {
        success: true,
        userId: backupData.userId,
        memories: backupData.memories || [],
        restoredCount: backupData.memories?.length || 0,
        backupDate: backupData.createdAt,
      };
    } catch (error) {
      console.error("Failed to restore from backup:", error);
      throw error;
    }
  }

  /**
   * List all backups for user
   */
  async listBackups(userId) {
    try {
      return await this.getBackupHistory(userId, this.maxBackupsPerUser);
    } catch (error) {
      console.error("Failed to list backups:", error);
      return [];
    }
  }

  /**
   * Delete old backups based on retention policy
   */
  async cleanupOldBackups(userId) {
    try {
      const userBackupDir = path.join(this.backupDir, userId.toString());

      try {
        await fs.access(userBackupDir);
      } catch {
        return; // No backups to clean
      }

      const files = await fs.readdir(userBackupDir);
      const backupFiles = files.filter(
        (f) => f.startsWith("backup-") && f.endsWith(".enc.json")
      );

      // Delete backups older than retention period
      const cutoffDate = Date.now() - this.retentionDays * 24 * 60 * 60 * 1000;

      for (const fileName of backupFiles) {
        const timestamp = parseInt(
          fileName.match(/backup-(\d+)\.enc\.json/)?.[1] || "0"
        );

        if (timestamp < cutoffDate) {
          const filePath = path.join(userBackupDir, fileName);
          await fs.unlink(filePath);
          console.log(`Deleted old backup: ${fileName}`);
        }
      }

      // Limit number of backups per user
      const remainingFiles = (await fs.readdir(userBackupDir))
        .filter((f) => f.startsWith("backup-") && f.endsWith(".enc.json"))
        .sort()
        .reverse();

      if (remainingFiles.length > this.maxBackupsPerUser) {
        const filesToDelete = remainingFiles.slice(this.maxBackupsPerUser);

        for (const fileName of filesToDelete) {
          const filePath = path.join(userBackupDir, fileName);
          await fs.unlink(filePath);
          console.log(`Deleted excess backup: ${fileName}`);
        }
      }
    } catch (error) {
      console.error("Failed to cleanup old backups:", error);
    }
  }

  /**
   * Delete all backups for a user
   */
  async deleteAllBackups(userId) {
    try {
      const userBackupDir = path.join(this.backupDir, userId.toString());
      await fs.rm(userBackupDir, { recursive: true, force: true });
      console.log(`Deleted all backups for user ${userId}`);

      return { success: true };
    } catch (error) {
      console.error("Failed to delete backups:", error);
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
        latestBackup: latestBackup?.createdAt || null,
        latestBackupTimestamp: latestBackup?.timestamp || null,
        lastBackupAge: latestBackup
          ? Math.round((Date.now() - latestBackup.timestamp) / (1000 * 60 * 60))
          : null,
        backupHistory: backups.map((b) => ({
          fileName: b.fileName,
          size: b.size,
          createdAt: b.createdAt,
          ageHours: Math.round((Date.now() - b.timestamp) / (1000 * 60 * 60)),
        })),
        retentionDays: this.retentionDays,
        maxBackups: this.maxBackupsPerUser,
      };
    } catch (error) {
      console.error("Failed to get backup status:", error);
      return {
        hasBackups: false,
        totalBackups: 0,
        error: error.message,
      };
    }
  }

  /**
   * Export backup data (for manual download/transfer)
   */
  async exportBackup(userId, backupFileName) {
    try {
      const backupPath = path.join(
        this.backupDir,
        userId.toString(),
        backupFileName
      );
      const encryptedData = await fs.readFile(backupPath, "utf8");

      return {
        success: true,
        data: encryptedData,
        fileName: backupFileName,
      };
    } catch (error) {
      console.error("Failed to export backup:", error);
      throw error;
    }
  }

  /**
   * Import backup data (from manual upload)
   */
  async importBackup(userId, encryptedData, fileName) {
    try {
      const userBackupDir = path.join(this.backupDir, userId.toString());
      await fs.mkdir(userBackupDir, { recursive: true });

      const backupPath = path.join(
        userBackupDir,
        fileName || `backup-${Date.now()}.enc.json`
      );
      await fs.writeFile(backupPath, encryptedData);

      console.log(`Imported backup for user ${userId}`);

      return {
        success: true,
        fileName: path.basename(backupPath),
      };
    } catch (error) {
      console.error("Failed to import backup:", error);
      throw error;
    }
  }
}

// Export singleton instance
let backupServiceInstance = null;

/**
 * Get or create backup service instance
 */
function getBackupService(config) {
  if (!backupServiceInstance) {
    backupServiceInstance = new AIMemoryBackupService(config);
  }
  return backupServiceInstance;
}

module.exports = {
  AIMemoryBackupService,
  getBackupService,
};
