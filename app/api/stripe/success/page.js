'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SuccessPage() {
  const router = useRouter();
  const [count, setCount] = useState(5);

  // 1. Handle the Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 2. Handle the Redirect with a Refresh
  useEffect(() => {
    if (count === 0) {
      // ✅ ACTION: Force a router refresh so the layout fetches the new subscription status
      router.refresh(); 
      router.push('/dashboard/settings?upgrade=success');
    }
  }, [count, router]);

  const handleManualRedirect = () => {
    router.refresh();
    router.push('/dashboard/settings?upgrade=success');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-lg border border-gray-100 p-8 text-center space-y-6">
        
        {/* Success Icon Animation */}
        <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
          <p className="text-gray-500">
            Thank you for upgrading. We are updating your pantry's limits and features now.
          </p>
        </div>

        {/* Loading Indicator */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-[#d97757]" />
          <span className="text-sm font-medium text-gray-600">
            Finalizing setup... {count}s
          </span>
        </div>

        <Button 
          onClick={handleManualRedirect}
          className="w-full bg-gray-900 text-white hover:bg-black transition-all"
        >
          Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        
        <p className="text-[10px] text-gray-400 uppercase tracking-widest">
          Transaction Complete
        </p>
      </div>
    </div>
  );
}