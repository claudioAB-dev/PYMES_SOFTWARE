# 🦅 Project Base

> **ERP SaaS & Boilerplate para la Mediana Empresa Mexicana.**

**Base** es un sistema de gestión empresarial (ERP) diseñado para imponer orden en el caos operativo de las PyMEs. A diferencia de los SaaS genéricos, este sistema está construido bajo la filosofía **"80% Roca / 20% Agua"**: un núcleo rígido de procesos inmutables (Inventarios, Tesorería, SAT) y una capa flexible para adaptaciones rápidas.

---

## 🛠️ Tech Stack (The Golden Stack)

Este proyecto utiliza el stack moderno "T3-like" optimizado para rendimiento, tipado estricto y desarrollo rápido ("Vibe Coding").

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router & Server Actions).
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode).
- **Base de Datos:** [PostgreSQL](https://www.postgresql.org/) (vía Supabase).
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/) + Drizzle Kit.
- **Autenticación:** [Supabase Auth](https://supabase.com/auth) (SSR + Middleware).
- **UI:** [Shadcn/UI](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/).
- **Gestor de Paquetes:** [pnpm](https://pnpm.io/) (Estrictamente requerido).

---

## 🚀 Comenzando (Getting Started)

### Prerrequisitos
- **Node.js** v20+ (Recomendamos usar `Volta` o `nvm`).
- **pnpm** instalado globalmente (`npm i -g pnpm`).
- Una cuenta en **Supabase**.

### 1. Instalación
Clona el repositorio e instala las dependencias:

```bash
git clone [https://github.com/tu-usuario/PYMES_SOFTWARE.git](https://github.com/tu-usuario/PYMES_SOFTWARE.git)
cd Base
pnpm install