'use client';

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOrganizationSchema, type CreateOrganizationInput } from "@/lib/validators/onboarding";
import { createOrganizationAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, Building2 } from "lucide-react";

export default function OnboardingPage() {
    const [isPending, startTransition] = useTransition();

    const form = useForm<CreateOrganizationInput>({
        resolver: zodResolver(createOrganizationSchema),
        defaultValues: {
            name: "",
            rfc: "",
        },
    });

    function onSubmit(data: CreateOrganizationInput) {
        startTransition(async () => {
            const result = await createOrganizationAction(data);

            if (result?.error) {
                toast.error("No se pudo crear la empresa", {
                    description: result.error,
                });
            }
            // On success the server action redirects to /dashboard — no client-side handling needed
        });
    }

    return (
        <div>
            {/* Icon + Header */}
            <div className="mb-7">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: "linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)" }}
                >
                    <Building2 className="w-6 h-6" style={{ color: "#6366f1" }} />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Crea tu espacio de trabajo
                </h2>
                <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                    Registra tu empresa para comenzar a usar Axioma. Solo tomará un momento.
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>

                    {/* Company Name */}
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field, fieldState }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700">
                                    Nombre de la empresa
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Mi Empresa S.A. de C.V."
                                        autoComplete="organization"
                                        data-invalid={!!fieldState.error}
                                        className="h-10 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 data-[invalid=true]:border-red-400 data-[invalid=true]:focus:ring-red-400/20 transition-all"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )}
                    />

                    {/* RFC – optional */}
                    <FormField
                        control={form.control}
                        name="rfc"
                        render={({ field, fieldState }) => (
                            <FormItem>
                                <div className="flex items-center justify-between">
                                    <FormLabel className="text-sm font-medium text-gray-700">
                                        RFC
                                    </FormLabel>
                                    <span className="text-xs text-gray-400">Opcional</span>
                                </div>
                                <FormControl>
                                    <Input
                                        placeholder="XAXX010101000"
                                        autoComplete="off"
                                        data-invalid={!!fieldState.error}
                                        className="h-10 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 data-[invalid=true]:border-red-400 data-[invalid=true]:focus:ring-red-400/20 transition-all uppercase"
                                        {...field}
                                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                    />
                                </FormControl>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )}
                    />

                    {/* Info note about slug */}
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Se generará automáticamente un identificador único para tu empresa a partir del nombre que ingreses.
                    </p>

                    {/* Submit */}
                    <Button
                        type="submit"
                        className="w-full h-10 mt-1 font-medium text-sm"
                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creando empresa...
                            </>
                        ) : (
                            "Comenzar →"
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
