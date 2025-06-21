import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Shield, Zap, Target, Settings } from 'lucide-react';

interface ThreatDetectorProps {
  logEntries: any[];
  threats: any[];
  setThreats: (threats: any[]) => void;
}

interface AttemptData {
  failed: number;
  total: number;
  users: Set<string>;
}

interface UserAttemptData {
  failed: number;
  total: number;
  ips: Set<string>;
}

const ThreatDetector = ({ logEntries, threats, setThreats }: ThreatDetectorProps) => {
  const [detectionRules, setDetectionRules] = useState({
    bruteForceThreshold: 5,
    timeWindowMinutes: 5,
    suspiciousUsernames: ['admin', 'root', 'test', 'guest', 'ubuntu', 'pi'],
    enableGeoDetection: true,
    enableRateLimiting: true,
    rateLimitThreshold: 10,
    enableAnomalyDetection: true,
    anomalyThreshold: 3
  });

  // Enhanced threat detection logic
  useEffect(() => {
    const detectThreats = () => {
      const newThreats = [];
      const ipAttempts: Record<string, AttemptData> = {};
      const userAttempts: Record<string, UserAttemptData> = {};
      const currentTime = new Date();

      // Group attempts by IP and time window
      logEntries.forEach(entry => {
        const entryTime = new Date(entry.timestamp);
        const timeDiff = (currentTime.getTime() - entryTime.getTime()) / (1000 * 60); // minutes

        if (timeDiff <= detectionRules.timeWindowMinutes) {
          // Track IP attempts
          if (!ipAttempts[entry.ip]) {
            ipAttempts[entry.ip] = { failed: 0, total: 0, users: new Set() };
          }
          ipAttempts[entry.ip].total++;
          ipAttempts[entry.ip].users.add(entry.user);
          if (entry.status === 'failed') {
            ipAttempts[entry.ip].failed++;
          }

          // Track user attempts
          if (!userAttempts[entry.user]) {
            userAttempts[entry.user] = { failed: 0, total: 0, ips: new Set() };
          }
          userAttempts[entry.user].total++;
          userAttempts[entry.user].ips.add(entry.ip);
          if (entry.status === 'failed') {
            userAttempts[entry.user].failed++;
          }
        }
      });

      // Detect brute force attacks
      Object.entries(ipAttempts).forEach(([ip, data]) => {
        if (data.failed >= detectionRules.bruteForceThreshold) {
          newThreats.push({
            id: `brute-${ip}-${Date.now()}`,
            type: 'Brute Force Attack',
            ip,
            severity: data.failed > 10 ? 'HIGH' : 'MEDIUM',
            description: `${data.failed} failed login attempts in ${detectionRules.timeWindowMinutes} minutes`,
            timestamp: new Date().toISOString(),
            details: {
              failedAttempts: data.failed,
              totalAttempts: data.total,
              uniqueUsers: data.users.size
            }
          });
        }
      });

      // Detect credential stuffing
      Object.entries(ipAttempts).forEach(([ip, data]) => {
        if (data.users.size >= 3 && data.failed > 0) {
          newThreats.push({
            id: `cred-${ip}-${Date.now()}`,
            type: 'Credential Stuffing',
            ip,
            severity: 'MEDIUM',
            description: `Multiple username attempts (${data.users.size} users) from single IP`,
            timestamp: new Date().toISOString(),
            details: {
              usernames: Array.from(data.users),
              attempts: data.total
            }
          });
        }
      });

      // Detect suspicious usernames
      detectionRules.suspiciousUsernames.forEach(suspiciousUser => {
        if (userAttempts[suspiciousUser] && userAttempts[suspiciousUser].failed > 0) {
          newThreats.push({
            id: `suspicious-${suspiciousUser}-${Date.now()}`,
            type: 'Suspicious Username',
            ip: Array.from(userAttempts[suspiciousUser].ips)[0],
            severity: 'LOW',
            description: `Login attempts with privileged username: ${suspiciousUser}`,
            timestamp: new Date().toISOString(),
            details: {
              username: suspiciousUser,
              attempts: userAttempts[suspiciousUser].total,
              uniqueIPs: userAttempts[suspiciousUser].ips.size
            }
          });
        }
      });

      // Detect rate limiting violations
      if (detectionRules.enableRateLimiting) {
        Object.entries(ipAttempts).forEach(([ip, data]) => {
          if (data.total >= detectionRules.rateLimitThreshold) {
            newThreats.push({
              id: `rate-${ip}-${Date.now()}`,
              type: 'Rate Limit Violation',
              ip,
              severity: 'MEDIUM',
              description: `Excessive connection attempts (${data.total}) in ${detectionRules.timeWindowMinutes} minutes`,
              timestamp: new Date().toISOString(),
              details: {
                totalAttempts: data.total,
                timeWindow: detectionRules.timeWindowMinutes
              }
            });
          }
        });
      }

      // Detect anomaly patterns
      if (detectionRules.enableAnomalyDetection) {
        Object.entries(ipAttempts).forEach(([ip, data]) => {
          const failureRate = data.total > 0 ? (data.failed / data.total) * 100 : 0;
          if (failureRate >= 80 && data.total >= detectionRules.anomalyThreshold) {
            newThreats.push({
              id: `anomaly-${ip}-${Date.now()}`,
              type: 'Anomaly Detection',
              ip,
              severity: 'HIGH',
              description: `Unusual failure rate (${failureRate.toFixed(1)}%) detected`,
              timestamp: new Date().toISOString(),
              details: {
                failureRate: failureRate.toFixed(1),
                totalAttempts: data.total,
                failedAttempts: data.failed
              }
            });
          }
        });
      }

      // Update threats (keep only recent ones)
      const recentThreats = [...threats, ...newThreats].filter(threat => {
        const threatTime = new Date(threat.timestamp);
        const timeDiff = (currentTime.getTime() - threatTime.getTime()) / (1000 * 60);
        return timeDiff <= 60; // Keep threats from last hour
      });

      if (newThreats.length > 0) {
        setThreats(recentThreats);
      }
    };

    const interval = setInterval(detectThreats, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [logEntries, detectionRules, threats, setThreats]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'text-red-400 bg-red-900/20';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-900/20';
      case 'LOW': return 'text-blue-400 bg-blue-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getThreatIcon = (type: string) => {
    switch (type) {
      case 'Brute Force Attack': return <Zap className="h-4 w-4" />;
      case 'Credential Stuffing': return <Target className="h-4 w-4" />;
      case 'Suspicious Username': return <AlertTriangle className="h-4 w-4" />;
      case 'Rate Limit Violation': return <Shield className="h-4 w-4" />;
      case 'Anomaly Detection': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Detection Settings */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Detection Rules Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Brute Force Threshold (failed attempts)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={detectionRules.bruteForceThreshold}
                onChange={(e) => setDetectionRules({
                  ...detectionRules,
                  bruteForceThreshold: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Time Window (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={detectionRules.timeWindowMinutes}
                onChange={(e) => setDetectionRules({
                  ...detectionRules,
                  timeWindowMinutes: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Rate Limit Threshold (total attempts)
              </label>
              <input
                type="number"
                min="5"
                max="50"
                value={detectionRules.rateLimitThreshold}
                onChange={(e) => setDetectionRules({
                  ...detectionRules,
                  rateLimitThreshold: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Anomaly Threshold (minimum attempts)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={detectionRules.anomalyThreshold}
                onChange={(e) => setDetectionRules({
                  ...detectionRules,
                  anomalyThreshold: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-600">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enableRateLimiting"
                checked={detectionRules.enableRateLimiting}
                onChange={(e) => setDetectionRules({
                  ...detectionRules,
                  enableRateLimiting: e.target.checked
                })}
                className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="enableRateLimiting" className="text-gray-300 text-sm">
                Enable Rate Limiting
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enableAnomalyDetection"
                checked={detectionRules.enableAnomalyDetection}
                onChange={(e) => setDetectionRules({
                  ...detectionRules,
                  enableAnomalyDetection: e.target.checked
                })}
                className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="enableAnomalyDetection" className="text-gray-300 text-sm">
                Enable Anomaly Detection
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enableGeoDetection"
                checked={detectionRules.enableGeoDetection}
                onChange={(e) => setDetectionRules({
                  ...detectionRules,
                  enableGeoDetection: e.target.checked
                })}
                className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="enableGeoDetection" className="text-gray-300 text-sm">
                Enable Geo Detection
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Threat Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">High Severity</p>
                <p className="text-2xl font-bold text-red-400">
                  {threats.filter(t => t.severity === 'HIGH').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Medium Severity</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {threats.filter(t => t.severity === 'MEDIUM').length}
                </p>
              </div>
              <Target className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Low Severity</p>
                <p className="text-2xl font-bold text-blue-400">
                  {threats.filter(t => t.severity === 'LOW').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Threats */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
            Detected Threats ({threats.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {threats.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Shield className="h-12 w-12 mx-auto mb-4 text-green-400" />
                <p>No threats detected</p>
                <p className="text-sm">Your system appears to be secure</p>
              </div>
            ) : (
              <div className="space-y-3">
                {threats.map((threat) => (
                  <div
                    key={threat.id}
                    className="p-4 bg-slate-700/30 rounded-lg border-l-4 border-red-500"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          {getThreatIcon(threat.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-white font-medium">{threat.type}</h3>
                            <Badge className={getSeverityColor(threat.severity)}>
                              {threat.severity}
                            </Badge>
                          </div>
                          <p className="text-gray-300 text-sm mb-2">{threat.description}</p>
                          <div className="text-xs text-gray-400 space-y-1">
                            <p>IP: <span className="text-blue-400">{threat.ip}</span></p>
                            <p>Time: {new Date(threat.timestamp).toLocaleString()}</p>
                            {threat.details && (
                              <div className="mt-2 p-2 bg-slate-800 rounded">
                                <pre className="text-xs text-gray-300">
                                  {JSON.stringify(threat.details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
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

export default ThreatDetector;
