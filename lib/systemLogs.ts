// /opt/gpti/gpti-site/lib/systemLogs.ts
// Real system log reader for admin dashboard

import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';

export interface SystemLogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  source: string;
  message: string;
  details?: any;
}

const LOG_DIR = '/opt/gpti/gpti-data-bot/logs';
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB safety limit

export async function getRecentLogs(
  hoursBack: number = 24,
  severity?: 'info' | 'warning' | 'error' | 'all'
): Promise<SystemLogEntry[]> {
  try {
    const files = await readdir(LOG_DIR);
    const logFiles = files.filter(f => f.endsWith('.log'));

    const allLogs: SystemLogEntry[] = [];

    // Read each log file
    for (const file of logFiles) {
      try {
        const filePath = join(LOG_DIR, file);
        const stats = await stat(filePath);

        // Skip huge files for safety
        if (stats.size > MAX_LOG_SIZE) {
          console.warn(`Skipping large log file: ${file} (${stats.size} bytes)`);
          continue;
        }

        const content = await readFile(filePath, 'utf-8');
        const logs = parseLogFile(content, file);
        allLogs.push(...logs);
      } catch (error) {
        console.error(`Failed to read log file ${file}:`, error);
      }
    }

    // Filter by time
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    let filtered = allLogs.filter(log => log.timestamp >= cutoffTime);

    // Filter by severity
    if (severity && severity !== 'all') {
      filtered = filtered.filter(log => log.level === severity);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return filtered.slice(0, 1000); // Limit to 1000 most recent
  } catch (error) {
    console.error('Failed to read system logs:', error);
    return [];
  }
}

function parseLogFile(content: string, filename: string): SystemLogEntry[] {
  const lines = content.split('\n').filter(line => line.trim());
  const logs: SystemLogEntry[] = [];

  for (const line of lines) {
    try {
      const log = parseLogLine(line, filename);
      if (log) {
        logs.push(log);
      }
    } catch (error) {
      // Skip unparseable lines
    }
  }

  return logs;
}

function parseLogLine(line: string, source: string): SystemLogEntry | null {
  // Try to parse structured log formats

  // Format 1: JSON logs
  if (line.startsWith('{')) {
    try {
      const json = JSON.parse(line);
      return {
        timestamp: new Date(json.timestamp || json.time || Date.now()),
        level: json.level || json.severity || 'info',
        source: json.source || source,
        message: json.message || json.msg || line.substring(0, 200),
        details: json.details || json.data,
      };
    } catch {
      // Not valid JSON, continue
    }
  }

  // Format 2: Standard Python logging format
  // Example: 2026-02-26 10:30:45,123 - INFO - gpti_bot.crawl - Starting crawl...
  const pythonLogRegex = /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}[,\.]\d+)\s+-\s+(\w+)\s+-\s+([\w.]+)\s+-\s+(.*)$/;
  const pythonMatch = line.match(pythonLogRegex);
  if (pythonMatch) {
    const [, timestamp, level, module, message] = pythonMatch;
    return {
      timestamp: new Date(timestamp.replace(',', '.')),
      level: level.toLowerCase() as any,
      source: module || source,
      message: message.trim(),
    };
  }

  // Format 3: Timestamp at start
  // Example: [2026-02-26 10:30:45] ERROR: Something went wrong
  const timestampLogRegex = /^\[(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\]\s+(\w+):\s+(.*)$/;
  const timestampMatch = line.match(timestampLogRegex);
  if (timestampMatch) {
    const [, timestamp, level, message] = timestampMatch;
    return {
      timestamp: new Date(timestamp),
      level: level.toLowerCase() as any,
      source,
      message: message.trim(),
    };
  }

  // Format 4: Simple level prefix
  // Example: INFO: Starting process...
  const simpleLevelRegex = /^(\w+):\s+(.*)$/;
  const simpleLevelMatch = line.match(simpleLevelRegex);
  if (simpleLevelMatch && ['INFO', 'WARN', 'WARNING', 'ERROR', 'DEBUG'].includes(simpleLevelMatch[1].toUpperCase())) {
    const [, level, message] = simpleLevelMatch;
    return {
      timestamp: new Date(), // No timestamp in log, use now
      level: (level.toLowerCase() === 'warn' ? 'warning' : level.toLowerCase()) as any,
      source,
      message: message.trim(),
    };
  }

  // Format 5: Fallback - plain text (assume info level)
  if (line.trim().length > 0) {
    return {
      timestamp: new Date(),
      level: 'info',
      source,
      message: line.trim().substring(0, 500), // Limit message length
    };
  }

  return null;
}

export async function getLogFileList(): Promise<{ name: string; size: number; modified: Date }[]> {
  try {
    const files = await readdir(LOG_DIR);
    const logFiles = files.filter(f => f.endsWith('.log'));

    const fileInfo = await Promise.all(
      logFiles.map(async (file) => {
        const stats = await stat(join(LOG_DIR, file));
        return {
          name: file,
          size: stats.size,
          modified: stats.mtime,
        };
      })
    );

    return fileInfo.sort((a, b) => b.modified.getTime() - a.modified.getTime());
  } catch (error) {
    console.error('Failed to list log files:', error);
    return [];
  }
}

export async function tailLogFile(filename: string, lines: number = 100): Promise<string> {
  try {
    const filePath = join(LOG_DIR, filename);
    const content = await readFile(filePath, 'utf-8');
    const allLines = content.split('\n');
    const lastLines = allLines.slice(-lines);
    return lastLines.join('\n');
  } catch (error) {
    console.error(`Failed to tail log file ${filename}:`, error);
    return '';
  }
}
