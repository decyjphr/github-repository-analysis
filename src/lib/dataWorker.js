// Web Worker for heavy data processing tasks
// This runs in a separate thread to avoid blocking the main UI

self.onmessage = function(e) {
  const { type, data, config } = e.data;

  try {
    let result;

    switch (type) {
      case 'CALCULATE_STATISTICS':
        result = calculateStatistics(data, config.column);
        break;
      
      case 'DOWNSAMPLE_DATA':
        result = downsampleData(data, config.maxPoints, config.method);
        break;
      
      case 'PROCESS_HISTOGRAM':
        result = processHistogramData(data, config);
        break;
      
      case 'DEDUPLICATE_POINTS':
        result = deduplicatePoints(data, config.tolerance);
        break;
      
      default:
        throw new Error(`Unknown processing type: ${type}`);
    }

    self.postMessage({ success: true, result });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};

function calculateStatistics(data, column) {
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

  const getPercentile = (p) => {
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

function downsampleData(data, maxPoints, method = 'systematic') {
  if (data.length <= maxPoints) return data;

  switch (method) {
    case 'systematic':
      return systematicSample(data, maxPoints);
    case 'random':
      return randomSample(data, maxPoints);
    default:
      return systematicSample(data, maxPoints);
  }
}

function systematicSample(data, sampleSize) {
  const step = Math.floor(data.length / sampleSize);
  const sampled = [];
  
  for (let i = 0; i < data.length && sampled.length < sampleSize; i += step) {
    sampled.push(data[i]);
  }
  
  return sampled;
}

function randomSample(data, sampleSize) {
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, sampleSize);
}

function processHistogramData(data, config) {
  const { column, scalingMethod, binCount } = config;
  
  const rawValues = data
    .map(row => row[column])
    .filter(val => typeof val === 'number' && !isNaN(val) && val >= 0);

  if (rawValues.length === 0) return [];
  
  // Apply feature scaling
  const scaledValues = applyScaling(rawValues, scalingMethod);
  
  // Calculate bins
  const originalSorted = [...rawValues].sort((a, b) => a - b);
  const min = originalSorted[0];
  const max = originalSorted[originalSorted.length - 1];
  
  const scaledSorted = [...scaledValues].sort((a, b) => a - b);
  const scaledMin = scaledSorted[0];
  const scaledMax = scaledSorted[scaledSorted.length - 1];
  
  const binWidth = (max - min) / binCount;
  const scaledBinWidth = scalingMethod !== 'none' ? (scaledMax - scaledMin) / binCount : binWidth;

  const bins = Array.from({ length: binCount }, (_, i) => {
    const originalStart = min + i * binWidth;
    const originalEnd = min + (i + 1) * binWidth;
    const scaledStart = scalingMethod !== 'none' ? scaledMin + i * scaledBinWidth : originalStart;
    const scaledEnd = scalingMethod !== 'none' ? scaledMin + (i + 1) * scaledBinWidth : originalEnd;
    
    return {
      range: `${originalStart.toFixed(1)}-${originalEnd.toFixed(1)}`,
      scaledRange: scalingMethod !== 'none' ? `${scaledStart.toFixed(3)}-${scaledEnd.toFixed(3)}` : `${originalStart.toFixed(1)}-${originalEnd.toFixed(1)}`,
      originalCount: 0,
      scaledCount: 0,
      percentage: 0,
      start: originalStart,
      end: originalEnd,
      scaledStart,
      scaledEnd
    };
  });

  // Count values in bins
  rawValues.forEach((originalValue) => {
    const binIndex = Math.min(Math.floor((originalValue - min) / binWidth), binCount - 1);
    bins[binIndex].originalCount++;
  });

  if (scalingMethod !== 'none') {
    scaledValues.forEach((scaledValue) => {
      const binIndex = Math.min(Math.floor((scaledValue - scaledMin) / scaledBinWidth), binCount - 1);
      if (binIndex >= 0 && binIndex < binCount) {
        bins[binIndex].scaledCount++;
      }
    });
  } else {
    bins.forEach(bin => {
      bin.scaledCount = bin.originalCount;
    });
  }

  // Calculate percentages
  const totalCount = rawValues.length;
  bins.forEach((bin) => {
    bin.percentage = (bin.originalCount / totalCount) * 100;
  });

  return bins;
}

function applyScaling(values, method) {
  if (method === 'none') return values;
  
  switch (method) {
    case 'minmax': {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;
      return range === 0 ? values : values.map(v => (v - min) / range);
    }
    case 'zscore': {
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const std = Math.sqrt(variance);
      return std === 0 ? values : values.map(v => (v - mean) / std);
    }
    case 'robust': {
      const sorted = [...values].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const median = sorted[Math.floor(sorted.length * 0.5)];
      return iqr === 0 ? values : values.map(v => (v - median) / iqr);
    }
    default:
      return values;
  }
}

function deduplicatePoints(data, tolerance = 1) {
  if (data.length === 0) return data;

  const deduplicated = [data[0]];
  
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