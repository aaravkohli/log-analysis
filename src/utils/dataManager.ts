export interface LogEntry {
  id: string | number;
  timestamp: string;
  ip: string;
  user: string;
  status: 'success' | 'failed';
  port?: number;
  country?: string;
  countryCode?: string;
  city?: string;
  flag?: string;
}

export interface Stats {
  totalAttempts: number;
  failedAttempts: number;
  successfulLogins: number;
  uniqueIPs: number;
  threatsDetected: number;
  uniqueCountries: number;
  uniqueUsers: number;
  successRate: number;
}

export interface DataSource {
  type: 'simulated' | 'uploaded' | 'mixed';
  lastUpdate: string;
  entryCount: number;
}

class DataManager {
  private logEntries: LogEntry[] = [];
  private dataSource: DataSource = {
    type: 'simulated',
    lastUpdate: new Date().toISOString(),
    entryCount: 0
  };

  // Add log entries (for both simulation and upload)
  addLogEntries(entries: LogEntry[], mode: 'append' | 'replace' = 'append') {
    if (mode === 'replace') {
      this.logEntries = entries;
    } else {
      this.logEntries = [...this.logEntries, ...entries];
    }

    // Update data source info
    this.updateDataSourceInfo();
  }

  // Get all log entries
  getLogEntries(): LogEntry[] {
    return [...this.logEntries];
  }

  // Calculate comprehensive stats from current data
  calculateStats(): Stats {
    if (this.logEntries.length === 0) {
      return {
        totalAttempts: 0,
        failedAttempts: 0,
        successfulLogins: 0,
        uniqueIPs: 0,
        threatsDetected: 0,
        uniqueCountries: 0,
        uniqueUsers: 0,
        successRate: 0
      };
    }

    const uniqueIPs = new Set(this.logEntries.map(entry => entry.ip));
    const uniqueCountries = new Set(this.logEntries.map(entry => entry.country).filter(Boolean));
    const uniqueUsers = new Set(this.logEntries.map(entry => entry.user));
    
    const failedAttempts = this.logEntries.filter(entry => entry.status === 'failed').length;
    const successfulLogins = this.logEntries.filter(entry => entry.status === 'success').length;
    const totalAttempts = this.logEntries.length;
    const successRate = totalAttempts > 0 ? (successfulLogins / totalAttempts) * 100 : 0;

    return {
      totalAttempts,
      failedAttempts,
      successfulLogins,
      uniqueIPs: uniqueIPs.size,
      threatsDetected: 0, // This will be calculated by threat detection
      uniqueCountries: uniqueCountries.size,
      uniqueUsers: uniqueUsers.size,
      successRate
    };
  }

  // Get hourly activity data for charts
  getHourlyActivityData() {
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourStr = hour.toString().padStart(2, '0');
      const entriesInHour = this.logEntries.filter(entry => {
        const entryHour = new Date(entry.timestamp).getHours();
        return entryHour === hour;
      });

      const attempts = entriesInHour.length;
      const failed = entriesInHour.filter(entry => entry.status === 'failed').length;
      const successful = attempts - failed;

      return {
        hour: `${hourStr}:00`,
        attempts,
        failed,
        successful,
        threatLevel: failed > attempts * 0.8 ? 'high' : failed > attempts * 0.6 ? 'medium' : 'low'
      };
    });

    return hourlyData;
  }

  // Get top IP addresses by attempt count
  getTopIPs(limit: number = 10) {
    const ipCounts: Record<string, number> = {};
    
    this.logEntries.forEach(entry => {
      ipCounts[entry.ip] = (ipCounts[entry.ip] || 0) + 1;
    });

    return Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // Get user activity data
  getUserActivityData() {
    const userData: Record<string, { attempts: number; failed: number; ips: Set<string>; countries: Set<string> }> = {};
    
    this.logEntries.forEach(entry => {
      if (!userData[entry.user]) {
        userData[entry.user] = { attempts: 0, failed: 0, ips: new Set(), countries: new Set() };
      }
      
      userData[entry.user].attempts++;
      if (entry.status === 'failed') {
        userData[entry.user].failed++;
      }
      userData[entry.user].ips.add(entry.ip);
      if (entry.country) {
        userData[entry.user].countries.add(entry.country);
      }
    });

    return Object.entries(userData).map(([user, data]) => ({
      user,
      attempts: data.attempts,
      failed: data.failed,
      successful: data.attempts - data.failed,
      countries: data.countries.size,
      ips: data.ips.size,
      riskScore: Math.floor((data.failed / data.attempts) * 100)
    })).sort((a, b) => b.attempts - a.attempts);
  }

  // Get country distribution data
  getCountryDistributionData() {
    const countryData: Record<string, { attempts: number; failed: number; ips: Set<string> }> = {};
    
    this.logEntries.forEach(entry => {
      const country = entry.country || 'Unknown';
      if (!countryData[country]) {
        countryData[country] = { attempts: 0, failed: 0, ips: new Set() };
      }
      
      countryData[country].attempts++;
      if (entry.status === 'failed') {
        countryData[country].failed++;
      }
      countryData[country].ips.add(entry.ip);
    });

    return Object.entries(countryData).map(([country, data]) => ({
      country,
      attempts: data.attempts,
      failed: data.failed,
      successful: data.attempts - data.failed,
      uniqueIPs: data.ips.size,
      riskScore: Math.floor((data.failed / data.attempts) * 100)
    })).sort((a, b) => b.attempts - a.attempts);
  }

  // Get recent activity (last N entries)
  getRecentActivity(limit: number = 50) {
    return this.logEntries
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Get data source information
  getDataSource(): DataSource {
    return { ...this.dataSource };
  }

  // Check if data is from upload
  isUploadedData(): boolean {
    return this.dataSource.type === 'uploaded' || this.dataSource.type === 'mixed';
  }

  // Check if data is simulated
  isSimulatedData(): boolean {
    return this.dataSource.type === 'simulated';
  }

  // Clear all data
  clearData() {
    this.logEntries = [];
    this.updateDataSourceInfo();
  }

  // Get data for specific time range
  getDataInTimeRange(hours: number) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.logEntries.filter(entry => new Date(entry.timestamp) >= cutoff);
  }

  // Update data source information
  private updateDataSourceInfo() {
    this.dataSource = {
      type: this.determineDataSourceType(),
      lastUpdate: new Date().toISOString(),
      entryCount: this.logEntries.length
    };
  }

  // Determine data source type based on entry characteristics
  private determineDataSourceType(): 'simulated' | 'uploaded' | 'mixed' {
    if (this.logEntries.length === 0) return 'simulated';

    // Check for characteristics of simulated data
    const hasSimulatedPatterns = this.logEntries.some(entry => {
      // Simulated data often has specific IP patterns, timestamps, or other characteristics
      const simulatedIPs = ['45.123.45.67', '190.2.145.30', '103.89.7.22', '178.62.193.45', '61.177.172.140', '185.220.101.5'];
      return simulatedIPs.includes(entry.ip);
    });

    const hasUploadedPatterns = this.logEntries.some(entry => {
      // Uploaded data might have different characteristics
      return entry.ip && !['45.123.45.67', '190.2.145.30', '103.89.7.22', '178.62.193.45', '61.177.172.140', '185.220.101.5'].includes(entry.ip);
    });

    if (hasSimulatedPatterns && hasUploadedPatterns) return 'mixed';
    if (hasUploadedPatterns) return 'uploaded';
    return 'simulated';
  }
}

export const dataManager = new DataManager(); 