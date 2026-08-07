import { describe, it, expect } from 'vitest';
import {
  InMemoryPurchaseDocumentRepository,
} from '../../../../__tests__/fakes';
import {
  ApprovePurchaseOrderUseCase,
  GetPurchaseOrdersUseCase,
  RejectPurchaseOrderUseCase,
} from './PurchaseOrderUseCases';
import { PurchaseDocument } from '../../domain/entities/PurchaseDocument';

function makeDocument(overrides: Partial<PurchaseDocument> = {}): PurchaseDocument {
  return {
    id: 'pdoc_1',
    documentNumber: 1,
    type: 'purchase-order',
    supplierId: 'sup_1',
    supplierName: 'Proveedor A',
    items: [{
      productId: 'prd_1',
      productName: 'Producto 1',
      unitPrice: 1000,
      quantity: 3,
      format: 'unit',
      discountType: 'none',
      discountValue: 0,
      subtotal: 3000,
    }],
    netAmount: 3000,
    ivaAmount: 570,
    total: 3570,
    status: 'generated',
    orderStatus: 'pending',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('PurchaseOrderUseCases', () => {
  it('lista solo ordenes de compra (excluye cotizaciones)', async () => {
    const repo = new InMemoryPurchaseDocumentRepository();
    await repo.createDraft(makeDocument({ id: 'oc_1', type: 'purchase-order', documentNumber: 1 }));
    await repo.createDraft(makeDocument({ id: 'cot_1', type: 'quotation', documentNumber: 1 }));
    await repo.attachPdf('oc_1', 'file:///oc.pdf');
    await repo.attachPdf('cot_1', 'file:///cot.pdf');

    const orders = await new GetPurchaseOrdersUseCase(repo).execute();

    expect(orders).toHaveLength(1);
    expect(orders[0].id).toBe('oc_1');
  });

  it('aprobar una orden cambia su estado a approved', async () => {
    const repo = new InMemoryPurchaseDocumentRepository();
    await repo.createDraft(makeDocument({ id: 'oc_1' }));
    await repo.attachPdf('oc_1', 'file:///oc.pdf');

    await new ApprovePurchaseOrderUseCase(repo).execute('oc_1');

    expect((await repo.findById('oc_1'))?.orderStatus).toBe('approved');
  });

  it('no permite aprobar dos veces la misma orden', async () => {
    const repo = new InMemoryPurchaseDocumentRepository();
    await repo.createDraft(makeDocument({ id: 'oc_1' }));
    await repo.attachPdf('oc_1', 'file:///oc.pdf');

    await new ApprovePurchaseOrderUseCase(repo).execute('oc_1');
    await expect(new ApprovePurchaseOrderUseCase(repo).execute('oc_1')).rejects.toThrow('ya fue aprobada');
  });

  it('no permite aprobar una cotizacion', async () => {
    const repo = new InMemoryPurchaseDocumentRepository();
    await repo.createDraft(makeDocument({ id: 'cot_1', type: 'quotation' }));

    await expect(new ApprovePurchaseOrderUseCase(repo).execute('cot_1')).rejects.toThrow(/solo las órdenes de compra/i);
  });

  it('rechazar una orden pendiente la cancela', async () => {
    const repo = new InMemoryPurchaseDocumentRepository();
    await repo.createDraft(makeDocument({ id: 'oc_1' }));
    await repo.attachPdf('oc_1', 'file:///oc.pdf');

    await new RejectPurchaseOrderUseCase(repo).execute('oc_1');

    expect((await repo.findById('oc_1'))?.orderStatus).toBe('cancelled');
  });

  it('una orden cancelada no puede aprobarse', async () => {
    const repo = new InMemoryPurchaseDocumentRepository();
    await repo.createDraft(makeDocument({ id: 'oc_1' }));
    await repo.attachPdf('oc_1', 'file:///oc.pdf');

    await new RejectPurchaseOrderUseCase(repo).execute('oc_1');
    await expect(new ApprovePurchaseOrderUseCase(repo).execute('oc_1')).rejects.toThrow('fue cancelada');
  });
});
