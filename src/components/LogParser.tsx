import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Search, Filter, Download, MapPin, AlertTriangle } from 'lucide-react';

interface LogParserProps {
  logEntries: any[];
  isMonitoring: boolean;
}

const LogParser = ({ logEntries, isMonitoring }: LogParserProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredLogs = logEntries.filter(entry => {
    const matchesSearch = (entry.ip || '').includes(searchTerm) || 
                         (entry.user || '').includes(searchTerm) || 
                         (entry.timestamp || '').includes(searchTerm) ||
                         (entry.country || '').includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || entry.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'success' ? 'default' : 'destructive';
    const color = status === 'success' ? 'text-green-400' : 'text-red-400';
    return <Badge variant={variant} className={color}>{status.toUpperCase()}</Badge>;
  };

  const exportLogs = () => {
    const csv = [
      'Timestamp,IP Address,Username,Status,Port,Country',
      ...filteredLogs.map(log => 
        `${log.timestamp},${log.ip},${log.user},${log.status},${log.port},${log.country || 'Unknown'}`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ssh_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Check for suspicious locations
  const suspiciousCountries = filteredLogs.filter(log => 
    log.country && !['United States', 'United Kingdom', 'Germany', 'India'].includes(log.country)
  );

  return (
    <div className="space-y-6">
      {/* Geo Alert */}
      {suspiciousCountries.length > 0 && (
        <Alert className="border-yellow-500 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-300">
            <strong>Geo-fencing Alert:</strong> {suspiciousCountries.length} login attempts detected from unexpected countries
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            SSH Authentication Logs
            <Badge variant="secondary" className="ml-2">
              <MapPin className="h-3 w-3 mr-1" />
              Geo-enabled
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by IP, username, country, or timestamp..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
              >
                <option value="all">All Status</option>
                <option value="success">Success Only</option>
                <option value="failed">Failed Only</option>
              </select>
              <Button
                onClick={exportLogs}
                variant="outline"
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-gray-400">
              Showing {filteredLogs.length} of {logEntries.length} entries
            </p>
            {isMonitoring && (
              <Badge className="bg-green-600">
                <div className="w-2 h-2 bg-green-200 rounded-full mr-2 animate-pulse"></div>
                Live Monitoring
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <ScrollArea className="h-[600px]">
          <div className="p-4 space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No log entries found matching your criteria
              </div>
            ) : (
              filteredLogs.map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Timestamp</p>
                      <p className="text-white text-sm font-mono">
                        {formatTimestamp(entry.timestamp)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">IP Address</p>
                      <p className="text-blue-400 text-sm font-mono">{entry.ip}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Username</p>
                      <p className="text-white text-sm font-mono">{entry.user}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Location</p>
                      <div className="flex items-center space-x-2">
                        {entry.flag && <span className="text-lg">{entry.flag}</span>}
                        <p className="text-green-400 text-sm">{entry.country || 'Unknown'}</p>
                      </div>
                      {entry.city && (
                        <p className="text-gray-500 text-xs">{entry.city}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Status</p>
                      {getStatusBadge(entry.status)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs">Port {entry.port}</p>
                    {!['United States', 'United Kingdom', 'Germany', 'India'].includes(entry.country) && entry.country && (
                      <Badge variant="destructive" className="text-xs mt-1">
                        <AlertTriangle className="h-2 w-2 mr-1" />
                        Alert
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};

export default LogParser;
