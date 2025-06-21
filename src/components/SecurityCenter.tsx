import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Shield, 
  Zap, 
  Target, 
  Settings, 
  Bell, 
  Mail, 
  CheckCircle, 
  Users, 
  Activity,
  Clock,
  MapPin
} from 'lucide-react';

interface SecurityCenterProps {
  logEntries: any[];
  threats: any[];
  setThreats: (threats: any[]) => void;
}

interface AttemptData {
  failed: number;
  total: number;
  users: Set<string>;
}

interface UserAttemptData {
  failed: number;
  total: number;
  ips: Set<string>;
}

interface IpAttemptData {
  failed: number;
  total: number;
  users: Set<string>;
  countries: Set<string>;
  lastAttempt: string;
}

interface AlertSettings {
  bruteForceThreshold: number;
  suspiciousUsernames: string[];
  timeWindowMinutes: number;
  emailNotifications: boolean;
  suspiciousUserThreshold: number;
  multiCountryThreshold: number;
}

interface EmailSubscription {
  email: string;
  isVerified: boolean;
  subscriptionDate: string;
}

const SecurityCenter = ({ logEntries, threats, setThreats }: SecurityCenterProps) => {
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [emailSubscriptions, setEmailSubscriptions] = useState<EmailSubscription[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'adding' | 'success' | 'error'>('idle');
  const [detectionRules, setDetectionRules] = useState<AlertSettings>({
    bruteForceThreshold: 5,
    timeWindowMinutes: 5,
    suspiciousUsernames: ['admin', 'root', 'test'],
    emailNotifications: true,
    suspiciousUserThreshold: 3,
    multiCountryThreshold: 2
  });

  // Threat detection logic
  useEffect(() => {
    const detectThreats = () => {
      const newThreats = [];
      const ipAttempts: Record<string, AttemptData> = {};
      const userAttempts: Record<string, UserAttemptData> = {};
      const currentTime = new Date();

      // Group attempts by IP and time window
      logEntries.forEach(entry => {
        const entryTime = new Date(entry.timestamp);
        const timeDiff = (currentTime.getTime() - entryTime.getTime()) / (1000 * 60); // minutes

        if (timeDiff <= detectionRules.timeWindowMinutes) {
          // Track IP attempts
          if (!ipAttempts[entry.ip]) {
            ipAttempts[entry.ip] = { failed: 0, total: 0, users: new Set() };
          }
          ipAttempts[entry.ip].total++;
          ipAttempts[entry.ip].users.add(entry.user);
          if (entry.status === 'failed') {
            ipAttempts[entry.ip].failed++;
          }

          // Track user attempts
          if (!userAttempts[entry.user]) {
            userAttempts[entry.user] = { failed: 0, total: 0, ips: new Set() };
          }
          userAttempts[entry.user].total++;
          userAttempts[entry.user].ips.add(entry.ip);
          if (entry.status === 'failed') {
            userAttempts[entry.user].failed++;
          }
        }
      });

      // Detect brute force attacks
      Object.entries(ipAttempts).forEach(([ip, data]) => {
        if (data.failed >= detectionRules.bruteForceThreshold) {
          newThreats.push({
            id: `brute-${ip}-${Date.now()}`,
            type: 'Brute Force Attack',
            ip,
            severity: data.failed > 10 ? 'HIGH' : 'MEDIUM',
            description: `${data.failed} failed login attempts in ${detectionRules.timeWindowMinutes} minutes`,
            timestamp: new Date().toISOString(),
            details: {
              failedAttempts: data.failed,
              totalAttempts: data.total,
              uniqueUsers: data.users.size
            }
          });
        }
      });

      // Detect credential stuffing
      Object.entries(ipAttempts).forEach(([ip, data]) => {
        if (data.users.size >= 3 && data.failed > 0) {
          newThreats.push({
            id: `cred-${ip}-${Date.now()}`,
            type: 'Credential Stuffing',
            ip,
            severity: 'MEDIUM',
            description: `Multiple username attempts (${data.users.size} users) from single IP`,
            timestamp: new Date().toISOString(),
            details: {
              usernames: Array.from(data.users),
              attempts: data.total
            }
          });
        }
      });

      // Detect suspicious usernames
      detectionRules.suspiciousUsernames.forEach(suspiciousUser => {
        if (userAttempts[suspiciousUser] && userAttempts[suspiciousUser].failed > 0) {
          newThreats.push({
            id: `suspicious-${suspiciousUser}-${Date.now()}`,
            type: 'Suspicious Username',
            ip: Array.from(userAttempts[suspiciousUser].ips)[0],
            severity: 'LOW',
            description: `Login attempts with privileged username: ${suspiciousUser}`,
            timestamp: new Date().toISOString(),
            details: {
              username: suspiciousUser,
              attempts: userAttempts[suspiciousUser].total,
              uniqueIPs: userAttempts[suspiciousUser].ips.size
            }
          });
        }
      });

      // Update threats (keep only recent ones)
      const recentThreats = [...threats, ...newThreats].filter(threat => {
        const threatTime = new Date(threat.timestamp);
        const timeDiff = (currentTime.getTime() - threatTime.getTime()) / (1000 * 60);
        return timeDiff <= 60; // Keep threats from last hour
      });

      if (newThreats.length > 0) {
        setThreats(recentThreats);
      }
    };

    const interval = setInterval(detectThreats, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [logEntries, detectionRules, threats, setThreats]);

  // Generate security alerts
  useEffect(() => {
    generateSecurityAlerts();
  }, [logEntries, detectionRules]);

  const generateSecurityAlerts = () => {
    if (logEntries.length === 0) return;

    const newAlerts: any[] = [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Analyze recent log entries
    const recentEntries = logEntries.filter(entry => new Date(entry.timestamp) > oneHourAgo);
    
    // Group by IP for analysis
    const ipAttempts = recentEntries.reduce((acc, entry) => {
      if (!acc[entry.ip]) {
        acc[entry.ip] = {
          failed: 0,
          total: 0,
          users: new Set(),
          countries: new Set(),
          lastAttempt: entry.timestamp
        };
      }
      
      const data = acc[entry.ip];
      data.total++;
      if (entry.status === 'failed') data.failed++;
      data.users.add(entry.user);
      data.countries.add(entry.country);
      if (new Date(entry.timestamp) > new Date(data.lastAttempt)) {
        data.lastAttempt = entry.timestamp;
      }
      
      return acc;
    }, {} as Record<string, IpAttemptData>);

    // Detect various threats
    Object.entries(ipAttempts).forEach(([ip, data]: [string, IpAttemptData]) => {
      if (data.failed >= detectionRules.bruteForceThreshold) {
        const alertExists = securityAlerts.some(alert => 
          alert.source === ip && alert.title.includes('Brute Force') && 
          new Date(alert.timestamp) > oneHourAgo
        );
        
        if (!alertExists) {
          newAlerts.push({
            id: `brute-${ip}-${Date.now()}`,
            title: 'Brute Force Attack Detected',
            description: `${data.failed} failed login attempts from ${ip} in the last hour`,
            severity: 'critical',
            source: ip,
            timestamp: new Date().toISOString(),
            type: 'brute_force',
            details: {
              failedAttempts: data.failed,
              totalAttempts: data.total,
              uniqueUsers: data.users.size,
              countries: Array.from(data.countries)
            }
          });
        }
      }
    });

    if (newAlerts.length > 0) {
      setSecurityAlerts(prev => [...newAlerts, ...prev].slice(0, 50));
      
      // Simulate email notifications if enabled
      if (detectionRules.emailNotifications && emailSubscriptions.length > 0) {
        console.log(`Would send ${newAlerts.length} alerts to ${emailSubscriptions.length} subscribers`);
      }
    }
  };

  const addEmailSubscription = async () => {
    if (!newEmail || !/\S+@\S+\.\S+/.test(newEmail)) {
      setEmailStatus('error');
      return;
    }

    if (emailSubscriptions.some(sub => sub.email === newEmail)) {
      setEmailStatus('error');
      return;
    }

    setEmailStatus('adding');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newSubscription: EmailSubscription = {
      email: newEmail,
      isVerified: true,
      subscriptionDate: new Date().toISOString()
    };
    
    setEmailSubscriptions(prev => [...prev, newSubscription]);
    setNewEmail('');
    setEmailStatus('success');
    
    setTimeout(() => setEmailStatus('idle'), 3000);
  };

  const removeEmailSubscription = (email: string) => {
    setEmailSubscriptions(prev => prev.filter(sub => sub.email !== email));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': case 'critical': return 'text-red-400 bg-red-900/20';
      case 'MEDIUM': case 'high': return 'text-yellow-400 bg-yellow-900/20';
      case 'LOW': case 'medium': return 'text-blue-400 bg-blue-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getThreatIcon = (type: string) => {
    switch (type) {
      case 'Brute Force Attack': return <Zap className="h-4 w-4" />;
      case 'Credential Stuffing': return <Target className="h-4 w-4" />;
      case 'Suspicious Username': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Center Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Security Center</h2>
        <p className="text-gray-300 text-sm sm:text-base">Real-time threat detection and security alert management</p>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-effect border-slate-700 hover:border-red-500/50 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Threats</p>
                <p className="text-2xl font-bold text-red-400">{threats.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-slate-700 hover:border-yellow-500/50 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Security Alerts</p>
                <p className="text-2xl font-bold text-yellow-400">{securityAlerts.length}</p>
              </div>
              <Bell className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-slate-700 hover:border-blue-500/50 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Email Subscribers</p>
                <p className="text-2xl font-bold text-blue-400">{emailSubscriptions.length}</p>
              </div>
              <Mail className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-slate-700 hover:border-green-500/50 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Detection Rules</p>
                <p className="text-2xl font-bold text-green-400">{Object.keys(detectionRules).length}</p>
              </div>
              <Settings className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Security Tabs */}
      <Card className="glass-effect border-slate-700">
        <Tabs defaultValue="threats" className="w-full">
          <div className="border-b border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
            <TabsList className="h-auto p-0 bg-transparent w-full">
              <div className="flex overflow-x-auto scrollbar-hide">
                <TabsTrigger 
                  value="threats"
                  className="flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:text-purple-400 data-[state=active]:bg-purple-500/10 rounded-none bg-transparent whitespace-nowrap text-gray-300 hover:text-white hover:bg-purple-500/5 transition-all duration-200"
                >
                  <Shield className="h-4 w-4" />
                  <span>Threat Detection</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="alerts"
                  className="flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:text-purple-400 data-[state=active]:bg-purple-500/10 rounded-none bg-transparent whitespace-nowrap text-gray-300 hover:text-white hover:bg-purple-500/5 transition-all duration-200"
                >
                  <Bell className="h-4 w-4" />
                  <span>Security Alerts</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications"
                  className="flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:text-purple-400 data-[state=active]:bg-purple-500/10 rounded-none bg-transparent whitespace-nowrap text-gray-300 hover:text-white hover:bg-purple-500/5 transition-all duration-200"
                >
                  <Mail className="h-4 w-4" />
                  <span>Email Alerts</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="settings"
                  className="flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:text-purple-400 data-[state=active]:bg-purple-500/10 rounded-none bg-transparent whitespace-nowrap text-gray-300 hover:text-white hover:bg-purple-500/5 transition-all duration-200"
                >
                  <Settings className="h-4 w-4" />
                  <span>Detection Settings</span>
                </TabsTrigger>
              </div>
            </TabsList>
          </div>

          <div className="p-4 sm:p-6">
            <TabsContent value="threats" className="mt-0 space-y-6 animate-fade-in">
              {/* Active Threats */}
              <Card className="glass-effect border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
                    Detected Threats ({threats.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] sm:h-[500px]">
                    {threats.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Shield className="h-12 w-12 mx-auto mb-4 text-green-400" />
                        <p>No threats detected</p>
                        <p className="text-sm">Your system appears to be secure</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {threats.map((threat) => (
                          <div
                            key={threat.id}
                            className="p-4 bg-slate-700/30 rounded-lg border-l-4 border-red-500"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-2 sm:space-y-0">
                              <div className="flex items-start space-x-3">
                                <div className="mt-1">
                                  {getThreatIcon(threat.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center space-x-2 mb-2">
                                    <h3 className="text-white font-medium">{threat.type}</h3>
                                    <Badge className={getSeverityColor(threat.severity)}>
                                      {threat.severity}
                                    </Badge>
                                  </div>
                                  <p className="text-gray-300 text-sm mb-2">{threat.description}</p>
                                  <div className="text-xs text-gray-400 space-y-1">
                                    <p>IP: <span className="text-blue-400">{threat.ip}</span></p>
                                    <p>Time: {new Date(threat.timestamp).toLocaleString()}</p>
                                    {threat.details && (
                                      <div className="mt-2 p-2 bg-slate-800 rounded">
                                        <pre className="text-xs text-gray-300">
                                          {JSON.stringify(threat.details, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="mt-0 space-y-6 animate-fade-in">
              {/* Security Alerts */}
              <Card className="glass-effect border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Bell className="h-5 w-5 mr-2 text-yellow-400" />
                    Active Security Alerts
                    {securityAlerts.length > 0 && (
                      <Badge variant="destructive" className="ml-3">
                        {securityAlerts.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {securityAlerts.length === 0 ? (
                    <div className="text-center py-12">
                      <Shield className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <p className="text-lg font-medium text-white">All Clear</p>
                      <p className="text-slate-400">No active security alerts detected</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {securityAlerts.slice(0, 10).map((alert) => (
                        <div key={alert.id} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)} transition-all duration-200`}>
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 space-y-2 sm:space-y-0">
                            <div className="flex items-center space-x-3">
                              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <h4 className="font-medium text-white">{alert.title}</h4>
                                <p className="text-slate-300 text-sm">{alert.description}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className={`${getSeverityColor(alert.severity)} border-current whitespace-nowrap`}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-600">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                              <span className="text-slate-300 text-sm truncate">{alert.source}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
                              <span className="text-slate-300 text-sm">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Activity className="h-4 w-4 text-slate-400 flex-shrink-0" />
                              <span className="text-slate-300 text-sm">{alert.details?.totalAttempts || 0} attempts</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Bell className="h-4 w-4 text-slate-400 flex-shrink-0" />
                              <span className="text-slate-300 text-sm">{alert.type}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-0 space-y-6 animate-fade-in">
              {/* Email Notifications */}
              <Card className="glass-effect border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-xl">
                    <Mail className="h-6 w-6 mr-3 text-purple-400" />
                    Email Alert Notifications
                  </CardTitle>
                  <p className="text-slate-300 text-sm">Subscribe to receive real-time security alerts via email</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add New Email */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="bg-slate-800/50 border-slate-600 text-white placeholder-slate-400 flex-1"
                      />
                      <Button
                        onClick={addEmailSubscription}
                        disabled={emailStatus === 'adding'}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 whitespace-nowrap"
                      >
                        {emailStatus === 'adding' ? 'Adding...' : 'Subscribe'}
                      </Button>
                    </div>
                    
                    {emailStatus === 'success' && (
                      <Alert className="border-green-500 bg-green-500/10">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <AlertDescription className="text-green-300">
                          Email subscription added successfully!
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {emailStatus === 'error' && (
                      <Alert className="border-red-500 bg-red-500/10">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <AlertDescription className="text-red-300">
                          Please enter a valid email address that hasn't been subscribed yet.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Current Subscriptions */}
                  {emailSubscriptions.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-white font-medium flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Current Subscribers ({emailSubscriptions.length})
                      </h4>
                      <div className="space-y-2">
                        {emailSubscriptions.map((subscription, index) => (
                          <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-600 space-y-2 sm:space-y-0">
                            <div className="flex items-center space-x-3">
                              <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                              <span className="text-white min-w-0 truncate">{subscription.email}</span>
                              {subscription.isVerified && (
                                <Badge variant="outline" className="border-green-500 text-green-400 text-xs whitespace-nowrap">
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <Button
                              onClick={() => removeEmailSubscription(subscription.email)}
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 whitespace-nowrap"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-0 space-y-6 animate-fade-in">
              {/* Detection Settings */}
              <Card className="glass-effect border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Detection Rules Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Brute Force Threshold (failed attempts)
                      </label>
                      <input
                        type="number"
                        value={detectionRules.bruteForceThreshold}
                        onChange={(e) => setDetectionRules({
                          ...detectionRules,
                          bruteForceThreshold: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Time Window (minutes)
                      </label>
                      <input
                        type="number"
                        value={detectionRules.timeWindowMinutes}
                        onChange={(e) => setDetectionRules({
                          ...detectionRules,
                          timeWindowMinutes: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                      />
                    </div>
                  </div>

                  <Separator className="bg-slate-600" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                    <span className="text-slate-300 text-sm">Email Notifications</span>
                    <Switch
                      checked={detectionRules.emailNotifications}
                      onCheckedChange={(checked) => 
                        setDetectionRules(prev => ({ ...prev, emailNotifications: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
};

export default SecurityCenter;
