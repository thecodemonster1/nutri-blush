"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

interface AddProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddProductForm: React.FC<AddProductFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    category_id: "",
    price: "",
    cost_price: "",
    quantity: "",
    min_stock_level: "10",
    image_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Valid price is required";
    }

    if (!formData.quantity || parseInt(formData.quantity) < 0) {
      newErrors.quantity = "Valid quantity is required";
    }

    if (formData.cost_price && parseFloat(formData.cost_price) < 0) {
      newErrors.cost_price = "Cost price cannot be negative";
    }

    if (!formData.category_id) {
      newErrors.category_id = "Category is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateSKU = () => {
    const categoryPrefix = formData.category_id.slice(0, 3).toUpperCase();
    const randomSuffix = Math.random().toString(36).substr(2, 6).toUpperCase();
    const sku = `${categoryPrefix}${randomSuffix}`;
    setFormData((prev) => ({ ...prev, sku }));
  };

  const testConnection = async () => {
    try {
      setDebugInfo("Testing Supabase connection...");

      // Test basic connection
      const { data, error } = await supabase
        .from("products")
        .select("count", { count: "exact" });

      if (error) {
        setDebugInfo(`Connection failed: ${error.message}`);
        console.error("Connection test error:", error);
        return false;
      }

      setDebugInfo(
        `Connection successful! Found ${data?.length || 0} products.`
      );
      return true;
    } catch (err) {
      setDebugInfo(`Connection error: ${err}`);
      console.error("Connection test exception:", err);
      return false;
    }
  };

  const createSampleProduct = async () => {
    setLoading(true);
    setDebugInfo("Creating sample product...");

    try {
      const timestamp = Date.now();
      const sampleProduct = {
        name: `Test Product ${timestamp}`,
        description: "This is a test product created for debugging",
        sku: `TEST${timestamp}`,
        category_id: "skincare",
        price: 29.99,
        cost_price: 15.0,
        quantity: 100,
        min_stock_level: 10,
        image_url: null,
        is_active: true,
      };

      console.log("Creating sample product:", sampleProduct);

      const { data, error } = await supabase
        .from("products")
        .insert(sampleProduct)
        .select();

      if (error) {
        console.error("Sample product creation error:", error);
        setDebugInfo(`Error: ${error.message}`);
        alert(`❌ Failed to create sample product: ${error.message}`);
        return;
      }

      console.log("Sample product created:", data);
      setDebugInfo("Sample product created successfully!");
      alert("✅ Sample product created successfully!");
      onSuccess();
    } catch (err: any) {
      console.error("Sample product creation exception:", err);
      setDebugInfo(`Exception: ${err.message || err}`);
      alert(`❌ Exception creating sample product: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setDebugInfo("Form validation failed");
      return;
    }

    setLoading(true);
    setDebugInfo("Starting product creation...");

    try {
      // Test connection first
      const connectionOk = await testConnection();
      if (!connectionOk) {
        throw new Error("Database connection failed");
      }

      setDebugInfo("Preparing product data...");

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        sku: formData.sku.trim() || null,
        category_id: formData.category_id,
        price: parseFloat(formData.price),
        cost_price: formData.cost_price
          ? parseFloat(formData.cost_price)
          : null,
        quantity: parseInt(formData.quantity),
        min_stock_level: parseInt(formData.min_stock_level),
        image_url: formData.image_url.trim() || null,
        is_active: true,
      };

      console.log("Product data to insert:", productData);
      setDebugInfo("Inserting product into database...");

      const { data, error } = await supabase
        .from("products")
        .insert(productData)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        setDebugInfo(`Database error: ${error.message}`);
        throw error;
      }

      console.log("Product created successfully:", data);
      setDebugInfo("Product created successfully!");

      // Reset form
      setFormData({
        name: "",
        description: "",
        sku: "",
        category_id: "",
        price: "",
        cost_price: "",
        quantity: "",
        min_stock_level: "10",
        image_url: "",
      });

      alert("✅ Product created successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error creating product:", err);

      let errorMessage = "Failed to create product. ";

      if (err?.code === "23505") {
        errorMessage += "A product with this SKU already exists.";
      } else if (err?.code === "42501") {
        errorMessage +=
          "Permission denied. Please check your database policies.";
      } else if (err?.message?.includes("duplicate key")) {
        errorMessage += "A product with this SKU already exists.";
      } else if (err?.message?.includes("permission")) {
        errorMessage += "Permission denied. Check your database access.";
      } else if (err?.message?.includes("connection")) {
        errorMessage += "Database connection failed.";
      } else if (err?.message) {
        errorMessage += err.message;
      } else {
        errorMessage += "Please check your connection and try again.";
      }

      setDebugInfo(`Error: ${errorMessage}`);
      alert("❌ " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Reset form when modal opens
  if (isOpen && !loading) {
    // Only reset if form is empty (to avoid resetting while user is typing)
    const isFormEmpty =
      !formData.name && !formData.description && !formData.sku;
    if (isFormEmpty && debugInfo) {
      setDebugInfo("");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Add New Product
              </h2>
              <p className="text-sm text-gray-500">
                Create a new product for your inventory
              </p>
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

        {/* Debug Info */}
        {debugInfo && (
          <div className="mx-6 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Status:</strong> {debugInfo}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Test Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-900 mb-3">
              🔧 Quick Test & Debug
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={testConnection}
                disabled={loading}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
              >
                Test Connection
              </button>
              <button
                type="button"
                onClick={createSampleProduct}
                disabled={loading}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                Create Sample Product
              </button>
              <button
                type="button"
                onClick={() => setDebugInfo("")}
                className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
              >
                Clear Debug
              </button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                1
              </span>
              <span>Basic Information</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter product name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your product..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU (Stock Keeping Unit)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sku: e.target.value }))
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., SKC001"
                  />
                  <button
                    type="button"
                    onClick={generateSKU}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Generate SKU"
                  >
                    🎲
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category_id: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.category_id}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-sm font-medium text-green-600">
                2
              </span>
              <span>Pricing</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selling Price (LKR) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">
                    LKR
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                    className={`w-full pl-12 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.price ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="0.00"
                  />
                </div>
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Price (LKR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">
                    LKR
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        cost_price: e.target.value,
                      }))
                    }
                    className={`w-full pl-12 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.cost_price ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="0.00"
                  />
                </div>
                {errors.cost_price && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.cost_price}
                  </p>
                )}
              </div>
            </div>

            {/* Profit Margin Display */}
            {formData.price && formData.cost_price && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-700">
                    Profit Margin:
                  </span>
                  <span className="text-sm font-semibold text-green-800">
                    LKR{" "}
                    {(
                      parseFloat(formData.price) -
                      parseFloat(formData.cost_price)
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    (
                    {(
                      ((parseFloat(formData.price) -
                        parseFloat(formData.cost_price)) /
                        parseFloat(formData.price)) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Inventory */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-sm font-medium text-purple-600">
                3
              </span>
              <span>Inventory</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.quantity ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="0"
                />
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Stock Level
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.min_stock_level}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      min_stock_level: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="10"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Alert when stock falls below this level
                </p>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <span className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-sm font-medium text-yellow-600">
                4
              </span>
              <span>Product Image</span>
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    image_url: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/product-image.jpg"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional: Add a link to your product image
              </p>
            </div>

            {formData.image_url && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Image Preview:
                </p>
                <img
                  src={formData.image_url}
                  alt="Product preview"
                  className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              )}
              <span>{loading ? "Creating..." : "Create Product"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductForm;
