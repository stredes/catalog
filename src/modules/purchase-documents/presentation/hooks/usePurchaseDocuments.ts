import { useCallback, useEffect, useState } from 'react';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { PurchaseDocument } from '../../domain/entities/PurchaseDocument';

export function usePurchaseDocuments() {
  const { repositories } = useDependencies();
  const [documents, setDocuments] = useState<PurchaseDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setDocuments(await repositories.purchaseDocuments.findAll());
    setLoading(false);
  }, [repositories.purchaseDocuments]);

  useEffect(() => { void reload(); }, [reload]);
  return { documents, loading, reload };
}
