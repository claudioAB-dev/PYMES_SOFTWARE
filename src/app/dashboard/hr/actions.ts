"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { employees, payrolls, memberships, financialAccounts, treasuryTransactions } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { employeeSchema, EmployeeInput, payrollSlipSchema, PayrollSlipInput } from "@/lib/validators/hr";
import { revalidatePath } from "next/cache";

async function getOrganizationId() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) {
        throw new Error("No organization found");
    }

    return {
        organizationId: userMemberships[0].organizationId,
        role: userMemberships[0].role,
        user
    };
}

const HR_ROLES = ["OWNER", "ADMIN", "ACCOUNTANT"];

// --- Empleados CRUD ---

export async function getEmployees() {
    try {
        const { organizationId, role } = await getOrganizationId();

        if (!HR_ROLES.includes(role)) {
            return [];
        }

        const data = await db.query.employees.findMany({
            where: and(
                eq(employees.organizationId, organizationId)
            ),
            orderBy: [desc(employees.createdAt)],
        });

        return data;
    } catch (error) {
        console.error("Error fetching employees:", error);
        return [];
    }
}

export async function createEmployee(input: EmployeeInput) {
    try {
        const { organizationId, role } = await getOrganizationId();

        if (!HR_ROLES.includes(role)) {
            return { error: "No tienes permisos para crear empleados" };
        }

        const validatedFields = employeeSchema.safeParse(input);

        if (!validatedFields.success) {
            return { error: "Datos inválidos" };
        }

        await db.insert(employees).values({
            organizationId,
            firstName: validatedFields.data.firstName,
            lastName: validatedFields.data.lastName,
            taxId: validatedFields.data.taxId || null,
            socialSecurityNumber: validatedFields.data.socialSecurityNumber || null,
            baseSalary: validatedFields.data.baseSalary.toString(),
            paymentPeriod: validatedFields.data.paymentPeriod,
            isActive: validatedFields.data.isActive,
            joinedAt: validatedFields.data.joinedAt,
        });

        revalidatePath("/dashboard/hr");
        revalidatePath("/dashboard/payroll");
        return { success: true };
    } catch (error: any) {
        console.error("Error creating employee:", error);
        return { error: "Error al crear el empleado" };
    }
}

export async function updateEmployee(employeeId: string, input: Partial<EmployeeInput>) {
    try {
        const { organizationId, role } = await getOrganizationId();

        if (!HR_ROLES.includes(role)) {
            return { error: "No tienes permisos para editar empleados" };
        }

        let updateData: any = {};
        if (input.firstName !== undefined) updateData.firstName = input.firstName;
        if (input.lastName !== undefined) updateData.lastName = input.lastName;
        if (input.taxId !== undefined) updateData.taxId = input.taxId || null;
        if (input.socialSecurityNumber !== undefined) updateData.socialSecurityNumber = input.socialSecurityNumber || null;
        if (input.baseSalary !== undefined) updateData.baseSalary = input.baseSalary.toString();
        if (input.paymentPeriod !== undefined) updateData.paymentPeriod = input.paymentPeriod;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;
        if (input.joinedAt !== undefined) updateData.joinedAt = input.joinedAt;

        updateData.updatedAt = new Date();

        await db
            .update(employees)
            .set(updateData)
            .where(and(eq(employees.id, employeeId), eq(employees.organizationId, organizationId)));

        revalidatePath("/dashboard/hr");
        revalidatePath("/dashboard/payroll");
        return { success: true };
    } catch (error) {
        console.error("Error updating employee:", error);
        return { error: "Error al actualizar el empleado" };
    }
}

// --- Nómina ---

export async function getPayrolls() {
    try {
        const { organizationId, role } = await getOrganizationId();

        if (!HR_ROLES.includes(role)) {
            return [];
        }

        const data = await db.query.payrolls.findMany({
            where: and(
                eq(payrolls.organizationId, organizationId)
            ),
            with: {
                employee: {
                    columns: {
                        firstName: true,
                        lastName: true,
                        taxId: true
                    }
                }
            },
            orderBy: [desc(payrolls.createdAt)],
        });

        return data;
    } catch (error) {
        console.error("Error fetching payrolls:", error);
        return [];
    }
}

export async function generatePayrollSlip(input: PayrollSlipInput) {
    try {
        const { organizationId, role } = await getOrganizationId();

        if (!HR_ROLES.includes(role)) {
            return { error: "No tienes permisos para generar nóminas" };
        }

        const validatedFields = payrollSlipSchema.safeParse(input);

        if (!validatedFields.success) {
            return { error: "Datos de nómina inválidos" };
        }

        const { employeeId, periodStart, periodEnd, grossAmount, deductions } = validatedFields.data;

        // Backend strict calculation of net amount
        const netAmount = grossAmount - deductions;

        if (netAmount < 0) {
            return { error: "El monto neto (bruto - deducciones) no puede ser menor a 0" };
        }

        await db.insert(payrolls).values({
            organizationId,
            employeeId,
            periodStart,
            periodEnd,
            grossAmount: grossAmount.toString(),
            deductions: deductions.toString(),
            netAmount: netAmount.toString(),
            status: 'DRAFT',
        });

        revalidatePath("/dashboard/payroll");
        return { success: true };
    } catch (error: any) {
        console.error("Error generating payroll slip:", error);
        return { error: "Error al generar el recibo de nómina" };
    }
}

export async function markPayrollAsPaid(payrollId: string, paymentMethod: "CASH" | "TRANSFER" | "CARD" | "OTHER", accountId: string, reference?: string) {
    try {
        const { organizationId, role, user } = await getOrganizationId();

        if (!HR_ROLES.includes(role)) {
            return { error: "No tienes permisos para marcar nóminas como pagadas" };
        }

        let success = false;

        // Execute inside a transaction to ensure integrity if we later plug it into a general ledger
        await db.transaction(async (tx) => {
            const payroll = await tx.query.payrolls.findFirst({
                where: and(eq(payrolls.id, payrollId), eq(payrolls.organizationId, organizationId)),
            });

            if (!payroll) {
                throw new Error("Recibo de nómina no encontrado");
            }

            if (payroll.status === 'PAID') {
                throw new Error("Esta nómina ya fue marcada como pagada");
            }

            // Verify Account
            const account = await tx.query.financialAccounts.findFirst({
                where: and(
                    eq(financialAccounts.id, accountId),
                    eq(financialAccounts.organizationId, organizationId)
                )
            });

            if (!account) throw new Error("Cuenta financiera no encontrada");

            // Update Payroll
            await tx
                .update(payrolls)
                .set({
                    status: 'PAID',
                    paymentDate: new Date(),
                    updatedAt: new Date()
                })
                .where(eq(payrolls.id, payrollId));

            // Insert Treasury Transaction
            const amount = Number(payroll.netAmount);

            await tx.insert(treasuryTransactions).values({
                organizationId,
                accountId,
                type: 'EXPENSE',
                category: 'PAYROLL',
                amount: payroll.netAmount.toString(),
                referenceId: payrollId,
                description: reference ? `Pago nómina: ${reference}` : `Pago nómina #${payrollId.substring(0, 8)}`,
                createdBy: user.id
            });

            // Update Account Balance
            await tx.update(financialAccounts)
                .set({ balance: sql`${financialAccounts.balance} - ${amount}` })
                .where(eq(financialAccounts.id, accountId));

            success = true;
        });

        if (success) {
            revalidatePath("/dashboard/payroll");
            return { success: true };
        }

        return { error: "No se pudo completar el pago de la nómina" };
    } catch (error: any) {
        console.error("Error marking payroll as paid:", error);
        return { error: error.message || "Error al registrar el pago" };
    }
}
