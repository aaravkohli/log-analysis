import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Globe, MapPin, AlertTriangle, Shield, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { geoIPManager, type GeoLocation } from '@/utils/geoip';
import { geoFencingManager, type GeoAlert } from '@/utils/geoFencing';
import WorldMap from './WorldMap';

interface GeoVisualizationProps {
  logEntries: any[];
}

const GeoVisualization = ({ logEntries }: GeoVisualizationProps) => {
  const [geoData, setGeoData] = useState<Map<string, GeoLocation>>(new Map());
  const [loading, setLoading] = useState(true);
  const [geoAlerts, setGeoAlerts] = useState<GeoAlert[]>([]);
  const [showSettings, setShowSettings] = useState(false);

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
        const location = await geoIPManager.getLocation(ip);
        geoMap.set(ip, location);
      } catch (error) {
        console.log(`Failed to get location for ${ip}`);
      }
    }

    setGeoData(geoMap);
    setLoading(false);
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
    }>();

    logEntries.forEach(log => {
      const geoInfo = geoData.get(log.ip);
      if (geoInfo) {
        const key = geoInfo.country;
        if (!countryStats.has(key)) {
          countryStats.set(key, {
            country: geoInfo.country,
            flag: geoInfo.flag,
            attempts: 0,
            successful: 0,
            failed: 0,
            threats: 0,
            ips: new Set()
          });
        }

        const stats = countryStats.get(key)!;
        stats.attempts++;
        stats.ips.add(log.ip);
        
        if (log.status === 'success')  {
          stats.successful++;
        } else {
          stats.failed++;
          if (stats.failed > 5) stats.threats++;
        }
      }
    });

    return Array.from(countryStats.values()).sort((a, b) => b.attempts - a.attempts);
  };

  const getTopThreateningCountries = () => {
    const stats = getCountryStats();
    return stats.filter(s => s.failed > s.successful && s.attempts > 3).slice(0, 5);
  };

  const getRiskLevel = (failed: number, successful: number) => {
    const failRate = failed / (failed + successful);
    if (failRate > 0.8) return { level: 'High', color: 'text-red-400', bg: 'bg-red-500/20' };
    if (failRate > 0.5) return { level: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { level: 'Low', color: 'text-green-400', bg: 'bg-green-500/20' };
  };

  const countryStats = getCountryStats();
  const threateningCountries = getTopThreateningCountries();

  // Build countryStatsForMap for the map
  const geoRules = geoFencingManager.getRules();
  const countryStatsForMap = countryStats.map(cs => {
    let status: 'allowed' | 'restricted' | 'monitored';
    if (cs.country === 'Unknown') status = 'monitored';
    else if (geoRules.allowedCountries.includes(cs.country)) status = 'allowed';
    else status = 'restricted';
    return {
      name: cs.country,
      count: cs.attempts,
      status,
    };
  });

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-8 text-center">
          <div className="text-gray-400">Loading geographic data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Geo-fencing Alerts */}
      {geoAlerts.length > 0 && (
        <Alert className="border-red-500 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-300">
            <strong>Geo-fencing Violations Detected!</strong> {geoAlerts.length} recent alerts from restricted locations.
          </AlertDescription>
        </Alert>
      )}

      {/* World Map */}
      <WorldMap countryStats={countryStatsForMap} />

      {/* Geographic Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6 text-center">
            <Globe className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <div className="text-2xl font-bold text-white">{countryStats.length}</div>
            <div className="text-gray-400 text-sm">Countries</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6 text-center">
            <MapPin className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <div className="text-2xl font-bold text-white">
              {countryStats.reduce((sum, s) => sum + s.ips.size, 0)}
            </div>
            <div className="text-gray-400 text-sm">Unique IPs</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <div className="text-2xl font-bold text-white">{threateningCountries.length}</div>
            <div className="text-gray-400 text-sm">High-Risk Countries</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <div className="text-2xl font-bold text-white">{geoAlerts.length}</div>
            <div className="text-gray-400 text-sm">Geo Alerts</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Geo Alerts */}
      {geoAlerts.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
              Recent Geo-fencing Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {geoAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <div>
                      <p className="text-white font-medium">{alert.message}</p>
                      <p className="text-gray-400 text-sm">
                        User: {alert.user} | {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive">{alert.severity.toUpperCase()}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Threatening Countries */}
      {threateningCountries.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
              High-Risk Countries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {threateningCountries.map((country, index) => {
                const risk = getRiskLevel(country.failed, country.successful);
                return (
                  <div key={country.country} className={`p-4 rounded-lg border ${risk.bg} border-slate-600`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{country.flag}</span>
                        <span className="text-white font-medium">{country.country}</span>
                      </div>
                      <Badge className={risk.color} variant="outline">
                        {risk.level} Risk
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Attempts:</span>
                        <span className="text-white ml-1">{country.attempts}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">IPs:</span>
                        <span className="text-white ml-1">{country.ips.size}</span>
                      </div>
                      <div>
                        <span className="text-red-400">Failed:</span>
                        <span className="text-white ml-1">{country.failed}</span>
                      </div>
                      <div>
                        <span className="text-green-400">Success:</span>
                        <span className="text-white ml-1">{country.successful}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Countries */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Geographic Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {countryStats.map((country, index) => {
                const risk = getRiskLevel(country.failed, country.successful);
                const successRate = country.attempts > 0 ? 
                  ((country.successful / country.attempts) * 100).toFixed(1) : '0';
                
                return (
                  <div key={country.country} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{country.flag}</span>
                      <div>
                        <div className="text-white font-medium">{country.country}</div>
                        <div className="text-gray-400 text-sm">
                          {country.ips.size} unique IPs • {successRate}% success rate
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-white font-bold">{country.attempts}</div>
                        <div className="text-gray-400 text-sm">attempts</div>
                      </div>
                      <div className="text-right">
                        <div className="text-red-400 font-bold">{country.failed}</div>
                        <div className="text-gray-400 text-sm">failed</div>
                      </div>
                      <Badge className={risk.color} variant="outline">
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
