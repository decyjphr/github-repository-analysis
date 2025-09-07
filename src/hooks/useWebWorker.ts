import { useState, useCallback, useRef, useEffect } from 'react';

interface WorkerMessage {
  type: string;
  data: any;
  config?: any;
}

interface WorkerResponse {
  success: boolean;
  result?: any;
  error?: string;
}

export function useWebWorker() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const promiseRef = useRef<{
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  } | null>(null);

  useEffect(() => {
    // Create worker if supported
    if (typeof Worker !== 'undefined') {
      try {
        workerRef.current = new Worker(
          new URL('../lib/dataWorker.js', import.meta.url),
          { type: 'module' }
        );

        workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
          const { success, result, error } = e.data;
          
          if (promiseRef.current) {
            if (success) {
              promiseRef.current.resolve(result);
            } else {
              promiseRef.current.reject(new Error(error));
            }
            promiseRef.current = null;
          }
          
          setIsProcessing(false);
        };

        workerRef.current.onerror = (error) => {
          if (promiseRef.current) {
            promiseRef.current.reject(error);
            promiseRef.current = null;
          }
          setError(new Error('Worker error'));
          setIsProcessing(false);
        };
      } catch (err) {
        console.warn('Web Worker not supported, falling back to main thread');
        workerRef.current = null;
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const processData = useCallback(async <T>(
    type: string,
    data: any,
    config?: any
  ): Promise<T> => {
    setError(null);

    // If no worker is available, throw error to fall back to main thread
    if (!workerRef.current) {
      throw new Error('Web Worker not available');
    }

    setIsProcessing(true);

    return new Promise((resolve, reject) => {
      promiseRef.current = { resolve, reject };
      
      const message: WorkerMessage = { type, data, config };
      workerRef.current!.postMessage(message);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (promiseRef.current) {
          promiseRef.current.reject(new Error('Worker timeout'));
          promiseRef.current = null;
          setIsProcessing(false);
        }
      }, 30000);
    });
  }, []);

  return {
    processData,
    isProcessing,
    error,
    isSupported: workerRef.current !== null
  };
}

// Specific hooks for common operations
export function useWorkerStatistics() {
  const { processData, isProcessing, error } = useWebWorker();

  const calculateStatistics = useCallback(async (data: any[], column: string) => {
    try {
      return await processData('CALCULATE_STATISTICS', data, { column });
    } catch {
      // Fallback to main thread if worker fails
      return calculateStatisticsSync(data, column);
    }
  }, [processData]);

  return { calculateStatistics, isProcessing, error };
}

export function useWorkerDownsampling() {
  const { processData, isProcessing, error } = useWebWorker();

  const downsampleData = useCallback(async (data: any[], maxPoints: number, method = 'systematic') => {
    try {
      return await processData('DOWNSAMPLE_DATA', data, { maxPoints, method });
    } catch {
      // Fallback to main thread if worker fails
      return downsampleDataSync(data, maxPoints, method);
    }
  }, [processData]);

  return { downsampleData, isProcessing, error };
}

// Fallback functions for when Web Worker is not available
function calculateStatisticsSync(data: any[], column: string) {
  const values = data
    .map(row => row[column])
    .filter(val => typeof val === 'number' && !isNaN(val) && val >= 0)
    .sort((a, b) => a - b);

  if (values.length === 0) {
    return {
      count: 0,
      mean: 0,
      std: 0,
      min: 0,
      max: 0,
      p25: 0,
      p50: 0,
      p75: 0
    };
  }

  const count = values.length;
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / count;
  
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
  const std = Math.sqrt(variance);

  const getPercentile = (p: number) => {
    const index = Math.ceil(count * p / 100) - 1;
    return values[Math.max(0, Math.min(index, count - 1))];
  };

  return {
    count,
    mean: Math.round(mean * 100) / 100,
    std: Math.round(std * 100) / 100,
    min: values[0],
    max: values[count - 1],
    p25: getPercentile(25),
    p50: getPercentile(50),
    p75: getPercentile(75)
  };
}

function downsampleDataSync(data: any[], maxPoints: number, method: string) {
  if (data.length <= maxPoints) return data;

  const step = Math.floor(data.length / maxPoints);
  const sampled = [];
  
  for (let i = 0; i < data.length && sampled.length < maxPoints; i += step) {
    sampled.push(data[i]);
  }
  
  return sampled;
}