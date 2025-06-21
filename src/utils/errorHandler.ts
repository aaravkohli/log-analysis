export interface ErrorInfo {
  message: string;
  code?: string;
  timestamp: string;
  context?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userAction?: string;
}

export interface ErrorReport {
  errors: ErrorInfo[];
  totalErrors: number;
  lastError?: ErrorInfo;
}

class ErrorHandler {
  private errors: ErrorInfo[] = [];
  private maxErrors = 100; // Keep only last 100 errors
  private listeners: ((error: ErrorInfo) => void)[] = [];

  // Log an error with context
  logError(
    message: string,
    context?: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    code?: string,
    userAction?: string
  ): void {
    const error: ErrorInfo = {
      message,
      code,
      timestamp: new Date().toISOString(),
      context,
      severity,
      userAction
    };

    this.errors.push(error);
    
    // Keep only the last maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(error));

    // In development, still log to console for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${severity.toUpperCase()}] ${context ? `[${context}] ` : ''}${message}`, {
        code,
        timestamp: error.timestamp,
        userAction
      });
    }
  }

  // Handle file processing errors
  handleFileError(error: Error, fileName?: string): void {
    this.logError(
      `File processing failed: ${error.message}`,
      'FileUpload',
      'medium',
      'FILE_PROCESSING_ERROR',
      fileName ? `Check the format of ${fileName}` : 'Verify file format and try again'
    );
  }

  // Handle network errors
  handleNetworkError(error: Error, endpoint?: string): void {
    this.logError(
      `Network request failed: ${error.message}`,
      'Network',
      'high',
      'NETWORK_ERROR',
      endpoint ? `Check connectivity to ${endpoint}` : 'Check your internet connection'
    );
  }

  // Handle data validation errors
  handleValidationError(message: string, field?: string): void {
    this.logError(
      `Validation error: ${message}`,
      'DataValidation',
      'low',
      'VALIDATION_ERROR',
      field ? `Please check the ${field} field` : 'Please review your input'
    );
  }

  // Handle geolocation errors
  handleGeoError(ip: string, error: Error): void {
    this.logError(
      `Geolocation failed for IP ${ip}: ${error.message}`,
      'Geolocation',
      'low',
      'GEO_ERROR',
      'This is normal for some IP addresses'
    );
  }

  // Handle threat detection errors
  handleThreatDetectionError(error: Error): void {
    this.logError(
      `Threat detection error: ${error.message}`,
      'ThreatDetection',
      'high',
      'THREAT_DETECTION_ERROR',
      'Security monitoring may be affected'
    );
  }

  // Get error report
  getErrorReport(): ErrorReport {
    return {
      errors: [...this.errors],
      totalErrors: this.errors.length,
      lastError: this.errors[this.errors.length - 1]
    };
  }

  // Get errors by severity
  getErrorsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): ErrorInfo[] {
    return this.errors.filter(error => error.severity === severity);
  }

  // Get errors by context
  getErrorsByContext(context: string): ErrorInfo[] {
    return this.errors.filter(error => error.context === context);
  }

  // Clear all errors
  clearErrors(): void {
    this.errors = [];
  }

  // Subscribe to error events
  subscribe(listener: (error: ErrorInfo) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Get error statistics
  getErrorStats(): {
    total: number;
    bySeverity: Record<string, number>;
    byContext: Record<string, number>;
    recentErrors: number; // Last 24 hours
  } {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const bySeverity: Record<string, number> = {};
    const byContext: Record<string, number> = {};
    let recentErrors = 0;

    this.errors.forEach(error => {
      // Count by severity
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      
      // Count by context
      if (error.context) {
        byContext[error.context] = (byContext[error.context] || 0) + 1;
      }
      
      // Count recent errors
      if (new Date(error.timestamp) > oneDayAgo) {
        recentErrors++;
      }
    });

    return {
      total: this.errors.length,
      bySeverity,
      byContext,
      recentErrors
    };
  }
}

export const errorHandler = new ErrorHandler();
export default errorHandler; 