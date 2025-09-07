// Data processing utilities for performance optimization

export interface DataPoint {
  x: number;
  y: number;
  [key: string]: any;
}

/**
 * Downsample data using the Largest Triangle Three Buckets (LTTB) algorithm
 * This preserves the visual shape of the data while reducing points
 */
export function downsampleLTTB<T extends DataPoint>(
  data: T[],
  targetPoints: number
): T[] {
  if (data.length <= targetPoints || targetPoints < 3) {
    return data;
  }

  const bucketSize = (data.length - 2) / (targetPoints - 2);
  const downsampled: T[] = [data[0]]; // Always include first point

  let bucketIndex = 0;
  for (let i = 1; i < targetPoints - 1; i++) {
    const avgRangeStart = Math.floor(bucketIndex * bucketSize) + 1;
    const avgRangeEnd = Math.floor((bucketIndex + 1) * bucketSize) + 1;
    
    // Calculate average point for next bucket
    let avgX = 0;
    let avgY = 0;
    let avgRangeLength = avgRangeEnd - avgRangeStart;
    
    for (let j = avgRangeStart; j < avgRangeEnd && j < data.length; j++) {
      avgX += data[j].x;
      avgY += data[j].y;
    }
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;

    // Get current bucket range
    const rangeStart = Math.floor(bucketIndex * bucketSize) + 1;
    const rangeEnd = Math.floor((bucketIndex + 1) * bucketSize) + 1;

    // Find point with largest triangle area
    let maxArea = -1;
    let maxAreaIndex = rangeStart;
    
    const prevPoint = downsampled[downsampled.length - 1];
    
    for (let j = rangeStart; j < rangeEnd && j < data.length; j++) {
      const area = Math.abs(
        (prevPoint.x - avgX) * (data[j].y - prevPoint.y) -
        (prevPoint.x - data[j].x) * (avgY - prevPoint.y)
      ) * 0.5;
      
      if (area > maxArea) {
        maxArea = area;
        maxAreaIndex = j;
      }
    }

    downsampled.push(data[maxAreaIndex]);
    bucketIndex++;
  }

  downsampled.push(data[data.length - 1]); // Always include last point
  return downsampled;
}

/**
 * Aggregate data into bins for histogram-like visualizations
 */
export function aggregateDataIntoBins<T>(
  data: T[],
  getValue: (item: T) => number,
  binCount: number
): Array<{ start: number; end: number; count: number; items: T[] }> {
  if (data.length === 0) return [];

  const values = data.map(getValue).filter(v => !isNaN(v) && isFinite(v));
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const binWidth = (max - min) / binCount;

  const bins = Array.from({ length: binCount }, (_, i) => ({
    start: min + i * binWidth,
    end: min + (i + 1) * binWidth,
    count: 0,
    items: [] as T[]
  }));

  data.forEach(item => {
    const value = getValue(item);
    if (isNaN(value) || !isFinite(value)) return;
    
    const binIndex = Math.min(Math.floor((value - min) / binWidth), binCount - 1);
    bins[binIndex].count++;
    bins[binIndex].items.push(item);
  });

  return bins;
}

/**
 * Sample data using different strategies
 */
export function sampleData<T>(
  data: T[],
  sampleSize: number,
  strategy: 'random' | 'systematic' | 'stratified' = 'systematic'
): T[] {
  if (data.length <= sampleSize) return data;

  switch (strategy) {
    case 'random':
      return randomSample(data, sampleSize);
    case 'systematic':
      return systematicSample(data, sampleSize);
    case 'stratified':
      return stratifiedSample(data, sampleSize);
    default:
      return systematicSample(data, sampleSize);
  }
}

function randomSample<T>(data: T[], sampleSize: number): T[] {
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, sampleSize);
}

function systematicSample<T>(data: T[], sampleSize: number): T[] {
  const step = Math.floor(data.length / sampleSize);
  const sampled: T[] = [];
  
  for (let i = 0; i < data.length && sampled.length < sampleSize; i += step) {
    sampled.push(data[i]);
  }
  
  return sampled;
}

function stratifiedSample<T>(data: T[], sampleSize: number): T[] {
  // Simple stratification - could be enhanced for specific use cases
  const chunkSize = Math.floor(data.length / sampleSize);
  const sampled: T[] = [];
  
  for (let i = 0; i < sampleSize && i * chunkSize < data.length; i++) {
    const chunkStart = i * chunkSize;
    const chunkEnd = Math.min((i + 1) * chunkSize, data.length);
    const randomIndex = chunkStart + Math.floor(Math.random() * (chunkEnd - chunkStart));
    sampled.push(data[randomIndex]);
  }
  
  return sampled;
}

/**
 * Optimize scatter plot data by removing overlapping points
 */
export function deduplicatePoints<T extends DataPoint>(
  data: T[],
  tolerance: number = 1
): T[] {
  if (data.length === 0) return data;

  const deduplicated: T[] = [data[0]];
  
  for (let i = 1; i < data.length; i++) {
    const current = data[i];
    let isDuplicate = false;
    
    for (const existing of deduplicated) {
      const distance = Math.sqrt(
        Math.pow(current.x - existing.x, 2) + Math.pow(current.y - existing.y, 2)
      );
      
      if (distance < tolerance) {
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      deduplicated.push(current);
    }
  }
  
  return deduplicated;
}

/**
 * Calculate optimal bin count using various methods
 */
export function calculateOptimalBinCount(dataLength: number, method: 'sturges' | 'freedman' | 'scott' = 'sturges'): number {
  switch (method) {
    case 'sturges':
      return Math.max(5, Math.min(30, Math.ceil(Math.log2(dataLength) + 1)));
    case 'freedman':
      // Simplified Freedman-Diaconis rule
      return Math.max(5, Math.min(50, Math.ceil(Math.cbrt(dataLength) * 2)));
    case 'scott':
      // Simplified Scott's rule
      return Math.max(5, Math.min(40, Math.ceil(Math.pow(dataLength, 1/3) * 3.5)));
    default:
      return Math.max(5, Math.min(30, Math.ceil(Math.log2(dataLength) + 1)));
  }
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}