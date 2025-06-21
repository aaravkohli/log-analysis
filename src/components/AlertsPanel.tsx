import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Shield, Clock, MapPin, Bell, Mail, Settings, CheckCircle, Users, Activity } from 'lucide-react';
import { errorHandler } from '@/utils/errorHandler';

interface AlertsPanelProps {
  threats: any[];
  logEntries: any[];
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
  suspiciousUserThreshold: number;
  multiCountryThreshold: number;
  emailNotifications: boolean;
}

interface EmailSubscription {
  email: string;
  isVerified: boolean;
  subscriptionDate: string;
}

const AlertsPanel = ({ threats, logEntries }: AlertsPanelProps) => {
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [emailSubscriptions, setEmailSubscriptions] = useState<EmailSubscription[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'adding' | 'success' | 'error'>('idle');
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    bruteForceThreshold: 5,
    suspiciousUserThreshold: 3,
    multiCountryThreshold: 2,
    emailNotifications: true
  });

  useEffect(() => {
    generateSecurityAlerts();
  }, [logEntries, alertSettings]);

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

    // Detect brute force attacks
    Object.entries(ipAttempts).forEach(([ip, data]: [string, IpAttemptData]) => {
      if (data.failed >= alertSettings.bruteForceThreshold) {
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

      // Detect suspicious user enumeration
      if (data.users.size >= alertSettings.suspiciousUserThreshold && data.failed > data.total * 0.7) {
        const alertExists = securityAlerts.some(alert => 
          alert.source === ip && alert.title.includes('User Enumeration')
        );
        
        if (!alertExists) {
          newAlerts.push({
            id: `enum-${ip}-${Date.now()}`,
            title: 'Suspicious User Enumeration',
            description: `Multiple user accounts targeted from ${ip}`,
            severity: 'high',
            source: ip,
            timestamp: new Date().toISOString(),
            type: 'user_enumeration',
            details: {
              uniqueUsers: data.users.size,
              totalAttempts: data.total,
              countries: Array.from(data.countries)
            }
          });
        }
      }

      // Detect multi-country access attempts
      if (data.countries.size >= alertSettings.multiCountryThreshold) {
        const alertExists = securityAlerts.some(alert => 
          alert.source === ip && alert.title.includes('Multi-Country')
        );
        
        if (!alertExists) {
          newAlerts.push({
            id: `multi-${ip}-${Date.now()}`,
            title: 'Multi-Country Access Pattern',
            description: `Access attempts from ${ip} across ${data.countries.size} countries`,
            severity: 'medium',
            source: ip,
            timestamp: new Date().toISOString(),
            type: 'geo_anomaly',
            details: {
              countries: Array.from(data.countries),
              totalAttempts: data.total
            }
          });
        }
      }
    });

    if (newAlerts.length > 0) {
      setSecurityAlerts(prev => [...newAlerts, ...prev].slice(0, 50));
      
      // Send email notifications if enabled
      if (alertSettings.emailNotifications && emailSubscriptions.length > 0) {
        sendEmailNotifications(newAlerts);
      }
    }
  };

  const sendEmailNotifications = async (alerts: any[]) => {
    try {
      // In a real implementation, this would call an email service API
      // For now, we'll simulate the email sending process
      const emailData = {
        recipients: emailSubscriptions.map(sub => sub.email),
        alerts: alerts.map(alert => ({
          type: alert.type,
          severity: alert.severity,
          description: alert.description,
          ip: alert.source,
          timestamp: alert.timestamp
        })),
        summary: {
          totalAlerts: alerts.length,
          criticalCount: alerts.filter(a => a.severity === 'critical').length,
          highCount: alerts.filter(a => a.severity === 'high').length,
          mediumCount: alerts.filter(a => a.severity === 'medium').length
        }
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In production, this would be:
      // await emailService.sendSecurityAlerts(emailData);
      
      // For demo purposes, we'll just show a success message
      setEmailStatus('success');
      setTimeout(() => setEmailStatus('idle'), 3000);
    } catch (error) {
      errorHandler.logError('Failed to send email notifications', 'AlertsPanel', 'medium', 'EMAIL_ERROR', 'Check email configuration');
      setEmailStatus('error');
      setTimeout(() => setEmailStatus('idle'), 3000);
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
      isVerified: true, // In real app, this would be false until verified
      subscriptionDate: new Date().toISOString()
    };
    
    setEmailSubscriptions(prev => [...prev, newSubscription]);
    setNewEmail('');
    setEmailStatus('success');
    
    // Reset status after 3 seconds
    setTimeout(() => setEmailStatus('idle'), 3000);
  };

  const removeEmailSubscription = (email: string) => {
    setEmailSubscriptions(prev => prev.filter(sub => sub.email !== email));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Subscription Section */}
      <Card className="glass-effect border-slate-700 hover:border-purple-500/50 transition-all duration-300">
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
            <div className="flex space-x-3">
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
                className="bg-purple-600 hover:bg-purple-700 text-white px-6"
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
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-600">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="text-white">{subscription.email}</span>
                      {subscription.isVerified && (
                        <Badge variant="outline" className="border-green-500 text-green-400 text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <Button
                      onClick={() => removeEmailSubscription(subscription.email)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notification Settings */}
          <Separator className="bg-slate-600" />
          <div className="space-y-4">
            <h4 className="text-white font-medium flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Alert Settings
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">Email Notifications</span>
                <Switch
                  checked={alertSettings.emailNotifications}
                  onCheckedChange={(checked) => 
                    setAlertSettings(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">Brute Force Threshold</span>
                <Input
                  type="number"
                  min="3"
                  max="20"
                  value={alertSettings.bruteForceThreshold}
                  onChange={(e) => 
                    setAlertSettings(prev => ({ ...prev, bruteForceThreshold: parseInt(e.target.value) }))
                  }
                  className="w-20 bg-slate-800/50 border-slate-600 text-white text-center"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Security Alerts */}
      <Card className="glass-effect border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center text-xl">
            <AlertTriangle className="h-6 w-6 mr-3 text-red-400" />
            Active Security Alerts
            {securityAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-3">
                {securityAlerts.length}
              </Badge>
            )}
          </CardTitle>
          <p className="text-slate-300 text-sm">Real-time security threats and suspicious activities</p>
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
                <div key={alert.id} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)} transition-all duration-200 hover:scale-[1.02]`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-white">{alert.title}</h4>
                        <p className="text-slate-300 text-sm">{alert.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`${getSeverityColor(alert.severity)} border-current`}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-600">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-300 text-sm">{alert.source}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-300 text-sm">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-300 text-sm">{alert.details?.totalAttempts || 0} attempts</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-300 text-sm">{alert.type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertsPanel;
