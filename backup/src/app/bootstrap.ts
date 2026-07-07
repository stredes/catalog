import { initializeSchema } from '../shared/infrastructure/database';

export function initializeDatabase(): void {
  initializeSchema();
}
