import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { Transaction } from './transaction-db';

const INVOICE_DIR = join(process.cwd(), 'public', 'invoices');

// Pastikan directory invoice ada
function ensureInvoiceDir(): void {
  if (!existsSync(INVOICE_DIR)) {
    mkdirSync(INVOICE_DIR, { recursive: true });
  }
}

// Generate invoice HTML untuk printer struk 58mm
export function generateInvoiceHTML(transaction: Transaction): string {
  const invoiceNumber = `INV-${transaction.id.slice(0, 8).toUpperCase()}`;
  const date = new Date(transaction.createdAt).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const paymentMethodLabels: Record<string, string> = {
    cash: 'Cash',
    transfer: 'Transfer',
    qris: 'QRIS',
    debit: 'Kartu Debit',
    kredit: 'Kartu Kredit',
  };

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    @page {
      size: 58mm auto;
      margin: 0;
      padding: 0;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 58mm;
      height: auto;
      min-height: auto;
    }
    body {
      font-family: 'Courier New', monospace;
      width: 58mm;
      padding: 5mm;
      color: #000;
      font-size: 10px;
      line-height: 1.3;
      margin: 0;
      overflow: visible;
    }
    .header {
      text-align: center;
      margin-bottom: 6px;
      border-bottom: 1px dashed #000;
      padding-bottom: 6px;
    }
    .header h1 {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 3px;
      text-transform: uppercase;
    }
    .header p {
      font-size: 9px;
      margin: 0;
    }
    .invoice-info {
      margin-bottom: 6px;
      font-size: 9px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .info-label {
      font-weight: bold;
    }
    .kasir-info {
      margin-bottom: 6px;
      font-size: 9px;
      font-weight: bold;
    }
    .items-section {
      margin-bottom: 6px;
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
      padding: 5px 0;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
      font-size: 9px;
    }
    .item-row:last-child {
      margin-bottom: 0;
    }
    .item-name {
      flex: 1;
      margin-right: 4px;
      word-break: break-word;
    }
    .item-details {
      text-align: right;
      white-space: nowrap;
      font-size: 8px;
    }
    .item-qty-price {
      display: block;
    }
    .item-subtotal {
      display: block;
      font-weight: bold;
      margin-top: 2px;
    }
    .total-section {
      margin-top: 6px;
      border-top: 1px dashed #000;
      padding-top: 6px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 3px;
    }
    .total-final {
      font-size: 13px;
      font-weight: bold;
      text-align: center;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid #000;
    }
    .footer {
      margin-top: 6px;
      text-align: center;
      font-size: 8px;
      border-top: 1px dashed #000;
      padding-top: 5px;
      padding-bottom: 0;
    }
    .footer p {
      margin: 2px 0;
    }
    .footer p:last-child {
      margin-bottom: 0;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 4px 0;
    }
    @media print {
      html, body {
        margin: 0;
        padding: 5mm;
        width: 58mm;
        height: auto;
        min-height: auto;
        overflow: visible;
      }
      .no-print {
        display: none;
      }
      @page {
        size: 58mm auto;
        margin: 0;
        padding: 0;
      }
      * {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>INVOICE</h1>
    <p>Toko Ira Endut Sambeng</p>
  </div>

  <div class="invoice-info">
    <div class="info-row">
      <span class="info-label">No:</span>
      <span>${invoiceNumber}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Tanggal:</span>
      <span>${date}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Bayar:</span>
      <span>${paymentMethodLabels[transaction.metodePembayaran] || transaction.metodePembayaran}</span>
    </div>
  </div>

  ${transaction.kasir ? `
    <div class="kasir-info">
      Kasir: ${transaction.kasir}
    </div>
  ` : ''}

  <div class="divider"></div>

  <div class="items-section">
    ${transaction.items.map((item) => `
      <div class="item-row">
        <div class="item-name">${item.namaBarang}</div>
        <div class="item-details">
          <span class="item-qty-price">${item.quantity} x Rp ${item.hargaJual.toLocaleString('id-ID')}</span>
          <span class="item-subtotal">Rp ${item.subtotal.toLocaleString('id-ID')}</span>
        </div>
      </div>
    `).join('')}
  </div>

  <div class="divider"></div>

  <div class="total-section">
    <div class="total-row">
      <span>TOTAL:</span>
      <span>Rp ${transaction.total.toLocaleString('id-ID')}</span>
    </div>
    <div class="total-final">
      Rp ${transaction.total.toLocaleString('id-ID')}
    </div>
  </div>

  <div class="footer">
    <p>Terima kasih</p>
    <p>Barang yang sudah dibeli</p>
    <p>tidak dapat ditukar/dikembalikan</p>
  </div>
</body>
</html>
<script>
  // Pastikan tidak ada scroll atau margin yang tidak perlu
  (function() {
    function adjustHeight() {
      document.body.style.height = 'auto';
      document.documentElement.style.height = 'auto';
      document.body.style.overflow = 'visible';
      document.documentElement.style.overflow = 'visible';
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', adjustHeight);
    } else {
      adjustHeight();
    }
  })();
</script>
  `.trim();
}

// Save invoice HTML dan return path
export function saveInvoice(transaction: Transaction): string {
  ensureInvoiceDir();
  
  const invoiceHTML = generateInvoiceHTML(transaction);
  const filename = `invoice-${transaction.id}.html`;
  const filePath = join(INVOICE_DIR, filename);
  
  writeFileSync(filePath, invoiceHTML, 'utf-8');
  
  // Return path relatif untuk public URL
  return `/invoices/${filename}`;
}

