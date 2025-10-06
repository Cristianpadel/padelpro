const fs = require('fs');

// Leer el archivo
let content = fs.readFileSync('src/components/layout/DesktopSidebar.tsx', 'utf8');

// Patrón específico para encontrar y eliminar cada botón de debug completo
const patterns = [
  // Botón amarillo (ROUTER DASHBOARD)
  /<div\s+onClick=\{\(\) => \{\s+console\.log\('🔥 ROUTER SIN ALERT - Dashboard'\);\s+router\.push\('\/dashboard'\);\s+\}\}\s+className="w-full p-3 text-left border-2 border-yellow-500[^>]*>\s+[^<]*\s+<\/div>/gs,
  
  // Botón azul (ROUTER ADMIN DB)
  /<div\s+onClick=\{\(\) => \{\s+console\.log\('🔥 ROUTER SIN ALERT - Admin DB'\);\s+router\.push\('\/admin\/database'\);\s+\}\}\s+className="w-full p-3 text-left border-2 border-blue-500[^>]*>\s+[^<]*\s+<\/div>/gs,
  
  // Botón morado (WINDOW.LOCATION)
  /<div\s+onClick=\{\(\) => \{\s+console\.log\('🔥 WINDOW\.LOCATION SIN ALERT'\);\s+window\.location\.href = '\/admin\/database';\s+\}\}\s+className="w-full p-3 text-left border-2 border-purple-500[^>]*>\s+[^<]*\s+<\/div>/gs,
  
  // Botón naranja (LINK DASHBOARD)
  /<Link href="\/dashboard" className="w-full block mt-2">\s+<div className="w-full p-3 text-left border-2 border-orange-500[^>]*>\s+[^<]*\s+<\/div>\s+<\/Link>/gs
];

// Aplicar cada patrón
for (const pattern of patterns) {
  content = content.replace(pattern, '');
}

// También eliminar líneas que contengan solo espacios o texto "ELIMINADO"
const lines = content.split('\n');
const cleanedLines = lines.filter(line => {
  const trimmed = line.trim();
  return trimmed !== '' && !trimmed.includes('ELIMINADO') && trimmed !== '�';
});

const finalContent = cleanedLines.join('\n');

// Escribir el archivo
fs.writeFileSync('src/components/layout/DesktopSidebar.tsx', finalContent);

console.log('✅ Botones de debug eliminados correctamente');
console.log('✅ Líneas de espacios y texto corrupto eliminadas');