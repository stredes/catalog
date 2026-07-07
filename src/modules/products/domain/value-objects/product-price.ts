export class ProductPrice {
  constructor(public readonly value: number) {
    if (value < 0) {
      throw new Error('El precio no puede ser negativo.');
    }
  }
}
