import { Quotation } from '../../domain/entities/Quotation';
import { Profile } from '../../../profile/domain/entities/profile';
import { QuotationPdfGenerator } from '../../infrastructure/QuotationPdfGenerator';

export class GenerateQuotationPdfUseCase {
  constructor(private pdfGenerator: QuotationPdfGenerator) {}

  async execute(quotation: Quotation, profile: Profile | null): Promise<string> {
    return this.pdfGenerator.generate(quotation, profile);
  }
}
