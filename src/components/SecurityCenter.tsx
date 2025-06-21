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
import { dataManager, type LogEntry } from '@/utils/dataManager';

interface SecurityCenterProps {
  logEntries: LogEntry[];
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

      // Get recent data from data manager
      const recentData = dataManager.getDataInTimeRange(detectionRules.timeWindowMinutes / 60);

      // Group attempts by IP and time window
      recentData.forEach(entry => {
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

    // Get recent data
    const recentData = dataManager.getDataInTimeRange(1); // Last hour

    // Analyze recent activity
    const failedAttempts = recentData.filter(entry => entry.status === 'failed').length;
    const uniqueIPs = new Set(recentData.map(entry => entry.ip)).size;
    const uniqueCountries = new Set(recentData.map(entry => entry.country).filter(Boolean)).size;

    // Generate alerts based on activity patterns
    if (failedAttempts > 20) {
      newAlerts.push({
        id: `high-failures-${Date.now()}`,
        type: 'High Failure Rate',
        severity: 'HIGH',
        description: `${failedAttempts} failed login attempts in the last hour`,
        timestamp: new Date().toISOString()
      });
    }

    if (uniqueIPs > 15) {
          newAlerts.push({
        id: `multiple-sources-${Date.now()}`,
        type: 'Multiple Attack Sources',
        severity: 'MEDIUM',
        description: `Attacks from ${uniqueIPs} different IP addresses`,
        timestamp: new Date().toISOString()
      });
    }

    if (uniqueCountries > 8) {
      newAlerts.push({
        id: `global-attack-${Date.now()}`,
        type: 'Global Attack Pattern',
        severity: 'MEDIUM',
        description: `Attacks from ${uniqueCountries} different countries`,
        timestamp: new Date().toISOString()
      });
    }

    setSecurityAlerts(newAlerts);
  };

  const addEmailSubscription = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setEmailStatus('error');
      return;
    }

    setEmailStatus('adding');
    
    try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
      const subscription: EmailSubscription = {
      email: newEmail,
        isVerified: false,
      subscriptionDate: new Date().toISOString()
    };
    
      setEmailSubscriptions(prev => [...prev, subscription]);
    setNewEmail('');
    setEmailStatus('success');
    
      // Reset status after 3 seconds
    setTimeout(() => setEmailStatus('idle'), 3000);
    } catch (error) {
      setEmailStatus('error');
    }
  };

  const removeEmailSubscription = (email: string) => {
    setEmailSubscriptions(prev => prev.filter(sub => sub.email !== email));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getThreatIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'brute force attack': return <Target className="h-4 w-4" />;
      case 'credential stuffing': return <Users className="h-4 w-4" />;
      case 'suspicious username': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  // Get data source info
  const dataSource = dataManager.getDataSource();
  const stats = dataManager.calculateStats();

  return (
    <div className="space-y-6">
      {/* Data Source Indicator */}
      {dataManager.isUploadedData() && (
        <Alert className="border-blue-500/30 bg-blue-500/10 glass-effect animate-fade-in">
          <Shield className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-300">
            <span className="font-medium">Security Analysis:</span> Analyzing {dataSource.type} data • {stats.totalAttempts.toLocaleString()} entries • {threats.length} active threats
          </AlertDescription>
        </Alert>
      )}

      {/* Security Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-effect border-slate-700 shadow-xl backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg text-white">
              <Shield className="h-5 w-5 mr-3 text-purple-400" />
              Active Threats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">{threats.length}</div>
              <div className="text-sm text-slate-300">Current Threats</div>
              <Progress 
                value={Math.min((threats.length / 10) * 100, 100)} 
                className="mt-4 h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-slate-700 shadow-xl backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg text-white">
              <Activity className="h-5 w-5 mr-3 text-blue-400" />
              Security Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">{securityAlerts.length}</div>
              <div className="text-sm text-slate-300">Recent Alerts</div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-slate-700 shadow-xl backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg text-white">
              <Mail className="h-5 w-5 mr-3 text-green-400" />
              Email Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">{emailSubscriptions.length}</div>
              <div className="text-sm text-slate-300">Active Subscriptions</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Security Content */}
      <Card className="glass-effect border-slate-700 shadow-xl backdrop-blur-xl">
        <Tabs defaultValue="threats" className="w-full">
          <div className="border-b border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
            <TabsList className="h-auto p-0 bg-transparent w-full">
              <div className="flex overflow-x-auto scrollbar-hide">
                <TabsTrigger 
                  value="threats"
                  className="flex items-center space-x-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:text-purple-400 data-[state=active]:bg-purple-500/10 rounded-none bg-transparent whitespace-nowrap text-gray-300 hover:text-white hover:bg-purple-500/5 transition-all duration-200"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>Active Threats</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="alerts"
                  className="flex items-center space-x-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:text-purple-400 data-[state=active]:bg-purple-500/10 rounded-none bg-transparent whitespace-nowrap text-gray-300 hover:text-white hover:bg-purple-500/5 transition-all duration-200"
                >
                  <Bell className="h-4 w-4" />
                  <span>Security Alerts</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="settings"
                  className="flex items-center space-x-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:text-purple-400 data-[state=active]:bg-purple-500/10 rounded-none bg-transparent whitespace-nowrap text-gray-300 hover:text-white hover:bg-purple-500/5 transition-all duration-200"
                >
                  <Settings className="h-4 w-4" />
                  <span>Detection Rules</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications"
                  className="flex items-center space-x-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:text-purple-400 data-[state=active]:bg-purple-500/10 rounded-none bg-transparent whitespace-nowrap text-gray-300 hover:text-white hover:bg-purple-500/5 transition-all duration-200"
                >
                  <Mail className="h-4 w-4" />
                  <span>Notifications</span>
                </TabsTrigger>
              </div>
            </TabsList>
          </div>

          <div className="p-3 sm:p-6">
            <TabsContent value="threats" className="mt-0 space-y-6 animate-fade-in">
              <div className="space-y-4">
                    {threats.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-white">No Active Threats</p>
                    <p className="text-slate-300">Your system is currently secure</p>
                      </div>
                    ) : (
                  threats.map((threat, index) => (
                    <div key={threat.id || index} className="flex items-start space-x-4 p-4 bg-slate-800/30 rounded-lg border border-slate-600/30 glass-effect">
                      <div className={`p-2 rounded-full flex-shrink-0 ${
                        threat.severity === 'HIGH' ? 'bg-red-500/20' : 
                        threat.severity === 'MEDIUM' ? 'bg-yellow-500/20' : 'bg-green-500/20'
                      }`}>
                                  {getThreatIcon(threat.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-white">{threat.type}</h4>
                          <Badge 
                            variant={threat.severity === 'HIGH' ? 'destructive' : 'secondary'} 
                            className="text-xs"
                          >
                                      {threat.severity}
                                    </Badge>
                                  </div>
                        <p className="text-sm text-slate-300 mb-2">{threat.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-slate-400">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {threat.ip}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(threat.timestamp).toLocaleTimeString()}
                          </span>
                                  </div>
                                </div>
                              </div>
                  ))
                )}
                      </div>
            </TabsContent>

            <TabsContent value="alerts" className="mt-0 space-y-6 animate-fade-in">
              <div className="space-y-4">
                  {securityAlerts.length === 0 ? (
                    <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-white">No Security Alerts</p>
                    <p className="text-slate-300">All systems are operating normally</p>
                    </div>
                  ) : (
                  securityAlerts.map((alert, index) => (
                    <div key={alert.id || index} className="flex items-start space-x-4 p-4 bg-slate-800/30 rounded-lg border border-slate-600/30 glass-effect">
                      <div className="p-2 bg-blue-500/20 rounded-full flex-shrink-0">
                        <Bell className="h-4 w-4 text-blue-400" />
                              </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-white">{alert.type}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {alert.severity}
                            </Badge>
                          </div>
                        <p className="text-sm text-slate-300 mb-2">{alert.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-slate-400">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                            </div>
                  ))
                )}
                            </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-0 space-y-6 animate-fade-in">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Detection Rules</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Brute Force Threshold
                      </label>
                      <Input
                        type="number"
                        value={detectionRules.bruteForceThreshold}
                        onChange={(e) => setDetectionRules(prev => ({
                          ...prev,
                          bruteForceThreshold: parseInt(e.target.value) || 5
                        }))}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                            </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Time Window (minutes)
                      </label>
                      <Input
                        type="number"
                        value={detectionRules.timeWindowMinutes}
                        onChange={(e) => setDetectionRules(prev => ({
                          ...prev,
                          timeWindowMinutes: parseInt(e.target.value) || 5
                        }))}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                            </div>
                          </div>
                </div>

                <Separator className="bg-slate-600" />

                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Suspicious Usernames</h3>
                  <div className="space-y-2">
                    {detectionRules.suspiciousUsernames.map((username, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={username}
                          onChange={(e) => {
                            const newUsernames = [...detectionRules.suspiciousUsernames];
                            newUsernames[index] = e.target.value;
                            setDetectionRules(prev => ({
                              ...prev,
                              suspiciousUsernames: newUsernames
                            }));
                          }}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newUsernames = detectionRules.suspiciousUsernames.filter((_, i) => i !== index);
                            setDetectionRules(prev => ({
                              ...prev,
                              suspiciousUsernames: newUsernames
                            }));
                          }}
                        >
                          Remove
                        </Button>
                        </div>
                      ))}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDetectionRules(prev => ({
                          ...prev,
                          suspiciousUsernames: [...prev.suspiciousUsernames, '']
                        }));
                      }}
                    >
                      Add Username
                    </Button>
                  </div>
                </div>
                    </div>
            </TabsContent>

            <TabsContent value="notifications" className="mt-0 space-y-6 animate-fade-in">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Email Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={detectionRules.emailNotifications}
                        onCheckedChange={(checked) => setDetectionRules(prev => ({
                          ...prev,
                          emailNotifications: checked
                        }))}
                      />
                      <span className="text-sm text-gray-300">Enable email notifications</span>
                    </div>

                    <div className="space-y-4">
                      <div className="flex space-x-2">
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white"
                      />
                      <Button
                        onClick={addEmailSubscription}
                        disabled={emailStatus === 'adding'}
                          className="bg-blue-600 hover:bg-blue-700"
                      >
                        {emailStatus === 'adding' ? 'Adding...' : 'Subscribe'}
                      </Button>
                    </div>
                    
                    {emailStatus === 'success' && (
                        <Alert className="border-green-500/30 bg-green-500/10">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        <AlertDescription className="text-green-300">
                          Email subscription added successfully!
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {emailStatus === 'error' && (
                        <Alert className="border-red-500/30 bg-red-500/10">
                          <AlertTriangle className="h-4 w-4 text-red-400" />
                        <AlertDescription className="text-red-300">
                            Please enter a valid email address.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                      <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-300">Current Subscriptions</h4>
                      {emailSubscriptions.length === 0 ? (
                        <p className="text-sm text-gray-400">No email subscriptions</p>
                      ) : (
                        emailSubscriptions.map((subscription, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-blue-400" />
                              <span className="text-white">{subscription.email}</span>
                              {subscription.isVerified && (
                                <Badge variant="outline" className="text-xs border-green-400 text-green-400">
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeEmailSubscription(subscription.email)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Remove
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                  </div>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
};

export default SecurityCenter;
