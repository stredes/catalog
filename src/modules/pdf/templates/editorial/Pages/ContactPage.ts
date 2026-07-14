import { renderPageFrame } from '../Components/PageFrame';
import { escapeHtml } from '../utils/html';
import { EditorialProfile } from '../types';

export function renderContactPage(pageNumber: number, profile?: EditorialProfile) {
  const businessName = profile?.businessName || 'Marca';
  const rows = [
    profile?.ownerName,
    profile?.phone,
    profile?.email,
    profile?.website,
    profile?.address,
  ].filter(Boolean);

  return renderPageFrame({
    title: 'Contacto',
    pageNumber,
    children: `<div class="contact-layout">
      <div class="contact-title">
        <h2>${escapeHtml(businessName)}</h2>
        <div class="contact-list">
          ${
            rows.length > 0
              ? rows.map((row) => `<p>${escapeHtml(String(row))}</p>`).join('')
              : '<p>contacto@empresa.com</p><p>+00 0000 0000</p><p>www.empresa.com</p>'
          }
        </div>
      </div>
      <div class="qr-box">Codigo QR</div>
    </div>`,
  });
}

