'use client';

import { Check, Crown, Factory, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckoutButton } from './checkout-button';

type BillingClientProps = {
  organizationId: string;
  currentPlan: string;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  isTrialExpired?: boolean;
};

const PLANS = [
  {
    id: 'pro',
    name: 'Axioma PRO',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || '',
    price: '$799',
    period: '/mes',
    description: 'Para PyMEs que necesitan control financiero completo.',
    icon: Crown,
    color: 'border-primary',
    features: [
      'Bóveda CSD',
      'Conciliación SAT',
      'Multiusuario',
      'RBAC (Control de Acceso Basado en Roles)',
      'Facturación CFDI 4.0',
      'Reportes financieros',
    ],
  },
  {
    id: 'manufactura',
    name: 'Axioma Manufactura',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MANUFACTURA || '',
    price: '$1,499',
    period: '/mes',
    description: 'Control total de la cadena de producción industrial.',
    icon: Factory,
    color: 'border-primary ring-2 ring-primary ring-offset-2',
    popular: true,
    features: [
      'Todo lo incluido en PRO',
      'BOM Dinámico',
      'Control de Mermas',
      'Costeo por Lote',
      'Órdenes de producción',
      'Trazabilidad industrial',
    ],
  },
];

export function BillingClient({
  organizationId,
  currentPlan,
  subscriptionStatus,
  currentPeriodEnd,
  isTrialExpired = false,
}: BillingClientProps) {
  
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  const getStatusLabel = () => {
    if (subscriptionStatus === 'trialing') {
      return isTrialExpired ? 'Prueba Expirada' : 'Prueba Activa';
    }
    return subscriptionStatus === 'active' ? 'Activo' : subscriptionStatus || 'N/A';
  };

  const getButtonLabel = (planId: string) => {
    const isMatchingPlan = currentPlan === planId;
    const isActive = subscriptionStatus === 'active';

    if (isMatchingPlan && isActive) return 'Plan Actual';
    if (isMatchingPlan && !isActive) return `Activar Plan ${planId === 'pro' ? 'PRO' : 'Manufactura'}`;
    if (currentPlan === 'pro' && planId === 'manufactura') return 'Hacer Upgrade';
    
    return 'Seleccionar Plan';
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Current Subscription Summary */}
      {currentPlan !== 'free' && (
        <Card className="bg-muted/30">
          <CardHeader className="flex flex-row items-center gap-4 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Tu Suscripción Activa</CardTitle>
              <CardDescription>
                {subscriptionStatus === 'active' 
                  ? `Actualmente en el plan ` 
                  : `Probando el plan `}
                <span className="font-bold uppercase text-foreground">{currentPlan === 'pro' ? 'Axioma Pro' : 'Axioma Manufactura'}</span>
              </CardDescription>
            </div>
            <div className="text-right">
              <Badge variant={subscriptionStatus === 'active' ? 'default' : (subscriptionStatus === 'trialing' && !isTrialExpired ? 'secondary' : 'destructive')}>
                {getStatusLabel()}
              </Badge>
              {currentPeriodEnd && (
                <p className="text-xs text-muted-foreground mt-1">
                  {isTrialExpired ? 'Expiró el: ' : (subscriptionStatus === 'trialing' ? 'Prueba termina el: ' : 'Renueva el: ')} {formatDate(currentPeriodEnd)}
                </p>
              )}
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Pricing Grid */}
      <div className="grid gap-8 md:grid-cols-2">
        {PLANS.map((plan) => {
          const isMatchingPlan = currentPlan === plan.id;
          const isPaidActive = isMatchingPlan && subscriptionStatus === 'active';
          const isManufactura = plan.id === 'manufactura';
          
          return (
            <Card 
              key={plan.id} 
              className={`flex flex-col relative transition-all duration-300 ${
                isPaidActive ? 'opacity-100' : 'hover:scale-[1.02]'
              } ${plan.color}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1 text-sm font-bold shadow-lg">
                    Recomendado para Industria
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <plan.icon className="h-6 w-6 text-primary" />
                  </div>
                  {isPaidActive && (
                    <Badge variant="secondary" className="font-medium">
                      Plan Actual
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-base min-h-[3rem]">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="mb-6">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-muted-foreground ml-1">MXN{plan.period}</span>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    {isManufactura ? 'Funciones de Manufactura:' : 'Incluye:'}
                  </p>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <div className="mt-1 bg-primary/20 rounded-full p-0.5">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-muted-foreground leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="pt-6">
                <CheckoutButton
                  priceId={plan.priceId}
                  organizationId={organizationId}
                  planId={plan.id}
                  currentPlan={currentPlan}
                  isPaidActive={isPaidActive}
                  label={getButtonLabel(plan.id)}
                  className="w-full py-6 text-lg font-bold"
                  variant={isManufactura ? 'default' : 'outline'}
                />
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>¿Tienes dudas sobre los planes? <span className="text-primary cursor-pointer hover:underline">Contacta a nuestro equipo de ventas</span>.</p>
        <div className="flex justify-center items-center gap-6 mt-6 grayscale opacity-60">
          <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-6" />
          <div className="flex items-center gap-1 font-semibold text-slate-700">
            <Zap className="h-4 w-4 text-primary fill-primary" />
            PCI Compliance
          </div>
        </div>
      </div>
    </div>
  );
}
