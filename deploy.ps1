# 🚀 Script de Despliegue Rápido

Write-Host "🎾 PadelPro - Despliegue a Producción" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""

# 1. Verificar que estamos en la rama correcta
Write-Host "📋 Paso 1: Verificando rama actual..." -ForegroundColor Cyan
$branch = git branch --show-current
Write-Host "   Rama actual: $branch" -ForegroundColor Yellow

if ($branch -ne "main" -and $branch -ne "master") {
    Write-Host "⚠️  Advertencia: No estás en main/master" -ForegroundColor Yellow
    $continue = Read-Host "¿Continuar de todos modos? (s/n)"
    if ($continue -ne "s") {
        Write-Host "❌ Despliegue cancelado" -ForegroundColor Red
        exit
    }
}

# 2. Verificar cambios sin commit
Write-Host ""
Write-Host "📋 Paso 2: Verificando cambios pendientes..." -ForegroundColor Cyan
$status = git status --porcelain
if ($status) {
    Write-Host "   ⚠️  Tienes cambios sin commit" -ForegroundColor Yellow
    Write-Host ""
    git status --short
    Write-Host ""
    $commit = Read-Host "¿Hacer commit de estos cambios? (s/n)"
    if ($commit -eq "s") {
        $message = Read-Host "Mensaje del commit"
        git add .
        git commit -m "$message"
        Write-Host "   ✅ Commit realizado" -ForegroundColor Green
    }
}

# 3. Probar build localmente
Write-Host ""
Write-Host "📋 Paso 3: Probando build de producción..." -ForegroundColor Cyan
Write-Host "   Ejecutando: npm run build" -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en el build. Revisa los errores arriba." -ForegroundColor Red
    exit
}
Write-Host "   ✅ Build exitoso" -ForegroundColor Green

# 4. Push a GitHub
Write-Host ""
Write-Host "📋 Paso 4: Subiendo cambios a GitHub..." -ForegroundColor Cyan
git push origin $branch

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al hacer push. Verifica tu conexión a GitHub." -ForegroundColor Red
    exit
}
Write-Host "   ✅ Código subido a GitHub" -ForegroundColor Green

# 5. Instrucciones finales
Write-Host ""
Write-Host "🎉 ¡Preparación completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 PRÓXIMOS PASOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si AÚN NO has desplegado en Vercel:" -ForegroundColor Yellow
Write-Host "1. Ve a https://vercel.com" -ForegroundColor White
Write-Host "2. Inicia sesión con tu cuenta de GitHub" -ForegroundColor White
Write-Host "3. Click en 'New Project'" -ForegroundColor White
Write-Host "4. Selecciona el repositorio 'padelpro'" -ForegroundColor White
Write-Host "5. Agrega estas variables de entorno:" -ForegroundColor White
Write-Host "   DATABASE_URL=file:./prisma/dev.db" -ForegroundColor Gray
Write-Host "   NODE_ENV=production" -ForegroundColor Gray
Write-Host "6. Click en 'Deploy'" -ForegroundColor White
Write-Host ""
Write-Host "Si YA desplegaste en Vercel:" -ForegroundColor Yellow
Write-Host "✅ Vercel detectará el push automáticamente" -ForegroundColor White
Write-Host "✅ En 2-3 minutos tu sitio estará actualizado" -ForegroundColor White
Write-Host "✅ URL: https://tu-proyecto.vercel.app" -ForegroundColor White
Write-Host ""
Write-Host "Para ver el progreso del despliegue:" -ForegroundColor Cyan
Write-Host "- Ve al dashboard de Vercel" -ForegroundColor White
Write-Host "- O ejecuta: vercel logs" -ForegroundColor White
Write-Host ""
Write-Host "🎾 ¡Tu app PadelPro estará online pronto!" -ForegroundColor Green
Write-Host ""
