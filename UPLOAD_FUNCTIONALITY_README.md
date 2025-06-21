# SSH Guardian - Enhanced Upload Functionality

## Overview
This document describes the enhanced upload functionality for the SSH Guardian system, which now supports flexible field mapping and real-time data integration across all components.

## Key Features

### 🔄 Flexible Field Mapping
The system now intelligently maps CSV fields regardless of their order or naming conventions:

**Supported Field Aliases:**
- **Timestamp**: `timestamp`, `time`, `date`, `datetime`, `log_time`, `created_at`
- **IP Address**: `ip`, `client_ip`, `source_ip`, `remote_addr`, `ip_address`, `src_ip`
- **Username**: `user`, `username`, `login`, `account`, `user_name`, `auth_user`
- **Status**: `status`, `status_code`, `result`, `auth_status`, `outcome`
- **Port**: `port`, `dst_port`, `destination_port`, `target_port`
- **Country**: `country`, `country_name`, `geo_country`, `location_country`
- **Country Code**: `countrycode`, `country_code`, `geo_country_code`, `cc`
- **City**: `city`, `geo_city`, `location_city`, `geo_city_name`
- **Flag**: `flag`, `country_flag`, `emoji_flag`
- **Method**: `method`, `http_method`, `request_method`
- **Resource**: `resource`, `uri`, `url`, `path`, `request_uri`
- **User Agent**: `user_agent`, `agent`, `ua`, `useragent`
- **Bytes**: `bytes`, `bytes_sent`, `size`, `response_size`

### 📊 Real Data Integration
All components now use real data from uploaded files:
- **Dashboard**: Shows actual statistics from uploaded logs
- **Analytics Panel**: Charts reflect real data patterns
- **Log Search Panel**: Filters work with uploaded IPs and users
- **Security Center**: Threat detection based on real log analysis
- **Reports Panel**: Generates reports from actual data (no more mock data)

### 🎯 Automatic Data Source Detection
The system automatically detects and indicates the current data source:
- **Simulated**: When using generated mock data
- **Uploaded**: When using uploaded CSV files
- **Mixed**: When combining both sources

## File Format Support

### CSV Files
The system supports various CSV formats:

**Standard Format:**
```csv
timestamp,client_ip,username,status_code,port,country,city
2024-01-15 10:30:15,192.168.1.100,admin,success,22,United States,New York
```

**Alternative Format:**
```csv
log_time,source_ip,login,result,dst_port,geo_country,geo_city
2024-01-15 11:30:15,192.168.1.101,admin,success,22,United States,New York
```

**Minimal Format:**
```csv
time,ip,user,status
2024-01-15 12:30:15,192.168.1.102,admin,success
```

### Supported File Types
- `.csv` - Comma-separated values
- `.xlsx` - Excel files
- `.xls` - Legacy Excel files

## Data Processing Features

### 🕒 Timestamp Normalization
The system handles various timestamp formats:
- ISO 8601: `2024-01-15T10:30:15Z`
- Standard: `2024-01-15 10:30:15`
- Unix timestamps (seconds/milliseconds)
- Common log formats: `MM/DD/YYYY HH:MM:SS`, `DD-MM-YYYY HH:MM:SS`

### ✅ Status Normalization
Automatically converts various status indicators:
- **Success**: `success`, `200`, `ok`, `accepted`
- **Failed**: `failed`, `error`, `denied`, `401`, `403`

### 🌍 Geographic Data
- Automatically generates country codes from country names
- Handles missing geographic data gracefully
- Provides default flags for unknown locations

## Component Updates

### CSVUploader.tsx
- **Enhanced field mapping** with flexible alias detection
- **Improved error handling** for malformed files
- **Real-time validation** of file contents
- **Support for quoted CSV values**

### DataManager.ts
- **Centralized data management** for all components
- **Automatic statistics calculation** from real data
- **Data source tracking** and indication
- **Seamless switching** between simulated and uploaded data

### ReportsPanel.tsx
- **Real hourly activity data** from actual log entries
- **Dynamic threat distribution** based on detected threats
- **Intelligent recommendations** based on real metrics
- **No more mock data** - all charts and reports use real data

### All Other Components
- **Dashboard**: Real-time stats from uploaded data
- **AnalyticsPanel**: Charts reflect actual data patterns
- **LogSearchPanel**: Filters work with uploaded IPs/users
- **SecurityCenter**: Threat detection from real log analysis

## Testing Instructions

### 1. Test Flexible Field Mapping
1. Upload `sample_logs.csv` (standard format)
2. Upload `sample_logs_alt_format.csv` (alternative headers)
3. Upload `sample_logs_minimal.csv` (minimal fields)
4. Verify all files are processed correctly regardless of header format

### 2. Test Real Data Integration
1. Upload any CSV file
2. Navigate to all panels (Dashboard, Analytics, Search, Security, Reports)
3. Verify that all components show data from the uploaded file
4. Check that charts, filters, and statistics reflect real data

### 3. Test Data Source Switching
1. Start with simulated data
2. Upload a CSV file
3. Verify the data source indicator changes to "Uploaded"
4. Check that all components update automatically

### 4. Test Reports Panel
1. Upload a CSV file with various data
2. Navigate to the Reports panel
3. Verify that:
   - Hourly activity chart shows real data
   - Threat distribution reflects actual threats
   - Security metrics are calculated from real data
   - Recommendations are based on actual patterns

## Expected Behaviors

### ✅ Working Features
- **Flexible field mapping** handles various CSV formats
- **Real-time updates** across all components
- **Automatic data source detection**
- **Intelligent timestamp parsing**
- **Status normalization**
- **Geographic data handling**
- **Error handling** for malformed files

### 📊 Data Flow
1. **File Upload** → CSVUploader processes file with flexible mapping
2. **Data Manager** → Centralizes and normalizes data
3. **Component Updates** → All panels receive real data automatically
4. **Statistics Calculation** → Real-time stats from uploaded data
5. **Chart Updates** → Visualizations reflect actual data patterns

## Troubleshooting

### Common Issues
1. **File not uploading**: Check file format and size
2. **Fields not mapping**: Verify CSV headers match supported aliases
3. **Timestamps not parsing**: Check timestamp format compatibility
4. **Charts not updating**: Ensure data manager is receiving entries

### Debug Information
- Check browser console for parsing errors
- Verify CSV format with sample files
- Test with minimal CSV first, then add complexity

## Future Enhancements

### Planned Features
- **Excel file parsing** with multiple sheets
- **JSON log format** support
- **Real-time log streaming** from external sources
- **Advanced field mapping** with custom rules
- **Data validation** with schema enforcement
- **Bulk file processing** for multiple uploads

### Performance Optimizations
- **Lazy loading** for large datasets
- **Data compression** for memory efficiency
- **Caching** for frequently accessed data
- **Background processing** for large files

## Technical Implementation

### Key Files Modified
- `src/components/CSVUploader.tsx` - Enhanced field mapping
- `src/utils/dataManager.ts` - Centralized data management
- `src/components/ReportsPanel.tsx` - Real data integration
- `src/pages/Index.tsx` - Data flow coordination
- All component files - Real data usage

### Data Flow Architecture
```
CSV Upload → Field Mapping → Data Normalization → Data Manager → Component Updates
```

### Field Mapping Algorithm
1. **Header Detection** - Parse CSV headers
2. **Alias Matching** - Find matching field aliases
3. **Value Extraction** - Get values using matched fields
4. **Normalization** - Convert to standard format
5. **Validation** - Ensure required fields are present

This enhanced system provides a robust, flexible solution for importing and analyzing SSH log data with real-time integration across all components. 