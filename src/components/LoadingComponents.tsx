import { CircleNotch, TrendingUp } from '@phosphor-icons/react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface LoadingStateProps {
  message?: string;
  progress?: number;
  showProgress?: boolean;
}

export function LoadingState({ 
  message = 'Processing data...', 
  progress,
  showProgress = false 
}: LoadingStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="relative">
          <CircleNotch className="w-8 h-8 text-primary animate-spin" />
          <TrendingUp className="w-4 h-4 text-accent absolute top-1 right-1 animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-foreground">{message}</p>
          <p className="text-xs text-muted-foreground">
            Optimizing visualization for better performance
          </p>
        </div>
        {showProgress && progress !== undefined && (
          <div className="w-full max-w-xs space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SkeletonChartProps {
  height?: string;
  showLegend?: boolean;
}

export function SkeletonChart({ height = "h-80", showLegend = false }: SkeletonChartProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className={`${height} bg-muted rounded-lg animate-pulse flex items-end justify-around p-4`}>
          {/* Skeleton bars */}
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="bg-muted-foreground/20 rounded-sm animate-pulse"
              style={{
                width: '12%',
                height: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>
        {showLegend && (
          <div className="flex justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-muted-foreground/20 rounded animate-pulse" />
              <div className="w-16 h-3 bg-muted-foreground/20 rounded animate-pulse" />
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-muted-foreground/20 rounded animate-pulse" />
              <div className="w-20 h-3 bg-muted-foreground/20 rounded animate-pulse" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DataSizeWarningProps {
  dataSize: number;
  threshold?: number;
  onProceed?: () => void;
  onOptimize?: () => void;
}

export function DataSizeWarning({ 
  dataSize, 
  threshold = 5000, 
  onProceed,
  onOptimize 
}: DataSizeWarningProps) {
  if (dataSize <= threshold) return null;

  return (
    <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-4">
      <div className="flex items-start space-x-3">
        <TrendingUp className="w-5 h-5 text-accent mt-0.5" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-foreground">
            Large Dataset Detected
          </p>
          <p className="text-xs text-muted-foreground">
            You have {dataSize.toLocaleString()} data points. For optimal performance, 
            consider enabling data optimization or viewing smaller subsets.
          </p>
          {(onProceed || onOptimize) && (
            <div className="flex space-x-2">
              {onOptimize && (
                <button
                  onClick={onOptimize}
                  className="text-xs bg-accent text-accent-foreground px-3 py-1 rounded hover:bg-accent/90 transition-colors"
                >
                  Optimize Data
                </button>
              )}
              {onProceed && (
                <button
                  onClick={onProceed}
                  className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded hover:bg-secondary/90 transition-colors"
                >
                  Proceed Anyway
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}