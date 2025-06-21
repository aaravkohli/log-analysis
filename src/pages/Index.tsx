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
import { dataManager, type LogEntry, type Stats } from '@/utils/dataManager';
import LogSearchPanel from '@/components/LogSearchPanel';
import { Toaster } from '@/components/ui/sonner';
import Footer from '@/components/Footer';

const Index = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [threats, setThreats] = useState([]);
  const [geoAlerts, setGeoAlerts] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalAttempts: 0,
    failedAttempts: 0,
    successfulLogins: 0,
    uniqueIPs: 0,
    threatsDetected: 0,
    uniqueCountries: 0,
    uniqueUsers: 0,
    successRate: 0
  });

  // Update stats whenever log entries change
  useEffect(() => {
    const currentStats = dataManager.calculateStats();
    setStats(currentStats);
  }, [logEntries]);

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
        
        // Generate new log entry
        const newEntry = await generateMockLogEntry();
        
        // Add to data manager
        dataManager.addLogEntries([newEntry], 'append');
        
        // Update parent component
        setLogEntries(dataManager.getLogEntries());
        
        // Check for geo-fencing violations
        const geoAlert = geoFencingManager.checkGeoFencing(newEntry);
        if (geoAlert) {
          setGeoAlerts(prev => [geoAlert, ...prev.slice(0, 9)]);
        }
          
          // Save historical data every 10 attempts
        const currentStats = dataManager.calculateStats();
        if (currentStats.totalAttempts % 10 === 0) {
          historicalDataManager.saveDataPoint(currentStats, threats);
          }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isMonitoring, threats, closeMobileMenuOnUpdate]);

  const generateMockLogEntry = async (): Promise<LogEntry> => {
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
      status: statuses[Math.floor(Math.random() * statuses.length)] as 'success' | 'failed',
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
                <h2 className="font-semibold text-white">SSH Guardian</h2>
                <p className="text-sm text-gray-300">Security Monitor</p>
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
              {isMonitoring ? 'Pause' : 'Simulate'} Monitoring
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  // Get data source info for display
  const dataSource = dataManager.getDataSource();

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
                  <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 animate-gradient-x">
                    Log Analyser
                  </h1>
                  <p className="text-sm text-gray-300">
                    Intelligent Log Analysis Platform
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
                {dataManager.isUploadedData() && (
                  <Badge variant="outline" className="border-blue-400 text-blue-400 text-xs">
                    {dataSource.type}
                  </Badge>
                )}
              </div>
              <Button
                onClick={toggleMonitoring}
                variant={isMonitoring ? "destructive" : "default"}
                size="sm"
                className="hidden md:flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white border-purple-500 transition-all duration-200 hover:scale-105"
              >
                {isMonitoring ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span className="hidden lg:inline">{isMonitoring ? 'Pause' : 'Simulate'}</span>
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

          <Card className="glass-effect hover:shadow-xl transition-all duration-300 border-l-4 border-l-red-500 purple-glow hover:scale-105 group">
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

          <Card className="glass-effect hover:shadow-xl transition-all duration-300 border-l-4 border-l-green-500 purple-glow hover:scale-105 group">
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

          <Card className="glass-effect hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 purple-glow hover:scale-105 group">
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
          <Tabs defaultValue="dashboard" className="w-full">
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
              <TabsContent value="dashboard" className="mt-0 animate-fade-in">
                <Dashboard logEntries={logEntries} stats={stats} threats={threats} />
              </TabsContent>

              <TabsContent value="import" className="mt-0 animate-fade-in">
                <CSVUploader logEntries={logEntries} setLogEntries={setLogEntries} />
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
        <Footer />
      </div>
    </div>
  );
};

export default Index;
