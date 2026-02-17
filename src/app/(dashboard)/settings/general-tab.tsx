"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Upload, Loader2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateOrganization, uploadLogo } from "./actions"

const schema = z.object({
    organizationId: z.string(),
    name: z.string(),
    taxId: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface GeneralTabProps {
    organization: {
        id: string
        name: string
        slug: string
        taxId?: string | null
        logoUrl?: string | null
        address?: string | null
        phone?: string | null
        website?: string | null
    }
}

export function GeneralTab({ organization }: GeneralTabProps) {
    const [logoUrl, setLogoUrl] = useState(organization.logoUrl)
    const [isUploading, setIsUploading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            organizationId: organization.id,
            name: organization.name,
            taxId: organization.taxId || "",
            address: organization.address || "",
            phone: organization.phone || "",
            website: organization.website || "",
        },
    })

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            toast.error("El archivo debe pesar menos de 2MB")
            return
        }

        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("organizationId", organization.id)

        const result = await uploadLogo(formData)
        setIsUploading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            setLogoUrl(result.url)
            toast.success("Logo actualizado correctamente")
        }
    }

    const onSubmit = async (data: FormData) => {
        setIsSaving(true)
        const result = await updateOrganization(data)
        setIsSaving(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Información actualizada correctamente")
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Identidad Visual</CardTitle>
                    <CardDescription>
                        Sube el logotipo de tu empresa. Se usará en los PDFs generados.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={logoUrl || ""} alt={organization.name} />
                        <AvatarFallback className="text-2xl">
                            {organization.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                        <Button variant="outline" size="sm" className="relative" disabled={isUploading}>
                            {isUploading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="mr-2 h-4 w-4" />
                            )}
                            {isUploading ? "Subiendo..." : "Cambiar Logo"}
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept="image/png, image/jpeg"
                                onChange={handleLogoUpload}
                                disabled={isUploading}
                            />
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            Recomendado: 400x400px, PNG o JPG. Max 2MB.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Detalles de la Organización</CardTitle>
                    <CardDescription>
                        Actualiza los datos de contacto y facturación.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre de la Empresa</Label>
                                <Input id="name" {...form.register("name")} disabled />
                                <p className="text-xs text-muted-foreground">
                                    Contacta a soporte para cambiar el nombre.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="taxId">RFC / Identificación Fiscal</Label>
                                <Input id="taxId" {...form.register("taxId")} placeholder="XAXX010101000" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input id="phone" {...form.register("phone")} placeholder="+52 55 1234 5678" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website">Sitio Web</Label>
                                <Input id="website" {...form.register("website")} placeholder="https://mi-empresa.com" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address">Dirección Fiscal</Label>
                                <Input id="address" {...form.register("address")} placeholder="Calle, Número, Colonia, Ciudad, Estado, CP" />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                Guardar Cambios
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
