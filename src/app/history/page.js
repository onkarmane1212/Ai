'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/recent');
        if (!res.ok) throw new Error('Failed to fetch history');
        const data = await res.json();
        setItems(data.items || []);
      } catch (err) {
        setError('Could not load history.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-indigo-700">History</h1>
          <Link
            href="/"
            className="text-sm px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            ⬅ Back
          </Link>
        </div>

        {/* Loading */}
        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {/* History List */}
        <div className="space-y-8">
          {items.map((item) => (
            <div
              key={item._id}
              className="bg-white shadow-md rounded-xl border border-gray-200 p-6"
            >
              {/* Question */}
              <h2 className="text-lg font-semibold text-gray-800">
                ❓ {item.question}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(item.createdAt).toLocaleString()}
              </p>

              {/* Responses - side by side */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {item.responses.find((r) => r.mode === 'fantastical') && (
                  <div className="flex flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 rounded-2xl shadow-sm border border-purple-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🌌</span>
                      <h3 className="font-bold text-purple-700">Fantastical</h3>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">
                      {
                        item.responses.find((r) => r.mode === 'fantastical')
                          .content
                      }
                    </pre>
                  </div>
                )}

                {item.responses.find((r) => r.mode === 'logical') && (
                  <div className="flex flex-col bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 rounded-2xl shadow-sm border border-blue-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🧠</span>
                      <h3 className="font-bold text-blue-700">Logical</h3>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">
                      {
                        item.responses.find((r) => r.mode === 'logical')
                          .content
                      }
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
