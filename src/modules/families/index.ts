import { getDatabase } from '../../shared/infrastructure/database';

export interface Family {
  id: string;
  name: string;
}

export function getDefaultFamilies(): Family[] {
  const db = getDatabase();
  const rows = db.getAllSync('SELECT id, name FROM families ORDER BY name ASC') as any[];
  return rows.map((row: any) => ({ id: row.id, name: row.name }));
}
