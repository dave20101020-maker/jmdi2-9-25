import { describe, it, expect, beforeEach, vi } from 'vitest';
import { reflectionPrompts, insightPrompts, goalPrompts, journalPrompts, meditationPrompts } from '@/ai/prompts';

describe('AI Prompts Module', () => {
  describe('Reflection Prompts', () => {
    it('should export reflection prompt templates', () => {
      expect(reflectionPrompts).toBeDefined();
      expect(typeof reflectionPrompts.generate).toBe('function');
    });

    it('should generate daily reflection prompt', () => {
      const prompt = reflectionPrompts.generate('daily');
      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe('string');
    });

    it('should generate weekly reflection prompt', () => {
      const prompt = reflectionPrompts.generate('weekly');
      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe('string');
    });

    it('should have fallback for unknown type', () => {
      const prompt = reflectionPrompts.generate('unknown');
      expect(prompt).toBeTruthy();
    });
  });

  describe('Insight Prompts', () => {
    it('should export insight prompt templates', () => {
      expect(insightPrompts).toBeDefined();
      expect(insightPrompts.personalized).toBeTruthy();
      expect(insightPrompts.analysis).toBeTruthy();
    });

    it('should generate pillar-specific insights', () => {
      const prompt = insightPrompts.forPillar('sleep');
      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe('string');
      expect(prompt).toContain('sleep');
    });
  });

  describe('Goal Prompts', () => {
    it('should export goal prompt templates', () => {
      expect(goalPrompts).toBeDefined();
      expect(goalPrompts.smartGoal).toBeTruthy();
    });

    it('should generate SMART goal prompt', () => {
      const goal = 'Run a 5K in under 25 minutes';
      const prompt = goalPrompts.smartGoal(goal, 'fitness', 'Exercise & Fitness');
      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe('string');
      expect(prompt).toContain('SMART');
    });

    it('should generate breakdown prompt', () => {
      const prompt = goalPrompts.breakDown('Complete a project');
      expect(prompt).toBeTruthy();
    });

    it('should generate habit creation prompt', () => {
      const prompt = goalPrompts.habitCreation('Exercise daily');
      expect(prompt).toBeTruthy();
    });
  });

  describe('Journal Prompts', () => {
    it('should export journal prompt templates', () => {
      expect(journalPrompts).toBeDefined();
      expect(journalPrompts.guidedEntry).toBeTruthy();
    });

    it('should have emotion processing prompt', () => {
      expect(journalPrompts.emotionalProcessing).toBeTruthy();
    });

    it('should generate goal reflection prompt', () => {
      const prompt = journalPrompts.goalReflection('Build confidence');
      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe('string');
    });

    it('should have weekly review prompt', () => {
      const prompt = journalPrompts.weeklyReview();
      expect(prompt).toBeTruthy();
    });
  });

  describe('Meditation Prompts', () => {
    it('should export meditation prompt templates', () => {
      expect(meditationPrompts).toBeDefined();
      expect(typeof meditationPrompts.guidedMeditation).toBe('function');
    });

    it('should generate guided meditation with duration', () => {
      const prompt = meditationPrompts.guidedMeditation(10);
      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe('string');
    });

    it('should have breathing exercise prompt', () => {
      expect(meditationPrompts.breathingExercise).toBeTruthy();
    });

    it('should generate custom meditation', () => {
      const prompt = meditationPrompts.customMeditation('focus');
      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe('string');
    });

    it('should have anxiety relief prompt', () => {
      expect(meditationPrompts.anxietyRelief).toBeTruthy();
    });
  });
});
