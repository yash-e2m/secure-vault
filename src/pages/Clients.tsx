import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Minus,
  Edit2,
  Trash2,
  Key,
  Clock,
  Grid3X3,
  List,
  ArrowLeft,
  Eye,
  EyeOff,
  Copy,
  Database,
  Cloud,
  Code,
  MoreHorizontal,
  ExternalLink,
  FileCode,
  Users,
  Shield,
  Globe,
  UserCheck,
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Client, Credential, EnvironmentType, ServiceType, AllowedUser } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { usersApi } from '@/services/api';

const serviceTypeIcons: Record<ServiceType, typeof Database> = {
  database: Database,
  api: Code,
  cloud: Cloud,
  env: FileCode,
  other: MoreHorizontal,
};

const environmentColors: Record<EnvironmentType, string> = {
  production: 'bg-[#FFE8EC] text-[#E85D75] border-[#E85D75]/30',
  staging: 'bg-[#FFF4E6] text-[#CC7F00] border-[#FF9F00]/30',
  development: 'bg-[#F0EDFF] text-[#7B61FF] border-[#7B61FF]/30',
};

const clientColors = ['#0EA5E9', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

const Clients = () => {
  const {
    clients,
    credentials,
    addClient,
    updateClient,
    deleteClient,
    addCredential,
    updateCredential,
    deleteCredential,
    getClientCredentials,
    updateLastAccessed,
  } = useData();
  const navigate = useNavigate();
  const { clientId } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCredDeleteDialogOpen, setIsCredDeleteDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [deletingCredential, setDeletingCredential] = useState<Credential | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  // Client form state
  const [clientForm, setClientForm] = useState({
    name: '',
    description: '',
    initials: '',
    color: clientColors[0],
  });

  // Credential form state
  const [credentialForm, setCredentialForm] = useState({
    clientId: '',
    name: '',
    environment: 'development' as EnvironmentType,
    serviceType: 'database' as ServiceType,
    username: '',
    password: '',
    url: '',
    notes: '',
    tags: '',
  });

  // Env pairs state for multiple env variables
  const [envPairs, setEnvPairs] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' }
  ]);

  // User visibility state
  const [allUsers, setAllUsers] = useState<AllowedUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [visibilityMode, setVisibilityMode] = useState<'all' | 'specific'>('all');

  // Get selected client details
  const selectedClient = clientId ? clients.find((c) => c.id === clientId) : null;
  const clientCredentials = clientId ? getClientCredentials(clientId) : [];

  // Update last accessed when viewing client
  useEffect(() => {
    if (clientId && selectedClient) {
      updateLastAccessed(clientId);
    }
  }, [clientId]);

  // Handle URL params for modal opening
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'add') {
      handleAddClient();
    }
  }, [searchParams]);

  // Filter clients
  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddClient = () => {
    setEditingClient(null);
    setClientForm({
      name: '',
      description: '',
      initials: '',
      color: clientColors[Math.floor(Math.random() * clientColors.length)],
    });
    setIsClientModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setClientForm({
      name: client.name,
      description: client.description,
      initials: client.initials,
      color: client.color,
    });
    setIsClientModalOpen(true);
  };

  const handleSaveClient = async () => {
    if (!clientForm.name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a client name.',
        variant: 'destructive',
      });
      return;
    }

    const initials = clientForm.initials || clientForm.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

    try {
      if (editingClient) {
        await updateClient(editingClient.id, { ...clientForm, initials });
        toast({ title: 'Client updated', description: 'Client details have been saved.' });
      } else {
        await addClient({ ...clientForm, initials });
        toast({ title: 'Client added', description: 'New client has been created.' });
      }
      setIsClientModalOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save client. Please try again.', variant: 'destructive' });
    }
  };

  const handleDeleteClient = async () => {
    if (deletingClient) {
      try {
        await deleteClient(deletingClient.id);
        toast({ title: 'Client deleted', description: 'Client and all credentials have been removed.' });
        setIsDeleteDialogOpen(false);
        if (clientId === deletingClient.id) {
          navigate('/clients');
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete client.', variant: 'destructive' });
      } finally {
        setDeletingClient(null);
      }
    }
  };

  const handleAddCredential = async (forClientId?: string) => {
    setEditingCredential(null);
    setCredentialForm({
      clientId: forClientId || clientId || '',
      name: '',
      environment: 'development',
      serviceType: 'database',
      username: '',
      password: '',
      url: '',
      notes: '',
      tags: '',
    });
    setVisibilityMode('all');
    setSelectedUserIds([]);

    // Load all users for visibility selection
    try {
      const users = await usersApi.getAll();
      setAllUsers(users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }

    setIsCredentialModalOpen(true);
  };

  const handleEditCredential = async (credential: Credential) => {
    setEditingCredential(credential);
    setCredentialForm({
      clientId: credential.clientId,
      name: credential.name,
      environment: credential.environment,
      serviceType: credential.serviceType,
      username: credential.username,
      password: credential.password,
      url: credential.url || '',
      notes: credential.notes || '',
      tags: credential.tags.join(', '),
    });

    // Set visibility state from credential
    if (credential.isLegacy) {
      setVisibilityMode('all');
      setSelectedUserIds([]);
    } else {
      setVisibilityMode('specific');
      setSelectedUserIds(credential.allowedUsers?.map(u => u.id) || []);
    }

    // Load all users for visibility selection
    try {
      const users = await usersApi.getAll();
      setAllUsers(users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }

    setIsCredentialModalOpen(true);
  };

  const handleSaveCredential = async () => {
    if (!credentialForm.name.trim() || !credentialForm.clientId) {
      toast({
        title: 'Required fields missing',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const tags = credentialForm.tags.split(',').map((t) => t.trim()).filter(Boolean);

    // Build allowed users based on visibility mode
    const allowedUsers: AllowedUser[] = visibilityMode === 'specific'
      ? allUsers.filter(u => selectedUserIds.includes(u.id))
      : [];

    // Build the credential data based on service type
    let credentialData = { ...credentialForm };

    if (credentialForm.serviceType === 'env') {
      // For env variables, combine key-value pairs into a special format
      const validPairs = envPairs.filter(p => p.key.trim() && p.value.trim());
      if (validPairs.length === 0) {
        toast({
          title: 'Required fields missing',
          description: 'Please add at least one environment variable.',
          variant: 'destructive',
        });
        return;
      }
      // Store env pairs as JSON in the password field, keys in username
      credentialData.username = validPairs.map(p => p.key).join(', ');
      credentialData.password = JSON.stringify(Object.fromEntries(validPairs.map(p => [p.key, p.value])));
    } else if (credentialForm.serviceType === 'api') {
      // For API keys, the username field contains the API key - move it to password
      // The name field becomes the identifier
      if (!credentialData.password && credentialData.username) {
        credentialData.password = credentialData.username;
        credentialData.username = credentialData.name;
      }
    }

    try {
      if (editingCredential) {
        await updateCredential(editingCredential.id, {
          ...credentialData,
          tags,
          allowedUsers,
        });
        toast({ title: 'Credential updated', description: 'Changes have been saved.' });
      } else {
        await addCredential({
          ...credentialData,
          tags,
          isLegacy: visibilityMode === 'all',
          isOwner: true,
          allowedUsers,
          viewerCount: allowedUsers.length,
        });
        toast({ title: 'Credential added', description: 'New credential has been stored.' });
      }
      setIsCredentialModalOpen(false);
      // Reset env pairs for next time
      setEnvPairs([{ key: '', value: '' }]);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save credential. Please try again.', variant: 'destructive' });
    }
  };

  const handleDeleteCredential = async () => {
    if (deletingCredential) {
      try {
        await deleteCredential(deletingCredential.id);
        toast({ title: 'Credential deleted', description: 'Credential has been removed.' });
        setIsCredDeleteDialogOpen(false);
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete credential.', variant: 'destructive' });
      } finally {
        setDeletingCredential(null);
      }
    }
  };

  const togglePasswordVisibility = (credId: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(credId)) {
        next.delete(credId);
      } else {
        next.add(credId);
      }
      return next;
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: `${label} copied to clipboard.` });
  };

  // Client Detail View
  if (selectedClient) {
    const groupedCredentials = {
      production: clientCredentials.filter((c) => c.environment === 'production'),
      staging: clientCredentials.filter((c) => c.environment === 'staging'),
      development: clientCredentials.filter((c) => c.environment === 'development'),
    };

    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold flex-shrink-0"
              style={{ backgroundColor: `${selectedClient.color}20`, color: selectedClient.color }}
            >
              {selectedClient.initials}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{selectedClient.name}</h1>
              <p className="text-muted-foreground">{selectedClient.description}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleEditClient(selectedClient)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setDeletingClient(selectedClient);
                  setIsDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button className="btn-primary" onClick={() => handleAddCredential()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Credential
              </Button>
            </div>
          </div>

          {/* Credentials by Environment */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="all">All ({clientCredentials.length})</TabsTrigger>
              <TabsTrigger value="production">Production ({groupedCredentials.production.length})</TabsTrigger>
              <TabsTrigger value="staging">Staging ({groupedCredentials.staging.length})</TabsTrigger>
              <TabsTrigger value="development">Development ({groupedCredentials.development.length})</TabsTrigger>
            </TabsList>

            {['all', 'production', 'staging', 'development'].map((env) => {
              const creds = env === 'all' ? clientCredentials : groupedCredentials[env as EnvironmentType];
              return (
                <TabsContent key={env} value={env} className="space-y-4">
                  {creds.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                      <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-lg">No credentials found</h3>
                      <p className="text-muted-foreground mt-1 mb-4">
                        {env === 'all' ? 'Add your first credential for this client' : `No ${env} credentials yet`}
                      </p>
                      <Button className="btn-primary" onClick={() => handleAddCredential()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Credential
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {creds.map((credential) => {
                        const ServiceIcon = serviceTypeIcons[credential.serviceType];
                        const isVisible = visiblePasswords.has(credential.id);
                        return (
                          <motion.div
                            key={credential.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-5"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                                <ServiceIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0 space-y-3">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <h3 className="font-semibold">{credential.name}</h3>
                                  <Badge variant="outline" className={environmentColors[credential.environment]}>
                                    {credential.environment}
                                  </Badge>
                                  <Badge variant="secondary" className="capitalize">
                                    {credential.serviceType}
                                  </Badge>
                                  {/* Visibility badges */}
                                  {credential.isOwner && (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                      <Shield className="h-3 w-3 mr-1" />
                                      Owner
                                    </Badge>
                                  )}
                                  {!credential.isOwner && !credential.isLegacy && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                      <UserCheck className="h-3 w-3 mr-1" />
                                      Shared
                                    </Badge>
                                  )}
                                  {credential.isLegacy && (
                                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                                      <Globe className="h-3 w-3 mr-1" />
                                      Everyone
                                    </Badge>
                                  )}
                                  {!credential.isLegacy && credential.viewerCount > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      <Users className="h-3 w-3 inline mr-1" />
                                      {credential.viewerCount} user{credential.viewerCount !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Username / Key</p>
                                    <div className="flex items-center gap-2">
                                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1 truncate">
                                        {credential.username}
                                      </code>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => copyToClipboard(credential.username, 'Username')}
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Password / Secret</p>
                                    <div className="flex items-center gap-2">
                                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1 truncate credential-mask">
                                        {isVisible ? credential.password : '••••••••••••'}
                                      </code>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => togglePasswordVisibility(credential.id)}
                                      >
                                        {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => copyToClipboard(credential.password, 'Password')}
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                {credential.url && (
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">URL / Endpoint</p>
                                    <div className="flex items-center gap-2">
                                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1 truncate">
                                        {credential.url}
                                      </code>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => copyToClipboard(credential.url!, 'URL')}
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                      </Button>
                                      {credential.url.startsWith('http') && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() => window.open(credential.url, '_blank')}
                                        >
                                          <ExternalLink className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {credential.notes && (
                                  <p className="text-sm text-muted-foreground">{credential.notes}</p>
                                )}

                                <div className="flex items-center justify-between pt-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {credential.tags.map((tag) => (
                                      <Badge key={tag} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>

                                </div>
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditCredential(credential)}>
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => {
                                      setDeletingCredential(credential);
                                      setIsCredDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </motion.div>

        {/* Client Modal */}
        <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
              <DialogDescription>
                {editingClient ? 'Update the client details below.' : 'Enter the details for your new client.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="clientNameDetail">Client Name *</Label>
                <Input
                  id="clientNameDetail"
                  placeholder="Enter client name"
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientDescriptionDetail">Description</Label>
                <Textarea
                  id="clientDescriptionDetail"
                  placeholder="Project description..."
                  value={clientForm.description}
                  onChange={(e) => setClientForm({ ...clientForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientInitialsDetail">Initials</Label>
                  <Input
                    id="clientInitialsDetail"
                    placeholder="AC"
                    maxLength={2}
                    value={clientForm.initials}
                    onChange={(e) => setClientForm({ ...clientForm, initials: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    {clientColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`h-8 w-8 rounded-full transition-transform ${clientForm.color === color ? 'scale-110 ring-2 ring-offset-2 ring-offset-background ring-primary' : ''
                          }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setClientForm({ ...clientForm, color })}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsClientModalOpen(false)}>
                Cancel
              </Button>
              <Button className="btn-primary" onClick={handleSaveClient}>
                {editingClient ? 'Save Changes' : 'Add Client'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Credential Modal */}
        <Dialog open={isCredentialModalOpen} onOpenChange={setIsCredentialModalOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCredential ? 'Edit Credential' : 'Add New Credential'}</DialogTitle>
              <DialogDescription>
                {editingCredential ? 'Update the credential details.' : 'Store a new credential securely.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="credNameDetail">Credential Name *</Label>
                <Input
                  id="credNameDetail"
                  placeholder="e.g., PostgreSQL Production"
                  value={credentialForm.name}
                  onChange={(e) => setCredentialForm({ ...credentialForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Environment</Label>
                  <Select
                    value={credentialForm.environment}
                    onValueChange={(value: EnvironmentType) =>
                      setCredentialForm({ ...credentialForm, environment: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Service Type</Label>
                  <Select
                    value={credentialForm.serviceType}
                    onValueChange={(value: ServiceType) =>
                      setCredentialForm({ ...credentialForm, serviceType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="api">API Keys</SelectItem>
                      <SelectItem value="env">Env Variable</SelectItem>
                      <SelectItem value="cloud">Cloud Services</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dynamic fields based on service type */}
              {/* Cloud Services & Other: Username field */}
              {(credentialForm.serviceType === 'cloud' || credentialForm.serviceType === 'other') && (
                <div className="space-y-2">
                  <Label htmlFor="credUsernameDetail">Username *</Label>
                  <Input
                    id="credUsernameDetail"
                    placeholder="Enter username"
                    value={credentialForm.username}
                    onChange={(e) => setCredentialForm({ ...credentialForm, username: e.target.value })}
                  />
                </div>
              )}

              {/* Database: Key field (stored as username) */}
              {credentialForm.serviceType === 'database' && (
                <div className="space-y-2">
                  <Label htmlFor="credKeyDetail">Key *</Label>
                  <Input
                    id="credKeyDetail"
                    placeholder="Database connection key"
                    value={credentialForm.username}
                    onChange={(e) => setCredentialForm({ ...credentialForm, username: e.target.value })}
                  />
                </div>
              )}

              {/* API Keys: Key field (stored as username) */}
              {credentialForm.serviceType === 'api' && (
                <div className="space-y-2">
                  <Label htmlFor="credApiKeyDetail">API Key *</Label>
                  <Input
                    id="credApiKeyDetail"
                    placeholder="Enter API key"
                    value={credentialForm.username}
                    onChange={(e) => setCredentialForm({ ...credentialForm, username: e.target.value })}
                  />
                </div>
              )}

              {/* Env Variable: Multiple key-value pairs */}
              {credentialForm.serviceType === 'env' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Environment Variables *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEnvPairs([...envPairs, { key: '', value: '' }])}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Variable
                    </Button>
                  </div>
                  {envPairs.map((pair, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-1">
                        <Input
                          placeholder="Variable name (e.g., DATABASE_URL)"
                          value={pair.key}
                          onChange={(e) => {
                            const newPairs = [...envPairs];
                            newPairs[index].key = e.target.value;
                            setEnvPairs(newPairs);
                          }}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Input
                          type="password"
                          placeholder="Value"
                          value={pair.value}
                          onChange={(e) => {
                            const newPairs = [...envPairs];
                            newPairs[index].value = e.target.value;
                            setEnvPairs(newPairs);
                          }}
                        />
                      </div>
                      {envPairs.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-destructive hover:text-destructive"
                          onClick={() => {
                            const newPairs = envPairs.filter((_, i) => i !== index);
                            setEnvPairs(newPairs);
                          }}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Database, Cloud, Other: Password field */}
              {(credentialForm.serviceType === 'database' || credentialForm.serviceType === 'cloud' || credentialForm.serviceType === 'other') && (
                <div className="space-y-2">
                  <Label htmlFor="credPasswordDetail">Password / Secret *</Label>
                  <Input
                    id="credPasswordDetail"
                    type="password"
                    placeholder="Password or secret"
                    value={credentialForm.password}
                    onChange={(e) => setCredentialForm({ ...credentialForm, password: e.target.value })}
                  />
                </div>
              )}

              {/* Database, Cloud, Other: URL field */}
              {(credentialForm.serviceType === 'database' || credentialForm.serviceType === 'cloud' || credentialForm.serviceType === 'other') && (
                <div className="space-y-2">
                  <Label htmlFor="credUrlDetail">URL / Endpoint</Label>
                  <Input
                    id="credUrlDetail"
                    placeholder="https://..."
                    value={credentialForm.url}
                    onChange={(e) => setCredentialForm({ ...credentialForm, url: e.target.value })}
                  />
                </div>
              )}

              {/* Notes - always shown */}
              <div className="space-y-2">
                <Label htmlFor="credNotesDetail">Notes</Label>
                <Textarea
                  id="credNotesDetail"
                  placeholder="Additional notes..."
                  value={credentialForm.notes}
                  onChange={(e) => setCredentialForm({ ...credentialForm, notes: e.target.value })}
                />
              </div>

              {/* Tags - always shown */}
              <div className="space-y-2">
                <Label htmlFor="credTagsDetail">Tags (comma separated)</Label>
                <Input
                  id="credTagsDetail"
                  placeholder="production, critical, database"
                  value={credentialForm.tags}
                  onChange={(e) => setCredentialForm({ ...credentialForm, tags: e.target.value })}
                />
              </div>

              {/* Visibility Control */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-base font-semibold">Who can view this credential?</Label>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setVisibilityMode('all')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${visibilityMode === 'all'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                        }`}
                    >
                      <Globe className="h-4 w-4" />
                      <span>Everyone</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibilityMode('specific')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${visibilityMode === 'specific'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                        }`}
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>Specific Users</span>
                    </button>
                  </div>

                  {visibilityMode === 'specific' && (
                    <div className="space-y-2 p-3 bg-muted/50 rounded-lg max-h-48 overflow-y-auto">
                      {allUsers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Loading users...</p>
                      ) : (
                        allUsers.map((user) => (
                          <div key={user.id} className="flex items-center gap-3 py-1">
                            <Checkbox
                              id={`user-${user.id}`}
                              checked={selectedUserIds.includes(user.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedUserIds([...selectedUserIds, user.id]);
                                } else {
                                  setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                                }
                              }}
                            />
                            <label
                              htmlFor={`user-${user.id}`}
                              className="flex-1 text-sm cursor-pointer"
                            >
                              <span className="font-medium">{user.name}</span>
                              <span className="text-muted-foreground ml-2">({user.email})</span>
                            </label>
                          </div>
                        ))
                      )}
                      {visibilityMode === 'specific' && selectedUserIds.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                          {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
                        </p>
                      )}
                    </div>
                  )}

                  {visibilityMode === 'all' && (
                    <p className="text-sm text-muted-foreground">
                      All users in your organization will be able to view this credential.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCredentialModalOpen(false)}>
                Cancel
              </Button>
              <Button className="btn-primary" onClick={handleSaveCredential}>
                {editingCredential ? 'Save Changes' : 'Add Credential'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Client Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Client?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>{deletingClient?.name}</strong> and all associated credentials.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteClient}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Credential Confirmation */}
        <AlertDialog open={isCredDeleteDialogOpen} onOpenChange={setIsCredDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Credential?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>{deletingCredential?.name}</strong>.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteCredential}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Client List View
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1">
            Manage your clients and their credentials
          </p>
        </div>
        <Button className="btn-primary" onClick={handleAddClient}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Search and View Toggle */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex border rounded-lg p-1 bg-muted/50">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Clients Grid/List */}
      {filteredClients.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mx-auto mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">No clients found</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            {searchQuery ? 'Try a different search term' : 'Get started by adding your first client'}
          </p>
          {!searchQuery && (
            <Button className="btn-primary" onClick={handleAddClient}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          )}
        </div>
      ) : (
        <motion.div
          layout
          className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}
        >
          <AnimatePresence mode="popLayout">
            {filteredClients.map((client) => (
              <motion.div
                key={client.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                className="glass-card p-5 cursor-pointer glow-border group"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <div className={`flex ${viewMode === 'list' ? 'flex-row items-center' : 'flex-col'} gap-4`}>
                  <div
                    className={`flex items-center justify-center rounded-xl text-lg font-bold flex-shrink-0 ${viewMode === 'grid' ? 'h-14 w-14' : 'h-12 w-12'
                      }`}
                    style={{ backgroundColor: `${client.color}20`, color: client.color }}
                  >
                    {client.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                      {client.name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {client.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Key className="h-3 w-3" />
                        {client.credentialCount} credentials
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(client.lastAccessed, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Client Modal */}
      <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
            <DialogDescription>
              {editingClient ? 'Update the client details below.' : 'Enter the details for your new client.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                placeholder="Enter client name"
                value={clientForm.name}
                onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientDescription">Description</Label>
              <Textarea
                id="clientDescription"
                placeholder="Project description..."
                value={clientForm.description}
                onChange={(e) => setClientForm({ ...clientForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientInitials">Initials</Label>
                <Input
                  id="clientInitials"
                  placeholder="AC"
                  maxLength={2}
                  value={clientForm.initials}
                  onChange={(e) => setClientForm({ ...clientForm, initials: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {clientColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`h-8 w-8 rounded-full transition-transform ${clientForm.color === color ? 'scale-110 ring-2 ring-offset-2 ring-offset-background ring-primary' : ''
                        }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setClientForm({ ...clientForm, color })}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClientModalOpen(false)}>
              Cancel
            </Button>
            <Button className="btn-primary" onClick={handleSaveClient}>
              {editingClient ? 'Save Changes' : 'Add Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credential Modal */}
      <Dialog open={isCredentialModalOpen} onOpenChange={setIsCredentialModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCredential ? 'Edit Credential' : 'Add New Credential'}</DialogTitle>
            <DialogDescription>
              {editingCredential ? 'Update the credential details.' : 'Store a new credential securely.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {!clientId && (
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select
                  value={credentialForm.clientId}
                  onValueChange={(value) => setCredentialForm({ ...credentialForm, clientId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="credName">Credential Name *</Label>
              <Input
                id="credName"
                placeholder="e.g., PostgreSQL Production"
                value={credentialForm.name}
                onChange={(e) => setCredentialForm({ ...credentialForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Environment</Label>
                <Select
                  value={credentialForm.environment}
                  onValueChange={(value: EnvironmentType) =>
                    setCredentialForm({ ...credentialForm, environment: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Service Type</Label>
                <Select
                  value={credentialForm.serviceType}
                  onValueChange={(value: ServiceType) =>
                    setCredentialForm({ ...credentialForm, serviceType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="api">API Keys</SelectItem>
                    <SelectItem value="env">Env Variable</SelectItem>
                    <SelectItem value="cloud">Cloud Services</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dynamic fields based on service type */}
            {/* Cloud Services & Other: Username field */}
            {(credentialForm.serviceType === 'cloud' || credentialForm.serviceType === 'other') && (
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  placeholder="Enter username"
                  value={credentialForm.username}
                  onChange={(e) => setCredentialForm({ ...credentialForm, username: e.target.value })}
                />
              </div>
            )}

            {/* Database: Key field (stored as username) */}
            {credentialForm.serviceType === 'database' && (
              <div className="space-y-2">
                <Label htmlFor="dbKey">Key *</Label>
                <Input
                  id="dbKey"
                  placeholder="Database connection key"
                  value={credentialForm.username}
                  onChange={(e) => setCredentialForm({ ...credentialForm, username: e.target.value })}
                />
              </div>
            )}

            {/* API Keys: Key field (stored as username) */}
            {credentialForm.serviceType === 'api' && (
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key *</Label>
                <Input
                  id="apiKey"
                  placeholder="Enter API key"
                  value={credentialForm.username}
                  onChange={(e) => setCredentialForm({ ...credentialForm, username: e.target.value })}
                />
              </div>
            )}

            {/* Env Variable: Multiple key-value pairs */}
            {credentialForm.serviceType === 'env' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Environment Variables *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEnvPairs([...envPairs, { key: '', value: '' }])}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Variable
                  </Button>
                </div>
                {envPairs.map((pair, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-1">
                      <Input
                        placeholder="Variable name (e.g., DATABASE_URL)"
                        value={pair.key}
                        onChange={(e) => {
                          const newPairs = [...envPairs];
                          newPairs[index].key = e.target.value;
                          setEnvPairs(newPairs);
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Input
                        type="password"
                        placeholder="Value"
                        value={pair.value}
                        onChange={(e) => {
                          const newPairs = [...envPairs];
                          newPairs[index].value = e.target.value;
                          setEnvPairs(newPairs);
                        }}
                      />
                    </div>
                    {envPairs.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-destructive hover:text-destructive"
                        onClick={() => {
                          const newPairs = envPairs.filter((_, i) => i !== index);
                          setEnvPairs(newPairs);
                        }}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Database, Cloud, Other: Password field */}
            {(credentialForm.serviceType === 'database' || credentialForm.serviceType === 'cloud' || credentialForm.serviceType === 'other') && (
              <div className="space-y-2">
                <Label htmlFor="password">Password / Secret *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password or secret"
                  value={credentialForm.password}
                  onChange={(e) => setCredentialForm({ ...credentialForm, password: e.target.value })}
                />
              </div>
            )}

            {/* Database, Cloud, Other: URL field */}
            {(credentialForm.serviceType === 'database' || credentialForm.serviceType === 'cloud' || credentialForm.serviceType === 'other') && (
              <div className="space-y-2">
                <Label htmlFor="url">URL / Endpoint</Label>
                <Input
                  id="url"
                  placeholder="https://..."
                  value={credentialForm.url}
                  onChange={(e) => setCredentialForm({ ...credentialForm, url: e.target.value })}
                />
              </div>
            )}

            {/* Notes - always shown */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional information..."
                value={credentialForm.notes}
                onChange={(e) => setCredentialForm({ ...credentialForm, notes: e.target.value })}
              />
            </div>

            {/* Tags - always shown */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                placeholder="production, critical, database"
                value={credentialForm.tags}
                onChange={(e) => setCredentialForm({ ...credentialForm, tags: e.target.value })}
              />
            </div>

            {/* Visibility Control */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Label className="text-base font-semibold">Who can view this credential?</Label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setVisibilityMode('all')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${visibilityMode === 'all'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                      }`}
                  >
                    <Globe className="h-4 w-4" />
                    <span>Everyone</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibilityMode('specific')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${visibilityMode === 'specific'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                      }`}
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>Specific Users</span>
                  </button>
                </div>

                {visibilityMode === 'specific' && (
                  <div className="space-y-2 p-3 bg-muted/50 rounded-lg max-h-48 overflow-y-auto">
                    {allUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Loading users...</p>
                    ) : (
                      allUsers.map((user) => (
                        <div key={user.id} className="flex items-center gap-3 py-1">
                          <Checkbox
                            id={`user-list-${user.id}`}
                            checked={selectedUserIds.includes(user.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedUserIds([...selectedUserIds, user.id]);
                              } else {
                                setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                              }
                            }}
                          />
                          <label
                            htmlFor={`user-list-${user.id}`}
                            className="flex-1 text-sm cursor-pointer"
                          >
                            <span className="font-medium">{user.name}</span>
                            <span className="text-muted-foreground ml-2">({user.email})</span>
                          </label>
                        </div>
                      ))
                    )}
                    {visibilityMode === 'specific' && selectedUserIds.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                        {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                )}

                {visibilityMode === 'all' && (
                  <p className="text-sm text-muted-foreground">
                    All users in your organization will be able to view this credential.
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCredentialModalOpen(false)}>
              Cancel
            </Button>
            <Button className="btn-primary" onClick={handleSaveCredential}>
              {editingCredential ? 'Save Changes' : 'Add Credential'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Client Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deletingClient?.name}</strong> and all associated credentials.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteClient}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Credential Confirmation */}
      <AlertDialog open={isCredDeleteDialogOpen} onOpenChange={setIsCredDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Credential?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deletingCredential?.name}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteCredential}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default Clients;
