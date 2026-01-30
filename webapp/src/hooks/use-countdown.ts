import { useState, useEffect, useCallback } from 'react';

export interface UseCountdownReturn {
  timeLeft: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  isFinished: boolean;
}

/**
 * Countdown timer hook
 * 
 * Usage:
 * const { timeLeft, start, pause, reset } = useCountdown(60); // 60 seconds
 * 
 * <button onClick={start}>Start</button>
 * <p>{timeLeft}s remaining</p>
 */
export function useCountdown(
  initialSeconds: number,
  onComplete?: () => void
): UseCountdownReturn {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setIsFinished(true);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsFinished(false);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    if (timeLeft > 0) {
      setIsRunning(true);
    }
  }, [timeLeft]);

  const reset = useCallback(() => {
    setTimeLeft(initialSeconds);
    setIsRunning(false);
    setIsFinished(false);
  }, [initialSeconds]);

  return { timeLeft, isRunning, start, pause, resume, reset, isFinished };
}

/**
 * Format seconds to MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
