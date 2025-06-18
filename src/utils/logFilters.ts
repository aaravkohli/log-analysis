
export interface LogFilter {
  searchTerm: string;
  status: string;
  timeRange: string;
  country: string;
  ipAddress: string;
  username: string;
}

export interface SavedFilter extends LogFilter {
  id: string;
  name: string;
  createdAt: string;
}

class LogFilterManager {
  private savedFilters: SavedFilter[] = [];

  filterLogs(logEntries: any[], filter: LogFilter): any[] {
    return logEntries.filter(entry => {
      // Search term filter
      if (filter.searchTerm) {
        const searchLower = filter.searchTerm.toLowerCase();
        const matchesSearch = 
          (entry.ip || '').toLowerCase().includes(searchLower) ||
          (entry.user || '').toLowerCase().includes(searchLower) ||
          (entry.country || '').toLowerCase().includes(searchLower) ||
          (entry.timestamp || '').toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filter.status !== 'all' && entry.status !== filter.status) {
        return false;
      }

      // Country filter
      if (filter.country !== 'all' && entry.country !== filter.country) {
        return false;
      }

      // IP address filter
      if (filter.ipAddress && !(entry.ip || '').includes(filter.ipAddress)) {
        return false;
      }

      // Username filter
      if (filter.username && !(entry.user || '').includes(filter.username)) {
        return false;
      }

      // Time range filter
      if (filter.timeRange !== 'all') {
        const entryTime = new Date(entry.timestamp);
        const now = new Date();
        const cutoff = new Date();

        switch (filter.timeRange) {
          case '1h':
            cutoff.setHours(now.getHours() - 1);
            break;
          case '24h':
            cutoff.setHours(now.getHours() - 24);
            break;
          case '7d':
            cutoff.setDate(now.getDate() - 7);
            break;
        }

        if (entryTime < cutoff) return false;
      }

      return true;
    });
  }

  saveFilter(filter: LogFilter, name: string): void {
    const savedFilter: SavedFilter = {
      ...filter,
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString()
    };
    this.savedFilters.push(savedFilter);
  }

  getSavedFilters(): SavedFilter[] {
    return [...this.savedFilters];
  }

  deleteFilter(id: string): void {
    this.savedFilters = this.savedFilters.filter(f => f.id !== id);
  }

  getUniqueCountries(logEntries: any[]): string[] {
    const countries = new Set<string>();
    logEntries.forEach(entry => {
      if (entry.country) {
        countries.add(entry.country);
      }
    });
    return Array.from(countries).sort();
  }
}

export const logFilterManager = new LogFilterManager();
