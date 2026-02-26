"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Save, Key } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card"

import { updatePassword } from "./actions"

const securitySchema = z.object({
    newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirma la contraseña"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
})

type SecurityInput = z.infer<typeof securitySchema>

export function SecurityForm() {
    const [isPending, startTransition] = useTransition()

    const form = useForm<SecurityInput>({
        resolver: zodResolver(securitySchema),
        defaultValues: {
            newPassword: "",
            confirmPassword: "",
        },
    })

    const onSubmit = (data: SecurityInput) => {
        startTransition(async () => {
            const result = await updatePassword(data.newPassword)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Contraseña actualizada correctamente")
                form.reset()
            }
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-muted-foreground" />
                    Cambiar Contraseña
                </CardTitle>
                <CardDescription>
                    Actualiza tu contraseña para mantener tu cuenta segura.
                </CardDescription>
            </CardHeader>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Nueva Contraseña</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            {...form.register("newPassword")}
                        />
                        {form.formState.errors.newPassword && (
                            <p className="text-sm text-red-500">
                                {form.formState.errors.newPassword.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            {...form.register("confirmPassword")}
                        />
                        {form.formState.errors.confirmPassword && (
                            <p className="text-sm text-red-500">
                                {form.formState.errors.confirmPassword.message}
                            </p>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/20 px-6 py-4">
                    <Button type="submit" disabled={isPending || !form.formState.isDirty}>
                        {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Actualizar Contraseña
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
