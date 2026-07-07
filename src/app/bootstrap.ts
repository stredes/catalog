import { runMigrations } from '../shared/infrastructure/database';

export function initializeDatabase(): void {
  runMigrations();
}
