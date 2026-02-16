'use client';

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOrganizationSchema, type CreateOrganizationInput } from "@/lib/validators/onboarding";
import { createOrganizationAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { toast } from "sonner"; // Assuming sonner is installed or will be, otherwise standard console/alert for now or change to useActionState

export default function OnboardingPage() {
    const [isPending, startTransition] = useTransition();

    const form = useForm<CreateOrganizationInput>({
        resolver: zodResolver(createOrganizationSchema),
        defaultValues: {
            name: "",
            slug: "",
            rfc: "",
        },
    });

    function onSubmit(data: CreateOrganizationInput) {
        startTransition(async () => {
            const result = await createOrganizationAction(data);

            if (result?.error) {
                // Show error (using toast if available, or form error)
                form.setError("root", { message: result.error });
                // If using sonner: toast.error(result.error);
            } else {
                // Success handled by redirect in action
                // toast.success("Organización creada exitosamente!");
            }
        });
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Bienvenido a Axioma</CardTitle>
                    <CardDescription>
                        Para comenzar, registra tu primera empresa.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre de la Organización</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Mi Empresa S.A. de C.V." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="slug"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Slug (URL)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="mi-empresa" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="rfc"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>RFC (Opcional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="XAXX010101000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {form.formState.errors.root && (
                                <p className="text-sm font-medium text-destructive">
                                    {form.formState.errors.root.message}
                                </p>
                            )}

                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? "Creando..." : "Comenzar"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
