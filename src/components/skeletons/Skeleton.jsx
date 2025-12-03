/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Loading Skeleton Components
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Reusable skeleton loaders with smooth animations
 */

// src/components/skeletons/Skeleton.jsx
import React from 'react';
import './skeleton.css';

/**
 * Base Skeleton Component
 */
export const Skeleton = ({ width = '100%', height = '20px', className = '', circle = false }) => {
  return (
    <div
      className={`skeleton ${circle ? 'skeleton-circle' : ''} ${className}`}
      style={{
        width,
        height,
        borderRadius: circle ? '50%' : '8px',
      }}
    />
  );
};

/**
 * Skeleton for text content
 */
export const TextSkeleton = ({ lines = 1, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '80%' : '100%'}
          height="16px"
        />
      ))}
    </div>
  );
};

/**
 * Dashboard skeleton
 */
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <Skeleton width="200px" height="32px" className="mb-2" />
        <TextSkeleton lines={2} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 bg-gray-100 rounded-lg">
            <Skeleton width="60%" height="16px" className="mb-2" />
            <Skeleton width="100%" height="32px" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="p-4 bg-gray-100 rounded-lg">
        <Skeleton width="150px" height="24px" className="mb-4" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton width="100%" height="200px" />
            <TextSkeleton lines={2} />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Habit list skeleton
 */
export const HabitListSkeleton = ({ count = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-4">
            <Skeleton width="60px" height="60px" circle className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <Skeleton width="40%" height="20px" className="mb-2" />
              <TextSkeleton lines={1} />
              <div className="flex gap-2 mt-2">
                <Skeleton width="60px" height="24px" />
                <Skeleton width="100px" height="24px" />
              </div>
            </div>
            <Skeleton width="40px" height="40px" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Meditation player skeleton
 */
export const MeditationPlayerSkeleton = () => {
  return (
    <div className="space-y-4 p-6">
      {/* Thumbnail */}
      <Skeleton width="100%" height="300px" />

      {/* Title and description */}
      <div>
        <Skeleton width="60%" height="28px" className="mb-2" />
        <TextSkeleton lines={2} />
      </div>

      {/* Duration and difficulty */}
      <div className="flex gap-4">
        <Skeleton width="120px" height="20px" />
        <Skeleton width="120px" height="20px" />
      </div>

      {/* Player controls */}
      <div className="flex items-center justify-center gap-4 py-4">
        <Skeleton width="50px" height="50px" circle />
        <Skeleton width="100%" height="8px" />
        <Skeleton width="50px" height="50px" circle />
      </div>

      {/* CTA buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Skeleton width="100%" height="44px" />
        <Skeleton width="100%" height="44px" />
      </div>
    </div>
  );
};

/**
 * Recipe skeleton
 */
export const RecipeSkeleton = () => {
  return (
    <div className="space-y-4 p-6">
      {/* Image */}
      <Skeleton width="100%" height="250px" />

      {/* Title */}
      <Skeleton width="80%" height="24px" />

      {/* Meta info */}
      <div className="flex gap-4">
        <Skeleton width="100px" height="16px" />
        <Skeleton width="100px" height="16px" />
        <Skeleton width="100px" height="16px" />
      </div>

      {/* Description */}
      <TextSkeleton lines={3} />

      {/* Ingredients section */}
      <div>
        <Skeleton width="100px" height="20px" className="mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="100%" height="20px" />
          ))}
        </div>
      </div>

      {/* Instructions section */}
      <div>
        <Skeleton width="100px" height="20px" className="mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width="100%" height="20px" />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Card grid skeleton
 */
export const CardGridSkeleton = ({ columns = 3, count = 6 }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Image */}
          <Skeleton width="100%" height="200px" />
          {/* Content */}
          <div className="p-4 space-y-3">
            <TextSkeleton lines={2} />
            <Skeleton width="100%" height="36px" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Table skeleton
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 p-4 grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} width="100%" height="20px" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowI) => (
        <div
          key={rowI}
          className="border-t border-gray-200 p-4 grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colI) => (
            <Skeleton key={colI} width="100%" height="20px" />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Profile card skeleton
 */
export const ProfileSkeleton = () => {
  return (
    <div className="space-y-4 p-6">
      {/* Avatar */}
      <div className="flex justify-center mb-4">
        <Skeleton width="120px" height="120px" circle />
      </div>

      {/* Name and email */}
      <div className="text-center space-y-2">
        <Skeleton width="60%" height="24px" className="mx-auto" />
        <Skeleton width="40%" height="16px" className="mx-auto" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-200">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center">
            <Skeleton width="100%" height="24px" className="mb-2" />
            <Skeleton width="100%" height="16px" />
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        <Skeleton width="100%" height="44px" />
        <Skeleton width="100%" height="44px" />
      </div>
    </div>
  );
};

/**
 * Leaderboard skeleton
 */
export const LeaderboardSkeleton = ({ count = 10 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
          <Skeleton width="40px" height="40px" circle className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <Skeleton width="50%" height="16px" className="mb-1" />
            <Skeleton width="40%" height="14px" />
          </div>
          <Skeleton width="80px" height="20px" />
        </div>
      ))}
    </div>
  );
};

export default {
  Skeleton,
  TextSkeleton,
  DashboardSkeleton,
  HabitListSkeleton,
  MeditationPlayerSkeleton,
  RecipeSkeleton,
  CardGridSkeleton,
  TableSkeleton,
  ProfileSkeleton,
  LeaderboardSkeleton,
};
