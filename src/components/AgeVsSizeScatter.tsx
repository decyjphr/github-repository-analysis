import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Lightning, Eye, Gauge } from '@phosphor-icons/react';
import { calculateAge, getColorForValue } from '@/lib/analytics';
import { RepositoryData } from '@/types/repository';
import { useAsyncDataProcessing, useProgressiveRendering } from '@/hooks/useDataProcessing';
import { useWebWorker } from '@/hooks/useWebWorker';
import { LoadingState, DataSizeWarning } from '@/components/LoadingComponents';
import { sampleData, deduplicatePoints, downsampleLTTB } from '@/lib/dataOptimization';

interface AgeVsSizeScatterProps {
  data: RepositoryData[];
}

export function AgeVsSizeScatter({ data }: AgeVsSizeScatterProps) {
  const [optimizeData, setOptimizeData] = useState(data.length > 1000);
  const [progressiveMode, setProgressiveMode] = useState(data.length > 5000);
  const [enableWebWorker, setEnableWebWorker] = useState(data.length > 10000);
  
  // Always call useWebWorker hook to avoid conditional hooks error
  const { processData: workerProcess, isProcessing: workerProcessing } = useWebWorker();
  
  // Memoize min/max values for color calculation
  const colorRange = useMemo(() => {
    const recordCounts = data.map(r => r.Record_Count);
    return {
      min: Math.min(...recordCounts),
      max: Math.max(...recordCounts)
    };
  }, [data]);

  // Enhanced data processing with multiple optimization strategies
  const processScatterData = useCallback(async () => {
    if (data.length === 0) return [];

    const baseProcessing = () => {
      return data
        .filter(repo => repo.Created && repo.Repo_Size_mb >= 0)
        .map(repo => {
          const age = calculateAge(repo.Created);
          return {
            x: age,
            y: repo.Repo_Size_mb,
            age,
            size: repo.Repo_Size_mb,
            recordCount: repo.Record_Count,
            name: `${repo.Org_Name}/${repo.Repo_Name}`,
            color: getColorForValue(repo.Record_Count, colorRange.min, colorRange.max)
          };
        })
        .filter(item => item.age > 0 && item.size >= 0);
    };

    // Try web worker for large datasets if enabled
    if (enableWebWorker && data.length > 10000) {
      try {
        const processedData = await workerProcess('PROCESS_SCATTER_DATA', data, {
          optimizeData,
          maxPoints: optimizeData ? 2000 : data.length,
          deduplicationTolerance: 2
        });
        
        if (processedData && Array.isArray(processedData)) {
          return processedData;
        }
      } catch (error) {
        console.warn('Web worker failed, falling back to main thread:', error);
      }
    }

    // Main thread processing with optimizations
    let processedData = baseProcessing();
    
    // Early return for small datasets
    if (!optimizeData || processedData.length <= 1000) {
      return processedData;
    }

    // Progressive optimization strategies based on data size
    if (processedData.length > 10000) {
      // For extremely large datasets, use LTTB downsampling which preserves visual shape
      processedData = downsampleLTTB(processedData, 1500);
    } else if (processedData.length > 5000) {
      // For very large datasets, use LTTB downsampling
      processedData = downsampleLTTB(processedData, 2000);
    } else if (processedData.length > 2000) {
      // For medium datasets, deduplicate overlapping points first
      processedData = deduplicatePoints(processedData, 2);
      
      // Then sample if still too many points
      if (processedData.length > 2000) {
        processedData = sampleData(processedData, 2000, 'systematic');
      }
    }

    return processedData;
  }, [data, optimizeData, colorRange, enableWebWorker, workerProcess]);

  // Stable processing dependencies to prevent hooks order changes
  const processingDependencies = [
    optimizeData, 
    enableWebWorker
  ];

  const { processedData: rawScatterData, isLoading, error } = useAsyncDataProcessing(
    data,
    processScatterData,
    processingDependencies
  );

  // Progressive rendering for smooth loading experience
  const progressiveBatchSize = useMemo(() => {
    return progressiveMode ? 100 : Math.min(rawScatterData?.length || 0, 1000);
  }, [progressiveMode, rawScatterData?.length]);
  
  const progressiveDelay = useMemo(() => {
    return progressiveMode ? 16 : 0; // 60fps target
  }, [progressiveMode]);
  
  const {
    visibleData: scatterData,
    renderedCount,
    totalCount,
    isComplete,
    progress
  } = useProgressiveRendering(
    rawScatterData || [],
    progressiveBatchSize,
    progressiveDelay
  );

  // Performance monitoring
  const renderStartTime = useRef<number>(Date.now());
  useEffect(() => {
    if (isComplete && !isLoading) {
      const renderTime = Date.now() - renderStartTime.current;
      if (renderTime > 1000) {
        console.log(`Scatter plot rendered in ${renderTime}ms with ${scatterData?.length} points`);
      }
    }
  }, [isComplete, isLoading, scatterData?.length]);

  if (isLoading || workerProcessing) {
    return (
      <LoadingState 
        message={
          workerProcessing 
            ? "Processing scatter plot data with web worker..." 
            : "Optimizing visualization data..."
        } 
      />
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">Error processing data: {error.message}</p>
          <Button 
            onClick={() => {
              setOptimizeData(true);
              setProgressiveMode(data.length > 5000);
              setEnableWebWorker(false); // Disable web worker on retry
            }}
            variant="outline"
            className="mt-4"
          >
            Reset and Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!scatterData || scatterData.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No valid data available for scatter plot</p>
        </CardContent>
      </Card>
    );
  }

  // Memoized custom dot component for better performance
  const CustomDot = useMemo(() => {
    return ({ cx, cy, payload }: any) => (
      <circle
        cx={cx}
        cy={cy}
        r={3}
        fill={payload.color}
        stroke="white"
        strokeWidth={0.5}
        style={{ opacity: 0.8 }}
      />
    );
  }, []);

  // Performance optimization indicators
  const getPerformanceLevel = () => {
    if (data.length > 10000) return 'high';
    if (data.length > 5000) return 'medium';
    if (data.length > 1000) return 'low';
    return 'none';
  };

  const performanceLevel = getPerformanceLevel();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Repository Age vs Size</span>
          <div className="flex items-center gap-3">
            {/* Performance level indicator */}
            {performanceLevel !== 'none' && (
              <Badge variant="outline" className="text-xs">
                <Gauge className="w-3 h-3 mr-1" />
                {performanceLevel} load
              </Badge>
            )}
            
            {/* Progressive rendering toggle */}
            {data.length > 2000 && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={progressiveMode}
                  onCheckedChange={setProgressiveMode}
                  id="progressive-mode"
                />
                <label htmlFor="progressive-mode" className="text-xs text-muted-foreground">
                  Progressive
                </label>
              </div>
            )}
            
            {/* Web worker toggle */}
            {data.length > 5000 && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={enableWebWorker}
                  onCheckedChange={setEnableWebWorker}
                  id="use-worker"
                />
                <label htmlFor="use-worker" className="text-xs text-muted-foreground">
                  Web Worker
                </label>
              </div>
            )}
            
            {/* Optimization toggle */}
            <div className="flex items-center gap-2">
              <Switch
                checked={optimizeData}
                onCheckedChange={setOptimizeData}
                id="optimize-scatter"
              />
              <label htmlFor="optimize-scatter" className="text-sm text-muted-foreground">
                Optimize
              </label>
            </div>
          </div>
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Color intensity represents record count (red = higher activity)
            {progressiveMode && !isComplete && (
              <span className="ml-2 text-accent">
                • Loading {Math.round(progress)}%
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {scatterData?.length || 0} of {data.length} points
            </Badge>
            {progressiveMode && !isComplete && (
              <Badge variant="outline" className="text-accent">
                <Eye className="w-3 h-3 mr-1" />
                {renderedCount}/{totalCount}
              </Badge>
            )}
            {optimizeData && (scatterData?.length || 0) < data.length && (
              <Badge variant="outline" className="text-accent">
                <Lightning className="w-3 h-3 mr-1" />
                Optimized
              </Badge>
            )}
            {enableWebWorker && data.length > 10000 && (
              <Badge variant="outline" className="text-green-600">
                <Lightning className="w-3 h-3 mr-1" />
                Worker
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DataSizeWarning
          dataSize={data.length}
          threshold={1000}
          onOptimize={() => {
            setOptimizeData(true);
            if (data.length > 5000) setProgressiveMode(true);
            if (data.length > 10000) setEnableWebWorker(true);
          }}
          onProceed={() => {
            setOptimizeData(false);
            setProgressiveMode(false);
            setEnableWebWorker(false);
          }}
        />
        
        {/* Progressive loading indicator */}
        {progressiveMode && !isComplete && (
          <div className="mb-4">
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-accent h-2 rounded-full transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Rendering visualization... {Math.round(progress)}%
            </p>
          </div>
        )}
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 30, bottom: 40, left: 40 }}
              data={scatterData}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="oklch(0.88 0.02 85)" 
                opacity={0.5}
              />
              <XAxis
                type="number"
                dataKey="age"
                name="Age (days)"
                fontSize={12}
                stroke="oklch(0.55 0.12 270)"
                label={{ value: 'Age (days)', position: 'insideBottom', offset: -10 }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <YAxis
                type="number"
                dataKey="size"
                name="Size (MB)"
                fontSize={12}
                stroke="oklch(0.55 0.12 270)"
                label={{ value: 'Size (MB)', angle: -90, position: 'insideLeft' }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip
                animationDuration={150}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium text-sm">{data.name}</p>
                        <p className="text-xs text-muted-foreground">Age: {data.age.toLocaleString()} days</p>
                        <p className="text-xs text-muted-foreground">Size: {data.size.toLocaleString()} MB</p>
                        <p className="text-xs text-muted-foreground">Records: {data.recordCount.toLocaleString()}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter 
                name="Repositories" 
                data={scatterData} 
                shape={<CustomDot />}
                isAnimationActive={!progressiveMode || isComplete}
                animationDuration={progressiveMode ? 200 : 400}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        {/* Performance summary */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              {optimizeData && (scatterData?.length || 0) < data.length && (
                <span>
                  Showing {(scatterData?.length || 0).toLocaleString()} optimized points 
                  from {data.length.toLocaleString()} total repositories
                </span>
              )}
              {enableWebWorker && data.length > 10000 && (
                <span className="text-green-600">
                  • Processed with web worker for better performance
                </span>
              )}
            </div>
            {progressiveMode && isComplete && (
              <span className="text-accent">
                Progressive rendering completed
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}