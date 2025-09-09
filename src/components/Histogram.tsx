import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';
import { BarChart as BarChartIcon, Table as TableIcon, Calculator, Lightning } from '@phosphor-icons/react';
import { RepositoryData, NUMERICAL_COLUMNS } from '@/types/repository';
import { useAsyncDataProcessing } from '@/hooks/useDataProcessing';
import { LoadingState, DataSizeWarning } from '@/components/LoadingComponents';
import { calculateOptimalBinCount, aggregateDataIntoBins } from '@/lib/dataOptimization';

interface HistogramProps {
  data: RepositoryData[];
}

interface HistogramBin {
  range: string;
  scaledRange: string;
  originalCount: number;
  scaledCount: number;
  percentage: number;
  start: number;
  end: number;
  scaledStart: number;
  scaledEnd: number;
}

type ScalingMethod = 'none' | 'minmax' | 'zscore' | 'robust';

export function Histogram({ data }: HistogramProps) {
  const [selectedColumn, setSelectedColumn] = useState(NUMERICAL_COLUMNS[0]);
  const [scalingMethod, setScalingMethod] = useState<ScalingMethod>('none');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [optimizeData, setOptimizeData] = useState(data.length > 5000);

  // Memoize stable values to prevent unnecessary re-renders
  const stableSelectedColumn = useMemo(() => selectedColumn, [selectedColumn]);
  const stableScalingMethod = useMemo(() => scalingMethod, [scalingMethod]);
  const stableOptimizeData = useMemo(() => optimizeData, [optimizeData]);

  const applyScaling = useCallback((values: number[], method: ScalingMethod): number[] => {
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
  }, []);

  const generateHistogramData = useCallback(async (): Promise<HistogramBin[]> => {
    // Filter and extract values
    const rawValues = data
      .map(row => (row as any)[stableSelectedColumn])
      .filter(val => typeof val === 'number' && !isNaN(val) && val >= 0);

    if (rawValues.length === 0) return [];
    
    // Apply feature scaling to the original property values
    const scaledValues = applyScaling(rawValues, stableScalingMethod);
    
    // Use optimized bin calculation for large datasets
    const binCount = stableOptimizeData && rawValues.length > 1000 
      ? calculateOptimalBinCount(rawValues.length, 'freedman')
      : Math.max(5, Math.min(20, Math.ceil(Math.log2(rawValues.length) + 1)));
    
    // Determine min/max for binning - use original values for consistent binning
    const originalSorted = [...rawValues].sort((a, b) => a - b);
    const min = originalSorted[0];
    const max = originalSorted[originalSorted.length - 1];
    
    // For scaled values, determine their range for scaled bins
    const scaledSorted = [...scaledValues].sort((a, b) => a - b);
    const scaledMin = scaledSorted[0];
    const scaledMax = scaledSorted[scaledSorted.length - 1];
    
    const binWidth = (max - min) / binCount;
    const scaledBinWidth = stableScalingMethod !== 'none' ? (scaledMax - scaledMin) / binCount : binWidth;

    // Simple bins creation to avoid hangs with complex processing
    const bins = Array.from({ length: binCount }, (_, i) => {
      const originalStart = min + i * binWidth;
      const originalEnd = min + (i + 1) * binWidth;
      const scaledStart = stableScalingMethod !== 'none' ? scaledMin + i * scaledBinWidth : originalStart;
      const scaledEnd = stableScalingMethod !== 'none' ? scaledMin + (i + 1) * scaledBinWidth : originalEnd;
      
      return {
        range: `${originalStart.toFixed(1)}-${originalEnd.toFixed(1)}`,
        scaledRange: stableScalingMethod !== 'none' ? `${scaledStart.toFixed(3)}-${scaledEnd.toFixed(3)}` : `${originalStart.toFixed(1)}-${originalEnd.toFixed(1)}`,
        originalCount: 0,
        scaledCount: 0,
        percentage: 0,
        start: originalStart,
        end: originalEnd,
        scaledStart,
        scaledEnd
      };
    });

    // Group data by original value bins for original counts
    rawValues.forEach((originalValue) => {
      const binIndex = Math.min(Math.floor((originalValue - min) / binWidth), binCount - 1);
      bins[binIndex].originalCount++;
    });

    // Group data by scaled value bins for scaled counts
    if (stableScalingMethod !== 'none') {
      scaledValues.forEach((scaledValue) => {
        const binIndex = Math.min(Math.floor((scaledValue - scaledMin) / scaledBinWidth), binCount - 1);
        if (binIndex >= 0 && binIndex < binCount) {
          bins[binIndex].scaledCount++;
        }
      });
    } else {
      // When no scaling, scaled count equals original count
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
  }, [data, stableSelectedColumn, stableScalingMethod, stableOptimizeData, applyScaling]);

  // Stable processing dependencies to prevent hooks order changes
  const processingDependencies = useMemo(() => [
    stableSelectedColumn, 
    stableScalingMethod, 
    stableOptimizeData
  ], [stableSelectedColumn, stableScalingMethod, stableOptimizeData]);

  const { processedData: histogramData, isLoading, error } = useAsyncDataProcessing(
    data,
    generateHistogramData,
    processingDependencies
  );

  const columnName = stableSelectedColumn.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
  const scaledSuffix = stableScalingMethod !== 'none' ? ` (${stableScalingMethod} scaled)` : '';

  // Show loading state for large datasets
  if (isLoading) {
    return <LoadingState message="Processing histogram data..." />;
  }

  // Show error state
  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">Error processing data: {error.message}</p>
          <Button 
            onClick={() => {
              setSelectedColumn(NUMERICAL_COLUMNS[0]);
              setScalingMethod('none');
              setOptimizeData(true);
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

  if (!histogramData || histogramData.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No data available for the selected column</p>
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    if (stableScalingMethod === 'none') {
      // Regular single-axis chart when no scaling is applied
      return (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.02 85)" />
              <XAxis 
                dataKey="range" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
                stroke="oklch(0.55 0.12 270)"
              />
              <YAxis 
                fontSize={12}
                stroke="oklch(0.55 0.12 270)"
              />
              <Tooltip 
                formatter={(value, name) => [value, 'Count']}
                labelFormatter={(label) => `Range: ${label}`}
                contentStyle={{
                  backgroundColor: 'oklch(0.98 0 0)',
                  border: '1px solid oklch(0.88 0.02 85)',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="originalCount" 
                fill="oklch(0.25 0.08 250)" 
                radius={[4, 4, 0, 0]}
                style={{ filter: 'drop-shadow(0 1px 2px oklch(0.25 0.08 250 / 0.1))' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    } else {
      // Biaxial chart when scaling is applied - shows distribution of both original and scaled values
      return (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={histogramData} margin={{ top: 20, right: 60, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.02 85)" />
              <XAxis 
                dataKey="range" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
                stroke="oklch(0.55 0.12 270)"
                label={{ value: 'Original Value Range', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                yAxisId="original"
                orientation="left"
                fontSize={12}
                stroke="oklch(0.25 0.08 250)"
                label={{ value: 'Count (Original Range)', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="scaled"
                orientation="right"
                fontSize={12}
                stroke="oklch(0.70 0.15 45)"
                label={{ value: 'Count (Scaled Range)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'originalCount') return [value, 'Count (Original Values)'];
                  if (name === 'scaledCount') return [value, 'Count (Scaled Values)'];
                  return [value, name];
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0) {
                    const data = payload[0].payload;
                    return (
                      <div>
                        <div>Original Range: {label}</div>
                        <div>Scaled Range: {data.scaledRange}</div>
                      </div>
                    );
                  }
                  return `Range: ${label}`;
                }}
                contentStyle={{
                  backgroundColor: 'oklch(0.98 0 0)',
                  border: '1px solid oklch(0.88 0.02 85)',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                yAxisId="original"
                dataKey="originalCount" 
                fill="oklch(0.25 0.08 250)" 
                radius={[4, 4, 0, 0]}
                style={{ filter: 'drop-shadow(0 1px 2px oklch(0.25 0.08 250 / 0.1))' }}
                name="originalCount"
              />
              <Bar 
                yAxisId="scaled"
                dataKey="scaledCount" 
                fill="oklch(0.70 0.15 45)" 
                radius={[4, 4, 0, 0]}
                style={{ filter: 'drop-shadow(0 1px 2px oklch(0.70 0.15 45 / 0.1))' }}
                name="scaledCount"
                opacity={0.7}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      );
    }
  };

  const renderTable = () => (
    <div className="max-h-80 overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Original Range</TableHead>
            {stableScalingMethod !== 'none' && (
              <TableHead>Scaled Range</TableHead>
            )}
            <TableHead className="text-right">Count (Original)</TableHead>
            {stableScalingMethod !== 'none' && (
              <TableHead className="text-right">Count (Scaled)</TableHead>
            )}
            <TableHead className="text-right">Percentage</TableHead>
            <TableHead className="text-right">Cumulative %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {histogramData.map((bin, index) => {
            const cumulativePercentage = histogramData
              .slice(0, index + 1)
              .reduce((sum, b) => sum + b.percentage, 0);
            
            return (
              <TableRow key={index}>
                <TableCell className="font-mono text-sm">{bin.range}</TableCell>
                {stableScalingMethod !== 'none' && (
                  <TableCell className="font-mono text-sm text-accent">{bin.scaledRange}</TableCell>
                )}
                <TableCell className="text-right">{bin.originalCount}</TableCell>
                {stableScalingMethod !== 'none' && (
                  <TableCell className="text-right text-accent">{bin.scaledCount}</TableCell>
                )}
                <TableCell className="text-right">{bin.percentage.toFixed(1)}%</TableCell>
                <TableCell className="text-right">{cumulativePercentage.toFixed(1)}%</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Distribution Analysis</span>
          <div className="flex items-center gap-4">
            <Select value={stableSelectedColumn} onValueChange={setSelectedColumn}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NUMERICAL_COLUMNS.map(column => (
                  <SelectItem key={column} value={column}>
                    {column.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stableScalingMethod} onValueChange={(value: ScalingMethod) => setScalingMethod(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Scaling</SelectItem>
                <SelectItem value="minmax">Min-Max (0-1)</SelectItem>
                <SelectItem value="zscore">Z-Score</SelectItem>
                <SelectItem value="robust">Robust (IQR)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {columnName}{scaledSuffix}
            </Badge>
            <Badge variant="outline">
              {histogramData.length} bins
            </Badge>
            {stableOptimizeData && (
              <Badge variant="outline" className="text-accent">
                <Lightning className="w-3 h-3 mr-1" />
                Optimized
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={stableOptimizeData}
                onCheckedChange={setOptimizeData}
                id="optimize-data"
              />
              <label htmlFor="optimize-data" className="text-sm text-muted-foreground">
                Performance Mode
              </label>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DataSizeWarning
          dataSize={data.length}
          threshold={5000}
          onOptimize={() => setOptimizeData(true)}
          onProceed={() => setOptimizeData(false)}
        />
        
        <Tabs value={viewMode} onValueChange={(value: 'chart' | 'table') => setViewMode(value)} className="space-y-4">
          <TabsList>
            <TabsTrigger value="chart" className="flex items-center gap-2">
              <BarChartIcon className="w-4 h-4" />
              Chart View
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <TableIcon className="w-4 h-4" />
              Table View
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart">
            {renderChart()}
          </TabsContent>
          
          <TabsContent value="table">
            {renderTable()}
          </TabsContent>
        </Tabs>
        
        <div className="mt-4 space-y-2">
          <div className="text-sm text-muted-foreground text-center">
            Distribution of {columnName}{scaledSuffix} across {data.length} repositories
            {stableOptimizeData && data.length > 1000 && (
              <span className="block text-xs text-accent mt-1">
                Performance optimizations enabled for large dataset
              </span>
            )}
          </div>
          {stableScalingMethod !== 'none' && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground text-center bg-muted p-2 rounded">
                <strong>Value Scaling Applied:</strong> {
                  stableScalingMethod === 'minmax' ? 'Min-Max normalization applied to original property values (scaled to 0-1 range)' :
                  stableScalingMethod === 'zscore' ? 'Z-score standardization applied to original property values (mean=0, std=1)' :
                  stableScalingMethod === 'robust' ? 'Robust scaling applied to original property values using median and IQR'
                  : ''
                }. Shows distribution comparison between original and scaled value ranges.
              </div>
              <div className="flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded"></div>
                  <span>Original Values (Left Axis)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-accent rounded opacity-70"></div>
                  <span>Scaled Values (Right Axis)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}