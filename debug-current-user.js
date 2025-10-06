// Ejecutar en la consola del navegador para ver el currentUser
console.log('🔍 Current User:', window.currentUser || 'No current user found');

// También verificar localStorage
console.log('📋 LocalStorage auth:', localStorage.getItem('auth') || 'No auth in localStorage');

// Verificar sessionStorage
console.log('📋 SessionStorage user:', sessionStorage.getItem('user') || 'No user in sessionStorage');

// Si hay una función global para obtener el usuario
if (typeof getCurrentUser === 'function') {
  console.log('🎯 getCurrentUser():', getCurrentUser());
}

// Verificar cookies de autenticación
console.log('🍪 Cookies:', document.cookie);