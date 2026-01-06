export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface Client {
  id: string;
  name: string;
  description: string;
  logo?: string;
  initials: string;
  color: string;
  credentialCount: number;
  lastAccessed: Date;
  createdAt: Date;
}

export interface Credential {
  id: string;
  clientId: string;
  name: string;
  environment: 'development' | 'staging' | 'production';
  serviceType: 'database' | 'api' | 'cloud' | 'other';
  username: string;
  password: string;
  url?: string;
  notes?: string;
  tags: string[];
  lastUpdated: Date;
  createdAt: Date;
}

export type EnvironmentType = 'development' | 'staging' | 'production';
export type ServiceType = 'database' | 'api' | 'cloud' | 'other';
