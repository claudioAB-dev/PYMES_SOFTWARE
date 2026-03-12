import { createClient } from "@/lib/supabase/server"
import { db } from "@/db"
import { memberships, auditLogs, users } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"
import { ShieldCheck } from "lucide-react"

async function getOrganizationAndRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const userMemberships = await db.query.memberships.findMany({
    where: eq(memberships.userId, user.id),
    with: { organization: true }
  })
  
  if (userMemberships.length === 0) return null

  return {
    organization: userMemberships[0].organization,
    role: userMemberships[0].role
  }
}

export default async function AuditTrailPage() {
  const data = await getOrganizationAndRole()

  if (!data || (data.role !== 'OWNER' && data.role !== 'ADMIN')) {
    redirect('/dashboard')
  }

  const { organization } = data

  const logs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      oldValues: auditLogs.oldValues,
      newValues: auditLogs.newValues,
      ipAddress: auditLogs.ipAddress,
      createdAt: auditLogs.createdAt,
      userFullName: users.fullName,
      userEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(eq(auditLogs.organizationId, organization.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(100)

  const getBadgeColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'UPDATE': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'DELETE': return 'bg-rose-100 text-rose-800 border-rose-200'
      default: return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Registro de Auditoría</h2>
          <p className="text-muted-foreground mt-2">
            Historial inmutable de acciones críticas en el sistema.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white" asChild>
            <Link href="/dashboard/settings/audit/spot-checks">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Auditoría Física Aleatoria
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/settings">Volver a Configuración</Link>
          </Button>
        </div>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha / Hora</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Módulo</TableHead>
              <TableHead className="text-right">Detalles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No hay registros de auditoría aún.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{log.userFullName || 'Usuario'}</div>
                    <div className="text-xs text-muted-foreground">{log.userEmail}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getBadgeColor(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{log.entityType}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Ver Detalles
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detalles de Transacción</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-semibold">ID Entidad:</span> {log.entityId || 'N/A'}
                            </div>
                            <div>
                               <span className="font-semibold">Dirección IP:</span> {log.ipAddress || 'N/A'}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold">Valores Anteriores</h4>
                              <div className="bg-slate-950 text-slate-50 p-3 rounded-md overflow-auto max-h-[300px] text-xs">
                                <pre>{log.oldValues ? JSON.stringify(log.oldValues, null, 2) : 'N/A'}</pre>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold">Nuevos Valores</h4>
                              <div className="bg-slate-950 text-slate-50 p-3 rounded-md overflow-auto max-h-[300px] text-xs">
                                <pre>{log.newValues ? JSON.stringify(log.newValues, null, 2) : 'N/A'}</pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
