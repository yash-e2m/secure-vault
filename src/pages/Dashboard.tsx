import { motion } from 'framer-motion';
import {
  Users,
  Key,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const { clients, credentials, updateLastAccessed } = useData();
  const navigate = useNavigate();

  // Calculate stats
  const totalClients = clients.length;
  const totalCredentials = credentials.length;
  const recentlyAdded = credentials.filter(
    (c) => Date.now() - c.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000
  ).length;

  // Get recently accessed clients
  const recentClients = [...clients]
    .sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime())
    .slice(0, 6);

  const stats = [
    {
      label: 'Total Clients',
      value: totalClients,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Credentials Stored',
      value: totalCredentials,
      icon: Key,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Added This Week',
      value: recentlyAdded,
      icon: TrendingUp,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Expiring Soon',
      value: 0,
      icon: AlertCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  const handleViewClient = (clientId: string) => {
    updateLastAccessed(clientId);
    navigate(`/clients/${clientId}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's an overview of your credentials.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="stat-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="flex gap-4 flex-wrap">
        <Button
          className="btn-primary"
          onClick={() => navigate('/clients?action=add')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Client
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/clients?action=add-credential')}
        >
          <Key className="h-4 w-4 mr-2" />
          Add New Credential
        </Button>
      </motion.div>

      {/* Recently Accessed Clients */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recently Accessed</h2>
          <Button variant="ghost" onClick={() => navigate('/clients')}>
            View All
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentClients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="glass-card p-5 cursor-pointer glow-border group"
              onClick={() => handleViewClient(client.id)}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold flex-shrink-0"
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
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
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
        </div>

        {recentClients.length === 0 && (
          <div className="glass-card p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mx-auto mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">No clients yet</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Get started by adding your first client
            </p>
            <Button className="btn-primary" onClick={() => navigate('/clients?action=add')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
