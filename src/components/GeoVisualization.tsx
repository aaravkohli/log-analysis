import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Globe, MapPin, AlertTriangle, Shield, TrendingUp, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { geoIPManager, type GeoLocation } from '@/utils/geoip';
import { geoFencingManager, type GeoAlert } from '@/utils/geoFencing';
import WorldMap from './WorldMap';

import { errorHandler } from '@/utils/errorHandler';

interface GeoVisualizationProps {
  logEntries: any[];
}

const GeoVisualization = ({ logEntries }: GeoVisualizationProps) => {
  const [geoData, setGeoData] = useState<Map<string, GeoLocation>>(new Map());
  const [loading, setLoading] = useState(true);
  const [geoAlerts, setGeoAlerts] = useState<GeoAlert[]>([]);

  useEffect(() => {
    loadGeoData();
  }, [logEntries]);

  useEffect(() => {
    // Check for geo-fencing violations
    logEntries.forEach(entry => {
      const alert = geoFencingManager.checkGeoFencing(entry);
      if (alert) {
        setGeoAlerts(prev => {
          const exists = prev.some(a => a.id === alert.id);
          return exists ? prev : [alert, ...prev.slice(0, 9)];
        });
      }
    });
  }, [logEntries]);

  const loadGeoData = async () => {
    setLoading(true);
    const uniqueIPs = [...new Set(logEntries.map(log => log.ip))];
    const geoMap = new Map<string, GeoLocation>();

    for (const ip of uniqueIPs) {
      try {
        const location = await getLocationForIP(ip);
        geoMap.set(ip, location);
      } catch (error) {
        errorHandler.handleGeoError(ip, error instanceof Error ? error : new Error('Failed to get location'));
      }
    }

    setGeoData(geoMap);
    setLoading(false);
  };

  const getLocationForIP = async (ip: string) => {
    try {
      const location = await geoIPManager.getLocation(ip);
      return location;
    } catch (error) {
      // Silently handle errors and return default location
      return {
        country: 'Unknown',
        countryCode: 'XX',
        city: 'Unknown',
        region: 'Unknown',
        flag: '🏴',
        lat: 0,
        lng: 0
      };
    }
  };

  const getCountryStats = () => {
    const countryStats = new Map<string, {
      country: string;
      flag: string;
      attempts: number;
      successful: number;
      failed: number;
      threats: number;
      ips: Set<string>;
      lastSeen: string;
    }>();

    logEntries.forEach(log => {
      // Use the country from the log entry directly since we're generating it properly now
      const country = log.country || 'Unknown';
      const flag = log.flag || '🏳️';
      
      if (!countryStats.has(country)) {
        countryStats.set(country, {
          country,
          flag,
          attempts: 0,
          successful: 0,
          failed: 0,
          threats: 0,
          ips: new Set(),
          lastSeen: log.timestamp
        });
      }

      const stats = countryStats.get(country)!;
      stats.attempts++;
      stats.ips.add(log.ip);
      stats.lastSeen = log.timestamp;
      
      if (log.status === 'success') {
        stats.successful++;
      } else {
        stats.failed++;
        if (stats.failed > 3) stats.threats++;
      }
    });

    return Array.from(countryStats.values()).sort((a, b) => b.attempts - a.attempts);
  };

  const getTopThreateningCountries = () => {
    const stats = getCountryStats();
    return stats.filter(s => s.failed > s.successful && s.attempts > 2).slice(0, 6);
  };

  const getRiskLevel = (failed: number, successful: number) => {
    const total = failed + successful;
    if (total === 0) return { level: 'Unknown', color: 'text-gray-400', bg: 'bg-gray-500/20' };
    
    const failRate = failed / total;
    if (failRate > 0.8) return { level: 'Critical', color: 'text-red-400', bg: 'bg-red-500/20' };
    if (failRate > 0.6) return { level: 'High', color: 'text-red-300', bg: 'bg-red-500/15' };
    if (failRate > 0.4) return { level: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { level: 'Low', color: 'text-green-400', bg: 'bg-green-500/20' };
  };

  const countryStats = getCountryStats();
  const threateningCountries = getTopThreateningCountries();
  const totalCountries = countryStats.length;
  const totalUniqueIPs = new Set(logEntries.map(log => log.ip)).size;
  const totalThreats = countryStats.reduce((sum, s) => sum + s.threats, 0);

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-600 rounded w-1/2 mx-auto"></div>
            <div className="h-8 bg-slate-600 rounded w-1/4 mx-auto"></div>
          </div>
          <div className="text-gray-400 mt-4">Loading geographic intelligence...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Geo-fencing Alerts */}
      {geoAlerts.length > 0 && (
        <Alert className="border-red-500 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-300">
            <strong>Geo-fencing Violations!</strong> {geoAlerts.length} alert{geoAlerts.length > 1 ? 's' : ''} from restricted locations.
          </AlertDescription>
        </Alert>
      )}

      {/* World Map - Now properly showing countries and alerts */}
      <WorldMap logEntries={logEntries} geoAlerts={geoAlerts} />

      {/* Enhanced Geographic Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700/50 hover:from-blue-900/60 hover:to-blue-800/40 transition-all duration-300">
          <CardContent className="p-4 sm:p-6 text-center">
            <Globe className="h-8 w-8 sm:h-12 sm:w-12 text-blue-400 mx-auto mb-3 sm:mb-4" />
            <div className="text-xl sm:text-2xl font-bold text-white">{totalCountries}</div>
            <div className="text-blue-300 text-xs sm:text-sm">Countries</div>
            <div className="text-blue-400 text-xs mt-1">Detected</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700/50 hover:from-green-900/60 hover:to-green-800/40 transition-all duration-300">
          <CardContent className="p-4 sm:p-6 text-center">
            <MapPin className="h-8 w-8 sm:h-12 sm:w-12 text-green-400 mx-auto mb-3 sm:mb-4" />
            <div className="text-xl sm:text-2xl font-bold text-white">{totalUniqueIPs}</div>
            <div className="text-green-300 text-xs sm:text-sm">Unique IPs</div>
            <div className="text-green-400 text-xs mt-1">Tracked</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-700/50 hover:from-red-900/60 hover:to-red-800/40 transition-all duration-300">
          <CardContent className="p-4 sm:p-6 text-center">
            <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12 text-red-400 mx-auto mb-3 sm:mb-4" />
            <div className="text-xl sm:text-2xl font-bold text-white">{threateningCountries.length}</div>
            <div className="text-red-300 text-xs sm:text-sm">High-Risk</div>
            <div className="text-red-400 text-xs mt-1">Countries</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-700/50 hover:from-yellow-900/60 hover:to-yellow-800/40 transition-all duration-300">
          <CardContent className="p-4 sm:p-6 text-center">
            <Shield className="h-8 w-8 sm:h-12 sm:w-12 text-yellow-400 mx-auto mb-3 sm:mb-4" />
            <div className="text-xl sm:text-2xl font-bold text-white">{geoAlerts.length}</div>
            <div className="text-yellow-300 text-xs sm:text-sm">Geo Alerts</div>
            <div className="text-yellow-400 text-xs mt-1">Active</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Geo Alerts - Enhanced for mobile */}
      {geoAlerts.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center text-lg sm:text-xl">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
              Recent Geo-fencing Alerts
            </CardTitle>
            <p className="text-slate-400 text-sm">Security violations from restricted locations</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {geoAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-red-500/10 rounded-lg border border-red-500/20 space-y-2 sm:space-y-0">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium text-sm sm:text-base break-words">{alert.message}</p>
                      <p className="text-gray-400 text-xs sm:text-sm">
                        User: {alert.user} | {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive" className="self-start sm:self-center">
                    {alert.severity.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Top Threatening Countries */}
      {threateningCountries.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center text-lg sm:text-xl">
              <TrendingUp className="h-5 w-5 mr-2 text-red-400" />
              High-Risk Countries
            </CardTitle>
            <p className="text-slate-400 text-sm">Countries with suspicious activity patterns</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {threateningCountries.map((country, index) => {
                const risk = getRiskLevel(country.failed, country.successful);
                return (
                  <div key={country.country} className={`p-4 rounded-lg border ${risk.bg} border-slate-600 hover:border-slate-500 transition-colors`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <span className="text-xl sm:text-2xl flex-shrink-0">{country.flag}</span>
                        <span className="text-white font-medium text-sm sm:text-base truncate">{country.country}</span>
                      </div>
                      <Badge className={`${risk.color} text-xs flex-shrink-0 ml-2`} variant="outline">
                        {risk.level}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Attempts:</span>
                        <span className="text-white font-medium">{country.attempts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">IPs:</span>
                        <span className="text-white font-medium">{country.ips.size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-400">Failed:</span>
                        <span className="text-white font-medium">{country.failed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-400">Success:</span>
                        <span className="text-white font-medium">{country.successful}</span>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-600">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Last seen:</span>
                        <span className="text-slate-300">{new Date(country.lastSeen).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Countries - Enhanced for mobile */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center text-lg sm:text-xl">
            <Activity className="h-5 w-5 mr-2" />
            Complete Geographic Distribution
          </CardTitle>
          <p className="text-slate-400 text-sm">All detected countries and their activity levels</p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] sm:h-[400px]">
            <div className="space-y-2">
              {countryStats.map((country, index) => {
                const risk = getRiskLevel(country.failed, country.successful);
                const successRate = country.attempts > 0 ? 
                  ((country.successful / country.attempts) * 100).toFixed(1) : '0';
                
                return (
                  <div key={country.country} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <span className="text-xl sm:text-2xl flex-shrink-0">{country.flag}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-white font-medium text-sm sm:text-base truncate">{country.country}</div>
                        <div className="text-gray-400 text-xs sm:text-sm">
                          {country.ips.size} IP{country.ips.size !== 1 ? 's' : ''} • {successRate}% success
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end space-x-4 sm:space-x-6">
                      <div className="flex space-x-4 sm:space-x-6">
                        <div className="text-center">
                          <div className="text-white font-bold text-sm sm:text-base">{country.attempts}</div>
                          <div className="text-gray-400 text-xs">attempts</div>
                        </div>
                        <div className="text-center">
                          <div className="text-red-400 font-bold text-sm sm:text-base">{country.failed}</div>
                          <div className="text-gray-400 text-xs">failed</div>
                        </div>
                      </div>
                      <Badge className={`${risk.color} text-xs flex-shrink-0`} variant="outline">
                        {risk.level}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeoVisualization;
