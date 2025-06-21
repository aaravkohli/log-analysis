import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, AlertCircle, Trash2, FileSpreadsheet, Database } from 'lucide-react';
import { dataManager, type LogEntry } from '@/utils/dataManager';
import { errorHandler } from '@/utils/errorHandler';

interface CSVUploaderProps {
  logEntries: LogEntry[];
  setLogEntries: (entries: LogEntry[]) => void;
}

const CSVUploader = ({ logEntries, setLogEntries }: CSVUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectFileType = (file: File) => {
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    switch (extension) {
      case '.csv':
        return 'CSV';
      case '.xlsx':
        return 'XLSX';
      case '.xls':
        return 'XLS';
      default:
        return 'Unknown';
    }
  };

  const validateFile = (file: File) => {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const allowedExtensions = ['.csv', '.xls', '.xlsx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    return allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);
  };

  const handleFileSelect = useCallback((file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      setUploadStatus('idle');
      setErrorMessage('');
    } else {
      setErrorMessage('Please select a valid CSV, XLS, or XLSX file.');
      setUploadStatus('error');
      setSelectedFile(null);
    }
  }, []);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  // Flexible field mapping for normalization
  const FIELD_ALIASES = {
    timestamp: ['timestamp', 'time', 'date', 'datetime', 'log_time', 'created_at'],
    ip: ['ip', 'client_ip', 'source_ip', 'remote_addr', 'ip_address', 'src_ip'],
    user: ['user', 'username', 'login', 'account', 'user_name', 'auth_user'],
    status: ['status', 'status_code', 'result', 'auth_status', 'outcome'],
    port: ['port', 'dst_port', 'destination_port', 'target_port'],
    country: ['country', 'country_name', 'geo_country', 'location_country'],
    countryCode: ['countrycode', 'country_code', 'geo_country_code', 'cc'],
    city: ['city', 'geo_city', 'location_city', 'geo_city_name'],
    flag: ['flag', 'country_flag', 'emoji_flag'],
    method: ['method', 'http_method', 'request_method'],
    resource: ['resource', 'uri', 'url', 'path', 'request_uri'],
    userAgent: ['user_agent', 'agent', 'ua', 'useragent'],
    bytes: ['bytes', 'bytes_sent', 'size', 'response_size'],
  };

  // Helper to find the first matching field in a row
  const getField = (row: any, aliases: string[]) => {
    for (const key of aliases) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        return row[key];
      }
    }
    return undefined;
  };

  // Normalize timestamp to ISO format
  const normalizeTimestamp = (timestamp: any) => {
    if (!timestamp) return new Date().toISOString();
    
    // Try to parse various timestamp formats
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
    
    // Handle common log formats
    const timestampStr = String(timestamp);
    
    // Unix timestamp (seconds)
    if (/^\d{10}$/.test(timestampStr)) {
      return new Date(parseInt(timestampStr) * 1000).toISOString();
    }
    
    // Unix timestamp (milliseconds)
    if (/^\d{13}$/.test(timestampStr)) {
      return new Date(parseInt(timestampStr)).toISOString();
    }
    
    // Common log formats
    const logFormats = [
      /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/, // YYYY-MM-DD HH:MM:SS
      /(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/, // MM/DD/YYYY HH:MM:SS
      /(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})/, // DD-MM-YYYY HH:MM:SS
    ];
    
    for (const format of logFormats) {
      const match = timestampStr.match(format);
      if (match) {
        const [_, ...parts] = match;
        if (parts.length === 6) {
          const [year, month, day, hour, minute, second] = parts;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second)).toISOString();
        }
      }
    }
    
    return new Date().toISOString();
  };

  // Normalize status to success/failed
  const normalizeStatus = (status: any) => {
    if (!status) return 'failed';
    
    const statusStr = String(status).toLowerCase();
    
    // Success indicators
    if (statusStr.includes('success') || statusStr.includes('200') || statusStr.includes('ok') || statusStr.includes('accepted')) {
      return 'success';
    }
    
    // Failed indicators
    if (statusStr.includes('failed') || statusStr.includes('error') || statusStr.includes('denied') || statusStr.includes('401') || statusStr.includes('403')) {
      return 'failed';
    }
    
    // Default to failed for security
    return 'failed';
  };

  // Normalize country name
  const normalizeCountry = (country: any) => {
    if (!country) return 'Unknown';
    return String(country);
  };

  // Parse CSV content and convert to LogEntry format with flexible field mapping
  const parseCSVContent = (content: string): LogEntry[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    // Try to detect headers
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const dataLines = lines.slice(1);

    return dataLines.map((line, index) => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, '')); // Remove quotes
      const row: any = {};
      
      // Map values to headers
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });

      // Normalize entry with dynamic mapping
      const entry: LogEntry = {
        id: Date.now() + index,
        timestamp: normalizeTimestamp(getField(row, FIELD_ALIASES.timestamp)),
        ip: getField(row, FIELD_ALIASES.ip) || '',
        user: getField(row, FIELD_ALIASES.user) || '',
        status: normalizeStatus(getField(row, FIELD_ALIASES.status)),
        port: parseInt(getField(row, FIELD_ALIASES.port)) || 22,
        country: normalizeCountry(getField(row, FIELD_ALIASES.country)),
        countryCode: getField(row, FIELD_ALIASES.countryCode) || '',
        city: getField(row, FIELD_ALIASES.city) || '',
        flag: getField(row, FIELD_ALIASES.flag) || '🏳️',
      };

      // Generate missing required fields
      if (!entry.ip) {
        entry.ip = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      }
      if (!entry.user) {
        entry.user = ['admin', 'root', 'user', 'test'][Math.floor(Math.random() * 4)];
      }

      return entry;
    });
  };

  // Process uploaded file
  const processUploadedFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setUploadStatus('idle');
    
    try {
      const content = await selectedFile.text();
      const parsedEntries = parseCSVContent(content);
      
      if (parsedEntries.length === 0) {
        throw new Error('No valid data found in the file');
      }

      // Add entries to data manager
      dataManager.addLogEntries(parsedEntries, importMode);
      
      // Update parent component
      setLogEntries(dataManager.getLogEntries());
      
      setUploadStatus('success');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      errorHandler.handleFileError(new Error(errorMessage), selectedFile.name);
      setErrorMessage('Failed to process the file. Please check the file format and try again.');
      setUploadStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get current stats from data manager
  const currentStats = dataManager.calculateStats();
  const dataSource = dataManager.getDataSource();

  return (
    <div className="space-y-6">
      {/* Import Configuration */}
      <Card className="glass-effect border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 shadow-xl backdrop-blur-xl">
        <CardHeader className="pb-6">
          <CardTitle className="text-white flex items-center text-2xl">
            <Database className="h-7 w-7 mr-3 text-purple-400" />
            Data Import Center
          </CardTitle>
          <p className="text-slate-300 text-base">Import SSH log data from CSV, XLS, or XLSX files to enhance your security monitoring</p>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Import Mode Selection */}
          <div className="space-y-4">
            <label className="text-base font-medium text-slate-200">Import Mode</label>
            <Select value={importMode} onValueChange={(value: 'append' | 'replace') => setImportMode(value)}>
              <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white hover:border-purple-400/50 transition-colors duration-200 h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="append" className="text-white hover:bg-slate-700">
                  <div className="flex items-center space-x-2">
                    <span>📁</span>
                    <span>Append to existing data</span>
                  </div>
                </SelectItem>
                <SelectItem value="replace" className="text-white hover:bg-slate-700">
                  <div className="flex items-center space-x-2">
                    <span>🔄</span>
                    <span>Replace all data</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-slate-400">
              {importMode === 'append' ? 'New data will be added to existing logs' : 'All existing data will be replaced'}
            </p>
          </div>

          {/* Enhanced File Upload Area */}
          <div 
            className={`relative border-2 border-dashed rounded-xl p-8 lg:p-12 text-center transition-all duration-300 cursor-pointer group ${
              isDragOver 
                ? 'border-purple-400 bg-purple-500/10 scale-102' 
                : selectedFile 
                  ? 'border-green-400/50 bg-green-500/5' 
                  : 'border-slate-600 hover:border-purple-500/50 bg-slate-800/20 hover:bg-slate-800/40'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleUploadAreaClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileInputChange}
              className="hidden"
              id="file-upload"
            />
            
            {selectedFile ? (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="p-4 bg-green-500/20 rounded-full">
                    <FileSpreadsheet className="h-12 w-12 text-green-400" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-white font-semibold text-lg">{selectedFile.name}</p>
                    <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-4 text-slate-400 text-sm mt-2">
                      <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                      <span className="hidden sm:inline">•</span>
                      <Badge variant="outline" className="border-green-400/50 text-green-400">
                        {detectFileType(selectedFile)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      processUploadedFile();
                    }}
                    disabled={isProcessing}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 h-auto font-medium transition-all duration-200 hover:scale-105"
                  >
                    {isProcessing ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Upload className="h-4 w-4" />
                        <span>Import Data</span>
                      </div>
                    )}
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile();
                    }}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 px-6 py-3 h-auto transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                <div className={`transition-all duration-300 ${isDragOver ? 'scale-110' : 'group-hover:scale-105'}`}>
                  <div className="p-6 bg-purple-500/20 rounded-full w-fit mx-auto mb-4">
                    <Upload className="h-16 w-16 text-purple-400" />
                  </div>
                </div>
                <div>
                  <p className="text-white font-semibold text-xl mb-3">
                    {isDragOver ? 'Drop your file here' : 'Drag & drop your file here'}
                  </p>
                  <p className="text-slate-400 text-base mb-6">
                    or click to browse files
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 text-sm text-slate-500">
                    <Badge variant="outline" className="border-slate-600 text-slate-400">CSV</Badge>
                    <Badge variant="outline" className="border-slate-600 text-slate-400">XLSX</Badge>
                    <Badge variant="outline" className="border-slate-600 text-slate-400">XLS</Badge>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {uploadStatus === 'success' && (
            <Alert className="border-green-500/30 bg-green-500/10 glass-effect animate-fade-in">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <AlertDescription className="text-green-300 text-base">
                <strong>Success!</strong> File imported successfully. Your data has been {importMode === 'replace' ? 'replaced' : 'added to the existing logs'}.
              </AlertDescription>
            </Alert>
          )}

          {uploadStatus === 'error' && (
            <Alert className="border-red-500/30 bg-red-500/10 glass-effect animate-fade-in">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <AlertDescription className="text-red-300 text-base">
                <strong>Error:</strong> {errorMessage}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Current Data Statistics */}
      <Card className="glass-effect border-slate-700 shadow-xl backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center text-xl">
            <FileText className="h-6 w-6 mr-3 text-blue-400" />
            Current Dataset
            <Badge variant="outline" className="ml-2 border-purple-400 text-purple-400">
              {dataSource.type}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-slate-800/30 rounded-lg border border-slate-600/30">
              <div className="text-2xl font-bold text-white mb-1">
                {currentStats.totalAttempts.toLocaleString()}
              </div>
              <div className="text-sm text-slate-300">Total Entries</div>
            </div>
            <div className="text-center p-4 bg-slate-800/30 rounded-lg border border-slate-600/30">
              <div className="text-2xl font-bold text-white mb-1">
                {currentStats.uniqueIPs.toLocaleString()}
              </div>
              <div className="text-sm text-slate-300">Unique IPs</div>
            </div>
            <div className="text-center p-4 bg-slate-800/30 rounded-lg border border-slate-600/30">
              <div className="text-2xl font-bold text-white mb-1">
                {currentStats.uniqueCountries.toLocaleString()}
              </div>
              <div className="text-sm text-slate-300">Countries</div>
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400 text-center">
            Last updated: {new Date(dataSource.lastUpdate).toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CSVUploader;
