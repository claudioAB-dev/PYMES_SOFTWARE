"use client"

import { useState } from "react"
import { toast } from "sonner"
import { CreditCard, Rocket, Check, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { createCheckoutSession } from "@/lib/stripe/actions"

interface PlanTabProps {
    organization: {
        id: string
        plan: string
        subscriptionStatus: string | null
    }
}

export function PlanTab({ organization }: PlanTabProps) {
    const [isLoading, setIsLoading] = useState(false)

    // Using an environment variable or a known price_id from Stripe dashboard
    // It's normally better to fetch products from Stripe, but for this exercise we can use a hardcoded or env based ID
    const manufacturaPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_MANUFACTURA || 'price_123456789'

    const handleUpgrade = async () => {
        setIsLoading(true)
        const result = await createCheckoutSession(organization.id, manufacturaPriceId)
        
        if (result.error) {
            toast.error(result.error)
            setIsLoading(false)
        } else if (result.url) {
            window.location.href = result.url
        }
    }

    const isManufactura = organization.plan === 'manufactura'

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Plan Actual</CardTitle>
                    <CardDescription>
                        Administra y actualiza el plan de tu organización.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Rocket className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold text-lg uppercase">{organization.plan}</p>
                            <p className="text-sm text-muted-foreground">
                                Estado: {organization.subscriptionStatus || 'No configurado'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className={`relative flex flex-col ${!isManufactura ? 'border-primary shadow-md' : ''}`}>
                    {!isManufactura && (
                        <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-3">
                            <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase">Recomendado</span>
                        </div>
                    )}
                    <CardHeader>
                        <CardTitle>Axioma Manufactura</CardTitle>
                        <CardDescription>Desbloquea todo el potencial de tu línea de producción.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="mb-4">
                            <span className="text-4xl font-extrabold">$149</span>
                            <span className="text-muted-foreground">/mes</span>
                        </div>
                        <ul className="space-y-2 mb-6">
                            {[
                                "Gestión de Múltiples Líneas",
                                "Planificador Drag & Drop",
                                "Control de Inventario Avanzado",
                                "Integración completa Drizzle",
                                "Reportes en Tiempo Real"
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center text-sm">
                                    <Check className="h-4 w-4 text-green-500 mr-2" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        {isManufactura ? (
                            <Button className="w-full" disabled variant="outline">
                                Plan Actual
                            </Button>
                        ) : (
                            <Button className="w-full" onClick={handleUpgrade} disabled={isLoading}>
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <CreditCard className="mr-2 h-4 w-4" />
                                )}
                                Actualizar a Manufactura
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
