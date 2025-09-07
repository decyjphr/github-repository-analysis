import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { calculateAge, getColorForValue } from '@/lib/analytics';
import { RepositoryData } from '@/types/repository';

interface AgeVsSizeScatterProps {
  data: RepositoryData[];
}

export function AgeVsSizeScatter({ data }: AgeVsSizeScatterProps) {
  const scatterData = data
    .filter(repo => repo.Created && repo.Repo_Size_mb >= 0)
    .map(repo => {
      const age = calculateAge(repo.Created);
      return {
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
        <CardTitle>Repository Age vs Size</CardTitle>
        <p className="text-sm text-muted-foreground">
          Color intensity represents record count (red = higher activity)
        </p>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}