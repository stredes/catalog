import { Quotation, IVA_RATE } from '../../domain/entities/Quotation';
import { ServiceItem, calculateServiceSubtotal } from '../../domain/entities/ServiceItem';
import { QuotationRepository } from '../../domain/repositories/QuotationRepository';
import { QuotationInputDto } from '../dtos/QuotationDtos';
import { createId } from '../../../../shared/utils/ids';
import { nowIso } from '../../../../shared/utils/dates';

export class CreateQuotationUseCase {
  constructor(private quotationRepository: QuotationRepository) {}

  async execute(input: QuotationInputDto): Promise<Quotation> {
    const items: ServiceItem[] = input.items.map((item) => ({
      id: createId('svc'),
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: calculateServiceSubtotal(item.quantity, item.unitPrice),
    }));

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const ivaAmount = Math.round(subtotal * IVA_RATE / 100);
    const total = subtotal + ivaAmount;

    const quotationNumber = (await this.quotationRepository.getMaxQuotationNumber()) + 1;

    const quotation: Quotation = {
      id: createId('qt'),
      quotationNumber,
      clientName: input.clientName,
      clientRut: input.clientRut || undefined,
      clientPhone: input.clientPhone || undefined,
      clientEmail: input.clientEmail || undefined,
      clientAddress: input.clientAddress || undefined,
      items,
      subtotal,
      ivaRate: IVA_RATE,
      ivaAmount,
      total,
      status: 'pending',
      notes: input.notes || undefined,
      validUntil: input.validUntil || undefined,
      createdAt: nowIso(),
    };

    await this.quotationRepository.save(quotation);
    return quotation;
  }
}
