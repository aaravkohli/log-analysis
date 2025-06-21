# SSH Guardian - Real-time Security Monitoring System

A comprehensive cybersecurity monitoring platform designed to detect, analyze, and respond to SSH connection threats in real-time.

## Features

- **Real-time Monitoring**: Live SSH connection monitoring with instant threat detection
- **AI-Powered Analysis**: Intelligent report generation with contextual insights
- **Visual Filter Builder**: Splunk-like filtering interface for advanced log analysis
- **Geographic Intelligence**: IP geolocation and country-based threat analysis
- **Compliance Reporting**: Automated compliance audit reports and risk assessments
- **Threat Detection**: Advanced pattern recognition for brute force and suspicious activities
- **Data Import**: Flexible CSV upload with automatic field mapping

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **UI Framework**: Shadcn/ui with Tailwind CSS
- **Charts**: Recharts for data visualization
- **Routing**: React Router DOM
- **Build Tool**: Vite
- **Markdown**: React Markdown with GFM support

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Shadcn/ui components
│   ├── AnalyticsPanel.tsx
│   ├── Dashboard.tsx
│   ├── ReportsPanel.tsx
│   └── ...
├── utils/              # Utility functions
│   ├── dataManager.ts  # Central data management
│   ├── geoip.ts        # Geolocation utilities
│   └── ...
├── pages/              # Page components
└── hooks/              # Custom React hooks
```

## Data Sources

The system supports multiple data sources:
- **Simulated Data**: Real-time mock data generation for testing
- **CSV Upload**: Real log files with flexible field mapping
- **Live Monitoring**: Direct SSH log monitoring (future feature)

## Security Features

- **Threat Detection**: Identifies brute force attacks, suspicious patterns
- **Geographic Filtering**: Country-based access control and monitoring
- **Real-time Alerts**: Instant notifications for security events
- **Compliance Tracking**: Automated audit trails and compliance reporting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
