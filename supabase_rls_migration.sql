-- =========================================================================================
-- SCRIPT DE MIGRACIÓN: MULTI-TENANT ROW LEVEL SECURITY (RLS)
-- Descripción: Activa RLS en todas las tablas y protege columnas sensibles en Supabase
-- =========================================================================================

-- 1. Habilitar RLS en todas las tablas mencionadas
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sat_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payrolls" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fiscal_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "financial_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_movements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "treasury_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "entities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;

-- =========================================================================================
-- POLÍTICAS ESPECÍFICAS
-- =========================================================================================

-- 2. Políticas para 'users'
-- Un usuario solo puede hacer SELECT/UPDATE a su propio registro.
DROP POLICY IF EXISTS "Users can view own data" ON "users";
CREATE POLICY "Users can view own data" ON "users" FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON "users";
CREATE POLICY "Users can update own data" ON "users" FOR UPDATE USING (auth.uid() = id);

-- 3. Políticas para 'memberships'
-- Un usuario solo puede ver las membresías donde su user_id sea igual a auth.uid().
DROP POLICY IF EXISTS "Memberships view own" ON "memberships";
CREATE POLICY "Memberships view own" ON "memberships" FOR SELECT USING (auth.uid() = user_id);

-- 4. Políticas para 'invitations'
-- SELECT: Si su email autenticado coincide OR si pertenece a la organización y tiene un rol ADMIN u OWNER.
DROP POLICY IF EXISTS "Invitations select" ON "invitations";
CREATE POLICY "Invitations select" ON "invitations" FOR SELECT USING (
    email = (auth.jwt() ->> 'email') OR 
    organization_id IN (
        SELECT organization_id FROM memberships 
        WHERE user_id = auth.uid() AND role IN ('ADMIN', 'OWNER')
    )
);

-- INSERT/UPDATE/DELETE: Solo si pertenece a la organización. 
-- (Puedes restringirlo a validaciones de ADMIN/OWNER también si es necesario)
DROP POLICY IF EXISTS "Invitations modify" ON "invitations";
CREATE POLICY "Invitations modify" ON "invitations" FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
);

-- 5. Políticas para 'organizations'
-- No tiene 'organization_id', sino 'id'. Acceso solo a organizaciones en las que es miembro.
DROP POLICY IF EXISTS "Organization access" ON "organizations";
CREATE POLICY "Organization access" ON "organizations" FOR ALL USING (
    id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
);

-- 6. Políticas para 'order_items'
-- No tiene 'organization_id', usa 'order_id' para validar a través de orders.
DROP POLICY IF EXISTS "Order Items Access" ON "order_items";
CREATE POLICY "Order Items Access" ON "order_items" FOR ALL USING (
    order_id IN (
        SELECT id FROM orders WHERE organization_id IN (
            SELECT organization_id FROM memberships WHERE user_id = auth.uid()
        )
    )
);

-- =========================================================================================
-- POLÍTICAS GENERALES (MULTI-TENANT ISOLATION)
-- PARA TODAS LAS TABLAS QUE INCLUYEN 'organization_id'
-- =========================================================================================

-- Tabla: products
DROP POLICY IF EXISTS "Products Tenant Isolation" ON "products";
CREATE POLICY "Products Tenant Isolation" ON "products" FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
);

-- Tabla: sat_requests
DROP POLICY IF EXISTS "Sat Requests Tenant Isolation" ON "sat_requests";
CREATE POLICY "Sat Requests Tenant Isolation" ON "sat_requests" FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
);

-- Tabla: employees
DROP POLICY IF EXISTS "Employees Tenant Isolation" ON "employees";
CREATE POLICY "Employees Tenant Isolation" ON "employees" FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
);

-- Tabla: payrolls
DROP POLICY IF EXISTS "Payrolls Tenant Isolation" ON "payrolls";
CREATE POLICY "Payrolls Tenant Isolation" ON "payrolls" FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
);

-- Tabla: fiscal_documents
DROP POLICY IF EXISTS "Fiscal Documents Tenant Isolation" ON "fiscal_documents";
CREATE POLICY "Fiscal Documents Tenant Isolation" ON "fiscal_documents" FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
);

-- Tabla: financial_accounts
DROP POLICY IF EXISTS "Financial Accounts Tenant Isolation" ON "financial_accounts";
CREATE POLICY "Financial Accounts Tenant Isolation" ON "financial_accounts" FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
);

-- Tabla: inventory_movements
DROP POLICY IF EXISTS "Inventory Movements Tenant Isolation" ON "inventory_movements";
CREATE POLICY "Inventory Movements Tenant Isolation" ON "inventory_movements" FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
);

-- Tabla: orders
DROP POLICY IF EXISTS "Orders Tenant Isolation" ON "orders";
CREATE POLICY "Orders Tenant Isolation" ON "orders" FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
);

-- Tabla: treasury_transactions
DROP POLICY IF EXISTS "Treasury Transactions Tenant Isolation" ON "treasury_transactions";
CREATE POLICY "Treasury Transactions Tenant Isolation" ON "treasury_transactions" FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
);

-- Tabla: entities
DROP POLICY IF EXISTS "Entities Tenant Isolation" ON "entities";
CREATE POLICY "Entities Tenant Isolation" ON "entities" FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
);

-- Tabla: payments
DROP POLICY IF EXISTS "Payments Tenant Isolation" ON "payments";
CREATE POLICY "Payments Tenant Isolation" ON "payments" FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
);
