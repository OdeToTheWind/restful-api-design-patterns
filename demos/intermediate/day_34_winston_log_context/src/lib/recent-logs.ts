import Transport from 'winston-transport';

export type LogEntry = Record<string, unknown> & { level: string; message: string };

/**
 * Keeps the last N log entries in memory so GET /api/debug/logs can show exactly what was
 * written — after the shared formats added the request context and redacted secrets.
 */
export class RecentLogsTransport extends Transport {
  private readonly entries: LogEntry[] = [];

  constructor(private readonly capacity = 200) {
    super();
  }

  log(info: LogEntry, callback: () => void) {
    this.entries.push({ ...info });
    if (this.entries.length > this.capacity) this.entries.shift();
    callback();
  }

  list(filter: { requestId?: string } = {}): LogEntry[] {
    return this.entries.filter((entry) => !filter.requestId || entry.requestId === filter.requestId);
  }
}
