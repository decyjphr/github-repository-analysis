import { useState, useMemo } from 'react';
import { useKV } from '@github/spark/hooks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, TrendingUp, Calculator, Upload as UploadIcon, Lightning } from '@phosphor-icons/react';
import { CSVUploader } from '@/components/CSVUploader';
import { StatisticalSummary } from '@/components/StatisticalSummary';
import { SizeAnalysis } from '@/components/SizeAnalysis';
import { Histogram } from '@/components/Histogram';
import { AgeVsSizeScatter } from '@/components/AgeVsSizeScatter';
import { CommitVsCollaboratorScatter } from '@/components/CommitVsCollaboratorScatter';
import { PerformanceIndicator } from '@/components/PerformanceIndicator';
import { RepositoryData } from '@/types/repository';

function App() {
  const [repositoryData, setRepositoryData] = useKV<RepositoryData[]>('repository-data', []);
  const [activeTab, setActiveTab] = useState('summary');

  // Stabilize data to prevent hook order changes during loading
  const stableData = useMemo(() => {
    // Ensure we always return a stable array reference
    if (!repositoryData || !Array.isArray(repositoryData)) {
      return [];
    }
    return repositoryData;
  }, [repositoryData]);

  const handleDataLoaded = (data: RepositoryData[]) => {
    setRepositoryData(data);
  };

  const clearData = () => {
    setRepositoryData([]);
  };

  const hasData = stableData.length > 0;

  if (!hasData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-6 mb-12">
            <h1 className="text-4xl font-bold text-foreground">
              GitHub Repository Analytics
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload your repository CSV files to get comprehensive statistical analysis, 
              visualizations, and insights. Multiple files will be automatically combined.
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
                {stableData.length} repositories loaded
              </Badge>
              {stableData.length > 5000 && (
                <Badge variant="outline" className="text-accent">
                  <Lightning className="w-3 h-3 mr-1" />
                  Large dataset - Performance mode enabled
                </Badge>
              )}
              <button 
                onClick={clearData}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Upload new files
              </button>
            </div>
          </div>
          {stableData.length > 10000 && (
            <div className="text-right space-y-1">
              <p className="text-sm text-muted-foreground">
                Large dataset detected ({stableData.length.toLocaleString()} repos)
              </p>
              <p className="text-xs text-accent">
                Charts are automatically optimized for performance
              </p>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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

          {stableData.length > 1000 && (
            <PerformanceIndicator 
              dataSize={stableData.length}
              optimizationsEnabled={stableData.length > 5000}
            />
          )}

          <TabsContent value="summary" className="space-y-6">
            <StatisticalSummary data={stableData} />
          </TabsContent>

          <TabsContent value="size-analysis" className="space-y-6">
            <SizeAnalysis data={stableData} />
          </TabsContent>

          <TabsContent value="distributions" className="space-y-6">
            <Histogram data={stableData} />
          </TabsContent>

          <TabsContent value="age-size" className="space-y-6">
            <AgeVsSizeScatter data={stableData} />
          </TabsContent>

          <TabsContent value="correlations" className="space-y-6">
            <CommitVsCollaboratorScatter data={stableData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;