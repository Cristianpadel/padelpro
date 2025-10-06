# 🚀 Guía de Despliegue - PadelPro

## 📋 Índice
1. [Opción 1: Vercel (Recomendada)](#opción-1-vercel-recomendada-)
2. [Opción 2: Railway](#opción-2-railway)
3. [Opción 3: Fly.io](#opción-3-flyio)
4. [Configuración de Base de Datos](#configuración-de-base-de-datos)
5. [Variables de Entorno](#variables-de-entorno)

---

## Opción 1: Vercel (Recomendada) ⭐

### 🎯 ¿Por qué Vercel?
- Diseñado específicamente para Next.js
- Despliegue automático desde GitHub
- SSL gratuito y CDN global
- Plan gratuito muy generoso
- Perfecto para tu proyecto

### 📝 Pasos para Desplegar:

#### 1. Preparar el Proyecto

```bash
# 1. Asegúrate de que todo funciona localmente
npm run dev

# 2. Crea un build de producción para probar
npm run build

# 3. Prueba el build
npm start
```

#### 2. Subir a GitHub

```bash
# Inicializar repositorio (si no lo has hecho)
git init

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Preparar para despliegue en Vercel"

# Crear repositorio en GitHub y conectarlo
git remote add origin https://github.com/tu-usuario/padelpro.git
git branch -M main
git push -u origin main
```

#### 3. Desplegar en Vercel

1. **Crear cuenta en Vercel:**
   - Ve a https://vercel.com
   - Regístrate con tu cuenta de GitHub

2. **Importar Proyecto:**
   - Click en "New Project"
   - Selecciona tu repositorio "padelpro"
   - Vercel detectará automáticamente que es Next.js

3. **Configurar Variables de Entorno:**
   ```
   DATABASE_URL=file:./prisma/dev.db
   NODE_ENV=production
   ```

4. **Deploy:**
   - Click en "Deploy"
   - Espera 2-3 minutos
   - ¡Tu app estará online en https://tu-proyecto.vercel.app!

#### 4. Configuraciones Adicionales

**vercel.json** (crear en la raíz del proyecto):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "DATABASE_URL": "@database_url"
  }
}
```

**package.json** - Asegúrate de tener estos scripts:
```json
{
  "scripts": {
    "dev": "next dev -p 9002",
    "build": "prisma generate && next build",
    "start": "next start",
    "postinstall": "prisma generate"
  }
}
```

---

## Opción 2: Railway 🚂

### 🎯 Ventajas:
- Soporta SQLite nativamente
- Base de datos persistente
- Despliegue desde GitHub
- $5 gratis al mes

### 📝 Pasos:

1. **Crear cuenta en Railway:**
   - Ve a https://railway.app
   - Regístrate con GitHub

2. **Nuevo Proyecto:**
   - "New Project" → "Deploy from GitHub repo"
   - Selecciona tu repositorio

3. **Configurar Variables:**
   ```
   DATABASE_URL=file:/app/prisma/dev.db
   NODE_ENV=production
   ```

4. **Agregar Volumen Persistente:**
   - En el panel de Railway, añade un volumen
   - Mount path: `/app/prisma`
   - Esto asegura que la DB no se borre

5. **Deploy:**
   - Railway desplegará automáticamente
   - URL: https://tu-proyecto.up.railway.app

---

## Opción 3: Fly.io 🪰

### 🎯 Ventajas:
- Muy bueno para SQLite
- Volúmenes persistentes nativos
- Control total del servidor

### 📝 Pasos:

1. **Instalar Fly CLI:**
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Login:**
   ```bash
   fly auth login
   ```

3. **Inicializar App:**
   ```bash
   fly launch
   ```

4. **Crear Volumen:**
   ```bash
   fly volumes create padelpro_data --size 1
   ```

5. **Configurar fly.toml:**
   ```toml
   [mounts]
     source = "padelpro_data"
     destination = "/app/prisma"
   ```

6. **Deploy:**
   ```bash
   fly deploy
   ```

---

## 🗄️ Configuración de Base de Datos

### Para Producción: Migrar a PostgreSQL (Recomendado)

SQLite funciona bien en desarrollo, pero para producción es mejor PostgreSQL:

#### 1. Actualizar schema.prisma:

```prisma
datasource db {
  provider = "postgresql"  // Cambiar de sqlite a postgresql
  url      = env("DATABASE_URL")
}
```

#### 2. Crear Base de Datos:

**Opción A: Supabase (Gratis)**
1. Ve a https://supabase.com
2. Crea proyecto gratis
3. Copia la URL de conexión
4. Formato: `postgresql://user:password@host:5432/database`

**Opción B: Neon (Gratis)**
1. Ve a https://neon.tech
2. Crea base de datos serverless
3. Copia la connection string

#### 3. Aplicar Migraciones:

```bash
# Cambiar DATABASE_URL en .env a la nueva PostgreSQL
DATABASE_URL="postgresql://..."

# Generar nueva migración
npx prisma migrate dev --name switch_to_postgresql

# Aplicar en producción
npx prisma migrate deploy
```

#### 4. Poblar Base de Datos:

```bash
# Ejecutar seed
npx prisma db seed
```

---

## 🔐 Variables de Entorno

### Desarrollo (.env.local):
```env
DATABASE_URL="file:./prisma/dev.db"
NODE_ENV="development"
NEXT_PUBLIC_API_URL="http://localhost:9002"
```

### Producción (Vercel/Railway):
```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
NODE_ENV="production"
NEXT_PUBLIC_API_URL="https://tu-dominio.vercel.app"
```

---

## ✅ Checklist Pre-Despliegue

Antes de desplegar, asegúrate de:

- [ ] `npm run build` funciona sin errores
- [ ] Todas las variables de entorno están configuradas
- [ ] `.gitignore` incluye `.env*`, `node_modules/`, `.next/`
- [ ] Prisma schema está actualizado
- [ ] Las migraciones están aplicadas
- [ ] Los scripts de package.json incluyen `postinstall: prisma generate`
- [ ] Has probado en modo producción localmente

---

## 🚀 Comandos Útiles

```bash
# Build local
npm run build

# Ejecutar en modo producción
npm start

# Ver logs en Vercel
vercel logs

# Ver logs en Railway
railway logs

# Ver logs en Fly.io
fly logs
```

---

## 🌐 Dominios Personalizados

### Vercel:
1. Ve a Project Settings → Domains
2. Agrega tu dominio
3. Configura DNS según las instrucciones

### Railway:
1. Settings → Domains
2. Agrega dominio personalizado
3. Actualiza registros DNS

---

## 📊 Monitoreo

### Vercel Analytics:
- Habilitado automáticamente
- Ve a Analytics en el dashboard

### Sentry (Errores):
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

---

## 🔄 Despliegue Continuo

Con GitHub conectado:
- Cada `git push` → Despliegue automático
- Pull Requests → Preview deployments
- Main branch → Producción

---

## 💡 Recomendación Final

**Para tu proyecto PadelPro:**

1. **Opción Rápida (5 minutos):**
   - Usa Vercel con SQLite
   - Perfecto para demo/prototipo

2. **Opción Profesional (30 minutos):**
   - Vercel + Supabase (PostgreSQL)
   - Escalable y robusto

3. **Deploy Completo:**
   ```bash
   # 1. Push a GitHub
   git push origin main
   
   # 2. Conectar a Vercel
   # 3. Agregar variables de entorno
   # 4. Deploy!
   ```

**Tu app estará en:**
`https://padelpro.vercel.app` 🎉

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs: `vercel logs` o en el dashboard
2. Verifica variables de entorno
3. Asegúrate de que `prisma generate` se ejecutó
4. Revisa que todas las dependencias están en `package.json`

---

**¡Buena suerte con el despliegue!** 🚀🎾
