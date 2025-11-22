/**
 * Admin Export Service
 * Shared utility for exporting data in CSV/JSON formats
 */

export interface ExportResult {
  format: 'csv' | 'json';
  data: any;
  count: number;
  filename: string;
}

class AdminExportService {
  /**
   * Convert array of objects to CSV string
   */
  toCSV<T extends Record<string, any>>(data: T[], headers?: string[]): string {
    if (data.length === 0) {
      return headers ? headers.join(',') : '';
    }

    const keys = headers || Object.keys(data[0]);

    const csvRows = [
      keys.join(','),
      ...data.map((row) =>
        keys.map((key) => {
          const value = row[key];
          if (value === null || value === undefined) {
            return '';
          }
          const stringValue = String(value);
          // Escape quotes and wrap in quotes if contains comma, newline, or quote
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      ),
    ];

    return csvRows.join('\n');
  }

  /**
   * Format data for export
   */
  formatForExport<T extends Record<string, any>>(
    data: T[],
    format: 'csv' | 'json',
    filename: string,
    headers?: string[]
  ): ExportResult {
    if (format === 'json') {
      return {
        format: 'json',
        data,
        count: data.length,
        filename: `${filename}.json`,
      };
    }

    return {
      format: 'csv',
      data: this.toCSV(data, headers),
      count: data.length,
      filename: `${filename}.csv`,
    };
  }

  /**
   * Generate filename with timestamp
   */
  generateFilename(prefix: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${prefix}-${timestamp}`;
  }
}

export const adminExportService = new AdminExportService();
