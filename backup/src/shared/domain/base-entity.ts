export abstract class BaseEntity<TId extends string | number> {
  constructor(public readonly id: TId) {}
}

export interface AuditableEntity {
  createdAt: string;
  updatedAt: string;
}
