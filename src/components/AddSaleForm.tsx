"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string | null;
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
  const [products, setProducts] = useState<Product[]>([]);
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

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
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
      setSelectedProduct(null);
      setStep(1);
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, quantity, sku")
        .eq("is_active", true)
        .gt("quantity", 0)
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const calculateTotals = () => {
    if (!selectedProduct) return { total: 0, final: 0 };

    const total = selectedProduct.price * formData.quantity_sold;
    const final = total - formData.discount_amount;
    return { total, final };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setLoading(true);
    try {
      const { total, final } = calculateTotals();

      const saleData = {
        product_id: selectedProduct.id,
        customer_name: formData.customer_name || null,
        customer_email: formData.customer_email || null,
        customer_phone: formData.customer_phone || null,
        quantity_sold: formData.quantity_sold,
        unit_price: selectedProduct.price,
        total_amount: total,
        discount_amount: formData.discount_amount,
        final_amount: final,
        payment_method: formData.payment_method,
        payment_status: formData.payment_status,
        sale_date: new Date().toISOString(),
        notes: formData.notes || null,
      };

      const { error } = await supabase.from("sales").insert([saleData]);

      if (error) throw error;

      // Update product quantity
      const newQuantity = selectedProduct.quantity - formData.quantity_sold;
      await supabase
        .from("products")
        .update({ quantity: newQuantity })
        .eq("id", selectedProduct.id);

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error creating sale:", err);
      alert("Failed to create sale. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const { total, final } = calculateTotals();

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
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                1
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
                2
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
                3
              </div>
              <span className="text-sm font-medium">Payment</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Step 1: Product Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Product <span className="text-red-500">*</span>
                </label>
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
                            AED {product.price}
                          </p>
                          <div
                            className={`w-4 h-4 rounded-full border-2 ${
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
              </div>

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
                            parseInt(e.target.value) || 1
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
                    placeholder="+971 50 123 4567"
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
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  Order Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {selectedProduct?.name}
                    </span>
                    <span>AED {selectedProduct?.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity</span>
                    <span>{formData.quantity_sold}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>AED {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount</span>
                    <span>-AED {formData.discount_amount.toFixed(2)}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>AED {final.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Amount
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
                        discount_amount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="digital_wallet">Digital Wallet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { value: "completed", label: "Completed", color: "green" },
                    { value: "pending", label: "Pending", color: "yellow" },
                    { value: "failed", label: "Failed", color: "red" },
                    { value: "refunded", label: "Refunded", color: "gray" },
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
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Previous
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && !selectedProduct}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !selectedProduct}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  )}
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
