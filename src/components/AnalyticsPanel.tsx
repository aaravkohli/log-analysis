import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Calendar, AlertTriangle, BarChart3, Activity, Clock, Download, Filter, Globe, Shield } from 'lucide-react';
import { historicalDataManager, type HistoricalDataPoint } from '@/utils/historicalData';
import { exportManager } from '@/utils/exportUtils';
import LogSearchPanel from '@/components/LogSearchPanel';
import GeoVisualization from '@/components/GeoVisualization';

interface AnalyticsPanelProps {
  stats: any;
  threats: any[];
  logEntries: any[];
}

const chartConfig = {
  totalAttempts: {
    label: "Total Attempts",
    color: "hsl(var(--chart-1))",
  },
  failedAttempts: {
    label: "Failed Attempts", 
    color: "hsl(var(--chart-2))",
  },
  successfulLogins: {
    label: "Successful Logins",
    color: "hsl(var(--chart-3))",
  },
  threatsDetected: {
    label: "Threats Detected",
    color: "hsl(var(--chart-4))",
  },
};

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ stats, threats, logEntries }) => {
  const [timePeriod, setTimePeriod] = useState('24h');
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [baseline, setBaseline] = useState({ avgAttempts: 0, peakThreshold: 0 });
  const [peakAlert, setPeakAlert] = useState(false);
  const [activeView, setActiveView] = useState<'charts' | 'search' | 'geo'>('charts');

  useEffect(() => {
    loadAnalyticsData();
    const interval = setInterval(loadAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const currentAttempts = stats.totalAttempts;
    if (currentAttempts > baseline.peakThreshold && baseline.peakThreshold > 0) {
      setPeakAlert(true);
      setTimeout(() => setPeakAlert(false), 10000);
    }
  }, [stats.totalAttempts, baseline.peakThreshold]);

  const loadAnalyticsData = () => {
    const data = historicalDataManager.getHistoricalData();
    const baselineData = historicalDataManager.getBaselineData();
    setHistoricalData(data);
    setBaseline(baselineData);
  };

  const getFilteredData = () => {
    const now = new Date();
    const cutoff = new Date();
    
    switch (timePeriod) {
      case '1h':
        cutoff.setHours(now.getHours() - 1);
        break;
      case '24h':
        cutoff.setHours(now.getHours() - 24);
        break;
      case '7d':
        cutoff.setDate(now.getDate() - 7);
        break;
      default:
        cutoff.setHours(now.getHours() - 24);
    }

    return historicalData.filter(d => new Date(d.timestamp) >= cutoff).map(d => ({
      ...d,
      time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
  };

  const handleExport = (format: 'csv' | 'json') => {
    const report = exportManager.generateReport(stats, threats, logEntries);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    
    if (format === 'csv') {
      exportManager.exportToCSV([report.summary], `ssh-report-${timestamp}`);
    } else {
      exportManager.exportToJSON(report, `ssh-report-${timestamp}`);
    }
  };

  const filteredData = getFilteredData();
  const successRate = stats.totalAttempts > 0 ? ((stats.successfulLogins / stats.totalAttempts) * 100).toFixed(1) : '0';
  const threatRate = stats.totalAttempts > 0 ? ((threats.length / stats.totalAttempts) * 100).toFixed(1) : '0';

  const pieData = [
    { name: 'Failed', value: stats.failedAttempts, fill: '#ef4444' },
    { name: 'Success', value: stats.successfulLogins, fill: '#22c55e' },
  ];

  // Process data for hourly distribution
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const hourAttempts = logEntries.filter(entry => {
      const entryHour = new Date(entry.timestamp).getHours();
      return entryHour === hour;
    });
    
    return {
      hour: `${hour}:00`,
      attempts: hourAttempts.length,
      failed: hourAttempts.filter(entry => entry.status === 'failed').length,
      success: hourAttempts.filter(entry => entry.status === 'success').length
    };
  });

  // Process data for threat detection
  const threatData = threats.reduce((acc: any[], threat) => {
    const existingThreat = acc.find(t => t.type === threat.type);
    if (existingThreat) {
      existingThreat.count++;
    } else {
      acc.push({ type: threat.type, count: 1 });
    }
    return acc;
  }, []);

  // Process data for activity timeline (group by 6-hour bucket, including unknown)
  const timelineBuckets: Record<string, { success: number; failed: number; unknown: number }> = {};
  logEntries.forEach(entry => {
    const date = new Date(entry.timestamp);
    const hour = date.getHours();
    const bucketStart = Math.floor(hour / 6) * 6;
    const bucketEnd = bucketStart + 6;
    const bucketLabel = `${bucketStart.toString().padStart(2, '0')}:00-${bucketEnd.toString().padStart(2, '0')}:00`;
    if (!timelineBuckets[bucketLabel]) timelineBuckets[bucketLabel] = { success: 0, failed: 0, unknown: 0 };
    if (entry.status === 'success') timelineBuckets[bucketLabel].success++;
    else if (entry.status === 'failed') timelineBuckets[bucketLabel].failed++;
    else timelineBuckets[bucketLabel].unknown++;
  });
  const timelineData = Object.entries(timelineBuckets).map(([time, counts]) => ({
    time,
    ...counts
    }));

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {peakAlert && (
        <Alert className="border-orange-500 bg-orange-500/10">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-300">
            <strong>Peak Activity Detected!</strong> Current attempts ({stats.totalAttempts}) exceed baseline ({baseline.peakThreshold.toFixed(0)})
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-black">
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-base sm:text-lg">Advanced Analytics</span>
            </div>
            <div className="flex gap-1 sm:gap-2 w-full sm:w-auto overflow-x-auto">
              <Button
                variant={activeView === 'charts' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('charts')}
                className="text-xs whitespace-nowrap flex-shrink-0"
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                Charts
              </Button>
              <Button
                variant={activeView === 'search' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('search')}
                className="text-xs whitespace-nowrap flex-shrink-0"
              >
                <Filter className="h-3 w-3 mr-1" />
                Search
              </Button>
              <Button
                variant={activeView === 'geo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('geo')}
                className="text-xs whitespace-nowrap flex-shrink-0"
              >
                <Globe className="h-3 w-3 mr-1" />
                Geo
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-gray-400 text-sm mb-2">Time Period</label>
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white text-sm"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={() => handleExport('csv')}
                className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-initial"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                onClick={() => handleExport('json')}
                className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-initial"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-400 text-xs sm:text-sm truncate">Success Rate</p>
                <p className="text-lg sm:text-2xl font-bold text-green-400">{successRate}%</p>
                <p className="text-xs text-gray-500 hidden sm:block">Target: &gt;95%</p>
              </div>
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-green-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-400 text-xs sm:text-sm truncate">Threat Rate</p>
                <p className="text-lg sm:text-2xl font-bold text-red-400">{threatRate}%</p>
                <p className="text-xs text-gray-500 hidden sm:block">Target: &lt;5%</p>
              </div>
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-400 text-xs sm:text-sm truncate">Avg. Daily</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-400">{baseline.avgAttempts.toFixed(0)}</p>
                <p className="text-xs text-gray-500 hidden sm:block">Baseline</p>
              </div>
              <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-400 text-xs sm:text-sm truncate">Peak Alert</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-400">{baseline.peakThreshold.toFixed(0)}</p>
                <p className="text-xs text-gray-500 hidden sm:block">Threshold</p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-orange-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {activeView === 'charts' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            <Card className="bg-slate-800/50 border-slate-700 min-w-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base sm:text-lg">Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fill: '#9ca3af' }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fill: '#9ca3af' }} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          color: '#fff'
                        }}
                      />
                      <Area type="monotone" dataKey="success" stackId="1" stroke="#22c55e" fill="#22c55e" name="Success" />
                      <Area type="monotone" dataKey="failed" stackId="1" stroke="#ef4444" fill="#ef4444" name="Failed" />
                      <Area type="monotone" dataKey="unknown" stackId="1" stroke="#facc15" fill="#facc15" name="Unknown" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 min-w-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base sm:text-lg">Success vs Failure</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="w-full h-[250px] sm:h-[300px]">
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <Pie
                        dataKey="value"
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius="80%"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 min-w-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base sm:text-lg">Threat Detection</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={threatData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="type" 
                        tick={{ fill: '#9ca3af' }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fill: '#9ca3af' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          color: '#fff'
                        }}
                      />
                      <Bar dataKey="count" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 min-w-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base sm:text-lg">Hourly Distribution</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="hour" 
                        tick={{ fill: '#9ca3af' }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fill: '#9ca3af' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          color: '#fff'
                        }}
                      />
                      <Bar dataKey="attempts" fill="#3b82f6" name="Total Attempts" />
                      <Bar dataKey="failed" fill="#ef4444" name="Failed Attempts" />
                      <Bar dataKey="success" fill="#22c55e" name="Successful Logins" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeView === 'search' && (
        <LogSearchPanel logEntries={logEntries} />
      )}

      {activeView === 'geo' && (
        <GeoVisualization logEntries={logEntries} />
      )}
    </div>
  );
};

export default AnalyticsPanel;
