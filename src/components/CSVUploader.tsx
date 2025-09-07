import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle } from '@phosphor-icons/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parseCSV } from '@/lib/analytics';
import { RepositoryData } from '@/types/repository';

interface CSVUploaderProps {
  onDataLoaded: (data: RepositoryData[]) => void;
}

export function CSVUploader({ onDataLoaded }: CSVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const data = parseCSV(text);
      onDataLoaded(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
    } finally {
      setIsLoading(false);
    }
  }, [onDataLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
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
              Drag and drop your CSV file here, or click to browse
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
                  Select CSV File
                </>
              )}
            </Button>
            
            <input
              id="csv-file-input"
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          <div className="text-xs text-muted-foreground">
            Required columns: Org_Name, Repo_Name, Repo_Size_mb, Record_Count, and more
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}