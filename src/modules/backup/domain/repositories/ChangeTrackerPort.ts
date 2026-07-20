export type TableCounts = {
  families: number;
  products: number;
  catalogs: number;
  hasProfile: boolean;
};

export type ChangeSnapshot = {
  counts: TableCounts;
  checksum: string;
  timestamp: string;
};

export interface ChangeTrackerPort {
  capture(): Promise<ChangeSnapshot>;
  hasChanged(previous: ChangeSnapshot): Promise<boolean>;
}
