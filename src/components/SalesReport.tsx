import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const SalesReport = () => {
  const [salesData, setSalesData] = useState([]);

  useEffect(() => {
    const fetchSalesData = async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*');

      if (error) {
        console.error('Error fetching sales data:', error);
      } else {
        setSalesData(data);
      }
    };

    fetchSalesData();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Sales Report</h1>
      <table className="min-w-full border-collapse border border-gray-200">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2">Date</th>
            <th className="border border-gray-300 p-2">Product</th>
            <th className="border border-gray-300 p-2">Quantity</th>
            <th className="border border-gray-300 p-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {salesData.map((sale) => (
            <tr key={sale.id}>
              <td className="border border-gray-300 p-2">{new Date(sale.date).toLocaleDateString()}</td>
              <td className="border border-gray-300 p-2">{sale.product}</td>
              <td className="border border-gray-300 p-2">{sale.quantity}</td>
              <td className="border border-gray-300 p-2">${sale.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SalesReport;