
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Globe } from 'lucide-react';

interface WorldMapProps {
  logEntries: any[];
}

const WorldMap = ({ logEntries }: WorldMapProps) => {
  // Calculate country positions for visualization
  const countryPositions: Record<string, { x: number; y: number; color: string }> = {
    'United States': { x: 25, y: 40, color: '#22c55e' },
    'China': { x: 75, y: 35, color: '#ef4444' },
    'Russia': { x: 65, y: 25, color: '#ef4444' },
    'Germany': { x: 52, y: 30, color: '#22c55e' },
    'Brazil': { x: 35, y: 70, color: '#f59e0b' },
    'United Kingdom': { x: 48, y: 28, color: '#22c55e' },
  };

  // Get activity by country with proper type handling
  const countryActivity = logEntries.reduce((acc, entry) => {
    const country = typeof entry.country === 'string' ? entry.country : null;
    if (country && countryPositions[country]) {
      acc[country] = (acc[country] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const activityValues = Object.values(countryActivity).filter((val): val is number => typeof val === 'number');
  const maxActivity = activityValues.length > 0 ? Math.max(...activityValues) : 1;

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Globe className="h-5 w-5 mr-2" />
          Global SSH Activity Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-[400px] bg-slate-900 rounded-lg overflow-hidden">
          {/* Simple world map background */}
          <div className="absolute inset-0 opacity-20">
            <svg viewBox="0 0 100 60" className="w-full h-full">
              {/* Simplified world map paths */}
              <path
                d="M20,25 L30,20 L35,25 L40,30 L35,35 L25,40 L20,35 Z" // North America
                fill="#374151"
                stroke="#4b5563"
                strokeWidth="0.5"
              />
              <path
                d="M45,20 L55,25 L60,30 L55,35 L50,40 L45,35 Z" // Europe
                fill="#374151"
                stroke="#4b5563"
                strokeWidth="0.5"
              />
              <path
                d="M65,20 L80,25 L85,35 L75,40 L65,35 Z" // Asia
                fill="#374151"
                stroke="#4b5563"
                strokeWidth="0.5"
              />
              <path
                d="M30,50 L40,45 L45,55 L35,60 L30,55 Z" // South America
                fill="#374151"
                stroke="#4b5563"
                strokeWidth="0.5"
              />
            </svg>
          </div>

          {/* Activity markers */}
          {Object.entries(countryActivity).map(([country, count]) => {
            const position = countryPositions[country];
            if (!position || typeof count !== 'number') return null;

            const size = Math.max(8, (count / maxActivity) * 20);
            const pulseIntensity = count / maxActivity;

            return (
              <div
                key={country}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                }}
              >
                <div
                  className="rounded-full animate-pulse"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: position.color,
                    boxShadow: `0 0 ${size}px ${position.color}`,
                    opacity: 0.8 + pulseIntensity * 0.2,
                  }}
                />
                <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <Badge variant="secondary" className="text-xs">
                    <MapPin className="h-2 w-2 mr-1" />
                    {count}
                  </Badge>
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-slate-800/80 rounded-lg p-3">
            <h4 className="text-white text-sm font-medium mb-2">Activity Legend</h4>
            <div className="space-y-1">
              <div className="flex items-center text-xs">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-gray-300">Allowed Countries</span>
              </div>
              <div className="flex items-center text-xs">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <span className="text-gray-300">Restricted Countries</span>
              </div>
              <div className="flex items-center text-xs">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-gray-300">Monitored Countries</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(countryActivity)
            .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
            .sort(([,a], [,b]) => b - a)
            .slice(0, 4)
            .map(([country, count]) => (
              <div key={country} className="text-center">
                <div className="text-2xl font-bold text-white">{count}</div>
                <div className="text-gray-400 text-sm">{country}</div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorldMap;
