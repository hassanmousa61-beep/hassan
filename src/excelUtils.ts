import * as XLSX from 'xlsx';
import { Product, Customer, Supplier, SaleInvoice, PurchaseInvoice } from './types';

// Map product properties to Arabic headers for Export
export function exportProductsToExcel(products: Product[]) {
  const data = products.map(p => ({
    'الباركود / الكود': p.code,
    'اسم المنتج': p.name,
    'القسم / التصنيف': p.category,
    'سعر الشراء (ريال)': p.purchasePrice,
    'سعر البيع (ريال)': p.salePrice,
    'الكمية الحالية': p.quantity,
    'حد التنبيه (الحد الأدنى)': p.minQuantityAlert,
    'الوصف': p.description || ''
  }));
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'المنتجات');
  XLSX.writeFile(wb, 'قائمة_المنتجات.xlsx');
}

// Map Customer properties to Arabic headers for Export
export function exportCustomersToExcel(customers: Customer[]) {
  const data = customers.map(c => ({
    'اسم العميل': c.name,
    'الهاتف': c.phone,
    'البريد الإلكتروني': c.email || '',
    'العنوان': c.address || '',
    'إجمالي المشتريات (ريال)': c.totalPurchases,
    'المديونية الحالية (ريال)': c.balance
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'العملاء');
  XLSX.writeFile(wb, 'قائمة_العملاء.xlsx');
}

// Map Supplier properties to Arabic headers for Export
export function exportSuppliersToExcel(suppliers: Supplier[]) {
  const data = suppliers.map(s => ({
    'اسم المورد': s.name,
    'الهاتف': s.phone,
    'البريد الإلكتروني': s.email || '',
    'العنوان': s.address || '',
    'إجمالي التعاملات (ريال)': s.totalPurchases,
    'المستحقات له (ريال)': s.balance
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'الموردين');
  XLSX.writeFile(wb, 'قائمة_الموردين.xlsx');
}

// Map Sales to Arabic headers for Export
export function exportSalesToExcel(sales: SaleInvoice[]) {
  const data = sales.map(s => ({
    'رقم الفاتورة': s.invoiceNumber,
    'التاريخ': s.date,
    'اسم العميل': s.customerName,
    'عدد المواد': s.items.length,
    'المجموع الفرعي': s.subtotal,
    'نسبة الضريبة %': s.taxRate,
    'قيمة الضريبة': s.taxAmount,
    'الخصم': s.discount,
    'الإجمالي الكلي': s.total,
    'المبلغ المدفوع': s.paidAmount,
    'المتبقي (المديونية)': s.total - s.paidAmount,
    'حالة الدفع': s.paymentStatus === 'paid' ? 'مدفوعة بالكامل' : s.paymentStatus === 'partial' ? 'مدفوعة جزئياً' : 'غير مدفوعة',
    'ملاحظات': s.notes || ''
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'فواتير المبيعات');
  XLSX.writeFile(wb, 'فواتير_المبيعات.xlsx');
}

// Map Purchases to Arabic headers for Export
export function exportPurchasesToExcel(purchases: PurchaseInvoice[]) {
  const data = purchases.map(p => ({
    'رقم الفاتورة': p.invoiceNumber,
    'التاريخ': p.date,
    'اسم المورد': p.supplierName,
    'عدد المواد': p.items.length,
    'المجموع الفرعي': p.subtotal,
    'نسبة الضريبة %': p.taxRate,
    'قيمة الضريبة': p.taxAmount,
    'الخصم': p.discount,
    'الإجمالي الكلي': p.total,
    'المبلغ المدفوع': p.paidAmount,
    'المتبقي علينا': p.total - p.paidAmount,
    'حالة الدفع': p.paymentStatus === 'paid' ? 'مدفوعة بالكامل' : p.paymentStatus === 'partial' ? 'مدفوعة جزئياً' : 'غير مدفوعة',
    'ملاحظات': p.notes || ''
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'فواتير المشتريات');
  XLSX.writeFile(wb, 'فواتير_المشتريات.xlsx');
}

// Generate an Excel template for download
export function downloadProductsTemplate() {
  const templateData = [
    {
      'الباركود / الكود': 'PRD-1008',
      'اسم المنتج': 'مثال منتج جديد',
      'القسم / التصنيف': 'إلكترونيات',
      'سعر الشراء (ريال)': 500,
      'سعر البيع (ريال)': 750,
      'الكمية الحالية': 20,
      'حد التنبيه (الحد الأدنى)': 5,
      'الوصف': 'اكتب وصف اختياري هنا'
    }
  ];
  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'نموذج المنتجات');
  XLSX.writeFile(wb, 'نموذج_استيراد_المنتجات.xlsx');
}

export function downloadCustomersTemplate() {
  const templateData = [
    {
      'اسم العميل': 'محمد عبد الله العلي',
      'الهاتف': '0501112222',
      'البريد الإلكتروني': 'mohammad@example.com',
      'العنوان': 'الدمام - حي النزهة',
      'إجمالي المشتريات (ريال)': 0,
      'المديونية الحالية (ريال)': 0
    }
  ];
  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'نموذج العملاء');
  XLSX.writeFile(wb, 'نموذج_استيراد_العملاء.xlsx');
}

// Parse imported Excel for Products
export function importProductsFromExcel(file: File): Promise<Partial<Product>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        const mappedProducts: Partial<Product>[] = rawJson.map((row, idx) => {
          // Normalize header keys by checking different spelling
          const code = row['الباركود / الكود'] || row['الكود'] || row['الباركود'] || row['code'] || `PRD-AUTO-${idx + Math.floor(Math.random() * 1000)}`;
          const name = row['اسم المنتج'] || row['الاسم'] || row['name'] || '';
          const category = row['القسم / التصنيف'] || row['القسم'] || row['التصنيف'] || row['category'] || 'عام';
          const purchasePrice = parseFloat(row['سعر الشراء (ريال)'] || row['سعر الشراء'] || row['purchasePrice'] || '0') || 0;
          const salePrice = parseFloat(row['سعر البيع (ريال)'] || row['سعر البيع'] || row['salePrice'] || '0') || 0;
          const quantity = parseInt(row['الكمية الحالية'] || row['الكمية'] || row['quantity'] || '0', 10) || 0;
          const minQuantityAlert = parseInt(row['حد التنبيه (الحد الأدنى)'] || row['حد التنبيه'] || row['minQuantityAlert'] || '5', 10) || 5;
          const description = row['الوصف'] || row['description'] || '';

          return {
            code: String(code),
            name: String(name),
            category: String(category),
            purchasePrice,
            salePrice,
            quantity,
            minQuantityAlert,
            description: String(description)
          };
        }).filter(p => p.name !== ''); // must have a name
        
        resolve(mappedProducts);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

// Parse imported Excel for Customers
export function importCustomersFromExcel(file: File): Promise<Partial<Customer>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        const mappedCustomers: Partial<Customer>[] = rawJson.map(row => {
          const name = row['اسم العميل'] || row['الاسم'] || row['name'] || '';
          const phone = row['الهاتف'] || row['رقم الهاتف'] || row['phone'] || '';
          const email = row['البريد الإلكتروني'] || row['البريد'] || row['email'] || '';
          const address = row['العنوان'] || row['address'] || '';
          const totalPurchases = parseFloat(row['إجمالي المشتريات (ريال)'] || row['إجمالي المشتريات'] || row['totalPurchases'] || '0') || 0;
          const balance = parseFloat(row['المديونية الحالية (ريال)'] || row['المديونية'] || row['balance'] || '0') || 0;

          return {
            name: String(name),
            phone: String(phone),
            email: String(email),
            address: String(address),
            totalPurchases,
            balance
          };
        }).filter(c => c.name !== '');
        
        resolve(mappedCustomers);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}
