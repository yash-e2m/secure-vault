import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { User, Client, Credential } from '@/types';
import { authApi, usersApi, clientsApi, credentialsApi } from '@/services/api';

interface DataContextType {
  user: User | null;
  clients: Client[];
  credentials: Credential[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role?: string) => Promise<boolean>;
  logout: () => void;
  refreshData: () => Promise<void>;
  addClient: (client: Omit<Client, 'id' | 'credentialCount' | 'lastAccessed' | 'createdAt'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addCredential: (credential: Omit<Credential, 'id' | 'lastUpdated' | 'createdAt'>) => Promise<void>;
  updateCredential: (id: string, credential: Partial<Credential>) => Promise<void>;
  deleteCredential: (id: string) => Promise<void>;
  getClientCredentials: (clientId: string) => Credential[];
  updateLastAccessed: (clientId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper to get stored user from localStorage
const getStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem('user');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to parse stored user');
  }
  return null;
};

// Helper to store user in localStorage
const storeUser = (user: User | null) => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize from localStorage for instant session restoration
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const hasToken = authApi.isAuthenticated();
    const hasUser = !!getStoredUser();
    return hasToken && hasUser;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [clients, setClients] = useState<Client[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const isRefreshing = useRef(false);

  const refreshData = useCallback(async () => {
    // Prevent concurrent refresh calls
    if (isRefreshing.current) {
      return;
    }

    if (!authApi.isAuthenticated()) {
      setIsLoading(false);
      setIsAuthenticated(false);
      setUser(null);
      storeUser(null);
      return;
    }

    isRefreshing.current = true;
    setError(null);

    try {
      const [userData, clientsData, credsData] = await Promise.all([
        usersApi.getCurrentUser(),
        clientsApi.getAll(),
        credentialsApi.getAll(),
      ]);

      setUser(userData);
      storeUser(userData);
      setClients(clientsData);
      setCredentials(credsData);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Error refreshing data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);

      // Only logout on explicit auth errors (401), not on network errors
      if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('unauthorized')) {
        setIsAuthenticated(false);
        setUser(null);
        storeUser(null);
        authApi.logout();
      } else {
        // For network errors, keep session alive if we have stored user
        const storedUser = getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
        }
      }
    } finally {
      setIsLoading(false);
      isRefreshing.current = false;
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      const data = await authApi.login(email, password);
      setUser(data.user);
      storeUser(data.user);
      setIsAuthenticated(true);
      // Refresh data in background, don't block login
      refreshData().catch(console.error);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, role?: string): Promise<boolean> => {
    setError(null);
    try {
      const data = await authApi.register(name, email, password, role);
      setUser(data.user);
      storeUser(data.user);
      setIsAuthenticated(true);
      // Refresh data in background
      refreshData().catch(console.error);
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
      return false;
    }
  };

  const logout = () => {
    authApi.logout();
    setIsAuthenticated(false);
    setUser(null);
    storeUser(null);
    setClients([]);
    setCredentials([]);
    setError(null);
  };

  const addClient = async (client: Omit<Client, 'id' | 'credentialCount' | 'lastAccessed' | 'createdAt'>) => {
    const newClient = await clientsApi.create({
      name: client.name,
      description: client.description,
      initials: client.initials,
      color: client.color,
    });
    setClients((prev) => [...prev, newClient]);
  };

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    const updated = await clientsApi.update(id, clientData);
    setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const deleteClient = async (id: string) => {
    await clientsApi.delete(id);
    setClients((prev) => prev.filter((c) => c.id !== id));
    setCredentials((prev) => prev.filter((cred) => cred.clientId !== id));
  };

  const addCredential = async (credential: Omit<Credential, 'id' | 'lastUpdated' | 'createdAt'>) => {
    const newCred = await credentialsApi.create({
      clientId: credential.clientId,
      name: credential.name,
      environment: credential.environment,
      serviceType: credential.serviceType,
      username: credential.username,
      password: credential.password,
      url: credential.url,
      notes: credential.notes,
      tags: credential.tags,
      allowedUserIds: credential.allowedUsers?.map(u => u.id),
    });
    setCredentials((prev) => [...prev, newCred]);
    setClients((prev) =>
      prev.map((c) =>
        c.id === credential.clientId
          ? { ...c, credentialCount: c.credentialCount + 1 }
          : c
      )
    );
  };

  const updateCredential = async (id: string, credentialData: Partial<Credential>) => {
    // Extract allowedUserIds from allowedUsers for the API call
    const apiData: any = { ...credentialData };
    if (credentialData.allowedUsers) {
      apiData.allowedUserIds = credentialData.allowedUsers.map(u => u.id);
      delete apiData.allowedUsers;
    }
    // Remove fields that shouldn't be sent to the API
    delete apiData.isLegacy;
    delete apiData.isOwner;
    delete apiData.viewerCount;
    delete apiData.ownerId;
    delete apiData.ownerName;

    const updated = await credentialsApi.update(id, apiData);
    setCredentials((prev) =>
      prev.map((cred) => (cred.id === id ? updated : cred))
    );
  };

  const deleteCredential = async (id: string) => {
    const credential = credentials.find((c) => c.id === id);
    if (credential) {
      await credentialsApi.delete(id);
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

  // Make this non-blocking - fire and forget
  const updateLastAccessed = (clientId: string) => {
    // Update local state immediately
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId ? { ...c, lastAccessed: new Date() } : c
      )
    );
    // Fire API call in background, don't await
    clientsApi.updateLastAccessed(clientId).catch(console.warn);
  };

  return (
    <DataContext.Provider
      value={{
        user,
        clients,
        credentials,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        logout,
        refreshData,
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
