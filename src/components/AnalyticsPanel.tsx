import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, Globe, Clock, MapPin, Activity, Shield, AlertTriangle, Search, FileText, Download } from 'lucide-react';
import GeoVisualization from '@/components/GeoVisualization';
import { VisualFilterBuilder, type VisualFilterConfig } from '@/components/VisualFilterBuilder';
import DataTable from '@/components/DataTable';
import { dataManager, type LogEntry, type Stats } from '@/utils/dataManager';
import { Button } from '@/components/ui/button';

interface AnalyticsPanelProps {
  stats: Stats;
  threats: any[];
  logEntries: LogEntry[];
}

const AnalyticsPanel = ({ stats, threats, logEntries }: AnalyticsPanelProps) => {
  // Get real data from data manager
  const hourlyData = dataManager.getHourlyActivityData();
  const userData = dataManager.getUserActivityData();
  const countryData = dataManager.getCountryDistributionData();
  const dataSource = dataManager.getDataSource();

  // Visual Filter Builder state for search tab
  const [filteredLogs, setFilteredLogs] = React.useState(logEntries);
  React.useEffect(() => { setFilteredLogs(logEntries); }, [logEntries]);

  // Preset dashboards for common use cases
  const presetFilters = [
    {
      id: '404-spike',
      name: '🚨 404 Spike Monitor',
      description: 'Catch broken links or potential attacks',
      config: {
        logic: 'AND' as const,
        conditions: [
          { id: '1', field: 'status', comparator: '=', value: 'failed', type: 'string', enabled: true },
        ],
        timeMode: 'relative' as const,
        relativeTime: '24h',
        limit: 1000,
      },
      createdAt: new Date().toISOString(),
      isPreset: true,
    },
    {
      id: 'test-failures',
      name: '🧪 Test Failures',
      description: 'Diagnose server issues and errors',
      config: {
        logic: 'AND' as const,
        conditions: [
          { id: '1', field: 'status', comparator: '=', value: 'failed', type: 'string', enabled: true },
        ],
        timeMode: 'relative' as const,
        relativeTime: '24h',
        limit: 1000,
      },
      createdAt: new Date().toISOString(),
      isPreset: true,
    },
    {
      id: 'top-visitors',
      name: '🌐 Top Visitors',
      description: 'See most frequent users and patterns',
      config: {
        logic: 'AND' as const,
        conditions: [
          { id: '1', field: 'method', comparator: '=', value: 'GET', type: 'string', enabled: true },
        ],
        timeMode: 'relative' as const,
        relativeTime: '24h',
        limit: 1000,
      },
      createdAt: new Date().toISOString(),
      isPreset: true,
    },
    {
      id: 'suspicious-traffic',
      name: '📌 Suspicious Traffic',
      description: 'Flag anomalies and potential threats',
      config: {
        logic: 'AND' as const,
        conditions: [
          { id: '1', field: 'bytes', comparator: '<', value: 10, type: 'number', enabled: true },
          { id: '2', field: 'method', comparator: '=', value: 'POST', type: 'string', enabled: true },
        ],
        timeMode: 'relative' as const,
        relativeTime: '24h',
        limit: 1000,
      },
      createdAt: new Date().toISOString(),
      isPreset: true,
    },
    {
      id: 'country-view',
      name: '🕵️ Country-Based View',
      description: 'Geographic breakdown and analysis',
      config: {
        logic: 'AND' as const,
        conditions: [],
        timeMode: 'relative' as const,
        relativeTime: '24h',
        limit: 1000,
      },
      createdAt: new Date().toISOString(),
      isPreset: true,
    },
    {
      id: 'high-severity',
      name: '🔴 High Severity Threats',
      description: 'Critical security incidents',
      config: {
        logic: 'AND' as const,
        conditions: [
          { id: '1', field: 'severity', comparator: '=', value: 'high', type: 'string', enabled: true },
        ],
        timeMode: 'relative' as const,
        relativeTime: '24h',
        limit: 1000,
      },
      createdAt: new Date().toISOString(),
      isPreset: true,
    },
    {
      id: 'recent-activity',
      name: '⏰ Recent Activity',
      description: 'Last hour of system activity',
      config: {
        logic: 'AND' as const,
        conditions: [],
        timeMode: 'relative' as const,
        relativeTime: '1h',
        limit: 1000,
      },
      createdAt: new Date().toISOString(),
      isPreset: true,
    },
    {
      id: 'large-requests',
      name: '📦 Large Requests',
      description: 'Monitor bandwidth usage patterns',
      config: {
        logic: 'AND' as const,
        conditions: [
          { id: '1', field: 'bytes', comparator: '>', value: 1000, type: 'number', enabled: true },
        ],
        timeMode: 'relative' as const,
        relativeTime: '24h',
        limit: 1000,
      },
      createdAt: new Date().toISOString(),
      isPreset: true,
    },
    {
      id: 'failed-logins',
      name: '🔐 Failed Logins',
      description: 'Authentication failures and brute force attempts',
      config: {
        logic: 'AND' as const,
        conditions: [
          { id: '1', field: 'status', comparator: '=', value: 'failed', type: 'string', enabled: true },
          { id: '2', field: 'method', comparator: 'contains', value: 'login', type: 'string', enabled: true },
        ],
        timeMode: 'relative' as const,
        relativeTime: '24h',
        limit: 1000,
      },
      createdAt: new Date().toISOString(),
      isPreset: true,
    },
    {
      id: 'successful-logins',
      name: '✅ Successful Logins',
      description: 'Track successful authentication events',
      config: {
        logic: 'AND' as const,
        conditions: [
          { id: '1', field: 'status', comparator: '=', value: 'success', type: 'string', enabled: true },
          { id: '2', field: 'method', comparator: 'contains', value: 'login', type: 'string', enabled: true },
        ],
        timeMode: 'relative' as const,
        relativeTime: '24h',
        limit: 1000,
      },
      createdAt: new Date().toISOString(),
      isPreset: true,
    },
    {
      id: 'api-calls',
      name: '🔌 API Calls',
      description: 'Monitor API endpoint usage',
      config: {
        logic: 'AND' as const,
        conditions: [
          { id: '1', field: 'method', comparator: 'contains', value: 'api', type: 'string', enabled: true },
        ],
        timeMode: 'relative' as const,
        relativeTime: '24h',
        limit: 1000,
      },
      createdAt: new Date().toISOString(),
      isPreset: true,
    },
    {
      id: 'admin-access',
      name: '👑 Admin Access',
      description: 'Administrative actions and access',
      config: {
        logic: 'AND' as const,
        conditions: [
          { id: '1', field: 'username', comparator: 'contains', value: 'admin', type: 'string', enabled: true },
        ],
        timeMode: 'relative' as const,
        relativeTime: '24h',
        limit: 1000,
      },
      createdAt: new Date().toISOString(),
      isPreset: true,
    },
    {
      id: 'database-queries',
      name: '🗄️ Database Queries',
      description: 'Database access and query patterns',
      config: {
        logic: 'AND' as const,
        conditions: [
          { id: '1', field: 'method', comparator: 'contains', value: 'db', type: 'string', enabled: true },
        ],
        timeMode: 'relative' as const,
        relativeTime: '24h',
        limit: 1000,
      },
      createdAt: new Date().toISOString(),
      isPreset: true,
    },
    {
      id: 'file-uploads',
      name: '📁 File Uploads',
      description: 'File upload activities and security',
      config: {
        logic: 'AND' as const,
        conditions: [
          { id: '1', field: 'method', comparator: 'contains', value: 'upload', type: 'string', enabled: true },
        ],
        timeMode: 'relative' as const,
        relativeTime: '24h',
        limit: 1000,
      },
      createdAt: new Date().toISOString(),
      isPreset: true,
    },
    {
      id: 'error-logs',
      name: '❌ Error Logs',
      description: 'System errors and exceptions',
      config: {
        logic: 'AND' as const,
        conditions: [
          { id: '1', field: 'status', comparator: '>=', value: 400, type: 'number', enabled: true },
        ],
        timeMode: 'relative' as const,
        relativeTime: '24h',
        limit: 1000,
      },
      createdAt: new Date().toISOString(),
      isPreset: true,
    },
    {
      id: 'slow-requests',
      name: '🐌 Slow Requests',
      description: 'Performance monitoring and bottlenecks',
      config: {
        logic: 'AND' as const,
        conditions: [
          { id: '1', field: 'response_time', comparator: '>', value: 5000, type: 'number', enabled: true },
        ],
        timeMode: 'relative' as const,
        relativeTime: '24h',
        limit: 1000,
      },
      createdAt: new Date().toISOString(),
      isPreset: true,
    },
    {
      id: 'mobile-access',
      name: '📱 Mobile Access',
      description: 'Mobile device access patterns',
      config: {
        logic: 'AND' as const,
        conditions: [
          { id: '1', field: 'user_agent', comparator: 'contains', value: 'mobile', type: 'string', enabled: true },
        ],
        timeMode: 'relative' as const,
        relativeTime: '24h',
        limit: 1000,
      },
      createdAt: new Date().toISOString(),
      isPreset: true,
    },
    {
      id: 'bot-traffic',
      name: '🤖 Bot Traffic',
      description: 'Bot and crawler activity',
      config: {
        logic: 'AND' as const,
        conditions: [
          { id: '1', field: 'user_agent', comparator: 'contains', value: 'bot', type: 'string', enabled: true },
        ],
        timeMode: 'relative' as const,
        relativeTime: '24h',
        limit: 1000,
      },
      createdAt: new Date().toISOString(),
      isPreset: true,
    },
    {
      id: 'vpn-access',
      name: '🔒 VPN Access',
      description: 'VPN and proxy connections',
      config: {
        logic: 'AND' as const,
        conditions: [
          { id: '1', field: 'ip_address', comparator: 'contains', value: 'vpn', type: 'string', enabled: true },
        ],
        timeMode: 'relative' as const,
        relativeTime: '24h',
        limit: 1000,
      },
      createdAt: new Date().toISOString(),
      isPreset: true,
    },
    {
      id: 'peak-hours',
      name: '📈 Peak Hours',
      description: 'High traffic periods and load analysis',
      config: {
        logic: 'AND' as const,
        conditions: [],
        timeMode: 'relative' as const,
        relativeTime: '6h',
        limit: 1000,
      },
      createdAt: new Date().toISOString(),
      isPreset: true,
    },
  ];

  // Generate threat trend data (this could be enhanced with real historical data)
  const generateThreatTrendData = () => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        threats: Math.floor(Math.random() * 20) + 5,
        blocked: Math.floor(Math.random() * 15) + 3,
        severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
      };
    });
  };

  const threatTrendData = generateThreatTrendData();

  const statusData = [
    { name: 'Failed', value: stats.failedAttempts, color: '#ef4444' },
    { name: 'Successful', value: stats.successfulLogins, color: '#22c55e' }
  ];

  const threatSeverityData = [
    { name: 'Critical', value: threats.filter(t => t.severity === 'critical').length, color: '#dc2626' },
    { name: 'High', value: threats.filter(t => t.severity === 'high').length, color: '#ea580c' },
    { name: 'Medium', value: threats.filter(t => t.severity === 'medium').length, color: '#ca8a04' },
    { name: 'Low', value: threats.filter(t => t.severity === 'low').length, color: '#16a34a' }
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Analytics Sub-Navigation */}
      <Card className="glass-effect border-slate-700">
        <Tabs defaultValue="overview" className="w-full">
          <div className="border-b border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
            <TabsList className="h-auto p-0 bg-transparent w-full">
              <div className="flex overflow-x-auto scrollbar-hide">
                <TabsTrigger 
                  value="overview"
                  className="flex items-center space-x-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:text-purple-400 data-[state=active]:bg-purple-500/10 rounded-none bg-transparent whitespace-nowrap text-gray-300 hover:text-white hover:bg-purple-500/5 transition-all duration-200"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Analytics Overview</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="search"
                  className="flex items-center space-x-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:text-purple-400 data-[state=active]:bg-purple-500/10 rounded-none bg-transparent whitespace-nowrap text-gray-300 hover:text-white hover:bg-purple-500/5 transition-all duration-200"
                >
                  <Search className="h-4 w-4" />
                  <span>Search & Filter</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="geo"
                  className="flex items-center space-x-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:text-purple-400 data-[state=active]:bg-purple-500/10 rounded-none bg-transparent whitespace-nowrap text-gray-300 hover:text-white hover:bg-purple-500/5 transition-all duration-200"
                >
                  <Globe className="h-4 w-4" />
                  <span>Geographic Analysis</span>
                </TabsTrigger>
              </div>
            </TabsList>
          </div>

          <div className="p-3 sm:p-6">
            <TabsContent value="overview" className="mt-0 space-y-6 sm:space-y-8 animate-fade-in">
              {/* Enhanced Analytics Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <Card className="glass-effect border-slate-700 hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-300">Attack Vectors</p>
                        <p className="text-lg sm:text-2xl font-bold text-white">{threats.length}</p>
                        <p className="text-xs text-purple-400">Active</p>
                      </div>
                      <div className="p-2 sm:p-3 bg-purple-500/20 rounded-full flex-shrink-0">
                        <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-effect border-slate-700 hover:border-green-500/50 transition-all duration-300 hover:scale-105">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-300">Success Rate</p>
                        <p className="text-lg sm:text-2xl font-bold text-green-400">
                          {stats.successRate.toFixed(1)}%
                        </p>
                        <p className="text-xs text-green-400">Authentication</p>
                      </div>
                      <div className="p-2 sm:p-3 bg-green-500/20 rounded-full flex-shrink-0">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-effect border-slate-700 hover:border-blue-500/50 transition-all duration-300 hover:scale-105">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-300">Geographic Spread</p>
                        <p className="text-lg sm:text-2xl font-bold text-blue-400">
                          {stats.uniqueCountries}
                        </p>
                        <p className="text-xs text-blue-400">Countries</p>
                      </div>
                      <div className="p-2 sm:p-3 bg-blue-500/20 rounded-full flex-shrink-0">
                        <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-effect border-slate-700 hover:border-yellow-500/50 transition-all duration-300 hover:scale-105">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-300">Peak Hour</p>
                        <p className="text-lg sm:text-2xl font-bold text-yellow-400">
                          {hourlyData.reduce((max, curr) => curr.attempts > max.attempts ? curr : max).hour}
                        </p>
                        <p className="text-xs text-yellow-400">Most Active</p>
                      </div>
                      <div className="p-2 sm:p-3 bg-yellow-500/20 rounded-full flex-shrink-0">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Charts Section - Responsive Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* 24-Hour Activity Pattern */}
                <Card className="glass-effect border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center text-base sm:text-lg">
                      <Activity className="h-5 w-5 mr-3 text-purple-400" />
                      24-Hour Activity Pattern
                    </CardTitle>
                    <p className="text-slate-300 text-xs sm:text-sm">Hourly breakdown of authentication attempts</p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 sm:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hourlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                          <defs>
                            <linearGradient id="attemptsGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="hour" 
                            tick={{ fill: '#9ca3af', fontSize: 10 }}
                            tickLine={{ stroke: '#6b7280' }}
                            interval="preserveStartEnd"
                          />
                          <YAxis 
                            tick={{ fill: '#9ca3af', fontSize: 10 }}
                            tickLine={{ stroke: '#6b7280' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1f2937', 
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#ffffff',
                              fontSize: '12px'
                            }} 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="attempts" 
                            stroke="#8b5cf6" 
                            fillOpacity={1} 
                            fill="url(#attemptsGradient)"
                            strokeWidth={2}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="failed" 
                            stroke="#ef4444" 
                            fillOpacity={1} 
                            fill="url(#failedGradient)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Threat Severity Distribution */}
                <Card className="glass-effect border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center text-base sm:text-lg">
                      <AlertTriangle className="h-5 w-5 mr-3 text-red-400" />
                      Threat Severity Distribution
                    </CardTitle>
                    <p className="text-slate-300 text-xs sm:text-sm">Current threat landscape overview</p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 sm:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={threatSeverityData}
                            cx="50%"
                            cy="50%"
                            outerRadius="80%"
                            innerRadius="45%"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {threatSeverityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1f2937', 
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#ffffff',
                              fontSize: '12px'
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* User Activity Analysis - Full Width Responsive */}
              <Card className="glass-effect border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-base sm:text-lg">
                    <Users className="h-5 w-5 mr-3 text-blue-400" />
                    Top Targeted User Accounts
                  </CardTitle>
                  <p className="text-slate-300 text-xs sm:text-sm">Most frequently targeted usernames and their risk profiles</p>
                </CardHeader>
                <CardContent>
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={userData.slice(0, 8)} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="user" 
                          tick={{ fill: '#9ca3af', fontSize: 10 }}
                          tickLine={{ stroke: '#6b7280' }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          tick={{ fill: '#9ca3af', fontSize: 10 }}
                          tickLine={{ stroke: '#6b7280' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontSize: '12px'
                          }} 
                        />
                        <Bar dataKey="attempts" fill="#3b82f6" name="Total Attempts" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="failed" fill="#ef4444" name="Failed Attempts" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Country Distribution Analysis */}
              <Card className="glass-effect border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-base sm:text-lg">
                    <Globe className="h-5 w-5 mr-3 text-green-400" />
                    Geographic Attack Distribution
                  </CardTitle>
                  <p className="text-slate-300 text-xs sm:text-sm">Attack attempts by country of origin</p>
                </CardHeader>
                <CardContent>
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={countryData.slice(0, 10)} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="country" 
                          tick={{ fill: '#9ca3af', fontSize: 10 }}
                          tickLine={{ stroke: '#6b7280' }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          tick={{ fill: '#9ca3af', fontSize: 10 }}
                          tickLine={{ stroke: '#6b7280' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontSize: '12px'
                          }} 
                        />
                        <Bar dataKey="attempts" fill="#10b981" name="Total Attempts" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="failed" fill="#ef4444" name="Failed Attempts" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Threat Trend Analysis - Full Width Responsive */}
              <Card className="glass-effect border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-base sm:text-lg">
                    <TrendingUp className="h-5 w-5 mr-3 text-green-400" />
                    30-Day Threat Trend Analysis
                  </CardTitle>
                  <p className="text-slate-300 text-xs sm:text-sm">Historical view of security threats and mitigation effectiveness</p>
                </CardHeader>
                <CardContent>
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={threatTrendData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: '#9ca3af', fontSize: 10 }}
                          tickLine={{ stroke: '#6b7280' }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          tick={{ fill: '#9ca3af', fontSize: 10 }}
                          tickLine={{ stroke: '#6b7280' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontSize: '12px'
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="threats" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          dot={{ fill: '#ef4444', strokeWidth: 1, r: 3 }}
                          name="Threats Detected"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="blocked" 
                          stroke="#22c55e" 
                          strokeWidth={2}
                          dot={{ fill: '#22c55e', strokeWidth: 1, r: 3 }}
                          name="Threats Blocked"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SEARCH TAB: Visual Filter Builder */}
            <TabsContent value="search" className="mt-0 animate-fade-in">
              <div className="space-y-6">
                <VisualFilterBuilder
                  logEntries={logEntries}
                  onFilterChange={(filtered) => setFilteredLogs(filtered)}
                  presets={presetFilters}
                />
                
                {/* Filtered Results Display */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <CardTitle className="text-white flex items-center text-lg font-semibold">
                        <FileText className="h-5 w-5 mr-2 text-blue-400" />
                        Filtered Results
                      </CardTitle>
                      <Badge variant="secondary" className="text-sm">
                        {filteredLogs.length.toLocaleString()} records found
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-sm pt-2">
                      Showing filtered log entries. Use the filter builder above to refine your search.
                    </p>
                  </CardHeader>
                  <CardContent>
                    {filteredLogs.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-slate-500" />
                        <h3 className="text-lg font-medium mb-2">No Results Found</h3>
                        <p className="text-sm">Try adjusting your filter criteria or time range.</p>
                      </div>
                    ) : (
                      <DataTable
                        data={filteredLogs}
                        columns={Object.keys(filteredLogs[0] || {}).map((key) => ({
                          key,
                          header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
                          render: (value: any) => {
                            if (key === 'timestamp' && value) {
                              return new Date(value).toLocaleString();
                            }
                            if (key === 'status') {
                              const isSuccess = ['success', '200', 'succeeded'].includes(String(value).toLowerCase());
                              const isError = ['failed', 'error', 'denied'].includes(String(value).toLowerCase()) || (typeof value === 'number' && value >= 400);
                              return (
                                <Badge variant={isSuccess ? 'default' : isError ? 'destructive' : 'secondary'} className="text-xs">
                                  {String(value)}
                                </Badge>
                              );
                            }
                            if (key === 'severity' && value) {
                              const severityColors: { [key: string]: string } = {
                                critical: 'bg-red-700 border-red-500/50',
                                high: 'bg-red-500 border-red-400/50',
                                medium: 'bg-yellow-500 border-yellow-400/50',
                                low: 'bg-green-500 border-green-400/50'
                              };
                              return (
                                <Badge className={`text-xs text-white ${severityColors[String(value).toLowerCase()] || 'bg-gray-500'}`}>
                                  {String(value)}
                                </Badge>
                              );
                            }
                            if (key.includes('ip') && value) {
                              return <span className="font-mono text-sm text-blue-300">{String(value)}</span>;
                            }
                            if (key === 'bytes' && typeof value === 'number') {
                              return <span>{value.toLocaleString()} B</span>;
                            }
                            if (key.includes('time') && typeof value === 'number') {
                              return <span className={`${value > 5000 ? 'text-red-400' : value > 2000 ? 'text-yellow-400' : 'text-green-400'}`}>{value}ms</span>;
                            }
                            return <span className="truncate max-w-xs">{String(value ?? '')}</span>;
                          }
                        }))}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="geo" className="mt-0 animate-fade-in">
              <GeoVisualization logEntries={logEntries} />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
};

export default AnalyticsPanel;
