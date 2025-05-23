import React from 'react';

const AdminPanel = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Manage Inventory</h2>
        <p className="mb-4">Here you can add, edit, or remove inventory items.</p>
        <button className="bg-blue-500 text-white px-4 py-2 rounded">Add Item</button>
        
        <h2 className="text-xl font-semibold mt-6 mb-2">Sales Reports</h2>
        <p className="mb-4">View and analyze sales reports.</p>
        <button className="bg-green-500 text-white px-4 py-2 rounded">View Reports</button>
        
        <h2 className="text-xl font-semibold mt-6 mb-2">Settings</h2>
        <p className="mb-4">Manage application settings and user permissions.</p>
        <button className="bg-yellow-500 text-white px-4 py-2 rounded">Update Settings</button>
      </div>
    </div>
  );
};

export default AdminPanel;