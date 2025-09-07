import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, X } from '@phosphor-icons/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { parseCSV } from '@/lib/analytics';
import { RepositoryData } from '@/types/repository';

interface CSVUploaderProps {
  onDataLoaded: (data: RepositoryData[]) => void;
}

interface FileProgress {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  recordCount?: number;
}

export function CSVUploader({ onDataLoaded }: CSVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileProgress, setFileProgress] = useState<FileProgress[]>([]);
  const [combinedData, setCombinedData] = useState<RepositoryData[]>([]);

  const handleFiles = useCallback(async (files: FileList) => {
    const csvFiles = Array.from(files).filter(file => file.name.endsWith('.csv'));
    
    if (csvFiles.length === 0) {
      setError('Please upload at least one CSV file');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // Initialize progress tracking
    const initialProgress: FileProgress[] = csvFiles.map(file => ({
      name: file.name,
      status: 'pending'
    }));
    setFileProgress(initialProgress);

    const allData: RepositoryData[] = [];
    let hasErrors = false;

    try {
      for (let i = 0; i < csvFiles.length; i++) {
        const file = csvFiles[i];
        
        // Update status to processing
        setFileProgress(prev => prev.map((item, index) => 
          index === i ? { ...item, status: 'processing' } : item
        ));

        try {
          const text = await file.text();
          const data = parseCSV(text);
          allData.push(...data);
          
          // Update status to completed
          setFileProgress(prev => prev.map((item, index) => 
            index === i ? { 
              ...item, 
              status: 'completed', 
              recordCount: data.length 
            } : item
          ));
        } catch (err) {
          hasErrors = true;
          const errorMessage = err instanceof Error ? err.message : 'Failed to parse file';
          
          // Update status to error
          setFileProgress(prev => prev.map((item, index) => 
            index === i ? { 
              ...item, 
              status: 'error', 
              error: errorMessage 
            } : item
          ));
        }
      }

      if (allData.length > 0) {
        setCombinedData(allData);
        onDataLoaded(allData);
      } else if (hasErrors) {
        setError('No valid data could be loaded from the uploaded files');
      }
    } catch (err) {
      setError('An unexpected error occurred while processing files');
    } finally {
      setIsLoading(false);
    }
  }, [onDataLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const removeFile = useCallback((index: number) => {
    setFileProgress(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAll = useCallback(() => {
    setFileProgress([]);
    setCombinedData([]);
    setError(null);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card
        className={`transition-all duration-200 ${
          isDragging ? 'border-accent bg-accent/5' : 'border-dashed border-2 border-border'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-muted-foreground" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Upload Repository Data</h3>
            <p className="text-sm text-muted-foreground">
              Drag and drop your CSV files here, or click to browse. Multiple files will be combined automatically.
            </p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={() => document.getElementById('csv-file-input')?.click()}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Select CSV Files
                </>
              )}
            </Button>
            
            <input
              id="csv-file-input"
              type="file"
              accept=".csv"
              multiple
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          <div className="text-xs text-muted-foreground">
            Required columns: Org_Name, Repo_Name, Repo_Size_mb, Record_Count, and more
          </div>
        </CardContent>
      </Card>

      {/* File Progress Display */}
      {fileProgress.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium">File Processing Status</h4>
              {!isLoading && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  className="text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="space-y-3">
              {fileProgress.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {file.status === 'pending' && (
                        <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                      )}
                      {file.status === 'processing' && (
                        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      )}
                      {file.status === 'completed' && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      )}
                      {file.status === 'error' && (
                        <div className="w-2 h-2 bg-destructive rounded-full" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{file.name}</div>
                      {file.status === 'completed' && file.recordCount && (
                        <div className="text-xs text-muted-foreground">
                          {file.recordCount} records loaded
                        </div>
                      )}
                      {file.status === 'error' && file.error && (
                        <div className="text-xs text-destructive">{file.error}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        file.status === 'completed' ? 'default' :
                        file.status === 'error' ? 'destructive' :
                        file.status === 'processing' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {file.status}
                    </Badge>
                    
                    {!isLoading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {combinedData.length > 0 && (
              <div className="mt-4 p-3 bg-accent/10 rounded-lg">
                <div className="text-sm font-medium text-accent-foreground">
                  Total: {combinedData.length} repositories from {fileProgress.filter(f => f.status === 'completed').length} files
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}