interface GeoFencingRule {
  allowedCountries: string[];
  alertOnUnknown: boolean;
  enabled: boolean;
}

interface GeoAlert {
  id: string;
  timestamp: string;
  ip: string;
  country: string;
  countryCode: string;
  user: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

class GeoFencingManager {
  private rules: GeoFencingRule = {
    allowedCountries: ['United States', 'United Kingdom', 'Germany', 'India'], // Default allowed countries
    alertOnUnknown: true,
    enabled: true
  };
  
  private alerts: GeoAlert[] = [];

  checkGeoFencing(logEntry: any): GeoAlert | null {
    if (!this.rules.enabled) return null;

    const isAllowed = this.rules.allowedCountries.includes(logEntry.country);
    const isUnknown = !logEntry.country || logEntry.country === 'Unknown';

    if (!isAllowed || (isUnknown && this.rules.alertOnUnknown)) {
      // Generate a more reliable ID using timestamp and a formatted random value
      const id = `${Date.now()}-${Math.floor(1000000 + Math.random() * 9000000)}`;
      
      const alert: GeoAlert = {
        id,
        timestamp: new Date().toISOString(),
        ip: logEntry.ip,
        country: logEntry.country || 'Unknown',
        countryCode: logEntry.countryCode || 'XX',
        user: logEntry.user,
        message: isUnknown 
          ? `Login attempt from unknown location: ${logEntry.ip}`
          : `Login attempt from restricted country: ${logEntry.country} (${logEntry.ip})`,
        severity: logEntry.status === 'success' ? 'high' : 'medium'
      };

      this.alerts.unshift(alert);
      
      // Keep only recent alerts
      if (this.alerts.length > 50) {
        this.alerts = this.alerts.slice(0, 50);
      }

      return alert;
    }

    return null;
  }

  getAlerts(): GeoAlert[] {
    return [...this.alerts];
  }

  updateRules(rules: Partial<GeoFencingRule>): void {
    this.rules = { ...this.rules, ...rules };
  }

  getRules(): GeoFencingRule {
    return { ...this.rules };
  }

  clearAlerts(): void {
    this.alerts = [];
  }
}

export const geoFencingManager = new GeoFencingManager();
export type { GeoAlert, GeoFencingRule };
