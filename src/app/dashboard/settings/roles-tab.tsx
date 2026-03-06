"use client"

import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Plus, Shield, ShieldAlert, ShieldCheck, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { insertCustomRoleSchema, type InsertCustomRoleInput, AVAILABLE_PERMISSIONS } from "@/lib/validators/team"
import { createCustomRole, updateCustomRole, deleteCustomRole } from "./team/actions"
import { MoreVertical, Edit2, Trash2 } from "lucide-react"

interface CustomRole {
    id: string;
    organizationId: string;
    name: string;
    description: string | null;
    permissions: any;
    createdAt: Date;
    updatedAt: Date;
}

export function RolesTab({
    organizationId,
    roles
}: {
    organizationId: string
    roles: CustomRole[]
}) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    // State for editing and deleting
    const [editingRoleId, setEditingRoleId] = useState<string | null>(null)
    const [roleToDelete, setRoleToDelete] = useState<string | null>(null)

    const form = useForm<InsertCustomRoleInput>({
        resolver: zodResolver(insertCustomRoleSchema) as any,
        defaultValues: {
            name: "",
            description: "",
            permissions: [],
        },
    })

    const permissionsGrouped = AVAILABLE_PERMISSIONS.reduce((acc, curr) => {
        if (!acc[curr.category]) acc[curr.category] = []
        acc[curr.category].push(curr)
        return acc
    }, {} as Record<string, typeof AVAILABLE_PERMISSIONS>)

    const onSubmit = async (data: InsertCustomRoleInput) => {
        startTransition(async () => {
            if (editingRoleId) {
                const result = await updateCustomRole({ ...data, id: editingRoleId }, organizationId)
                if (result.error) {
                    toast.error(result.error)
                } else {
                    toast.success("Rol actualizado correctamente")
                    setOpen(false)
                }
            } else {
                const result = await createCustomRole(data, organizationId)
                if (result.error) {
                    toast.error(result.error)
                } else {
                    toast.success("Rol creado correctamente")
                    setOpen(false)
                }
            }
        })
    }

    const handleDelete = async () => {
        if (!roleToDelete) return;

        startTransition(async () => {
            const result = await deleteCustomRole(roleToDelete, organizationId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Rol eliminado correctamente")
            }
            setRoleToDelete(null)
        })
    }

    // Opens sheet in edit mode
    const handleEditClick = (role: CustomRole) => {
        setEditingRoleId(role.id)
        form.reset({
            name: role.name,
            description: role.description || "",
            permissions: role.permissions || [],
        })
        setOpen(true)
    }

    // Opens sheet in create mode
    const handleCreateClick = () => {
        setEditingRoleId(null)
        form.reset({
            name: "",
            description: "",
            permissions: [],
        })
        setOpen(true)
    }

    const togglePermission = (id: string, checked: boolean) => {
        const current = form.getValues().permissions || []
        if (checked) {
            form.setValue("permissions", [...current, id])
        } else {
            form.setValue("permissions", current.filter(p => p !== id))
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Roles Personalizados</h3>
                    <p className="text-sm text-muted-foreground">
                        Gestiona los roles y permisos de acceso para tu equipo.
                    </p>
                </div>

                <Sheet open={open} onOpenChange={setOpen}>
                    <Button onClick={handleCreateClick}>
                        <Plus className="mr-2 h-4 w-4" />
                        Crear Rol
                    </Button>
                    <SheetContent className="sm:max-w-lg overflow-y-auto w-full">
                        <SheetHeader className="mb-6">
                            <SheetTitle>{editingRoleId ? "Editar Rol Personalizado" : "Nuevo Rol Personalizado"}</SheetTitle>
                            <SheetDescription>
                                {editingRoleId
                                    ? "Modifica los detalles y permisos de este rol."
                                    : "Define un nuevo rol con permisos específicos para tu organización."}
                            </SheetDescription>
                        </SheetHeader>

                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nombre del Rol</Label>
                                    <Input
                                        id="name"
                                        placeholder="Ej. Gerente de Producción"
                                        {...form.register("name")}
                                    />
                                    {form.formState.errors.name && (
                                        <p className="text-sm text-red-500">
                                            {form.formState.errors.name.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Descripción (Opcional)</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Descripción de las responsabilidades..."
                                        {...form.register("description")}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-medium text-sm border-b pb-2">Permisos del Sistema</h4>
                                <div className="space-y-6">
                                    {Object.entries(permissionsGrouped).map(([category, perms]) => (
                                        <div key={category} className="space-y-3">
                                            <h5 className="text-sm font-semibold text-muted-foreground">{category}</h5>
                                            <div className="space-y-3 pl-2">
                                                {perms.map(p => {
                                                    const isChecked = form.watch("permissions")?.includes(p.id) || false;
                                                    return (
                                                        <div key={p.id} className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                            <div className="space-y-0.5">
                                                                <Label className="text-base">{p.name}</Label>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Permite {p.name.toLowerCase()} en el sistema.
                                                                </p>
                                                            </div>
                                                            <Switch
                                                                checked={isChecked}
                                                                onCheckedChange={(checked) => togglePermission(p.id, checked)}
                                                            />
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                )}
                                {editingRoleId ? "Actualizar Rol" : "Guardar Rol"}
                            </Button>
                        </form>
                    </SheetContent>
                </Sheet>
            </div>

            {roles.length === 0 ? (
                <Card className="border-dashed bg-muted/50">
                    <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                        <ShieldAlert className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="font-semibold text-lg mb-1">Sin roles personalizados</h3>
                        <p className="text-muted-foreground text-sm max-w-sm">
                            Aún no has creado ningún rol. Utiliza el botón de "Crear Rol" para empezar a definir accesos granulares.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {roles.map(role => (
                        <Card key={role.id} className="transition-all hover:shadow-md flex flex-col">
                            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0 relative">
                                <div className="space-y-1 pr-6">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Shield className="h-4 w-4 text-blue-500" />
                                        {role.name}
                                    </CardTitle>
                                    {role.description && (
                                        <CardDescription>{role.description}</CardDescription>
                                    )}
                                </div>
                                <div className="absolute top-4 right-4">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Abrir menú</span>
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEditClick(role)}>
                                                <Edit2 className="mr-2 h-4 w-4" />
                                                <span>Editar Rol</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => setRoleToDelete(role.id)}
                                                className="text-red-600 focus:text-red-600"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>Eliminar Rol</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Permisos asignados:</h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {role.permissions?.map((perm: string) => {
                                            const pInfo = AVAILABLE_PERMISSIONS.find(p => p.id === perm)
                                            return (
                                                <span key={perm} className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                                                    {pInfo ? pInfo.name : perm}
                                                </span>
                                            )
                                        })}
                                        {(!role.permissions || role.permissions.length === 0) && (
                                            <span className="text-xs text-muted-foreground italic">Ninguno</span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <AlertDialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará el rol personalizado de forma permanente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            disabled={isPending}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Eliminar Rol
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
