import { useState, useCallback, useRef } from 'react';

export interface QueueTask<T> {
  id: string;
  execute: () => Promise<T>;
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
}

export interface UseAsyncQueueReturn<T> {
  queue: QueueTask<T>[];
  isProcessing: boolean;
  addTask: (task: Omit<QueueTask<T>, 'id'>) => void;
  clear: () => void;
  processedCount: number;
  totalCount: number;
}

/**
 * Process async tasks in a queue with rate limiting
 * 
 * Usage:
 * const { addTask, isProcessing, processedCount, totalCount } = useAsyncQueue({
 *   concurrency: 2, // Max 2 tasks at once
 *   delay: 1000 // 1s delay between tasks
 * });
 * 
 * addTask({
 *   execute: () => uploadFile(file),
 *   onSuccess: (url) => console.log('Uploaded:', url),
 *   onError: (err) => console.error('Failed:', err)
 * });
 */
export function useAsyncQueue<T = any>({
  concurrency = 1,
  delay = 0,
}: {
  concurrency?: number;
  delay?: number;
} = {}): UseAsyncQueueReturn<T> {
  const [queue, setQueue] = useState<QueueTask<T>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const processingRef = useRef(false);
  const activeCountRef = useRef(0);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    while (queue.length > 0 || activeCountRef.current > 0) {
      // Wait if at max concurrency
      if (activeCountRef.current >= concurrency) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      // Get next task
      const task = queue[0];
      if (!task) {
        if (activeCountRef.current === 0) break;
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      // Remove from queue
      setQueue((prev) => prev.slice(1));
      activeCountRef.current++;

      // Execute task
      (async () => {
        try {
          const result = await task.execute();
          task.onSuccess?.(result);
        } catch (error) {
          task.onError?.(error as Error);
        } finally {
          activeCountRef.current--;
          setProcessedCount((prev) => prev + 1);
          
          // Delay between tasks
          if (delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      })();
    }

    processingRef.current = false;
    setIsProcessing(false);
  }, [queue, concurrency, delay]);

  const addTask = useCallback(
    (task: Omit<QueueTask<T>, 'id'>) => {
      const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newTask = { ...task, id };

      setQueue((prev) => [...prev, newTask]);
      setProcessedCount(0);

      // Start processing
      setTimeout(() => processQueue(), 0);
    },
    [processQueue]
  );

  const clear = useCallback(() => {
    setQueue([]);
    setProcessedCount(0);
  }, []);

  const totalCount = queue.length + processedCount;

  return {
    queue,
    isProcessing,
    addTask,
    clear,
    processedCount,
    totalCount,
  };
}
