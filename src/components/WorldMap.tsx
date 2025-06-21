import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Globe, Shield, AlertTriangle } from 'lucide-react';

interface WorldMapProps {
  logEntries: any[];
  geoAlerts?: any[];
}

const WorldMap = ({ logEntries, geoAlerts = [] }: WorldMapProps) => {
  // Enhanced country positions for better visualization
  const countryPositions: Record<string, { x: number; y: number; color: string; threat: 'low' | 'medium' | 'high' }> = {
    'United States': { x: 20, y: 40, color: '#22c55e', threat: 'low' },
    'China': { x: 75, y: 32, color: '#ef4444', threat: 'high' },
    'Russia': { x: 65, y: 20, color: '#ef4444', threat: 'high' },
    'Germany': { x: 52, y: 30, color: '#22c55e', threat: 'low' },
    'Brazil': { x: 35, y: 65, color: '#f59e0b', threat: 'medium' },
    'United Kingdom': { x: 48, y: 28, color: '#22c55e', threat: 'low' },
    'India': { x: 70, y: 45, color: '#f59e0b', threat: 'medium' },
    'France': { x: 50, y: 32, color: '#22c55e', threat: 'low' },
    'Japan': { x: 85, y: 35, color: '#22c55e', threat: 'low' },
    'Canada': { x: 25, y: 25, color: '#22c55e', threat: 'low' },
  };

  // Get activity by country with proper type handling
  const countryActivity = logEntries.reduce((acc, entry) => {
    const country = typeof entry.country === 'string' ? entry.country : null;
    if (country && countryPositions[country]) {
      acc[country] = (acc[country] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Get alerts by country
  const alertsByCountry = geoAlerts.reduce((acc, alert) => {
    const country = alert.country || 'Unknown';
    if (countryPositions[country]) {
      acc[country] = (acc[country] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const activityValues = Object.values(countryActivity).filter((val): val is number => typeof val === 'number');
  const maxActivity = activityValues.length > 0 ? Math.max(...activityValues) : 1;

  const getThreatColor = (threat: 'low' | 'medium' | 'high') => {
    switch (threat) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  return (
    <Card className="glass-effect border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="text-white flex items-center text-lg sm:text-xl">
          <Globe className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-400" />
          Global SSH Activity Map
        </CardTitle>
        <p className="text-slate-300 text-sm">Real-time connection attempts and security alerts by geographic location</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px] bg-gradient-to-br from-slate-800/50 to-slate-900/70 rounded-lg overflow-hidden border border-slate-600 backdrop-blur-sm">
          {/* Enhanced world map background with better styling */}
          <div className="absolute inset-0 opacity-40">
            <svg viewBox="0 0 100 70" className="w-full h-full">
              {/* North America */}
              <path
                d="M15,25 L25,20 L30,25 L35,30 L30,35 L20,40 L15,35 Z"
                fill="#374151"
                stroke="#4b5563"
                strokeWidth="0.3"
                className="hover:fill-gray-600 transition-colors duration-200"
              />
              {/* Europe */}
              <path
                d="M45,20 L55,25 L60,30 L55,35 L50,40 L45,35 Z"
                fill="#374151"
                stroke="#4b5563"
                strokeWidth="0.3"
                className="hover:fill-gray-600 transition-colors duration-200"
              />
              {/* Asia */}
              <path
                d="M60,20 L85,25 L90,35 L80,45 L65,40 L60,30 Z"
                fill="#374151"
                stroke="#4b5563"
                strokeWidth="0.3"
                className="hover:fill-gray-600 transition-colors duration-200"
              />
              {/* South America */}
              <path
                d="M25,50 L35,45 L40,60 L30,65 L25,60 Z"
                fill="#374151"
                stroke="#4b5563"
                strokeWidth="0.3"
                className="hover:fill-gray-600 transition-colors duration-200"
              />
              {/* Africa */}
              <path
                d="M45,40 L55,38 L58,55 L50,60 L45,50 Z"
                fill="#374151"
                stroke="#4b5563"
                strokeWidth="0.3"
                className="hover:fill-gray-600 transition-colors duration-200"
              />
              {/* Australia */}
              <path
                d="M75,55 L85,52 L87,58 L80,62 L75,60 Z"
                fill="#374151"
                stroke="#4b5563"
                strokeWidth="0.3"
                className="hover:fill-gray-600 transition-colors duration-200"
              />
            </svg>
          </div>

          {/* Enhanced grid lines */}
          <div className="absolute inset-0 opacity-15">
            <svg viewBox="0 0 100 70" className="w-full h-full">
              {[20, 40, 60, 80].map(x => (
                <line key={x} x1={x} y1="0" x2={x} y2="70" stroke="#64748b" strokeWidth="0.5" strokeDasharray="2,2" />
              ))}
              {[20, 35, 50].map(y => (
                <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#64748b" strokeWidth="0.5" strokeDasharray="2,2" />
              ))}
            </svg>
          </div>

          {/* Activity markers with improved positioning and animation */}
          {Object.entries(countryActivity)
            .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
            .map(([country, count]) => {
              const position = countryPositions[country];
              if (!position || typeof count !== 'number') return null;

              const size = Math.max(14, Math.min(45, (count / maxActivity) * 40));
              const threatColor = getThreatColor(position.threat);
              const hasAlerts = alertsByCountry[country] > 0;

              return (
                <div 
                  key={country} 
                  className="absolute group z-10"
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {/* Enhanced pulse ring with better animation */}
                  <div
                    className="absolute inset-0 rounded-full animate-ping opacity-60"
                    style={{
                      width: `${size + 12}px`,
                      height: `${size + 12}px`,
                      backgroundColor: threatColor,
                      transform: 'translate(-50%, -50%)',
                      animationDuration: hasAlerts ? '1s' : '2s'
                    }}
                  />
                  
                  {/* Main marker with enhanced styling */}
                  <div
                    className="relative rounded-full shadow-xl border-2 border-white/50 backdrop-blur-sm"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      backgroundColor: threatColor,
                      boxShadow: `0 0 ${size/2}px ${threatColor}80, 0 4px 12px rgba(0,0,0,0.3)`,
                      opacity: 0.95,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />

                  {/* FIXED: Alert icon positioning - now properly positioned relative to the marker */}
                  {hasAlerts && (
                    <div
                      className="absolute z-20 bg-red-500 rounded-full p-1 border-2 border-white shadow-lg animate-bounce"
                      style={{
                        top: `-${size/4}px`,
                        right: `-${size/4}px`,
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: 'translate(50%, -50%)'
                      }}
                    >
                      <AlertTriangle className="h-3 w-3 text-white" />
                    </div>
                  )}
                  
                  {/* Enhanced country info tooltip */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 scale-95 group-hover:scale-100">
                    <div className="bg-slate-800/95 backdrop-blur-xl text-white px-4 py-3 rounded-lg border border-slate-600 shadow-2xl min-w-max">
                      <div className="font-medium text-base mb-1">{country}</div>
                      <div className="text-sm text-slate-300 space-y-1">
                        <div>{count} connection{count !== 1 ? 's' : ''}</div>
                        {hasAlerts && (
                          <div className="text-red-400 font-medium">
                            ⚠️ {alertsByCountry[country]} active alert{alertsByCountry[country] !== 1 ? 's' : ''}
                          </div>
                        )}
                        <div className="flex items-center mt-2 pt-2 border-t border-slate-600">
                          {position.threat === 'high' && <AlertTriangle className="h-4 w-4 text-red-400 mr-2" />}
                          {position.threat === 'medium' && <Shield className="h-4 w-4 text-yellow-400 mr-2" />}
                          {position.threat === 'low' && <Shield className="h-4 w-4 text-green-400 mr-2" />}
                          <span className="text-sm capitalize text-slate-300">{position.threat} threat level</span>
                        </div>
                      </div>
                      {/* Tooltip arrow */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-2 h-2 bg-slate-800 rotate-45 border-l border-t border-slate-600"></div>
                    </div>
                  </div>
                </div>
              );
            })}

          {/* Enhanced Legend with better styling */}
          <div className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur-xl rounded-xl p-4 border border-slate-600 shadow-2xl">
            <h4 className="text-white text-sm font-medium mb-3 border-b border-slate-600 pb-2">Threat Assessment</h4>
            <div className="space-y-2">
              {[
                { color: 'bg-green-500', label: 'Low Risk Countries', icon: Shield },
                { color: 'bg-yellow-500', label: 'Medium Risk Countries', icon: Shield },
                { color: 'bg-red-500', label: 'High Risk Countries', icon: AlertTriangle },
                { color: 'bg-red-500', label: 'Active Security Alerts', icon: AlertTriangle, special: true }
              ].map(({ color, label, icon: Icon, special }) => (
                <div key={label} className="flex items-center text-xs">
                  {special ? (
                    <AlertTriangle className="w-3 h-3 text-red-500 mr-2" />
                  ) : (
                    <div className={`w-3 h-3 rounded-full ${color} mr-2 shadow-sm`}></div>
                  )}
                  <span className="text-gray-300">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced activity intensity indicator */}
          <div className="absolute bottom-4 right-4 bg-slate-800/90 backdrop-blur-xl rounded-xl p-4 border border-slate-600 shadow-2xl">
            <h4 className="text-white text-sm font-medium mb-3 border-b border-slate-600 pb-2">Activity Level</h4>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-blue-400 opacity-60"></div>
                <span className="text-xs text-gray-300">Low</span>
              </div>
              <div className="w-8 h-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50"></div>
                <span className="text-xs text-gray-300">High</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Activity Summary with better animations */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {Object.entries(countryActivity)
            .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
            .sort(([,a], [,b]) => b - a)
            .slice(0, 6)
            .map(([country, count]) => {
              const position = countryPositions[country];
              const threatColor = position ? getThreatColor(position.threat) : '#6b7280';
              
              return (
                <div key={country} className="text-center bg-slate-800/50 rounded-lg p-3 border border-slate-700 hover:bg-slate-800/70 hover:scale-105 transition-all duration-300 hover:shadow-lg backdrop-blur-sm">
                  <div 
                    className="text-xl sm:text-2xl font-bold mb-1 transition-colors duration-300"
                    style={{ color: threatColor }}
                  >
                    {count}
                  </div>
                  <div className="text-gray-300 text-xs sm:text-sm font-medium truncate">{country}</div>
                  {position && (
                    <Badge 
                      variant="outline" 
                      className="mt-2 text-xs px-2 py-1 transition-all duration-200 hover:scale-105"
                      style={{ 
                        borderColor: threatColor,
                        color: threatColor,
                        backgroundColor: `${threatColor}20`
                      }}
                    >
                      {position.threat.toUpperCase()}
                    </Badge>
                  )}
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorldMap;
