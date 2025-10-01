import { Inter } from 'next/font/google';
import './globals.css';

export const metadata = {
  title: 'Analysis With Shakkti',
  description: 'A modern web search application',
};

import Navbar from '../components/Navbar';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <main className="min-h-[calc(100vh-4rem)]">
       <Navbar />
          {children}
        </main>
      </body>
    </html>
  );
}
