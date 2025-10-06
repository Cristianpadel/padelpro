## 🔐 ACCESOS COMPLETOS A LA BASE DE DATOS PADEL PRO

### 📊 INTERFAZ WEB (Database Admin Panel)
**URL:** http://localhost:3000/admin/database

**Credenciales:**
- Email: admin@padelestrella.com  
- Password: adminpassword

### 🖥️ ACCESO POR TERMINAL
```bash
cd "C:\Proyectos\padelpro"
node simple-access.js
```

### 📋 DATOS ACTUALES EN LA BASE DE DATOS:

#### 👥 USUARIOS (3):
1. **Alex García** (alex@example.com)
   - Role: PLAYER | Nivel: 4.0 | Créditos: 100

2. **María López** (maria@example.com)  
   - Role: PLAYER | Nivel: 3.5 | Créditos: 150

3. **Carlos Instructor** (carlos@example.com)
   - Role: INSTRUCTOR | Nivel: 6.0 | Créditos: 0

#### 🏢 CLUBES (1):
- **Padel Estrella**
  - Dirección: Calle Principal 123, Madrid
  - Email: info@padelestrella.com
  - Teléfono: +34 91 123 4567

#### 🎾 PISTAS (2):
- **Pista Central** (Activa)
- **Pista 2** (Activa)

#### 👨‍🏫 INSTRUCTORES (1):
- **Instructor ID:** inst-1
- **Especialidades:** Principiantes, Técnica avanzada
- **Experiencia:** 5 años

#### 📅 CLASES PROGRAMADAS (2):
1. **2025-09-17 09:00-10:30**
   - Nivel: principiante | Precio: €25 | Capacidad: 4

2. **2025-09-17 11:00-12:30**  
   - Nivel: intermedio | Precio: €30 | Capacidad: 4

#### 📋 RESERVAS (2):
1. **Alex García** → Clase principiante (CONFIRMED)
2. **María López** → Clase intermedio (CONFIRMED)

### 🛠️ COMANDOS ÚTILES:

#### Ver estructura de tablas:
```bash
node check-real-schema.js
```

#### Acceso completo:
```bash  
node simple-access.js
```

#### Repoblar base de datos:
```bash
node seed-database.js
```

### 📍 UBICACIÓN DE LA BASE DE DATOS:
- Archivo: `C:\Proyectos\padelpro\prisma\prisma\dev.db`
- Tipo: SQLite
- 8 Tablas activas: User, Club, Court, Instructor, TimeSlot, Booking, Match, MatchPlayer

¡La base de datos está completamente funcional y accesible!