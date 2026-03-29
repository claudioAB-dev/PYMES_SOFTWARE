# Documento de Especificación de Módulos y Funcionalidades (Estado Actual)
**Sistema:** Axioma ERP multi-tenant

## 1. Axioma Pro (Core ERP para PyMEs)

*   **Administración y Configuración**
    *   **Módulo de Organizaciones / Entidades (Tenants):** Rutas de perfil (`dashboard/profile`, `dashboard/settings`) y gestión de entidades como clientes y proveedores (`dashboard/entities`).
        *   *Capacidad Actual:* CRUD básico respaldado por la tabla `entities` para tipificar contactos, control de límites de crédito y configuración de datos fiscales (RFC, Régimen, CP).
    *   **Gestión de Accesos (RBAC):** Rutas de auth e invitaciones (`auth/invite`, tabla `invitations`).
        *   *Capacidad Actual:* Registro, envío de invitaciones, y asignación de roles mediante `memberships` y `custom_roles` en la organización activa.
    *   **Auditoría:** Rutas (`settings/audit/` y `settings/audit/spot-checks`).
        *   *Capacidad Actual:* [WIP] Visor analítico de logs de auditoría apoyado en la tabla `audit_logs` que registra histórico de cambios en JSON.

*   **Ventas y Compras (Gestión Comercial)**
    *   **Módulo de Productos/Servicios:** Ruta (`dashboard/products/`).
        *   *Capacidad Actual:* CRUD operativo de catálogo en tabla `products`. Soporta costeo, precios, tipificación (servicios vs bienes), control de stock y vinculación con catálogos del SAT (`sat_claves_prod_serv`).
    *   **Módulo de Órdenes:** Rutas para ventas (`dashboard/orders/`) y compras (`dashboard/purchases/`).
        *   *Capacidad Actual:* CRUD de cabeceras (`orders`) y partidas (`order_items`). Asignación manual de estatus de envío, retenciones, impuestos y generación de links o PDFs estáticos. [Planned] Emisión de Facturas y timbrado con PAC (Aún no integrado para generación directa de CFDI).
    *   **Cuentas por Cobrar/Pagar:** Rutas de pagos (`dashboard/receivables/` / `dashboard/billing/`).
        *   *Capacidad Actual:* [WIP] Visor analítico de deudas integrado con la tabla `payments` y registro manual de depósitos/cobros sin automatización contable integral aún.

*   **Inventario y Almacén**
    *   **Módulo de Movimientos (Kardex):** Base estructural (`inventory_movements`).
        *   *Capacidad Actual:* [WIP] Soporte en base de datos para registrar bitácora de entradas, salidas, devoluciones y ajustes por producto sin una vista especializada de reporteo individual consolidada.

*   **Finanzas, Tesorería y RRHH**
    *   **Tesorería y Bancos:** Ruta (`dashboard/treasury/`).
        *   *Capacidad Actual:* CRUD de cuentas bancarias y de caja (`financial_accounts`) y captura de bitácora manual de transacciones de ingreso, egreso o transferencias (`treasury_transactions`).
    *   **Recursos Humanos:** Ruta (`dashboard/hr/`).
        *   *Capacidad Actual:* Tabla y formulario para el CRUD de empleados (`employees`), documentando salario base, periodicidad de pago y datos maestros (RFC/NSS).
    *   **Nómina:** Ruta (`dashboard/payroll/`).
        *   *Capacidad Actual:* [WIP] Generación de base de recibos (`payrolls`) que requieren de captura manual/directa de deducciones y retenciones, sin un motor que calcule automáticamente las cuotas IMSS o el ISR mexicano actualmente.

---

## 2. Axioma Manufactura (Especialización Industrial)

*   **Gestión de Materiales**
    *   **Módulo de Materia Prima:** Ruta (`dashboard/manufacturing/raw-materials/`).
        *   *Capacidad Actual:* Visor especializado que filtra el catálogo general exclusivamente hacia insumos de manufactura.
    *   **Lista de Materiales / BOM:** Ruta (`dashboard/manufacturing/bom/`).
        *   *Capacidad Actual:* Construcción de recetas de producto ligando el esquema `bom_lines`. Asignación de cantidades requeridas, costos unitarios y fijación de factor de merma (Scrap).

*   **Control de Producción**
    *   **Órdenes de Producción:** Ruta (`dashboard/manufacturing/orders/`).
        *   *Capacidad Actual:* Generación algorítmica de órdenes a partir de la preconfiguración del BOM sobre productos factibles (`finished_good` o `sub_assembly`), operando en `production_orders` y `production_order_materials`.
    *   **Planeación (Planner):** Ruta (`dashboard/manufacturing/planner/`).
        *   *Capacidad Actual:* [WIP] Visor de planeación estilo calendario para mapear visualmente las fechas de inicio/fin de producción. Actualmente opera como un visor de consultas sin capacidad de interacción y modificación ("Drag & Drop").
    *   **Lotes y Trazabilidad (Inventario Avanzado):** Base estructural (`product_batches`).
        *   *Capacidad Actual:* [WIP] Estructura transaccional en Drizzle disponible para amarrar la orden de producción terminada a un número de lote, fecha de fabricación y caducidad para seguimiento posterior.

---

## 3. Axioma para Contadores (Portal/Herramientas Fiscales)

*   **Bóveda y Panel de Asesores**
    *   **Vista Multi-Cliente:** Ruta (`accountant/organizations/`).
        *   *Capacidad Actual:* Portal maestro donde el rol `ACCOUNTANT` u `OWNER` puede visualizar e iterar entre los diferentes inquilinos (clientes finales de Axioma) a los que ha sido invitado bajo su membresía.

*   **Flujo Financiero y Fiscal**
    *   **Sincronización SAT:** Ruta (`accountant/sat-sync/`).
        *   *Capacidad Actual:* Módulo asíncrono pasivo para autorizar peticiones de descarga masiva de XMLs almacenando en bóveda credenciales FIEL/CSD. Incluye alternativa para carga/importación estrictamente manual de los archivos.
    *   **Repositorio de Comprobantes (Invoices):** Ruta (`accountant/invoices/`).
        *   *Capacidad Actual:* Listado y almacenamiento persistente de la metadata extraída de los CFDI descargados (`fiscal_documents`): RFC emisor/receptor, validación de subtotales, impuestos, garantizando almacenamiento en nube remota del PDF y XML en base a un UUID único.
    *   **Conciliación Fiscal:** Rutas (`accountant/reconciliation/` y `accountant/conciliacion/`).
        *   *Capacidad Actual:* [WIP] Visor de auditoría de hojas divididas diseñado para uso del contador público, facilitando la comparación lado a lado de los XML validados del SAT contra los registros transaccionales manuales del módulo de Ventas/Compras de Axioma Pro.
