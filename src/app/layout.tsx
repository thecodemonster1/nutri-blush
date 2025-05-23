import './globals.css';

export const metadata = {
  title: 'Nutri Blush',
  description: 'Manage your inventory and sales reports with Nutri Blush',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-900">
        <header className="p-4 bg-white shadow">
          <h1 className="text-2xl font-bold">Nutri Blush</h1>
        </header>
        <main>{children}</main>
        <footer className="p-4 bg-white shadow mt-4">
          <p className="text-center">© 2023 Nutri Blush. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}