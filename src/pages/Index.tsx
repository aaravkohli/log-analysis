import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Activity, AlertTriangle, Users, Globe, Download, Play, Pause, Menu } from 'lucide-react';
import LogParser from '@/components/LogParser';
import ThreatDetector from '@/components/ThreatDetector';
import Dashboard from '@/components/Dashboard';
import AlertsPanel from '@/components/AlertsPanel';
import ReportsPanel from '@/components/ReportsPanel';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import { historicalDataManager } from '@/utils/historicalData';
import { geoIPManager } from '@/utils/geoip';
import { geoFencingManager } from '@/utils/geoFencing';

const Index = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [logEntries, setLogEntries] = useState([]);
  const [threats, setThreats] = useState([]);
  const [geoAlerts, setGeoAlerts] = useState([]);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    failedAttempts: 0,
    successfulLogins: 0,
    uniqueIPs: 0,
    threatsDetected: 0
  });

  // Handle CSV data updates
  const handleLogEntriesUpdate = (newEntries: any[]) => {
    setLogEntries(newEntries);
    
    // Update stats based on new entries
    const newStats = {
      totalAttempts: newEntries.length,
      failedAttempts: newEntries.filter(entry => entry.status === 'failed').length,
      successfulLogins: newEntries.filter(entry => entry.status === 'success').length,
      uniqueIPs: new Set(newEntries.map(e => e.ip)).size,
      threatsDetected: threats.length
    };
    
    setStats(newStats);
    
    // Check for geo-fencing violations
    const newGeoAlerts = newEntries
      .map(entry => geoFencingManager.checkGeoFencing(entry))
      .filter(alert => alert !== null);
    
    setGeoAlerts(newGeoAlerts);
  };

  // Simulate real-time log monitoring
  useEffect(() => {
    let interval;
    if (isMonitoring) {
      interval = setInterval(async () => {
        // Simulate new log entries
        const newEntry = await generateMockLogEntry();
        setLogEntries(prev => [...prev.slice(-99), newEntry]);
        
        // Check for geo-fencing violations
        const geoAlert = geoFencingManager.checkGeoFencing(newEntry);
        if (geoAlert) {
          setGeoAlerts(prev => [geoAlert, ...prev.slice(0, 9)]);
        }
        
        // Update stats
        setStats(prev => {
          const newStats = {
            ...prev,
            totalAttempts: prev.totalAttempts + 1,
            failedAttempts: newEntry.status === 'failed' ? prev.failedAttempts + 1 : prev.failedAttempts,
            successfulLogins: newEntry.status === 'success' ? prev.successfulLogins + 1 : prev.successfulLogins,
            uniqueIPs: new Set([...logEntries.map(e => e.ip), newEntry.ip]).size
          };
          
          // Save historical data every 10 attempts
          if (newStats.totalAttempts % 10 === 0) {
            historicalDataManager.saveDataPoint(newStats, threats);
          }
          
          return newStats;
        });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isMonitoring, logEntries, threats]);

  const generateMockLogEntry = async () => {
    const ips = ['192.168.1.100', '10.0.0.5', '203.0.113.10', '198.51.100.20', '172.16.0.50'];
    const users = ['admin', 'root', 'user', 'test', 'guest'];
    const statuses = ['failed', 'failed', 'failed', 'success']; // More failures to simulate attacks
    
    // Select IP with a more deterministic approach based on time
    const ipIndex = Math.floor(Date.now() / 1000) % ips.length;
    const ip = ips[ipIndex];
    const geoLocation = await geoIPManager.getLocation(ip);
    
    // Select user based on IP to create more realistic patterns
    // Each IP tends to be associated with specific users
    const userIndex = (ipIndex + Math.floor(Date.now() / 10000)) % users.length;
    const user = users[userIndex];
    
    // Generate a more reliable ID
    const id = `${Date.now()}-${Math.floor(1000000 + Math.random() * 9000000)}`;
    
    // Status has higher chance of success for internal IPs
    const isInternalIP = ip.startsWith('192.168.') || ip.startsWith('10.');
    const statusIndex = isInternalIP 
      ? Math.floor(Math.random() * 4) % 2 === 0 ? 3 : Math.floor(Math.random() * 3) // Higher success chance for internal IPs
      : Math.floor(Math.random() * statuses.length); // Regular distribution for external IPs
    
    return {
      id,
      timestamp: new Date().toISOString(),
      ip,
      user,
      status: statuses[statusIndex],
      port: 22,
      country: geoLocation.country,
      countryCode: geoLocation.countryCode,
      city: geoLocation.city,
      flag: geoLocation.flag
    };
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Header - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">SSH Security Monitor</h1>
              <p className="text-sm sm:text-base text-gray-300 hidden sm:block">Real-time SSH authentication monitoring with geo-fencing</p>
              <p className="text-xs text-gray-300 sm:hidden">Real-time SSH monitoring with geo-fencing</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
            <Button
              onClick={toggleMonitoring}
              variant={isMonitoring ? "destructive" : "default"}
              className="flex items-center space-x-2 flex-1 sm:flex-initial text-sm"
              size="sm"
            >
              {isMonitoring ? <Pause className="h-3 w-3 sm:h-4 sm:w-4" /> : <Play className="h-3 w-3 sm:h-4 sm:w-4" />}
              <span className="hidden xs:inline">{isMonitoring ? 'Stop' : 'Start'}</span>
              <span className="xs:hidden">{isMonitoring ? 'Stop' : 'Start'}</span>
            </Button>
            <Badge variant={isMonitoring ? "default" : "secondary"} className="px-2 py-1 text-xs whitespace-nowrap">
              <Activity className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
              {isMonitoring ? 'ACTIVE' : 'STOPPED'}
            </Badge>
          </div>
        </div>

        {/* Status Alert - Mobile Optimized */}
        {isMonitoring && (
          <Alert className="border-green-500 bg-green-500/10">
            <Activity className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-300 text-sm">
              <span className="hidden sm:inline">Real-time monitoring is active. Analyzing SSH authentication logs with geo-fencing...</span>
              <span className="sm:hidden">Monitoring active. Analyzing SSH logs with geo-fencing...</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Geo-fencing Alert */}
        {geoAlerts.length > 0 && (
          <Alert className="border-red-500 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-300 text-sm">
              <strong>Geo-fencing Alert!</strong> {geoAlerts.length} recent login attempts from restricted locations detected.
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Stats - Mobile Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-400 text-xs sm:text-sm truncate">Total</p>
                  <p className="text-lg sm:text-2xl font-bold text-white">{stats.totalAttempts}</p>
                </div>
                <Activity className="h-5 w-5 sm:h-8 sm:w-8 text-blue-400 mt-1 sm:mt-0 self-end sm:self-auto" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-400 text-xs sm:text-sm truncate">Failed</p>
                  <p className="text-lg sm:text-2xl font-bold text-red-400">{stats.failedAttempts}</p>
                </div>
                <AlertTriangle className="h-5 w-5 sm:h-8 sm:w-8 text-red-400 mt-1 sm:mt-0 self-end sm:self-auto" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-400 text-xs sm:text-sm truncate">Success</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-400">{stats.successfulLogins}</p>
                </div>
                <Shield className="h-5 w-5 sm:h-8 sm:w-8 text-green-400 mt-1 sm:mt-0 self-end sm:self-auto" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-400 text-xs sm:text-sm truncate">Unique IPs</p>
                  <p className="text-lg sm:text-2xl font-bold text-purple-400">{stats.uniqueIPs}</p>
                </div>
                <Globe className="h-5 w-5 sm:h-8 sm:w-8 text-purple-400 mt-1 sm:mt-0 self-end sm:self-auto" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-400 text-xs sm:text-sm truncate">Threats</p>
                  <p className="text-lg sm:text-2xl font-bold text-yellow-400">{stats.threatsDetected}</p>
                </div>
                <AlertTriangle className="h-5 w-5 sm:h-8 sm:w-8 text-yellow-400 mt-1 sm:mt-0 self-end sm:self-auto" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard 
              logEntries={logEntries} 
              stats={stats} 
              threats={threats}
              onLogEntriesUpdate={handleLogEntriesUpdate}
            />
          </TabsContent>

          <TabsContent value="logs">
            <LogParser logEntries={logEntries} isMonitoring={isMonitoring} />
          </TabsContent>

          <TabsContent value="alerts">
            <AlertsPanel threats={threats} geoAlerts={geoAlerts} />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsPanel logEntries={logEntries} stats={stats} threats={threats} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsPanel logEntries={logEntries} threats={threats} stats={stats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
