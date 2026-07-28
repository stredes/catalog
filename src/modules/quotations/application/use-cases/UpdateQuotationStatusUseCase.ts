import { QuotationStatus } from '../../domain/entities/Quotation';
import { QuotationRepository } from '../../domain/repositories/QuotationRepository';

export class UpdateQuotationStatusUseCase {
  constructor(private quotationRepository: QuotationRepository) {}

  async execute(id: string, status: QuotationStatus): Promise<void> {
    const quotation = await this.quotationRepository.findById(id);
    if (!quotation) throw new Error('Cotizacion no encontrada');
    await this.quotationRepository.update({ ...quotation, status });
  }
}
