export interface Product {
  id: string;
  name: string;
  code: string; // SKU or Barcode
  category: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  minQuantityAlert: number;
  description?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalPurchases: number;
  balance: number; // Positive is debt (مديونية)
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalPurchases: number;
  balance: number; // Positive is our debt to them (مستحقات للمورد)
}

export interface SaleItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  total: number;
}

export interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  taxRate: number; // Percentage, e.g. 15 for 15%
  taxAmount: number;
  discount: number; // Flat discount
  total: number;
  paidAmount: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  notes?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  costPrice: number;
  quantity: number;
  total: number;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  taxRate: number; // Percentage
  taxAmount: number;
  discount: number; // Flat discount
  total: number;
  paidAmount: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  notes?: string;
}
