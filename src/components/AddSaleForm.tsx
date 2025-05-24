"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string | null;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface AddSaleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddSaleForm: React.FC<AddSaleFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    quantity_sold: 1,
    discount_amount: 0,
    payment_method: "cash",
    payment_status: "completed",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      // Reset form when opening
      setFormData({
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        quantity_sold: 1,
        discount_amount: 0,
        payment_method: "cash",
        payment_status: "completed",
        notes: "",
      });
      setSelectedCategory(null);
      setSelectedProduct(null);
      setProducts([]);
      setStep(1);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, description")
        .eq("is_active", true) // ✅ Only shows active categories
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchProductsByCategory = async (categoryId: string) => {
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, quantity, sku, category_id")
        .eq("is_active", true)
        .eq("category_id", categoryId)
        .gt("quantity", 0)
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setSelectedProduct(null); // Reset selected product when category changes
    fetchProductsByCategory(category.id);
  };

  const calculateTotals = () => {
    if (!selectedProduct) return { subtotal: 0, tax: 0, total: 0, final: 0 };

    const subtotal = selectedProduct.price * formData.quantity_sold;
    const tax = formData.payment_method === "card" ? subtotal * 0.03 : 0; // 3% tax for card payments
    const total = subtotal + tax;
    const final = total - formData.discount_amount;

    return { subtotal, tax, total, final };
  };

  // Prevent form submission on Enter key or automatic submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    return false;
  };

  // Manual sale completion function
  const handleCompleteSale = async () => {
    if (!selectedProduct || isProcessing) return;

    const { subtotal, tax, total, final } = calculateTotals();

    // Show detailed confirmation
    const taxInfo =
      formData.payment_method === "card"
        ? `\nCard Processing Fee (3%): LKR ${tax.toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}`
        : "";

    const confirmMessage = `
🛒 CONFIRM SALE TRANSACTION

Category: ${selectedCategory?.name}
Product: ${selectedProduct.name}
Quantity: ${formData.quantity_sold} units
Unit Price: LKR ${selectedProduct.price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
    })}
Subtotal: LKR ${subtotal.toLocaleString("en-US", {
      minimumFractionDigits: 2,
    })}${taxInfo}
Discount: -LKR ${formData.discount_amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
    })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL TOTAL: LKR ${final.toLocaleString("en-US", { minimumFractionDigits: 2 })}

Payment Method: ${formData.payment_method.toUpperCase()}
Payment Status: ${formData.payment_status.toUpperCase()}

⚠️ This will update your inventory.
Remaining stock will be: ${
      selectedProduct.quantity - formData.quantity_sold
    } units

Do you want to complete this sale?
    `;

    if (!window.confirm(confirmMessage.trim())) {
      return;
    }

    setIsProcessing(true);
    setLoading(true);

    try {
      const saleData = {
        product_id: selectedProduct.id,
        customer_name: formData.customer_name || null,
        customer_email: formData.customer_email || null,
        customer_phone: formData.customer_phone || null,
        quantity_sold: formData.quantity_sold,
        unit_price: selectedProduct.price,
        subtotal_amount: subtotal,
        tax_amount: tax,
        total_amount: total,
        discount_amount: formData.discount_amount,
        final_amount: final,
        payment_method: formData.payment_method,
        payment_status: formData.payment_status,
        sale_date: new Date().toISOString(),
        notes: formData.notes || null,
      };

      const { error: saleError } = await supabase
        .from("sales")
        .insert([saleData]);

      if (saleError) {
        throw saleError;
      }

      // Update product quantity
      const newQuantity = selectedProduct.quantity - formData.quantity_sold;

      const { error: updateError } = await supabase
        .from("products")
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedProduct.id);

      if (updateError) {
        throw updateError;
      }

      // Success message with receipt-like format
      const taxLine =
        tax > 0
          ? `Card Processing Fee (3%): LKR ${tax.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}\n`
          : "";

      const successMessage = `
✅ SALE COMPLETED SUCCESSFULLY!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 TRANSACTION SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Category: ${selectedCategory?.name}
Product: ${selectedProduct.name}
Quantity: ${formData.quantity_sold} units
Unit Price: LKR ${selectedProduct.price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
      })}
Subtotal: LKR ${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
${taxLine}Discount: LKR ${formData.discount_amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
      })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL PAID: LKR ${final.toLocaleString("en-US", { minimumFractionDigits: 2 })}

Payment: ${formData.payment_method.toUpperCase()} - ${formData.payment_status.toUpperCase()}
Remaining Stock: ${newQuantity} units

Thank you for your business! 🎉
      `;

      alert(successMessage.trim());

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error completing sale:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      alert(
        `❌ SALE FAILED\n\nError: ${errorMessage}\n\nPlease try again or contact support.`
      );
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const validateCurrentStep = () => {
    switch (step) {
      case 1:
        return (
          selectedCategory !== null &&
          selectedProduct !== null &&
          formData.quantity_sold > 0
        );
      case 2:
        return true; // Customer info is optional
      case 3:
        return formData.payment_method && formData.payment_status;
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  const { subtotal, tax, total, final } = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                New Sale Transaction
              </h2>
              <p className="text-sm text-gray-500">Step {step} of 3</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center space-x-2 ${
                step >= 1 ? "text-green-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1 ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                {step > 1 ? "✓" : "1"}
              </div>
              <span className="text-sm font-medium">Product</span>
            </div>
            <div
              className={`flex-1 h-1 rounded ${
                step >= 2 ? "bg-green-200" : "bg-gray-200"
              }`}
            ></div>
            <div
              className={`flex items-center space-x-2 ${
                step >= 2 ? "text-green-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2 ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                {step > 2 ? "✓" : "2"}
              </div>
              <span className="text-sm font-medium">Customer</span>
            </div>
            <div
              className={`flex-1 h-1 rounded ${
                step >= 3 ? "bg-green-200" : "bg-gray-200"
              }`}
            ></div>
            <div
              className={`flex items-center space-x-2 ${
                step >= 3 ? "text-green-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 3 ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                {isProcessing ? "⏳" : "3"}
              </div>
              <span className="text-sm font-medium">Payment</span>
            </div>
          </div>
        </div>

        {/* Form - Prevent automatic submission */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
          {/* Step 1: Category & Product Selection */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Category <span className="text-red-500">*</span>
                </label>
                {categories.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">📂</div>
                    <p className="text-gray-500">No categories available</p>
                    <button
                      type="button"
                      onClick={fetchCategories}
                      className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                      Refresh Categories
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-40 overflow-y-auto">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleCategorySelect(category)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          selectedCategory?.id === category.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              selectedCategory?.id === category.id
                                ? "bg-blue-500"
                                : "bg-gray-300"
                            }`}
                          ></div>
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm">
                              {category.name}
                            </h4>
                            {category.description && (
                              <p className="text-xs text-gray-500 truncate">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Selection */}
              {selectedCategory && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Product from "{selectedCategory.name}"{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  {loadingProducts ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
                      <p className="text-gray-500">Loading products...</p>
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <div className="text-gray-400 mb-2">📦</div>
                      <p className="text-gray-500">
                        No products available in this category
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedCategory(null)}
                        className="mt-2 text-blue-600 hover:text-blue-800"
                      >
                        Choose Different Category
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-3 max-h-60 overflow-y-auto">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => setSelectedProduct(product)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedProduct?.id === product.id
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">
                                {product.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                SKU: {product.sku || "N/A"}
                              </p>
                              <p className="text-sm text-gray-500">
                                Stock: {product.quantity} units
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-gray-900">
                                LKR{" "}
                                {product.price.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                })}
                              </p>
                              <div
                                className={`w-4 h-4 rounded-full border-2 mx-auto ${
                                  selectedProduct?.id === product.id
                                    ? "border-green-500 bg-green-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {selectedProduct?.id === product.id && (
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Quantity Selection */}
              {selectedProduct && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          quantity_sold: Math.max(1, prev.quantity_sold - 1),
                        }))
                      }
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M20 12H4"
                        />
                      </svg>
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={selectedProduct.quantity}
                      value={formData.quantity_sold}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          quantity_sold: Math.max(
                            1,
                            Math.min(
                              selectedProduct.quantity,
                              parseInt(e.target.value) || 1
                            )
                          ),
                        }))
                      }
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          quantity_sold: Math.min(
                            selectedProduct.quantity,
                            prev.quantity_sold + 1
                          ),
                        }))
                      }
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </button>
                    <span className="text-sm text-gray-500">
                      Available: {selectedProduct.quantity}
                    </span>
                  </div>

                  {/* Selection Summary */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Selection Summary
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Category:</span>
                        <span className="font-medium text-blue-900">
                          {selectedCategory?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Product:</span>
                        <span className="font-medium text-blue-900">
                          {selectedProduct.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Quantity:</span>
                        <span className="font-medium text-blue-900">
                          {formData.quantity_sold} units
                        </span>
                      </div>
                      <hr className="border-blue-200 my-2" />
                      <div className="flex justify-between text-base">
                        <span className="font-medium text-blue-700">
                          Subtotal:
                        </span>
                        <span className="font-semibold text-blue-900">
                          LKR{" "}
                          {(
                            selectedProduct.price * formData.quantity_sold
                          ).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Customer Information */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customer_name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter customer name (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customer_phone: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="+94 70 123 4567"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      customer_email: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="customer@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Additional notes about this sale..."
                />
              </div>
            </div>
          )}

          {/* Step 3: Payment & Summary */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Order Summary with Tax */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Order Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category</span>
                    <span className="font-medium">
                      {selectedCategory?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Product</span>
                    <span className="font-medium">{selectedProduct?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit Price</span>
                    <span>
                      LKR{" "}
                      {selectedProduct?.price.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity</span>
                    <span>{formData.quantity_sold} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>
                      LKR{" "}
                      {subtotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {/* Tax line (only for card payments) */}
                  {formData.payment_method === "card" && (
                    <div className="flex justify-between text-orange-600">
                      <span className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                        Card Processing Fee (3%)
                      </span>
                      <span>
                        +LKR{" "}
                        {tax.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount</span>
                    <span>
                      -LKR{" "}
                      {formData.discount_amount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>FINAL TOTAL</span>
                    <span className="text-green-600">
                      LKR{" "}
                      {final.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Amount (LKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={total}
                    step="0.01"
                    value={formData.discount_amount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        discount_amount: Math.min(
                          total,
                          parseFloat(e.target.value) || 0
                        ),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        payment_method: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="cash">💵 Cash</option>
                    <option value="card">💳 Card (+3% fee)</option>
                    <option value="bank_transfer">🏦 Bank Transfer</option>
                    <option value="digital_wallet">📱 Digital Wallet</option>
                  </select>
                </div>
              </div>

              {/* Tax Notice for Card Payments */}
              {formData.payment_method === "card" && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-orange-600 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <span className="text-sm text-orange-800">
                      <strong>Card Payment Notice:</strong> A 3% processing fee
                      of LKR{" "}
                      {tax.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      will be added to your total.
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    {
                      value: "completed",
                      label: "✅ Completed",
                      color: "green",
                    },
                    { value: "pending", label: "⏳ Pending", color: "yellow" },
                    { value: "failed", label: "❌ Failed", color: "red" },
                    { value: "refunded", label: "↩️ Refunded", color: "gray" },
                  ].map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          payment_status: status.value,
                        }))
                      }
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        formData.payment_status === status.value
                          ? `border-${status.color}-500 bg-${status.color}-50 text-${status.color}-700`
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex space-x-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  disabled={isProcessing}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  ← Previous
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={!validateCurrentStep()}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCompleteSale}
                  disabled={
                    loading ||
                    !selectedProduct ||
                    isProcessing ||
                    !validateCurrentStep()
                  }
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  )}
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>{loading ? "Processing..." : "Complete Sale"}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSaleForm;
