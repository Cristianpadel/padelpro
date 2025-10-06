const fs = require('fs');

// Leer el archivo
let content = fs.readFileSync('src/components/layout/DesktopSidebar.tsx', 'utf8');

// Dividir en líneas
let lines = content.split('\n');

// Encontrar y eliminar las líneas que contienen los botones problemáticos
const linesToRemove = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Si encontramos una línea con border-yellow-500, border-blue-500, border-purple-500, o border-orange-500
    if (line.includes('border-yellow-500') || 
        line.includes('border-blue-500') || 
        line.includes('border-purple-500') || 
        line.includes('border-orange-500')) {
        
        // Marcar desde unas líneas antes hasta unas líneas después para eliminar todo el div
        let startLine = Math.max(0, i - 10);
        let endLine = Math.min(lines.length - 1, i + 10);
        
        // Buscar hacia atrás el inicio del div
        for (let j = i; j >= startLine; j--) {
            if (lines[j].trim().startsWith('<div') && lines[j].includes('onClick')) {
                startLine = j;
                break;
            }
        }
        
        // Buscar hacia adelante el final del div o Link
        for (let j = i; j <= endLine; j++) {
            if (lines[j].trim() === '</div>' || lines[j].trim() === '</Link>') {
                endLine = j;
                break;
            }
        }
        
        // Marcar líneas para eliminar
        for (let k = startLine; k <= endLine; k++) {
            linesToRemove.push(k);
        }
    }
}

// Eliminar líneas marcadas (de mayor a menor para no afectar los índices)
const uniqueLinesToRemove = [...new Set(linesToRemove)].sort((a, b) => b - a);
for (const lineIndex of uniqueLinesToRemove) {
    lines.splice(lineIndex, 1);
}

// Unir las líneas de vuelta
const newContent = lines.join('\n');

// Escribir el archivo
fs.writeFileSync('src/components/layout/DesktopSidebar.tsx', newContent);

console.log(`✅ Eliminadas ${uniqueLinesToRemove.length} líneas de botones de debug`);
console.log(`Líneas eliminadas: ${uniqueLinesToRemove.join(', ')}`);