# SSH Guardian

A real-time SSH security monitoring and threat detection system with advanced analytics, geo-fencing, and automated reporting capabilities.

## Features

- **Real-time Monitoring**: Live SSH connection monitoring with instant threat detection
- **Advanced Analytics**: Comprehensive security analytics with visual dashboards
- **Geo-fencing**: Location-based access control and threat detection
- **Threat Detection**: Automated detection of brute force attacks, credential stuffing, and suspicious activities
- **Report Generation**: Professional PDF reports for security analysis and compliance
- **Data Import**: Support for CSV log file uploads and analysis
- **Visual Filtering**: Advanced visual filter builder for log analysis
- **Security Center**: Centralized security management and alert system

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Charts**: Recharts for data visualization
- **PDF Generation**: jsPDF with autoTable plugin
- **Maps**: Custom WorldMap component for geo-visualization
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd log-sentinel-watcher-06-main
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

### Real-time Monitoring

1. Click "Start Monitoring" to begin real-time SSH connection monitoring
2. View live statistics and threat detection in the Overview dashboard
3. Monitor security alerts and geo-fencing violations

### Data Import

1. Navigate to the "Import Data" tab
2. Upload CSV log files for analysis
3. View imported data in the Analytics panel

### Analytics

1. Use the Analytics panel to explore security data
2. Apply visual filters to focus on specific patterns
3. Generate charts and visualizations for insights

### Reports

1. Go to the Reports panel
2. Select report type (Security Summary, Detailed Analysis, Compliance)
3. Choose time period
4. Generate and download PDF reports

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── AnalyticsPanel.tsx # Analytics interface
│   ├── ReportsPanel.tsx   # Report generation
│   └── ...
├── pages/              # Page components
├── utils/              # Utility functions
├── hooks/              # Custom React hooks
└── lib/                # Library configurations
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
