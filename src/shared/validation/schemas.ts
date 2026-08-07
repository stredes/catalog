import { z } from 'zod';

export const PositiveFiniteNumber = z.number()
  .finite('El valor debe ser un número finito')
  .nonnegative('El valor no puede ser negativo');

export const StrictPositiveInteger = z.number()
  .int('Debe ser un número entero')
  .finite('Debe ser un número finito')
  .positive('Debe ser mayor a cero');

export const NonNegativeInteger = z.number()
  .int('Debe ser un número entero')
  .finite('Debe ser un número finito')
  .nonnegative('No puede ser negativo');

export const PercentageSchema = z.number()
  .finite('Debe ser un número finito')
  .min(0, 'No puede ser menor a 0')
  .max(100, 'No puede ser mayor a 100');

export const MoneySchema = z.number()
  .finite('Debe ser un número finito')
  .nonnegative('No puede ser negativo');

export const FamilySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type ValidatedFamily = z.infer<typeof FamilySchema>;

export const ProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  code: z.string().nullish(),
  price: MoneySchema.positive('El precio debe ser mayor a cero'),
  stock: NonNegativeInteger,
  format: z.enum(['unit', 'box', 'pack', 'service']),
  photoUri: z.string().nullish(),
  familyId: z.string().min(1),
  supplierId: z.string().nullish(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type ValidatedProduct = z.infer<typeof ProductSchema>;

export const ProfileSchema = z.object({
  id: z.literal('profile'),
  businessName: z.string().min(1),
  ownerName: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
  address: z.string().nullish(),
  website: z.string().nullish(),
  logoUri: z.string().nullish(),
  bankName: z.string().nullish(),
  bankAccountType: z.string().nullish(),
  bankAccountNumber: z.string().nullish(),
  updatedAt: z.string().min(1),
});

export type ValidatedProfile = z.infer<typeof ProfileSchema>;

export const OrderStatusSchema = z.enum(['pending', 'partial', 'paid']);

export const CartItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  productCode: z.string().nullish(),
  unitPrice: MoneySchema.positive('El precio unitario debe ser mayor a cero'),
  quantity: StrictPositiveInteger,
  format: z.string().min(1),
  discountType: z.enum(['none', 'currency', 'percentage'])
    .nullish()
    .transform((value) => value ?? 'none'),
  discountValue: z.number().finite().nonnegative()
    .nullish()
    .transform((value) => value ?? 0),
  subtotal: MoneySchema,
});

export type ValidatedCartItem = z.infer<typeof CartItemSchema>;

export const OrderSchema = z.object({
  id: z.string().min(1),
  orderNumber: NonNegativeInteger,
  clientName: z.string().min(1),
  clientId: z.string().optional(),
  items: z.array(CartItemSchema)
    .nullish()
    .transform((value) => value ?? []),
  subtotal: MoneySchema,
  iva: MoneySchema,
  total: MoneySchema,
  status: OrderStatusSchema
    .nullish()
    .transform((value) => value ?? 'pending'),
  paidAmount: MoneySchema
    .nullish()
    .transform((value) => value ?? 0),
  notes: z.string().nullish(),
  createdAt: z.string().min(1),
});

export type ValidatedOrder = z.infer<typeof OrderSchema>;

export const CatalogSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  familyId: z.string().min(1),
  familyIds: z.array(z.string()).nullish(),
  format: z.enum(['grid-2', 'grid-3', 'grid-4x5', 'grid-3x7', 'simple-list', 'premium-cover']),
  purpose: z.enum(['catalog', 'purchase-detail']).nullish(),
  productIds: z.array(z.string())
    .nullish()
    .transform((value) => value ?? []),
  pdfUri: z.string().min(1),
  createdAt: z.string().min(1),
});

export type ValidatedCatalog = z.infer<typeof CatalogSchema>;

export const SupplierSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  rut: z.string().nullish(),
  address: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
  contactName: z.string().nullish(),
  notes: z.string().nullish(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type ValidatedSupplier = z.infer<typeof SupplierSchema>;

export const ClientSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  rut: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
  notes: z.string().nullish(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type ValidatedClient = z.infer<typeof ClientSchema>;

export const InvoiceStatusSchema = z.enum(['pending', 'paid']);

export const InvoiceSchema = z.object({
  id: z.string().min(1),
  invoiceNumber: z.string().min(1),
  invoiceDate: z.string().min(1),
  clientName: z.string().min(1),
  description: z.string().nullish(),
  netAmount: MoneySchema,
  taxAmount: MoneySchema,
  totalAmount: MoneySchema,
  paymentDate: z.string().nullish(),
  status: InvoiceStatusSchema
    .nullish()
    .transform((value) => value ?? 'pending'),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type ValidatedInvoice = z.infer<typeof InvoiceSchema>;

export const ServiceItemSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  quantity: StrictPositiveInteger,
  unitPrice: MoneySchema.positive('El precio unitario debe ser mayor a cero'),
  subtotal: MoneySchema,
});

export type ValidatedServiceItem = z.infer<typeof ServiceItemSchema>;

export const QuotationStatusSchema = z.enum(['pending', 'accepted', 'paid', 'rejected', 'deleted']);

export const QuotationSchema = z.object({
  id: z.string().min(1),
  quotationNumber: NonNegativeInteger,
  clientName: z.string().min(1),
  clientRut: z.string().nullish(),
  clientPhone: z.string().nullish(),
  clientEmail: z.string().nullish(),
  clientAddress: z.string().nullish(),
  items: z.array(ServiceItemSchema)
    .nullish()
    .transform((value) => value ?? []),
  subtotal: MoneySchema,
  ivaRate: z.number().finite().nonnegative(),
  ivaAmount: MoneySchema,
  total: MoneySchema,
  status: QuotationStatusSchema
    .nullish()
    .transform((value) => value ?? 'pending'),
  notes: z.string().nullish(),
  validUntil: z.string().nullish(),
  createdAt: z.string().min(1),
});

export type ValidatedQuotation = z.infer<typeof QuotationSchema>;

export const PurchaseCartItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  productCode: z.string().optional(),
  unitPrice: MoneySchema.positive('El precio unitario debe ser mayor a cero'),
  quantity: StrictPositiveInteger,
  format: z.string().min(1),
  discountType: z.enum(['none', 'currency', 'percentage']),
  discountValue: z.number().finite().nonnegative(),
  subtotal: MoneySchema,
});

export const PurchaseDocumentTypeSchema = z.enum(['quotation', 'purchase-order']);
export const PurchaseDocumentStatusSchema = z.enum(['draft', 'generated', 'deleted']);
export const PurchaseOrderStatusSchema = z.enum(['pending', 'approved', 'cancelled']);

export const PurchaseDocumentSchema = z.object({
  id: z.string().min(1),
  documentNumber: NonNegativeInteger,
  type: PurchaseDocumentTypeSchema,
  supplierId: z.string().min(1),
  supplierName: z.string().min(1),
  items: z.array(PurchaseCartItemSchema),
  netAmount: MoneySchema,
  ivaAmount: MoneySchema,
  total: MoneySchema,
  notes: z.string().optional(),
  pdfUri: z.string().optional(),
  status: PurchaseDocumentStatusSchema.default('generated'),
  orderStatus: PurchaseOrderStatusSchema.default('pending'),
  createdAt: z.string().min(1),
});

export type ValidatedPurchaseDocument = z.infer<typeof PurchaseDocumentSchema>;

export const BackupPayloadSchema = z.object({
  schemaVersion: z.number().int().nonnegative(),
  createdAt: z.string().min(1),
  families: z.array(FamilySchema),
  products: z.array(ProductSchema),
  catalogs: z.array(CatalogSchema),
  profile: ProfileSchema.nullable(),
  orders: z.array(OrderSchema),
  suppliers: z.array(SupplierSchema)
    .nullish()
    .transform((value) => value ?? []),
  quotations: z.array(QuotationSchema)
    .nullish()
    .transform((value) => value ?? []),
  clients: z.array(ClientSchema)
    .nullish()
    .transform((value) => value ?? []),
  invoices: z.array(InvoiceSchema)
    .nullish()
    .transform((value) => value ?? []),
  purchaseDocuments: z.array(PurchaseDocumentSchema)
    .nullish()
    .transform((value) => value ?? []),
  images: z.record(z.string(), z.string())
    .nullish()
    .transform((value) => value ?? {}),
  imageFiles: z.record(z.string(), z.string())
    .nullish()
    .transform((value) => value ?? {}),
});

export type ValidatedBackupPayload = z.infer<typeof BackupPayloadSchema>;

export type ValidationError = {
  path: string;
  message: string;
};

export function validateBackupPayload(raw: unknown): {
  success: true;
  data: ValidatedBackupPayload;
} | {
  success: false;
  errors: ValidationError[];
} {
  const result = BackupPayloadSchema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: ValidationError[] = result.error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));

  return { success: false, errors };
}

export function validateArray<T>(raw: unknown[], schema: z.ZodType<T>, entityName: string): {
  valid: T[];
  failures: Array<{ index: number; errors: string[] }>;
} {
  const valid: T[] = [];
  const failures: Array<{ index: number; errors: string[] }> = [];

  for (let i = 0; i < raw.length; i++) {
    const result = schema.safeParse(raw[i]);
    if (result.success) {
      valid.push(result.data);
    } else {
      failures.push({
        index: i,
        errors: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
      });
    }
  }

  return { valid, failures };
}

export class ValidationErrorReport extends Error {
  readonly errors: ValidationError[];
  readonly entityName: string;

  constructor(entityName: string, errors: ValidationError[]) {
    const summary = errors
      .slice(0, 5)
      .map((e) => `[${e.path}] ${e.message}`)
      .join('; ');
    super(`Validación fallida para ${entityName}: ${summary}${errors.length > 5 ? ` (+${errors.length - 5} más)` : ''}`);
    this.name = 'ValidationErrorReport';
    this.entityName = entityName;
    this.errors = errors;
  }
}
