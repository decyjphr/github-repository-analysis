import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Lightning } from '@phosphor-icons/react';
import { calculateAge, getColorForValue } from '@/lib/analytics';
import { RepositoryData } from '@/types/repository';
import { useAsyncDataProcessing, useDownsampling } from '@/hooks/useDataProcessing';
import { LoadingState, DataSizeWarning } from '@/components/LoadingComponents';
import { sampleData, deduplicatePoints } from '@/lib/dataOptimization';

interface AgeVsSizeScatterProps {
  data: RepositoryData[];
}

export function AgeVsSizeScatter({ data }: AgeVsSizeScatterProps) {
  const [optimizeData, setOptimizeData] = useState(data.length > 2000);
  const [forceRender, setForceRender] = useState(false);

  const processScatterData = useCallback(async () => {
    const baseData = data
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
          color: getColorForValue(
            repo.Record_Count,
            Math.min(...data.map(r => r.Record_Count)),
            Math.max(...data.map(r => r.Record_Count))
          )
        };
      })
      .filter(item => item.age > 0 && item.size >= 0);

    if (!optimizeData || baseData.length <= 2000) {
      return baseData;
    }

    // Apply optimizations for large datasets
    let optimizedData = baseData;

    // First, remove overlapping points that are too close together
    optimizedData = deduplicatePoints(optimizedData, 2);

    // Then sample if still too many points
    if (optimizedData.length > 2000) {
      optimizedData = sampleData(optimizedData, 2000, 'systematic');
    }

    return optimizedData;
  }, [data, optimizeData]);

  const { processedData: scatterData, isLoading, error } = useAsyncDataProcessing(
    data,
    processScatterData,
    [optimizeData, forceRender]
  );

  if (isLoading) {
    return <LoadingState message="Processing scatter plot data..." />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">Error processing data: {error.message}</p>
          <button 
            onClick={() => setForceRender(prev => !prev)}
            className="mt-4 text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded hover:bg-secondary/90 transition-colors"
          >
            Retry
          </button>
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

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={payload.color}
        stroke="white"
        strokeWidth={1}
        style={{ opacity: 0.7 }}
      />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Repository Age vs Size</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={optimizeData}
                onCheckedChange={setOptimizeData}
                id="optimize-scatter"
              />
              <label htmlFor="optimize-scatter" className="text-sm text-muted-foreground">
                Performance Mode
              </label>
            </div>
          </div>
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Color intensity represents record count (red = higher activity)
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {scatterData.length} of {data.length} points
            </Badge>
            {optimizeData && scatterData.length < data.length && (
              <Badge variant="outline" className="text-accent">
                <Lightning className="w-3 h-3 mr-1" />
                Optimized
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DataSizeWarning
          dataSize={data.length}
          threshold={2000}
          onOptimize={() => setOptimizeData(true)}
          onProceed={() => setOptimizeData(false)}
        />
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 30, bottom: 40, left: 40 }}
              data={scatterData}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.02 85)" />
              <XAxis
                type="number"
                dataKey="age"
                name="Age (days)"
                fontSize={12}
                stroke="oklch(0.55 0.12 270)"
                label={{ value: 'Age (days)', position: 'insideBottom', offset: -10 }}
              />
              <YAxis
                type="number"
                dataKey="size"
                name="Size (MB)"
                fontSize={12}
                stroke="oklch(0.55 0.12 270)"
                label={{ value: 'Size (MB)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value, name) => [
                  name === 'age' ? `${value} days` : `${value} MB`,
                  name === 'age' ? 'Age' : 'Size'
                ]}
                labelFormatter={() => ''}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-sm text-muted-foreground">Age: {data.age} days</p>
                        <p className="text-sm text-muted-foreground">Size: {data.size} MB</p>
                        <p className="text-sm text-muted-foreground">Records: {data.recordCount}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Repositories" data={scatterData} shape={<CustomDot />} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        {optimizeData && scatterData.length < data.length && (
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Showing {scatterData.length} optimized points from {data.length} total repositories for better performance
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}