import { FamilyRepository } from '../../../families/domain/repositories/FamilyRepository';
import { ProductRepository } from '../../../products/domain/repositories/ProductRepository';
import { CatalogRepository } from '../../../catalogs/domain/repositories/CatalogRepository';
import { ProfileRepository } from '../../../profile/domain/repositories/ProfileRepository';
import { ChangeTrackerPort, ChangeSnapshot, TableCounts } from '../../domain/repositories/ChangeTrackerPort';

export class ChangeDetector implements ChangeTrackerPort {
  constructor(
    private readonly familyRepo: FamilyRepository,
    private readonly productRepo: ProductRepository,
    private readonly catalogRepo: CatalogRepository,
    private readonly profileRepo: ProfileRepository,
  ) {}

  async capture(): Promise<ChangeSnapshot> {
    const [families, products, catalogs, profile] = await Promise.all([
      this.familyRepo.findAll(),
      this.productRepo.findAll(),
      this.catalogRepo.findAll(),
      this.profileRepo.find(),
    ]);

    const counts: TableCounts = {
      families: families.length,
      products: products.length,
      catalogs: catalogs.length,
      hasProfile: profile !== null,
    };

    return {
      counts,
      checksum: this.computeChecksum(counts),
      timestamp: new Date().toISOString(),
    };
  }

  async hasChanged(previous: ChangeSnapshot): Promise<boolean> {
    const current = await this.capture();
    return current.checksum !== previous.checksum;
  }

  async hasMassiveDeletion(previous: ChangeSnapshot, threshold = 0.5): Promise<boolean> {
    const current = await this.capture();

    const familyLoss = previous.counts.families > 0
      ? (previous.counts.families - current.counts.families) / previous.counts.families
      : 0;

    const productLoss = previous.counts.products > 0
      ? (previous.counts.products - current.counts.products) / previous.counts.products
      : 0;

    return familyLoss >= threshold || productLoss >= threshold;
  }

  computeChecksum(counts: TableCounts): string {
    const raw = JSON.stringify(counts);
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return Math.abs(hash).toString(36);
  }
}
