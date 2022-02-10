export interface CommitData {
  workspace: string;
  repo: string;
  target: string;
  message: string;
  files: Record<string, string>[];
}

export interface ExistingPullRequestData {
  id: string;
  title: string;
  repo: string;
  workspace: string;
}

export interface CreatePullRequestData {
  title: string;
  source: string;
  destination: string;
  repo: string;
  workspace: string;
}

export interface CreatePullRequestResponse {
  id: string;
  title: string;
  link: string;
}

export interface MergePullRequestResponse {
  id: string;
  title: string;
  link: string;
  hash: string;
}

export interface ApprovePullRequestResponse {
  id: string;
  title: string;
}

export interface BranchResponse {
  name: string;
  link: string;
  data: Record<string, any>;
}

export interface BranchData {
  name: string;
  source: string;
  repo: string;
  workspace: string;
}

export interface TagResponse {
  name: string;
  link: string;
  data: Record<string, any>;
}

export interface TagData {
  name: string;
  hash: string;
  repo: string;
  workspace: string;
}

export interface FileData {
  source: string;
  path: string;
  repo: string;
  workspace: string;
}
