import { nowIso } from '../../../../shared/utils/dates';
import { createId } from '../../../../shared/utils/ids';
import { Invoice, InvoiceStatus } from '../../domain/entities/Invoice';
import { InvoiceRepository } from '../../domain/repositories/InvoiceRepository';
import { calculateInvoiceTotal, calculateTax } from '../../domain/services/invoiceCalculations';
import { InvoiceInputDto, invoiceSchema } from '../dtos/InvoiceDtos';

export class CreateInvoiceUseCase {
  constructor(private readonly repository: InvoiceRepository) {}

  async execute(input: InvoiceInputDto): Promise<Invoice> {
    const dto = invoiceSchema.parse(input);
    const taxAmount = calculateTax(dto.netAmount);
    const totalAmount = calculateInvoiceTotal(dto.netAmount, taxAmount);
    const timestamp = nowIso();

    const invoice: Invoice = {
      id: createId('inv'),
      invoiceNumber: dto.invoiceNumber,
      invoiceDate: dto.invoiceDate,
      clientName: dto.clientName,
      description: dto.description || undefined,
      netAmount: dto.netAmount,
      taxAmount,
      totalAmount,
      paymentDate: dto.status === 'paid' ? dto.paymentDate : undefined,
      status: dto.status,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.repository.create(invoice);
    return invoice;
  }
}

export class UpdateInvoiceUseCase {
  constructor(private readonly repository: InvoiceRepository) {}

  async execute(id: string, input: InvoiceInputDto): Promise<Invoice> {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new Error(`Factura no encontrada: ${id}`);
    }

    const dto = invoiceSchema.parse(input);
    const taxAmount = calculateTax(dto.netAmount);
    const totalAmount = calculateInvoiceTotal(dto.netAmount, taxAmount);

    const updated: Invoice = {
      ...current,
      invoiceNumber: dto.invoiceNumber,
      invoiceDate: dto.invoiceDate,
      clientName: dto.clientName,
      description: dto.description || undefined,
      netAmount: dto.netAmount,
      taxAmount,
      totalAmount,
      paymentDate: dto.status === 'paid' ? dto.paymentDate : undefined,
      status: dto.status,
      updatedAt: nowIso(),
    };

    await this.repository.update(updated);
    return updated;
  }
}

export class DeleteInvoiceUseCase {
  constructor(private readonly repository: InvoiceRepository) {}

  execute(id: string) {
    return this.repository.delete(id);
  }
}

export class UpdateInvoiceStatusUseCase {
  constructor(private readonly repository: InvoiceRepository) {}

  async execute(id: string, status: InvoiceStatus, paymentDate?: string): Promise<Invoice> {
    if (status === 'paid' && !paymentDate) {
      paymentDate = nowIso().slice(0, 10);
    }
    return this.repository.updateStatus(id, status, paymentDate);
  }
}

export class GetInvoicesUseCase {
  constructor(private readonly repository: InvoiceRepository) {}

  execute() {
    return this.repository.findAll();
  }
}
