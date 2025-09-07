import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RepositoryData, NUMERICAL_COLUMNS } from '@/types/repository';

interface HistogramProps {
  data: RepositoryData[];
}

export function Histogram({ data }: HistogramProps) {
  const [selectedColumn, setSelectedColumn] = useState(NUMERICAL_COLUMNS[0]);

  const generateHistogramData = (column: string) => {
    const values = data
      .map(row => (row as any)[column])
      .filter(val => typeof val === 'number' && !isNaN(val) && val >= 0);

    if (values.length === 0) return [];

    values.sort((a, b) => a - b);
    const min = values[0];
    const max = values[values.length - 1];
    
    // Use Sturges' rule for number of bins
    const binCount = Math.max(5, Math.min(20, Math.ceil(Math.log2(values.length) + 1)));
    const binWidth = (max - min) / binCount;

    const bins = Array.from({ length: binCount }, (_, i) => ({
      range: `${(min + i * binWidth).toFixed(1)}-${(min + (i + 1) * binWidth).toFixed(1)}`,
      count: 0,
      start: min + i * binWidth,
      end: min + (i + 1) * binWidth
    }));

    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), binCount - 1);
      bins[binIndex].count++;
    });

    return bins;
  };

  const histogramData = generateHistogramData(selectedColumn);
  const columnName = selectedColumn.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Distribution Histogram</span>
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
        </CardTitle>
      </CardHeader>
      <CardContent>
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
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Distribution of {columnName} across {data.length} repositories
        </div>
      </CardContent>
    </Card>
  );
}