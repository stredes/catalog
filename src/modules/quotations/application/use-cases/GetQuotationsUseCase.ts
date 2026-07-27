import { Quotation } from '../../domain/entities/Quotation';
import { QuotationRepository } from '../../domain/repositories/QuotationRepository';

export class GetQuotationsUseCase {
  constructor(private quotationRepository: QuotationRepository) {}

  async execute(): Promise<Quotation[]> {
    return this.quotationRepository.findAll();
  }
}
