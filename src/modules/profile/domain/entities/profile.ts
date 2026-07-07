import { BaseEntity, AuditableEntity } from '../../../../shared/domain/base-entity';

export class Profile extends BaseEntity<string> implements AuditableEntity {
  constructor(
    id: string,
    public name: string,
    public email: string,
    public phone: string,
    public company: string,
    public address: string,
    public photoUri: string | null,
    public rut: string,
    public createdAt: string,
    public updatedAt: string,
  ) {
    super(id);
  }
}
