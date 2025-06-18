import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Download, Calendar, TrendingUp, AlertTriangle, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ReportsPanelProps {
  logEntries: any[];
  stats: any;
  threats: any[];
}

const ReportsPanel: React.FC<ReportsPanelProps> = ({ logEntries, stats, threats }) => {
  const [reportPeriod, setReportPeriod] = useState('24h');
  const [reportType, setReportType] = useState('security');

  // Generate report data
  const generateSecurityReport = () => {
    const report = {
      period: reportPeriod,
      generatedAt: new Date().toISOString(),
      summary: {
        totalAttempts: stats.totalAttempts,
        failedAttempts: stats.failedAttempts,
        successRate: ((stats.successfulLogins / stats.totalAttempts) * 100).toFixed(1),
        uniqueIPs: stats.uniqueIPs,
        threatsDetected: threats.length
      },
      topThreats: threats.slice(0, 5),
      recommendations: []
    };

    // Generate recommendations
    if (stats.failedAttempts > stats.successfulLogins) {
      report.recommendations.push({
        type: 'HIGH',
        title: 'High Failed Login Rate',
        description: 'Consider implementing additional security measures such as fail2ban or rate limiting.'
      });
    }

    if (threats.filter(t => t.severity === 'HIGH').length > 0) {
      report.recommendations.push({
        type: 'CRITICAL',
        title: 'Critical Threats Detected',
        description: 'Immediate action required. Review and block suspicious IP addresses.'
      });
    }

    if (stats.uniqueIPs > 20) {
      report.recommendations.push({
        type: 'MEDIUM',
        title: 'High IP Diversity',
        description: 'Monitor for distributed attacks. Consider geographical restrictions if appropriate.'
      });
    }

    return report;
  };

  const report = generateSecurityReport();

  const exportReport = (format: string) => {
    const filename = `security_report_${new Date().toISOString().split('T')[0]}.${format}`;
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      downloadFile(blob, filename);
    } else if (format === 'csv') {
      const csv = [
        'Metric,Value',
        `Total Attempts,${report.summary.totalAttempts}`,
        `Failed Attempts,${report.summary.failedAttempts}`,
        `Success Rate,${report.summary.successRate}%`,
        `Unique IPs,${report.summary.uniqueIPs}`,
        `Threats Detected,${report.summary.threatsDetected}`,
        '',
        'Top Threats',
        'Type,IP,Severity,Description',
        ...report.topThreats.map(t => `${t.type},${t.ip},${t.severity},"${t.description}"`)
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      downloadFile(blob, filename);
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const threatDistribution = [
    { name: 'High', value: threats.filter(t => t.severity === 'HIGH').length, color: '#ef4444' },
    { name: 'Medium', value: threats.filter(t => t.severity === 'MEDIUM').length, color: '#f59e0b' },
    { name: 'Low', value: threats.filter(t => t.severity === 'LOW').length, color: '#3b82f6' }
  ];

  // Generate hourly activity data based on actual log entries
  const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
    // Count attempts and threats for each hour
    const hourAttempts = logEntries.filter(entry => {
      const entryHour = new Date(entry.timestamp).getHours();
      return entryHour === hour;
    });
    
    const hourThreats = threats.filter(threat => {
      const threatHour = new Date(threat.timestamp).getHours();
      return threatHour === hour;
    });
    
    return {
      hour,
      attempts: hourAttempts.length || 0,
      threats: hourThreats.length || 0
    };
  });

  const generateReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalAttempts: stats.totalAttempts,
        failedAttempts: stats.failedAttempts,
        successfulLogins: stats.successfulLogins,
        uniqueIPs: stats.uniqueIPs,
        threatsDetected: stats.threatsDetected
      },
      threats: threats,
      recentLogs: logEntries.slice(-10)
    };

    const reportContent = JSON.stringify(report, null, 2);
    const blob = new Blob([reportContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security_report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Security Report Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-gray-400 text-sm mb-2">Report Period</label>
              <select
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-gray-400 text-sm mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
              >
                <option value="security">Security Summary</option>
                <option value="detailed">Detailed Analysis</option>
                <option value="compliance">Compliance Report</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => exportReport('json')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
              <Button
                onClick={() => exportReport('csv')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Security Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Success Rate</span>
              <span className="text-green-400 font-bold">{report.summary.successRate}%</span>
            </div>
            <Progress value={parseFloat(report.summary.successRate)} className="h-2" />
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Attempts</span>
              <span className="text-white font-bold">{report.summary.totalAttempts}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Failed Attempts</span>
              <span className="text-red-400 font-bold">{report.summary.failedAttempts}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Unique IPs</span>
              <span className="text-blue-400 font-bold">{report.summary.uniqueIPs}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Threats Detected</span>
              <span className="text-yellow-400 font-bold">{report.summary.threatsDetected}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Threat Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={threatDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {threatDistribution.map((entry, index) => (
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
      </div>

      {/* Hourly Activity Chart */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">24-Hour Activity Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyActivity}>
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
              <Bar dataKey="attempts" fill="#3b82f6" name="Login Attempts" />
              <Bar dataKey="threats" fill="#ef4444" name="Threats" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {report.recommendations.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Shield className="h-12 w-12 mx-auto mb-4 text-green-400" />
                <p>No immediate security recommendations</p>
                <p className="text-sm">Your system appears to be well-protected</p>
              </div>
            ) : (
              <div className="space-y-4">
                {report.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="p-4 bg-slate-700/30 rounded-lg border-l-4 border-yellow-500"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-400" />
                          <h3 className="text-white font-medium">{rec.title}</h3>
                          <Badge variant={rec.type === 'CRITICAL' ? 'destructive' : 'secondary'}>
                            {rec.type}
                          </Badge>
                        </div>
                        <p className="text-gray-300 text-sm">{rec.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Top Threats Summary */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Top Security Threats</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[250px]">
            {report.topThreats.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No threats detected in this period
              </div>
            ) : (
              <div className="space-y-3">
                {report.topThreats.map((threat, index) => (
                  <div
                    key={threat.id}
                    className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-white font-medium">{threat.type}</span>
                        <Badge variant={threat.severity === 'HIGH' ? 'destructive' : 'secondary'}>
                          {threat.severity}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-sm">{threat.ip}</p>
                      <p className="text-gray-300 text-sm">{threat.description}</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Report Generation */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-400" />
            Security Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Attempts</span>
                    <span className="text-white font-mono">{stats.totalAttempts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Failed Attempts</span>
                    <span className="text-red-400 font-mono">{stats.failedAttempts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Successful Logins</span>
                    <span className="text-green-400 font-mono">{stats.successfulLogins}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Unique IPs</span>
                    <span className="text-purple-400 font-mono">{stats.uniqueIPs}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Threats Detected</span>
                    <span className="text-yellow-400 font-mono">{stats.threatsDetected}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Threat Overview</h3>
                {threats.length === 0 ? (
                  <p className="text-gray-400">No threats detected</p>
                ) : (
                  <div className="space-y-2">
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
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={generateReport}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download Report</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPanel;
