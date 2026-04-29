import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { subscriptionApi } from '../services/api/subscription-api';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';

const PaymentStatusPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your payment...');

  const txRef = searchParams.get('tx_ref');

  useEffect(() => {
    if (txRef) {
      verifyPayment();
    } else {
      setStatus('error');
      setMessage('Missing transaction reference.');
    }
  }, [txRef]);

  const verifyPayment = async () => {
    try {
      const response = await subscriptionApi.verifyPayment(txRef!);
      if (response.success) {
        setStatus('success');
        setMessage('Your subscription is now active! Thank you for choosing our premium plan.');
      } else {
        setStatus('error');
        setMessage(response.message || 'Payment verification failed.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage('An error occurred while verifying your payment.');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="max-w-md w-full p-10 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 size={64} className="text-primary animate-spin mb-6" />
            <h1 className="text-2xl font-bold mb-2">Processing Payment</h1>
            <p className="text-white/60">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center animate-in zoom-in duration-500">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 mb-6 shadow-lg shadow-green-500/20">
              <CheckCircle2 size={48} />
            </div>
            <h1 className="text-3xl font-black mb-4">Payment Successful!</h1>
            <p className="text-white/60 mb-10">{message}</p>
            <Button 
              onClick={() => navigate('/dashboard')}
              className="w-full h-14 rounded-2xl bg-white text-black hover:bg-white/90 font-bold flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight size={20} />
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center animate-in zoom-in duration-500">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mb-6 shadow-lg shadow-red-500/20">
              <XCircle size={48} />
            </div>
            <h1 className="text-3xl font-black mb-4">Payment Failed</h1>
            <p className="text-white/60 mb-10">{message}</p>
            <div className="flex flex-col gap-4 w-full">
              <Button 
                onClick={() => navigate('/subscription')}
                className="w-full h-14 rounded-2xl bg-primary text-white hover:bg-primary/90 font-bold"
              >
                Try Again
              </Button>
              <Button 
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="w-full h-14 rounded-2xl text-white/60 hover:text-white"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentStatusPage;
