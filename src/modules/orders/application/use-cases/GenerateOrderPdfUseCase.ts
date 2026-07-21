import { Order } from '../../domain/entities/Order';
import { Profile } from '../../../profile/domain/entities/profile';

export interface OrderPdfGeneratorPort {
  generate(order: Order, profile: Profile | null): Promise<string>;
}

export class GenerateOrderPdfUseCase {
  constructor(private readonly pdfGenerator: OrderPdfGeneratorPort) {}

  async execute(order: Order, profile: Profile | null): Promise<string> {
    return this.pdfGenerator.generate(order, profile);
  }
}
