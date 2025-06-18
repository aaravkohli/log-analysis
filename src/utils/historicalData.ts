export interface HistoricalDataPoint {
  timestamp: string;
  totalAttempts: number;
  failedAttempts: number;
  successfulLogins: number;
  uniqueIPs: number;
  threatsDetected: number;
}

class HistoricalDataManager {
  private data: HistoricalDataPoint[] = [];
  private maxDataPoints = 100;

  saveDataPoint(stats: any, threats: any[]): void {
    const dataPoint: HistoricalDataPoint = {
      timestamp: new Date().toISOString(),
      totalAttempts: stats.totalAttempts,
      failedAttempts: stats.failedAttempts,
      successfulLogins: stats.successfulLogins,
      uniqueIPs: stats.uniqueIPs,
      threatsDetected: threats.length
    };

    this.data.push(dataPoint);
    
    // Keep only recent data points
    if (this.data.length > this.maxDataPoints) {
      this.data = this.data.slice(-this.maxDataPoints);
    }
  }

  getHistoricalData(): HistoricalDataPoint[] {
    return [...this.data];
  }

  getBaselineData(): { avgAttempts: number; peakThreshold: number } {
    if (this.data.length === 0) {
      return { avgAttempts: 0, peakThreshold: 0 };
    }

    const avgAttempts = this.data.reduce((sum, d) => sum + d.totalAttempts, 0) / this.data.length;
    const peakThreshold = avgAttempts * 1.5; // 50% above average triggers alert

    return { avgAttempts, peakThreshold };
  }

  clearData(): void {
    this.data = [];
  }
}

export const historicalDataManager = new HistoricalDataManager();
