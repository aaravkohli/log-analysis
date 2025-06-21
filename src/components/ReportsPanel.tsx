import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Download, Calendar, TrendingUp, AlertTriangle, Shield } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsPanelProps {
  logEntries: any[];
  stats: any;
  threats: any[];
}

const GEMINI_API_KEY = import.meta.env.VITE_HUGGING_GEMINI_API_KEY;

// Helper: Generate report prompt template
const generateReportPrompt = ({
  reportType,
  timePeriod,
  logSample
}: {
  reportType: 'Security Summary' | 'Detailed Analysis' | 'Compliance Report';
  timePeriod: 'last 1 hour' | 'last 24 hours' | 'last 7 days';
  logSample: string;
}) => {
  return `
You are a cybersecurity analyst.

Generate a ${reportType} for the ${timePeriod} based on the following web server log data.

Log Sample:
${logSample}

The report should include:
${reportType === 'Security Summary' ? `
- Overall threat count and summary
- Most frequent IPs
- Top threat types
- Any suspicious patterns
- Actionable recommendations
` : reportType === 'Detailed Analysis' ? `
- IPs sorted by threat count
- Status code breakdown (200, 403, 404, 500)
- Suspicious POST/PUT requests
- Time series of threat activity
- Breakdown by country or method if available
` : `
- Any repeated failed login attempts
- Anomalies that violate expected compliance (e.g., 500 errors from unknown IPs)
- Requests from geo-blocked countries
- Compliance checklist notes
- Recommended mitigations and logging best practices
`}
Keep the tone formal and structured. Present as a professional cybersecurity report.
`;
};

const ReportsPanel = ({ logEntries, stats, threats }: ReportsPanelProps) => {
  const [reportPeriod, setReportPeriod] = useState('24h');
  const [reportType, setReportType] = useState('security');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper: Build prompt data
  const buildPromptData = () => {
    const timePeriodMap = {
      '1h': 'last 1 hour',
      '24h': 'last 24 hours', 
      '7d': 'last 7 days',
      '30d': 'last 30 days'
    };
    
    const reportTypeMap = {
      'security': 'Security Summary',
      'detailed': 'Detailed Analysis', 
      'compliance': 'Compliance Report'
    };

    const logSample = logEntries.slice(0, 20).map(entry => 
      `${entry.timestamp},${entry.ip},${entry.method || 'GET'},${entry.resource || '/'},${entry.status || 200},${entry.bytes || 0},"${entry.userAgent || 'Unknown'}"`
    ).join('\n');

    return {
      reportType: reportTypeMap[reportType] as 'Security Summary' | 'Detailed Analysis' | 'Compliance Report',
      timePeriod: timePeriodMap[reportPeriod] as 'last 1 hour' | 'last 24 hours' | 'last 7 days',
      logSample
    };
  };

  // Helper: Call Hugging Face API
  const callHuggingFace = async (promptData) => {
    setError('');
    setLoading(true);
    try {
      const prompt = generateReportPrompt(promptData);
      const response = await fetch("https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: prompt })
      });
      
      if (!response.ok) throw new Error('Hugging Face API error');
      const data = await response.json();
      
      // Hugging Face returns an array with the generated text
      const generatedText = Array.isArray(data) ? data[0]?.generated_text || data[0] : data.generated_text || data[0];
      
      // Convert the generated text to a structured report format
      const report = {
        title: `${promptData.reportType} Report`,
        generatedAt: new Date().toISOString(),
        period: promptData.timePeriod,
        content: generatedText,
        sections: [
          {
            header: 'Executive Summary',
            text: generatedText
          }
        ],
        recommendations: [
          'Review and block suspicious IP addresses',
          'Monitor for unusual traffic patterns',
          'Implement rate limiting on sensitive endpoints',
          'Regular security audits and log analysis'
        ]
      };
      
      setLoading(false);
      return report;
    } catch (e) {
      setLoading(false);
      setError('Failed to generate report: ' + (e.message || e));
      return null;
    }
  };

  // Helper: Build PDF from report
  const buildPDF = (report) => {
    try {
      const doc = new jsPDF();
      let y = 20;
      doc.setFontSize(18);
      doc.text(report.title || 'Security Report', 14, y);
      y += 10;
      doc.setFontSize(12);
      if (report.generatedAt) {
        doc.text('Generated: ' + new Date(report.generatedAt).toLocaleString(), 14, y);
        y += 8;
      }
      if (report.period) {
        doc.text('Period: ' + report.period, 14, y);
        y += 8;
      }
      
      // Content sections
      if (report.sections) {
        report.sections.forEach(section => {
          y += 8;
          doc.setFontSize(14);
          doc.text(section.header, 14, y);
          y += 6;
          doc.setFontSize(11);
          if (section.text) {
            const lines = doc.splitTextToSize(section.text, 180);
            doc.text(lines, 14, y);
            y += (lines.length * 6) + 4;
          }
          if (section.table) {
            autoTable(doc, {
              startY: y,
              head: [section.table.headers],
              body: section.table.rows,
              theme: 'grid',
              headStyles: { fillColor: [55, 65, 81], textColor: 255 },
              bodyStyles: { textColor: 50 },
              styles: { fontSize: 10 },
            });
            y = (doc as any).lastAutoTable.finalY + 4;
          }
        });
      }
      
      // Recommendations
      if (report.recommendations && report.recommendations.length > 0) {
        y += 8;
        doc.setFontSize(14);
        doc.text('Recommendations', 14, y);
        y += 6;
        doc.setFontSize(11);
        report.recommendations.forEach(rec => {
          doc.text('- ' + rec, 14, y);
          y += 6;
        });
      }
      
      doc.save('security_report.pdf');
    } catch (e) {
      setError('Failed to build PDF: ' + (e.message || e));
    }
  };

  // Main handler
  const handleGeneratePDF = async () => {
    setError('');
    setLoading(true);
    const promptData = buildPromptData();
    const report = await callHuggingFace(promptData);
    if (report) buildPDF(report);
    setLoading(false);
  };

  const threatDistribution = [
    { name: 'High', value: threats.filter(t => t.severity === 'HIGH').length, color: '#ef4444' },
    { name: 'Medium', value: threats.filter(t => t.severity === 'MEDIUM').length, color: '#f59e0b' },
    { name: 'Low', value: threats.filter(t => t.severity === 'LOW').length, color: '#3b82f6' }
  ];

  // Generate hourly activity from real logEntries
  const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    attempts: 0,
    threats: 0
  }));
  logEntries.forEach(entry => {
    const date = new Date(entry.timestamp);
    if (!isNaN(date.getTime())) {
      const hour = date.getHours();
      hourlyActivity[hour].attempts++;
      // Optionally, count threats if entry is a threat
    }
  });

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
                <option value="security">Summary</option>
                <option value="detailed">Detailed Analysis</option>
                <option value="compliance">Compliance Report</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleGeneratePDF}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate PDF'}
              </Button>
            </div>
          </div>
          {error && <div className="text-red-400 mt-4">{error}</div>}
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
              <span className="text-green-400 font-bold">{stats.successRate}%</span>
            </div>
            <Progress value={parseFloat(stats.successRate)} className="h-2" />
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Attempts</span>
              <span className="text-white font-bold">{stats.totalAttempts}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Failed Attempts</span>
              <span className="text-red-400 font-bold">{stats.failedAttempts}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Unique IPs</span>
              <span className="text-blue-400 font-bold">{stats.uniqueIPs}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Threats Detected</span>
              <span className="text-yellow-400 font-bold">{threats.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Threat Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {threats.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-white">All Clear</p>
                <p className="text-slate-300">No threats detected</p>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hourly Activity Chart */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">24-Hour Activity Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {logEntries.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-white">All Clear</p>
              <p className="text-slate-300">No authentication attempts recorded</p>
            </div>
          ) : (
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
          )}
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
            {threats.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Shield className="h-12 w-12 mx-auto mb-4 text-green-400" />
                <p>No immediate security recommendations</p>
                <p className="text-sm">Your system appears to be well-protected</p>
              </div>
            ) : (
              <div className="space-y-4">
                {threats.map((threat, index) => (
                  <div
                    key={threat.id}
                    className="p-4 bg-slate-700/30 rounded-lg border-l-4 border-yellow-500"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-400" />
                          <h3 className="text-white font-medium">{threat.type}</h3>
                          <Badge variant={threat.severity === 'HIGH' ? 'destructive' : 'secondary'}>
                            {threat.severity}
                          </Badge>
                        </div>
                        <p className="text-gray-300 text-sm">{threat.description}</p>
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
            {threats.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No threats detected in this period
              </div>
            ) : (
              <div className="space-y-3">
                {threats.map((threat, index) => (
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
    </div>
  );
};

export default ReportsPanel;
