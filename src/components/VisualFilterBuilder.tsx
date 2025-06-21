import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { format, parseISO } from 'date-fns';
import { Info, Trash2, Edit2, Plus, Save, X, HelpCircle, Filter } from 'lucide-react';

// Types for filter builder
const COMPARATORS = [
  { value: '=', label: '=', desc: 'Equals' },
  { value: '!=', label: '≠', desc: 'Not equal' },
  { value: '<', label: '<', desc: 'Less than' },
  { value: '>', label: '>', desc: 'Greater than' },
  { value: 'contains', label: 'contains', desc: 'Contains substring' },
  { value: 'not_contains', label: 'not contains', desc: 'Does not contain substring' },
];

const RELATIVE_TIMES = [
  { value: '1h', label: 'Last Hour' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: 'all', label: 'All Time' },
];

function inferFieldType(values: any[]): 'string' | 'number' | 'date' | 'boolean' {
  for (const v of values) {
    if (v == null) continue;
    if (typeof v === 'boolean') return 'boolean';
    if (!isNaN(Date.parse(v))) return 'date';
    if (!isNaN(Number(v)) && v !== '') return 'number';
  }
  return 'string';
}

function getUniqueValues(arr: any[], key: string) {
  return Array.from(new Set(arr.map((row) => row[key]).filter((v) => v != null && v !== '')));
}

const LOCAL_STORAGE_KEY = 'visual_filter_builder_saved_filters_v1';

export interface VisualFilterConfig {
  logic: 'AND' | 'OR';
  conditions: Array<{
    field: string;
    comparator: string;
    value: any;
    type: string;
  }>;
  timeMode?: 'relative' | 'absolute';
  relativeTime?: string;
  absoluteRange?: { from: string; to: string };
}

interface SavedFilter {
  id: string;
  name: string;
  config: VisualFilterConfig;
}

interface VisualFilterBuilderProps {
  logEntries: any[];
  onFilterChange: (filtered: any[], config: VisualFilterConfig) => void;
  presets?: SavedFilter[];
}

const defaultConfig: VisualFilterConfig = {
  logic: 'AND',
  conditions: [],
  timeMode: 'relative',
  relativeTime: '24h',
};

export const VisualFilterBuilder: React.FC<VisualFilterBuilderProps> = ({ logEntries, onFilterChange, presets = [] }) => {
  // Detect available fields and their types
  const availableFields = useMemo(() => {
    if (!logEntries || logEntries.length === 0) return [];
    const keys = Object.keys(logEntries[0]);
    return keys.map((key) => {
      const type = inferFieldType(logEntries.map((row) => row[key]));
      return { key, type };
    });
  }, [logEntries]);

  // Saved filters (localStorage)
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  useEffect(() => {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      try {
        setSavedFilters(JSON.parse(raw));
      } catch {}
    }
  }, []);
  const saveFilter = (name: string, config: VisualFilterConfig) => {
    const id = Date.now().toString();
    const newSaved = [...savedFilters, { id, name, config }];
    setSavedFilters(newSaved);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSaved));
  };
  const deleteFilter = (id: string) => {
    const newSaved = savedFilters.filter((f) => f.id !== id);
    setSavedFilters(newSaved);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSaved));
  };

  // Filter config state
  const [config, setConfig] = useState<VisualFilterConfig>(defaultConfig);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  // Filtering logic
  const filterFn = (row: any) => {
    // Time filter
    if (config.timeMode === 'relative' && config.relativeTime && row.timestamp) {
      if (config.relativeTime !== 'all') {
        const entryTime = new Date(row.timestamp);
        const now = new Date();
        let cutoff = new Date();
        if (config.relativeTime === '1h') cutoff.setHours(now.getHours() - 1);
        if (config.relativeTime === '24h') cutoff.setHours(now.getHours() - 24);
        if (config.relativeTime === '7d') cutoff.setDate(now.getDate() - 7);
        if (entryTime < cutoff) return false;
      }
    }
    if (config.timeMode === 'absolute' && config.absoluteRange && row.timestamp) {
      const entryTime = new Date(row.timestamp);
      const from = new Date(config.absoluteRange.from);
      const to = new Date(config.absoluteRange.to);
      if (entryTime < from || entryTime > to) return false;
    }
    // Compound conditions
    const results = config.conditions.map((cond) => {
      const val = row[cond.field];
      if (cond.type === 'date') {
        if (!val) return false;
        const entryDate = new Date(val);
        const filterDate = new Date(cond.value);
        if (cond.comparator === '=') return entryDate.getTime() === filterDate.getTime();
        if (cond.comparator === '!=') return entryDate.getTime() !== filterDate.getTime();
        if (cond.comparator === '<') return entryDate < filterDate;
        if (cond.comparator === '>') return entryDate > filterDate;
        return false;
      }
      if (cond.type === 'number') {
        const numVal = Number(val);
        const numFilter = Number(cond.value);
        if (cond.comparator === '=') return numVal === numFilter;
        if (cond.comparator === '!=') return numVal !== numFilter;
        if (cond.comparator === '<') return numVal < numFilter;
        if (cond.comparator === '>') return numVal > numFilter;
        return false;
      }
      if (cond.type === 'boolean') {
        return Boolean(val) === Boolean(cond.value);
      }
      // string
      if (cond.comparator === '=') return val === cond.value;
      if (cond.comparator === '!=') return val !== cond.value;
      if (cond.comparator === 'contains') return (val || '').toString().toLowerCase().includes((cond.value || '').toString().toLowerCase());
      if (cond.comparator === 'not_contains') return !(val || '').toString().toLowerCase().includes((cond.value || '').toString().toLowerCase());
      return false;
    });
    return config.logic === 'AND' ? results.every(Boolean) : results.some(Boolean);
  };

  // Apply filter
  const filtered = useMemo(() => logEntries.filter(filterFn), [logEntries, config]);
  useEffect(() => {
    onFilterChange(filtered, config);
    // eslint-disable-next-line
  }, [filtered, config]);

  // Human-readable summary
  const summary = useMemo(() => {
    const conds = config.conditions.map((c) => {
      let val = c.value;
      if (c.type === 'date' && val) val = format(new Date(val), 'yyyy-MM-dd HH:mm');
      return `${c.field} ${c.comparator} ${val}`;
    });
    let time = '';
    if (config.timeMode === 'relative' && config.relativeTime && config.relativeTime !== 'all') {
      time = `Time: ${RELATIVE_TIMES.find((t) => t.value === config.relativeTime)?.label}`;
    }
    if (config.timeMode === 'absolute' && config.absoluteRange) {
      time = `Time: ${format(new Date(config.absoluteRange.from), 'yyyy-MM-dd')} to ${format(new Date(config.absoluteRange.to), 'yyyy-MM-dd')}`;
    }
    return [time, ...conds].filter(Boolean).join(' AND ');
  }, [config]);

  // UI for a single filter row (table style, inline editing)
  const renderConditionRow = (cond: any, idx: number) => {
    const field = availableFields.find((f) => f.key === cond.field);
    const comparators = field?.type === 'number' || field?.type === 'date'
      ? COMPARATORS.filter((c) => ['=', '!=', '<', '>'].includes(c.value))
      : COMPARATORS;
    const isEditing = editingIdx === idx;
    return (
      <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-800/40' : 'bg-slate-800/60'} style={{ transition: 'background 0.2s' }}>
        {/* Field */}
        <td className="px-2 py-1 align-middle">
          {isEditing ? (
            <Select value={cond.field} onValueChange={(v) => {
              const type = availableFields.find((f) => f.key === v)?.type || 'string';
              const newConds = [...config.conditions];
              newConds[idx] = { ...newConds[idx], field: v, type, value: '' };
              setConfig({ ...config, conditions: newConds });
            }}>
              <SelectTrigger className="w-32 h-8 text-sm">
                <SelectValue placeholder="Field" />
              </SelectTrigger>
              <SelectContent>
                {availableFields.map((f) => (
                  <SelectItem key={f.key} value={f.key}>{f.key}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="font-mono text-white text-sm cursor-pointer" onClick={() => setEditingIdx(idx)}>{cond.field}</span>
          )}
        </td>
        {/* Comparator */}
        <td className="px-2 py-1 align-middle">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <Select value={cond.comparator} onValueChange={(v) => {
                const newConds = [...config.conditions];
                newConds[idx] = { ...newConds[idx], comparator: v };
                setConfig({ ...config, conditions: newConds });
              }}>
                <SelectTrigger className="w-28 h-8 text-sm">
                  <SelectValue placeholder="Comparator" />
                </SelectTrigger>
                <SelectContent>
                  {comparators.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="inline-flex items-center">
                        {c.label}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="inline ml-1 h-3 w-3 text-gray-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>{c.desc}</TooltipContent>
                        </Tooltip>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <span className="text-white text-sm cursor-pointer" onClick={() => setEditingIdx(idx)}>{cond.comparator}</span>
          )}
        </td>
        {/* Value */}
        <td className="px-2 py-1 align-middle">
          {isEditing ? (
            field?.type === 'date' ? (
              <Input
                type="datetime-local"
                value={cond.value || ''}
                onChange={(e) => {
                  const newConds = [...config.conditions];
                  newConds[idx] = { ...newConds[idx], value: e.target.value };
                  setConfig({ ...config, conditions: newConds });
                }}
                className="w-44 h-8 text-sm"
              />
            ) : field?.type === 'number' ? (
              <Input
                type="number"
                value={cond.value || ''}
                onChange={(e) => {
                  const newConds = [...config.conditions];
                  newConds[idx] = { ...newConds[idx], value: e.target.value };
                  setConfig({ ...config, conditions: newConds });
                }}
                className="w-28 h-8 text-sm"
              />
            ) : field?.type === 'boolean' ? (
              <Select
                value={cond.value === true ? 'true' : cond.value === false ? 'false' : ''}
                onValueChange={(v) => {
                  const newConds = [...config.conditions];
                  newConds[idx] = { ...newConds[idx], value: v === 'true' };
                  setConfig({ ...config, conditions: newConds });
                }}
              >
                <SelectTrigger className="w-20 h-8 text-sm">
                  <SelectValue placeholder="Value" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={cond.value || ''}
                onChange={(e) => {
                  const newConds = [...config.conditions];
                  newConds[idx] = { ...newConds[idx], value: e.target.value };
                  setConfig({ ...config, conditions: newConds });
                }}
                className="w-40 h-8 text-sm"
              />
            )
          ) : (
            <span className="text-white text-sm cursor-pointer" onClick={() => setEditingIdx(idx)}>{cond.value?.toString()}</span>
          )}
        </td>
        {/* Actions */}
        <td className="px-2 py-1 align-middle text-right">
          {isEditing ? (
            <Button variant="ghost" size="icon" onClick={() => setEditingIdx(null)} title="Done">
              <Save className="h-4 w-4 text-green-400" />
            </Button>
          ) : (
            <span className="flex gap-1 justify-end">
              <Button variant="ghost" size="icon" onClick={() => setEditingIdx(idx)} title="Edit">
                <Edit2 className="h-4 w-4 text-blue-400" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setConfig({ ...config, conditions: config.conditions.filter((_, i) => i !== idx) })} title="Delete">
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            </span>
          )}
        </td>
      </tr>
    );
  };

  // Main UI
  return (
    <Card className="bg-slate-900/80 border-slate-700 shadow-xl max-w-3xl mx-auto animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-700">
        <CardTitle className="text-white text-xl font-bold">Visual Filter Builder</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Time Range Section */}
        <div className="mb-6">
          <div className="text-gray-300 text-base font-medium mb-2">Time Range</div>
          <div className="flex flex-wrap gap-4 p-4 rounded-lg border border-slate-700 bg-slate-800/60">
            <Select
              value={config.timeMode || 'relative'}
              onValueChange={(v) => setConfig({ ...config, timeMode: v as 'relative' | 'absolute' })}
            >
              <SelectTrigger className="w-32 h-9 text-sm">
                <SelectValue placeholder="Time Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relative">Relative</SelectItem>
                <SelectItem value="absolute">Absolute</SelectItem>
              </SelectContent>
            </Select>
            {config.timeMode === 'relative' ? (
              <Select
                value={config.relativeTime || '24h'}
                onValueChange={(v) => setConfig({ ...config, relativeTime: v })}
              >
                <SelectTrigger className="w-40 h-9 text-sm">
                  <SelectValue placeholder="Relative Time" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIVE_TIMES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <>
                <Input
                  type="date"
                  value={config.absoluteRange?.from || ''}
                  onChange={(e) => setConfig({ ...config, absoluteRange: { ...config.absoluteRange, from: e.target.value } })}
                  className="w-36 h-9 text-sm"
                />
                <span className="text-gray-400">to</span>
                <Input
                  type="date"
                  value={config.absoluteRange?.to || ''}
                  onChange={(e) => setConfig({ ...config, absoluteRange: { ...config.absoluteRange, to: e.target.value } })}
                  className="w-36 h-9 text-sm"
                />
              </>
            )}
          </div>
        </div>

        {/* Filter Conditions Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-300 text-base font-medium">Where</div>
            <div className="flex gap-2 items-center">
              <Select value={config.logic} onValueChange={(v) => setConfig({ ...config, logic: v as 'AND' | 'OR' })}>
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">AND</SelectItem>
                  <SelectItem value="OR">OR</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 text-xs"
                onClick={() => setConfig({ ...config, conditions: [...config.conditions, { field: availableFields[0]?.key || '', comparator: '=', value: '', type: availableFields[0]?.type || 'string' }] })}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Condition
              </Button>
              <Button size="sm" variant="link" className="text-xs text-gray-400 hover:text-purple-400" onClick={() => setConfig(defaultConfig)}>
                Reset
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-800/60">
            {config.conditions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400 animate-fade-in">
                <HelpCircle className="h-10 w-10 mb-2 text-purple-400" />
                <div className="text-base font-medium">No filters yet—click <span className='text-purple-400'>Add Condition</span> to start.</div>
              </div>
            ) : (
              <table className="min-w-full text-sm animate-fade-in">
                <thead>
                  <tr className="bg-slate-900/80">
                    <th className="px-2 py-2 text-left text-gray-400 font-semibold uppercase">Field</th>
                    <th className="px-2 py-2 text-left text-gray-400 font-semibold uppercase">Operator</th>
                    <th className="px-2 py-2 text-left text-gray-400 font-semibold uppercase">Value</th>
                    <th className="px-2 py-2 text-right text-gray-400 font-semibold uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {config.conditions.map(renderConditionRow)}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Save/Presets/Results Section */}
        <div className="flex flex-wrap gap-2 items-center mb-2">
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white px-3" onClick={() => setShowSaveInput((v) => !v)}>
            <Save className="h-4 w-4 mr-1" /> Save Filter
          </Button>
          {showSaveInput && (
            <>
              <Input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Filter name..."
                className="w-40 h-8 text-sm"
              />
              <Button size="sm" className="h-8 px-3" onClick={() => {
                if (saveName.trim()) {
                  saveFilter(saveName, config);
                  setSaveName('');
                  setShowSaveInput(false);
                }
              }}>Save</Button>
              <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setShowSaveInput(false)}>Cancel</Button>
            </>
          )}
          {savedFilters.map((f) => (
            <span key={f.id} className="flex items-center gap-1 border border-slate-600 rounded-full px-3 py-1 bg-slate-900/60 text-white text-xs mr-1">
              <span>{f.name}</span>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setConfig(f.config)} title="Load">
                <Filter className="h-3 w-3 text-blue-400" />
              </Button>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => deleteFilter(f.id)} title="Delete">
                <X className="h-3 w-3 text-red-400" />
              </Button>
            </span>
          ))}
          {presets.length > 0 && (
            <>
              <span className="text-gray-400 ml-2">Presets:</span>
              {presets.map((p) => (
                <Button key={p.id} size="sm" variant="outline" className="rounded-full border-purple-400 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500 mx-1 px-3 py-1 text-xs" onClick={() => setConfig(p.config)}>
                  {p.name}
                </Button>
              ))}
            </>
          )}
        </div>

        {/* Summary and Results */}
        <div className="flex flex-wrap items-center justify-between mt-4 gap-2 border-t border-slate-700 pt-3">
          <div className="text-gray-300 text-sm font-mono">{summary}</div>
          <Badge variant="secondary">Showing {filtered.length} of {logEntries.length} entries</Badge>
        </div>
      </CardContent>
    </Card>
  );
}; 