import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">Welcome to Nutri_Blush</h1>
      <p className="text-lg mb-8">Your go-to solution for managing inventory and sales reports.</p>
      <div className="flex gap-4">
        <a
          className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-500 text-white gap-2 hover:bg-blue-600 text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          href="/inventory"
        >
          Manage Inventory
        </a>
        <a
          className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-green-500 text-white gap-2 hover:bg-green-600 text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          href="/sales"
        >
          View Sales Reports
        </a>
        <a
          className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-red-500 text-white gap-2 hover:bg-red-600 text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          href="/admin"
        >
          Admin Panel
        </a>
      </div>
    </div>
  );
}