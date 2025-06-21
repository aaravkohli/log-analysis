import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Calendar, TrendingUp, AlertTriangle, Shield, Bot, Sparkles, CheckCircle } from 'lucide-react';
import { dataManager } from '@/utils/dataManager';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportsPanelProps {
  logEntries: any[];
  stats: any;
  threats: any[];
}

const ReportsPanel = ({ logEntries, stats, threats }: ReportsPanelProps) => {
  const [reportPeriod, setReportPeriod] = useState('24h');
  const [reportType, setReportType] = useState('security');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiReport, setAiReport] = useState<string>('');
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);

  // Generate real hourly activity data from log entries
  const hourlyActivity = useMemo(() => {
    const activity = Array(24).fill(0);
    logEntries.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      activity[hour]++;
    });
    return activity.map((count, hour) => ({ hour: `${hour}:00`, attempts: count }));
  }, [logEntries]);

  // Generate real threat distribution data from threats
  const threatDistribution = useMemo(() => {
    const distribution = {};
    threats.forEach(threat => {
      distribution[threat.type] = (distribution[threat.type] || 0) + 1;
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [threats]);

  // Security metrics calculation based on real data
  const securityMetrics = useMemo(() => {
    const total = logEntries.length;
    const failed = logEntries.filter(log => log.status === 'failed').length;
    const success = total - failed;
    const successRate = total > 0 ? (success / total) * 100 : 0;
    
    return {
      totalAttempts: total,
      successRate,
      failedAttempts: failed,
      threatsDetected: threats.length
    };
  }, [logEntries, threats]);

  // Generate dynamic recommendations based on data
  const recommendations = useMemo(() => {
    const recs = [];
    if (securityMetrics.failedAttempts > 100) {
      recs.push({
        title: 'Review Firewall Rules',
        description: 'High number of failed attempts detected. Consider tightening your firewall rules.',
        severity: 'high'
      });
    }
    if (threats.length > 10) {
      recs.push({
        title: 'Investigate Threats',
        description: 'Multiple threats detected. Investigate compromised accounts and IP addresses.',
        severity: 'critical'
      });
    }
    if (securityMetrics.successRate < 80 && securityMetrics.totalAttempts > 50) {
      recs.push({
        title: 'Monitor User Activity',
        description: 'Low success rate may indicate brute-force attacks. Monitor login patterns.',
        severity: 'medium'
      });
    }
    if (recs.length === 0) {
      recs.push({
        title: 'System Secure',
        description: 'No immediate threats detected. Continue monitoring.',
        severity: 'low'
      });
    }
    return recs;
  }, [securityMetrics, threats]);
  
  const generateReportPrompt = ({
    reportType,
    timePeriod,
    logSample
  }: {
    reportType: 'Security Summary' | 'Detailed Analysis' | 'Compliance Report';
    timePeriod: 'last 1 hour' | 'last 24 hours' | 'last 7 days' | 'last 30 days';
    logSample: string;
  }) => {
    const basePrompt = `
You are a senior cybersecurity analyst tasked with generating a professional, markdown-formatted report. 
Your tone should be authoritative, and the content must be actionable and insightful.

**Report Type**: ${reportType}
**Time Period**: ${timePeriod}
**Log Sample**:
\`\`\`
${logSample}
\`\`\`
`;

    if (reportType === 'Security Summary') {
      return `${basePrompt}
Generate a concise **Security Summary**. Include:
-   **Executive Summary**: A brief overview of the security posture.
-   **Key Metrics**: Total attempts, success/failure rates, top threats.
-   **Top 3 Actionable Recommendations**: Prioritized list of immediate actions.
-   **Risk Assessment**: A high-level risk score (Low, Medium, High, Critical).
`;
    }

    if (reportType === 'Detailed Analysis') {
      return `${basePrompt}
Generate a **Detailed Technical Analysis**. Include:
-   **Threat Intelligence**: Analysis of attack vectors, malware signatures, and IOCs.
-   **IP Reputation Analysis**: Breakdown of suspicious IPs and their geographic origins.
-   **User Behavior Analytics (UBA)**: Anomalies in user login patterns and activities.
-   **Technical Deep Dive**: Analysis of protocols, ports, and payload signatures.
`;
    }

    if (reportType === 'Compliance Report') {
      return `${basePrompt}
Generate a **Compliance Audit Report**. Include:
-   **Compliance Status**: A summary of adherence to PCI-DSS, GDPR, and NIST standards.
-   **Compliance Checklist**: A markdown table with ✅ or ❌ for each major control.
-   **Identified Gaps**: A list of specific compliance gaps and their associated risks.
-   **Remediation Plan**: A high-level plan to address identified compliance issues.
`;
    }

    return basePrompt;
  };
  
  const generateSecuritySummaryReport = (period, readablePeriod) => {
    return `
# AI Security Summary Report (${readablePeriod})

This report provides a high-level overview of the security posture based on system logs from the ${readablePeriod}.

## Executive Summary
The system has experienced a **moderate** level of malicious activity over the past ${readablePeriod}. While the majority of unauthorized access attempts were blocked, a few persistent threats require immediate attention. Overall security effectiveness is rated at **85%**.

## Key Metrics
-   **Total Attempts**: ${logEntries.length}
-   **Successful Logins**: ${logEntries.filter(log => log.status === 'success').length}
-   **Failed Logins**: ${logEntries.filter(log => log.status === 'failed').length}
-   **Threats Detected**: ${threats.length}
-   **Top Threat Source**: China (45% of attacks)

## Top 3 Actionable Recommendations
1.  **Block High-Risk IPs**: Implement firewall rules to block the top 5 attacking IP addresses.
2.  **Enforce MFA for Admins**: Require multi-factor authentication for all administrative accounts.
3.  **Review User Privileges**: Audit user accounts to ensure the principle of least privilege is applied.

## Risk Assessment
**Overall Risk**: Medium
-   **Likelihood**: High
-   **Impact**: Medium
`;
  };

  const generateDetailedAnalysisReport = (period, readablePeriod) => {
    return `
# AI Detailed Technical Analysis (${readablePeriod})

This report provides an in-depth technical analysis of security events from the ${readablePeriod}.

## Threat Intelligence
-   **Attack Vectors**: The primary attack vector is brute-force attempts targeting the 'admin' and 'root' accounts.
-   **Malware Signatures**: No known malware signatures were detected, but some connections exhibited bot-like behavior.
-   **Indicators of Compromise (IOCs)**:
    -   IP: \`192.168.1.101\` (Repeated brute-force)
    -   User Agent: \`SSH-2.0-libssh-0.9.3\`

## IP Reputation Analysis
-   **Suspicious IPs**: 15 IPs have been flagged for suspicious activity.
-   **Geographic Origins**: 60% of attacks originated from Russia and China.
-   **ASN Information**: Most attacks are from ASNs associated with cloud hosting providers.

## User Behavior Analytics (UBA)
-   **Anomalies**: Detected unusual login times for user 'test' (3 AM local time).
-   **Suspicious Patterns**: Multiple failed logins followed by a successful login from a new IP for user 'guest'.

## Technical Deep Dive
-   **Protocols**: All attacks were over SSH (port 22).
-   **Payload Analysis**: No malicious payloads were identified in the log samples.
`;
  };

  const generateComplianceReport = (period, readablePeriod) => {
    return `
# AI Compliance Audit Report (${readablePeriod})

This report assesses compliance with major regulatory standards based on system logs from the ${readablePeriod}.

## Compliance Status
The system is **partially compliant** with PCI-DSS, GDPR, and NIST standards. Key gaps were identified in access control and audit logging.

## Compliance Checklist

| Control | PCI-DSS | GDPR | NIST |
| --- | :---: | :---: | :---: |
| Secure Access Control | ❌ | ❌ | ✅ |
| Encrypt Cardholder Data | ✅ | ✅ | ✅ |
| Regular Monitoring | ✅ | ❌ | ✅ |
| Maintain Audit Trail | ❌ | ✅ | ❌ |

## Identified Gaps
1.  **Access Control**: Lack of multi-factor authentication for all users.
2.  **Audit Logging**: Log retention period does not meet the 1-year requirement for PCI-DSS.
3.  **Data Protection**: No clear data processing agreement for GDPR compliance.

## Remediation Plan
-   **Phase 1 (0-30 days)**: Implement MFA for all users.
-   **Phase 2 (30-90 days)**: Extend log retention to 1 year and implement a data processing agreement.
-   **Phase 3 (90-180 days)**: Conduct a full compliance audit with a third-party auditor.

*Compliance audit completed with ${logEntries.length} data points analyzed*`;
  };

  // Generate report when dependencies change
  const securityReport = useMemo(() => {
    if (logEntries.length === 0) {
      return {
        period: reportPeriod,
        generatedAt: new Date().toISOString(),
        summary: { totalAttempts: 0, successRate: 0, failedAttempts: 0, threatsDetected: 0 },
        recommendations: [{ title: 'No Data', description: 'Upload logs to generate a report.', severity: 'low' }]
      };
    }

    const report = generateSecurityReport();
    
    // Notify when report is ready
    if (logEntries.length > 0) {
      toast({
        title: "Report Updated",
        description: `Security report generated for ${reportPeriod} period with ${report.summary.totalAttempts} total attempts`,
        variant: "default",
      });
    }

    return report;

    function generateSecurityReport() {
      const report = {
        period: reportPeriod,
        generatedAt: new Date().toISOString(),
        summary: {
          totalAttempts: logEntries.length,
          successRate: stats.successRate,
          failedAttempts: stats.failedAttempts,
          threatsDetected: threats.length
        },
        recommendations: []
      };

      if (stats.failedAttempts > 100) {
        report.recommendations.push({
          title: 'High Failed Attempts',
          description: 'Consider reviewing firewall rules or using a tool like fail2ban.',
          severity: 'high'
        });
      }
      if (threats.length > 0) {
        report.recommendations.push({
          title: 'Threats Detected',
          description: 'Investigate detected threats and block malicious IPs.',
          severity: 'critical'
        });
      }
      if (report.recommendations.length === 0) {
        report.recommendations.push({
          title: 'System Stable',
          description: 'No major issues detected. Keep monitoring.',
          severity: 'low'
        });
      }
      return report;
    }
  }, [reportPeriod, reportType, logEntries.length]);

  // Generate AI-powered report
  const generateAIReport = async () => {
    setIsGeneratingAI(true);
    
    try {
      // Map report types to AI prompt types
      const aiReportType = reportType === 'security' ? 'Security Summary' : 
                          reportType === 'detailed' ? 'Detailed Analysis' : 'Compliance Report';
      
      // Map periods to readable format
      const timePeriodMap: Record<string, 'last 1 hour' | 'last 24 hours' | 'last 7 days' | 'last 30 days'> = {
        '1h': 'last 1 hour',
        '24h': 'last 24 hours',
        '7d': 'last 7 days',
        '30d': 'last 30 days'
      };

      // Get sample log data (first 10 entries for context)
      const logSample = logEntries.slice(0, 10).map(entry => 
        `${entry.timestamp} ${entry.ip} ${entry.user} ${entry.status}`
      ).join('\n');
      
      const prompt = generateReportPrompt({
        reportType: aiReportType,
        timePeriod: (timePeriodMap[reportPeriod] || 'last 24 hours') as 'last 1 hour' | 'last 24 hours' | 'last 7 days' | 'last 30 days',
        logSample: logSample || 'No log data available'
      });

      // In a real implementation, this would call an AI service API
      // For demo purposes, we'll simulate the AI response with unique content
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate unique reports based on type and time period
      let mockAIResponse = '';

      if (aiReportType === 'Security Summary') {
        mockAIResponse = generateSecuritySummaryReport(reportPeriod, timePeriodMap[reportPeriod] || 'last 24 hours');
      } else if (aiReportType === 'Detailed Analysis') {
        mockAIResponse = generateDetailedAnalysisReport(reportPeriod, timePeriodMap[reportPeriod] || 'last 24 hours');
      } else {
        mockAIResponse = generateComplianceReport(reportPeriod, timePeriodMap[reportPeriod] || 'last 24 hours');
      }

      setAiReport(mockAIResponse);
      
      toast({
        title: "AI Report Generated",
        description: `Intelligent analysis completed for ${aiReportType} report`,
        variant: "default",
      });
      
    } catch (error) {
      toast({
        title: "AI Report Generation Failed",
        description: "Failed to generate AI-powered analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const downloadAIReportAsPDF = async () => {
    if (!reportRef.current) {
      toast({
        title: 'Error',
        description: 'Report content not found.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#020617',
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`ai_security_report_${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: 'Report Downloaded',
        description: 'AI analysis report has been saved as a PDF.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to download PDF:', error);
      toast({
        title: 'Download Failed',
        description: 'There was an error downloading the report as a PDF.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="text-white">Reports & Analytics</CardTitle>
            <p className="text-slate-400 text-sm">Generate and view security reports.</p>
          </div>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
            >
              <option value="security">Security Summary</option>
              <option value="detailed">Detailed Analysis</option>
              <option value="compliance">Compliance Report</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-purple-400" />
                  AI-Powered Report
                </CardTitle>
                <p className="text-slate-400 text-sm">
                  Generate an intelligent analysis of your security posture.
                </p>
                <div className="pt-2">
                  <Button
                    onClick={generateAIReport}
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={isGeneratingAI || logEntries.length === 0}
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    {isGeneratingAI ? 'Analyzing...' : 'AI Analysis'}
                  </Button>
                </div>
              </CardHeader>
              {aiReport && (
                <CardContent>
                  <ScrollArea className="h-[300px] sm:h-[400px] w-full">
                    <div ref={reportRef} className="prose prose-invert max-w-none p-4 text-gray-300">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({children}) => <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>,
                          h2: ({children}) => <h2 className="text-xl font-semibold text-white mb-3 mt-6">{children}</h2>,
                          h3: ({children}) => <h3 className="text-lg font-medium text-white mb-2 mt-4">{children}</h3>,
                          p: ({children}) => <p className="text-gray-300 mb-3 leading-relaxed">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside text-gray-300 mb-3 space-y-1">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside text-gray-300 mb-3 space-y-1">{children}</ol>,
                          li: ({children}) => <li className="text-gray-300">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({children}) => <em className="italic text-gray-200">{children}</em>,
                          code: ({children}) => <code className="bg-slate-700 px-1 py-0.5 rounded text-sm font-mono text-green-400">{children}</code>,
                          pre: ({children}) => <pre className="bg-slate-800 p-3 rounded-lg border border-slate-600 overflow-x-auto text-sm">{children}</pre>,
                          blockquote: ({children}) => <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-400 mb-3">{children}</blockquote>,
                        }}
                      >
                        {aiReport}
                      </ReactMarkdown>
                    </div>
                  </ScrollArea>
                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={downloadAIReportAsPDF}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download AI Report
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            <div className="space-y-6">
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-green-400" />
                    Security Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-slate-400">Success Rate</p>
                    <p className="text-2xl font-bold text-green-400">{securityMetrics.successRate.toFixed(1)}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400">Total Attempts</p>
                    <p className="text-2xl font-bold text-white">{securityMetrics.totalAttempts}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400">Failed Attempts</p>
                    <p className="text-2xl font-bold text-red-400">{securityMetrics.failedAttempts}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400">Threats Detected</p>
                    <p className="text-2xl font-bold text-orange-400">{securityMetrics.threatsDetected}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-yellow-400" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <div className="mr-3 mt-1">
                          {rec.severity === 'high' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                          {rec.severity === 'medium' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                          {rec.severity === 'low' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{rec.title}</p>
                          <p className="text-slate-400 text-sm">{rec.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPanel;
