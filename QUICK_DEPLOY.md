# 🚀 Despliegue Rápido - 5 Minutos

## Opción 1: Usando el Script Automático (Windows)

```powershell
.\deploy.ps1
```

Este script automáticamente:
- ✅ Verifica tu código
- ✅ Hace build de prueba
- ✅ Sube cambios a GitHub
- ✅ Te da instrucciones claras

## Opción 2: Paso a Paso Manual

### 1️⃣ Preparar el Código

```bash
# Probar que todo funciona
npm run build

# Ver si hay errores
npm run lint
```

### 2️⃣ Subir a GitHub

```bash
# Agregar cambios
git add .

# Hacer commit
git commit -m "Preparar para producción"

# Subir a GitHub
git push origin main
```

### 3️⃣ Desplegar en Vercel

1. **Ve a:** https://vercel.com
2. **Regístrate** con tu cuenta de GitHub
3. **New Project** → Selecciona "padelpro"
4. **Configurar:**
   ```
   Framework: Next.js (detectado automáticamente)
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

5. **Variables de Entorno:**
   ```
   DATABASE_URL = file:./prisma/dev.db
   NODE_ENV = production
   ```

6. **Deploy** → ¡Espera 2-3 minutos!

### 4️⃣ ¡Listo! 🎉

Tu app estará en: `https://padelpro.vercel.app` (o el nombre que elijas)

---

## 🔧 Troubleshooting

### Error: "Module not found"
```bash
npm install
npm run build
```

### Error: "Prisma Client not generated"
```bash
npx prisma generate
npm run build
```

### Error en despliegue:
1. Ve a Vercel Dashboard
2. Click en "Deployments"
3. Click en el deployment fallido
4. Revisa los logs
5. Normalmente es una variable de entorno faltante

---

## 📊 Monitoreo Post-Despliegue

### Ver logs en tiempo real:
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Ver logs
vercel logs
```

### Verificar que todo funciona:
1. Ve a tu URL de Vercel
2. Prueba hacer login
3. Prueba reservar una clase
4. Revisa el panel de admin

---

## 🔄 Actualizaciones Futuras

Cada vez que hagas cambios:

```bash
git add .
git commit -m "Descripción de cambios"
git push origin main
```

Vercel detectará el push y desplegará automáticamente ✨

---

## 💡 Tips

- **Custom Domain:** Puedes agregar tu propio dominio en Vercel (ej: www.padelpro.com)
- **Environment Variables:** Actualízalas en Vercel Dashboard → Settings → Environment Variables
- **Analytics:** Vercel incluye analytics gratis
- **Preview Deployments:** Cada Pull Request tiene su propia URL de preview

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa `DEPLOYMENT_GUIDE.md` para guía completa
2. Verifica los logs en Vercel Dashboard
3. Asegúrate de que `npm run build` funciona localmente

---

**¡Buena suerte! 🎾🚀**
