import { AnalyticsPort, AnalyticsEvent } from '../domain/AnalyticsPort';
import { getDatabase } from './sqlite';

export class SqliteAnalyticsRepository implements AnalyticsPort {
  async track(event: AnalyticsEvent): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO analytics_events (id, name, properties, createdAt)
       VALUES (?, ?, ?, ?)`,
      [
        `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        event.name,
        event.properties ? JSON.stringify(event.properties) : null,
        event.timestamp ?? new Date().toISOString(),
      ],
    );
  }

  async getEvents(name: string): Promise<AnalyticsEvent[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      name: string;
      properties: string | null;
      createdAt: string;
    }>(
      `SELECT name, properties, createdAt FROM analytics_events WHERE name = ? ORDER BY createdAt DESC`,
      [name],
    );

    return rows.map((row) => ({
      name: row.name,
      properties: row.properties ? JSON.parse(row.properties) : undefined,
      timestamp: row.createdAt,
    }));
  }
}
