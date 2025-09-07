export interface RepositoryData {
  Org_Name: string;
  Repo_Name: string;
  Is_Empty: boolean;
  Last_Push: string;
  Last_Update: string;
  isFork: boolean;
  isArchived: boolean;
  Repo_Size_mb: number;
  Record_Count: number;
  Collaborator_Count: number;
  Protected_Branch_Count: number;
  PR_Review_Count: number;
  Milestone_Count: number;
  Issue_Count: number;
  PR_Count: number;
  PR_Review_Comment_Count: number;
  Commit_Comment_Count: number;
  Issue_Comment_Count: number;
  Issue_Event_Count: number;
  Release_Count: number;
  Project_Count: number;
  Branch_Count: number;
  Tag_Count: number;
  Discussion_Count: number;
  Has_Wiki: boolean;
  Full_URL: string;
  Migration_Issue: string;
  Created: string;
}

export interface StatisticalSummary {
  count: number;
  mean: number;
  std: number;
  min: number;
  max: number;
  p25: number;
  p50: number;
  p75: number;
}

export interface PercentileRepo {
  repo: RepositoryData;
  percentile: number;
  size: number;
}

export const REQUIRED_COLUMNS = [
  'Org_Name', 'Repo_Name', 'Is_Empty', 'Last_Push', 'Last_Update', 
  'isFork', 'isArchived', 'Repo_Size_mb', 'Record_Count', 'Collaborator_Count',
  'Protected_Branch_Count', 'PR_Review_Count', 'Milestone_Count', 'Issue_Count',
  'PR_Count', 'PR_Review_Comment_Count', 'Commit_Comment_Count', 'Issue_Comment_Count',
  'Issue_Event_Count', 'Release_Count', 'Project_Count', 'Branch_Count',
  'Tag_Count', 'Discussion_Count', 'Has_Wiki', 'Full_URL', 'Migration_Issue', 'Created'
];

export const NUMERICAL_COLUMNS = [
  'Repo_Size_mb', 'Record_Count', 'Collaborator_Count', 'Protected_Branch_Count',
  'PR_Review_Count', 'Milestone_Count', 'Issue_Count', 'PR_Count',
  'PR_Review_Comment_Count', 'Commit_Comment_Count', 'Issue_Comment_Count',
  'Issue_Event_Count', 'Release_Count', 'Project_Count', 'Branch_Count',
  'Tag_Count', 'Discussion_Count'
];