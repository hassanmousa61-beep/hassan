import React, { useState, useMemo } from 'react';
import { Product, Customer, SaleInvoice, SaleItem } from '../types';
import { 
  Plus, 
  Trash2, 
  Search, 
  Printer, 
  FileSpreadsheet, 
  X, 
  ChevronLeft, 
  Calendar, 
  User, 
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileText,
  UserCheck
} from 'lucide-react';
import { exportSalesToExcel } from '../excelUtils';

interface SalesManagerProps {
  sales: SaleInvoice[];
  products: Product[];
  customers: Customer[];
  onAddSale: (sale: SaleInvoice) => void;
  onUpdateProductStock: (productId: string, quantityDeduction: number) => void;
  onUpdateCustomerBalance: (customerId: string, balanceChange: number, purchaseChange: number) => void;
}

export default function SalesManager({
  sales,
  products,
  customers,
  onAddSale,
  onUpdateProductStock,
  onUpdateCustomerBalance
}: SalesManagerProps) {
  // Navigation: Sub-tab between 'list' and 'create'
  const [salesSubTab, setSalesSubTab] = useState<'list' | 'create'>('list');
  
  // Search and Filter lists
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('الكل');

  // Selected invoice for detail view & print preview
  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(null);

  // --- NEW INVOICE FORM STATES ---
  const [invoiceCustomerId, setInvoiceCustomerId] = useState<string>('cash'); // default is cash customer
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [invoiceItems, setInvoiceItems] = useState<SaleItem[]>([]);
  const [invoiceTaxRate, setInvoiceTaxRate] = useState<number>(15); // Default VAT 15%
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);
  const [invoicePaidAmount, setInvoicePaidAmount] = useState<number>(0);
  const [invoiceNotes, setInvoiceNotes] = useState<string>('');

  // Search product inside invoice form
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  // Filter sales list
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchesSearch = s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            s.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'الكل' || s.paymentStatus === filterStatus;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber));
  }, [sales, searchQuery, filterStatus]);

  // Categories list for invoice creation product picker
  const categoriesList = useMemo(() => {
    const list = new Set(products.map(p => p.category));
    return ['الكل', ...Array.from(list)];
  }, [products]);

  // Filtered products to add to invoice
  const filteredProductsToSelect = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                            p.code.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCategory = selectedCategory === 'الكل' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, productSearch, selectedCategory]);

  // Add Item to Invoice Cart
  const handleAddItemToInvoice = (product: Product) => {
    // Check if product is already in cart
    const existingIndex = invoiceItems.findIndex(item => item.productId === product.id);
    
    if (existingIndex > -1) {
      const currentQty = invoiceItems[existingIndex].quantity;
      if (currentQty >= product.quantity) {
        alert(`❌ الكمية المتاحة في المخزن لهذا المنتج هي ${product.quantity} فقط!`);
        return;
      }
      const updated = [...invoiceItems];
      const newQty = currentQty + 1;
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        total: parseFloat((newQty * product.salePrice).toFixed(2))
      };
      setInvoiceItems(updated);
    } else {
      if (product.quantity <= 0) {
        alert('❌ هذا المنتج غير متوفر في المخزن حالياً!');
        return;
      }
      const newItem: SaleItem = {
        productId: product.id,
        productName: product.name,
        price: product.salePrice,
        quantity: 1,
        total: product.salePrice
      };
      setInvoiceItems([...invoiceItems, newItem]);
    }
  };

  // Remove item from Invoice Cart
  const handleRemoveItemFromInvoice = (productId: string) => {
    setInvoiceItems(invoiceItems.filter(item => item.productId !== productId));
  };

  // Update quantity inside cart
  const handleUpdateCartQuantity = (productId: string, qty: number) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    if (qty > prod.quantity) {
      alert(`❌ خطأ: الكمية المطلوبة غير متوفرة. الأقصى المتاح في المخزن هو ${prod.quantity} قطعة.`);
      return;
    }

    if (qty <= 0) {
      handleRemoveItemFromInvoice(productId);
      return;
    }

    setInvoiceItems(invoiceItems.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          quantity: qty,
          total: parseFloat((qty * item.price).toFixed(2))
        };
      }
      return item;
    }));
  };

  // Cart Calculations
  const invoiceSubtotal = useMemo(() => {
    return invoiceItems.reduce((acc, item) => acc + item.total, 0);
  }, [invoiceItems]);

  const invoiceTaxAmount = useMemo(() => {
    const taxDecimal = invoiceTaxRate / 100;
    return parseFloat((invoiceSubtotal * taxDecimal).toFixed(2));
  }, [invoiceSubtotal, invoiceTaxRate]);

  const invoiceTotal = useMemo(() => {
    const totalAmount = invoiceSubtotal + invoiceTaxAmount - invoiceDiscount;
    return Math.max(0, parseFloat(totalAmount.toFixed(2)));
  }, [invoiceSubtotal, invoiceTaxAmount, invoiceDiscount]);

  // Set paid amount in full helper
  const handleSetPaidInFull = () => {
    setInvoicePaidAmount(invoiceTotal);
  };

  // Submit Invoice Creation
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (invoiceItems.length === 0) {
      alert('❌ الرجاء إضافة منتج واحد على الأقل للفاتورة.');
      return;
    }

    // Determine customer name
    let customerName = 'عميل نقدي';
    if (invoiceCustomerId !== 'cash') {
      const cust = customers.find(c => c.id === invoiceCustomerId);
      if (cust) customerName = cust.name;
    }

    // Payment status
    let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
    if (invoicePaidAmount >= invoiceTotal) {
      paymentStatus = 'paid';
    } else if (invoicePaidAmount > 0) {
      paymentStatus = 'partial';
    }

    const unpaidDebt = parseFloat((invoiceTotal - invoicePaidAmount).toFixed(2));

    const invoiceNumber = `INV-2026-${String(sales.length + 1).padStart(3, '0')}`;
    const newInvoice: SaleInvoice = {
      id: `inv-s-${Date.now()}`,
      invoiceNumber,
      date: invoiceDate,
      customerId: invoiceCustomerId,
      customerName,
      items: invoiceItems,
      subtotal: invoiceSubtotal,
      taxRate: invoiceTaxRate,
      taxAmount: invoiceTaxAmount,
      discount: invoiceDiscount,
      total: invoiceTotal,
      paidAmount: invoicePaidAmount,
      paymentStatus,
      notes: invoiceNotes
    };

    // Save invoice
    onAddSale(newInvoice);

    // Deduct stock quantities
    invoiceItems.forEach(item => {
      onUpdateProductStock(item.productId, item.quantity);
    });

    // Update customer debt and purchase totals
    if (invoiceCustomerId !== 'cash') {
      onUpdateCustomerBalance(invoiceCustomerId, unpaidDebt, invoiceTotal);
    }

    // Reset Form
    setInvoiceItems([]);
    setInvoiceDiscount(0);
    setInvoicePaidAmount(0);
    setInvoiceNotes('');
    setInvoiceCustomerId('cash');
    
    // Switch to list view and select this invoice
    setSelectedInvoice(newInvoice);
    setSalesSubTab('list');
  };

  // Trigger Print layout beautifully
  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="sales-manager-root">
      
      {/* Top Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-3xs print:hidden">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-sans flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-500" />
            <span>المبيعات وفواتير العملاء</span>
          </h1>
          <p className="text-sm text-gray-500 font-sans mt-0.5">
            إنشاء فواتير بيع جديدة للعملاء، متابعة التحصيلات، وطباعة وصولات الدفع الحرارية أو تصديرها.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            id="tab-btn-sales-list"
            onClick={() => { setSalesSubTab('list'); setSelectedInvoice(null); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all cursor-pointer ${
              salesSubTab === 'list' && !selectedInvoice
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold'
                : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            جميع فواتير المبيعات
          </button>
          
          <button
            id="tab-btn-sales-create"
            onClick={() => { setSalesSubTab('create'); setSelectedInvoice(null); }}
            className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border transition-all cursor-pointer ${
              salesSubTab === 'create'
                ? 'bg-emerald-600 border-emerald-600 text-white font-bold'
                : 'bg-white hover:bg-gray-50 border-gray-200 text-emerald-600 border-emerald-100'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء فاتورة جديدة</span>
          </button>

          <button
            id="export-sales-excel-btn"
            onClick={() => exportSalesToExcel(sales)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تصدير المبيعات</span>
          </button>
        </div>
      </div>

      {/* VIEW INVOICE & PRINT (When an invoice is selected) */}
      {selectedInvoice ? (
        <div className="space-y-6" id="invoice-detail-view-container">
          {/* Controls Bar */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-3xs print:hidden">
            <button
              id="back-to-sales-list-btn"
              onClick={() => setSelectedInvoice(null)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 font-sans font-semibold cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 rotate-180" />
              <span>العودة لقائمة الفواتير</span>
            </button>

            <button
              id="trigger-print-invoice-btn"
              onClick={handlePrintInvoice}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الفاتورة / تصدير PDF</span>
            </button>
          </div>

          {/* Elegant Print Layout Container */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-xs max-w-3xl mx-auto print:border-0 print:shadow-none print:p-0 font-sans" id="invoice-print-area">
            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center pb-6 border-b border-gray-100 gap-4">
              <div className="text-center sm:text-right space-y-1">
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">نظام المبيعات والمخزون المتكامل</h2>
                <p className="text-xs text-gray-400">إلكترونيات - قطع كمبيوتر - أدوات ذكية</p>
                <p className="text-xs text-gray-500">هاتف الدعم: 0501234567 | البريد: store@example.com</p>
              </div>
              <div className="text-center sm:text-left bg-gray-50 p-4 rounded-xl space-y-1 min-w-[180px]">
                <h3 className="text-emerald-700 font-black text-sm">فاتورة مبيعات</h3>
                <span className="text-lg font-black font-mono text-gray-900 block mt-1">{selectedInvoice.invoiceNumber}</span>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{selectedInvoice.date}</span>
                </div>
              </div>
            </div>

            {/* Client and Vendor Info block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 text-sm text-gray-600 border-b border-gray-100">
              <div className="space-y-1.5 text-right">
                <span className="text-xs font-bold text-gray-400 block">تفاصيل العميل:</span>
                <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{selectedInvoice.customerName}</span>
                </div>
                {selectedInvoice.customerId !== 'cash' && (
                  <>
                    <p className="text-xs">رقم الهاتف: {customers.find(c => c.id === selectedInvoice.customerId)?.phone}</p>
                    <p className="text-xs">العنوان: {customers.find(c => c.id === selectedInvoice.customerId)?.address || 'غير محدد'}</p>
                  </>
                )}
                {selectedInvoice.customerId === 'cash' && (
                  <p className="text-xs text-gray-400">مبيعات نقدية مباشرة</p>
                )}
              </div>

              <div className="space-y-1.5 text-center sm:text-left">
                <span className="text-xs font-bold text-gray-400 block">جهة البيع:</span>
                <span className="font-bold text-gray-800">مؤسسة حسن موسى التجارية</span>
                <p className="text-xs">الرياض، المملكة العربية السعودية</p>
                <p className="text-xs font-semibold text-rose-500">الرقم الضريبي: 300012345600003</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-6">
              <table className="w-full text-right border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-gray-500 font-bold pb-2 text-xs">
                    <th className="pb-3 text-right">اسم المنتج / الصنف</th>
                    <th className="pb-3 text-left">سعر الوحدة</th>
                    <th className="pb-3 text-center">الكمية</th>
                    <th className="pb-3 text-left">الإجمالي الفرعي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {selectedInvoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 font-semibold text-gray-900">{item.productName}</td>
                      <td className="py-3 text-left font-mono">{item.price.toLocaleString('ar-SA')} ر.س</td>
                      <td className="py-3 text-center font-mono font-bold">{item.quantity}</td>
                      <td className="py-3 text-left font-mono font-bold text-gray-900">{item.total.toLocaleString('ar-SA')} ر.س</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoices Totals Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-100">
              <div className="text-xs text-gray-500 space-y-1.5">
                <h4 className="font-bold text-gray-700 text-sm">شروط وملاحظات:</h4>
                <p>• البضاعة المباعة لا ترد ولا تستبدل بعد مرور ٣ أيام.</p>
                <p>• يرجى الاحتفاظ بهذه الفاتورة لإثبات الضمان إن وجد.</p>
                {selectedInvoice.notes && (
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-gray-700 mt-2 font-sans">
                    <strong className="block text-gray-900 mb-0.5">ملاحظة الفاتورة:</strong>
                    {selectedInvoice.notes}
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>المجموع الفرعي:</span>
                  <span className="font-mono">{selectedInvoice.subtotal.toLocaleString('ar-SA')} ريال</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>ضريبة القيمة المضافة ({selectedInvoice.taxRate}%):</span>
                  <span className="font-mono">{selectedInvoice.taxAmount.toLocaleString('ar-SA')} ريال</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>خصم خاص:</span>
                    <span className="font-mono">-{selectedInvoice.discount.toLocaleString('ar-SA')} ريال</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-black text-gray-900">
                  <span>الإجمالي النهائي شامل الضريبة:</span>
                  <span className="font-mono text-emerald-600">{selectedInvoice.total.toLocaleString('ar-SA')} ريال</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs">
                  <div>
                    <span className="text-gray-400 block">المبلغ المدفوع:</span>
                    <span className="font-bold text-gray-700 font-mono">{selectedInvoice.paidAmount.toLocaleString('ar-SA')} ر.س</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">المديونية المتبقية:</span>
                    <span className={`font-bold font-mono ${selectedInvoice.total - selectedInvoice.paidAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {(selectedInvoice.total - selectedInvoice.paidAmount).toLocaleString('ar-SA')} ر.س
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Copyright stamp in footer */}
            <div className="mt-12 pt-6 border-t border-gray-100 text-center text-xs text-gray-400 space-y-1">
              <p className="font-bold text-gray-600 font-sans">جميع الحقوق محفوظة © حسن موسى ٢٠٢٦</p>
              <p className="text-[10px]">نظام المبيعات والمستودعات المتكامل للمحلات التجارية والشركات</p>
            </div>
          </div>
        </div>
      ) : salesSubTab === 'create' ? (
        
        /* INVOICE CREATION TAB (Side-by-side Creator) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="invoice-creator-container">
          
          {/* Cart & Calculation Section (LEFT in RTL / RIGHT in layout) - 7 cols */}
          <form onSubmit={handleCreateInvoice} className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100 shadow-3xs space-y-4 flex flex-col justify-between h-fit" id="invoice-cart-panel">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 text-base font-sans flex items-center gap-1.5">
                  <Receipt className="w-5 h-5 text-emerald-500" />
                  <span>تفاصيل الفاتورة النشطة</span>
                </h3>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  رقم المقترح: INV-{sales.length + 1}
                </span>
              </div>

              {/* Customer Selector & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 font-sans block">اختر العميل *</label>
                  <select
                    id="invoice-customer-select"
                    value={invoiceCustomerId}
                    onChange={(e) => setInvoiceCustomerId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs px-3 py-2 focus:outline-hidden text-gray-700 font-sans"
                  >
                    <option value="cash">💵 عميل نقدي (مباشر)</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>👤 {c.name} (دين: {c.balance} ر.س)</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 font-sans block">تاريخ الفاتورة</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full border border-gray-200 px-3 py-1.5 rounded-lg text-xs focus:outline-hidden text-gray-700 font-mono"
                  />
                </div>
              </div>

              {/* Current Cart Items List */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-gray-500 font-sans">قائمة المواد المختارة:</h4>
                
                {invoiceItems.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl text-gray-400 text-xs font-sans">
                    لم تختر أي منتجات بعد. ابحث في قائمة المنتجات المجاورة واضغط لإضافتها.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto pr-1">
                    {invoiceItems.map(item => {
                      const prod = products.find(p => p.id === item.productId);
                      const maxStock = prod ? prod.quantity : 999;
                      return (
                        <div key={item.productId} className="flex items-center justify-between py-2.5">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-gray-800 font-sans block">{item.productName}</span>
                            <span className="text-[10px] text-gray-400 font-sans">سعر الوحدة: {item.price} ر.س | متوفر بالمخزن: {maxStock}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Quantity Inputs */}
                            <div className="flex items-center border border-gray-200 rounded-md bg-gray-50">
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQuantity(item.productId, item.quantity - 1)}
                                className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 font-bold font-sans rounded-r-md cursor-pointer"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleUpdateCartQuantity(item.productId, parseInt(e.target.value, 10) || 0)}
                                className="w-10 text-center text-xs font-mono font-bold bg-transparent border-0 focus:outline-hidden focus:ring-0 p-1"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQuantity(item.productId, item.quantity + 1)}
                                className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 font-bold font-sans rounded-l-md cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            {/* Line Subtotal */}
                            <span className="text-xs font-mono font-bold text-gray-800 w-16 text-left">{item.total.toLocaleString('ar-SA')} ر.س</span>

                            <button
                              type="button"
                              onClick={() => handleRemoveItemFromInvoice(item.productId)}
                              className="text-gray-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Taxation & Discount settings */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 font-sans block">نسبة الضريبة %</label>
                  <input
                    type="number"
                    value={invoiceTaxRate}
                    onChange={(e) => setInvoiceTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs focus:outline-hidden font-mono text-left"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 font-sans block">الخصم المباشر (ريال)</label>
                  <input
                    type="number"
                    value={invoiceDiscount}
                    onChange={(e) => setInvoiceDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs focus:outline-hidden font-mono text-left"
                  />
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-bold text-gray-600 font-sans block">المبلغ المدفوع نقداً</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={invoicePaidAmount}
                      onChange={(e) => setInvoicePaidAmount(parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-200 pl-12 pr-2.5 py-1.5 rounded-lg text-xs focus:outline-hidden font-mono text-left"
                    />
                    <button
                      type="button"
                      onClick={handleSetPaidInFull}
                      className="absolute left-1 top-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-1 rounded-sm font-bold cursor-pointer"
                    >
                      كامل
                    </button>
                  </div>
                </div>
              </div>

              {/* Description / Notes text */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 font-sans block">ملاحظات على الفاتورة</label>
                <input
                  type="text"
                  placeholder="ملاحظات التسليم أو شروط خاصة..."
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  className="w-full border border-gray-200 px-3 py-1.5 rounded-lg text-xs focus:outline-hidden font-sans"
                />
              </div>
            </div>

            {/* Calculations and Actions Footer block */}
            <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-3 mt-4 text-xs font-sans">
              <div className="flex justify-between text-gray-600">
                <span>المجموع الفرعي:</span>
                <span className="font-mono font-bold">{invoiceSubtotal.toLocaleString('ar-SA')} ر.س</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>الضريبة المضافة:</span>
                <span className="font-mono font-bold">{invoiceTaxAmount.toLocaleString('ar-SA')} ر.س</span>
              </div>
              {invoiceDiscount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>إجمالي الخصم:</span>
                  <span className="font-mono font-bold">-{invoiceDiscount.toLocaleString('ar-SA')} ر.س</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-gray-900 border-t border-gray-200 pt-2">
                <span>الإجمالي النهائي المستحق:</span>
                <span className="font-mono text-base text-emerald-600">{invoiceTotal.toLocaleString('ar-SA')} ر.س</span>
              </div>

              {/* Debt Warning for non-paid customer */}
              {invoiceCustomerId !== 'cash' && invoiceTotal - invoicePaidAmount > 0 && (
                <div className="p-2.5 bg-amber-50 rounded-lg text-amber-800 text-[11px] border border-amber-100/50 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>
                    سيتم ترحيل مبلغ <strong>{(invoiceTotal - invoicePaidAmount).toLocaleString('ar-SA')} ر.س</strong> كديون مستحقة على حساب العميل.
                  </span>
                </div>
              )}

              {/* Action Submit */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setInvoiceItems([]); setSalesSubTab('list'); }}
                  className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-bold transition-all text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-bold transition-all text-xs shadow-xs cursor-pointer"
                >
                  حفظ واعتماد الفاتورة
                </button>
              </div>
            </div>
          </form>

          {/* Product Pick list (RIGHT in RTL / LEFT in layout) - 5 cols */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs space-y-4 h-fit max-h-[640px] flex flex-col justify-between" id="invoice-product-picker-panel">
            <div className="space-y-4 overflow-hidden flex flex-col h-full">
              <h3 className="font-bold text-gray-800 text-sm font-sans">اختر الأصناف للإضافة</h3>
              
              {/* Product search & Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="ابحث بالاسم أو الباركود..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-2 pr-8 py-1.5 rounded-lg border border-gray-200 focus:outline-hidden text-xs font-sans"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 font-sans shrink-0">القسم:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-md text-[11px] px-2 py-1 focus:outline-hidden text-gray-700 w-full"
                  >
                    {categoriesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Catalog items list */}
              <div className="divide-y divide-gray-50 overflow-y-auto max-h-96 pr-1 space-y-1">
                {filteredProductsToSelect.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-xs font-sans">
                    لا تتوفر منتجات تطابق البحث.
                  </div>
                ) : (
                  filteredProductsToSelect.map(p => {
                    const isLow = p.quantity <= p.minQuantityAlert;
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => handleAddItemToInvoice(p)}
                        className="w-full text-right py-2 px-1.5 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between gap-2 border-0 bg-transparent text-gray-800 cursor-pointer"
                      >
                        <div className="space-y-0.5 text-right">
                          <span className="text-xs font-bold font-sans block">{p.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono block">الرمز: {p.code} | {p.category}</span>
                        </div>

                        <div className="text-left shrink-0">
                          <span className="text-xs font-mono font-bold text-gray-900 block">{p.salePrice.toLocaleString('ar-SA')} ر.س</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full inline-block mt-0.5 font-bold ${
                            isLow ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            بالمخزن: {p.quantity}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        
        /* GENERAL SALES INVOICES LIST VIEW */
        <div className="space-y-4" id="sales-list-view">
          {/* Search, Filter bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-3xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
              <input
                type="text"
                placeholder="ابحث برقم الفاتورة أو العميل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 text-sm font-sans"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 font-sans shrink-0 font-bold">الحالة المالية:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg text-xs px-2.5 py-1.5 focus:outline-hidden text-gray-700 font-sans"
              >
                <option value="الكل">جميع الحالات</option>
                <option value="paid">مدفوعة بالكامل 🟢</option>
                <option value="partial">مدفوعة جزئياً 🟡</option>
                <option value="unpaid">غير مدفوعة 🔴</option>
              </select>
            </div>
          </div>

          {/* Sales Invoices Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-3xs overflow-hidden" id="sales-table-card">
            {filteredSales.length === 0 ? (
              <div className="text-center py-12 text-gray-400 font-sans">
                لا توجد فواتير مبيعات متوفرة أو تطابق خيارات الفلترة المذكورة.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-semibold">
                      <th className="py-4 px-6 font-sans">رقم الفاتورة</th>
                      <th className="py-4 px-6 font-sans">التاريخ</th>
                      <th className="py-4 px-6 font-sans">اسم العميل</th>
                      <th className="py-4 px-6 font-sans text-center">عدد المواد</th>
                      <th className="py-4 px-6 font-sans text-left">قيمة الفاتورة</th>
                      <th className="py-4 px-6 font-sans text-center">الحالة</th>
                      <th className="py-4 px-6 font-sans text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredSales.map(s => {
                      const owes = s.total - s.paidAmount;
                      return (
                        <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3.5 px-6 font-mono font-bold text-gray-800 text-xs">{s.invoiceNumber}</td>
                          <td className="py-3.5 px-6 font-mono text-xs text-gray-500">{s.date}</td>
                          <td className="py-3.5 px-6 font-semibold text-gray-800 font-sans">{s.customerName}</td>
                          <td className="py-3.5 px-6 text-center font-mono font-bold text-gray-600">{s.items.length} أصناف</td>
                          <td className="py-3.5 px-6 text-left font-mono font-bold text-gray-900">
                            <div>
                              <span>{s.total.toLocaleString('ar-SA')} ر.س</span>
                              {owes > 0 && (
                                <span className="block text-[10px] text-amber-600 font-normal mt-0.5">متبقي: {owes.toLocaleString('ar-SA')} ر.س</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            <span className={`text-[11px] px-2 py-1 rounded-full font-bold font-sans inline-block ${
                              s.paymentStatus === 'paid' 
                                ? 'bg-emerald-50 text-emerald-700' 
                                : s.paymentStatus === 'partial' 
                                ? 'bg-amber-50 text-amber-700' 
                                : 'bg-rose-50 text-rose-700'
                            }`}>
                              {s.paymentStatus === 'paid' ? 'مدفوعة' : s.paymentStatus === 'partial' ? 'جزئي' : 'غير مدفوعة'}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            <button
                              id={`view-invoice-btn-${s.id}`}
                              onClick={() => setSelectedInvoice(s)}
                              className="inline-flex items-center gap-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-100 px-3 py-1.5 rounded-md font-semibold font-sans transition-colors cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>عرض وطباعة</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
