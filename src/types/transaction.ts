export interface CheckoutItem {
  stockId: string;
  quantity: number;
}

export interface Transaction {
  id: string;
  items: Array<{
    stockId: string;
    namaBarang: string;
    quantity: number;
    hargaJual: number;
    subtotal: number;
  }>;
  total: number;
  metodePembayaran: 'cash' | 'transfer' | 'qris' | 'debit' | 'kredit';
  kasir?: string;
  invoicePath?: string;
  paymentProof?: string;
  cancelledAt?: string;
  createdAt: string;
}
