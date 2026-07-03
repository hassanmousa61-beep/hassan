import React, { useState, useRef, useMemo } from 'react';
import { Customer, Supplier } from '../types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  DollarSign, 
  X, 
  AlertCircle, 
  Upload, 
  FileSpreadsheet, 
  FileDown,
  UserCheck,
  Contact2
} from 'lucide-react';
import { 
  exportCustomersToExcel, 
  exportSuppliersToExcel, 
  importCustomersFromExcel, 
  downloadCustomersTemplate 
} from '../excelUtils';

interface CustomerSupplierManagerProps {
  customers: Customer[];
  suppliers: Supplier[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onBulkAddCustomers: (customers: Customer[]) => void;
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  onRecordPayment: (type: 'customer' | 'supplier', id: string, amount: number) => void;
}

export default function CustomerSupplierManager({
  customers,
  suppliers,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onBulkAddCustomers,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onRecordPayment
}: CustomerSupplierManagerProps) {
  // Navigation: Sub-tab between Customers & Suppliers
  const [activeSubTab, setActiveSubTab] = useState<'customers' | 'suppliers'>('customers');
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Form Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<{ type: 'customer' | 'supplier'; id: string; name: string; balance: number } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  // Customer Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerBalance, setCustomerBalance] = useState('');

  // Supplier Form Fields
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierBalance, setSupplierBalance] = useState('');

  // Import State
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Filter & Search results
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.phone.includes(searchQuery) ||
      (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [customers, searchQuery]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.phone.includes(searchQuery) ||
      (s.address && s.address.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [suppliers, searchQuery]);

  // Handle open modals
  const handleOpenCustomerModal = (customer: Customer | null = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setCustomerName(customer.name);
      setCustomerPhone(customer.phone);
      setCustomerEmail(customer.email || '');
      setCustomerAddress(customer.address || '');
      setCustomerBalance(customer.balance.toString());
    } else {
      setEditingCustomer(null);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerAddress('');
      setCustomerBalance('0');
    }
    setIsCustomerModalOpen(true);
  };

  const handleOpenSupplierModal = (supplier: Supplier | null = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setSupplierName(supplier.name);
      setSupplierPhone(supplier.phone);
      setSupplierEmail(supplier.email || '');
      setSupplierAddress(supplier.address || '');
      setSupplierBalance(supplier.balance.toString());
    } else {
      setEditingSupplier(null);
      setSupplierName('');
      setSupplierPhone('');
      setSupplierEmail('');
      setSupplierAddress('');
      setSupplierBalance('0');
    }
    setIsSupplierModalOpen(true);
  };

  const handleOpenPaymentModal = (type: 'customer' | 'supplier', id: string, name: string, balance: number) => {
    setPaymentTarget({ type, id, name, balance });
    setPaymentAmount('');
    setIsPaymentModalOpen(true);
  };

  // Submit Handlers
  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      alert('الرجاء إدخال الاسم ورقم الهاتف.');
      return;
    }

    const bal = parseFloat(customerBalance) || 0;

    if (editingCustomer) {
      onUpdateCustomer({
        ...editingCustomer,
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        address: customerAddress,
        balance: bal
      });
    } else {
      onAddCustomer({
        id: `c-${Date.now()}`,
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        address: customerAddress,
        totalPurchases: 0,
        balance: bal
      });
    }
    setIsCustomerModalOpen(false);
  };

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName || !supplierPhone) {
      alert('الرجاء إدخال الاسم ورقم الهاتف.');
      return;
    }

    const bal = parseFloat(supplierBalance) || 0;

    if (editingSupplier) {
      onUpdateSupplier({
        ...editingSupplier,
        name: supplierName,
        phone: supplierPhone,
        email: supplierEmail,
        address: supplierAddress,
        balance: bal
      });
    } else {
      onAddSupplier({
        id: `s-${Date.now()}`,
        name: supplierName,
        phone: supplierPhone,
        email: supplierEmail,
        address: supplierAddress,
        totalPurchases: 0,
        balance: bal
      });
    }
    setIsSupplierModalOpen(false);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTarget) return;

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('الرجاء إدخال مبلغ صحيح أكبر من الصفر.');
      return;
    }

    onRecordPayment(paymentTarget.type, paymentTarget.id, amt);
    setIsPaymentModalOpen(false);
    setPaymentTarget(null);
  };

  // Drag-and-Drop customer import
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processImportFile = async (file: File) => {
    try {
      setImportStatus(null);
      const parsed = await importCustomersFromExcel(file);
      
      if (parsed.length === 0) {
        setImportStatus({ success: false, message: 'ملف الإكسل فارغ أو يحتوي على بيانات غير صالحة.' });
        return;
      }

      const validated: Customer[] = parsed.map((item, index) => ({
        id: `c-import-${Date.now()}-${index}`,
        name: item.name || 'عميل مستورد',
        phone: item.phone || '0500000000',
        email: item.email || '',
        address: item.address || '',
        totalPurchases: item.totalPurchases || 0,
        balance: item.balance || 0
      }));

      onBulkAddCustomers(validated);
      setImportStatus({ success: true, message: `تم استيراد ${validated.length} عميل بنجاح إلى قاعدة البيانات!` });
    } catch (err) {
      console.error(err);
      setImportStatus({ success: false, message: 'فشل قراءة الملف. يرجى استخدام نموذج استيراد العملاء المعتمد.' });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImportFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6" id="customers-suppliers-root">
      {/* Tab Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-3xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-sans flex items-center gap-2">
            <Contact2 className="w-5 h-5 text-indigo-500" />
            <span>الحسابات: العملاء والموردين</span>
          </h1>
          <p className="text-sm text-gray-500 font-sans mt-0.5">
            إدارة جهات الاتصال والمشتريات، وتتبع تحصيلات الديون والمستحقات المالية.
          </p>
        </div>
        
        {/* Main Action Group */}
        <div className="flex flex-wrap gap-2">
          {activeSubTab === 'customers' ? (
            <>
              <button
                id="add-customer-btn"
                onClick={() => handleOpenCustomerModal()}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة عميل</span>
              </button>
              <button
                id="toggle-cust-import-btn"
                onClick={() => setIsImporting(!isImporting)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                  isImporting 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                    : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>استيراد عملاء</span>
              </button>
              <button
                id="export-customers-btn"
                onClick={() => exportCustomersToExcel(customers)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>تصدير العملاء</span>
              </button>
            </>
          ) : (
            <>
              <button
                id="add-supplier-btn"
                onClick={() => handleOpenSupplierModal()}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مورد</span>
              </button>
              <button
                id="export-suppliers-btn"
                onClick={() => exportSuppliersToExcel(suppliers)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>تصدير الموردين</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Customer Import Drag & Drop Section */}
      {isImporting && activeSubTab === 'customers' && (
        <div className="bg-white p-6 rounded-2xl border border-dashed border-gray-200 shadow-2xs space-y-4" id="customer-import-panel">
          <div className="flex justify-between items-center pb-2 border-b border-gray-50">
            <h3 className="font-bold text-gray-800 text-base font-sans">استيراد العملاء من ملف Excel</h3>
            <button 
              onClick={() => { setIsImporting(false); setImportStatus(null); }}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-gray-500 font-sans leading-relaxed">
            يمكنك رفع ملف Excel يحتوي على بيانات العملاء والمديونيات الحالية لتحديث قاعدة البيانات فوراً.
          </p>

          <div className="flex gap-2">
            <button
              onClick={downloadCustomersTemplate}
              className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-md hover:bg-indigo-100 transition-colors font-sans cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>تحميل نموذج بيانات العملاء (.xlsx)</span>
            </button>
          </div>

          {/* Upload Box */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-50/50' 
                : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processImportFile(e.target.files[0]);
                }
              }}
            />
            <FileSpreadsheet className={`w-12 h-12 mb-3 ${dragActive ? 'text-indigo-500' : 'text-gray-400'}`} />
            <p className="text-sm font-semibold text-gray-700 font-sans text-center">
              اسحب وأفلت ملف إكسل العملاء هنا أو انقر للتصفح من جهازك
            </p>
          </div>

          {importStatus && (
            <div className={`p-4 rounded-xl flex items-start gap-3 ${importStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}`}>
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs font-sans">
                {importStatus.message}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-gray-100 gap-6" id="accounts-subtabs">
        <button
          id="tab-customers"
          onClick={() => { setActiveSubTab('customers'); setSearchQuery(''); }}
          className={`pb-3 text-sm font-bold font-sans transition-colors relative cursor-pointer ${
            activeSubTab === 'customers' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span>العملاء ({customers.length})</span>
          {activeSubTab === 'customers' && (
            <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
        <button
          id="tab-suppliers"
          onClick={() => { setActiveSubTab('suppliers'); setSearchQuery(''); }}
          className={`pb-3 text-sm font-bold font-sans transition-colors relative cursor-pointer ${
            activeSubTab === 'suppliers' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span>الموردين ({suppliers.length})</span>
          {activeSubTab === 'suppliers' && (
            <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Search Filter input */}
      <div className="relative w-full sm:w-80" id="contacts-search-bar">
        <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
        <input
          type="text"
          placeholder={activeSubTab === 'customers' ? "ابحث بالاسم، الهاتف، أو العنوان..." : "ابحث باسم المورد، الهاتف..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-3 pr-9 py-2 rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-sans"
        />
      </div>

      {/* Customer List Section */}
      {activeSubTab === 'customers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="customers-cards-grid">
          {filteredCustomers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400 font-sans">
              لا توجد نتائج تطابق البحث المذكور.
            </div>
          ) : (
            filteredCustomers.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-3xs p-5 flex flex-col justify-between hover:shadow-2xs transition-shadow">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-800 text-base font-sans">{c.name}</h3>
                    <div className="flex items-center gap-1 text-[11px] font-sans">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-sm">عميل</span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-mono">{c.phone}</span>
                    </div>
                    {c.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}
                    {c.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{c.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 bg-gray-50 p-2.5 rounded-lg">
                    <div>
                      <span className="text-[10px] text-gray-400 font-sans block">إجمالي مشترياته</span>
                      <span className="text-xs font-bold text-gray-700 font-mono">{(c.totalPurchases || 0).toLocaleString('ar-SA')} ر.س</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-sans block">المديونية المستحقة</span>
                      <span className={`text-xs font-black font-mono ${c.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {(c.balance || 0).toLocaleString('ar-SA')} ر.س
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 gap-2">
                  <button
                    onClick={() => handleOpenPaymentModal('customer', c.id, c.name, c.balance)}
                    disabled={c.balance <= 0}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                      c.balance > 0 
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-100' 
                        : 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>تسديد دفعة</span>
                  </button>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleOpenCustomerModal(c)}
                      className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-md transition-colors cursor-pointer"
                      title="تعديل"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`هل ترغب بحذف العميل: ${c.name}؟`)) {
                          onDeleteCustomer(c.id);
                        }
                      }}
                      className="p-1.5 bg-gray-50 hover:bg-rose-50 text-rose-600 rounded-md transition-colors cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Supplier List Section */}
      {activeSubTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="suppliers-cards-grid">
          {filteredSuppliers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400 font-sans">
              لا توجد نتائج تطابق البحث المذكور.
            </div>
          ) : (
            filteredSuppliers.map(s => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-3xs p-5 flex flex-col justify-between hover:shadow-2xs transition-shadow">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-800 text-base font-sans">{s.name}</h3>
                    <div className="flex items-center gap-1 text-[11px] font-sans">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-sm">مورد</span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-mono">{s.phone}</span>
                    </div>
                    {s.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{s.email}</span>
                      </div>
                    )}
                    {s.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{s.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 bg-gray-50 p-2.5 rounded-lg">
                    <div>
                      <span className="text-[10px] text-gray-400 font-sans block">إجمالي مشترياتنا منه</span>
                      <span className="text-xs font-bold text-gray-700 font-mono">{(s.totalPurchases || 0).toLocaleString('ar-SA')} ر.س</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-sans block">مستحقات للمورد</span>
                      <span className={`text-xs font-black font-mono ${s.balance > 0 ? 'text-indigo-600' : 'text-emerald-600'}`}>
                        {(s.balance || 0).toLocaleString('ar-SA')} ر.س
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 gap-2">
                  <button
                    onClick={() => handleOpenPaymentModal('supplier', s.id, s.name, s.balance)}
                    disabled={s.balance <= 0}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                      s.balance > 0 
                        ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-100' 
                        : 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>دفع للمورد</span>
                  </button>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleOpenSupplierModal(s)}
                      className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-md transition-colors cursor-pointer"
                      title="تعديل"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`هل ترغب بحذف المورد: ${s.name}؟`)) {
                          onDeleteSupplier(s.id);
                        }
                      }}
                      className="p-1.5 bg-gray-50 hover:bg-rose-50 text-rose-600 rounded-md transition-colors cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Customer Form Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="customer-modal">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-gray-100">
            <div className="flex justify-between items-center bg-gray-50 p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base font-sans">
                {editingCustomer ? 'تعديل بيانات العميل' : 'تسجيل عميل جديد'}
              </h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCustomerSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 font-sans block">اسم العميل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد سليمان"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 font-sans block">رقم الهاتف *</label>
                <input
                  type="text"
                  required
                  placeholder="05xxxxxxxx"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-mono text-left"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 font-sans block">البريد الإلكتروني</label>
                <input
                  type="email"
                  placeholder="ahmed@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 font-sans block">العنوان السكني / التجاري</label>
                <input
                  type="text"
                  placeholder="المدينة - الحي - اسم الشارع"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 font-sans block">المديونية المبدئية الحالية إن وجدت (ريال)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  value={customerBalance}
                  onChange={(e) => setCustomerBalance(e.target.value)}
                  className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-mono text-left"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  حفظ العميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Form Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="supplier-modal">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-gray-100">
            <div className="flex justify-between items-center bg-gray-50 p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base font-sans">
                {editingSupplier ? 'تعديل بيانات المورد' : 'تسجيل مورد جديد'}
              </h3>
              <button onClick={() => setIsSupplierModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSupplierSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 font-sans block">اسم المورد / الشركة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شركة الوفاق للتوريدات"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 font-sans block">رقم الهاتف *</label>
                <input
                  type="text"
                  required
                  placeholder="05xxxxxxxx"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-mono text-left"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 font-sans block">البريد الإلكتروني</label>
                <input
                  type="email"
                  placeholder="supplier@example.com"
                  value={supplierEmail}
                  onChange={(e) => setSupplierEmail(e.target.value)}
                  className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 font-sans block">العنوان أو المقر الرئيس</label>
                <input
                  type="text"
                  placeholder="جدة - المنطقة الصناعية"
                  value={supplierAddress}
                  onChange={(e) => setSupplierAddress(e.target.value)}
                  className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 font-sans block">المستحقات له الحالية المبدئية إن وجدت (ريال)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  value={supplierBalance}
                  onChange={(e) => setSupplierBalance(e.target.value)}
                  className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-mono text-left"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  حفظ المورد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Receipt / Debt reduction Modal */}
      {isPaymentModalOpen && paymentTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="payment-modal">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-gray-100">
            <div className="flex justify-between items-center bg-amber-500 text-white p-5">
              <h3 className="font-bold text-sm font-sans flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                <span>تسجيل عملية سداد نقدي</span>
              </h3>
              <button onClick={() => { setIsPaymentModalOpen(false); setPaymentTarget(null); }} className="text-white hover:text-gray-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl text-center space-y-1">
                <span className="text-[11px] text-gray-400 font-sans block">الاسم</span>
                <span className="text-sm font-bold text-gray-800 font-sans block">{paymentTarget.name}</span>
                <span className="text-[11px] text-gray-400 font-sans block mt-2">المبلغ المتبقي الحالي</span>
                <span className="text-lg font-black text-amber-600 font-mono block">{paymentTarget.balance.toLocaleString('ar-SA')} ر.س</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 font-sans block">المبلغ المدفوع (ريال) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  autoFocus
                  placeholder="أدخل مبلغ السداد..."
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={paymentTarget.balance}
                  className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 font-mono text-left"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => { setIsPaymentModalOpen(false); setPaymentTarget(null); }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  تأكيد التحصيل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
