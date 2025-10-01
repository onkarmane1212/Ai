
// import React from 'react';
// import { Lightbulb, Languages, User, Plus, MessageCircleQuestion, PenLine,MessageSquare, Code, GraduationCap, Link } from 'lucide-react';
// import Link from 'next/link';

// export default function Home() {
//   const chats = [
//     {
//       id: 1,
//       icon: MessageSquare,
//       bgColor: 'bg-purple-200',
//       iconColor: 'text-purple-600',
//       title: 'Creative Writing Assistant',
//       description: 'Help me write a short story about...',
//       time: '2 hours ago'
//     },
//     {
//       id: 2,
//       icon: Code,
//       bgColor: 'bg-green-100',
//       iconColor: 'text-green-600',
//       title: 'Code Helper',
//       description: 'Can you explain this Python function?',
//       time: 'Yesterday'
//     },
//     {
//       id: 3,
//       icon: GraduationCap,
//       bgColor: 'bg-pink-100',
//       iconColor: 'text-purple-600',
//       title: 'Study Buddy',
//       description: 'Explain quantum physics concepts',
//       time: '3 days ago'
//     }
//   ];

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Hero Section */}
//       <div className="bg-gradient-to-r from-gray-200 to-blue-700 px-6 py-8 pb-12 rounded-3xl m-2 shadow-lg">
//         <div className="max-w-md mx-auto">
//           {/* Header */}
//           <div className="flex justify-between items-start mb-8">
//             <div>
//               <h1 className="text-white text-2xl font-bold">Good morning!</h1>
//               <p className="text-purple-100 text-sm mt-1">Ready to chat with AI?</p>
//             </div>
//             <button className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-all rounded-full p-2">
//               <User className="w-6 h-6 text-white" />
//             </button>
//           </div>

//           {/* Start Chat Card */}
//           <div className="bg-white rounded-2xl p-6 shadow-xl">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h2 className="text-purple-600 text-xl font-bold mb-1">Start New Chat</h2>
//                 <p className="text-gray-500 text-sm">Begin a conversation with our AI assistant</p>
//               </div>
//               <button className="bg-purple-600 hover:bg-purple-700 transition-all rounded-full p-3 ml-4 flex-shrink-0">
//                 <Plus className="w-6 h-6 text-white" />
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>


//       <div className="bg-white rounded-2xl p-4 shadow-sm">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-lg font-bold text-gray-900">Recent Chats</h2>
//           <Link href="/recent" className="text-lg font-bold text-gray-900 hover:text-gray-600">View all</Link>
//         </div>

//         {/* Chat List */}
//         <div className="space-y-3">
//           {chats.map((chat) => (
//             <button
//               key={chat.id}
//               className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
//             >
//               {/* Icon */}
//               <div className={`${chat.bgColor} rounded-xl p-2.5 flex-shrink-0`}>
//                 <chat.icon className={`w-5 h-5 ${chat.iconColor}`} />
//               </div>

//               {/* Content */}
//               <div className="flex-1 min-w-0">
//                 <h3 className="font-semibold text-gray-900 text-sm mb-0.5">
//                   {chat.title}
//                 </h3>
//                 <p className="text-gray-500 text-xs truncate mb-1">
//                   {chat.description}
//                 </p>
//                 <span className="text-gray-400 text-xs">{chat.time}</span>
//               </div>
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Quick Actions Section */}
//       <div className="max-w-md mx-auto px-6 mt-10">
//         <h2 className="text-gray-800 text-lg font-semibold mb-4">Quick Actions</h2>
        
//         <div className="grid grid-cols-2 gap-4">
//           {/* Get Ideas Card */}
//           <button className="bg-purple-200 hover:bg-purple-300 transition-all rounded-2xl p-6 text-center shadow-sm">
//             <div className="bg-purple-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
//               <Lightbulb className="w-6 h-6 text-white" />
//             </div>
//             <h3 className="text-purple-900 font-semibold text-base mb-1">Get Ideas</h3>
//             <p className="text-purple-700 text-xs">Brainstorm creative solutions</p>
//           </button>

//           {/* Translate Card */}
//           <button className="bg-cyan-200 hover:bg-cyan-300 transition-all rounded-2xl p-6 text-center shadow-sm">
//             <div className="bg-cyan-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
//               <Languages className="w-6 h-6 text-white" />
//             </div>
//             <h3 className="text-cyan-900 font-semibold text-base mb-1">Translate</h3>
//             <p className="text-cyan-700 text-xs">Translate any language</p>
//           </button>

//           <button className="bg-orange-100 hover:bg-orange-200 transition-all rounded-2xl p-6 text-center shadow-sm">
//             <div className="bg-purple-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
//               <MessageCircleQuestion className="w-6 h-6 text-white" />
//             </div>
//             <h3 className="text-purple-900 font-semibold text-base mb-1">Ask Questions</h3>
//             <p className="text-purple-700 text-xs">Get instant answers</p>
//           </button>

//           {/* Write & Edit Card */}
//           <button className="bg-white hover:bg-gray-50 transition-all rounded-2xl p-6 text-center shadow-sm border border-gray-100">
//             <div className="bg-purple-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
//               <PenLine className="w-6 h-6 text-white" />
//             </div>
//             <h3 className="text-purple-900 font-semibold text-base mb-1">Write & Edit</h3>
//             <p className="text-gray-500 text-xs">Improve your writing</p>
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


'use client';

import React, { useEffect, useState } from 'react';
import { Lightbulb, Languages, User, Plus, MessageCircleQuestion, PenLine, MessageSquare, Code, GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [items, setItems] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [recentErr, setRecentErr] = useState('');


  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning !';
    if (hour < 18) return 'Good afternoon ! ';
    return 'Good evening !';
  };
  useEffect(() => {
    let cancelled = false;
    async function loadRecent() {
      setLoadingRecent(true);
      setRecentErr('');
      try {
        const res = await fetch('/api/recent', { method: 'GET' });
        if (!res.ok) throw new Error('Failed to load recent');
        const data = await res.json();
        if (!cancelled) setItems(Array.isArray(data.items) ? data.items : []);
      } catch (e) {
        if (!cancelled) setRecentErr('Could not load recent items.');
        console.error(e);
      } finally {
        if (!cancelled) setLoadingRecent(false);
      }
    }
    loadRecent();
    return () => { cancelled = true; };
  }, []);

  // Helper to extract first line of a mode from responses
  const getModeSnippet = (responses, mode) => {
    const r = Array.isArray(responses) ? responses.find(x => x.mode === mode) : null;
    if (!r?.content) return '';
    const s = r.content.trim();
    return s.length > 120 ? s.slice(0, 120) + '…' : s;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="sticky top-14 bg-gradient-to-br from-gray-200 to-blue-800 px-6 py-8 pb-12 rounded-3xl mx-2 -mt-2 shadow-lg">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-white text-2xl font-bold">{getGreeting()}</h1>
              <p className="text-purple-100 text-sm mt-1">Ready to chat with AI?</p>
            </div>
            <button className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-all rounded-full p-2">
              <User className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Start Chat Card */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-purple-600 text-xl font-bold mb-1">Start New Chat</h2>
                <p className="text-gray-500 text-sm">Begin a conversation with our What If? AI assistant</p>
              </div>
              <Link href="/whatif" className="bg-purple-600 hover:bg-purple-700 transition-all rounded-full p-3 ml-4 flex-shrink-0">
                <Plus className="w-6 h-6 text-white" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Section */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Chats</h2>
            <Link href="/history" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">
              View all
            </Link>
          </div>

          {/* Loading / Error / Empty */}
          {loadingRecent && (
            <div className="grid gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-16" />
              ))}
            </div>
          )}
          {recentErr && <p className="text-red-600">{recentErr}</p>}
          {!loadingRecent && !recentErr && items.length === 0 && (
            <p className="text-gray-600">No recent chats yet. Ask something to get started.</p>
          )}

          {/* Recent List (limit to first 5) */}
          {!loadingRecent && items.length > 0 && (
            <div className="space-y-3">
              {items.slice(0, 5).map((item) => {
                const fant = getModeSnippet(item.responses, 'fantastical');
                const logic = getModeSnippet(item.responses, 'logical');
                const snippet = fant || logic || '';
                return (
                  <Link
                    key={item._id}
                    href="/history" // or a detail page in future
                    className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="bg-purple-100 rounded-xl p-2.5 flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm mb-0.5 truncate">
                        {item.question}
                      </h3>
                      <p className="text-gray-500 text-xs truncate">
                        {snippet}
                      </p>
                      <span className="text-gray-400 text-xs">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="max-w-md mx-auto px-6 mt-6 pb-10">
        <h2 className="text-gray-800 text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-purple-200 hover:bg-purple-300 transition-all rounded-2xl p-6 text-center shadow-sm">
            <div className="bg-purple-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-purple-900 font-semibold text-base mb-1">Get Ideas</h3>
            <p className="text-purple-700 text-xs">Brainstorm creative solutions</p>
          </button>
          <button className="bg-cyan-200 hover:bg-cyan-300 transition-all rounded-2xl p-6 text-center shadow-sm">
            <div className="bg-cyan-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <Languages className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-cyan-900 font-semibold text-base mb-1">Translate</h3>
            <p className="text-cyan-700 text-xs">Translate any language</p>
          </button>
          <button className="bg-orange-100 hover:bg-orange-200 transition-all rounded-2xl p-6 text-center shadow-sm">
            <div className="bg-purple-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <MessageCircleQuestion className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-purple-900 font-semibold text-base mb-1">Ask Questions</h3>
            <p className="text-purple-700 text-xs">Get instant answers</p>
          </button>
          <button className="bg-white hover:bg-gray-50 transition-all rounded-2xl p-6 text-center shadow-sm border border-gray-100">
            <div className="bg-purple-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <PenLine className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-purple-900 font-semibold text-base mb-1">Write & Edit</h3>
            <p className="text-gray-500 text-xs">Improve your writing</p>
          </button>
        </div>
      </div>
    </div>
  );
}