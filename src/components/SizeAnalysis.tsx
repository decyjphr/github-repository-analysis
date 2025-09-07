import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPercentileRepos } from '@/lib/analytics';
import { RepositoryData } from '@/types/repository';

interface SizeAnalysisProps {
  data: RepositoryData[];
}

export function SizeAnalysis({ data }: SizeAnalysisProps) {
  const percentileRepos = getPercentileRepos(data, [10, 90]);
  const p10Repos = percentileRepos.filter(p => p.percentile === 10);
  const p90Repos = percentileRepos.filter(p => p.percentile === 90);

  const formatSize = (sizeInMB: number) => {
    if (sizeInMB >= 1000) return `${(sizeInMB / 1000).toFixed(1)} GB`;
    return `${sizeInMB.toFixed(1)} MB`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            P10 Repositories (Smallest)
            <Badge variant="secondary">Bottom 10%</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {p10Repos.map((item, index) => (
            <div key={index} className="p-3 border rounded-lg">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="font-medium">{item.repo.Org_Name}/{item.repo.Repo_Name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Size: {formatSize(item.size)}
                  </p>
                  <div className="flex gap-2 text-xs">
                    {item.repo.isFork && <Badge variant="outline">Fork</Badge>}
                    {item.repo.isArchived && <Badge variant="outline">Archived</Badge>}
                    {item.repo.Is_Empty && <Badge variant="outline">Empty</Badge>}
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  {item.repo.Record_Count} records
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            P90 Repositories (Largest)
            <Badge variant="secondary">Top 10%</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {p90Repos.map((item, index) => (
            <div key={index} className="p-3 border rounded-lg">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="font-medium">{item.repo.Org_Name}/{item.repo.Repo_Name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Size: {formatSize(item.size)}
                  </p>
                  <div className="flex gap-2 text-xs">
                    {item.repo.isFork && <Badge variant="outline">Fork</Badge>}
                    {item.repo.isArchived && <Badge variant="outline">Archived</Badge>}
                    {item.repo.Is_Empty && <Badge variant="outline">Empty</Badge>}
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  {item.repo.Record_Count} records
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}