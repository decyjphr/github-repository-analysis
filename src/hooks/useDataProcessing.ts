import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Hook for async data processing with loading states
export function useAsyncDataProcessing<T, R>(
  data: T[],
  processor: () => Promise<R> | R,
  dependencies: any[] = []
) {
  const [processedData, setProcessedData] = useState<R | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const processorRef = useRef(processor);
  
  // Update the processor ref when it changes
  processorRef.current = processor;

  // Memoize dependencies to prevent hooks order changes
  const stableDeps = useMemo(() => {
    if (!Array.isArray(dependencies)) return [];
    // Ensure stable string representation for comparison
    return dependencies.map(dep => 
      typeof dep === 'object' ? JSON.stringify(dep) : String(dep)
    );
  }, [JSON.stringify(dependencies)]);
  
  const dataLength = useMemo(() => data?.length || 0, [data?.length]);
  
  const processData = useCallback(async () => {
    if (dataLength === 0) {
      setProcessedData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use setTimeout to avoid blocking the UI thread
      const result = await new Promise<R>((resolve, reject) => {
        setTimeout(async () => {
          try {
            const processed = await processorRef.current();
            resolve(processed);
          } catch (err) {
            reject(err);
          }
        }, 10);
      });

      setProcessedData(result);
    } catch (err) {
      console.error('Data processing error:', err);
      setError(err instanceof Error ? err : new Error('Processing failed'));
    } finally {
      setIsLoading(false);
    }
  }, [dataLength, stableDeps.join('|')]);

  useEffect(() => {
    processData();
  }, [processData]);

  return { processedData, isLoading, error, reprocess: processData };
}

// Hook for data downsampling
export function useDownsampling<T>(
  data: T[],
  maxPoints: number = 1000,
  enabled: boolean = true
) {
  return useMemo(() => {
    if (!enabled || data.length <= maxPoints) {
      return data;
    }

    // Use systematic sampling to maintain data distribution
    const step = Math.floor(data.length / maxPoints);
    const sampled: T[] = [];
    
    for (let i = 0; i < data.length; i += step) {
      sampled.push(data[i]);
    }

    // Ensure we don't exceed maxPoints
    return sampled.slice(0, maxPoints);
  }, [data, maxPoints, enabled]);
}

// Hook for virtualized rendering with intersection observer
export function useVirtualization(
  itemCount: number,
  itemHeight: number,
  containerHeight: number
) {
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const bufferSize = Math.ceil(visibleCount * 0.5); // 50% buffer

  useEffect(() => {
    setEndIndex(Math.min(startIndex + visibleCount + bufferSize, itemCount));
  }, [startIndex, visibleCount, bufferSize, itemCount]);

  const updateRange = useCallback((scrollTop: number) => {
    const newStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
    setStartIndex(newStartIndex);
  }, [itemHeight, bufferSize]);

  return {
    startIndex,
    endIndex,
    visibleItems: endIndex - startIndex,
    updateRange,
    totalHeight: itemCount * itemHeight
  };
}

// Hook for progressive rendering
export function useProgressiveRendering<T>(
  data: T[],
  batchSize: number = 100,
  delay: number = 10
) {
  const [renderedCount, setRenderedCount] = useState(Math.min(batchSize, data.length));
  const [isComplete, setIsComplete] = useState(data.length <= batchSize);

  useEffect(() => {
    if (data.length <= batchSize) {
      setRenderedCount(data.length);
      setIsComplete(true);
      return;
    }

    setRenderedCount(batchSize);
    setIsComplete(false);

    const timer = setInterval(() => {
      setRenderedCount(prev => {
        const next = Math.min(prev + batchSize, data.length);
        if (next === data.length) {
          setIsComplete(true);
          clearInterval(timer);
        }
        return next;
      });
    }, delay);

    return () => clearInterval(timer);
  }, [data.length, batchSize, delay]);

  const visibleData = useMemo(() => data.slice(0, renderedCount), [data, renderedCount]);

  return {
    visibleData,
    renderedCount,
    totalCount: data.length,
    isComplete,
    progress: data.length > 0 ? (renderedCount / data.length) * 100 : 100
  };
}