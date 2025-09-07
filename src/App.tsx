import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, TrendingUp, Calculator, Upload as UploadIcon } from '@phosphor-icons/react';
import { CSVUploader } from '@/components/CSVUploader';
import { StatisticalSummary } from '@/components/StatisticalSummary';
import { SizeAnalysis } from '@/components/SizeAnalysis';
import { Histogram } from '@/components/Histogram';
import { AgeVsSizeScatter } from '@/components/AgeVsSizeScatter';
import { CommitVsCollaboratorScatter } from '@/components/CommitVsCollaboratorScatter';
import { RepositoryData } from '@/types/repository';

function App() {
  const [repositoryData, setRepositoryData] = useKV<RepositoryData[]>('repository-data', []);
  const [hasData, setHasData] = useState(false);

  const handleDataLoaded = (data: RepositoryData[]) => {
    setRepositoryData(data);
    setHasData(true);
  };

  const clearData = () => {
    setRepositoryData([]);
    setHasData(false);
  };

  if (!hasData || repositoryData.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-6 mb-12">
            <h1 className="text-4xl font-bold text-foreground">
              GitHub Repository Analytics
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload your repository CSV data to get comprehensive statistical analysis, 
              visualizations, and insights about your GitHub repositories.
            </p>
          </div>
          
          <CSVUploader onDataLoaded={handleDataLoaded} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Repository Analytics Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-sm">
                {repositoryData.length} repositories loaded
              </Badge>
              <button 
                onClick={clearData}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Upload new data
              </button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="size-analysis" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Size Analysis
            </TabsTrigger>
            <TabsTrigger value="distributions" className="flex items-center gap-2">
              <BarChart className="w-4 h-4" />
              Distributions
            </TabsTrigger>
            <TabsTrigger value="age-size" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Age vs Size
            </TabsTrigger>
            <TabsTrigger value="correlations" className="flex items-center gap-2">
              <BarChart className="w-4 h-4" />
              Correlations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            <StatisticalSummary data={repositoryData} />
          </TabsContent>

          <TabsContent value="size-analysis" className="space-y-6">
            <SizeAnalysis data={repositoryData} />
          </TabsContent>

          <TabsContent value="distributions" className="space-y-6">
            <Histogram data={repositoryData} />
          </TabsContent>

          <TabsContent value="age-size" className="space-y-6">
            <AgeVsSizeScatter data={repositoryData} />
          </TabsContent>

          <TabsContent value="correlations" className="space-y-6">
            <CommitVsCollaboratorScatter data={repositoryData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;