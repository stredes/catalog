import { PurchaseDocument } from '../../domain/entities/PurchaseDocument';
import { PurchaseDocumentRepository } from '../../domain/repositories/PurchaseDocumentRepository';

export class GetPurchaseOrdersUseCase {
  constructor(private repository: PurchaseDocumentRepository) {}

  async execute(): Promise<PurchaseDocument[]> {
    const documents = await this.repository.findAll();
    return documents.filter((d) => d.type === 'purchase-order');
  }
}

export class ApprovePurchaseOrderUseCase {
  constructor(private repository: PurchaseDocumentRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.approvePurchaseOrder(id);
  }
}

export class RejectPurchaseOrderUseCase {
  constructor(private repository: PurchaseDocumentRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.setOrderStatus(id, 'cancelled');
  }
}
