import React, { useMemo } from 'react';
import { Product, Customer, Supplier, SaleInvoice, PurchaseInvoice } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  AlertTriangle, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers,
  FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface DashboardHomeProps {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: SaleInvoice[];
  purchases: PurchaseInvoice[];
  onNavigate: (tab: string) => void;
}

export default function DashboardHome({
  products,
  customers,
  suppliers,
  sales,
  purchases,
  onNavigate
}: DashboardHomeProps) {

  // Calculations
  const totalSalesAmount = useMemo(() => {
    return sales.reduce((acc, sale) => acc + sale.total, 0);
  }, [sales]);

  const totalPurchasesAmount = useMemo(() => {
    return purchases.reduce((acc, purchase) => acc + purchase.total, 0);
  }, [purchases]);

  // Total cash received
  const totalPaidSales = useMemo(() => {
    return sales.reduce((acc, sale) => acc + sale.paidAmount, 0);
  }, [sales]);

  // Total cash paid to suppliers
  const totalPaidPurchases = useMemo(() => {
    return purchases.reduce((acc, p) => acc + p.paidAmount, 0);
  }, [purchases]);

  // Total customer debts
  const totalCustomerDebts = useMemo(() => {
    return customers.reduce((acc, c) => acc + c.balance, 0);
  }, [customers]);

  // Low stock products alert count
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.quantity <= p.minQuantityAlert);
  }, [products]);

  // Calculated gross profit: For each sales item, profit = (SalePrice - CostPrice) * Quantity
  // Let's match product by ID to find costPrice, or assume costPrice is the purchase price
  const grossProfit = useMemo(() => {
    let profit = 0;
    sales.forEach(sale => {
      let saleProfit = 0;
      sale.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const cost = prod ? prod.purchasePrice : (item.price * 0.7); // fallback
        saleProfit += (item.price - cost) * item.quantity;
      });
      // Deduct the general invoice discount proportionally
      const discountPercentage = sale.subtotal > 0 ? (sale.discount / sale.subtotal) : 0;
      saleProfit = saleProfit - (saleProfit * discountPercentage);
      profit += saleProfit;
    });
    return Math.max(0, parseFloat(profit.toFixed(2)));
  }, [sales, products]);

  // Prepare chart data for last 7 days of sales
  const salesChartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const daySales = sales.filter(s => s.date === date);
      const total = daySales.reduce((sum, s) => sum + s.total, 0);
      const profit = daySales.reduce((sum, s) => {
        let pSum = 0;
        s.items.forEach(item => {
          const prod = products.find(p => p.id === item.productId);
          const cost = prod ? prod.purchasePrice : (item.price * 0.7);
          pSum += (item.price - cost) * item.quantity;
        });
        const discRatio = s.subtotal > 0 ? (s.discount / s.subtotal) : 0;
        return sum + (pSum - pSum * discRatio);
      }, 0);

      // format date to readable local e.g., "03-07"
      const dateParts = date.split('-');
      const formattedDate = `${dateParts[2]}/${dateParts[1]}`;

      return {
        name: formattedDate,
        'المبيعات': total,
        'الأرباح': Math.max(0, parseFloat(profit.toFixed(1)))
      };
    });
  }, [sales, products]);

  // Categories distribution chart data
  const categoryChartData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + p.quantity;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      'الكمية المتوفرة': counts[key]
    })).slice(0, 5); // top 5
  }, [products]);

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Welcome & Stats Summary Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-xs gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">مرحباً بك في نظام المبيعات والمخزون</h1>
          <p className="text-gray-500 text-sm mt-1 font-sans">
            أهلاً بك مجدداً. إليك نظرة سريعة على أداء أعمالك اليوم والتنبيهات الهامة.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            id="quick-sale-btn"
            onClick={() => onNavigate('sales')} 
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>فاتورة مبيعات جديدة</span>
          </button>
          <button 
            id="quick-purchase-btn"
            onClick={() => onNavigate('purchases')} 
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>فاتورة مشتريات جديدة</span>
          </button>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
        {/* Stat 1: Total Sales */}
        <div id="stat-sales" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs hover:shadow-xs transition-shadow flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 font-sans block">إجمالي المبيعات</span>
            <span className="text-2xl font-bold text-gray-900 font-mono tracking-tight block">
              {totalSalesAmount.toLocaleString('ar-SA')} <span className="text-xs font-sans font-normal text-gray-500">ريال</span>
            </span>
            <span className="text-xs text-emerald-600 font-sans flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>المبالغ المحصلة: {totalPaidSales.toLocaleString('ar-SA')} ريال</span>
            </span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 2: Total Purchases */}
        <div id="stat-purchases" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs hover:shadow-xs transition-shadow flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 font-sans block">إجمالي المشتريات</span>
            <span className="text-2xl font-bold text-gray-900 font-mono tracking-tight block">
              {totalPurchasesAmount.toLocaleString('ar-SA')} <span className="text-xs font-sans font-normal text-gray-500">ريال</span>
            </span>
            <span className="text-xs text-indigo-600 font-sans flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>المدفوع للموردين: {totalPaidPurchases.toLocaleString('ar-SA')} ريال</span>
            </span>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 3: Gross Profit */}
        <div id="stat-profit" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs hover:shadow-xs transition-shadow flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 font-sans block">الأرباح التقديرية</span>
            <span className="text-2xl font-bold text-emerald-600 font-mono tracking-tight block">
              {grossProfit.toLocaleString('ar-SA')} <span className="text-xs font-sans font-normal text-emerald-500">ريال</span>
            </span>
            <span className="text-xs text-gray-500 font-sans">
              هامش الأرباح بعد الخصومات
            </span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 4: Inventory Items */}
        <div id="stat-inventory" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs hover:shadow-xs transition-shadow flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 font-sans block">حجم المخزون</span>
            <span className="text-2xl font-bold text-gray-900 font-mono tracking-tight block">
              {products.reduce((acc, p) => acc + p.quantity, 0).toLocaleString('ar-SA')} <span className="text-xs font-sans font-normal text-gray-500">قطعة</span>
            </span>
            <span className="text-xs text-rose-600 font-sans flex items-center gap-1">
              <Package className="w-3.5 h-3.5" />
              <span>{products.length} صنفاً مسجلاً</span>
            </span>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="charts-grid">
        {/* Sales & Profits Area Chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 font-sans">حركة المبيعات والأرباح (آخر 7 أيام)</h3>
              <p className="text-xs text-gray-400 font-sans">تحليل يومي للمبيعات مقابل الأرباح الصافية</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                <span className="text-gray-500">المبيعات</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span className="text-gray-500">الأرباح</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChartData} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f3f4f6', direction: 'rtl', textAlign: 'right' }} 
                  labelClassName="font-sans font-bold text-xs"
                />
                <Area type="monotone" dataKey="المبيعات" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                <Area type="monotone" dataKey="الأرباح" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#profitGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Categories Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <h3 className="text-base font-bold text-gray-900 font-sans mb-1">المخزون حسب الأقسام</h3>
          <p className="text-xs text-gray-400 font-sans mb-4">توزيع كميات المنتجات على الأقسام الرئيسية</p>
          <div className="h-64">
            {categoryChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm font-sans">
                لا توجد بيانات حالياً
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f3f4f6', direction: 'rtl', textAlign: 'right' }} 
                    labelClassName="font-sans font-bold text-xs"
                  />
                  <Bar dataKey="الكمية المتوفرة" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Alert Panel & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="alerts-activity-section">
        {/* Low Stock Alert Panel */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs" id="low-stock-panel">
          <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-50 text-rose-500 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-gray-900 font-sans">تنبيهات المخزون المنخفض</h3>
            </div>
            <span className="bg-rose-50 text-rose-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {lowStockProducts.length} أصناف
            </span>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm font-sans">
              👍 كل كميات المنتجات سليمة وفوق حد الأمان
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto pr-1">
              {lowStockProducts.map(p => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 font-sans">{p.name}</h4>
                    <span className="text-xs text-gray-400 font-sans block mt-0.5">الكود: {p.code} | القسم: {p.category}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-xs text-rose-600 bg-rose-50 font-bold px-2.5 py-1 rounded-full font-sans inline-block">
                      الكمية: {p.quantity} من {p.minQuantityAlert}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Active Customers & Debts Panel */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs" id="top-customers-panel">
          <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-50 text-amber-500 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-gray-900 font-sans">المديونيات الكبرى ومستحقات العملاء</h3>
            </div>
            <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full font-sans">
              إجمالي الديون: {totalCustomerDebts.toLocaleString('ar-SA')} ر.س
            </span>
          </div>

          {customers.filter(c => c.balance > 0).length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm font-sans">
              👏 لا توجد ديون مستحقة على العملاء حالياً
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto pr-1">
              {customers
                .filter(c => c.balance > 0)
                .sort((a, b) => b.balance - a.balance)
                .slice(0, 5)
                .map(c => (
                  <div key={c.id} className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 font-sans">{c.name}</h4>
                      <span className="text-xs text-gray-400 font-sans block mt-0.5">هاتف: {c.phone} | المشتريات: {c.totalPurchases.toLocaleString('ar-SA')} ريال</span>
                    </div>
                    <div className="text-left">
                      <span className="text-xs text-amber-700 bg-amber-50 font-bold px-2.5 py-1 rounded-full font-sans inline-block">
                        مطلوب: {c.balance.toLocaleString('ar-SA')} ر.س
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
