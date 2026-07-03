import React, { useState, useMemo } from 'react';
import { Product, Supplier, PurchaseInvoice, PurchaseItem } from '../types';
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
  UserPlus
} from 'lucide-react';
import { exportPurchasesToExcel } from '../excelUtils';

interface PurchasesManagerProps {
  purchases: PurchaseInvoice[];
  products: Product[];
  suppliers: Supplier[];
  onAddPurchase: (purchase: PurchaseInvoice) => void;
  onUpdateProductStock: (productId: string, quantityAddition: number, newPurchasePrice?: number) => void;
  onUpdateSupplierBalance: (supplierId: string, balanceChange: number, purchaseChange: number) => void;
}

export default function PurchasesManager({
  purchases,
  products,
  suppliers,
  onAddPurchase,
  onUpdateProductStock,
  onUpdateSupplierBalance
}: PurchasesManagerProps) {
  // Navigation: list or create
  const [purchasesSubTab, setPurchasesSubTab] = useState<'list' | 'create'>('list');

  // Search and Filter lists
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('الكل');

  // Selected invoice for detail view
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);

  // --- NEW PURCHASE INVOICE STATES ---
  const [purchaseSupplierId, setPurchaseSupplierId] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [purchaseTaxRate, setPurchaseTaxRate] = useState<number>(15); // Default 15% VAT
  const [purchaseDiscount, setPurchaseDiscount] = useState<number>(0);
  const [purchasePaidAmount, setPurchasePaidAmount] = useState<number>(0);
  const [purchaseNotes, setPurchaseNotes] = useState<string>('');

  // Search product inside creation form
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  // Initialize supplier selection when opening create form
  React.useEffect(() => {
    if (suppliers.length > 0 && !purchaseSupplierId) {
      setPurchaseSupplierId(suppliers[0].id);
    }
  }, [suppliers, purchaseSupplierId]);

  // Filter purchases list
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const matchesSearch = p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'الكل' || p.paymentStatus === filterStatus;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber));
  }, [purchases, searchQuery, filterStatus]);

  // Categories list for product picker
  const categoriesList = useMemo(() => {
    const list = new Set(products.map(p => p.category));
    return ['الكل', ...Array.from(list)];
  }, [products]);

  // Filter products to purchase
  const filteredProductsToSelect = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                            p.code.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCategory = selectedCategory === 'الكل' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, productSearch, selectedCategory]);

  // Add Item to Purchase Cart
  const handleAddItemToPurchase = (product: Product) => {
    const existingIndex = purchaseItems.findIndex(item => item.productId === product.id);

    if (existingIndex > -1) {
      const updated = [...purchaseItems];
      const newQty = updated[existingIndex].quantity + 1;
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        total: parseFloat((newQty * product.purchasePrice).toFixed(2))
      };
      setPurchaseItems(updated);
    } else {
      const newItem: PurchaseItem = {
        productId: product.id,
        productName: product.name,
        costPrice: product.purchasePrice,
        quantity: 1,
        total: product.purchasePrice
      };
      setPurchaseItems([...purchaseItems, newItem]);
    }
  };

  // Remove item
  const handleRemoveItemFromPurchase = (productId: string) => {
    setPurchaseItems(purchaseItems.filter(item => item.productId !== productId));
  };

  // Update cost or quantity inside cart
  const handleUpdateItemField = (productId: string, field: 'quantity' | 'costPrice', val: number) => {
    setPurchaseItems(purchaseItems.map(item => {
      if (item.productId === productId) {
        const updatedItem = { ...item };
        if (field === 'quantity') {
          updatedItem.quantity = Math.max(1, val);
        } else if (field === 'costPrice') {
          updatedItem.costPrice = Math.max(0, val);
        }
        updatedItem.total = parseFloat((updatedItem.quantity * updatedItem.costPrice).toFixed(2));
        return updatedItem;
      }
      return item;
    }));
  };

  // Totals calculations
  const purchaseSubtotal = useMemo(() => {
    return purchaseItems.reduce((acc, item) => acc + item.total, 0);
  }, [purchaseItems]);

  const purchaseTaxAmount = useMemo(() => {
    return parseFloat((purchaseSubtotal * (purchaseTaxRate / 100)).toFixed(2));
  }, [purchaseSubtotal, purchaseTaxRate]);

  const purchaseTotal = useMemo(() => {
    const total = purchaseSubtotal + purchaseTaxAmount - purchaseDiscount;
    return Math.max(0, parseFloat(total.toFixed(2)));
  }, [purchaseSubtotal, purchaseTaxAmount, purchaseDiscount]);

  const handleSetPaidInFull = () => {
    setPurchasePaidAmount(purchaseTotal);
  };

  // Submit purchase creation
  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseItems.length === 0) {
      alert('❌ الرجاء إضافة صنف واحد على الأقل لفاتورة الشراء.');
      return;
    }

    if (!purchaseSupplierId) {
      alert('❌ يرجى تسجيل مورد أولاً في شاشة الحسابات لتتمكن من الشراء.');
      return;
    }

    const supp = suppliers.find(s => s.id === purchaseSupplierId);
    if (!supp) return;

    let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
    if (purchasePaidAmount >= purchaseTotal) {
      paymentStatus = 'paid';
    } else if (purchasePaidAmount > 0) {
      paymentStatus = 'partial';
    }

    const unpaidDebt = parseFloat((purchaseTotal - purchasePaidAmount).toFixed(2));
    const invoiceNumber = `PUR-2026-${String(purchases.length + 1).padStart(3, '0')}`;

    const newInvoice: PurchaseInvoice = {
      id: `inv-p-${Date.now()}`,
      invoiceNumber,
      date: purchaseDate,
      supplierId: purchaseSupplierId,
      supplierName: supp.name,
      items: purchaseItems,
      subtotal: purchaseSubtotal,
      taxRate: purchaseTaxRate,
      taxAmount: purchaseTaxAmount,
      discount: purchaseDiscount,
      total: purchaseTotal,
      paidAmount: purchasePaidAmount,
      paymentStatus,
      notes: purchaseNotes
    };

    onAddPurchase(newInvoice);

    // AUTOMATICALLY INCREASE product stock levels in inventory database
    // and optionally update buying cost price inside product profile!
    purchaseItems.forEach(item => {
      // Pass buying cost price so we can update product's purchase price to keep calculations accurate!
      onUpdateProductStock(item.productId, -item.quantity, item.costPrice);
    });

    // Update supplier debt and total transactions
    onUpdateSupplierBalance(purchaseSupplierId, unpaidDebt, purchaseTotal);

    // Reset fields
    setPurchaseItems([]);
    setPurchaseDiscount(0);
    setPurchasePaidAmount(0);
    setPurchaseNotes('');
    
    // Switch to list view
    setSelectedInvoice(newInvoice);
    setPurchasesSubTab('list');
  };

  return (
    <div className="space-y-6" id="purchases-manager-root">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-3xs print:hidden">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-sans flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-500" />
            <span>المشتريات وفواتير الموردين</span>
          </h1>
          <p className="text-sm text-gray-500 font-sans mt-0.5">
            تسجيل فواتير الشراء الواردة من الموردين لتغذية المخزون وتحديث الكميات وتتبع التكاليف.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            id="tab-btn-purchases-list"
            onClick={() => { setPurchasesSubTab('list'); setSelectedInvoice(null); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all cursor-pointer ${
              purchasesSubTab === 'list' && !selectedInvoice
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            فواتير المشتريات
          </button>

          <button
            id="tab-btn-purchases-create"
            onClick={() => { setPurchasesSubTab('create'); setSelectedInvoice(null); }}
            className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border transition-all cursor-pointer ${
              purchasesSubTab === 'create'
                ? 'bg-indigo-600 border-indigo-600 text-white font-bold'
                : 'bg-white hover:bg-gray-50 border-gray-200 text-indigo-600 border-indigo-100'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل فاتورة شراء</span>
          </button>

          <button
            id="export-purchases-excel-btn"
            onClick={() => exportPurchasesToExcel(purchases)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <span>تصدير المشتريات</span>
          </button>
        </div>
      </div>

      {/* VIEW DETAILS */}
      {selectedInvoice ? (
        <div className="space-y-6" id="purchase-invoice-detail-container">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-3xs print:hidden">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 font-sans font-semibold cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 rotate-180" />
              <span>العودة لقائمة الفواتير</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الفاتورة</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-xs max-w-3xl mx-auto print:border-0 print:shadow-none print:p-0 font-sans">
            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center pb-6 border-b border-gray-100 gap-4">
              <div className="text-center sm:text-right space-y-1">
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">نظام المبيعات والمخزون المتكامل</h2>
                <p className="text-xs text-gray-400">سجل فواتير توريد السلع</p>
              </div>
              <div className="text-center sm:text-left bg-gray-50 p-4 rounded-xl space-y-1 min-w-[180px]">
                <h3 className="text-indigo-700 font-black text-sm">فاتورة مشتريات</h3>
                <span className="text-lg font-black font-mono text-gray-900 block mt-1">{selectedInvoice.invoiceNumber}</span>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{selectedInvoice.date}</span>
                </div>
              </div>
            </div>

            {/* Client and Vendor block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 text-sm text-gray-600 border-b border-gray-100">
              <div className="space-y-1.5 text-right">
                <span className="text-xs font-bold text-gray-400 block">المورد / المصدر:</span>
                <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{selectedInvoice.supplierName}</span>
                </div>
                <p className="text-xs">رقم الهاتف: {suppliers.find(s => s.id === selectedInvoice.supplierId)?.phone}</p>
                <p className="text-xs">العنوان: {suppliers.find(s => s.id === selectedInvoice.supplierId)?.address || 'غير محدد'}</p>
              </div>

              <div className="space-y-1.5 text-center sm:text-left">
                <span className="text-xs font-bold text-gray-400 block">المستودع المستقبل:</span>
                <span className="font-bold text-gray-800">مستودع مؤسسة حسن موسى</span>
                <p className="text-xs">المستودع الرئيسي - الرياض</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-6">
              <table className="w-full text-right border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-gray-500 font-bold pb-2 text-xs">
                    <th className="pb-3 text-right">اسم المنتج الصنف</th>
                    <th className="pb-3 text-left">تكلفة الوحدة</th>
                    <th className="pb-3 text-center">الكمية</th>
                    <th className="pb-3 text-left">الإجمالي الفرعي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {selectedInvoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 font-semibold text-gray-900">{item.productName}</td>
                      <td className="py-3 text-left font-mono">{item.costPrice.toLocaleString('ar-SA')} ر.س</td>
                      <td className="py-3 text-center font-mono font-bold">{item.quantity}</td>
                      <td className="py-3 text-left font-mono font-bold text-gray-900">{item.total.toLocaleString('ar-SA')} ر.س</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoices Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-100">
              <div className="text-xs text-gray-500 space-y-1.5">
                <h4 className="font-bold text-gray-700 text-sm">ملاحظات الفاتورة:</h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-12 mt-1">
                  {selectedInvoice.notes || 'لا توجد ملاحظات مسجلة على فاتورة المشتريات هذه.'}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>المجموع الفرعي:</span>
                  <span className="font-mono">{selectedInvoice.subtotal.toLocaleString('ar-SA')} ريال</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>الضريبة المضافة ({selectedInvoice.taxRate}%):</span>
                  <span className="font-mono">{selectedInvoice.taxAmount.toLocaleString('ar-SA')} ريال</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>خصم ممنوح من المورد:</span>
                    <span className="font-mono">-{selectedInvoice.discount.toLocaleString('ar-SA')} ريال</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-black text-gray-900">
                  <span>الإجمالي الكلي للتكلفة:</span>
                  <span className="font-mono text-indigo-600">{selectedInvoice.total.toLocaleString('ar-SA')} ريال</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs">
                  <div>
                    <span className="text-gray-400 block">المبلغ الذي سددناه:</span>
                    <span className="font-bold text-gray-700 font-mono">{selectedInvoice.paidAmount.toLocaleString('ar-SA')} ر.س</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">المتبقي علينا للمورد:</span>
                    <span className={`font-bold font-mono ${selectedInvoice.total - selectedInvoice.paidAmount > 0 ? 'text-indigo-600' : 'text-emerald-600'}`}>
                      {(selectedInvoice.total - selectedInvoice.paidAmount).toLocaleString('ar-SA')} ر.س
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-6 border-t border-gray-100 text-center text-xs text-gray-400 space-y-1">
              <p className="font-bold text-gray-600 font-sans">جميع الحقوق محفوظة © حسن موسى ٢٠٢٦</p>
            </div>
          </div>
        </div>
      ) : purchasesSubTab === 'create' ? (
        
        /* CREATE PURCHASE INVOICE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="purchase-creator-container">
          
          {/* Purchase Invoice Form (7 Columns) */}
          <form onSubmit={handleCreatePurchase} className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100 shadow-3xs space-y-4 flex flex-col justify-between h-fit">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 text-base font-sans flex items-center gap-1.5">
                  <Receipt className="w-5 h-5 text-indigo-500" />
                  <span>فاتورة شراء واردة جديدة</span>
                </h3>
                <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  المعرف: PUR-{purchases.length + 1}
                </span>
              </div>

              {suppliers.length === 0 ? (
                <div className="p-4 bg-amber-50 text-amber-900 rounded-xl border border-amber-100 text-xs font-sans space-y-2 text-right">
                  <p className="font-bold">⚠️ تنبيه هام: لا يوجد موردين مسجلين بعد!</p>
                  <p>يجب التوجه لعلامة تبويب "العملاء والموردين" لتسجيل مورد واحد على الأقل أولاً لتتمكن من إنشاء فواتير مشتريات وتحديث مخزونك.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 font-sans block">اختر المورد *</label>
                    <select
                      value={purchaseSupplierId}
                      onChange={(e) => setPurchaseSupplierId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs px-3 py-2 focus:outline-hidden text-gray-700 font-sans"
                    >
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>🏢 {s.name} (ديننا له: {s.balance} ر.س)</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 font-sans block">تاريخ الشراء / التوريد</label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full border border-gray-200 px-3 py-1.5 rounded-lg text-xs focus:outline-hidden text-gray-700 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Purchase Item cart */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-gray-500 font-sans font-semibold">المواد الموردة للمخازن:</h4>

                {purchaseItems.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl text-gray-400 text-xs font-sans">
                    لم تضف بضائع بعد. ابحث في قائمة المنتجات المتاحة المجاورة واضغط عليها لإضافتها للفاتورة.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto pr-1">
                    {purchaseItems.map(item => (
                      <div key={item.productId} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-gray-800 font-sans block">{item.productName}</span>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                          {/* Unit cost modifier */}
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-gray-400 text-[10px]">تكلفة التوريد:</span>
                            <input
                              type="number"
                              value={item.costPrice}
                              onChange={(e) => handleUpdateItemField(item.productId, 'costPrice', parseFloat(e.target.value) || 0)}
                              className="w-16 border border-gray-200 rounded-md p-1 font-mono font-bold text-left focus:outline-hidden"
                            />
                          </div>

                          {/* Quantity modifier */}
                          <div className="flex items-center border border-gray-200 rounded-md bg-gray-50 text-xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemField(item.productId, 'quantity', item.quantity - 1)}
                              className="px-2 py-1 text-gray-500 hover:bg-gray-100 font-bold font-sans rounded-r-md cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItemField(item.productId, 'quantity', parseInt(e.target.value, 10) || 1)}
                              className="w-9 text-center font-mono font-bold bg-transparent border-0 focus:outline-hidden focus:ring-0 p-1"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateItemField(item.productId, 'quantity', item.quantity + 1)}
                              className="px-2 py-1 text-gray-500 hover:bg-gray-100 font-bold font-sans rounded-l-md cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          <span className="text-xs font-mono font-bold text-gray-850 w-20 text-left">{item.total.toLocaleString('ar-SA')} ر.س</span>

                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromPurchase(item.productId)}
                            className="text-gray-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Discounts & Tax values */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 font-sans block">نسبة الضريبة الواردة %</label>
                  <input
                    type="number"
                    value={purchaseTaxRate}
                    onChange={(e) => setPurchaseTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs focus:outline-hidden font-mono text-left"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 font-sans block">خصم المورد لنا (ريال)</label>
                  <input
                    type="number"
                    value={purchaseDiscount}
                    onChange={(e) => setPurchaseDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs focus:outline-hidden font-mono text-left"
                  />
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-bold text-gray-600 font-sans block">المبلغ الذي سددناه نقداً</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={purchasePaidAmount}
                      onChange={(e) => setPurchasePaidAmount(parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-200 pl-12 pr-2.5 py-1.5 rounded-lg text-xs focus:outline-hidden font-mono text-left"
                    />
                    <button
                      type="button"
                      onClick={handleSetPaidInFull}
                      className="absolute left-1 top-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-1 rounded-sm font-bold cursor-pointer"
                    >
                      كامل
                    </button>
                  </div>
                </div>
              </div>

              {/* Invoice notes input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 font-sans block">ملاحظات الفاتورة</label>
                <input
                  type="text"
                  placeholder="ملاحظات الشحن أو رقم الفاتورة الورقية للمورد..."
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  className="w-full border border-gray-200 px-3 py-1.5 rounded-lg text-xs focus:outline-hidden font-sans"
                />
              </div>
            </div>

            {/* Calculations and Actions Footer */}
            <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-3 mt-4 text-xs font-sans">
              <div className="flex justify-between text-gray-600">
                <span>المجموع الفرعي:</span>
                <span className="font-mono font-bold">{purchaseSubtotal.toLocaleString('ar-SA')} ر.س</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>ضريبة القيمة المضافة:</span>
                <span className="font-mono font-bold">{purchaseTaxAmount.toLocaleString('ar-SA')} ر.س</span>
              </div>
              {purchaseDiscount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>الخصم المكتسب:</span>
                  <span className="font-mono font-bold">-{purchaseDiscount.toLocaleString('ar-SA')} ر.س</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-gray-900 border-t border-gray-200 pt-2">
                <span>الإجمالي الكلي المستحق:</span>
                <span className="font-mono text-base text-indigo-600">{purchaseTotal.toLocaleString('ar-SA')} ر.س</span>
              </div>

              {purchaseTotal - purchasePaidAmount > 0 && purchaseSupplierId && (
                <div className="p-2.5 bg-rose-50 rounded-lg text-rose-800 text-[11px] border border-rose-100/50 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>
                    سيسجل مبلغ <strong>{(purchaseTotal - purchasePaidAmount).toLocaleString('ar-SA')} ر.س</strong> كدين علينا للمورد في حسابه المالي.
                  </span>
                </div>
              )}

              {/* Action Submit */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setPurchaseItems([]); setPurchasesSubTab('list'); }}
                  className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-bold text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={suppliers.length === 0}
                  className="w-2/3 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-bold transition-all text-xs shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  اعتماد الشراء وتغذية المخزون
                </button>
              </div>
            </div>
          </form>

          {/* Product Pick panel (5 Columns) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs space-y-4 h-fit max-h-[640px] flex flex-col justify-between">
            <div className="space-y-4 overflow-hidden flex flex-col h-full">
              <h3 className="font-bold text-gray-800 text-sm font-sans">اختر صنفاً لتوريده وشراء كميات</h3>

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

              {/* Catalog list */}
              <div className="divide-y divide-gray-50 overflow-y-auto max-h-96 pr-1 space-y-1">
                {filteredProductsToSelect.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-xs font-sans">
                    لا توجد أصناف مطابقة.
                  </div>
                ) : (
                  filteredProductsToSelect.map(p => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => handleAddItemToPurchase(p)}
                      className="w-full text-right py-2 px-1.5 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between gap-2 border-0 bg-transparent text-gray-800 cursor-pointer"
                    >
                      <div className="space-y-0.5 text-right">
                        <span className="text-xs font-bold font-sans block">{p.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono block">الرمز: {p.code} | {p.category}</span>
                      </div>

                      <div className="text-left shrink-0">
                        <span className="text-xs font-mono font-bold text-gray-950 block">{p.purchasePrice.toLocaleString('ar-SA')} ر.س</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full inline-block mt-0.5 font-bold bg-slate-100 text-slate-700">
                          بالمخزن حالياً: {p.quantity}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        
        /* PURCHASE INVOICES LIST VIEW */
        <div className="space-y-4" id="purchases-list-view">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-3xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
              <input
                type="text"
                placeholder="ابحث برقم الفاتورة أو المورد..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-sm font-sans"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 font-sans shrink-0 font-bold">حالة الدفع للمورد:</span>
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

          <div className="bg-white rounded-2xl border border-gray-100 shadow-3xs overflow-hidden" id="purchases-table-card">
            {filteredPurchases.length === 0 ? (
              <div className="text-center py-12 text-gray-400 font-sans">
                لا تتوفر فواتير توريد أو مشتريات تطابق شروط الفلترة الحالية.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-semibold">
                      <th className="py-4 px-6 font-sans">رقم الفاتورة</th>
                      <th className="py-4 px-6 font-sans">التاريخ</th>
                      <th className="py-4 px-6 font-sans">اسم المورد</th>
                      <th className="py-4 px-6 font-sans text-center">أصناف الفاتورة</th>
                      <th className="py-4 px-6 font-sans text-left">قيمة المشتريات</th>
                      <th className="py-4 px-6 font-sans text-center">الحالة</th>
                      <th className="py-4 px-6 font-sans text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredPurchases.map(p => {
                      const owes = p.total - p.paidAmount;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3.5 px-6 font-mono font-bold text-gray-800 text-xs">{p.invoiceNumber}</td>
                          <td className="py-3.5 px-6 font-mono text-xs text-gray-500">{p.date}</td>
                          <td className="py-3.5 px-6 font-semibold text-gray-800 font-sans">{p.supplierName}</td>
                          <td className="py-3.5 px-6 text-center font-mono font-bold text-gray-600">{p.items.length} أصناف</td>
                          <td className="py-3.5 px-6 text-left font-mono font-bold text-gray-900">
                            <div>
                              <span>{p.total.toLocaleString('ar-SA')} ر.س</span>
                              {owes > 0 && (
                                <span className="block text-[10px] text-indigo-600 font-normal mt-0.5">علينا له: {owes.toLocaleString('ar-SA')} ر.س</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            <span className={`text-[11px] px-2 py-1 rounded-full font-bold font-sans inline-block ${
                              p.paymentStatus === 'paid' 
                                ? 'bg-emerald-50 text-emerald-700' 
                                : p.paymentStatus === 'partial' 
                                ? 'bg-amber-50 text-amber-700' 
                                : 'bg-rose-50 text-rose-700'
                            }`}>
                              {p.paymentStatus === 'paid' ? 'مدفوعة' : p.paymentStatus === 'partial' ? 'جزئي' : 'غير مدفوعة'}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            <button
                              id={`view-purchase-btn-${p.id}`}
                              onClick={() => setSelectedInvoice(p)}
                              className="inline-flex items-center gap-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-100 px-3 py-1.5 rounded-md font-semibold font-sans transition-colors cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>تفاصيل وتوريد</span>
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
