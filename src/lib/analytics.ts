import { RepositoryData, StatisticalSummary, PercentileRepo, REQUIRED_COLUMNS, NUMERICAL_COLUMNS } from '@/types/repository';

export function parseCSV(csvText: string): RepositoryData[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must contain at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  
  // Validate required columns
  const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  const data: RepositoryData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length !== headers.length) continue; // Skip malformed rows
    
    try {
      const row: any = {};
      headers.forEach((header, index) => {
        const value = values[index];
        
        // Parse different data types
        if (NUMERICAL_COLUMNS.includes(header)) {
          row[header] = parseFloat(value) || 0;
        } else if (header === 'Is_Empty' || header === 'isFork' || header === 'isArchived' || header === 'Has_Wiki') {
          row[header] = value.toLowerCase() === 'true';
        } else {
          row[header] = value;
        }
      });
      
      // Calculate Record_Count as sum of all count fields if not present
      if (!row.Record_Count) {
        row.Record_Count = [
          'Collaborator_Count', 'Protected_Branch_Count', 'PR_Review_Count',
          'Milestone_Count', 'Issue_Count', 'PR_Count', 'PR_Review_Comment_Count',
          'Commit_Comment_Count', 'Issue_Comment_Count', 'Issue_Event_Count',
          'Release_Count', 'Project_Count', 'Branch_Count', 'Tag_Count', 'Discussion_Count'
        ].reduce((sum, field) => sum + (row[field] || 0), 0);
      }
      
      data.push(row as RepositoryData);
    } catch (error) {
      // Skip invalid rows
      continue;
    }
  }
  
  return data;
}

export function calculateStatistics(data: RepositoryData[], column: string): StatisticalSummary {
  const values = data.map(row => (row as any)[column]).filter(val => typeof val === 'number' && !isNaN(val));
  
  if (values.length === 0) {
    return { count: 0, mean: 0, std: 0, min: 0, max: 0, p25: 0, p50: 0, p75: 0 };
  }
  
  values.sort((a, b) => a - b);
  
  const count = values.length;
  const mean = values.reduce((sum, val) => sum + val, 0) / count;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count;
  const std = Math.sqrt(variance);
  
  const getPercentile = (p: number) => {
    const index = Math.ceil(count * p / 100) - 1;
    return values[Math.max(0, Math.min(index, count - 1))];
  };
  
  return {
    count,
    mean: Math.round(mean * 100) / 100,
    std: Math.round(std * 100) / 100,
    min: values[0],
    max: values[count - 1],
    p25: getPercentile(25),
    p50: getPercentile(50),
    p75: getPercentile(75)
  };
}

export function getPercentileRepos(data: RepositoryData[], percentiles: number[]): PercentileRepo[] {
  const sortedData = [...data].sort((a, b) => a.Repo_Size_mb - b.Repo_Size_mb);
  const count = sortedData.length;
  
  return percentiles.map(p => {
    const index = Math.ceil(count * p / 100) - 1;
    const repo = sortedData[Math.max(0, Math.min(index, count - 1))];
    return {
      repo,
      percentile: p,
      size: repo.Repo_Size_mb
    };
  });
}

export function calculateAge(createdDate: string): number {
  const created = new Date(createdDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Days
}

export function getColorForValue(value: number, min: number, max: number): string {
  const ratio = max === min ? 0 : (value - min) / (max - min);
  const hue = (1 - ratio) * 120; // From green (120) to red (0)
  return `hsl(${hue}, 70%, 50%)`;
}