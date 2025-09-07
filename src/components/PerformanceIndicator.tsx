import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Lightning, 
  ChartBar, 
  Database, 
  Cpu, 
  CaretDown, 
  CheckCircle,
  Warning
} from '@phosphor-icons/react';

interface PerformanceIndicatorProps {
  dataSize: number;
  optimizationsEnabled: boolean;
  processingTime?: number;
}

export function PerformanceIndicator({ 
  dataSize, 
  optimizationsEnabled, 
  processingTime 
}: PerformanceIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getPerformanceLevel = () => {
    if (dataSize < 1000) return 'excellent';
    if (dataSize < 5000) return 'good';
    if (dataSize < 10000) return 'moderate';
    return 'challenging';
  };

  const performanceLevel = getPerformanceLevel();
  const shouldOptimize = dataSize > 2000 && !optimizationsEnabled;

  const optimizations = [
    {
      name: 'Data Downsampling',
      description: 'Reduces data points while preserving visual shape',
      threshold: 2000,
      enabled: optimizationsEnabled && dataSize > 2000,
      icon: <ChartBar className="w-4 h-4" />
    },
    {
      name: 'Async Processing',
      description: 'Prevents UI blocking during heavy calculations',
      threshold: 1000,
      enabled: dataSize > 1000,
      icon: <Cpu className="w-4 h-4" />
    },
    {
      name: 'Progressive Rendering',
      description: 'Loads charts incrementally for better perceived performance',
      threshold: 5000,
      enabled: optimizationsEnabled && dataSize > 5000,
      icon: <Lightning className="w-4 h-4" />
    },
    {
      name: 'Web Workers',
      description: 'Offloads heavy computations to background threads',
      threshold: 10000,
      enabled: optimizationsEnabled && dataSize > 10000,
      icon: <Database className="w-4 h-4" />
    }
  ];

  const activeOptimizations = optimizations.filter(opt => opt.enabled);

  return (
    <Card className={`border-l-4 ${
      performanceLevel === 'excellent' ? 'border-l-green-500' :
      performanceLevel === 'good' ? 'border-l-blue-500' :
      performanceLevel === 'moderate' ? 'border-l-yellow-500' :
      'border-l-red-500'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              performanceLevel === 'excellent' ? 'bg-green-100 text-green-600' :
              performanceLevel === 'good' ? 'bg-blue-100 text-blue-600' :
              performanceLevel === 'moderate' ? 'bg-yellow-100 text-yellow-600' :
              'bg-red-100 text-red-600'
            }`}>
              {shouldOptimize ? <Warning className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            </div>
            <div>
              <CardTitle className="text-lg">
                Performance Status
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {dataSize.toLocaleString()} data points
                {processingTime && ` • ${processingTime}ms processing time`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={
              performanceLevel === 'excellent' ? 'default' :
              performanceLevel === 'good' ? 'secondary' :
              performanceLevel === 'moderate' ? 'outline' :
              'destructive'
            }>
              {performanceLevel}
            </Badge>
            {activeOptimizations.length > 0 && (
              <Badge variant="outline" className="text-accent">
                <Lightning className="w-3 h-3 mr-1" />
                {activeOptimizations.length} optimizations
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {shouldOptimize && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <Warning className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Performance Optimization Recommended
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Enable performance mode in chart controls for better responsiveness with large datasets.
                </p>
              </div>
            </div>
          </div>
        )}

        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span>Performance Details</span>
              <CaretDown className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-3 mt-3">
            <div className="grid gap-3">
              {optimizations.map((opt, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    opt.enabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className={`${opt.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                    {opt.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        opt.enabled ? 'text-green-800' : 'text-gray-600'
                      }`}>
                        {opt.name}
                      </span>
                      {opt.enabled && <CheckCircle className="w-3 h-3 text-green-600" />}
                    </div>
                    <p className={`text-xs ${
                      opt.enabled ? 'text-green-700' : 'text-gray-500'
                    }`}>
                      {opt.description}
                    </p>
                  </div>
                  <Badge variant="outline" size="sm">
                    {dataSize > opt.threshold ? 'Active' : `> ${opt.threshold.toLocaleString()}`}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                Optimization Strategies Applied:
              </h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Virtualization for large data tables</li>
                <li>• Async data processing to prevent UI blocking</li>
                <li>• Smart binning algorithms for histograms</li>
                <li>• Point deduplication for scatter plots</li>
                <li>• Efficient data sampling techniques</li>
                {dataSize > 10000 && <li>• Web Worker utilization for heavy computations</li>}
              </ul>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}