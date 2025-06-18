import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Shield, AlertTriangle, TrendingUp, Globe } from 'lucide-react';
import CSVUploader from './CSVUploader';

interface DashboardProps {
  logEntries: any[];
  stats: any;
  threats: any[];
  onLogEntriesUpdate?: (entries: any[]) => void;
}

const Dashboard = ({ logEntries, stats, threats, onLogEntriesUpdate }: DashboardProps) => {
  const [showCSVUploader, setShowCSVUploader] = useState(false);

  // Process data for charts
  const ipData: Record<string, number> = logEntries.reduce((acc, entry) => {
    acc[entry.ip] = (acc[entry.ip] || 0) + 1;
    return acc;
  }, {});

  const topIPs = Object.entries(ipData)
    .map(([ip, count]) => ({ ip, count: count as number }))
    .sort((a, b) => (b.count as number) - (a.count as number))
    .slice(0, 10);

  const statusData = [
    { name: 'Failed', value: stats.failedAttempts, color: '#ef4444' },
    { name: 'Success', value: stats.successfulLogins, color: '#22c55e' }
  ];

  // Generate hourly data based on actual log entries
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    // Count attempts for each hour
    const hourAttempts = logEntries.filter(entry => {
      const entryHour = new Date(entry.timestamp).getHours();
      return entryHour === hour;
    });
    
    return {
      hour,
      attempts: hourAttempts.length || 0
    };
  });

  const threatLevel = threats.length > 5 ? 'HIGH' : threats.length > 2 ? 'MEDIUM' : 'LOW';
  const threatColor = threatLevel === 'HIGH' ? 'text-red-400' : threatLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400';

  const handleCSVData = (data: any[]) => {
    if (onLogEntriesUpdate) {
      onLogEntriesUpdate(data);
    }
    setShowCSVUploader(false);
  };

  return (
    <div className="space-y-6">
      {/* CSV Upload Section */}
      {showCSVUploader ? (
        <CSVUploader onCSVData={handleCSVData} />
      ) : (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <button
              onClick={() => setShowCSVUploader(true)}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Upload Log CSV
            </button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Level Card */}
        <Card className="bg-slate-800/50 border-slate-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Security Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Current Threat Level</p>
                <p className={`text-3xl font-bold ${threatColor}`}>{threatLevel}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400">Active Threats</p>
                <p className="text-2xl font-bold text-white">{threats.length}</p>
              </div>
            </div>
            <Progress 
              value={threatLevel === 'HIGH' ? 80 : threatLevel === 'MEDIUM' ? 50 : 20} 
              className="mt-4"
            />
          </CardContent>
        </Card>

        {/* Top IPs Chart */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Top Source IPs</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topIPs}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="ip" tick={{ fill: '#9ca3af' }} />
                <YAxis tick={{ fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    color: '#fff'
                  }} 
                />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Success vs Failed Pie Chart */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Login Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    color: '#fff'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 24-Hour Activity */}
        <Card className="bg-slate-800/50 border-slate-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">24-Hour Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" tick={{ fill: '#9ca3af' }} />
                <YAxis tick={{ fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    color: '#fff'
                  }} 
                />
                <Line type="monotone" dataKey="attempts" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Threats */}
        <Card className="bg-slate-800/50 border-slate-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-400" />
              Recent Threats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {threats.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No threats detected</p>
            ) : (
              <div className="space-y-3">
                {threats.slice(0, 5).map((threat, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <div>
                        <p className="text-white font-medium">{threat.type}</p>
                        <p className="text-gray-400 text-sm">{threat.ip} - {threat.description}</p>
                      </div>
                    </div>
                    <Badge variant="destructive">{threat.severity}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
