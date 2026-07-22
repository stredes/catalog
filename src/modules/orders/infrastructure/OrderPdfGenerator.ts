import * as Print from 'expo-print';
import { Directory, File, Paths } from 'expo-file-system';
import { Order } from '../domain/entities/Order';
import { Profile } from '../../profile/domain/entities/profile';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMoneyCLP(value: number): string {
  return `$${value.toLocaleString('es-CL')}`;
}

function formatOrderNumber(num: number): string {
  return String(num).padStart(4, '0');
}

async function resolveLogoDataUri(logoUri: string | undefined): Promise<string> {
  if (!logoUri || logoUri.startsWith('data:')) return logoUri ?? '';
  try {
    const file = new File(logoUri);
    if (!file.exists) return '';
    const base64 = await file.base64();
    return `data:image/jpeg;base64,${base64}`;
  } catch {
    return '';
  }
}

export class OrderPdfGenerator {
  async generate(order: Order, profile: Profile | null): Promise<string> {
    const logoDataUri = await resolveLogoDataUri(profile?.logoUri);
    const html = this.buildHtml(order, profile, logoDataUri);

    const file = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const pdfDirectory = new Directory(Paths.document, 'order-pdfs');
    pdfDirectory.create({ idempotent: true, intermediates: true });

    const source = new File(file.uri);
    const destination = new File(
      pdfDirectory,
      `pedido-${formatOrderNumber(order.orderNumber)}-${order.clientName.replace(/\s+/g, '-').toLowerCase()}.pdf`,
    );

    source.copy(destination);

    if (!destination.exists || destination.size === 0) {
      throw new Error('El PDF del pedido esta vacio.');
    }

    return destination.uri;
  }

  private buildHtml(order: Order, profile: Profile | null, logoDataUri: string): string {
    const rows = order.items.map((item, index) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#6b7280;font-size:13px">${index + 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">
          <div style="font-weight:700;color:#111827;font-size:14px">${escapeHtml(item.productName)}</div>
          ${item.productCode ? `<div style="font-size:11px;color:#6b7280;margin-top:2px">Cod: ${escapeHtml(item.productCode)}</div>` : ''}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e77;text-align:center;color:#374151;font-size:13px">${escapeHtml(item.format)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#374151;font-size:13px">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#374151;font-size:13px">${formatMoneyCLP(item.unitPrice)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;color:#111827;font-size:13px">${formatMoneyCLP(item.subtotal)}</td>
      </tr>
    `).join('');

    const profileSection = profile ? `
      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:24px">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px">
          ${logoDataUri ? `<img src="${logoDataUri}" style="width:56px;height:56px;border-radius:8px;object-fit:contain" />` : ''}
          <div>
            <h2 style="margin:0;font-size:20px;color:#111827">${escapeHtml(profile.businessName)}</h2>
            ${profile.ownerName ? `<div style="font-size:13px;color:#6b7280;margin-top:2px">Responsable: ${escapeHtml(profile.ownerName)}</div>` : ''}
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px 24px;font-size:12px;color:#475569">
          ${profile.phone ? `<div>Tel: ${escapeHtml(profile.phone)}</div>` : ''}
          ${profile.email ? `<div>Email: ${escapeHtml(profile.email)}</div>` : ''}
          ${profile.address ? `<div>Dir: ${escapeHtml(profile.address)}</div>` : ''}
        </div>
        ${profile.bankName ? `
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb">
            <div style="font-size:10px;font-weight:800;color:#1d4ed8;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:6px">Datos de transferencia</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px 16px;font-size:12px;color:#64748b">
              <div>Banco: <strong style="color:#111827">${escapeHtml(profile.bankName)}</strong></div>
              ${profile.bankAccountType ? `<div>Tipo: <strong style="color:#111827">${escapeHtml(profile.bankAccountType)}</strong></div>` : ''}
              ${profile.bankAccountNumber ? `<div>N°: <strong style="color:#111827">${escapeHtml(profile.bankAccountNumber)}</strong></div>` : ''}
            </div>
          </div>
        ` : ''}
      </div>
    ` : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; font-size: 13px; line-height: 1.4; }
  </style>
</head>
<body>
  <div style="text-align:center;margin-bottom:8px">
    <h1 style="font-size:24px;font-weight:800;color:#111827;letter-spacing:1px">PEDIDO</h1>
    <div style="font-size:13px;color:#64748b;margin-top:4px">N° ${formatOrderNumber(order.orderNumber)}</div>
  </div>

  <div style="display:flex;justify-content:space-between;margin-bottom:20px;font-size:13px;color:#374151">
    <div><strong>Cliente:</strong> ${escapeHtml(order.clientName)}</div>
    <div><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleString('es-CL')}</div>
  </div>

  ${profileSection}

  <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:20px">
    <thead>
      <tr style="background:#f1f5f9">
        <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">#</th>
        <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Producto</th>
        <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Formato</th>
        <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Cant.</th>
        <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">P. Unit.</th>
        <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div style="display:flex;justify-content:flex-end">
    <div style="width:260px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:16px">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;color:#6b7280">
        <span>Subtotal</span>
        <span>${formatMoneyCLP(order.subtotal)}</span>
      </div>
      <div style="border-top:2px solid #dbeafe;padding-top:8px;margin-top:4px">
        <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:800;color:#111827">
          <span>TOTAL</span>
          <span style="color:#2563eb">${formatMoneyCLP(order.total)}</span>
        </div>
      </div>
    </div>
  </div>

  ${order.notes ? `
    <div style="margin-top:20px;padding:12px;background:#fffbeb;border:1px solid #fde68a;border-radius:6px">
      <div style="font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Notas</div>
      <div style="font-size:13px;color:#78350f">${escapeHtml(order.notes)}</div>
    </div>
  ` : ''}

  <div style="text-align:center;margin-top:32px;padding-top:16px;border-top:2px solid #e5e7eb">
    <div style="font-size:14px;font-weight:700;color:#111827">Gracias por su compra</div>
    ${profile?.businessName ? `<div style="font-size:11px;color:#6b7280;margin-top:4px">${escapeHtml(profile.businessName)}</div>` : ''}
  </div>
</body>
</html>`;
  }
}
