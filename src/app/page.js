// 'use client';

// import { useState } from 'react';

// export default function Home() {
//   const [question, setQuestion] = useState('');
//   const [responses, setResponses] = useState({
//     fantastical: '',
//     logical: ''
//   });
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!question.trim()) {
//       setError('Please enter a question');
//       return;
//     }

//     setIsLoading(true);
//     setError('');
//     setResponses({ fantastical: '', logical: '' });
    
//     try {
//       // Fetch both responses in parallel
//       const [fantasticalRes, logicalRes] = await Promise.all([
//         fetch('/api/what-if', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ question, mode: 'fantastical' }),
//         }),
//         fetch('/api/what-if', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ question, mode: 'logical' }),
//         })
//       ]);

//       if (!fantasticalRes.ok || !logicalRes.ok) {
//         throw new Error('Failed to get responses');
//       }

//       const fantasticalData = await fantasticalRes.json();
//       const logicalData = await logicalRes.json();

//       setResponses({
//         fantastical: fantasticalData.response,
//         logical: logicalData.response
//       });
//     } catch (err) {
//       setError('Failed to get responses. Please try again.');
//       console.error(err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
//       <div className="w-full max-w-md bg-gradient-to-b from-teal-500 to-blue-500 rounded-xl shadow-xl p-6 text-center">
//         {/* Heading */}
//         <h1 className="text-xl font-bold text-white">
//           Ask a What If... Open a new World
//         </h1>
//         <p className="text-sm text-gray-100 mt-1">
//           The possibilities are endless..
//         </p>

//         {/* Input */}
//         <form onSubmit={handleSubmit} className="mt-4">
//           <div className="text-left">
//             <label
//               htmlFor="questionInput"
//               className="text-xs text-green-200 font-medium"
//             >
//               questionInput
//             </label>
//           </div>
//           <textarea
//             id="questionInput"
//             rows="5"
//             value={question}
//             onChange={(e) => setQuestion(e.target.value)}
//             placeholder="Type your question here....."
//             className="w-full mt-1 p-3 rounded-md border border-gray-300 text-gray-800 text-sm resize-none"
//           ></textarea>

//           {/* Button */}
//           <button
//             type="submit"
//             className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition"
//           >
//             Ask
//           </button>
//         </form>
//       </div>
//     </main>
//   );
// }

'use client';

import { useState } from 'react';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [responses, setResponses] = useState({
    fantastical: '',
    logical: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponses({ fantastical: '', logical: '' });
    
    try {
      // Fetch both responses in parallel
      const [fantasticalRes, logicalRes] = await Promise.all([
        fetch('/api/what-if', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, mode: 'fantastical' }),
        }),
        fetch('/api/what-if', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, mode: 'logical' }),
        })
      ]);

      if (!fantasticalRes.ok || !logicalRes.ok) {
        throw new Error('Failed to get responses');
      }

      const fantasticalData = await fantasticalRes.json();
      const logicalData = await logicalRes.json();

      setResponses({
        fantastical: fantasticalData.response,
        logical: logicalData.response
      });
    } catch (err) {
      setError('Failed to get responses. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <main className="min-h-screen -mt-20 flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-gradient-to-b from-teal-500 to-blue-500 rounded-xl shadow-xl p-6 text-center">
        {/* Heading */}
        <h1 className="text-xl font-bold text-white">
          Ask a What If... Open a new World
        </h1>
        <p className="text-sm text-gray-100 mt-1">
          The possibilities are endless..
        </p>

        {/* Input */}
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="text-left">
            <label
              htmlFor="questionInput"
              className="text-xs text-green-200 font-medium"
            >
              Question
            </label>
          </div>
          <textarea
            id="questionInput"
            rows="5"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question here....."
            className="w-full mt-1 p-3 rounded-2xl border border-gray-300 text-gray-800 text-sm resize-none"
          ></textarea>

          {/* Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 w-full  bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl transition disabled:opacity-50"
          >
            {isLoading ? 'Thinking...' : 'Ask'}
          </button>
        </form>

        {/* Error */}
        {error && <p className="mt-3 text-red-200 text-sm">{error}</p>}

       
      </div>
    </main>
     {/* Responses */}
{/* Responses - side-by-side on md+, equal height, scroll if long */}
{(responses.fantastical || responses.logical) && (
  <div className="max-w-6xl mx-auto -mt-5 px-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
    {/* Fantastical */}
    {responses.fantastical && (
      <div className="flex flex-col h-full bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 
                      rounded-2xl shadow-lg border border-purple-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🌌</span>
          <h2 className="font-extrabold text-lg text-purple-700 tracking-wide">Fantastical</h2>
        </div>

        <div className="flex-1 pr-2">
          <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
            {responses.fantastical}
          </pre>
        </div>
      </div>
    )}

    {/* Logical */}
    {responses.logical && (
      <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 
                      rounded-2xl shadow-lg border border-blue-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🧠</span>
          <h2 className="font-extrabold text-lg text-blue-700 tracking-wide">Logical</h2>
        </div>

        <div className="flex-1 pr-2">
          <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
            {responses.logical}
          </pre>
        </div>
      </div>
    )}
  </div>
)}



    </>
  );
}
