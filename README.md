# Cosmostrak

Sistema administrativo web para Cosmostrak (rastreo GPS vehicular), en reemplazo de la
planilla Excel de gestión de clientes.

## Estructura

- `backend/` — API Express + TypeScript + PostgreSQL.
- `frontend/` — React + Vite + TypeScript.
- `migration/` — planilla Excel original, de referencia para la migración de datos.
- `.claude/CLAUDE.md` — contexto del proyecto para asistencia con IA.

## Requisitos

- Node.js >= 20
- Una instancia de PostgreSQL (ver guía de Railway más abajo)

## Desarrollo local

```bash
npm install

# Backend
cp backend/.env.example backend/.env   # completar DATABASE_URL y JWT_SECRET
npm run migrate --workspace backend    # aplica las migraciones
npm run dev:backend

# Frontend (en otra terminal)
cp frontend/.env.example frontend/.env
npm run dev:frontend
```

## Provisionar PostgreSQL en Railway

1. Entrar a [railway.app](https://railway.app) y crear un proyecto nuevo.
2. Dentro del proyecto: **New** → **Database** → **Add PostgreSQL**.
3. Ir a la pestaña **Variables** del servicio Postgres y copiar `DATABASE_URL`
   (o construirla desde `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`).
4. Pegar esa URL en `backend/.env` como `DATABASE_URL`.
5. Para el despliegue del backend: **New** → **GitHub Repo** → seleccionar este repo,
   configurar el **Root Directory** en `backend` y agregar las mismas variables de
   entorno de `.env.example` en la pestaña **Variables** del servicio.

## Flujo de contribución

- `main` está protegida — no se commitea directo ahí.
- Cada cambio va en una rama nueva → Pull Request → debe pasar el pipeline de
  `devsecops.yml` (lint, auditoría de dependencias, escaneo de secretos) → recién ahí
  se mergea.
- Versionado y changelog se generan automáticamente vía `release-please`.

