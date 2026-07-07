import * as Print from 'expo-print';

export class PdfService {
  async generateCatalogPdf(products: Array<{ name: string; price: number }>): Promise<string> {
    const rows = products
      .map((p) => `<tr><td>${p.name}</td><td>$${p.price.toFixed(2)}</td></tr>`)
      .join('');

    const html = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 24px; }
            h1 { font-size: 24px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f0f0f0; }
          </style>
        </head>
        <body>
          <h1>Catálogo</h1>
          <table>
            <tr><th>Producto</th><th>Precio</th></tr>
            ${rows}
          </table>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    return uri;
  }
}
