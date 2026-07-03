import React, { useState, useEffect } from 'react';
import { Product, Customer, Supplier, SaleInvoice, PurchaseInvoice } from './types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_CUSTOMERS, 
  INITIAL_SUPPLIERS, 
  INITIAL_SALES, 
  INITIAL_PURCHASES 
} from './initialData';

// Subcomponents
import DashboardHome from './components/DashboardHome';
import ProductManager from './components/ProductManager';
import CustomerSupplierManager from './components/CustomerSupplierManager';
import SalesManager from './components/SalesManager';
import PurchasesManager from './components/PurchasesManager';
import ReportsManager from './components/ReportsManager';

// Icons
import { 
  LayoutDashboard, 
  Layers, 
  Users, 
  Receipt, 
  TrendingDown, 
  BarChart4, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // --- STATE WITH LOCAL STORAGE PERSISTENCE ---
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<SaleInvoice[]>([]);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);

  // Load from local storage or set initial mock data
  useEffect(() => {
    const storedProducts = localStorage.getItem('sales_app_products');
    const storedCustomers = localStorage.getItem('sales_app_customers');
    const storedSuppliers = localStorage.getItem('sales_app_suppliers');
    const storedSales = localStorage.getItem('sales_app_sales');
    const storedPurchases = localStorage.getItem('sales_app_purchases');

    if (storedProducts) setProducts(JSON.parse(storedProducts));
    else {
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem('sales_app_products', JSON.stringify(INITIAL_PRODUCTS));
    }

    if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
    else {
      setCustomers(INITIAL_CUSTOMERS);
      localStorage.setItem('sales_app_customers', JSON.stringify(INITIAL_CUSTOMERS));
    }

    if (storedSuppliers) setSuppliers(JSON.parse(storedSuppliers));
    else {
      setSuppliers(INITIAL_SUPPLIERS);
      localStorage.setItem('sales_app_suppliers', JSON.stringify(INITIAL_SUPPLIERS));
    }

    if (storedSales) setSales(JSON.parse(storedSales));
    else {
      setSales(INITIAL_SALES);
      localStorage.setItem('sales_app_sales', JSON.stringify(INITIAL_SALES));
    }

    if (storedPurchases) setPurchases(JSON.parse(storedPurchases));
    else {
      setPurchases(INITIAL_PURCHASES);
      localStorage.setItem('sales_app_purchases', JSON.stringify(INITIAL_PURCHASES));
    }
  }, []);

  // Sync helpers to keep local storage updated
  const syncProducts = (updated: Product[]) => {
    setProducts(updated);
    localStorage.setItem('sales_app_products', JSON.stringify(updated));
  };

  const syncCustomers = (updated: Customer[]) => {
    setCustomers(updated);
    localStorage.setItem('sales_app_customers', JSON.stringify(updated));
  };

  const syncSuppliers = (updated: Supplier[]) => {
    setSuppliers(updated);
    localStorage.setItem('sales_app_suppliers', JSON.stringify(updated));
  };

  const syncSales = (updated: SaleInvoice[]) => {
    setSales(updated);
    localStorage.setItem('sales_app_sales', JSON.stringify(updated));
  };

  const syncPurchases = (updated: PurchaseInvoice[]) => {
    setPurchases(updated);
    localStorage.setItem('sales_app_purchases', JSON.stringify(updated));
  };

  // --- RE-INITIALIZE / RESET APP DATABASE ---
  const handleResetDatabase = () => {
    if (confirm('⚠️ هل أنت متأكد من رغبتك في إعادة ضبط قاعدة البيانات وحذف جميع المبيعات والمخازن واستعادة البيانات التجريبية الأولية؟')) {
      setProducts(INITIAL_PRODUCTS);
      setCustomers(INITIAL_CUSTOMERS);
      setSuppliers(INITIAL_SUPPLIERS);
      setSales(INITIAL_SALES);
      setPurchases(INITIAL_PURCHASES);

      localStorage.setItem('sales_app_products', JSON.stringify(INITIAL_PRODUCTS));
      localStorage.setItem('sales_app_customers', JSON.stringify(INITIAL_CUSTOMERS));
      localStorage.setItem('sales_app_suppliers', JSON.stringify(INITIAL_SUPPLIERS));
      localStorage.setItem('sales_app_sales', JSON.stringify(INITIAL_SALES));
      localStorage.setItem('sales_app_purchases', JSON.stringify(INITIAL_PURCHASES));

      setActiveTab('dashboard');
      alert('تم إعادة تهيئة قاعدة البيانات بنجاح!');
    }
  };

  // --- PRODUCT UPDATES ---
  const handleAddProduct = (prod: Product) => {
    // Check if code/barcode is duplicated
    const exists = products.some(p => p.code.toLowerCase() === prod.code.toLowerCase());
    if (exists) {
      alert(`❌ خطأ: كود الباركود (${prod.code}) مسجل بالفعل لمنتج آخر! يرجى اختيار رمز فريد.`);
      return;
    }
    syncProducts([...products, prod]);
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    // Check duplication excluding self
    const exists = products.some(p => p.id !== updatedProd.id && p.code.toLowerCase() === updatedProd.code.toLowerCase());
    if (exists) {
      alert(`❌ خطأ: كود الباركود (${updatedProd.code}) مستخدم لدى منتج آخر!`);
      return;
    }
    syncProducts(products.map(p => p.id === updatedProd.id ? updatedProd : p));
  };

  const handleDeleteProduct = (id: string) => {
    syncProducts(products.filter(p => p.id !== id));
  };

  const handleBulkAddProducts = (imported: Product[]) => {
    const updatedList = [...products];
    imported.forEach(imp => {
      // If product with code already exists, we update its quantity and price, otherwise we add it!
      const idx = updatedList.findIndex(p => p.code.toLowerCase() === imp.code.toLowerCase());
      if (idx > -1) {
        updatedList[idx] = {
          ...updatedList[idx],
          name: imp.name,
          category: imp.category,
          purchasePrice: imp.purchasePrice,
          salePrice: imp.salePrice,
          quantity: updatedList[idx].quantity + imp.quantity, // increment quantity on import!
          description: imp.description || updatedList[idx].description
        };
      } else {
        updatedList.push(imp);
      }
    });
    syncProducts(updatedList);
  };

  // --- CUSTOMER UPDATES ---
  const handleAddCustomer = (c: Customer) => {
    syncCustomers([...customers, c]);
  };

  const handleUpdateCustomer = (c: Customer) => {
    syncCustomers(customers.map(item => item.id === c.id ? c : item));
  };

  const handleDeleteCustomer = (id: string) => {
    syncCustomers(customers.filter(c => c.id !== id));
  };

  const handleBulkAddCustomers = (imported: Customer[]) => {
    const updatedList = [...customers];
    imported.forEach(imp => {
      const idx = updatedList.findIndex(c => c.name.toLowerCase() === imp.name.toLowerCase() || c.phone === imp.phone);
      if (idx > -1) {
        updatedList[idx] = {
          ...updatedList[idx],
          phone: imp.phone || updatedList[idx].phone,
          email: imp.email || updatedList[idx].email,
          address: imp.address || updatedList[idx].address,
          balance: updatedList[idx].balance + imp.balance // add up balance
        };
      } else {
        updatedList.push(imp);
      }
    });
    syncCustomers(updatedList);
  };

  // --- SUPPLIER UPDATES ---
  const handleAddSupplier = (s: Supplier) => {
    syncSuppliers([...suppliers, s]);
  };

  const handleUpdateSupplier = (s: Supplier) => {
    syncSuppliers(suppliers.map(item => item.id === s.id ? s : item));
  };

  const handleDeleteSupplier = (id: string) => {
    syncSuppliers(suppliers.filter(s => s.id !== id));
  };

  // --- SALES INVOICES & STOCK DEDUCTION ---
  const handleAddSale = (sale: SaleInvoice) => {
    syncSales([sale, ...sales]);
  };

  const handleUpdateProductStock = (productId: string, quantityDeduction: number, newPurchasePrice?: number) => {
    // Note: for sales quantityDeduction is positive (deducts quantity), for purchases it is negative (adds quantity!)
    syncProducts(products.map(p => {
      if (p.id === productId) {
        const updatedQty = Math.max(0, p.quantity - quantityDeduction);
        const updatedCost = newPurchasePrice !== undefined ? newPurchasePrice : p.purchasePrice;
        return {
          ...p,
          quantity: updatedQty,
          purchasePrice: updatedCost
        };
      }
      return p;
    }));
  };

  const handleUpdateCustomerBalance = (customerId: string, balanceChange: number, purchaseChange: number) => {
    syncCustomers(customers.map(c => {
      if (c.id === customerId) {
        return {
          ...c,
          balance: parseFloat((c.balance + balanceChange).toFixed(2)),
          totalPurchases: parseFloat((c.totalPurchases + purchaseChange).toFixed(2))
        };
      }
      return c;
    }));
  };

  // --- PURCHASES INVOICES ---
  const handleAddPurchase = (purchase: PurchaseInvoice) => {
    syncPurchases([purchase, ...purchases]);
  };

  const handleUpdateSupplierBalance = (supplierId: string, balanceChange: number, purchaseChange: number) => {
    syncSuppliers(suppliers.map(s => {
      if (s.id === supplierId) {
        return {
          ...s,
          balance: parseFloat((s.balance + balanceChange).toFixed(2)),
          totalPurchases: parseFloat((s.totalPurchases + purchaseChange).toFixed(2))
        };
      }
      return s;
    }));
  };

  // --- RECORD PAYMENT (REDUCE DEBTS ON CASH COLLECTION) ---
  const handleRecordPayment = (type: 'customer' | 'supplier', id: string, amount: number) => {
    if (type === 'customer') {
      syncCustomers(customers.map(c => {
        if (c.id === id) {
          const newBal = Math.max(0, parseFloat((c.balance - amount).toFixed(2)));
          return { ...c, balance: newBal };
        }
        return c;
      }));
    } else {
      syncSuppliers(suppliers.map(s => {
        if (s.id === id) {
          const newBal = Math.max(0, parseFloat((s.balance - amount).toFixed(2)));
          return { ...s, balance: newBal };
        }
        return s;
      }));
    }
    alert('✅ تم قيد الدفعة النقدية وتسويتها بالدفاتر المالية بنجاح!');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 leading-normal" dir="rtl" id="app-root-container">
      
      {/* 1. Header (Hidden during printing) */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40 print:hidden" id="app-main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          
          {/* Logo and Name */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-rose-500 to-amber-400 rounded-xl shadow-xs">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-sans font-black tracking-tight text-base sm:text-lg block">برنامج المبيعات المتكامل</span>
              <span className="text-[10px] text-gray-400 block font-sans">تطوير وتصميم وإشراف: حسن موسى</span>
            </div>
          </div>

          {/* Quick Stats Summary or Action */}
          <div className="flex items-center gap-3">
            {/* Quick system reboot */}
            <button
              id="reset-database-header-btn"
              onClick={handleResetDatabase}
              title="إعادة ضبط المصنع واستعادة البيانات التجريبية"
              className="p-2 bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-gray-400 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            
            <div className="hidden md:block bg-slate-800 text-xs text-gray-300 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-gray-500 font-sans">المخزون الحالي: </span>
              <span className="font-mono font-bold text-rose-400">{products.reduce((acc, p) => acc + p.quantity, 0)} قطعة</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Content & Navigation Sidebar Grid */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6" id="app-layout-grid">
        
        {/* Navigation Rail (Col 3 on large, full width on small) - Hidden during printing */}
        <aside className="lg:col-span-3 space-y-2 print:hidden" id="app-navigation-rail">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-3xs space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block px-3 mb-2 font-sans">القائمة الرئيسية</span>
            
            {/* Nav 1: Dashboard */}
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-right border-0 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-rose-50 text-rose-700 font-extrabold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
              <span className="font-sans">لوحة التحكم والملخص</span>
            </button>

            {/* Nav 2: Products Catalog */}
            <button
              id="nav-tab-products"
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-right border-0 cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-rose-50 text-rose-700 font-extrabold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <Layers className="w-4.5 h-4.5 shrink-0" />
              <span className="font-sans">إدارة المخزون والمنتجات</span>
            </button>

            {/* Nav 3: Sales Invoices */}
            <button
              id="nav-tab-sales"
              onClick={() => setActiveTab('sales')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-right border-0 cursor-pointer ${
                activeTab === 'sales'
                  ? 'bg-rose-50 text-rose-700 font-extrabold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <Receipt className="w-4.5 h-4.5 shrink-0" />
              <span className="font-sans">فواتير ومبيعات العملاء</span>
            </button>

            {/* Nav 4: Purchases Invoices */}
            <button
              id="nav-tab-purchases"
              onClick={() => setActiveTab('purchases')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-right border-0 cursor-pointer ${
                activeTab === 'purchases'
                  ? 'bg-rose-50 text-rose-700 font-extrabold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <TrendingDown className="w-4.5 h-4.5 shrink-0" />
              <span className="font-sans">المشتريات وفواتير الموردين</span>
            </button>

            {/* Nav 5: Customers & Suppliers */}
            <button
              id="nav-tab-customers"
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-right border-0 cursor-pointer ${
                activeTab === 'customers'
                  ? 'bg-rose-50 text-rose-700 font-extrabold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <Users className="w-4.5 h-4.5 shrink-0" />
              <span className="font-sans">العملاء والموردين الماليين</span>
            </button>

            {/* Nav 6: Comprehensive Reports */}
            <button
              id="nav-tab-reports"
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-right border-0 cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-rose-50 text-rose-700 font-extrabold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <BarChart4 className="w-4.5 h-4.5 shrink-0" />
              <span className="font-sans">مركز التقارير والأرباح</span>
            </button>
          </div>

          {/* Hassan Mousa Designer Card */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 relative overflow-hidden" id="about-developer-card">
            <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-white/5 rounded-full blur-xl" />
            <span className="text-[10px] text-rose-400 font-bold block tracking-wider font-sans uppercase">رخصة حقوق النشر والملكية</span>
            <span className="text-sm font-black font-sans block text-white">المالك: حسن موسى</span>
            <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
              جميع الحقوق محفوظة ومحمية بموجب أنظمة حماية حقوق المؤلف للمصمم حسن موسى لعام ٢٠٢٦ م.
            </p>
          </div>
        </aside>

        {/* Primary Page Canvas (Col 9 on large, takes full height print/normal) */}
        <main className="lg:col-span-9" id="app-pages-viewport">
          
          {/* Dashboard Page */}
          {activeTab === 'dashboard' && (
            <DashboardHome
              products={products}
              customers={customers}
              suppliers={suppliers}
              sales={sales}
              purchases={purchases}
              onNavigate={setActiveTab}
            />
          )}

          {/* Products Page */}
          {activeTab === 'products' && (
            <ProductManager
              products={products}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onBulkAddProducts={handleBulkAddProducts}
            />
          )}

          {/* Sales Invoices Page */}
          {activeTab === 'sales' && (
            <SalesManager
              sales={sales}
              products={products}
              customers={customers}
              onAddSale={handleAddSale}
              onUpdateProductStock={handleUpdateProductStock}
              onUpdateCustomerBalance={handleUpdateCustomerBalance}
            />
          )}

          {/* Purchases Page */}
          {activeTab === 'purchases' && (
            <PurchasesManager
              purchases={purchases}
              products={products}
              suppliers={suppliers}
              onAddPurchase={handleAddPurchase}
              onUpdateProductStock={handleUpdateProductStock}
              onUpdateSupplierBalance={handleUpdateSupplierBalance}
            />
          )}

          {/* Customers and Suppliers Page */}
          {activeTab === 'customers' && (
            <CustomerSupplierManager
              customers={customers}
              suppliers={suppliers}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onBulkAddCustomers={handleBulkAddCustomers}
              onAddSupplier={handleAddSupplier}
              onUpdateSupplier={handleUpdateSupplier}
              onDeleteSupplier={handleDeleteSupplier}
              onRecordPayment={handleRecordPayment}
            />
          )}

          {/* Reports and Analysis Page */}
          {activeTab === 'reports' && (
            <ReportsManager
              products={products}
              customers={customers}
              suppliers={suppliers}
              sales={sales}
              purchases={purchases}
            />
          )}
        </main>
      </div>

      {/* 3. Footer (Hidden during printing) */}
      <footer className="bg-white border-t border-gray-200 py-6 print:hidden mt-auto" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="font-bold text-gray-600 font-sans text-center md:text-right">
            <span>جميع الحقوق محفوظة © </span>
            <span className="text-rose-600">حسن موسى</span>
            <span> ٢٠٢٦ م</span>
          </div>
          <div className="flex gap-4 font-mono text-gray-400">
            <span>نسخة النظام: v2.5.0-production</span>
            <span>|</span>
            <span>نظام مبيعات ومخزون متكامل</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
