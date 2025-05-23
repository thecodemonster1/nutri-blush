import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import SalesReport from "@/components/SalesReport";

export default function SalesPage() {
  const [salesData, setSalesData] = useState([]);

  useEffect(() => {
    const fetchSalesData = async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*");

      if (error) {
        console.error("Error fetching sales data:", error);
      } else {
        setSalesData(data);
      }
    };

    fetchSalesData();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sales Reports</h1>
      <SalesReport data={salesData} />
    </div>
  );
}