"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import SalesReport from "../../components/SalesReport";
import AddSaleForm from "../../components/AddSaleForm";

interface Sale {
  id: string;
  product_id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  quantity_sold: number;
  unit_price: number;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: string;
  payment_status: string;
  sale_date: string;
  notes: string | null;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
}

interface SaleWithProduct extends Sale {
  products?: Product;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddSaleForm, setShowAddSaleForm] = useState(false);

  useEffect(() => {
    fetchSales();
  }, [dateRange, paymentFilter, statusFilter]);

  const fetchSales = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("sales")
        .select(
          `
          *,
          products (
            id,
            name
          )
        `
        )
        .order("sale_date", { ascending: false });

      // Apply date filter
      if (dateRange !== "all") {
        const now = new Date();
        let startDate = new Date();

        switch (dateRange) {
          case "today":
            startDate.setHours(0, 0, 0, 0);
            break;
          case "week":
            startDate.setDate(now.getDate() - 7);
            break;
          case "month":
            startDate.setMonth(now.getMonth() - 1);
            break;
          case "quarter":
            startDate.setMonth(now.getMonth() - 3);
            break;
        }

        query = query.gte("sale_date", startDate.toISOString());
      }

      // Apply payment method filter
      if (paymentFilter !== "all") {
        query = query.eq("payment_method", paymentFilter);
      }

      // Apply status filter
      if (statusFilter !== "all") {
        query = query.eq("payment_status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match Sale interface
      const transformedData: Sale[] = (data || []).map(
        (sale: SaleWithProduct) => ({
          id: sale.id,
          product_id: sale.product_id,
          customer_name: sale.customer_name,
          customer_email: sale.customer_email,
          customer_phone: sale.customer_phone,
          quantity_sold: sale.quantity_sold,
          unit_price: sale.unit_price,
          total_amount: sale.total_amount,
          discount_amount: sale.discount_amount,
          final_amount: sale.final_amount,
          payment_method: sale.payment_method,
          payment_status: sale.payment_status,
          sale_date: sale.sale_date,
          notes: sale.notes,
          created_at: sale.created_at,
        })
      );

      setSales(transformedData);
    } catch (err) {
      console.error("Error fetching sales:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");

      // Set fallback mock data
      setSales([
        {
          id: "SAL000001",
          product_id: "SKC001",
          customer_name: "Sarah Ahmed",
          customer_email: "sarah@email.com",
          customer_phone: "+971501234567",
          quantity_sold: 2,
          unit_price: 29.99,
          total_amount: 59.98,
          discount_amount: 0,
          final_amount: 59.98,
          payment_method: "card",
          payment_status: "completed",
          sale_date: new Date().toISOString(),
          notes: null,
          created_at: new Date().toISOString(),
        },
        {
          id: "SAL000002",
          product_id: "SKC002",
          customer_name: "Fatima Al-Zahra",
          customer_email: "fatima@email.com",
          customer_phone: "+971507654321",
          quantity_sold: 1,
          unit_price: 19.99,
          total_amount: 19.99,
          discount_amount: 2.0,
          final_amount: 17.99,
          payment_method: "cash",
          payment_status: "completed",
          sale_date: new Date(Date.now() - 86400000).toISOString(),
          notes: "Customer requested gift wrapping",
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Create CSV data
    const csvHeaders = [
      "Sale ID",
      "Product ID",
      "Customer Name",
      "Customer Email",
      "Quantity",
      "Unit Price",
      "Total Amount",
      "Discount",
      "Final Amount",
      "Payment Method",
      "Status",
      "Date",
      "Notes",
    ];

    const csvData = sales.map((sale) => [
      sale.id,
      sale.product_id,
      sale.customer_name || "",
      sale.customer_email || "",
      sale.quantity_sold,
      sale.unit_price,
      sale.total_amount,
      sale.discount_amount,
      sale.final_amount,
      sale.payment_method,
      sale.payment_status,
      new Date(sale.sale_date).toLocaleDateString(),
      sale.notes || "",
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-report-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Sales Reports
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Track sales performance, analyze revenue, and manage
                transactions.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export CSV
              </button>
              <button
                onClick={() => setShowAddSaleForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  className="w-4 h-4 mr-2"
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
                New Sale
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="dateRange"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date Range
              </label>
              <select
                id="dateRange"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last 3 Months</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="paymentFilter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Payment Method
              </label>
              <select
                id="paymentFilter"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="digital_wallet">Digital Wallet</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="statusFilter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Payment Status
              </label>
              <select
                id="statusFilter"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={fetchSales}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="text-center">
              <div
                className="animate-spin inline-block w-8 h-8 border-4 border-solid border-current border-r-transparent align-[-0.125em] text-blue-600 motion-reduce:animate-[spin_1.5s_linear_infinite]"
                role="status"
              >
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                  Loading...
                </span>
              </div>
              <p className="mt-4 text-gray-600">Loading sales data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L5.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Error loading sales data
              </h3>
              <p className="text-gray-500 mb-6">{error}</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <svg
                    className="w-5 h-5 text-yellow-400 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Showing sample data due to
                      connection error.
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={fetchSales}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <SalesReport data={sales} />
        )}
      </div>

      {/* Add Sale Form Modal */}
      <AddSaleForm
        isOpen={showAddSaleForm}
        onClose={() => setShowAddSaleForm(false)}
        onSuccess={() => {
          fetchSales(); // Refresh sales data
        }}
      />
    </div>
  );
}
