import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Mail, MessageSquare, Settings, AlertTriangle, Check, Globe, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AlertsPanelProps {
  threats: any[];
  geoAlerts: any[];
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ threats, geoAlerts }) => {
  const [alertSettings, setAlertSettings] = useState({
    emailAlerts: true,
    pushNotifications: false,
    slackIntegration: false,
    alertThreshold: 'MEDIUM',
    emailAddress: 'admin@example.com'
  });

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'email',
      title: 'Brute Force Attack Detected',
      message: 'High severity threat detected from IP 192.168.1.100',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      status: 'sent'
    },
    {
      id: 2,
      type: 'system',
      title: 'System Alert Configured',
      message: 'Email notifications enabled for MEDIUM+ threats',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      status: 'delivered'
    }
  ]);

  const [successRate, setSuccessRate] = useState(0);
  const [responseTime, setResponseTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Calculate success rate based on notification statuses
    const sentNotifications = notifications.filter(n => n.status === 'sent' || n.status === 'delivered').length;
    const totalNotifications = notifications.length || 1; // Avoid division by zero
    const calculatedRate = (sentNotifications / totalNotifications) * 100;
    setSuccessRate(calculatedRate);

    // Calculate average response time (simulated)
    // In a real app, this would be based on actual alert delivery metrics
    const avgResponseTime = Math.random() * 1.5 + 0.5; // Random between 0.5 and 2 seconds
    setResponseTime(avgResponseTime);
  }, [notifications]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      case 'slack': return <MessageSquare className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-400';
      case 'delivered': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const sendTestAlert = () => {
    // Simulate sending an alert with a random status
    const statuses = ['sent', 'pending', 'failed'];
    const randomStatus = Math.random() > 0.8 ? statuses[2] : Math.random() > 0.3 ? statuses[0] : statuses[1];
    
    const newAlert = {
      id: Date.now(),
      type: alertSettings.emailAlerts ? 'email' : alertSettings.pushNotifications ? 'push' : 'slack',
      title: 'Test Alert',
      message: `This is a test notification to verify your ${alertSettings.emailAlerts ? 'email' : alertSettings.pushNotifications ? 'push' : 'slack'} alert configuration`,
      timestamp: new Date().toISOString(),
      status: randomStatus
    };

    // Add the new notification
    setNotifications([newAlert, ...notifications]);
    
    // Show a toast notification
    toast({
      title: "Test Alert Sent",
      description: `Alert has been ${randomStatus}`,
      variant: randomStatus === 'failed' ? "destructive" : "default",
    });
  };

  const saveConfiguration = () => {
    // Validate email if email alerts are enabled
    if (alertSettings.emailAlerts) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(alertSettings.emailAddress)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSaving(true);

    // Simulate saving configuration to server
    setTimeout(() => {
      // Add a system notification about the configuration change
      const newNotification = {
        id: Date.now(),
        type: 'system',
        title: 'Alert Configuration Updated',
        message: `Alert settings updated with threshold: ${alertSettings.alertThreshold}`,
        timestamp: new Date().toISOString(),
        status: 'delivered'
      };
      
      setNotifications([newNotification, ...notifications]);
      setIsSaving(false);
      
      toast({
        title: "Configuration Saved",
        description: "Your alert settings have been updated",
        variant: "default",
      });
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Geo-fencing Alerts */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Globe className="h-5 w-5 mr-2 text-yellow-400" />
            Geo-fencing Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {geoAlerts.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No geo-fencing alerts detected</p>
          ) : (
            <div className="space-y-3">
              {geoAlerts.map((alert, index) => (
                <Alert key={index} className="border-yellow-500 bg-yellow-500/10">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-300">
                    <strong>Geo-fencing Alert:</strong> {alert.description}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Threats */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Shield className="h-5 w-5 mr-2 text-red-400" />
            Security Threats
          </CardTitle>
        </CardHeader>
        <CardContent>
          {threats.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No security threats detected</p>
          ) : (
            <div className="space-y-3">
              {threats.map((threat, index) => (
                <Alert key={index} className="border-red-500 bg-red-500/10">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-300">
                    <strong>{threat.type}:</strong> {threat.description}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Configuration */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Alert Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Methods */}
          <div>
            <h3 className="text-white font-medium mb-4">Notification Methods</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <span className="text-gray-300">Email Notifications</span>
                </div>
                <Switch
                  checked={alertSettings.emailAlerts}
                  onCheckedChange={(checked) => 
                    setAlertSettings({...alertSettings, emailAlerts: checked})
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="h-4 w-4 text-green-400" />
                  <span className="text-gray-300">Push Notifications</span>
                </div>
                <Switch
                  checked={alertSettings.pushNotifications}
                  onCheckedChange={(checked) => 
                    setAlertSettings({...alertSettings, pushNotifications: checked})
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-4 w-4 text-purple-400" />
                  <span className="text-gray-300">Slack Integration</span>
                </div>
                <Switch
                  checked={alertSettings.slackIntegration}
                  onCheckedChange={(checked) => 
                    setAlertSettings({...alertSettings, slackIntegration: checked})
                  }
                />
              </div>
            </div>
          </div>

          {/* Alert Threshold */}
          <div>
            <h3 className="text-white font-medium mb-4">Alert Threshold</h3>
            <select
              value={alertSettings.alertThreshold}
              onChange={(e) => setAlertSettings({...alertSettings, alertThreshold: e.target.value})}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
            >
              <option value="LOW">Low and above</option>
              <option value="MEDIUM">Medium and above</option>
              <option value="HIGH">High only</option>
            </select>
          </div>

          {/* Email Configuration */}
          {alertSettings.emailAlerts && (
            <div>
              <h3 className="text-white font-medium mb-4">Email Configuration</h3>
              <Input
                placeholder="Email address"
                value={alertSettings.emailAddress}
                onChange={(e) => setAlertSettings({...alertSettings, emailAddress: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          )}

          <div className="flex space-x-3">
            <Button onClick={sendTestAlert} className="bg-blue-600 hover:bg-blue-700">
              Send Test Alert
            </Button>
            <Button 
              onClick={saveConfiguration} 
              variant="outline" 
              className="border-slate-600 text-white hover:bg-slate-700 text-black"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2 " />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Alerts Sent</p>
                <p className="text-2xl font-bold text-white">{notifications.length}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
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

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Success Rate</p>
                <p className="text-2xl font-bold text-green-400">{successRate.toFixed(0)}%</p>
              </div>
              <Mail className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Response Time</p>
                <p className="text-2xl font-bold text-blue-400">{responseTime.toFixed(1)}s</p>
              </div>
              <Settings className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Notifications */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No notifications sent yet
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg"
                  >
                    <div className="mt-1">
                      {getAlertIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-medium">{notification.title}</h3>
                        <span className={`text-xs ${getStatusColor(notification.status)}`}>
                          {notification.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mt-1">{notification.message}</p>
                      <p className="text-gray-500 text-xs mt-2">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertsPanel;
