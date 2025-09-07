import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart as BarChartIcon, Table as TableIcon, Calculator } from '@phosphor-icons/react';
import { RepositoryData, NUMERICAL_COLUMNS } from '@/types/repository';

interface HistogramProps {
  data: RepositoryData[];
}

type ScalingMethod = 'none' | 'minmax' | 'zscore' | 'robust';

export function Histogram({ data }: HistogramProps) {
  const [selectedColumn, setSelectedColumn] = useState(NUMERICAL_COLUMNS[0]);
  const [scalingMethod, setScalingMethod] = useState<ScalingMethod>('none');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const applyScaling = (values: number[], method: ScalingMethod): number[] => {
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
  };

  const generateHistogramData = (column: string) => {
    const rawValues = data
      .map(row => (row as any)[column])
      .filter(val => typeof val === 'number' && !isNaN(val) && val >= 0);

    if (rawValues.length === 0) return [];

    const scaledValues = applyScaling(rawValues, scalingMethod);
    const values = [...scaledValues].sort((a, b) => a - b);
    
    const min = values[0];
    const max = values[values.length - 1];
    
    // Use Sturges' rule for number of bins
    const binCount = Math.max(5, Math.min(20, Math.ceil(Math.log2(values.length) + 1)));
    const binWidth = (max - min) / binCount;

    const bins = Array.from({ length: binCount }, (_, i) => ({
      range: `${(min + i * binWidth).toFixed(3)}-${(min + (i + 1) * binWidth).toFixed(3)}`,
      count: 0,
      percentage: 0,
      start: min + i * binWidth,
      end: min + (i + 1) * binWidth
    }));

    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), binCount - 1);
      bins[binIndex].count++;
    });

    // Calculate percentages
    const totalCount = values.length;
    bins.forEach(bin => {
      bin.percentage = (bin.count / totalCount) * 100;
    });

    return bins;
  };

  const histogramData = useMemo(() => generateHistogramData(selectedColumn), [selectedColumn, scalingMethod, data]);
  const columnName = selectedColumn.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
  const scaledSuffix = scalingMethod !== 'none' ? ` (${scalingMethod} scaled)` : '';

  const renderChart = () => (
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
            dataKey="count" 
            fill="oklch(0.25 0.08 250)" 
            radius={[4, 4, 0, 0]}
            style={{ filter: 'drop-shadow(0 1px 2px oklch(0.25 0.08 250 / 0.1))' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderTable = () => (
    <div className="max-h-80 overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Range</TableHead>
            <TableHead className="text-right">Count</TableHead>
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
                <TableCell className="text-right">{bin.count}</TableCell>
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
            <Select value={selectedColumn} onValueChange={setSelectedColumn}>
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
            <Select value={scalingMethod} onValueChange={(value: ScalingMethod) => setScalingMethod(value)}>
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
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {columnName}{scaledSuffix}
          </Badge>
          <Badge variant="outline">
            {histogramData.length} bins
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
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
          </div>
          {scalingMethod !== 'none' && (
            <div className="text-xs text-muted-foreground text-center bg-muted p-2 rounded">
              <strong>Scaling Applied:</strong> {
                scalingMethod === 'minmax' ? 'Min-Max normalization (values scaled to 0-1 range)' :
                scalingMethod === 'zscore' ? 'Z-score standardization (mean=0, std=1)' :
                scalingMethod === 'robust' ? 'Robust scaling using median and IQR'
                : ''
              }
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}