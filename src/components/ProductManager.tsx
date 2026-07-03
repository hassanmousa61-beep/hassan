import React, { useState, useRef, useMemo } from 'react';
import { Product } from '../types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  AlertCircle, 
  X, 
  Sparkles,
  RefreshCw,
  Layers,
  FileDown
} from 'lucide-react';
import { 
  exportProductsToExcel, 
  importProductsFromExcel, 
  downloadProductsTemplate 
} from '../excelUtils';

interface ProductManagerProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onBulkAddProducts: (products: Product[]) => void;
}

export default function ProductManager({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBulkAddProducts
}: ProductManagerProps) {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [stockStatus, setStockStatus] = useState('الكل'); // الكل، منخفض، متوفر

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [minQuantityAlert, setMinQuantityAlert] = useState('5');
  const [description, setDescription] = useState('');

  // Import Excel Section states
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Unique categories list for filters
  const categoriesList = useMemo(() => {
    const list = new Set(products.map(p => p.category));
    return ['الكل', ...Array.from(list)];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'الكل' || p.category === selectedCategory;
      
      let matchesStock = true;
      if (stockStatus === 'منخفض') {
        matchesStock = p.quantity <= p.minQuantityAlert;
      } else if (stockStatus === 'متوفر') {
        matchesStock = p.quantity > p.minQuantityAlert;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, selectedCategory, stockStatus]);

  // Open modal for adding
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setCode(`PRD-${1000 + products.length + 1}`);
    setCategory('إلكترونيات');
    setPurchasePrice('');
    setSalePrice('');
    setQuantity('');
    setMinQuantityAlert('5');
    setDescription('');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setCode(product.code);
    setCategory(product.category);
    setPurchasePrice(product.purchasePrice.toString());
    setSalePrice(product.salePrice.toString());
    setQuantity(product.quantity.toString());
    setMinQuantityAlert(product.minQuantityAlert.toString());
    setDescription(product.description || '');
    setIsModalOpen(true);
  };

  // Submit product form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !category) {
      alert('الرجاء إدخال الحقول المطلوبة الأساسية (الاسم، الكود، القسم)');
      return;
    }

    const pricePurchaseNum = parseFloat(purchasePrice) || 0;
    const priceSaleNum = parseFloat(salePrice) || 0;
    const qtyNum = parseInt(quantity, 10) || 0;
    const minAlertNum = parseInt(minQuantityAlert, 10) || 0;

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        name,
        code,
        category,
        purchasePrice: pricePurchaseNum,
        salePrice: priceSaleNum,
        quantity: qtyNum,
        minQuantityAlert: minAlertNum,
        description
      });
    } else {
      const newProduct: Product = {
        id: `p-${Date.now()}`,
        name,
        code,
        category,
        purchasePrice: pricePurchaseNum,
        salePrice: priceSaleNum,
        quantity: qtyNum,
        minQuantityAlert: minAlertNum,
        description
      };
      onAddProduct(newProduct);
    }

    setIsModalOpen(false);
  };

  // Handle Drag-and-Drop file uploads
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
      const parsed = await importProductsFromExcel(file);
      
      if (parsed.length === 0) {
        setImportStatus({ success: false, message: 'ملف الإكسل فارغ أو يحتوي على بيانات غير صالحة.' });
        return;
      }

      // convert Partial to Product
      const validated: Product[] = parsed.map((item, index) => ({
        id: `p-import-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
        name: item.name || 'منتج مستورد',
        code: item.code || `PRD-AUTO-${index}`,
        category: item.category || 'عام',
        purchasePrice: item.purchasePrice || 0,
        salePrice: item.salePrice || 0,
        quantity: item.quantity || 0,
        minQuantityAlert: item.minQuantityAlert || 5,
        description: item.description || ''
      }));

      onBulkAddProducts(validated);
      setImportStatus({ success: true, message: `تم استيراد ${validated.length} منتج بنجاح إلى قاعدة البيانات!` });
    } catch (err) {
      console.error(err);
      setImportStatus({ success: false, message: 'فشل قراءة الملف. يرجى استخدام النموذج المرفق وتعبئته بالشكل الصحيح.' });
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImportFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6" id="product-manager-root">
      {/* Header and top tools */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-3xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-sans flex items-center gap-2">
            <Layers className="w-5 h-5 text-rose-500" />
            <span>كتالوج وإدارة المنتجات والمخزون</span>
          </h1>
          <p className="text-sm text-gray-500 font-sans mt-0.5">
            تتبع مخزون البضائع، إضافة أصناف جديدة، أو الاستيراد والتصدير الجماعي من خلال ملفات Excel.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            id="open-add-product-btn"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>منتج جديد</span>
          </button>
          
          <button
            id="toggle-import-panel-btn"
            onClick={() => setIsImporting(!isImporting)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
              isImporting 
                ? 'bg-rose-50 border-rose-200 text-rose-700' 
                : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>استيراد إكسل</span>
          </button>

          <button
            id="export-products-excel-btn"
            onClick={() => exportProductsToExcel(products)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير المخزون</span>
          </button>
        </div>
      </div>

      {/* Import Panel with Drag & Drop */}
      {isImporting && (
        <div className="bg-white p-6 rounded-2xl border border-dashed border-gray-200 shadow-2xs space-y-4" id="import-excel-panel">
          <div className="flex justify-between items-center pb-2 border-b border-gray-50">
            <h3 className="font-bold text-gray-800 text-base font-sans">استيراد المنتجات الجماعي من Excel</h3>
            <button 
              onClick={() => { setIsImporting(false); setImportStatus(null); }}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-gray-500 font-sans leading-relaxed">
            يمكنك استيراد مئات المنتجات دفعة واحدة! يرجى تحميل نموذج ملف الإكسل المعتمد وتعبئته بالمنتجات ثم رفعه هنا لتفادي الأخطاء.
          </p>

          <div className="flex flex-wrap gap-3 pb-2">
            <button
              onClick={downloadProductsTemplate}
              className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-md hover:bg-rose-100 transition-colors font-sans cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>تحميل نموذج المنتجات (.xlsx)</span>
            </button>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
              dragActive 
                ? 'border-rose-500 bg-rose-50/50' 
                : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleFileChange}
            />
            <FileSpreadsheet className={`w-12 h-12 mb-3 ${dragActive ? 'text-rose-500' : 'text-gray-400'}`} />
            <p className="text-sm font-semibold text-gray-700 font-sans text-center">
              اسحب وأفلت ملف الإكسل (.xlsx) هنا أو انقر للتصفح من جهازك
            </p>
            <p className="text-xs text-gray-400 font-sans mt-1 text-center">
              يدعم ملفات .xlsx و .xls فقط
            </p>
          </div>

          {importStatus && (
            <div className={`p-4 rounded-xl flex items-start gap-3 ${importStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}`}>
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs font-sans leading-relaxed">
                {importStatus.message}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-3xs flex flex-col sm:flex-row gap-3 items-center justify-between" id="product-filters-bar">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
          <input
            id="product-search-input"
            type="text"
            placeholder="ابحث بالاسم أو الباركود..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm font-sans"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-sans shrink-0">التصنيف:</span>
            <select
              id="category-filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg text-xs px-2.5 py-1.5 focus:outline-hidden text-gray-700"
            >
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Stock Level Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-sans shrink-0">المخزن:</span>
            <select
              id="stock-filter-select"
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg text-xs px-2.5 py-1.5 focus:outline-hidden text-gray-700"
            >
              <option value="الكل">الكل</option>
              <option value="متوفر">المتوفر بأمان</option>
              <option value="منخفض">المخزون المنخفض (تنبيه)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-3xs overflow-hidden" id="products-table-card">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-gray-400 font-sans flex flex-col items-center justify-center gap-3">
            <AlertCircle className="w-10 h-10 text-gray-300" />
            <div>لا توجد منتجات تطابق معايير البحث والفلترة المحددة.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-500 text-xs font-semibold">
                  <th className="py-4.5 px-6 font-sans">الباركود</th>
                  <th className="py-4.5 px-6 font-sans">اسم المنتج</th>
                  <th className="py-4.5 px-6 font-sans">القسم</th>
                  <th className="py-4.5 px-6 font-sans text-left">سعر الشراء</th>
                  <th className="py-4.5 px-6 font-sans text-left">سعر البيع</th>
                  <th className="py-4.5 px-6 font-sans text-center">الكمية</th>
                  <th className="py-4.5 px-6 font-sans text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredProducts.map(p => {
                  const isLow = p.quantity <= p.minQuantityAlert;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 font-mono font-medium text-gray-500 text-xs">{p.code}</td>
                      <td className="py-4 px-6 font-semibold text-gray-800 font-sans">
                        <div>
                          <span>{p.name}</span>
                          {p.description && (
                            <span className="block text-[11px] font-normal text-gray-400 mt-0.5 max-w-md truncate">{p.description}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs font-sans">
                        <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full">{p.category}</span>
                      </td>
                      <td className="py-4 px-6 text-left font-mono font-semibold text-gray-700">
                        {p.purchasePrice.toLocaleString('ar-SA')} ر.س
                      </td>
                      <td className="py-4 px-6 text-left font-mono font-bold text-gray-900">
                        {p.salePrice.toLocaleString('ar-SA')} ر.س
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2.5 py-1 rounded-full font-bold font-mono text-xs inline-block ${
                          isLow 
                            ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {p.quantity} (حدّ {p.minQuantityAlert})
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            title="تعديل المنتج"
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            title="حذف المنتج"
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف المنتج: ${p.name}؟`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 bg-gray-50 hover:bg-rose-50 text-gray-600 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="product-modal">
          <div className="bg-white rounded-2xl border border-gray-100 max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-center bg-gray-50/50 p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg font-sans">
                {editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-700 font-sans block">اسم المنتج *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: شاشة سامسونج 27 بوصة"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                {/* SKU / Code */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 font-sans block">الباركود / الكود *</label>
                  <input
                    type="text"
                    required
                    placeholder="PRD-1001"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono"
                  />
                </div>

                {/* Category Selection or Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 font-sans block">التصنيف / القسم *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: إلكترونيات، إكسسوارات"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                {/* Purchase Price */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 font-sans block">سعر الشراء (ريال) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono text-left"
                  />
                </div>

                {/* Sale Price */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 font-sans block">سعر البيع (ريال) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono text-left"
                  />
                </div>

                {/* Initial Quantity */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 font-sans block">الكمية الحالية المتوفرة *</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono"
                  />
                </div>

                {/* Alert Threshold */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 font-sans block">حد التنبيه للكمية المنخفضة *</label>
                  <input
                    type="number"
                    required
                    placeholder="5"
                    value={minQuantityAlert}
                    onChange={(e) => setMinQuantityAlert(e.target.value)}
                    className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-700 font-sans block">وصف أو ملاحظات إضافية</label>
                  <textarea
                    rows={2}
                    placeholder="اكتب وصفاً مختصراً للمنتج ومواصفاته..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
