import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import InventoryTable from "@/components/InventoryTable";

export default function InventoryPage() {
  const [inventoryItems, setInventoryItems] = useState([]);

  useEffect(() => {
    const fetchInventory = async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*");

      if (error) {
        console.error("Error fetching inventory:", error);
      } else {
        setInventoryItems(data);
      }
    };

    fetchInventory();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Inventory Management</h1>
      <InventoryTable items={inventoryItems} />
    </div>
  );
}