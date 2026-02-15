import { pgTable, uuid, text, timestamp, decimal, pgEnum, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- ENUMS ---
export const roleEnum = pgEnum('role', ['OWNER', 'ADMIN', 'MEMBER', 'ACCOUNTANT']);
export const entityTypeEnum = pgEnum('entity_type', ['CLIENT', 'SUPPLIER', 'BOTH']);
export const orderTypeEnum = pgEnum('order_type', ['PURCHASE', 'SALE']);
export const orderStatusEnum = pgEnum('order_status', ['DRAFT', 'CONFIRMED', 'CANCELLED']);

// --- TABLES ---

// 1. Users (Syncs with Supabase Auth)
export const users = pgTable("users", {
    id: uuid("id").primaryKey(),
    email: text("email").notNull().unique(),
    fullName: text("full_name"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. Organizations (Tenants)
export const organizations = pgTable("organizations", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").unique().notNull(),
    taxId: text("tax_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3. Memberships (Many-to-Many Users <-> Orgs)
export const memberships = pgTable("memberships", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
    role: roleEnum("role").default('MEMBER').notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Entities (Clients/Suppliers)
export const entities = pgTable("entities", {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
    type: entityTypeEnum("type").notNull(),
    commercialName: text("commercial_name").notNull(),
    legalName: text("legal_name"),
    taxId: text("tax_id"),
    postalCode: text("postal_code"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 5. Products
export const products = pgTable("products", {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    uom: text("uom"),
    buyPrice: decimal("buy_price", { precision: 12, scale: 2 }).default('0'),
    sellPrice: decimal("sell_price", { precision: 12, scale: 2 }).default('0'),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 6. Orders (Headers)
export const orders = pgTable("orders", {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
    entityId: uuid("entity_id").references(() => entities.id).notNull(),
    type: orderTypeEnum("type").notNull(),
    status: orderStatusEnum("status").default('DRAFT').notNull(),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).default('0'),
    isInvoiced: boolean("is_invoiced").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 7. Order Items (Details)
export const orderItems = pgTable("order_items", {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").references(() => orders.id).notNull(),
    productId: uuid("product_id").references(() => products.id).notNull(),
    quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
    unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
});

// --- RELATIONS ---
export const usersRelations = relations(users, ({ many }) => ({
    memberships: many(memberships),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
    memberships: many(memberships),
    entities: many(entities),
    products: many(products),
    orders: many(orders),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
    user: one(users, { fields: [memberships.userId], references: [users.id] }),
    organization: one(organizations, { fields: [memberships.organizationId], references: [organizations.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
    organization: one(organizations, { fields: [orders.organizationId], references: [organizations.id] }),
    entity: one(entities, { fields: [orders.entityId], references: [entities.id] }),
    items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
    product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));
