import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Client, Credential } from '@/types';

interface DataContextType {
  user: User;
  clients: Client[];
  credentials: Credential[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  addClient: (client: Omit<Client, 'id' | 'credentialCount' | 'lastAccessed' | 'createdAt'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addCredential: (credential: Omit<Credential, 'id' | 'lastUpdated' | 'createdAt'>) => void;
  updateCredential: (id: string, credential: Partial<Credential>) => void;
  deleteCredential: (id: string) => void;
  getClientCredentials: (clientId: string) => Credential[];
  updateLastAccessed: (clientId: string) => void;
}

const initialUser: User = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@company.com',
  role: 'Senior Developer',
};

const clientColors = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#6366f1'];

const initialClients: Client[] = [
  {
    id: '1',
    name: 'Acme Corporation',
    description: 'E-commerce platform with multi-tenant architecture',
    initials: 'AC',
    color: clientColors[0],
    credentialCount: 6,
    lastAccessed: new Date(Date.now() - 1000 * 60 * 30),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
  },
  {
    id: '2',
    name: 'TechStart Inc',
    description: 'SaaS Application for project management',
    initials: 'TS',
    color: clientColors[1],
    credentialCount: 5,
    lastAccessed: new Date(Date.now() - 1000 * 60 * 60 * 2),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
  },
  {
    id: '3',
    name: 'Global Finance',
    description: 'Financial Dashboard and Analytics Platform',
    initials: 'GF',
    color: clientColors[2],
    credentialCount: 4,
    lastAccessed: new Date(Date.now() - 1000 * 60 * 60 * 24),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
  },
  {
    id: '4',
    name: 'HealthCare Plus',
    description: 'Healthcare management system',
    initials: 'HC',
    color: clientColors[3],
    credentialCount: 5,
    lastAccessed: new Date(Date.now() - 1000 * 60 * 60 * 48),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
  },
];

const initialCredentials: Credential[] = [
  // Acme Corporation credentials
  {
    id: 'cred-1',
    clientId: '1',
    name: 'PostgreSQL Production',
    environment: 'production',
    serviceType: 'database',
    username: 'acme_prod_user',
    password: 'Pr0d$ecure#2024!',
    url: 'postgresql://db.acme.com:5432/production',
    notes: 'Main production database. Handle with care.',
    tags: ['critical', 'production'],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
  },
  {
    id: 'cred-2',
    clientId: '1',
    name: 'Stripe API Key',
    environment: 'production',
    serviceType: 'api',
    username: 'sk_live_acme',
    password: 'sk_live_51Hb2e8K9...',
    url: 'https://dashboard.stripe.com',
    notes: 'Production Stripe keys for payment processing',
    tags: ['payments', 'api'],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 85),
  },
  {
    id: 'cred-3',
    clientId: '1',
    name: 'AWS Console',
    environment: 'production',
    serviceType: 'cloud',
    username: 'acme-admin@aws.com',
    password: 'AWS@cme2024!Secure',
    url: 'https://acme.signin.aws.amazon.com/console',
    notes: 'AWS root account access',
    tags: ['cloud', 'aws', 'critical'],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 80),
  },
  {
    id: 'cred-4',
    clientId: '1',
    name: 'PostgreSQL Staging',
    environment: 'staging',
    serviceType: 'database',
    username: 'acme_staging_user',
    password: 'St@g1ng#2024',
    url: 'postgresql://staging.acme.com:5432/staging',
    tags: ['staging', 'database'],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 75),
  },
  {
    id: 'cred-5',
    clientId: '1',
    name: 'SendGrid API',
    environment: 'production',
    serviceType: 'api',
    username: 'acme-mail',
    password: 'SG.xxxxx.yyyyy',
    url: 'https://app.sendgrid.com',
    notes: 'Email service for transactional emails',
    tags: ['email', 'api'],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 70),
  },
  {
    id: 'cred-6',
    clientId: '1',
    name: 'MongoDB Development',
    environment: 'development',
    serviceType: 'database',
    username: 'dev_user',
    password: 'dev123!@#',
    url: 'mongodb://localhost:27017/acme_dev',
    tags: ['development', 'local'],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
  },
  // TechStart Inc credentials
  {
    id: 'cred-7',
    clientId: '2',
    name: 'MongoDB Atlas Production',
    environment: 'production',
    serviceType: 'database',
    username: 'techstart_prod',
    password: 'M0ng0@tl@s#Pr0d',
    url: 'mongodb+srv://cluster.mongodb.net/techstart',
    tags: ['database', 'production'],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 55),
  },
  {
    id: 'cred-8',
    clientId: '2',
    name: 'Azure DevOps',
    environment: 'production',
    serviceType: 'cloud',
    username: 'techstart-admin@azure.com',
    password: 'Azure@DevOps2024!',
    url: 'https://dev.azure.com/techstart',
    tags: ['cloud', 'devops'],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 50),
  },
  {
    id: 'cred-9',
    clientId: '2',
    name: 'Twilio API',
    environment: 'production',
    serviceType: 'api',
    username: 'ACxxxxxxxxxxxxxx',
    password: 'auth_token_xxxxx',
    url: 'https://console.twilio.com',
    notes: 'SMS and voice services',
    tags: ['sms', 'api'],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
  },
  {
    id: 'cred-10',
    clientId: '2',
    name: 'Redis Cloud',
    environment: 'staging',
    serviceType: 'database',
    username: 'techstart-redis',
    password: 'Redis#Cl0ud2024',
    url: 'redis://redis.techstart.com:6379',
    tags: ['cache', 'staging'],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40),
  },
  {
    id: 'cred-11',
    clientId: '2',
    name: 'GitHub Enterprise',
    environment: 'production',
    serviceType: 'other',
    username: 'techstart-bot',
    password: 'ghp_xxxxxxxxxxxxxx',
    url: 'https://github.com/techstart',
    tags: ['git', 'ci-cd'],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35),
  },
  // Global Finance credentials
  {
    id: 'cred-12',
    clientId: '3',
    name: 'Oracle Database',
    environment: 'production',
    serviceType: 'database',
    username: 'gf_prod_admin',
    password: '0r@cl3#F1n@nce!',
    url: 'oracle://db.globalfinance.com:1521/FINDB',
    notes: 'Financial data warehouse',
    tags: ['database', 'critical', 'financial'],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40),
  },
  {
    id: 'cred-13',
    clientId: '3',
    name: 'GCP Service Account',
    environment: 'production',
    serviceType: 'cloud',
    username: 'gf-analytics@gcp.com',
    password: '{"type":"service_account"...}',
    url: 'https://console.cloud.google.com',
    tags: ['cloud', 'gcp', 'analytics'],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35),
  },
  {
    id: 'cred-14',
    clientId: '3',
    name: 'Plaid API',
    environment: 'production',
    serviceType: 'api',
    username: 'client_id_xxxxx',
    password: 'secret_xxxxx',
    url: 'https://dashboard.plaid.com',
    notes: 'Banking data aggregation',
    tags: ['api', 'banking', 'financial'],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
  },
  {
    id: 'cred-15',
    clientId: '3',
    name: 'PostgreSQL Staging',
    environment: 'staging',
    serviceType: 'database',
    username: 'gf_staging',
    password: 'Stag1ng#GF2024',
    url: 'postgresql://staging.globalfinance.com:5432/staging',
    tags: ['database', 'staging'],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25),
  },
  // HealthCare Plus credentials
  {
    id: 'cred-16',
    clientId: '4',
    name: 'PostgreSQL HIPAA',
    environment: 'production',
    serviceType: 'database',
    username: 'hc_hipaa_admin',
    password: 'H1P@@#S3cur3!2024',
    url: 'postgresql://hipaa.healthcare.com:5432/main',
    notes: 'HIPAA compliant database - encrypted at rest',
    tags: ['database', 'hipaa', 'critical'],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25),
  },
  {
    id: 'cred-17',
    clientId: '4',
    name: 'AWS HealthLake',
    environment: 'production',
    serviceType: 'cloud',
    username: 'healthlake-admin',
    password: 'AWS#H3@lthL@ke!',
    url: 'https://healthlake.aws.amazon.com',
    tags: ['cloud', 'aws', 'hipaa'],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
  },
  {
    id: 'cred-18',
    clientId: '4',
    name: 'Zoom Healthcare API',
    environment: 'production',
    serviceType: 'api',
    username: 'api_key_xxxxx',
    password: 'api_secret_xxxxx',
    url: 'https://marketplace.zoom.us',
    notes: 'Telehealth video integration',
    tags: ['api', 'video', 'telehealth'],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
  },
  {
    id: 'cred-19',
    clientId: '4',
    name: 'MongoDB Dev',
    environment: 'development',
    serviceType: 'database',
    username: 'hc_dev',
    password: 'DevL0cal#123',
    url: 'mongodb://localhost:27017/healthcare_dev',
    tags: ['database', 'development'],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
  },
  {
    id: 'cred-20',
    clientId: '4',
    name: 'DocuSign Integration',
    environment: 'production',
    serviceType: 'api',
    username: 'integrator_key_xxx',
    password: 'api_password_xxx',
    url: 'https://admin.docusign.com',
    notes: 'Patient consent forms',
    tags: ['api', 'documents'],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
  },
];

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user] = useState<User>(initialUser);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [credentials, setCredentials] = useState<Credential[]>(initialCredentials);

  const login = (email: string, password: string): boolean => {
    if (email && password) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const addClient = (client: Omit<Client, 'id' | 'credentialCount' | 'lastAccessed' | 'createdAt'>) => {
    const newClient: Client = {
      ...client,
      id: `client-${Date.now()}`,
      credentialCount: 0,
      lastAccessed: new Date(),
      createdAt: new Date(),
    };
    setClients((prev) => [...prev, newClient]);
  };

  const updateClient = (id: string, clientData: Partial<Client>) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...clientData } : c))
    );
  };

  const deleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    setCredentials((prev) => prev.filter((cred) => cred.clientId !== id));
  };

  const addCredential = (credential: Omit<Credential, 'id' | 'lastUpdated' | 'createdAt'>) => {
    const newCredential: Credential = {
      ...credential,
      id: `cred-${Date.now()}`,
      lastUpdated: new Date(),
      createdAt: new Date(),
    };
    setCredentials((prev) => [...prev, newCredential]);
    setClients((prev) =>
      prev.map((c) =>
        c.id === credential.clientId
          ? { ...c, credentialCount: c.credentialCount + 1 }
          : c
      )
    );
  };

  const updateCredential = (id: string, credentialData: Partial<Credential>) => {
    setCredentials((prev) =>
      prev.map((cred) =>
        cred.id === id ? { ...cred, ...credentialData, lastUpdated: new Date() } : cred
      )
    );
  };

  const deleteCredential = (id: string) => {
    const credential = credentials.find((c) => c.id === id);
    if (credential) {
      setCredentials((prev) => prev.filter((c) => c.id !== id));
      setClients((prev) =>
        prev.map((c) =>
          c.id === credential.clientId
            ? { ...c, credentialCount: Math.max(0, c.credentialCount - 1) }
            : c
        )
      );
    }
  };

  const getClientCredentials = (clientId: string): Credential[] => {
    return credentials.filter((c) => c.clientId === clientId);
  };

  const updateLastAccessed = (clientId: string) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId ? { ...c, lastAccessed: new Date() } : c
      )
    );
  };

  return (
    <DataContext.Provider
      value={{
        user,
        clients,
        credentials,
        isAuthenticated,
        login,
        logout,
        addClient,
        updateClient,
        deleteClient,
        addCredential,
        updateCredential,
        deleteCredential,
        getClientCredentials,
        updateLastAccessed,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
