"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Save, User as UserIcon } from "lucide-react"

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { updateProfile } from "./actions"

const profileSchema = z.object({
    fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
})

type ProfileInput = z.infer<typeof profileSchema>

interface ProfileFormProps {
    user: {
        id: string
        email: string
        fullName: string | null
        avatarUrl: string | null
    }
}

export function ProfileForm({ user }: ProfileFormProps) {
    const [isPending, startTransition] = useTransition()

    const form = useForm<ProfileInput>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: user.fullName || "",
        },
    })

    const initials = (user.fullName || user.email)
        .substring(0, 2)
        .toUpperCase()

    const onSubmit = (data: ProfileInput) => {
        startTransition(async () => {
            const result = await updateProfile({ fullName: data.fullName, avatarUrl: user.avatarUrl })
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Perfil actualizado correctamente")
            }
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                    Información Personal
                </CardTitle>
                <CardDescription>
                    Actualiza tu nombre y revisa la cuenta de correo vinculada a tu perfil.
                </CardDescription>
            </CardHeader>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                        <Avatar className="h-20 w-20 border shadow-sm">
                            <AvatarImage src={user.avatarUrl || undefined} />
                            <AvatarFallback className="text-xl bg-primary/10 text-primary">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        {/* Avatar upload could go here in a future update */}
                        <div className="text-sm text-muted-foreground">
                            <p>Tu avatar actual.</p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Nombre Completo</Label>
                            <Input
                                id="fullName"
                                placeholder="Ej. Juan Pérez"
                                {...form.register("fullName")}
                            />
                            {form.formState.errors.fullName && (
                                <p className="text-sm text-red-500">
                                    {form.formState.errors.fullName.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-muted-foreground">Correo Electrónico (No editable)</Label>
                            <Input
                                id="email"
                                type="email"
                                value={user.email}
                                disabled
                                className="bg-muted/50 cursor-not-allowed"
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/20 px-6 py-4">
                    <Button type="submit" disabled={isPending || !form.formState.isDirty}>
                        {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Guardar Cambios
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
