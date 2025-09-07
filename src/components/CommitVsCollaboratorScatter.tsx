import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { calculateStatistics } from '@/lib/analytics';
import { RepositoryData } from '@/types/repository';

interface CommitVsCollaboratorScatterProps {
  data: RepositoryData[];
}

export function CommitVsCollaboratorScatter({ data }: CommitVsCollaboratorScatterProps) {
  const commitStats = calculateStatistics(data, 'Commit_Comment_Count');
  const collaboratorStats = calculateStatistics(data, 'Collaborator_Count');

  const scatterData = data
    .filter(repo => repo.Commit_Comment_Count >= 0 && repo.Collaborator_Count >= 0)
    .map(repo => ({
      commitComments: repo.Commit_Comment_Count,
      collaborators: repo.Collaborator_Count,
      name: `${repo.Org_Name}/${repo.Repo_Name}`,
      size: Math.max(4, Math.min(12, repo.Repo_Size_mb / 10))
    }));

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
        <CardTitle>Commit Comments vs Collaborators</CardTitle>
        <p className="text-sm text-muted-foreground">
          Dot size represents repository size. Lines show median values.
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
        <div className="mt-4 text-sm text-muted-foreground">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <span className="font-medium">Median Collaborators:</span> {collaboratorStats.p50}
            </div>
            <div>
              <span className="font-medium">Median Commit Comments:</span> {commitStats.p50}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}