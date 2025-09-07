import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RepositoryData } from '@/types/repository';

interface SizeAnalysisProps {
  data: RepositoryData[];
}

export function SizeAnalysis({ data }: SizeAnalysisProps) {
  // Sort all data by size first (smallest to largest)
  const sortedData = [...data].sort((a, b) => a.Repo_Size_mb - b.Repo_Size_mb);
  
  // Get percentile thresholds
  const count = sortedData.length;
  const p10Index = Math.ceil(count * 10 / 100) - 1;
  const p90Index = Math.ceil(count * 90 / 100) - 1;
  
  // Get repositories in each percentile range (showing top 10 from each group)
  const p10Repos = sortedData.slice(0, Math.min(10, p10Index + 1));
  const p90Repos = sortedData.slice(Math.max(0, p90Index), Math.min(sortedData.length, p90Index + 10));

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
          {p10Repos.map((repo, index) => (
            <div key={index} className="p-3 border rounded-lg">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="font-medium">{repo.Org_Name}/{repo.Repo_Name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Size: {formatSize(repo.Repo_Size_mb)}
                  </p>
                  <div className="flex gap-2 text-xs">
                    {repo.isFork && <Badge variant="outline">Fork</Badge>}
                    {repo.isArchived && <Badge variant="outline">Archived</Badge>}
                    {repo.Is_Empty && <Badge variant="outline">Empty</Badge>}
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  {repo.Record_Count} records
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
          {p90Repos.map((repo, index) => (
            <div key={index} className="p-3 border rounded-lg">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="font-medium">{repo.Org_Name}/{repo.Repo_Name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Size: {formatSize(repo.Repo_Size_mb)}
                  </p>
                  <div className="flex gap-2 text-xs">
                    {repo.isFork && <Badge variant="outline">Fork</Badge>}
                    {repo.isArchived && <Badge variant="outline">Archived</Badge>}
                    {repo.Is_Empty && <Badge variant="outline">Empty</Badge>}
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  {repo.Record_Count} records
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}