import React, { useState, useMemo } from 'react';
import { Product, Customer, Supplier, SaleInvoice, PurchaseInvoice } from '../types';
import { 
  FileText, 
  Printer, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  Users, 
  BarChart4,
  Search,
  BookOpen,
  Filter,
  CheckCircle2
} from 'lucide-react';

interface ReportsManagerProps {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: SaleInvoice[];
  purchases: PurchaseInvoice[];
}

export default function ReportsManager({
  products,
  customers,
  suppliers,
  sales,
  purchases
}: ReportsManagerProps) {
  // Active Report subtab
  const [activeReportTab, setActiveReportTab] = useState<'sales_purchases' | 'profit_loss' | 'stock_alerts' | 'customer_debts'>('sales_purchases');

  // Date Range Filters
  const [fromDate, setFromDate] = useState<string>('2026-01-01');
  const [toDate, setToDate] = useState<string>('2026-12-31');

  // Helper to filter items by Date Range
  const isWithinDateRange = (dateStr: string) => {
    return dateStr >= fromDate && dateStr <= toDate;
  };

  // Filtered Sales & Purchases
  const filteredSales = useMemo(() => {
    return sales.filter(s => isWithinDateRange(s.date));
  }, [sales, fromDate, toDate]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => isWithinDateRange(p.date));
  }, [purchases, fromDate, toDate]);

  // --- STATS CALCULATIONS ---

  const totalSalesVal = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.total, 0);
  }, [filteredSales]);

  const totalPurchasesVal = useMemo(() => {
    return filteredPurchases.reduce((sum, p) => sum + p.total, 0);
  }, [filteredPurchases]);

  // Profit & Loss calculation:
  // For each sale in range, profit = (Sale Unit Price - Product cost price) * Sold Quantity minus proportionate invoice discount
  const profitAndLossData = useMemo(() => {
    let revenue = 0;
    let costOfGoodsSold = 0;
    let totalDiscountGiven = 0;
    let taxAmountCollected = 0;

    filteredSales.forEach(sale => {
      revenue += sale.subtotal;
      totalDiscountGiven += sale.discount;
      taxAmountCollected += sale.taxAmount;

      sale.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        // If product cost is found, use it, else default to 70% of sale price
        const costPrice = prod ? prod.purchasePrice : (item.price * 0.7);
        costOfGoodsSold += costPrice * item.quantity;
      });
    });

    const netSales = revenue - totalDiscountGiven;
    const grossProfit = netSales - costOfGoodsSold;

    return {
      revenue,
      costOfGoodsSold,
      totalDiscountGiven,
      taxAmountCollected,
      netSales,
      grossProfit
    };
  }, [filteredSales, products]);

  // Stock alert stats
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.quantity <= p.minQuantityAlert);
  }, [products]);

  const totalInventoryCapital = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.purchasePrice * p.quantity), 0);
  }, [products]);

  const totalInventoryEstimatedSale = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.salePrice * p.quantity), 0);
  }, [products]);

  // Customers debts & most-buying analysis
  const customersReportList = useMemo(() => {
    return customers.map(c => {
      // Find all sales for this customer in selected period
      const custSales = filteredSales.filter(s => s.customerId === c.id);
      const totalPurchasedInPeriod = custSales.reduce((sum, s) => sum + s.total, 0);
      const countSalesInPeriod = custSales.length;

      return {
        ...c,
        totalPurchasedInPeriod,
        countSalesInPeriod
      };
    }).sort((a, b) => b.totalPurchasedInPeriod - a.totalPurchasedInPeriod);
  }, [customers, filteredSales]);

  // Print function
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="reports-manager-root">
      
      {/* Top Header Controls (Hidden during print) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-3xs print:hidden">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-sans flex items-center gap-2">
            <BarChart4 className="w-5 h-5 text-rose-500" />
            <span>مركز التقارير المحاسبية والإدارية</span>
          </h1>
          <p className="text-sm text-gray-500 font-sans mt-0.5">
            استعرض أرباحك، وتابع حركة المبيعات والمشتريات وحالة الديون، وجهّز التقارير للطباعة أو التصدير.
          </p>
        </div>

        <button
          id="print-report-btn"
          onClick={handlePrintReport}
          className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
        >
          <Printer className="w-4.5 h-4.5" />
          <span>طباعة التقرير النشط / تصدير PDF</span>
        </button>
      </div>

      {/* Date Range Filters Panel (Hidden during print) */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-3xs flex flex-col sm:flex-row sm:items-center gap-4 print:hidden" id="reports-date-filter-panel">
        <div className="flex items-center gap-2 text-sm text-gray-700 shrink-0 font-bold font-sans">
          <Filter className="w-4 h-4 text-gray-400" />
          <span>تصفية التقارير حسب التاريخ:</span>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 font-sans">من:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 font-mono focus:outline-hidden focus:border-rose-500 bg-gray-50"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 font-sans">إلى:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 font-mono focus:outline-hidden focus:border-rose-500 bg-gray-50"
            />
          </div>
        </div>

        <p className="text-[11px] text-gray-400 font-sans mr-auto">
          * تصفية التواريخ تنطبق على تقارير المبيعات والمشتريات والأرباح والعملاء.
        </p>
      </div>

      {/* Reports Tabs Selector (Hidden during print) */}
      <div className="flex flex-wrap border-b border-gray-100 gap-2 print:hidden" id="reports-tab-selector">
        <button
          onClick={() => setActiveReportTab('sales_purchases')}
          className={`px-4 py-2.5 rounded-t-lg text-xs font-bold font-sans border-t border-r border-l transition-all cursor-pointer ${
            activeReportTab === 'sales_purchases'
              ? 'bg-white border-gray-100 text-rose-600 shadow-3xs relative -mb-[1px]'
              : 'bg-gray-50/50 border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          حركة المبيعات والمشتريات
        </button>
        <button
          onClick={() => setActiveReportTab('profit_loss')}
          className={`px-4 py-2.5 rounded-t-lg text-xs font-bold font-sans border-t border-r border-l transition-all cursor-pointer ${
            activeReportTab === 'profit_loss'
              ? 'bg-white border-gray-100 text-rose-600 shadow-3xs relative -mb-[1px]'
              : 'bg-gray-50/50 border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          تقرير الأرباح والخسائر
        </button>
        <button
          onClick={() => setActiveReportTab('stock_alerts')}
          className={`px-4 py-2.5 rounded-t-lg text-xs font-bold font-sans border-t border-r border-l transition-all cursor-pointer ${
            activeReportTab === 'stock_alerts'
              ? 'bg-white border-gray-100 text-rose-600 shadow-3xs relative -mb-[1px]'
              : 'bg-gray-50/50 border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          مراقبة المخزون والحدود الآمنة
        </button>
        <button
          onClick={() => setActiveReportTab('customer_debts')}
          className={`px-4 py-2.5 rounded-t-lg text-xs font-bold font-sans border-t border-r border-l transition-all cursor-pointer ${
            activeReportTab === 'customer_debts'
              ? 'bg-white border-gray-100 text-rose-600 shadow-3xs relative -mb-[1px]'
              : 'bg-gray-50/50 border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          حسابات العملاء وتحصيل الديون
        </button>
      </div>

      {/* --- REPORT PRINTABLE WRAPPER --- */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-xs print:p-0 print:border-0 print:shadow-none" id="printable-report-content">
        
        {/* Report Official Header (Visible ONLY during print layout) */}
        <div className="hidden print:flex justify-between items-center pb-6 border-b-2 border-gray-200 mb-6 font-sans">
          <div className="text-right space-y-1">
            <h2 className="text-lg font-black text-gray-950">مؤسسة حسن موسى التجارية</h2>
            <p className="text-xs text-gray-400">قسم المحاسبة والمستودعات والمخازن</p>
            <p className="text-[10px] text-gray-500">الرقم الضريبي للمنشأة: 300012345600003</p>
          </div>
          <div className="text-left space-y-1">
            <span className="text-xs font-bold text-gray-500">تقرير إداري رسمي</span>
            <p className="text-[11px] font-mono text-gray-700">تاريخ إصدار التقرير: {new Date().toISOString().split('T')[0]}</p>
            <p className="text-[10px] text-rose-600 font-bold">الفترة: من {fromDate} إلى {toDate}</p>
          </div>
        </div>

        {/* --- 1. TAB: SALES & PURCHASES REPORT --- */}
        {activeReportTab === 'sales_purchases' && (
          <div className="space-y-6" id="report-sales-purchases-tab">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-gray-950 text-base font-sans">تقرير المبيعات والمشتريات التفصيلي</h3>
              <p className="text-xs text-gray-400 font-sans mt-0.5">يوضح العمليات المالية والمشتروات والمبيعات المعتمدة للفترة المحددة.</p>
            </div>

            {/* Quick stats for this report */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100/50 space-y-1 text-right">
                <span className="text-xs text-gray-400 block font-sans">إجمالي المبيعات بالفترة</span>
                <span className="text-xl font-black font-mono text-emerald-600">{totalSalesVal.toLocaleString('ar-SA')} ر.س</span>
                <span className="text-[10px] text-gray-400 block font-sans">عدد الفواتير: {filteredSales.length}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100/50 space-y-1 text-right">
                <span className="text-xs text-gray-400 block font-sans">إجمالي المشتريات بالفترة</span>
                <span className="text-xl font-black font-mono text-indigo-600">{totalPurchasesVal.toLocaleString('ar-SA')} ر.س</span>
                <span className="text-[10px] text-gray-400 block font-sans">عدد الفواتير: {filteredPurchases.length}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100/50 space-y-1 text-right">
                <span className="text-xs text-gray-400 block font-sans">صافي حركة التدفق (الفرق)</span>
                <span className={`text-xl font-black font-mono ${(totalSalesVal - totalPurchasesVal) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {(totalSalesVal - totalPurchasesVal).toLocaleString('ar-SA')} ر.س
                </span>
                <span className="text-[10px] text-gray-400 block font-sans">السيولة المتبادلة بالفترة</span>
              </div>
            </div>

            {/* Detailed Table: Sales بالفترة */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-gray-800 text-sm font-sans flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>فواتير المبيعات الصادرة في الفترة:</span>
              </h4>

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                {filteredSales.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs font-sans">لا توجد عمليات بيع في هذه الفترة.</div>
                ) : (
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold py-2.5 px-4">
                        <th className="py-2.5 px-4 font-sans">رقم الفاتورة</th>
                        <th className="py-2.5 px-4 font-sans">التاريخ</th>
                        <th className="py-2.5 px-4 font-sans">اسم العميل</th>
                        <th className="py-2.5 px-4 font-sans text-center">الخصومات</th>
                        <th className="py-2.5 px-4 font-sans text-left">قيمة الفاتورة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-700">
                      {filteredSales.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-4 font-mono font-bold">{s.invoiceNumber}</td>
                          <td className="py-2 px-4 font-mono text-gray-500">{s.date}</td>
                          <td className="py-2 px-4 font-bold font-sans">{s.customerName}</td>
                          <td className="py-2 px-4 text-center font-mono text-rose-500 font-semibold">{s.discount.toLocaleString('ar-SA')} ر.س</td>
                          <td className="py-2 px-4 text-left font-mono font-bold text-gray-900">{s.total.toLocaleString('ar-SA')} ر.س</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Detailed Table: Purchases بالفترة */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-gray-800 text-sm font-sans flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                <span>فواتير الشراء الواردة في الفترة:</span>
              </h4>

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                {filteredPurchases.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs font-sans">لا توجد عمليات شراء وتوريد في هذه الفترة.</div>
                ) : (
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold py-2.5 px-4">
                        <th className="py-2.5 px-4 font-sans">رقم الفاتورة</th>
                        <th className="py-2.5 px-4 font-sans">التاريخ</th>
                        <th className="py-2.5 px-4 font-sans">اسم المورد</th>
                        <th className="py-2.5 px-4 font-sans text-center">الخصم المكتسب</th>
                        <th className="py-2.5 px-4 font-sans text-left">التكلفة الإجمالية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-700">
                      {filteredPurchases.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-4 font-mono font-bold">{p.invoiceNumber}</td>
                          <td className="py-2 px-4 font-mono text-gray-500">{p.date}</td>
                          <td className="py-2 px-4 font-bold font-sans">{p.supplierName}</td>
                          <td className="py-2 px-4 text-center font-mono text-emerald-600 font-semibold">{p.discount.toLocaleString('ar-SA')} ر.s</td>
                          <td className="py-2 px-4 text-left font-mono font-bold text-gray-900">{p.total.toLocaleString('ar-SA')} ر.س</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- 2. TAB: PROFIT & LOSS REPORT --- */}
        {activeReportTab === 'profit_loss' && (
          <div className="space-y-6" id="report-profit-loss-tab">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-gray-950 text-base font-sans">تقرير الأرباح والخسائر التقديري (Profit & Loss)</h3>
              <p className="text-xs text-gray-400 font-sans mt-0.5">تحليل المبيعات الإجمالية والتكاليف الفعلية لتحديد صافي الربح المكتسب بالفترة المحددة.</p>
            </div>

            {/* Calculations layout */}
            <div className="max-w-xl mx-auto border border-gray-100 rounded-2xl overflow-hidden font-sans text-sm">
              <div className="bg-slate-50 p-4 font-bold text-gray-800 border-b border-gray-100 text-center font-sans">
                قائمة الدخل للفترة المحددة
              </div>
              <div className="p-6 space-y-4 divide-y divide-gray-50">
                
                {/* Revenue */}
                <div className="flex justify-between items-center pt-2">
                  <div className="space-y-0.5">
                    <span className="font-bold text-gray-800">إجمالي إيرادات المبيعات (قبل الخصومات):</span>
                    <span className="text-xs text-gray-400 block">مجموع المبيعات الفرعي للمواد المباعة</span>
                  </div>
                  <span className="font-mono font-bold text-gray-900">{profitAndLossData.revenue.toLocaleString('ar-SA')} ر.س</span>
                </div>

                {/* Discounts */}
                <div className="flex justify-between items-center pt-3 text-rose-600">
                  <div className="space-y-0.5">
                    <span>(-) إجمالي الخصومات الممنوحة للعملاء:</span>
                    <span className="text-xs text-rose-400 block">الخصومات المباشرة على الفواتير</span>
                  </div>
                  <span className="font-mono font-bold">-{profitAndLossData.totalDiscountGiven.toLocaleString('ar-SA')} ر.س</span>
                </div>

                {/* Net Sales */}
                <div className="flex justify-between items-center pt-3 font-bold text-gray-950">
                  <span>(=) صافي المبيعات للفترة:</span>
                  <span className="font-mono text-base">{profitAndLossData.netSales.toLocaleString('ar-SA')} ر.س</span>
                </div>

                {/* Cost of Goods Sold */}
                <div className="flex justify-between items-center pt-3 text-amber-700">
                  <div className="space-y-0.5">
                    <span>(-) تكلفة البضاعة المباعة (COGS):</span>
                    <span className="text-xs text-amber-500 block">تكلفة شراء هذه المواد على المؤسسة</span>
                  </div>
                  <span className="font-mono font-bold">-{profitAndLossData.costOfGoodsSold.toLocaleString('ar-SA')} ر.س</span>
                </div>

                {/* Gross Profit */}
                <div className="flex justify-between items-center pt-4 border-t-2 border-dashed border-gray-200">
                  <div className="space-y-0.5">
                    <span className="text-base font-extrabold text-emerald-700">(=) مجمل الربح الصافي التقديري:</span>
                    <span className="text-xs text-emerald-600 block">أرباح مبيعاتك المباشرة بعد خصم تكلفة المواد</span>
                  </div>
                  <span className="font-mono text-xl font-black text-emerald-600">
                    {profitAndLossData.grossProfit.toLocaleString('ar-SA')} ر.س
                  </span>
                </div>

                {/* Tax collected (liability) */}
                <div className="flex justify-between items-center pt-3 text-slate-500 text-xs">
                  <div className="space-y-0.5">
                    <span>مجموع الضريبة المحصلة (VAT 15%):</span>
                    <span className="text-[10px] text-slate-400 block">قيمة ضريبية تورد للجهات المختصة وليست ربحاً</span>
                  </div>
                  <span className="font-mono font-bold">{profitAndLossData.taxAmountCollected.toLocaleString('ar-SA')} ر.س</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- 3. TAB: STOCK ALERTS --- */}
        {activeReportTab === 'stock_alerts' && (
          <div className="space-y-6" id="report-stock-alerts-tab">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-gray-950 text-base font-sans">تقرير جرد المخزون وتنبيهات الكمية المنخفضة</h3>
              <p className="text-xs text-gray-400 font-sans mt-0.5">مراقبة جرد المستودعات ومعرفة الأصناف التي اقتربت كمياتها من حد الخطر لتجهيز طلبات شراء.</p>
            </div>

            {/* Stock stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100/50 space-y-1 text-right">
                <span className="text-xs text-gray-400 block font-sans">رأس المال المحتجز (بالشراء)</span>
                <span className="text-lg font-black font-mono text-gray-900">{totalInventoryCapital.toLocaleString('ar-SA')} ر.س</span>
                <span className="text-[10px] text-gray-400 block font-sans">القيمة الإجمالية للمخزون بسعر التكلفة</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100/50 space-y-1 text-right">
                <span className="text-xs text-gray-400 block font-sans">القيمة المتوقعة للمبيعات</span>
                <span className="text-lg font-black font-mono text-gray-900">{totalInventoryEstimatedSale.toLocaleString('ar-SA')} ر.س</span>
                <span className="text-[10px] text-gray-400 block font-sans">القيمة الإجمالية للمخزون بسعر البيع المعتمد</span>
              </div>
              <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 space-y-1 text-right">
                <span className="text-xs text-rose-500 block font-sans">الأصناف منخفضة المخزون</span>
                <span className="text-lg font-black font-mono text-rose-600">{lowStockProducts.length} أصناف</span>
                <span className="text-[10px] text-rose-400 block font-sans">أصناف تحتاج إعادة توريد فوراً</span>
              </div>
            </div>

            {/* Low stock table */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-800 text-sm font-sans flex items-center gap-1.5 text-rose-600">
                <AlertTriangle className="w-4 h-4" />
                <span>أصناف تخطت حد الأمان للمخزون (تحتاج لطلب توريد):</span>
              </h4>

              <div className="border border-rose-100 rounded-xl overflow-hidden">
                {lowStockProducts.length === 0 ? (
                  <div className="text-center py-8 text-emerald-700 bg-emerald-50/30 text-xs font-sans">
                    👍 ممتاز! جميع البضائع في المستودعات متوفرة بكميات فوق حد الأمان.
                  </div>
                ) : (
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-rose-50/40 border-b border-rose-100 text-rose-700 font-bold py-2.5 px-4">
                        <th className="py-2.5 px-4 font-sans">باركود المنتج</th>
                        <th className="py-2.5 px-4 font-sans">اسم المنتج</th>
                        <th className="py-2.5 px-4 font-sans">القسم</th>
                        <th className="py-2.5 px-4 font-sans text-center">الكمية المتاحة</th>
                        <th className="py-2.5 px-4 font-sans text-center">حد التنبيه</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-700">
                      {lowStockProducts.map(p => (
                        <tr key={p.id} className="hover:bg-rose-50/10">
                          <td className="py-2.5 px-4 font-mono font-medium text-gray-500">{p.code}</td>
                          <td className="py-2.5 px-4 font-bold font-sans text-rose-950">{p.name}</td>
                          <td className="py-2.5 px-4 font-sans text-xs">{p.category}</td>
                          <td className="py-2.5 px-4 text-center font-mono font-black text-rose-600 bg-rose-50/30">{p.quantity} قطعة</td>
                          <td className="py-2.5 px-4 text-center font-mono text-gray-400">{p.minQuantityAlert} قطعة</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- 4. TAB: CUSTOMER DEBTS & BEST CLIENTS --- */}
        {activeReportTab === 'customer_debts' && (
          <div className="space-y-6" id="report-debts-tab">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-gray-950 text-base font-sans">تقرير ديون العملاء والعملاء الأكثر شراءً</h3>
              <p className="text-xs text-gray-400 font-sans mt-0.5">تحليل مستحقات المنشأة على العملاء والعملاء الأكثر تعاملاً لشكرهم وتوطيد العلاقات.</p>
            </div>

            {/* Debt overall */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 space-y-1 text-right">
                <span className="text-xs text-amber-700 block font-sans">إجمالي مديونيات العملاء المطلوبة</span>
                <span className="text-xl font-black font-mono text-amber-600">
                  {customers.reduce((sum, c) => sum + c.balance, 0).toLocaleString('ar-SA')} ر.س
                </span>
                <span className="text-[10px] text-gray-400 block font-sans">أموال معلقة بالخارج لدى العملاء</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-1 text-right">
                <span className="text-xs text-gray-400 block font-sans">إجمالي تعاملات العملاء النشطة بالفترة</span>
                <span className="text-xl font-black font-mono text-gray-800">
                  {filteredSales.reduce((sum, s) => sum + s.total, 0).toLocaleString('ar-SA')} ر.س
                </span>
                <span className="text-[10px] text-gray-400 block font-sans">العملاء المسجلين: {customers.length}</span>
              </div>
            </div>

            {/* Customers table */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-800 text-sm font-sans flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-500" />
                <span>سجل أداء وتصنيف العملاء المالي:</span>
              </h4>

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold py-2.5 px-4">
                      <th className="py-2.5 px-4 font-sans">اسم العميل</th>
                      <th className="py-2.5 px-4 font-sans">الهاتف</th>
                      <th className="py-2.5 px-4 font-sans text-center">عدد مشترياته بالفترة</th>
                      <th className="py-2.5 px-4 font-sans text-left">قيمة المشتريات بالفترة</th>
                      <th className="py-2.5 px-4 font-sans text-left">المديونية المستحقة حالياً</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-700">
                    {customersReportList.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-bold font-sans text-gray-900">{c.name}</td>
                        <td className="py-2.5 px-4 font-mono text-gray-500">{c.phone}</td>
                        <td className="py-2.5 px-4 text-center font-mono text-gray-600">{c.countSalesInPeriod} عمليات بيع</td>
                        <td className="py-2.5 px-4 text-left font-mono font-bold text-gray-800">
                          {c.totalPurchasedInPeriod.toLocaleString('ar-SA')} ر.س
                        </td>
                        <td className="py-2.5 px-4 text-left font-mono">
                          <span className={`font-black ${c.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {c.balance.toLocaleString('ar-SA')} ر.س
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Print Copyright stamp in reports footer (Visible during print) */}
        <div className="hidden print:block mt-12 pt-6 border-t-2 border-gray-200 text-center text-xs text-gray-400 space-y-1">
          <p className="font-bold text-gray-700 font-sans">جميع الحقوق محفوظة © حسن موسى ٢٠٢٦</p>
          <p className="text-[10px]">تم استخراج التقرير آلياً عبر نظام إدارة المبيعات المتكامل</p>
        </div>
      </div>
    </div>
  );
}
