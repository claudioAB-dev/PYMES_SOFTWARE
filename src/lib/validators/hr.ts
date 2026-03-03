import { z } from "zod";

export const employeeSchema = z.object({
    firstName: z.string().min(1, "El nombre es requerido"),
    lastName: z.string().min(1, "El apellido es requerido"),
    taxId: z.string().optional(),
    socialSecurityNumber: z.string().optional(),
    baseSalary: z.coerce.number().min(0, "El salario base no puede ser negativo"),
    paymentPeriod: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]),
    isActive: z.boolean().default(true),
    joinedAt: z.coerce.date(),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;

export const createEmployeeSchema = z.object({
    firstName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
    lastName: z.string().min(2, { message: "El apellido debe tener al menos 2 caracteres" }),
    taxId: z.string().optional(),
    socialSecurityNumber: z.string().optional(),
    baseSalary: z.coerce.number().min(0, { message: "El salario base no puede ser negativo" }),
    paymentPeriod: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"], {
        required_error: "Seleccione un periodo de pago",
    }),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const createPayrollSchema = z.object({
    employeeId: z.string().uuid({ message: "Empleado inválido" }),
    periodStart: z.coerce.date(),
    periodEnd: z.coerce.date(),
    grossAmount: z.coerce.number().min(0, { message: "El monto bruto no puede ser negativo" }),
    deductions: z.coerce.number().min(0, { message: "Las deducciones no pueden ser negativas" }),
});

export type CreatePayrollInput = z.infer<typeof createPayrollSchema>;

export const payrollSlipSchema = z.object({
    employeeId: z.string().uuid("Empleado inválido"),
    periodStart: z.coerce.date(),
    periodEnd: z.coerce.date(),
    grossAmount: z.coerce.number().min(0, "El monto bruto no puede ser negativo"),
    deductions: z.coerce.number().min(0, "Las deducciones no pueden ser negativas"),
    // netAmount is calculated on the server
});

export type PayrollSlipInput = z.infer<typeof payrollSlipSchema>;
