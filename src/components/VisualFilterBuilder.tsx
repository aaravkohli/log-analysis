import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Filter, Plus, X, Save, Clock, Download, Trash2, HelpCircle, FileText, User, ChevronDown, ChevronUp
} from 'lucide-react';
import { errorHandler } from '@/utils/errorHandler';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

// Types for filter builder
const COMPARATORS = [
  { value: '=', label: 'equals' },
  { value: '!=', label: 'not equals' },
  { value: '<', label: 'less than' },
  { value: '>', label: 'greater than' },
  { value: '<=', label: 'less than or equal' },
  { value: '>=', label: 'greater than or equal' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'not contains' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'ends_with', label: 'ends with' },
  { value: 'regex', label: 'regex match' },
];

const RELATIVE_TIMES = [
  { value: '15m', label: 'Last 15 minutes' },
  { value: '30m', label: 'Last 30 minutes' },
  { value: '1h', label: 'Last Hour' },
  { value: '3h', label: 'Last 3 Hours' },
  { value: '6h', label: 'Last 6 Hours' },
  { value: '12h', label: 'Last 12 Hours' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time' },
];

const TIME_UNITS = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
];

function inferFieldType(values: any[]): 'string' | 'number' | 'date' | 'boolean' | 'ip' {
  const sampleValues = values.filter(v => v != null && v !== '').slice(0, 100);
  
  for (const v of sampleValues) {
    if (typeof v === 'boolean') return 'boolean';
    if (typeof v === 'number') return 'number';
    
    const str = String(v);
    
    // Check for IP addresses
    if (/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(str)) {
      return 'ip';
    }
    
    // Check for dates (ISO format, common formats)
    if (!isNaN(Date.parse(str)) && str.length > 8) {
      return 'date';
    }
    
    // Check for numbers
    if (!isNaN(Number(str)) && str !== '') {
      return 'number';
    }
  }
  return 'string';
}

function getUniqueValues(arr: any[], key: string, maxValues = 50): string[] {
  const values = arr
    .map(row => row[key])
    .filter(v => v != null && v !== '')
    .map(v => String(v));
  
  const unique = Array.from(new Set(values));
  return unique.slice(0, maxValues).sort();
}

// CSV Export function
function exportToCSV(data: any[], filename: string = 'filtered_data.csv') {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const LOCAL_STORAGE_KEY = 'visual_filter_builder_saved_filters_v3';

export interface VisualFilterConfig {
  logic: 'AND' | 'OR';
  conditions: Array<{
    id: string;
    field: string;
    comparator: string;
    value: any;
    type: string;
    enabled: boolean;
  }>;
  timeMode?: 'relative' | 'absolute' | 'custom';
  relativeTime?: string;
  absoluteRange?: { from: string; to: string };
  customTime?: { value: number; unit: string };
  groupBy?: string[];
  sortBy?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
}

interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  config: VisualFilterConfig;
  createdAt: string;
  lastUsed?: string;
  isPreset?: boolean;
}

interface VisualFilterBuilderProps {
  logEntries: any[];
  onFilterChange: (filtered: any[], config: VisualFilterConfig) => void;
  presets?: SavedFilter[];
  className?: string;
}

const defaultConfig: VisualFilterConfig = {
  logic: 'AND',
  conditions: [],
  timeMode: 'relative',
  relativeTime: '24h',
  limit: 1000,
};

export const VisualFilterBuilder: React.FC<VisualFilterBuilderProps> = ({ 
  logEntries, 
  onFilterChange, 
  presets = [],
  className = ''
}) => {
  const availableFields = useMemo(() => {
    if (!logEntries || logEntries.length === 0) return [];
    
    const keys = Object.keys(logEntries[0] || {});
    return keys.map((key) => {
      const values = logEntries.map(row => row[key]).filter(v => v != null);
      const type = inferFieldType(values);
      const uniqueCount = new Set(values).size;
      const sampleValues = getUniqueValues(logEntries, key, 5);
      
      return { 
        key, 
        type, 
        uniqueCount,
        sampleValues,
        hasData: values.length > 0
      };
    }).filter(field => field.hasData).sort((a, b) => a.key.localeCompare(b.key));
  }, [logEntries]);

  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [savePopoverOpen, setSavePopoverOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [isPresetsExpanded, setIsPresetsExpanded] = useState(true);

  const isDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      try {
        setSavedFilters(JSON.parse(raw));
      } catch (error) {
        errorHandler.logError('Failed to load saved filters', 'VisualFilterBuilder', 'medium', 'FILTER_LOAD_ERROR', 'Try refreshing the page');
      }
    }
  }, []);

  const handleSave = () => {
    if (!saveName.trim()) return;
    const id = Date.now().toString();
    const newFilter: SavedFilter = {
      id,
      name: saveName,
      description: saveDescription,
      config,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };
    
    const newSaved = [...savedFilters, newFilter];
    setSavedFilters(newSaved);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSaved));
    setSavePopoverOpen(false);
    setSaveName('');
    setSaveDescription('');
  };

  const handleSaveKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  const deleteFilter = (id: string) => {
    const newSaved = savedFilters.filter(f => f.id !== id);
    setSavedFilters(newSaved);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSaved));
  };

  const loadFilter = (filter: SavedFilter) => {
    setConfig(filter.config);
    const updatedFilter = { ...filter, lastUsed: new Date().toISOString() };
    const newSaved = savedFilters.map(f => f.id === filter.id ? updatedFilter : f);
    setSavedFilters(newSaved);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSaved));
  };

  const [config, setConfig] = useState<VisualFilterConfig>(defaultConfig);
  const [showFieldSuggestions, setShowFieldSuggestions] = useState<string | null>(null);

  const filterFn = (row: any) => {
    if (config.timeMode === 'relative' && config.relativeTime && row.timestamp) {
      if (config.relativeTime !== 'all') {
        const entryTime = new Date(row.timestamp);
        const now = new Date();
        let cutoff = new Date();
        
        const timeMap: { [key: string]: () => void } = {
          '15m': () => cutoff.setMinutes(now.getMinutes() - 15),
          '30m': () => cutoff.setMinutes(now.getMinutes() - 30),
          '1h': () => cutoff.setHours(now.getHours() - 1),
          '3h': () => cutoff.setHours(now.getHours() - 3),
          '6h': () => cutoff.setHours(now.getHours() - 6),
          '12h': () => cutoff.setHours(now.getHours() - 12),
          '24h': () => cutoff.setHours(now.getHours() - 24),
          '7d': () => cutoff.setDate(now.getDate() - 7),
          '30d': () => cutoff.setDate(now.getDate() - 30),
          '90d': () => cutoff.setDate(now.getDate() - 90),
        };

        timeMap[config.relativeTime]?.();
        if (entryTime < cutoff) return false;
      }
    }
    
    if (config.timeMode === 'absolute' && config.absoluteRange?.from && config.absoluteRange?.to && row.timestamp) {
      const entryTime = new Date(row.timestamp);
      const from = new Date(config.absoluteRange.from);
      const to = new Date(config.absoluteRange.to);
      if (entryTime < from || entryTime > to) return false;
    }

    const enabledConditions = config.conditions.filter(c => c.enabled);
    if (enabledConditions.length === 0) return true;

    const results = enabledConditions.map((cond) => {
      const val = row[cond.field];
      if (val === null || val === undefined) return false;

      if (cond.type === 'date') {
        const entryDate = new Date(val);
        const filterDate = new Date(cond.value);
        const comparators: { [key: string]: boolean } = {
          '=': entryDate.getTime() === filterDate.getTime(),
          '!=': entryDate.getTime() !== filterDate.getTime(),
          '<': entryDate < filterDate,
          '>': entryDate > filterDate,
          '<=': entryDate <= filterDate,
          '>=': entryDate >= filterDate,
        };
        return comparators[cond.comparator] ?? false;
      }
      
      if (cond.type === 'number') {
        const numVal = Number(val);
        const numFilter = Number(cond.value);
        const comparators: { [key: string]: boolean } = {
          '=': numVal === numFilter,
          '!=': numVal !== numFilter,
          '<': numVal < numFilter,
          '>': numVal > numFilter,
          '<=': numVal <= numFilter,
          '>=': numVal >= numFilter,
        };
        return comparators[cond.comparator] ?? false;
      }
      
      if (cond.type === 'boolean') {
        return Boolean(val) === Boolean(cond.value);
      }
      
      const strVal = String(val).toLowerCase();
      const strFilter = String(cond.value).toLowerCase();
      const comparators: { [key: string]: boolean } = {
        '=': strVal === strFilter,
        '!=': strVal !== strFilter,
        'contains': strVal.includes(strFilter),
        'not_contains': !strVal.includes(strFilter),
        'starts_with': strVal.startsWith(strFilter),
        'ends_with': strVal.endsWith(strFilter),
        'regex': new RegExp(strFilter, 'i').test(strVal),
      };
      return comparators[cond.comparator] ?? false;
    });

    return config.logic === 'AND' ? results.every(Boolean) : results.some(Boolean);
  };

  const filtered = useMemo(() => {
    let result = logEntries.filter(filterFn);
    if (config.limit) {
      result = result.slice(0, config.limit);
    }
    return result;
  }, [logEntries, config]);

  useEffect(() => {
    onFilterChange(filtered, config);
  }, [filtered, config, onFilterChange]);

  const addCondition = () => {
    const newCondition = {
      id: Date.now().toString(),
      field: availableFields[0]?.key || '',
      comparator: '=',
      value: '',
      type: availableFields[0]?.type || 'string',
      enabled: true
    };
    setConfig({ ...config, conditions: [...config.conditions, newCondition] });
  };

  const removeCondition = (id: string) => {
    setConfig({ ...config, conditions: config.conditions.filter(c => c.id !== id) });
  };

  const updateCondition = (id: string, updates: Partial<VisualFilterConfig['conditions'][0]>) => {
    setConfig({ ...config, conditions: config.conditions.map(c => (c.id === id ? { ...c, ...updates } : c)) });
  };

  const renderConditionRow = (condition: VisualFilterConfig['conditions'][0]) => {
    const field = availableFields.find(f => f.key === condition.field);
    const comparators = field?.type === 'number' || field?.type === 'date'
      ? COMPARATORS.filter(c => ['=', '!=', '<', '>', '<=', '>='].includes(c.value))
      : COMPARATORS;
    const uniqueValues = field ? getUniqueValues(logEntries, field.key, 10) : [];

    return (
      <div key={condition.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr_auto] gap-2 items-center p-3 odd:bg-slate-800/20 even:bg-slate-800/40 rounded-lg">
        <Select 
          value={condition.field} 
          onValueChange={(value) => {
            const newField = availableFields.find(f => f.key === value);
            updateCondition(condition.id, { field: value, type: newField?.type || 'string', value: '' });
          }}
        >
          <SelectTrigger className="h-9"><SelectValue placeholder="Field" /></SelectTrigger>
          <SelectContent>{availableFields.map(f => <SelectItem key={f.key} value={f.key}>{f.key}</SelectItem>)}</SelectContent>
        </Select>

        <Select value={condition.comparator} onValueChange={(value) => updateCondition(condition.id, { comparator: value })}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Comparator" /></SelectTrigger>
          <SelectContent>{comparators.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
        </Select>

        <div className="relative">
          <Input
            value={condition.value || ''}
            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
            className="w-full h-9"
            placeholder={`Enter ${condition.type} value...`}
            type={condition.type === 'number' ? 'number' : 'text'}
            onFocus={() => setShowFieldSuggestions(condition.id)}
            onBlur={() => setTimeout(() => setShowFieldSuggestions(null), 200)}
          />
          {showFieldSuggestions === condition.id && uniqueValues.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-slate-800 border border-slate-600 rounded-md mt-1 z-50 max-h-40 overflow-y-auto">
              {uniqueValues.map(value => (
                <div key={value} className="px-3 py-2 hover:bg-slate-700 cursor-pointer text-sm" onClick={() => {
                  updateCondition(condition.id, { value });
                  setShowFieldSuggestions(null);
                }}>{value}</div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
            <Checkbox checked={condition.enabled} onCheckedChange={(checked) => updateCondition(condition.id, { enabled: !!checked })} />
            <Button variant="ghost" size="icon" onClick={() => removeCondition(condition.id)} className="text-red-400 hover:text-red-300 h-8 w-8">
                <X className="h-4 w-4" />
            </Button>
        </div>
      </div>
    );
  };

  const SaveFilterForm = ({ isDrawer = false }) => (
    <div className="grid gap-4 py-4">
      {!isDrawer && (
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Save Filter</h4>
          <p className="text-sm text-muted-foreground">
            Save the current filter configuration for future use.
          </p>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor={`filter-name-${isDrawer ? 'drawer' : 'popover'}`}>
          Name
        </Label>
        <Input
          id={`filter-name-${isDrawer ? 'drawer' : 'popover'}`}
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          placeholder="e.g., 'Failed Logins from Bots'"
          className="bg-slate-700 border-slate-600 text-white h-9"
          onKeyDown={handleSaveKeyDown}
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label
          htmlFor={`filter-description-${isDrawer ? 'drawer' : 'popover'}`}
        >
          Description (Optional)
        </Label>
        <Input
          id={`filter-description-${isDrawer ? 'drawer' : 'popover'}`}
          value={saveDescription}
          onChange={(e) => setSaveDescription(e.target.value)}
          placeholder="A brief summary of what this filter does"
          className="bg-slate-700 border-slate-600 text-white h-9"
          onKeyDown={handleSaveKeyDown}
        />
      </div>
      {!isDrawer && (
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={() => setSavePopoverOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!saveName.trim()}>
            Save
          </Button>
        </div>
      )}
    </div>
  );

  const SaveFilterDialog = () => {
    if (isDesktop) {
      return (
        <Popover open={savePopoverOpen} onOpenChange={setSavePopoverOpen}>
          <PopoverTrigger asChild>
            <Button size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save Filter
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 bg-slate-800 border-slate-600 text-white p-4">
            <SaveFilterForm />
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <Drawer open={savePopoverOpen} onOpenChange={setSavePopoverOpen}>
        <DrawerTrigger asChild>
          <Button size="sm" className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Filter
          </Button>
        </DrawerTrigger>
        <DrawerContent className="bg-slate-900 border-slate-700 text-white">
          <DrawerHeader className="text-left">
            <DrawerTitle>Save Current Filter</DrawerTitle>
            <DrawerDescription>
              Give this filter set a name for later use.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4">
            <SaveFilterForm isDrawer={true} />
          </div>
          <DrawerFooter className="pt-2 flex-row gap-2">
            <Button
              onClick={handleSave}
              disabled={!saveName.trim()}
              className="flex-1"
            >
              Save
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  };

  return (
    <TooltipProvider>
      <div className={`space-y-6 ${className}`}>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Visual Filter Builder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 border border-slate-700/50 rounded-lg bg-slate-900/20">
              <h3 className="text-md font-medium text-gray-300 mb-4 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-blue-400" />
                Time Range
              </h3>
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <Select value={config.timeMode || 'relative'} onValueChange={(value) => setConfig({ ...config, timeMode: value as any })}>
                  <SelectTrigger className="w-full sm:w-32 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="relative">Relative</SelectItem><SelectItem value="absolute">Absolute</SelectItem></SelectContent>
                </Select>
                {config.timeMode === 'relative' && (
                  <Select value={config.relativeTime || '24h'} onValueChange={(value) => setConfig({ ...config, relativeTime: value })}>
                    <SelectTrigger className="w-full sm:w-48 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{RELATIVE_TIMES.map(time => <SelectItem key={time.value} value={time.value}>{time.label}</SelectItem>)}</SelectContent>
                  </Select>
                )}
                {config.timeMode === 'absolute' && (
                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                    <Input type="datetime-local" value={config.absoluteRange?.from || ''} onChange={(e) => setConfig({ ...config, absoluteRange: { ...config.absoluteRange, from: e.target.value } })} className="w-full h-9" />
                    <span className="text-gray-400 hidden sm:inline">to</span>
                    <Input type="datetime-local" value={config.absoluteRange?.to || ''} onChange={(e) => setConfig({ ...config, absoluteRange: { ...config.absoluteRange, to: e.target.value } })} className="w-full h-9" />
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border border-slate-700/50 rounded-lg bg-slate-900/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h3 className="text-md font-medium text-gray-300 flex items-center">Where</h3>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Logic:</span>
                  <Select value={config.logic} onValueChange={(value) => setConfig({ ...config, logic: value as 'AND' | 'OR' })}>
                    <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="AND">AND</SelectItem><SelectItem value="OR">OR</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                {config.conditions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-slate-700 rounded-lg">
                    <Filter className="h-8 w-8 mx-auto mb-2 text-slate-500" />
                    <p>No filter conditions set</p>
                    <p className="text-sm">Click "Add Condition" to start filtering</p>
                  </div>
                ) : (
                  <>
                    <div className="hidden md:grid grid-cols-[1fr_1fr_2fr_auto] gap-2 text-xs text-gray-400 font-medium uppercase px-3">
                        <span>Field</span>
                        <span>Operator</span>
                        <span>Value</span>
                        <span className="text-right">Enabled</span>
                    </div>
                    {config.conditions.map(renderConditionRow)}
                  </>
                )}
              </div>
              <Button onClick={addCondition} variant="outline" className="w-full mt-4 border-dashed border-slate-600 hover:border-purple-500 h-9">
                <Plus className="h-4 w-4 mr-2" /> Add Condition
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-700/50 gap-2">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm">{filtered.length.toLocaleString()} results</Badge>
                    <Badge variant="outline" className="text-sm">{config.conditions.filter(c => c.enabled).length} active filters</Badge>
                </div>
                <div className="flex items-center gap-2">
                    <SaveFilterDialog />
                    <Button size="sm" variant="link" onClick={() => setConfig(defaultConfig)}>Reset</Button>
                </div>
            </div>
          </CardContent>
        </Card>

        <Collapsible
          open={isPresetsExpanded}
          onOpenChange={setIsPresetsExpanded}
          className="rounded-lg border border-slate-700/50 bg-slate-800/50"
        >
          <CollapsibleTrigger asChild>
            <div className="flex cursor-pointer items-center justify-between p-4 rounded-t-lg transition-colors hover:bg-slate-800/60">
              <CardTitle className="text-lg font-semibold text-white">Saved Filters & Presets</CardTitle>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                {isPresetsExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                <span className="sr-only">Toggle</span>
              </Button>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t border-slate-700/50 p-4">
              <div className="flex flex-wrap gap-2">
                {savedFilters.map((filter) => (
                  <Tooltip key={filter.id}>
                    <TooltipTrigger asChild>
                      <div 
                        className="group flex items-center gap-2 bg-slate-700/50 border border-slate-600 px-3 py-1 rounded-full h-8 transition-colors hover:border-purple-500 cursor-pointer"
                        onClick={() => loadFilter(filter)}
                      >
                        <User className="h-4 w-4 text-purple-400 flex-shrink-0" />
                        <span className="text-white text-sm font-medium truncate">{filter.name}</span>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 text-red-500/70 hover:text-red-500 opacity-50 group-hover:opacity-100" 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent loading filter when deleting
                            deleteFilter(filter.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-900 border-slate-700 text-white shadow-lg">
                      <div className="p-1 space-y-1">
                        <p className="font-bold text-white">{filter.name}</p>
                        {filter.description && (
                          <p className="text-slate-400 max-w-xs">{filter.description}</p>
                        )}
                        <p className="text-xs text-slate-500 pt-1">
                          Saved on: {new Date(filter.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}

                {presets.map((preset) => (
                  <Tooltip key={preset.id}>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 hover:bg-purple-500/10 hover:border-purple-500" 
                        onClick={() => loadFilter(preset)}
                      >
                        {preset.name}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-900 border-slate-700 text-white shadow-lg">
                      <div className="p-1 space-y-1">
                        <p className="font-bold text-white">{preset.name}</p>
                        {preset.description && (
                           <p className="text-slate-400 max-w-xs">{preset.description}</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </TooltipProvider>
  );
}; 