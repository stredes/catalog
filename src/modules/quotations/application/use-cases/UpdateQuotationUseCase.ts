import { Quotation } from '../../domain/entities/Quotation';
import { QuotationRepository } from '../../domain/repositories/QuotationRepository';

export class UpdateQuotationUseCase {
  constructor(private quotationRepository: QuotationRepository) {}

  async execute(quotation: Quotation): Promise<void> {
    await this.quotationRepository.update(quotation);
  }
}
