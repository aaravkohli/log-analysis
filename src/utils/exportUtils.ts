
export interface ReportData {
  summary: {
    totalAttempts: number;
    failedAttempts: number;
    successfulLogins: number;
    uniqueIPs: number;
    threatsDetected: number;
    successRate: string;
    reportDate: string;
  };
  threats: any[];
  topIPs: Array<{ ip: string; attempts: number; country?: string }>;
  countries: Array<{ country: string; attempts: number; successRate: string }>;
}

class ExportManager {
  generateReport(stats: any, threats: any[], logEntries: any[]): ReportData {
    // Calculate top IPs
    const ipCounts: Record<string, { attempts: number; country?: string }> = {};
    logEntries.forEach(entry => {
      if (!ipCounts[entry.ip]) {
        ipCounts[entry.ip] = { attempts: 0, country: entry.country };
      }
      ipCounts[entry.ip].attempts++;
    });

    const topIPs = Object.entries(ipCounts)
      .map(([ip, data]) => ({ ip, ...data }))
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 10);

    // Calculate country stats
    const countryCounts: Record<string, { total: number; successful: number }> = {};
    logEntries.forEach(entry => {
      if (entry.country) {
        if (!countryCounts[entry.country]) {
          countryCounts[entry.country] = { total: 0, successful: 0 };
        }
        countryCounts[entry.country].total++;
        if (entry.status === 'success') {
          countryCounts[entry.country].successful++;
        }
      }
    });

    const countries = Object.entries(countryCounts)
      .map(([country, data]) => ({
        country,
        attempts: data.total,
        successRate: data.total > 0 ? ((data.successful / data.total) * 100).toFixed(1) + '%' : '0%'
      }))
      .sort((a, b) => b.attempts - a.attempts);

    const successRate = stats.totalAttempts > 0 
      ? ((stats.successfulLogins / stats.totalAttempts) * 100).toFixed(1) + '%'
      : '0%';

    return {
      summary: {
        totalAttempts: stats.totalAttempts,
        failedAttempts: stats.failedAttempts,
        successfulLogins: stats.successfulLogins,
        uniqueIPs: stats.uniqueIPs,
        threatsDetected: threats.length,
        successRate,
        reportDate: new Date().toISOString()
      },
      threats,
      topIPs,
      countries
    };
  }

  exportToCSV(data: any[], filename: string): void {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          JSON.stringify(row[header] || '')
        ).join(',')
      )
    ].join('\n');

    this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  }

  exportToJSON(data: any, filename: string): void {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, `${filename}.json`, 'application/json');
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

export const exportManager = new ExportManager();
