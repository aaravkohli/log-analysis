import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Tablet, Monitor } from 'lucide-react';

interface DataTableProps {
  data: any[];
  columns: Array<{
    key: string;
    header: string;
    render?: (value: any, row: any) => React.ReactNode;
  }>;
}

const DataTable = ({ data, columns }: DataTableProps) => {
  const [isMobile, setIsMobile] = React.useState(false);
  const [isTablet, setIsTablet] = React.useState(false);

  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((row, index) => (
          <div key={index} className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4 space-y-3">
            {columns.map((column) => (
              <div key={column.key} className="flex items-center justify-between gap-2">
                <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                  {column.header}
                </span>
                <div className="text-white text-sm text-right">
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  const visibleColumns = isTablet ? columns.slice(0, 5) : columns;

  return (
    <div className="w-full overflow-x-auto rounded-md border">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow className="border-b-slate-700 hover:bg-slate-800/40">
            {visibleColumns.map((column) => (
              <TableHead 
                key={column.key} 
                className="text-gray-400 font-medium text-xs sm:text-sm px-4 py-3 whitespace-nowrap"
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow 
              key={index} 
              className="border-b-slate-700/50 hover:bg-slate-700/30 transition-colors duration-150 last:border-b-0"
            >
              {visibleColumns.map((column) => (
                <TableCell 
                  key={column.key} 
                  className="text-white text-sm px-4 py-3"
                >
                  {column.render ? column.render(row[column.key], row) : (
                    <span className="truncate block max-w-sm">
                      {String(row[column.key] ?? '')}
                    </span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DataTable;
