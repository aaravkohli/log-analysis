import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Shield, AlertTriangle, TrendingUp, Globe, Clock, MapPin, Activity } from 'lucide-react';
import { dataManager, type LogEntry, type Stats } from '@/utils/dataManager';

interface DashboardProps {
  logEntries: LogEntry[];
  stats: Stats;
  threats: any[];
}

const Dashboard = ({ logEntries, stats, threats }: DashboardProps) => {
  // Get real data from data manager
  const topIPs = dataManager.getTopIPs(10);
  const hourlyData = dataManager.getHourlyActivityData();
  const dataSource = dataManager.getDataSource();

  const statusData = [
    { name: 'Failed', value: stats.failedAttempts, color: '#ef4444' },
    { name: 'Success', value: stats.successfulLogins, color: '#22c55e' }
  ];

  const threatLevel = threats.length > 5 ? 'HIGH' : threats.length > 2 ? 'MEDIUM' : 'LOW';
  const threatColor = threatLevel === 'HIGH' ? 'text-red-400' : threatLevel === 'MEDIUM' ? 'text-amber-400' : 'text-green-400';
  const threatBgColor = threatLevel === 'HIGH' ? 'glass-effect border-red-500/30' : threatLevel === 'MEDIUM' ? 'glass-effect border-amber-500/30' : 'glass-effect border-green-500/30';

  const chartConfig = {
    count: {
      label: "Attempts",
      color: "#8b5cf6",
    },
    attempts: {
      label: "Attempts",
      color: "#8b5cf6",
    },
    value: {
      label: "Count",
      color: "#8b5cf6",
    },
  };

  return (
    <div className="space-y-8">
      {/* Data Source Indicator */}
      {dataManager.isUploadedData() && (
        <Alert className="border-blue-500/30 bg-blue-500/10 glass-effect animate-fade-in">
          <Globe className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-300">
            <span className="font-medium">Data Source:</span> {dataSource.type === 'uploaded' ? 'Uploaded log files' : 'Mixed (uploaded + simulated)'} • {stats.totalAttempts.toLocaleString()} entries • Last updated: {new Date(dataSource.lastUpdate).toLocaleString()}
          </AlertDescription>
        </Alert>
      )}

      {/* Security Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className={`lg:col-span-2 ${threatBgColor} border-l-4 ${threatLevel === 'HIGH' ? 'border-l-red-500' : threatLevel === 'MEDIUM' ? 'border-l-amber-500' : 'border-l-green-500'} shadow-xl backdrop-blur-xl`}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg text-white">
              <Shield className="h-5 w-5 mr-3 text-purple-400" />
              Current Security Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-300 mb-1">Threat Level Assessment</p>
                <p className={`text-2xl font-bold ${threatColor}`}>{threatLevel} RISK</p>
                <p className="text-sm text-slate-400 mt-1">
                  Based on {threats.length} active threats detected
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{threats.length}</div>
                <div className="text-sm text-slate-300">Active Threats</div>
              </div>
            </div>
            <Progress 
              value={threatLevel === 'HIGH' ? 85 : threatLevel === 'MEDIUM' ? 55 : 15} 
              className="h-3"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-2">
              <span>Low Risk</span>
              <span>Medium Risk</span>
              <span>High Risk</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-slate-700 shadow-xl backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg text-white">
              <Clock className="h-5 w-5 mr-3 text-blue-400" />
              Authentication Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">Success Rate</span>
              <span className="font-semibold text-green-400">
                {stats.successRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">Unique Sources</span>
              <span className="font-semibold text-white">{stats.uniqueIPs}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">Failed Attempts</span>
              <span className="font-semibold text-red-400">{stats.failedAttempts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">Unique Users</span>
              <span className="font-semibold text-blue-400">{stats.uniqueUsers}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section with Theme-Consistent Styling */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Card className="glass-effect border-slate-700 shadow-xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-lg text-white">
              <TrendingUp className="h-5 w-5 mr-3 text-purple-400" />
              Top Source IP Addresses
            </CardTitle>
            <p className="text-sm text-slate-300">Most active connection attempts</p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topIPs} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis 
                    dataKey="ip" 
                    tick={{ fill: '#e2e8f0', fontSize: 12 }}
                    tickLine={{ stroke: '#64748b' }}
                    axisLine={{ stroke: '#64748b' }}
                  />
                  <YAxis 
                    tick={{ fill: '#e2e8f0', fontSize: 12 }}
                    tickLine={{ stroke: '#64748b' }}
                    axisLine={{ stroke: '#64748b' }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="glass-effect border-slate-700 shadow-xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-lg text-white">
              <Globe className="h-5 w-5 mr-3 text-green-400" />
              Authentication Results
            </CardTitle>
            <p className="text-sm text-slate-300">Success vs failure distribution</p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card className="glass-effect border-slate-700 shadow-xl backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-lg text-white">
            <Activity className="h-5 w-5 mr-3 text-amber-400" />
            24-Hour Connection Activity
          </CardTitle>
          <p className="text-sm text-slate-300">Hourly breakdown of SSH connection attempts</p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fill: '#e2e8f0', fontSize: 12 }}
                  tickLine={{ stroke: '#64748b' }}
                  axisLine={{ stroke: '#64748b' }}
                  label={{ value: 'Hour of Day', position: 'insideBottom', offset: -10, fill: '#e2e8f0' }}
                />
                <YAxis 
                  tick={{ fill: '#e2e8f0', fontSize: 12 }}
                  tickLine={{ stroke: '#64748b' }}
                  axisLine={{ stroke: '#64748b' }}
                  label={{ value: 'Attempts', angle: -90, position: 'insideLeft', fill: '#e2e8f0' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="attempts" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#8b5cf6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
        </Card>

      {/* Recent Security Events */}
      <Card className="glass-effect border-slate-700 shadow-xl backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-lg text-white">
            <AlertTriangle className="h-5 w-5 mr-3 text-amber-400" />
            Recent Security Events
          </CardTitle>
          <p className="text-sm text-slate-300">Latest threats and suspicious activities</p>
        </CardHeader>
        <CardContent>
          {threats.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-white">All Clear</p>
              <p className="text-slate-300">No security threats detected at this time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {threats.slice(0, 5).map((threat, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-slate-800/30 rounded-lg border border-slate-600/30 glass-effect">
                  <div className="p-2 bg-red-500/20 rounded-full flex-shrink-0">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-white">{threat.type}</h4>
                      <Badge variant="destructive" className="text-xs">{threat.severity}</Badge>
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
