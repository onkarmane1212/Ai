// import Link from 'next/link';
// import { History, Settings ,Robot } from 'lucide-react';
// import Image from 'next/image';

// export default function Navbar() {
//   return (
//     <header className="flex items-center justify-between px-4 py-3 pt-10 bg-white shadow-sm border-b">
//       <div className="flex items-center gap-2">
//         <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded-lg" />
//         <h1 className="text-lg font-semibold text-gray-800">What If? ai</h1>
//       </div>
//       <div className="flex items-center gap-2">
//         <Link href="/history"><History className="w-5 h-5 text-gray-600" /></Link>
//         <Link href="/settings"><Settings className="w-5 h-5 text-gray-600" /></Link>
//       </div>
//     </header>
//   );
// }


import Link from 'next/link';
import { History, Settings,  Cpu } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0  flex items-center justify-between px-4 py-3  bg-white shadow-sm border-b">
      <div className="flex items-center gap-2">
        <Cpu className="w-8 h-8 text-gray-800" />
       <Link href="/"> <h1 className="text-lg font-semibold text-gray-800">What If? AI</h1></Link>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/history"><History className="w-5 h-5 text-gray-600" /></Link>
        <Settings className="w-5 h-5 text-gray-600" />
      </div>
    </header>
  );
}
