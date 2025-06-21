import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Download, Calendar, TrendingUp, AlertTriangle, Shield, Bot, Sparkles } from 'lucide-react';
import { dataManager } from '@/utils/dataManager';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ReportsPanelProps {
  logEntries: any[];
  stats: any;
  threats: any[];
}

// Helper: Generate enhanced report prompt template
const generateReportPrompt = ({
  reportType,
  timePeriod,
  logSample
}: {
  reportType: 'Security Summary' | 'Detailed Analysis' | 'Compliance Report';
  timePeriod: 'last 1 hour' | 'last 24 hours' | 'last 7 days' | 'last 30 days';
  logSample: string;
}) => {
  const header = `You are an experienced cybersecurity analyst.`;

  const context = `Generate a **${reportType}** for the **${timePeriod}** using the provided web server log data.`;

  const expectations = {
    'Security Summary': `
Your task:
- Provide an executive overview of the security posture
- Summarize total threats detected and success/failure ratios
- Highlight the most frequent IPs and threat categories
- Mention any suspicious or abnormal behavior patterns
- List top 3 actionable recommendations to improve security
`,

    'Detailed Analysis': `
Your task:
- List IPs involved, sorted by number of threat hits
- Break down all HTTP status codes (e.g., 200, 403, 404, 500)
- Identify all suspicious POST or PUT request patterns
- Show threat distribution by hour (time series)
- Mention any regional or method-based patterns if detectable
`,

    'Compliance Report': `
Your task:
- Detect repeated login failures and possible brute-force attempts
- List traffic from geo-blocked or unauthorized countries
- Mention violations of known compliance requirements (e.g., 500 errors, unencrypted data)
- Suggest improvements to maintain or achieve compliance standards
- Include a checklist-style format for key audit items
`
  };

  const formattingNote = `Ensure the tone is **formal**, the structure is **clear**, and the format mimics a **professional cybersecurity audit report**. Use headings, bullet points, and concise analysis.`

  return `
${header}

${context}

Below is a sample of the log data:
\`\`\`log
${logSample}
\`\`\`

${expectations[reportType]}

${formattingNote}
`;
};

const ReportsPanel = ({ logEntries, stats, threats }: ReportsPanelProps) => {
  const [reportPeriod, setReportPeriod] = useState('24h');
  const [reportType, setReportType] = useState('security');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiReport, setAiReport] = useState<string>('');
  const { toast } = useToast();

  // Generate real hourly activity data from log entries
  const hourlyActivity = useMemo(() => {
    const now = new Date();
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hourStart = new Date(now);
      hourStart.setHours(now.getHours() - (23 - i), 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hourStart.getHours() + 1);
      
      const attempts = logEntries.filter(entry => {
        const entryTime = new Date(entry.timestamp);
        return entryTime >= hourStart && entryTime < hourEnd;
      }).length;
      
      const threatsInHour = threats.filter(threat => {
        const threatTime = new Date(threat.timestamp || threat.detectedAt || now);
        return threatTime >= hourStart && threatTime < hourEnd;
      }).length;
      
      return {
        hour: i,
        attempts,
        threats: threatsInHour
      };
    });
    
    return hours;
  }, [logEntries, threats]);

  // Generate real threat distribution data
  const threatDistribution = useMemo(() => [
    { name: 'High', value: threats.filter(t => t.severity === 'HIGH').length, color: '#ef4444' },
    { name: 'Medium', value: threats.filter(t => t.severity === 'MEDIUM').length, color: '#f59e0b' },
    { name: 'Low', value: threats.filter(t => t.severity === 'LOW').length, color: '#3b82f6' }
  ], [threats]);

  // Generate report data using real stats
  const generateSecurityReport = () => {
    const report = {
      period: reportPeriod,
      generatedAt: new Date().toISOString(),
      summary: {
        totalAttempts: stats.totalAttempts,
        failedAttempts: stats.failedAttempts,
        successRate: stats.totalAttempts > 0 ? ((stats.successfulLogins / stats.totalAttempts) * 100).toFixed(1) : '0.0',
        uniqueIPs: stats.uniqueIPs,
        threatsDetected: threats.length
      },
      topThreats: threats.slice(0, 5),
      recommendations: []
    };

    // Generate recommendations based on real data
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

    // Add recommendation for low activity
    if (stats.totalAttempts < 10) {
      report.recommendations.push({
        type: 'LOW',
        title: 'Low Activity Detected',
        description: 'Consider expanding monitoring to include more comprehensive log sources.'
      });
    }

    return report;
  };

  const report = generateSecurityReport();

  // Notify when report is ready
  useEffect(() => {
    if (logEntries.length > 0) {
      toast({
        title: "Report Updated",
        description: `Security report generated for ${reportPeriod} period with ${report.summary.totalAttempts} total attempts`,
        variant: "default",
      });
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

  // Generate Security Summary Report
  const generateSecuritySummaryReport = (period: string, timePeriod: string) => {
    const isShortPeriod = period === '1h' || period === '24h';
    const totalThreats = threats.length;
    const highThreats = threats.filter(t => t.severity === 'HIGH').length;
    const successRate = stats.totalAttempts > 0 && stats.successfulLogins !== undefined ? 
      ((stats.successfulLogins / stats.totalAttempts) * 100) : 0;
    
    // Get top IPs by attempt count
    const ipCounts = logEntries.reduce((acc, entry) => {
      acc[entry.ip] = (acc[entry.ip] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topIPs = Object.entries(ipCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([ip, count]) => ({ ip, count }));

    return `# Security Summary Report
## Executive Overview
**Period Analyzed:** ${timePeriod}  
**Report Generated:** ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}

${isShortPeriod ? 
  `**Recent Activity Alert:** This report covers recent activity patterns and immediate security concerns.` :
  `**Trend Analysis:** This report identifies long-term patterns and emerging security trends.`
}

## Key Security Metrics
- **Total Login Attempts:** ${stats.totalAttempts.toLocaleString()}
- **Failed Attempts:** ${stats.failedAttempts.toLocaleString()}
- **Success Rate:** **${successRate.toFixed(1)}%** ${successRate < 50 ? '⚠️ **CRITICAL**' : successRate < 80 ? '⚠️ **WARNING**' : '✅ **GOOD**'}
- **Unique IP Addresses:** ${stats.uniqueIPs.toLocaleString()}
- **Threats Detected:** **${totalThreats}** ${totalThreats > 0 ? `(${highThreats} high-severity)` : ''}

## Top Security Concerns
${threats.length > 0 ? 
  threats.slice(0, 3).map((t, i) => 
    `${i + 1}. **${t.type}** - ${t.severity} severity from ${t.ip}\n   *${t.description}*`
  ).join('\n\n') : 
  '✅ **No immediate threats detected** - System appears secure'
}

## Most Active IP Addresses
${topIPs.map((ip, i) => 
  `${i + 1}. **${ip.ip}** - ${ip.count} attempts`
).join('\n')}

## Threat Distribution
- **High Severity:** ${threats.filter(t => t.severity === 'HIGH').length}
- **Medium Severity:** ${threats.filter(t => t.severity === 'MEDIUM').length}
- **Low Severity:** ${threats.filter(t => t.severity === 'LOW').length}

## Top 3 Security Recommendations
1. **${successRate < 80 ? 'Implement Rate Limiting' : 'Monitor Success Rate Trends'}**
   ${successRate < 80 ? 
     'Current success rate indicates potential brute force attacks. Implement IP-based rate limiting.' :
     'Continue monitoring for any sudden drops in success rate.'
   }

2. **${stats.uniqueIPs > 20 ? 'Geographic Access Control' : 'IP Diversity Monitoring'}**
   ${stats.uniqueIPs > 20 ? 
     'High IP diversity suggests distributed attacks. Consider geographic restrictions.' :
     'Monitor for unusual increases in unique IP addresses.'
   }

3. **${totalThreats > 0 ? 'Threat Response Protocol' : 'Proactive Monitoring'}**
   ${totalThreats > 0 ? 
     'Active threats detected. Review and update threat response procedures.' :
     'Maintain current monitoring levels and expand threat detection rules.'
   }

## Risk Assessment
**Overall Risk Level:** ${totalThreats > 5 || successRate < 50 ? '🔴 **HIGH**' : totalThreats > 0 || successRate < 80 ? '🟡 **MEDIUM**' : '🟢 **LOW**'}

${isShortPeriod ? 
  '**Short-term Focus:** Monitor for immediate response requirements and rapid threat escalation.' :
  '**Long-term Focus:** Analyze patterns for strategic security improvements and policy updates.'
}`;
  };

  // Generate Detailed Analysis Report
  const generateDetailedAnalysisReport = (period: string, timePeriod: string) => {
    const isShortPeriod = period === '1h' || period === '24h';
    const successRate = stats.totalAttempts > 0 ? ((stats.successfulLogins / stats.totalAttempts) * 100) : 0;
    
    // Analyze status codes
    const statusCodes = logEntries.reduce((acc, entry) => {
      const status = entry.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Analyze by hour for time-based patterns
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourStart = new Date();
      hourStart.setHours(hourStart.getHours() - (23 - hour), 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hourStart.getHours() + 1);
      
      const attempts = logEntries.filter(entry => {
        const entryTime = new Date(entry.timestamp);
        return entryTime >= hourStart && entryTime < hourEnd;
      });
      
      return {
        hour: hour,
        attempts: attempts.length,
        failed: attempts.filter(e => e.status === 'failed').length,
        threats: threats.filter(t => {
          const threatTime = new Date(t.timestamp || t.detectedAt || new Date());
          return threatTime >= hourStart && threatTime < hourEnd;
        }).length
      };
    });

    // Find peak activity hours
    const peakHours = hourlyData
      .filter(h => h.attempts > 0)
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 3);

    // Analyze geographic patterns
    const countryStats = logEntries.reduce((acc, entry) => {
      if (entry.country) {
        if (!acc[entry.country]) {
          acc[entry.country] = { total: 0, failed: 0, successful: 0 };
        }
        acc[entry.country].total++;
        if (entry.status === 'failed') {
          acc[entry.country].failed++;
        } else {
          acc[entry.country].successful++;
        }
      }
      return acc;
    }, {} as Record<string, { total: number; failed: number; successful: number }>);

    const suspiciousCountries = Object.entries(countryStats)
      .filter(([, stats]) => (stats as { failed: number; successful: number }).failed > (stats as { failed: number; successful: number }).successful * 2)
      .sort(([,a], [,b]) => (b as { failed: number }).failed - (a as { failed: number }).failed)
      .slice(0, 5);

    return `# Detailed Security Analysis Report
## Analysis Period
**Time Range:** ${timePeriod}  
**Total Entries Analyzed:** ${logEntries.length.toLocaleString()}  
**Analysis Depth:** ${isShortPeriod ? 'Real-time pattern detection' : 'Comprehensive trend analysis'}

## Status Code Distribution
${Object.entries(statusCodes).map(([status, count]) => 
  `- **${status.toUpperCase()}:** ${count.toLocaleString()} (${(((count as number) / logEntries.length) * 100).toFixed(1)}%)`
).join('\n')}

## Time-Based Activity Patterns
### Peak Activity Hours
${peakHours.map((hour, i) => 
  `${i + 1}. **Hour ${hour.hour}:00** - ${hour.attempts} attempts (${hour.failed} failed, ${hour.threats} threats)`
).join('\n')}

### Hourly Breakdown
${hourlyData.filter(h => h.attempts > 0).map(hour => 
  `**${hour.hour.toString().padStart(2, '0')}:00** - ${hour.attempts} total, ${hour.failed} failed, ${hour.threats} threats`
).join(' | ')}

## Geographic Analysis
### Suspicious Geographic Patterns
${suspiciousCountries.length > 0 ? 
  suspiciousCountries.map(([country, stats]) => 
    `- **${country}:** ${(stats as { total: number; failed: number }).total} attempts, ${(stats as { total: number; failed: number }).failed} failed (${(((stats as { total: number; failed: number }).failed / (stats as { total: number; failed: number }).total) * 100).toFixed(1)}% failure rate)`
  ).join('\n') :
  '✅ No suspicious geographic patterns detected'
}

### Country-by-Country Breakdown
${Object.entries(countryStats)
  .sort(([,a], [,b]) => (b as { total: number }).total - (a as { total: number }).total)
  .slice(0, 10)
  .map(([country, stats]) => 
    `- **${country}:** ${(stats as { total: number; successful: number; failed: number }).total} total, ${(stats as { total: number; successful: number; failed: number }).successful} successful, ${(stats as { total: number; successful: number; failed: number }).failed} failed`
  ).join('\n')}

## Threat Analysis
### Threat Severity Distribution
- **Critical Threats:** ${threats.filter(t => t.severity === 'HIGH').length}
- **Medium Threats:** ${threats.filter(t => t.severity === 'MEDIUM').length}
- **Low Threats:** ${threats.filter(t => t.severity === 'LOW').length}

### Detailed Threat Breakdown
${threats.length > 0 ? 
  threats.map((threat, i) => 
    `${i + 1}. **${threat.type}** (${threat.severity})\n   - IP: ${threat.ip}\n   - Description: ${threat.description}\n   - Timestamp: ${new Date(threat.timestamp || threat.detectedAt || new Date()).toLocaleString()}`
  ).join('\n\n') :
  'No threats detected in this period'
}

## Pattern Recognition
### Suspicious Patterns Identified
${(() => {
  const patterns = [];
  if (successRate < 50) patterns.push('**High failure rate** - Potential brute force attack');
  if (stats.uniqueIPs > 50) patterns.push('**IP diversity spike** - Possible distributed attack');
  if (peakHours.some(h => h.threats > 2)) patterns.push('**Threat clustering** - Multiple threats in short time windows');
  if (suspiciousCountries.length > 3) patterns.push('**Geographic anomaly** - Suspicious activity from multiple countries');
  
  return patterns.length > 0 ? 
    patterns.map(p => `- ${p}`).join('\n') : 
    '✅ No suspicious patterns detected';
})()}

## Technical Insights
### Performance Metrics
- **Average Attempts per Hour:** ${(logEntries.length / 24).toFixed(1)}
- **Peak Hour Load:** ${Math.max(...hourlyData.map(h => h.attempts))} attempts
- **Geographic Coverage:** ${Object.keys(countryStats).length} countries
- **Threat Detection Rate:** ${threats.length > 0 ? ((threats.length / logEntries.length) * 100).toFixed(3) : '0'}%

### Recommendations for Technical Teams
1. **${peakHours.length > 0 ? 'Peak Hour Monitoring' : 'Baseline Establishment'}**
   ${peakHours.length > 0 ? 
     `Focus monitoring on hours ${peakHours.map(h => h.hour).join(', ')} when activity peaks.` :
     'Establish baseline activity patterns for future comparison.'
   }

2. **${suspiciousCountries.length > 0 ? 'Geographic Blocking' : 'Geographic Monitoring'}**
   ${suspiciousCountries.length > 0 ? 
     `Consider blocking traffic from: ${suspiciousCountries.slice(0, 3).map(([country]) => country).join(', ')}` :
     'Continue monitoring geographic access patterns.'
   }

3. **${threats.length > 0 ? 'Threat Response Optimization' : 'Threat Detection Enhancement'}**
   ${threats.length > 0 ? 
     'Review and optimize threat response procedures based on detected patterns.' :
     'Consider expanding threat detection rules based on observed patterns.'
   }

## Data Quality Assessment
- **Log Completeness:** ${logEntries.length > 0 ? '✅ Good' : '❌ Poor'}
- **Geographic Data:** ${Object.keys(countryStats).length > 0 ? '✅ Available' : '❌ Missing'}
- **Threat Correlation:** ${threats.length > 0 ? '✅ Active' : '⚠️ Limited'}

*Detailed analysis completed with ${logEntries.length} data points across ${Object.keys(countryStats).length} geographic locations*`;
  };

  // Generate Compliance Report
  const generateComplianceReport = (period: string, timePeriod: string) => {
    const isShortPeriod = period === '1h' || period === '24h';
    const successRate = stats.totalAttempts > 0 ? ((stats.successfulLogins / stats.totalAttempts) * 100) : 0;
    
    // Compliance checks
    const complianceChecks = {
      failedLoginMonitoring: stats.failedAttempts > 0,
      geographicMonitoring: logEntries.some(e => e.country),
      threatDetection: threats.length > 0,
      successRateMonitoring: stats.totalAttempts > 0,
      uniqueIPTracking: stats.uniqueIPs > 0,
      highSeverityThreats: threats.filter(t => t.severity === 'HIGH').length > 0
    };

    // Identify compliance violations
    const violations = [];
    if (successRate < 50) violations.push('**Critical:** Success rate below 50% indicates potential security breach');
    if (stats.failedAttempts > stats.successfulLogins * 3) violations.push('**High:** Excessive failed login attempts detected');
    if (threats.filter(t => t.severity === 'HIGH').length > 5) violations.push('**High:** Multiple high-severity threats require immediate attention');
    if (stats.uniqueIPs > 100) violations.push('**Medium:** Unusually high IP diversity may indicate distributed attack');

    // Calculate risk scores
    const riskScore = Math.min(100, 
      (violations.filter(v => v.includes('Critical')).length * 30) +
      (violations.filter(v => v.includes('High')).length * 20) +
      (violations.filter(v => v.includes('Medium')).length * 10) +
      (threats.length * 5) +
      (successRate < 80 ? 15 : 0)
    );

    // Identify repeat offenders
    const ipAttempts = logEntries.reduce((acc, entry) => {
      if (!acc[entry.ip]) {
        acc[entry.ip] = { total: 0, failed: 0, lastAttempt: entry.timestamp };
      }
      acc[entry.ip].total++;
      if (entry.status === 'failed') acc[entry.ip].failed++;
      return acc;
    }, {} as Record<string, { total: number; failed: number; lastAttempt: string }>);

    const repeatOffenders = Object.entries(ipAttempts)
      .filter(([, data]) => (data as { failed: number; total: number }).failed > 5 || (data as { failed: number; total: number }).failed > (data as { failed: number; total: number }).total * 0.8)
      .sort(([,a], [,b]) => (b as { failed: number }).failed - (a as { failed: number }).failed)
      .slice(0, 10);

    return `# Compliance Audit Report
## Audit Information
**Audit Period:** ${timePeriod}  
**Compliance Framework:** Cybersecurity Best Practices  
**Audit Date:** ${new Date().toLocaleDateString()}  
**Auditor:** AI Security Analyst

## Executive Compliance Summary
**Overall Compliance Status:** ${riskScore < 30 ? '🟢 **COMPLIANT**' : riskScore < 60 ? '🟡 **PARTIALLY COMPLIANT**' : '🔴 **NON-COMPLIANT**'}  
**Risk Score:** **${riskScore}/100** ${riskScore < 30 ? '(Low Risk)' : riskScore < 60 ? '(Medium Risk)' : '(High Risk)'}

## Compliance Violations
${violations.length > 0 ? 
  violations.map((violation, i) => `${i + 1}. ${violation}`).join('\n') :
  '✅ **No compliance violations detected**'
}

## Security Policy Compliance Checklist

### ✅ **Monitoring & Detection**
- [${complianceChecks.failedLoginMonitoring ? 'x' : ' '}] **Failed Login Monitoring** - ${stats.failedAttempts} failed attempts tracked
- [${complianceChecks.geographicMonitoring ? 'x' : ' '}] **Geographic Access Monitoring** - ${logEntries.filter(e => e.country).length} entries with location data
- [${complianceChecks.threatDetection ? 'x' : ' '}] **Threat Detection System** - ${threats.length} threats detected
- [${complianceChecks.successRateMonitoring ? 'x' : ' '}] **Success Rate Monitoring** - ${successRate.toFixed(1)}% current success rate
- [${complianceChecks.uniqueIPTracking ? 'x' : ' '}] **IP Address Tracking** - ${stats.uniqueIPs} unique IPs monitored

### ✅ **Access Control**
- [${successRate >= 80 ? 'x' : ' '}] **Acceptable Success Rate** - Target: ≥80%, Current: ${successRate.toFixed(1)}%
- [${stats.failedAttempts < stats.successfulLogins ? 'x' : ' '}] **Failed Attempt Control** - Failed attempts within acceptable limits
- [${threats.filter(t => t.severity === 'HIGH').length === 0 ? 'x' : ' '}] **High-Severity Threat Management** - No critical threats detected

### ✅ **Incident Response**
- [${threats.length > 0 ? 'x' : ' '}] **Threat Response Procedures** - ${threats.length} incidents requiring response
- [${isShortPeriod ? 'x' : ' '}] **Real-time Monitoring** - ${isShortPeriod ? 'Active' : 'Periodic'} monitoring in place
- [${logEntries.length > 100 ? 'x' : ' '}] **Log Retention** - Sufficient log data for analysis

## Repeat Offender Analysis
### Top Suspicious IP Addresses
${repeatOffenders.length > 0 ? 
  repeatOffenders.map(([ip, data], i) => 
    `${i + 1}. **${ip}** - ${(data as { total: number; failed: number }).total} total attempts, ${(data as { total: number; failed: number }).failed} failed (${(((data as { total: number; failed: number }).failed / (data as { total: number; failed: number }).total) * 100).toFixed(1)}% failure rate)`
  ).join('\n') :
  '✅ No repeat offenders identified'
}

## Geographic Compliance
### High-Risk Countries
${(() => {
  const countryStats = logEntries.reduce((acc, entry) => {
    if (entry.country) {
      if (!acc[entry.country]) {
        acc[entry.country] = { total: 0, failed: 0 };
      }
      acc[entry.country].total++;
      if (entry.status === 'failed') acc[entry.country].failed++;
    }
    return acc;
  }, {} as Record<string, { total: number; failed: number }>);

  const highRiskCountries = Object.entries(countryStats)
    .filter(([, stats]) => (stats as { failed: number; total: number }).failed > (stats as { failed: number; total: number }).total * 0.7)
    .sort(([,a], [,b]) => (b as { failed: number }).failed - (a as { failed: number }).failed)
    .slice(0, 5);

  return highRiskCountries.length > 0 ? 
    highRiskCountries.map(([country, stats]) => 
      `- **${country}:** ${(stats as { failed: number; total: number }).failed}/${(stats as { failed: number; total: number }).total} failed attempts (${(((stats as { failed: number; total: number }).failed / (stats as { failed: number; total: number }).total) * 100).toFixed(1)}% failure rate)`
    ).join('\n') :
    '✅ No high-risk countries identified';
})()}

## Compliance Recommendations

### Immediate Actions Required
${riskScore > 60 ? 
  `1. **Critical:** Address high-severity threats immediately
2. **Critical:** Implement rate limiting for failed login attempts
3. **High:** Review and update access control policies` :
  riskScore > 30 ?
  `1. **Medium:** Monitor success rate trends
2. **Medium:** Review geographic access patterns
3. **Low:** Consider additional security measures` :
  `1. **Maintenance:** Continue current security practices
2. **Enhancement:** Consider advanced threat detection
3. **Optimization:** Review and optimize existing controls`
}

### Long-term Compliance Strategy
1. **Policy Updates:** ${isShortPeriod ? 'Implement real-time compliance monitoring' : 'Establish long-term compliance tracking'}
2. **Training Requirements:** ${threats.length > 0 ? 'Security team training on threat response' : 'Regular security awareness training'}
3. **Technology Investments:** ${riskScore > 50 ? 'Advanced threat detection systems' : 'Enhanced monitoring tools'}

## Audit Trail
- **Total Audit Events:** ${logEntries.length.toLocaleString()}
- **Compliance Checks Performed:** ${Object.keys(complianceChecks).length}
- **Violations Identified:** ${violations.length}
- **Recommendations Generated:** 3

## Risk Assessment Matrix
| Risk Level | Count | Description |
|------------|-------|-------------|
| **Critical** | ${violations.filter(v => v.includes('Critical')).length} | Immediate action required |
| **High** | ${violations.filter(v => v.includes('High')).length} | Address within 24 hours |
| **Medium** | ${violations.filter(v => v.includes('Medium')).length} | Address within 7 days |
| **Low** | ${violations.filter(v => v.includes('Low')).length} | Monitor and review |

## Compliance Score Breakdown
- **Monitoring & Detection:** ${complianceChecks.failedLoginMonitoring && complianceChecks.threatDetection ? '100%' : '75%'}
- **Access Control:** ${successRate >= 80 ? '100%' : '60%'}
- **Incident Response:** ${threats.length > 0 ? '85%' : '100%'}
- **Overall Score:** **${Math.round((100 - riskScore) * 0.8)}%**

*Compliance audit completed with ${logEntries.length} data points analyzed*`;
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
                onClick={generateAIReport}
                className="bg-purple-600 hover:bg-purple-700"
                disabled={isGeneratingAI || logEntries.length === 0}
              >
                <Bot className="h-4 w-4 mr-2" />
                {isGeneratingAI ? 'Analyzing...' : 'AI Analysis'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Report Display */}
      {aiReport && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-purple-400" />
              AI-Powered Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full">
              <div className="prose prose-invert max-w-none p-4 text-gray-300">
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
                onClick={() => {
                  const blob = new Blob([aiReport], { type: 'text/markdown' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `ai_security_report_${new Date().toISOString().split('T')[0]}.md`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                  toast({
                    title: "AI Report Downloaded",
                    description: "AI analysis report saved as Markdown file",
                    variant: "default",
                  });
                }}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download AI Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
    </div>
  );
};

export default ReportsPanel;
