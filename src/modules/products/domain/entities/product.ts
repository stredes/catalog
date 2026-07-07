import { BaseEntity, AuditableEntity } from '../../../../shared/domain/base-entity';
import { ProductPrice } from '../value-objects/product-price';

export type ProductFormat = 'grid-2' | 'grid-3' | 'list' | 'premium';

export class Product extends BaseEntity<string> implements AuditableEntity {
  public readonly price: ProductPrice;

  constructor(
    id: string,
    public name: string,
    price: number,
    public format: ProductFormat,
    public photoUri: string | null,
    public familyId: string,
    public createdAt: string,
    public updatedAt: string,
  ) {
    super(id);
    this.price = new ProductPrice(price);
  }
}
