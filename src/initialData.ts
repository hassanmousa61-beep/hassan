import { Product, Customer, Supplier, SaleInvoice, PurchaseInvoice } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'شاشة سامسونج 27 بوصة منحنية',
    code: 'PRD-1001',
    category: 'إلكترونيات',
    purchasePrice: 1200,
    salePrice: 1500,
    quantity: 15,
    minQuantityAlert: 5,
    description: 'شاشة ألعاب ممتازة بتردد 144 هرتز'
  },
  {
    id: 'p2',
    name: 'لوحة مفاتيح ميكانيكية RGB',
    code: 'PRD-1002',
    category: 'إكسسوارات كمبيوتر',
    purchasePrice: 150,
    salePrice: 250,
    quantity: 30,
    minQuantityAlert: 8,
    description: 'لوحة مفاتيح سلكية بإضاءة خلفية ممتازة'
  },
  {
    id: 'p3',
    name: 'ماوس لاسلكي مريح الأداء',
    code: 'PRD-1003',
    category: 'إكسسوارات كمبيوتر',
    purchasePrice: 80,
    salePrice: 140,
    quantity: 45,
    minQuantityAlert: 10,
    description: 'ماوس لاسلكي مريح لليد للمصممين والمبرمجين'
  },
  {
    id: 'p4',
    name: 'سماعة رأس محيطية للألعاب',
    code: 'PRD-1004',
    category: 'صوتيات',
    purchasePrice: 200,
    salePrice: 320,
    quantity: 4, // Low quantity to trigger alerts
    minQuantityAlert: 5,
    description: 'سماعة صوت مجسم 7.1 لعزل الضوضاء'
  },
  {
    id: 'p5',
    name: 'طابعة ليزر متعددة الوظائف HP',
    code: 'PRD-1005',
    category: 'أجهزة مكتبية',
    purchasePrice: 850,
    salePrice: 1100,
    quantity: 8,
    minQuantityAlert: 3,
    description: 'طابعة وسكانر وماكينة تصوير في جهاز واحد'
  },
  {
    id: 'p6',
    name: 'قرص صلب خارجي 2 تيرابايت SSD',
    code: 'PRD-1006',
    category: 'وسائط تخزين',
    purchasePrice: 350,
    salePrice: 480,
    quantity: 2, // Low stock
    minQuantityAlert: 6,
    description: 'قرص صلب خارجي سريع مقاوم للصدمات'
  },
  {
    id: 'p7',
    name: 'ذاكرة عشوائية كينجستون 16 جيجابايت',
    code: 'PRD-1007',
    category: 'مكونات كمبيوتر',
    purchasePrice: 220,
    salePrice: 310,
    quantity: 25,
    minQuantityAlert: 5,
    description: 'RAM DDR4 بتردد 3200 ميجاهرتز'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'أحمد محمود العتيبي',
    phone: '0501234567',
    email: 'ahmed@example.com',
    address: 'الرياض - حي الياسمين',
    totalPurchases: 4500,
    balance: 1500 // Owed debt
  },
  {
    id: 'c2',
    name: 'مؤسسة الحلول الرقمية',
    phone: '0559876543',
    email: 'info@digitalsolutions.com',
    address: 'جدة - شارع التحلية',
    totalPurchases: 12400,
    balance: 3200 // Owed debt
  },
  {
    id: 'c3',
    name: 'سارة خالد الحربي',
    phone: '0562233445',
    email: 'sara@example.com',
    address: 'الدمام - حي الشاطئ',
    totalPurchases: 850,
    balance: 0
  },
  {
    id: 'c4',
    name: 'عمر عبد العزيز الشريف',
    phone: '0547788990',
    email: 'omer@example.com',
    address: 'مكة المكرمة - العوالي',
    totalPurchases: 3250,
    balance: 500
  },
  {
    id: 'c5',
    name: 'شركة الابتكار المتقدم',
    phone: '0531112223',
    email: 'contact@innovation.sa',
    address: 'المدينة المنورة - العزيزية',
    totalPurchases: 25600,
    balance: 0
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 's1',
    name: 'مجموعة النخبة للمستوردات Tech-Trade',
    phone: '0502223334',
    email: 'sales@techtrade.com',
    address: 'الرياض - الملز',
    totalPurchases: 18500,
    balance: 2400 // We owe them
  },
  {
    id: 's2',
    name: 'شركة المستقبل للأجهزة الرقمية',
    phone: '0554445556',
    email: 'info@future-digital.com',
    address: 'جدة - البلد',
    totalPurchases: 34000,
    balance: 0
  }
];

// Helper to get dates for mock invoices
const getDateOffset = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

export const INITIAL_SALES: SaleInvoice[] = [
  {
    id: 'inv-s1',
    invoiceNumber: 'INV-2026-001',
    date: getDateOffset(15), // 15 days ago
    customerId: 'c1',
    customerName: 'أحمد محمود العتيبي',
    items: [
      { productId: 'p1', productName: 'شاشة سامسونج 27 بوصة منحنية', price: 1500, quantity: 2, total: 3000 },
      { productId: 'p2', productName: 'لوحة مفاتيح ميكانيكية RGB', price: 250, quantity: 1, total: 250 }
    ],
    subtotal: 3250,
    taxRate: 15,
    taxAmount: 487.5,
    discount: 100,
    total: 3637.5,
    paidAmount: 2137.5,
    paymentStatus: 'partial', // owes 1500
    notes: 'تسليم لفرع العميل بالرياض'
  },
  {
    id: 'inv-s2',
    invoiceNumber: 'INV-2026-002',
    date: getDateOffset(8), // 8 days ago
    customerId: 'c2',
    customerName: 'مؤسسة الحلول الرقمية',
    items: [
      { productId: 'p5', productName: 'طابعة ليزر متعددة الوظائف HP', price: 1100, quantity: 1, total: 1100 },
      { productId: 'p3', productName: 'ماوس لاسلكي مريح الأداء', price: 140, quantity: 5, total: 700 },
      { productId: 'p7', productName: 'ذاكرة عشوائية كينجستون 16 جيجابايت', price: 310, quantity: 4, total: 1240 }
    ],
    subtotal: 3040,
    taxRate: 15,
    taxAmount: 456,
    discount: 0,
    total: 3496,
    paidAmount: 296, // pays 296, owes 3200
    paymentStatus: 'partial',
    notes: 'يرجى مراجعة الدفعات نهاية الشهر'
  },
  {
    id: 'inv-s3',
    invoiceNumber: 'INV-2026-003',
    date: getDateOffset(3), // 3 days ago
    customerId: 'c3',
    customerName: 'سارة خالد الحربي',
    items: [
      { productId: 'p3', productName: 'ماوس لاسلكي مريح الأداء', price: 140, quantity: 2, total: 280 },
      { productId: 'p2', productName: 'لوحة مفاتيح ميكانيكية RGB', price: 250, quantity: 1, total: 250 }
    ],
    subtotal: 530,
    taxRate: 15,
    taxAmount: 79.5,
    discount: 50,
    total: 559.5,
    paidAmount: 559.5,
    paymentStatus: 'paid'
  },
  {
    id: 'inv-s4',
    invoiceNumber: 'INV-2026-004',
    date: getDateOffset(1), // yesterday
    customerId: 'c4',
    customerName: 'عمر عبد العزيز الشريف',
    items: [
      { productId: 'p6', productName: 'قرص صلب خارجي 2 تيرابايت SSD', price: 480, quantity: 3, total: 1440 },
      { productId: 'p7', productName: 'ذاكرة عشوائية كينجستون 16 جيجابايت', price: 310, quantity: 2, total: 620 }
    ],
    subtotal: 2060,
    taxRate: 15,
    taxAmount: 309,
    discount: 150,
    total: 2219,
    paidAmount: 1719, // owes 500
    paymentStatus: 'partial'
  },
  {
    id: 'inv-s5',
    invoiceNumber: 'INV-2026-005',
    date: getDateOffset(0), // today
    customerId: 'c5',
    customerName: 'شركة الابتكار المتقدم',
    items: [
      { productId: 'p1', productName: 'شاشة سامسونج 27 بوصة منحنية', price: 1500, quantity: 5, total: 7500 },
      { productId: 'p5', productName: 'طابعة ليزر متعددة الوظائف HP', price: 1100, quantity: 2, total: 2200 },
      { productId: 'p3', productName: 'ماوس لاسلكي مريح الأداء', price: 140, quantity: 10, total: 1400 }
    ],
    subtotal: 11100,
    taxRate: 15,
    taxAmount: 1665,
    discount: 500,
    total: 12265,
    paidAmount: 12265,
    paymentStatus: 'paid',
    notes: 'الدفع نقدا - تم التسليم في المستودع'
  }
];

export const INITIAL_PURCHASES: PurchaseInvoice[] = [
  {
    id: 'inv-p1',
    invoiceNumber: 'PUR-2026-001',
    date: getDateOffset(20),
    supplierId: 's1',
    supplierName: 'مجموعة النخبة للمستوردات Tech-Trade',
    items: [
      { productId: 'p1', productName: 'شاشة سامسونج 27 بوصة منحنية', costPrice: 1200, quantity: 10, total: 12000 },
      { productId: 'p2', productName: 'لوحة مفاتيح ميكانيكية RGB', costPrice: 150, quantity: 20, total: 3000 }
    ],
    subtotal: 15000,
    taxRate: 15,
    taxAmount: 2250,
    discount: 500,
    total: 16750,
    paidAmount: 14350, // we owe 2400
    paymentStatus: 'partial'
  },
  {
    id: 'inv-p2',
    invoiceNumber: 'PUR-2026-002',
    date: getDateOffset(10),
    supplierId: 's2',
    supplierName: 'شركة المستقبل للأجهزة الرقمية',
    items: [
      { productId: 'p3', productName: 'ماوس لاسلكي مريح الأداء', costPrice: 80, quantity: 50, total: 4000 },
      { productId: 'p4', productName: 'سماعة رأس محيطية للألعاب', costPrice: 200, quantity: 15, total: 3000 },
      { productId: 'p6', productName: 'قرص صلب خارجي 2 تيرابايت SSD', costPrice: 350, quantity: 10, total: 3500 }
    ],
    subtotal: 10500,
    taxRate: 15,
    taxAmount: 1575,
    discount: 200,
    total: 11875,
    paidAmount: 11875,
    paymentStatus: 'paid'
  }
];
