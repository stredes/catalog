import { escapeHtml } from '../utils/html';

export function renderSectionHeader(kicker: string, title: string, description?: string) {
  return `<header class="section-header">
    <p>${escapeHtml(kicker)}</p>
    <h2>${escapeHtml(title)}</h2>
    ${description ? `<span>${escapeHtml(description)}</span>` : ''}
  </header>`;
}

