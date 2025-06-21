import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Shield, Activity, AlertTriangle, Users, Download, Play, Pause, Menu, Server, Lock, X, TrendingUp, Upload } from 'lucide-react';
import LogParser from '@/components/LogParser';
import Dashboard from '@/components/Dashboard';
import AlertsPanel from '@/components/AlertsPanel';
import ReportsPanel from '@/components/ReportsPanel';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import CSVUploader from '@/components/CSVUploader';
import SecurityCenter from '@/components/SecurityCenter';
import { historicalDataManager } from '@/utils/historicalData';
import { geoIPManager } from '@/utils/geoip';
import { geoFencingManager } from '@/utils/geoFencing';

const Index = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [logEntries, setLogEntries] = useState([]);
  const [threats, setThreats] = useState([]);
  const [geoAlerts, setGeoAlerts] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    failedAttempts: 0,
    successfulLogins: 0,
    uniqueIPs: 0,
    threatsDetected: 0
  });

  // Close mobile menu when monitoring updates to prevent UI refresh issues
  const closeMobileMenuOnUpdate = useCallback(() => {
    if (mobileMenuOpen && isMonitoring) {
      setMobileMenuOpen(false);
    }
  }, [mobileMenuOpen, isMonitoring]);

  // Simulate real-time log monitoring
  useEffect(() => {
    let interval;
    if (isMonitoring) {
      interval = setInterval(async () => {
        // Close mobile menu to prevent refresh issues
        closeMobileMenuOnUpdate();
        
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
  }, [isMonitoring, logEntries, threats, closeMobileMenuOnUpdate]);

  const generateMockLogEntry = async () => {
    const ips = ['45.123.45.67', '190.2.145.30', '103.89.7.22', '178.62.193.45', '61.177.172.140', '185.220.101.5'];
    const users = ['admin', 'root', 'user', 'test', 'guest', 'ubuntu', 'pi'];
    const statuses = ['failed', 'failed', 'failed', 'success'];
    const countries = ['China', 'Russia', 'India', 'Brazil', 'Germany', 'United States'];
    
    const ip = ips[Math.floor(Math.random() * ips.length)];
    const country = countries[Math.floor(Math.random() * countries.length)];
    
    const countryFlags = {
      'China': '🇨🇳',
      'Russia': '🇷🇺', 
      'India': '🇮🇳',
      'Brazil': '🇧🇷',
      'Germany': '🇩🇪',
      'United States': '🇺🇸'
    };
    
    return {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ip,
      user: users[Math.floor(Math.random() * users.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      port: 22,
      country,
      countryCode: country.substring(0, 2).toUpperCase(),
      city: `City-${Math.floor(Math.random() * 100)}`,
      flag: countryFlags[country] || '🏳️'
    };
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    // Close mobile menu when toggling monitoring
    setMobileMenuOpen(false);
  };

  // Updated tab items - removed Threat Detection tab and renamed Security Alerts
  const tabItems = [
    { value: "import", label: "Import Data", icon: Upload },
    { value: "dashboard", label: "Overview", icon: Activity },
    { value: "analytics", label: "Analytics", icon: TrendingUp },
    { value: "logs", label: "Live Logs", icon: Server },
    { value: "security", label: "Security Center", icon: Shield },
    { value: "reports", label: "Reports", icon: Download }
  ];

  const MobileNavigation = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-purple-500/20">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0 bg-slate-900/95 border-purple-500/20 backdrop-blur-xl">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg purple-glow">
                <Shield className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white transition-transform duration-300 hover:scale-105 cursor-pointer" tabIndex={0} aria-label="Log Analyser" title="Log Analyser">Log Analyser</h2>
                <p className="text-sm text-purple-200 animate-fade-in-fast transition-colors duration-300 hover:text-purple-400 cursor-pointer" tabIndex={0} aria-label="SSH Log Insights & Threats" title="SSH Log Insights & Threats">SSH Log Insights & Threats</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-2 px-4">
              {tabItems.map((item) => (
                <Button
                  key={item.value}
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-purple-500/20 hover:text-purple-300 transition-all duration-200"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    // Handle tab change logic here if needed
                  }}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>
          
          <div className="p-4 border-t border-purple-500/20">
            <Button
              onClick={() => {
                toggleMonitoring();
                setMobileMenuOpen(false);
              }}
              variant={isMonitoring ? "destructive" : "default"}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white border-purple-500 transition-all duration-200"
            >
              {isMonitoring ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isMonitoring ? 'Pause' : 'Start'} Monitoring
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  // Recalculate stats whenever logEntries changes (for both simulated and uploaded data)
  useEffect(() => {
    if (!logEntries || logEntries.length === 0) {
      setStats({
        totalAttempts: 0,
        failedAttempts: 0,
        successfulLogins: 0,
        uniqueIPs: 0,
        threatsDetected: threats.length
      });
      setThreats([]); // Also clear threats if no data
      return;
    }
    let totalAttempts = logEntries.length;
    let failedAttempts = 0;
    let successfulLogins = 0;
    let ipSet = new Set();
    for (const entry of logEntries) {
      if (entry.status === 'failed') failedAttempts++;
      if (entry.status === 'success') successfulLogins++;
      if (entry.ip) ipSet.add(entry.ip);
    }
    setStats({
      totalAttempts,
      failedAttempts,
      successfulLogins,
      uniqueIPs: ipSet.size,
      threatsDetected: threats.length
    });

    // --- Minimal threat detection logic (brute force, credential stuffing, suspicious usernames) ---
    const detectionRules = {
      bruteForceThreshold: 5,
      timeWindowMinutes: 5,
      suspiciousUsernames: ['admin', 'root', 'test']
    };
    const newThreats = [];
    const ipAttempts: Record<string, { failed: number; total: number; users: Set<string> }> = {};
    const userAttempts: Record<string, { failed: number; total: number; ips: Set<string> }> = {};
    const currentTime = new Date();
    logEntries.forEach(entry => {
      const entryTime = new Date(entry.timestamp);
      const timeDiff = (currentTime.getTime() - entryTime.getTime()) / (1000 * 60); // minutes
      if (timeDiff <= detectionRules.timeWindowMinutes) {
        // Track IP attempts
        if (!ipAttempts[entry.ip]) ipAttempts[entry.ip] = { failed: 0, total: 0, users: new Set() };
        ipAttempts[entry.ip].total++;
        ipAttempts[entry.ip].users.add(entry.user);
        if (entry.status === 'failed') ipAttempts[entry.ip].failed++;
        // Track user attempts
        if (!userAttempts[entry.user]) userAttempts[entry.user] = { failed: 0, total: 0, ips: new Set() };
        userAttempts[entry.user].total++;
        userAttempts[entry.user].ips.add(entry.ip);
        if (entry.status === 'failed') userAttempts[entry.user].failed++;
      }
    });
    // Brute force
    Object.entries(ipAttempts).forEach(([ip, data]) => {
      const d = data as { failed: number; total: number; users: Set<string> };
      if (d.failed >= detectionRules.bruteForceThreshold) {
        newThreats.push({
          id: `brute-${ip}-${Date.now()}`,
          type: 'Brute Force Attack',
          ip,
          severity: d.failed > 10 ? 'HIGH' : 'MEDIUM',
          description: `${d.failed} failed login attempts in ${detectionRules.timeWindowMinutes} minutes`,
          timestamp: new Date().toISOString(),
          details: {
            failedAttempts: d.failed,
            totalAttempts: d.total,
            uniqueUsers: d.users.size
          }
        });
      }
    });
    // Credential stuffing
    Object.entries(ipAttempts).forEach(([ip, data]) => {
      const d = data as { failed: number; total: number; users: Set<string> };
      if (d.users.size >= 3 && d.failed > 0) {
        newThreats.push({
          id: `cred-${ip}-${Date.now()}`,
          type: 'Credential Stuffing',
          ip,
          severity: 'MEDIUM',
          description: `Multiple username attempts (${d.users.size} users) from single IP`,
          timestamp: new Date().toISOString(),
          details: {
            usernames: Array.from(d.users),
            attempts: d.total
          }
        });
      }
    });
    // Suspicious usernames
    detectionRules.suspiciousUsernames.forEach(suspiciousUser => {
      const d = userAttempts[suspiciousUser] as { failed: number; total: number; ips: Set<string> } | undefined;
      if (d && d.failed > 0) {
        newThreats.push({
          id: `suspicious-${suspiciousUser}-${Date.now()}`,
          type: 'Suspicious Username',
          ip: Array.from(d.ips)[0],
          severity: 'LOW',
          description: `Login attempts with privileged username: ${suspiciousUser}`,
          timestamp: new Date().toISOString(),
          details: {
            username: suspiciousUser,
            attempts: d.total,
            uniqueIPs: d.ips.size
          }
        });
      }
    });
    setThreats(newThreats);
  }, [logEntries]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 animate-fade-in">
      {/* Enhanced Navigation Header with improved backdrop blur */}
      <header className="border-b border-purple-500/20 glass-effect sticky top-0 z-50 shadow-xl backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <MobileNavigation />
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/20 rounded-lg purple-glow animate-pulse">
                  <Shield className="h-6 w-6 text-purple-400" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-2xl font-bold text-white transition-transform duration-300 hover:scale-105 cursor-pointer" tabIndex={0} aria-label="Log Analyser" title="Log Analyser">
                    Log Analyser
                  </h1>
                  <p className="text-base font-medium text-purple-200 animate-fade-in-fast transition-colors duration-300 hover:text-purple-400 cursor-pointer" tabIndex={0} aria-label="SSH Log Insights & Threats" title="SSH Log Insights & Threats">
                    SSH Log Insights & Threats
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full transition-all duration-300 ${isMonitoring ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 'bg-gray-500'}`}></div>
                <span className="text-sm text-gray-300">
                  {isMonitoring ? 'Active' : 'Stopped'}
                </span>
              </div>
              <Button
                onClick={toggleMonitoring}
                variant={isMonitoring ? "destructive" : "default"}
                size="sm"
                className="hidden md:flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white border-purple-500 transition-all duration-200 hover:scale-105"
              >
                {isMonitoring ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span className="hidden lg:inline">{isMonitoring ? 'Pause' : 'Start'}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-3 sm:p-6 space-y-6">
        {/* Enhanced Alert Section with better animations */}
        {isMonitoring && (
          <Alert className="border-green-500/30 bg-green-500/10 glass-effect animate-scale-in">
            <Server className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-300">
              <span className="font-medium">System Active:</span> Monitoring SSH connections with real-time threat detection.
            </AlertDescription>
          </Alert>
        )}

        {geoAlerts.length > 0 && (
          <Alert className="border-amber-500/30 bg-amber-500/10 glass-effect animate-fade-in">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-amber-300">
              <strong>Security Alert:</strong> {geoAlerts.length} restricted location access attempt{geoAlerts.length > 1 ? 's' : ''} detected.
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced Overview Cards with improved styling */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Card className="glass-effect hover:shadow-xl transition-all duration-300 border-l-4 border-l-purple-500 purple-glow hover:scale-105 group">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-300">Total Attempts</p>
                  <p className="text-xl sm:text-3xl font-bold text-white group-hover:text-purple-300 transition-colors duration-300">{stats.totalAttempts.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Last 24h</p>
                </div>
                <div className="p-2 sm:p-3 bg-purple-500/20 rounded-full group-hover:bg-purple-500/30 transition-colors duration-300">
                  <Activity className="h-4 w-4 sm:h-6 sm:w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect hover:shadow-xl transition-all duration-300 border-l-4 border-l-red-500 hover:scale-105 group">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-300">Failed</p>
                  <p className="text-xl sm:text-3xl font-bold text-red-400 group-hover:text-red-300 transition-colors duration-300">{stats.failedAttempts.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Threats</p>
                </div>
                <div className="p-2 sm:p-3 bg-red-500/20 rounded-full group-hover:bg-red-500/30 transition-colors duration-300">
                  <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect hover:shadow-xl transition-all duration-300 border-l-4 border-l-green-500 hover:scale-105 group">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-300">Success</p>
                  <p className="text-xl sm:text-3xl font-bold text-green-400 group-hover:text-green-300 transition-colors duration-300">{stats.successfulLogins.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Authorized</p>
                </div>
                <div className="p-2 sm:p-3 bg-green-500/20 rounded-full group-hover:bg-green-500/30 transition-colors duration-300">
                  <Lock className="h-4 w-4 sm:h-6 sm:w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 hover:scale-105 group">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-300">Sources</p>
                  <p className="text-xl sm:text-3xl font-bold text-blue-400 group-hover:text-blue-300 transition-colors duration-300">{stats.uniqueIPs.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Unique IPs</p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-500/20 rounded-full group-hover:bg-blue-500/30 transition-colors duration-300">
                  <Users className="h-4 w-4 sm:h-6 sm:w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Main Content Tabs with improved design */}
        <Card className="glass-effect shadow-xl border-purple-500/20 purple-glow backdrop-blur-xl">
          <Tabs defaultValue="import" className="w-full">
            <div className="border-b border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
              <TabsList className="h-auto p-0 bg-transparent w-full">
                <div className="flex overflow-x-auto scrollbar-hide">
                  {tabItems.map((item) => (
                    <TabsTrigger 
                      key={item.value}
                      value={item.value} 
                      className="flex items-center space-x-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:text-purple-400 data-[state=active]:bg-purple-500/10 rounded-none bg-transparent whitespace-nowrap text-gray-300 hover:text-white hover:bg-purple-500/5 transition-all duration-200"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </TabsTrigger>
                  ))}
                </div>
              </TabsList>
            </div>

            <div className="p-3 sm:p-6">
              <TabsContent value="import" className="mt-0 animate-fade-in">
                <CSVUploader onCSVData={setLogEntries} />
              </TabsContent>

              <TabsContent value="dashboard" className="mt-0 animate-fade-in">
                <Dashboard logEntries={logEntries} stats={stats} threats={threats} />
              </TabsContent>

              <TabsContent value="analytics" className="mt-0 animate-fade-in">
                <AnalyticsPanel stats={stats} threats={threats} logEntries={logEntries} />
              </TabsContent>

              <TabsContent value="logs" className="mt-0 animate-fade-in">
                <LogParser logEntries={logEntries} isMonitoring={isMonitoring} />
              </TabsContent>

              <TabsContent value="security" className="mt-0 animate-fade-in">
                <SecurityCenter 
                  logEntries={logEntries} 
                  threats={threats} 
                  setThreats={setThreats}
                />
              </TabsContent>

              <TabsContent value="reports" className="mt-0 animate-fade-in">
                <ReportsPanel logEntries={logEntries} stats={stats} threats={threats} />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
      {/* Footer */}
      <footer className="w-full py-4 bg-slate-900/80 border-t border-purple-500/20 text-center text-gray-400 text-sm font-medium mt-8">
        © Aarav Kohli 2025
      </footer>
    </div>
  );
};

export default Index;
