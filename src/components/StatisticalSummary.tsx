import { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { calculateStatistics } from '@/lib/analytics';
import { RepositoryData, NUMERICAL_COLUMNS } from '@/types/repository';
import { useAsyncDataProcessing } from '@/hooks/useDataProcessing';
import { LoadingState } from '@/components/LoadingComponents';

interface StatisticalSummaryProps {
  data: RepositoryData[];
}

export function StatisticalSummary({ data }: StatisticalSummaryProps) {
  const calculateAllStats = useCallback(async () => {
    // Process statistics for all columns
    const stats = NUMERICAL_COLUMNS.map(column => ({
      column: column.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
      ...calculateStatistics(data, column)
    }));
    
    return stats;
  }, [data]);

  const { processedData: stats, isLoading, error } = useAsyncDataProcessing(
    data,
    calculateAllStats,
    []
  );

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  if (isLoading) {
    return <LoadingState message="Calculating statistical summary..." />;
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">Error calculating statistics: {error?.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistical Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Metric</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Mean</TableHead>
                <TableHead className="text-right">Std</TableHead>
                <TableHead className="text-right">Min</TableHead>
                <TableHead className="text-right">25%</TableHead>
                <TableHead className="text-right">50%</TableHead>
                <TableHead className="text-right">75%</TableHead>
                <TableHead className="text-right">Max</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((stat) => (
                <TableRow key={stat.column}>
                  <TableCell className="font-medium">{stat.column}</TableCell>
                  <TableCell className="text-right font-mono">{stat.count}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(stat.mean)}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(stat.std)}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(stat.min)}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(stat.p25)}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(stat.p50)}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(stat.p75)}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(stat.max)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}