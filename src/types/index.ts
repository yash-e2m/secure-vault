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

export type EnvironmentType = 'development' | 'staging' | 'production';
export type ServiceType = 'database' | 'api' | 'cloud' | 'env' | 'other';

export interface AllowedUser {
  id: string;
  name: string;
  email: string;
}

export interface Credential {
  id: string;
  clientId: string;
  name: string;
  environment: EnvironmentType;
  serviceType: ServiceType;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  tags: string[];
  lastUpdated: Date;
  createdAt: Date;
  // Visibility fields
  ownerId?: string;
  ownerName?: string;
  isLegacy: boolean;
  isOwner: boolean;
  allowedUsers: AllowedUser[];
  viewerCount: number;
}

