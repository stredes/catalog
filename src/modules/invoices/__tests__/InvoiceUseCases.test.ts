import { describe, expect, it } from 'vitest';
import { InMemoryInvoiceRepository } from '../../../__tests__/fakes';
import {
  CreateInvoiceUseCase,
  DeleteInvoiceUseCase,
  GetInvoicesUseCase,
  UpdateInvoiceStatusUseCase,
  UpdateInvoiceUseCase,
} from '../application/use-cases/InvoiceUseCases';

const validInput = {
  invoiceNumber: 'F-001',
  invoiceDate: '2026-08-01',
  clientName: 'Juan Perez',
  netAmount: 10000,
  status: 'pending' as const,
};

describe('InvoiceUseCases', () => {
  it('crea una factura con IVA y total calculados', async () => {
    const repo = new InMemoryInvoiceRepository();
    const create = new CreateInvoiceUseCase(repo);

    const invoice = await create.execute(validInput);

    expect(invoice.id).toMatch(/^inv_/);
    expect(invoice.taxAmount).toBe(1900);
    expect(invoice.totalAmount).toBe(11900);
    expect(invoice.status).toBe('pending');
    expect(invoice.paymentDate).toBeUndefined();
  });

  it('crea factura pagada con paymentDate', async () => {
    const repo = new InMemoryInvoiceRepository();
    const create = new CreateInvoiceUseCase(repo);

    const invoice = await create.execute({
      ...validInput,
      status: 'paid',
      paymentDate: '2026-08-05',
    });

    expect(invoice.paymentDate).toBe('2026-08-05');
  });

  it('actualiza una factura recalculando montos', async () => {
    const repo = new InMemoryInvoiceRepository();
    const create = new CreateInvoiceUseCase(repo);
    const invoice = await create.execute(validInput);

    const update = new UpdateInvoiceUseCase(repo);
    const updated = await update.execute(invoice.id, {
      ...validInput,
      invoiceNumber: 'F-002',
      netAmount: 20000,
    });

    expect(updated.invoiceNumber).toBe('F-002');
    expect(updated.taxAmount).toBe(3800);
    expect(updated.totalAmount).toBe(23800);
  });

  it('lanza error al actualizar una factura inexistente', async () => {
    const repo = new InMemoryInvoiceRepository();
    const update = new UpdateInvoiceUseCase(repo);

    await expect(update.execute('inv_missing', validInput)).rejects.toThrow();
  });

  it('cambia el estado a paid asignando la fecha', async () => {
    const repo = new InMemoryInvoiceRepository();
    const create = new CreateInvoiceUseCase(repo);
    const invoice = await create.execute(validInput);

    const changeStatus = new UpdateInvoiceStatusUseCase(repo);
    const updated = await changeStatus.execute(invoice.id, 'paid', '2026-08-10');

    expect(updated.status).toBe('paid');
    expect(updated.paymentDate).toBe('2026-08-10');
  });

  it('elimina y lista facturas', async () => {
    const repo = new InMemoryInvoiceRepository();
    const create = new CreateInvoiceUseCase(repo);
    const created = await create.execute(validInput);

    const remove = new DeleteInvoiceUseCase(repo);
    await remove.execute(created.id);

    const list = new GetInvoicesUseCase(repo);
    expect(await list.execute()).toHaveLength(0);
  });
});
