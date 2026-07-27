import { QuotationRepository } from '../../domain/repositories/QuotationRepository';

export class DeleteQuotationUseCase {
  constructor(private quotationRepository: QuotationRepository) {}

  async execute(id: string): Promise<void> {
    await this.quotationRepository.delete(id);
  }
}
