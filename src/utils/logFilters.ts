// Utility for log filtering and saved filters
export type LogFilter = {
  searchTerm: string;
  status: string;
  timeRange: string;
  country: string;
  ipAddress: string;
  username: string;
};

export type SavedFilter = LogFilter & {
  id: string;
  name: string;
  createdAt: string;
};

const FILTERS_KEY = 'saved_log_filters';

export const logFilterManager = {
  filterLogs(logs: any[], filter: LogFilter) {
    return logs.filter(log => {
      // Search term
      const matchesSearch =
        !filter.searchTerm ||
        (log.user && log.user.toLowerCase().includes(filter.searchTerm.toLowerCase())) ||
        (log.ip && log.ip.includes(filter.searchTerm)) ||
        (log.country && log.country.toLowerCase().includes(filter.searchTerm.toLowerCase()));
      // Status
      const matchesStatus =
        filter.status === 'all' || log.status === filter.status;
      // Time range (simple, based on timestamp)
      let matchesTime = true;
      if (filter.timeRange !== 'all' && log.timestamp) {
        const now = Date.now();
        const logTime = new Date(log.timestamp).getTime();
        if (filter.timeRange === '1h') {
          matchesTime = now - logTime <= 60 * 60 * 1000;
        } else if (filter.timeRange === '24h') {
          matchesTime = now - logTime <= 24 * 60 * 60 * 1000;
        } else if (filter.timeRange === '7d') {
          matchesTime = now - logTime <= 7 * 24 * 60 * 60 * 1000;
        }
      }
      // Country
      const matchesCountry =
        filter.country === 'all' || log.country === filter.country;
      // IP
      const matchesIP =
        !filter.ipAddress || (log.ip && log.ip.includes(filter.ipAddress));
      // Username
      const matchesUser =
        !filter.username || (log.user && log.user.toLowerCase().includes(filter.username.toLowerCase()));
      return (
        matchesSearch &&
        matchesStatus &&
        matchesTime &&
        matchesCountry &&
        matchesIP &&
        matchesUser
      );
    });
  },
  getSavedFilters(): SavedFilter[] {
    try {
      const raw = localStorage.getItem(FILTERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  saveFilter(filter: LogFilter, name: string) {
    const filters = this.getSavedFilters();
    const newFilter: SavedFilter = {
      ...filter,
      id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      name,
      createdAt: new Date().toISOString(),
    };
    filters.unshift(newFilter);
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters.slice(0, 10)));
  },
  deleteFilter(id: string) {
    const filters = this.getSavedFilters().filter(f => f.id !== id);
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  },
  getUniqueCountries(logs: any[]): string[] {
    const set = new Set<string>();
    logs.forEach(log => {
      if (log.country) set.add(log.country);
    });
    return Array.from(set);
  },
}; 