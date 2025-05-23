"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function TestDatabasePage() {
  const [connectionStatus, setConnectionStatus] = useState("Testing...");
  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase.from("products").select("count");
      if (error) {
        setConnectionStatus(`Error: ${error.message}`);
      } else {
        setConnectionStatus("✅ Connected to Supabase!");
        fetchAllData();
      }
    } catch (err) {
      setConnectionStatus(`❌ Connection failed: ${err}`);
    }
  };

  const fetchAllData = async () => {
    try {
      // Fetch products
      const { data: productsData } = await supabase
        .from("products")
        .select("*")
        .limit(10);

      // Fetch sales
      const { data: salesData } = await supabase
        .from("sales")
        .select("*")
        .limit(10);

      setProducts(productsData || []);
      setSales(salesData || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const addTestProduct = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .insert([
          {
            name: `Test Product ${Date.now()}`,
            description: "This is a test product",
            category: "skincare",
            price: 29.99,
            cost_price: 15.0,
            quantity: 100,
            min_stock_level: 10,
            sku: `TEST${Date.now()}`,
          },
        ])
        .select();

      if (error) {
        alert(`Error: ${error.message}`);
      } else {
        alert("✅ Test product added successfully!");
        fetchAllData();
      }
    } catch (err) {
      alert(`❌ Failed to add product: ${err}`);
    }
    setLoading(false);
  };

  const addTestSale = async () => {
    if (products.length === 0) {
      alert("Please add a product first!");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sales")
        .insert([
          {
            product_id: products[0].id,
            customer_name: "Test Customer",
            customer_email: "test@example.com",
            quantity_sold: 2,
            unit_price: 29.99,
            total_amount: 59.98,
            discount_amount: 0,
            payment_method: "card",
            payment_status: "completed",
          },
        ])
        .select();

      if (error) {
        alert(`Error: ${error.message}`);
      } else {
        alert("✅ Test sale added successfully!");
        fetchAllData();
      }
    } catch (err) {
      alert(`❌ Failed to add sale: ${err}`);
    }
    setLoading(false);
  };

  const clearAllData = async () => {
    if (!confirm("Are you sure you want to clear all test data?")) return;

    setLoading(true);
    try {
      await supabase.from("sales").delete().neq("id", "");
      await supabase.from("products").delete().neq("id", "");
      alert("✅ All data cleared!");
      fetchAllData();
    } catch (err) {
      alert(`❌ Failed to clear data: ${err}`);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Database Test Page
        </h1>

        {/* Connection Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
          <p
            className={`text-sm ${
              connectionStatus.includes("✅")
                ? "text-green-600"
                : connectionStatus.includes("❌")
                ? "text-red-600"
                : "text-yellow-600"
            }`}
          >
            {connectionStatus}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-4">
          <button
            onClick={addTestProduct}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Test Product"}
          </button>
          <button
            onClick={addTestSale}
            disabled={loading || products.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Test Sale"}
          </button>
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            Refresh Data
          </button>
          <button
            onClick={clearAllData}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            Clear All Data
          </button>
        </div>

        {/* Products Table */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Products ({products.length})
          </h2>
          {products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Quantity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                        {product.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        AED {product.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {product.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No products found. Add some test data!
            </p>
          )}
        </div>

        {/* Sales Table */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Sales ({sales.length})</h2>
          {sales.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Product ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                        {sale.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                        {sale.product_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {sale.customer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        AED {sale.final_amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {sale.payment_status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No sales found. Add some test data!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
