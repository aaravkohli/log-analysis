
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Filter, Save, Trash2, Clock } from 'lucide-react';
import { logFilterManager, type LogFilter, type SavedFilter } from '@/utils/logFilters';

interface LogSearchPanelProps {
  logEntries: any[];
}

const LogSearchPanel = ({ logEntries }: LogSearchPanelProps) => {
  const [filter, setFilter] = useState<LogFilter>({
    searchTerm: '',
    status: 'all',
    timeRange: '24h',
    country: 'all',
    ipAddress: '',
    username: ''
  });
  const [filteredLogs, setFilteredLogs] = useState(logEntries);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [uniqueCountries, setUniqueCountries] = useState<string[]>([]);

  useEffect(() => {
    const filtered = logFilterManager.filterLogs(logEntries, filter);
    setFilteredLogs(filtered);
  }, [logEntries, filter]);

  useEffect(() => {
    setSavedFilters(logFilterManager.getSavedFilters());
    setUniqueCountries(logFilterManager.getUniqueCountries(logEntries));
  }, [logEntries]);

  const handleFilterChange = (key: keyof LogFilter, value: string) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveFilter = () => {
    if (saveFilterName.trim()) {
      logFilterManager.saveFilter(filter, saveFilterName);
      setSavedFilters(logFilterManager.getSavedFilters());
      setSaveFilterName('');
      setShowSaveInput(false);
    }
  };

  const handleLoadFilter = (savedFilter: SavedFilter) => {
    const { id, name, createdAt, ...filterData } = savedFilter;
    setFilter(filterData);
  };

  const handleDeleteFilter = (id: string) => {
    logFilterManager.deleteFilter(id);
    setSavedFilters(logFilterManager.getSavedFilters());
  };

  const clearFilter = () => {
    setFilter({
      searchTerm: '',
      status: 'all',
      timeRange: '24h',
      country: 'all',
      ipAddress: '',
      username: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Log Search & Filtering
            <Badge variant="secondary" className="ml-2">
              {filteredLogs.length} results
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Search Term</label>
              <input
                type="text"
                value={filter.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                placeholder="Search users, IPs, countries..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Status</label>
              <select
                value={filter.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
              >
                <option value="all">All Status</option>
                <option value="success">Success Only</option>
                <option value="failed">Failed Only</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Time Range</label>
              <select
                value={filter.timeRange}
                onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Country</label>
              <select
                value={filter.country}
                onChange={(e)=> handleFilterChange('country', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
              >
                <option value="all">All Countries</option>
                {uniqueCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">IP Address</label>
              <input
                type="text"
                value={filter.ipAddress}
                onChange={(e) => handleFilterChange('ipAddress', e.target.value)}
                placeholder="Filter by IP..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Username</label>
              <input
                type="text"
                value={filter.username}
                onChange={(e) => handleFilterChange('username', e.target.value)}
                placeholder="Filter by username..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={clearFilter} variant="outline" size="sm">
              Clear All
            </Button>
            <Button 
              onClick={() => setShowSaveInput(true)} 
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Filter
            </Button>
          </div>

          {showSaveInput && (
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={saveFilterName}
                onChange={(e) => setSaveFilterName(e.target.value)}
                placeholder="Filter name..."
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400"
              />
              <Button onClick={handleSaveFilter} size="sm">Save</Button>
              <Button onClick={() => setShowSaveInput(false)} variant="outline" size="sm">Cancel</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saved Filters */}
      {savedFilters.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Saved Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {savedFilters.map(savedFilter => (
                <div key={savedFilter.id} className="flex items-center gap-2 bg-slate-700 px-3 py-2 rounded-md">
                  <span className="text-white text-sm">{savedFilter.name}</span>
                  <Button
                    onClick={() => handleLoadFilter(savedFilter)}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                  >
                    <Filter className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteFilter(savedFilter.id)}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtered Results */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Search Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                      {log.status}
                    </Badge>
                    <div className="text-white font-mono text-sm">{log.ip}</div>
                    <div className="text-gray-400 text-sm">{log.user}</div>
                    {log.country && (
                      <div className="text-blue-400 text-sm">{log.country}</div>
                    )}
                  </div>
                  <div className="flex items-center text-gray-400 text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
              {filteredLogs.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  No logs match your search criteria
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default LogSearchPanel;
