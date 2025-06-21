import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, Globe, Clock, MapPin, Activity, Shield, AlertTriangle, Search } from 'lucide-react';
import GeoVisualization from '@/components/GeoVisualization';
import { VisualFilterBuilder } from './VisualFilterBuilder';
import DataTable from './DataTable';

interface AnalyticsPanelProps {
  stats: any;
  threats: any[];
  logEntries: any[];
}

const AnalyticsPanel = ({ stats, threats, logEntries }: AnalyticsPanelProps) => {
  // Generate hourly data from real logEntries
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    attempts: 0,
    failed: 0,
    successful: 0,
    threatLevel: 'low',
  }));
  logEntries.forEach(entry => {
    const date = new Date(entry.timestamp);
    if (!isNaN(date.getTime())) {
      const hour = date.getHours();
      hourlyData[hour].attempts++;
      if (entry.status === 'failed') hourlyData[hour].failed++;
      if (entry.status === 'success') hourlyData[hour].successful++;
    }
  });
  hourlyData.forEach(h => {
    h.threatLevel = h.failed > h.attempts * 0.8 ? 'high' : h.failed > h.attempts * 0.6 ? 'medium' : 'low';
  });

  // Generate user activity data from real logEntries
  const userMap: Record<string, { attempts: number; failed: number; successful: number; countries: Set<string>; riskScore: number }> = {};
  logEntries.forEach(entry => {
    const user = entry.user || 'Unknown';
    if (!userMap[user]) {
      userMap[user] = { attempts: 0, failed: 0, successful: 0, countries: new Set(), riskScore: 0 };
    }
    userMap[user].attempts++;
    if (entry.status === 'failed') userMap[user].failed++;
    if (entry.status === 'success') userMap[user].successful++;
    userMap[user].countries.add(entry.country || 'Unknown');
  });
  const userData = Object.entries(userMap).map(([user, data]) => ({
    user,
    attempts: data.attempts,
    failed: data.failed,
    successful: data.successful,
    countries: data.countries.size,
    riskScore: data.attempts > 0 ? Math.floor((data.failed / data.attempts) * 100) : 0
  })).sort((a, b) => b.attempts - a.attempts);

  // Generate threat trend data from real threats (by day)
  const threatTrendMap: Record<string, { threats: number; blocked: number; severity: string }> = {};
  threats.forEach(threat => {
    const date = new Date(threat.timestamp || threat.time || Date.now());
    const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!threatTrendMap[key]) threatTrendMap[key] = { threats: 0, blocked: 0, severity: 'low' };
    threatTrendMap[key].threats++;
    if (threat.blocked) threatTrendMap[key].blocked++;
    threatTrendMap[key].severity = threat.severity || 'low';
  });
  const threatTrendData = Object.entries(threatTrendMap).map(([date, data]) => ({
    date,
    ...data
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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

  // Visual Filter Builder state for search tab
  const [filteredLogs, setFilteredLogs] = React.useState(logEntries);
  React.useEffect(() => { setFilteredLogs(logEntries); }, [logEntries]);

  // Preset dashboards
  const presetFilters = [
    {
      id: '404-spike',
      name: '404 Spike Monitor',
      config: {
        logic: 'AND' as const,
        conditions: [
          { field: 'status', comparator: '=', value: '404', type: 'string' },
        ],
        timeMode: 'relative' as const,
        relativeTime: 'all',
      },
    },
    {
      id: 'test-failures',
      name: 'Test Failures',
      config: {
        logic: 'AND' as const,
        conditions: [
          { field: 'status', comparator: '=', value: 'failed', type: 'string' },
        ],
        timeMode: 'relative' as const,
        relativeTime: 'all',
      },
    },
    {
      id: 'top-visitors',
      name: 'Top Visitors',
      config: {
        logic: 'AND' as const,
        conditions: [
          { field: 'method', comparator: '=', value: 'GET', type: 'string' },
        ],
        timeMode: 'relative' as const,
        relativeTime: 'all',
      },
    },
    {
      id: 'suspicious-traffic',
      name: 'Suspicious Traffic',
      config: {
        logic: 'AND' as const,
        conditions: [
          { field: 'bytes', comparator: '<', value: 10, type: 'number' },
          { field: 'method', comparator: '=', value: 'POST', type: 'string' },
        ],
        timeMode: 'relative' as const,
        relativeTime: 'all',
      },
    },
    {
      id: 'country-view',
      name: 'Country-Based View',
      config: {
        logic: 'AND' as const,
        conditions: [],
        timeMode: 'relative' as const,
        relativeTime: 'all',
      },
    },
  
    // New Presets Below
  
    {
      id: 'error-rate',
      name: 'High Error Rate',
      config: {
        logic: 'AND' as const,
        conditions: [
          { field: 'status_code', comparator: '>=', value: 500, type: 'number' },
        ],
        timeMode: 'relative' as const,
        relativeTime: 'all',
      },
    },
    {
      id: 'slow-requests',
      name: 'Slow Requests (>1s)',
      config: {
        logic: 'AND' as const,
        conditions: [
          { field: 'response_time_ms', comparator: '>', value: 1000, type: 'number' },
        ],
        timeMode: 'relative' as const,
        relativeTime: 'all',
      },
    },
    {
      id: 'post-logins',
      name: 'POST Logins',
      config: {
        logic: 'AND' as const,
        conditions: [
          { field: 'method', comparator: '=', value: 'POST', type: 'string' },
          { field: 'resource', comparator: 'contains', value: 'login', type: 'string' },
        ],
        timeMode: 'relative' as const,
        relativeTime: 'all',
      },
    },
    {
      id: 'large-uploads',
      name: 'Large Uploads (>1MB)',
      config: {
        logic: 'AND' as const,
        conditions: [
          { field: 'bytes_sent', comparator: '>=', value: 1048576, type: 'number' },
        ],
        timeMode: 'relative' as const,
        relativeTime: 'all',
      },
    },
    {
      id: 'user-agents',
      name: 'Unusual User Agents',
      config: {
        logic: 'OR' as const,
        conditions: [
          { field: 'user_agent', comparator: 'contains', value: 'curl', type: 'string' },
          { field: 'user_agent', comparator: 'contains', value: 'python', type: 'string' },
        ],
        timeMode: 'relative' as const,
        relativeTime: 'all',
      },
    },
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
                  <span>Geo View</span>
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
                          {stats.totalAttempts > 0 ? ((stats.successfulLogins / stats.totalAttempts) * 100).toFixed(1) : '0'}%
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
                          {new Set(logEntries.map(entry => entry.country)).size}
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
                    {logEntries.length === 0 ? (
                      <div className="text-center py-12">
                        <Shield className="h-12 w-12 text-green-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-white">All Clear</p>
                        <p className="text-slate-300">No authentication attempts recorded</p>
                      </div>
                    ) : (
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
                    )}
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
                    {threats.length === 0 ? (
                      <div className="text-center py-12">
                        <Shield className="h-12 w-12 text-green-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-white">All Clear</p>
                        <p className="text-slate-300">No threats detected</p>
                      </div>
                    ) : (
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
                    )}
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
                  {logEntries.length === 0 ? (
                    <div className="text-center py-12">
                      <Shield className="h-12 w-12 text-green-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-white">All Clear</p>
                      <p className="text-slate-300">No user activity recorded</p>
                    </div>
                  ) : (
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
                  )}
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
                  {threats.length === 0 ? (
                    <div className="text-center py-12">
                      <Shield className="h-12 w-12 text-green-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-white">All Clear</p>
                      <p className="text-slate-300">No threats detected</p>
                    </div>
                  ) : (
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
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="search" className="mt-0 animate-fade-in">
              <VisualFilterBuilder
                logEntries={logEntries}
                onFilterChange={(filtered) => setFilteredLogs(filtered)}
                presets={presetFilters}
              />
              <div className="mt-6">
                <DataTable
                  data={filteredLogs}
                  columns={Object.keys(filteredLogs[0] || {}).map((key) => ({
                    key,
                    header: key.charAt(0).toUpperCase() + key.slice(1),
                  }))}
                />
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
