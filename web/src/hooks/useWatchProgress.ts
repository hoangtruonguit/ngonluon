'use client';

import { useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface UseWatchProgressOptions {
  movieId: string;
  episodeId?: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
}

export function useWatchProgress({
  movieId,
  episodeId,
  duration,
  currentTime,
  isPlaying,
}: UseWatchProgressOptions) {
  const { user } = useAuth();
  const lastSavedTime = useRef<number>(0);
  const pendingProgress = useRef<number>(0);
  const isFinishedTriggered = useRef<boolean>(false);

  const saveProgress = useCallback(
    async (seconds: number, isFinished = false) => {
      if (!user) return;
      
      const roundedSeconds = Math.floor(seconds);
      // Skip if it hasn't been at least 2 seconds since last save (unless finished)
      if (!isFinished && Math.abs(roundedSeconds - lastSavedTime.current) < 2) return;
      if (roundedSeconds <= 0 && !isFinished) return;

      try {
        await apiClient.recordWatchHistory(movieId, {
          episodeId,
          progressSeconds: roundedSeconds,
          isFinished,
        });
        lastSavedTime.current = roundedSeconds;
      } catch (error) {
        console.error('Failed to save watch progress:', error);
      }
    },
    [user, movieId, episodeId]
  );

  // Sync current time to ref for sendBeacon
  useEffect(() => {
    pendingProgress.current = currentTime;
  }, [currentTime]);

  // Periodic save every 30 seconds
  useEffect(() => {
    if (!isPlaying || !user || duration <= 0) return;

    const interval = setInterval(() => {
      saveProgress(pendingProgress.current);
    }, 30000);

    return () => clearInterval(interval);
  }, [isPlaying, user, duration, saveProgress]);

  // Detect 95% completion
  useEffect(() => {
    if (!user || duration <= 0 || isFinishedTriggered.current) return;

    if (currentTime / duration >= 0.95) {
      isFinishedTriggered.current = true;
      saveProgress(currentTime, true);
    }
  }, [currentTime, duration, user, saveProgress]);

  // Save on tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!user || pendingProgress.current <= 0) return;

      const data = {
        movieId,
        episodeId: episodeId || null,
        progressSeconds: Math.floor(pendingProgress.current),
        isFinished: isFinishedTriggered.current,
      };

      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      navigator.sendBeacon(`${apiUrl}/watch-history`, blob);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, movieId, episodeId]);

  return { saveProgress };
}
