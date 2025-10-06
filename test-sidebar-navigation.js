// Test script para probar la navegación del sidebar
console.log('🧪 Testing sidebar navigation...');

// Función para simular click en el botón Database Admin
function testDatabaseAdminButton() {
    console.log('🔍 Looking for Database Admin button...');
    
    // Buscar el botón por texto
    const buttons = Array.from(document.querySelectorAll('button, a'));
    const databaseButton = buttons.find(btn => 
        btn.textContent && btn.textContent.includes('Database Admin')
    );
    
    if (databaseButton) {
        console.log('✅ Found Database Admin button:', databaseButton);
        console.log('📋 Button details:', {
            tagName: databaseButton.tagName,
            href: databaseButton.href || 'No href',
            onclick: databaseButton.onclick || 'No onclick',
            classList: Array.from(databaseButton.classList)
        });
        
        // Intentar hacer click
        console.log('🖱️ Attempting to click...');
        databaseButton.click();
        
        setTimeout(() => {
            console.log('📍 Current URL after click:', window.location.href);
        }, 1000);
        
    } else {
        console.log('❌ Database Admin button not found');
        console.log('🔍 Available buttons:', buttons.map(btn => btn.textContent?.trim()).filter(text => text));
    }
}

// Esperar a que la página cargue
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testDatabaseAdminButton);
} else {
    testDatabaseAdminButton();
}