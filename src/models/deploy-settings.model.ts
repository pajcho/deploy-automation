export interface DeployApplication {
  title: string;
  value: string;
  workspace: string;
  mainBranch: string;
  developmentBranch: string;
}

export interface DeployTenant {
  title: string;
  value: string;
}

export interface DeployConnection {
  username: string;
  password: string;
}

export interface DeploySettings {
  connections?: {
    bitbucket?: DeployConnection;
  };
  applications?: DeployApplication[];
  tenants?: DeployTenant[];
}
