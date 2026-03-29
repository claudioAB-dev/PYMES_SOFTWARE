'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CheckoutButtonProps {
  priceId: string;
  organizationId: string;
  planId: string;
  currentPlan: string;
  isPaidActive: boolean;
  label: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
}

export function CheckoutButton({
  priceId,
  organizationId,
  planId,
  currentPlan,
  isPaidActive,
  label,
  className,
  variant = 'default'
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (isPaidActive) return;

    if (!priceId || priceId.includes('XXXXX')) {
        toast.error('ID de precio no configurado. Verifica tus variables de entorno.');
        return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          organizationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Algo salió mal');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('[CHECKOUT_ERROR]', error);
      toast.error(error.message || 'Error al iniciar el proceso de pago');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading || isPaidActive}
      className={className}
      variant={variant}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Procesando...
        </>
      ) : (
        label
      )}
    </Button>
  );
}
