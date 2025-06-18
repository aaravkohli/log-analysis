interface GeoLocation {
  country: string;
  countryCode: string;
  city: string;
  region: string;
  flag: string;
  lat: number;
  lng: number;
}

class GeoIPManager {
  private cache = new Map<string, GeoLocation>();
  private defaultLocation: GeoLocation = {
    country: 'Unknown',
    countryCode: 'XX',
    city: 'Unknown',
    region: 'Unknown',
    flag: '🏴',
    lat: 0,
    lng: 0
  };

  async getLocation(ip: string): Promise<GeoLocation> {
    // Check cache first
    if (this.cache.has(ip)) {
      return this.cache.get(ip)!;
    }

    // Mock geolocation data for demo purposes
    const mockData = this.getMockLocation(ip);
    this.cache.set(ip, mockData);
    return mockData;
  }

  private getMockLocation(ip: string): GeoLocation {
    const locations = [
      { country: 'United States', countryCode: 'US', city: 'New York', region: 'NY', flag: '🇺🇸', lat: 40.7128, lng: -74.0060 },
      { country: 'China', countryCode: 'CN', city: 'Beijing', region: 'Beijing', flag: '🇨🇳', lat: 39.9042, lng: 116.4074 },
      { country: 'Russia', countryCode: 'RU', city: 'Moscow', region: 'Moscow', flag: '🇷🇺', lat: 55.7558, lng: 37.6173 },
      { country: 'Germany', countryCode: 'DE', city: 'Berlin', region: 'Berlin', flag: '🇩🇪', lat: 52.5200, lng: 13.4050 },
      { country: 'Brazil', countryCode: 'BR', city: 'São Paulo', region: 'SP', flag: '🇧🇷', lat: -23.5505, lng: -46.6333 },
      { country: 'United Kingdom', countryCode: 'GB', city: 'London', region: 'England', flag: '🇬🇧', lat: 51.5074, lng: -0.1278 },
      { country: 'Canada', countryCode: 'CA', city: 'Toronto', region: 'ON', flag: '🇨🇦', lat: 43.6532, lng: -79.3832 },
      { country: 'Australia', countryCode: 'AU', city: 'Sydney', region: 'NSW', flag: '🇦🇺', lat: -33.8688, lng: 151.2093 },
      { country: 'India', countryCode: 'IN', city: 'Mumbai', region: 'MH', flag: '🇮🇳', lat: 19.0760, lng: 72.8777 },
      { country: 'Japan', countryCode: 'JP', city: 'Tokyo', region: 'Tokyo', flag: '🇯🇵', lat: 35.6762, lng: 139.6503 }
    ];
    
    // Map specific IP ranges to specific countries for more realistic data
    if (ip.startsWith('192.168.') || ip.startsWith('10.')) {
      // Internal IPs are typically from the same country (e.g., United States)
      return locations[0]; // United States
    } else if (ip.startsWith('203.0.113.')) {
      // TEST-NET-3 documentation range - map to China for this demo
      return locations[1]; // China
    } else if (ip.startsWith('198.51.100.')) {
      // TEST-NET-2 documentation range - map to Russia for this demo
      return locations[2]; // Russia
    } else if (ip.startsWith('172.16.')) {
      // Private range - map to Germany for this demo
      return locations[3]; // Germany
    } else if (ip === '203.0.114.10') {
      // Dedicated IP for India
      return locations[8]; // India
    } else {
      // For any other IPs, use a deterministic approach based on the IP itself
      const ipParts = ip.split('.');
      const hash = ipParts.reduce((a, b) => a + parseInt(b), 0);
      return locations[hash % locations.length];
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const geoIPManager = new GeoIPManager();
export type { GeoLocation };
