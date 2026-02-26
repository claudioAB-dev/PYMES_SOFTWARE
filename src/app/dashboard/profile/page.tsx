import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getUserProfile } from "./actions"
import { ProfileForm } from "./profile-form"
import { SecurityForm } from "./security-form"
import { OrganizationsList } from "./organizations-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    UserCircle,
    Building2,
} from "lucide-react"

export default async function ProfilePage() {
    const { success, user, memberships, error } = await getUserProfile()

    if (error || !user) {
        redirect("/login")
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6 max-w-6xl mx-auto w-full">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Mi Perfil</h2>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                        Gestiona tu información personal, seguridad y revisa tus accesos organizacionales.
                    </p>
                </div>
            </div>

            <div className="mt-8">
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                        <TabsTrigger value="general" className="flex items-center gap-2">
                            <UserCircle className="h-4 w-4" />
                            General
                        </TabsTrigger>
                        <TabsTrigger value="organizations" className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Mis Organizaciones
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-6">
                        <TabsContent value="general" className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-[1fr_1fr] lg:grid-cols-[1fr_400px]">
                                <div className="space-y-6">
                                    <Suspense fallback={<div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-lg" />}>
                                        <ProfileForm user={user} />
                                    </Suspense>

                                    <Suspense fallback={<div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-lg" />}>
                                        <SecurityForm />
                                    </Suspense>
                                </div>
                                <div className="hidden lg:block space-y-6">
                                    <div className="rounded-xl bg-primary/5 p-6 border text-sm text-muted-foreground space-y-4 shadow-sm">
                                        <h4 className="font-semibold text-foreground flex items-center mb-2">
                                            <Shield className="h-4 w-4 mr-2 text-primary" />
                                            Consejos de Seguridad
                                        </h4>
                                        <p>
                                            Te recomendamos usar una contraseña de más de 8 caracteres que contenga letras mayúsculas, minúsculas, números y símbolos.
                                        </p>
                                        <p>
                                            No reutilices la contraseña que usas en este sistema para cuentas personales o bancarias.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="organizations" className="space-y-6">
                            <div className="mb-6">
                                <h3 className="text-lg font-medium">Empresas vinculadas</h3>
                                <p className="text-sm text-muted-foreground">
                                    Aquí debajo se listan todas las organizaciones a las que tienes acceso y tu nivel de privilegios correspondiente.
                                </p>
                            </div>

                            <Suspense fallback={
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="h-40 w-full bg-muted/20 animate-pulse rounded-lg" />
                                    <div className="h-40 w-full bg-muted/20 animate-pulse rounded-lg" />
                                </div>
                            }>
                                <OrganizationsList memberships={memberships || []} />
                            </Suspense>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    )
}

// Inline shield icon since lucide-react Shield might be missing depending on import strategy
function Shield(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        </svg>
    )
}
