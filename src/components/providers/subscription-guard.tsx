'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  isTrialExpired: boolean;
  plan: string;
}

export function SubscriptionGuard({
  children,
  isTrialExpired,
  plan,
}: SubscriptionGuardProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // 1. Bloqueo por Trial Expirado
    if (isTrialExpired && pathname !== '/dashboard/billing') {
      toast.error('Tu prueba gratuita ha expirado. Por favor, selecciona un plan para continuar.');
      router.replace('/dashboard/billing');
      return;
    }

    // 2. Bloqueo de Acceso a Manufactura
    const isManufacturingRoute = pathname.startsWith('/dashboard/manufacturing');
    if (isManufacturingRoute && plan !== 'manufactura') {
      toast.error('El módulo de Manufactura requiere el plan Axioma Manufactura.');
      router.replace('/dashboard/billing?upgrade=manufactura');
      return;
    }
  }, [isTrialExpired, plan, pathname, router]);

  // UI de Bloqueo Preventivo mientras se redirige
  if (isTrialExpired && pathname !== '/dashboard/billing') {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Lock className="h-12 w-12 text-muted-foreground animate-pulse" />
        <h2 className="text-xl font-semibold">Acceso Bloqueado</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          Tu periodo de prueba ha terminado. Redirigiendo a facturación...
        </p>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
