import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, AlertTriangle, CheckCircle2, Settings } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface CSVUploaderProps {
  onCSVData: (data: any[]) => void;
}

const CSVUploader: React.FC<CSVUploaderProps> = ({ onCSVData }) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const [columnMapping, setColumnMapping] = useState({
    timestamp: 'timestamp',
    ip: 'client_ip',
    user: 'user_agent',
    status: 'status_code',
    port: '22',
    country: 'Unknown'
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const csvData = event.target?.result as string;
          const lines = csvData.split('\n');
          const headers = lines[0].split(',').map(header => header.trim());
          
          // Auto-detect column mapping
          const detectedMapping = {
            timestamp: headers.find(h => h.toLowerCase().includes('timestamp') || h.toLowerCase().includes('time') || h.toLowerCase().includes('date')) || 'timestamp',
            ip: headers.find(h => h.toLowerCase().includes('ip') || h.toLowerCase().includes('client') || h.toLowerCase().includes('source')) || 'ip',
            user: headers.find(h => h.toLowerCase().includes('user') || h.toLowerCase().includes('agent') || h.toLowerCase().includes('username')) || 'user',
            status: headers.find(h => h.toLowerCase().includes('status') || h.toLowerCase().includes('code') || h.toLowerCase().includes('result')) || 'status',
            port: headers.find(h => h.toLowerCase().includes('port')) || '22',
            country: headers.find(h => h.toLowerCase().includes('country') || h.toLowerCase().includes('location') || h.toLowerCase().includes('geo')) || 'Unknown'
          };

          setColumnMapping(detectedMapping);
          setShowColumnMapping(true);

          const parsedData = lines.slice(1).map((line, index) => {
            const values = line.split(',').map(value => value.trim());
            const entry: any = {
              id: index,
              timestamp: values[headers.indexOf(detectedMapping.timestamp)] || new Date().toISOString(),
              ip: values[headers.indexOf(detectedMapping.ip)] || '',
              user: values[headers.indexOf(detectedMapping.user)] || '',
              status: values[headers.indexOf(detectedMapping.status)] || 'unknown',
              port: values[headers.indexOf(detectedMapping.port)] || '22',
              country: values[headers.indexOf(detectedMapping.country)] || 'Unknown',
            };

            // Map status codes to success/failed
            if (entry.status) {
              const statusCode = parseInt(entry.status);
              if (statusCode >= 200 && statusCode < 300) {
                entry.status = 'success';
              } else if (statusCode >= 400) {
                entry.status = 'failed';
              } else {
                entry.status = 'unknown';
              }
            }

            return entry;
          });

          onCSVData(parsedData);
          setSuccess(`Successfully processed ${parsedData.length} log entries`);
          setError(null);
        } catch (err) {
          setError('Error parsing CSV file. Please ensure it has the correct format.');
          setSuccess(null);
        }
      };

      reader.onerror = () => {
        setError('Error reading file');
        setSuccess(null);
      };

      reader.readAsText(file);
    }
  }, [onCSVData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Upload className="h-5 w-5 mr-2" />
          Upload Log CSV
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 bg-green-500/10 border-green-500">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-300">{success}</AlertDescription>
          </Alert>
        )}

        {showColumnMapping && (
          <Alert className="mb-4 bg-blue-500/10 border-blue-500">
            <Settings className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-300">
              <strong>Column Mapping Detected:</strong><br />
              Timestamp: {columnMapping.timestamp}<br />
              IP Address: {columnMapping.ip}<br />
              User: {columnMapping.user}<br />
              Status: {columnMapping.status}<br />
              Port: {columnMapping.port}<br />
              Country: {columnMapping.country}
            </AlertDescription>
          </Alert>
        )}

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500'}`}
        >
          <input {...getInputProps()} />
          <Upload className="h-8 w-8 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-300">
            {isDragActive
              ? 'Drop the CSV file here'
              : 'Drag and drop a CSV file here, or click to select'}
          </p>
          <p className="text-slate-400 text-sm mt-2">
            Supported formats: CSV with columns for timestamp, IP address, user, status, port, and country
          </p>
          <p className="text-slate-400 text-xs mt-1">
            Common column names: timestamp, client_ip, method, resource, status_code, user_agent, etc.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CSVUploader; 