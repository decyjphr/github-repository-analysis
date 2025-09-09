import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Lightning } from '@phosphor-icons/react';
import { calculateStatistics } from '@/lib/analytics';
import { RepositoryData } from '@/types/repository';
import { useAsyncDataProcessing } from '@/hooks/useDataProcessing';
import { LoadingState, DataSizeWarning } from '@/components/LoadingComponents';
import { sampleData, deduplicatePoints } from '@/lib/dataOptimization';

interface CommitVsCollaboratorScatterProps {
  data: RepositoryData[];
}

export function CommitVsCollaboratorScatter({ data }: CommitVsCollaboratorScatterProps) {
  const [optimizeData, setOptimizeData] = useState(data.length > 2000);
  const [forceRender, setForceRender] = useState(false);

  const processScatterData = useCallback(async () => {
    const commitStats = calculateStatistics(data, 'Commit_Comment_Count');
    const collaboratorStats = calculateStatistics(data, 'Collaborator_Count');

    const baseData = data
      .filter(repo => repo.Commit_Comment_Count >= 0 && repo.Collaborator_Count >= 0)
      .map(repo => ({
        x: repo.Collaborator_Count,
        y: repo.Commit_Comment_Count,
        commitComments: repo.Commit_Comment_Count,
        collaborators: repo.Collaborator_Count,
        name: `${repo.Org_Name}/${repo.Repo_Name}`,
        size: Math.max(4, Math.min(12, repo.Repo_Size_mb / 10))
      }));

    let optimizedData = baseData;

    if (optimizeData && baseData.length > 2000) {
      // Apply optimizations for large datasets
      optimizedData = deduplicatePoints(optimizedData, 1);

      // Then sample if still too many points
      if (optimizedData.length > 2000) {
        optimizedData = sampleData(optimizedData, 2000, 'systematic');
      }
    }

    return {
      scatterData: optimizedData,
      commitStats,
      collaboratorStats
    };
  }, [data, optimizeData]);

  // Memoize the dependencies array to prevent hooks order changes
  const processingDependencies = useMemo(() => [
    optimizeData, 
    forceRender
  ], [optimizeData, forceRender]);

  const { processedData, isLoading, error } = useAsyncDataProcessing(
    data,
    processScatterData,
    processingDependencies
  );

  if (isLoading) {
    return <LoadingState message="Processing correlation analysis..." />;
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

  if (!processedData) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No valid data available for correlation analysis</p>
        </CardContent>
      </Card>
    );
  }

  const { scatterData, commitStats, collaboratorStats } = processedData;

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={payload.size}
        fill="oklch(0.25 0.08 250)"
        stroke="white"
        strokeWidth={1}
        style={{ opacity: 0.6 }}
      />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Commit Comments vs Collaborators</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={optimizeData}
                onCheckedChange={setOptimizeData}
                id="optimize-correlation"
              />
              <label htmlFor="optimize-correlation" className="text-sm text-muted-foreground">
                Performance Mode
              </label>
            </div>
          </div>
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Dot size represents repository size. Lines show median values.
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
                dataKey="collaborators"
                name="Collaborators"
                fontSize={12}
                stroke="oklch(0.55 0.12 270)"
                label={{ value: 'Collaborator Count', position: 'insideBottom', offset: -10 }}
              />
              <YAxis
                type="number"
                dataKey="commitComments"
                name="Commit Comments"
                fontSize={12}
                stroke="oklch(0.55 0.12 270)"
                label={{ value: 'Commit Comment Count', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Collaborators: {data.collaborators}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Commit Comments: {data.commitComments}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine
                x={collaboratorStats.p50}
                stroke="oklch(0.70 0.15 45)"
                strokeDasharray="5 5"
                strokeWidth={2}
              />
              <ReferenceLine
                y={commitStats.p50}
                stroke="oklch(0.70 0.15 45)"
                strokeDasharray="5 5"
                strokeWidth={2}
              />
              <Scatter name="Repositories" data={scatterData} shape={<CustomDot />} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          <div className="text-sm text-muted-foreground">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <span className="font-medium">Median Collaborators:</span> {collaboratorStats.p50}
              </div>
              <div>
                <span className="font-medium">Median Commit Comments:</span> {commitStats.p50}
              </div>
            </div>
          </div>
          {optimizeData && scatterData.length < data.length && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Showing {scatterData.length} optimized points from {data.length} total repositories for better performance
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}