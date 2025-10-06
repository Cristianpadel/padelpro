const fs = require('fs');

// Leer el archivo
let content = fs.readFileSync('src/components/layout/DesktopSidebar.tsx', 'utf8');

// Buscar y eliminar el primer botón de debug (amarillo)
const button1Pattern = /<div\s+onClick={() => {\s+console\.log\('🔥 ROUTER SIN ALERT - Dashboard'\);\s+router\.push\('\/dashboard'\);\s+}}\s+className="w-full p-3 text-left border-2 border-yellow-500 rounded-md bg-yellow-100 hover:bg-yellow-200 flex items-center cursor-pointer mb-2"\s+style={{ cursor: 'pointer' }}\s+>\s+[^<]*\s+<\/div>/gs;

// Buscar y eliminar el segundo botón de debug (azul) 
const button2Pattern = /<div\s+onClick={() => {\s+console\.log\('🔥 ROUTER SIN ALERT - Admin DB'\);\s+router\.push\('\/admin\/database'\);\s+}}\s+className="w-full p-3 text-left border-2 border-blue-500 rounded-md bg-blue-100 hover:bg-blue-200 flex items-center cursor-pointer mb-2"\s+style={{ cursor: 'pointer' }}\s+>\s+[^<]*\s+<\/div>/gs;

// Buscar y eliminar el tercer botón de debug (morado)
const button3Pattern = /<div\s+onClick={() => {\s+console\.log\('🔥 WINDOW\.LOCATION SIN ALERT'\);\s+window\.location\.href = '\/admin\/database';\s+}}\s+className="w-full p-3 text-left border-2 border-purple-500 rounded-md bg-purple-100 hover:bg-purple-200 flex items-center cursor-pointer mb-2"\s+style={{ cursor: 'pointer' }}\s+>\s+[^<]*\s+<\/div>/gs;

// Buscar y eliminar el cuarto botón de debug (naranja)
const button4Pattern = /<Link href="\/dashboard" className="w-full block mt-2">\s+<div className="w-full p-3 text-left border-2 border-orange-500 rounded-md bg-orange-100 hover:bg-orange-200 flex items-center cursor-pointer">\s+[^<]*\s+<\/div>\s+<\/Link>/gs;

// Buscar patrones más simples usando texto específico
const simplePattern1 = /border-yellow-500.*?<\/div>/gs;
const simplePattern2 = /border-blue-500.*?<\/div>/gs;
const simplePattern3 = /border-purple-500.*?<\/div>/gs;
const simplePattern4 = /border-orange-500.*?<\/Link>/gs;

// Eliminar usando patrones más simples
content = content.replace(/.*border-yellow-500.*\n.*\n.*\n.*\n.*ELIMINADO.*\n.*<\/div>/g, '');
content = content.replace(/.*border-blue-500.*\n.*\n.*\n.*\n.*ELIMINADO.*\n.*<\/div>/g, '');
content = content.replace(/.*border-purple-500.*\n.*\n.*\n.*\n.*ELIMINADO.*\n.*<\/div>/g, '');
content = content.replace(/.*border-orange-500.*\n.*\n.*\n.*\n.*ELIMINADO.*\n.*<\/div>\n.*<\/Link>/g, '');

// Escribir el archivo corregido
fs.writeFileSync('src/components/layout/DesktopSidebar.tsx', content);

console.log('✅ Botones de debug eliminados del sidebar');