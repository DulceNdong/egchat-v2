# Script de diagnóstico para el error del backend EGCHAT
echo "🔍 Diagnosticando error de sintaxis en index.js línea 878..."

# Verificar si existe el archivo
if [ ! -f "index.js" ]; then
    echo "❌ El archivo index.js no existe en el directorio actual"
    echo "📂 Directorio actual: $(pwd)"
    echo "📁 Archivos en este directorio:"
    ls -la
    exit 1
fi

echo "✅ Archivo index.js encontrado"

# Mostrar la línea problemática y contexto
echo ""
echo "📋 Línea 878 y contexto:"
sed -n '870,885p' index.js

echo ""
echo "🔍 Verificando sintaxis básica..."

# Verificar si hay caracteres invisibles
echo "Caracteres en la línea 878:"
sed -n '878p' index.js | cat -A

echo ""
echo "🔧 Posibles soluciones:"
echo "1. Cambiar 'const updates: any = {};' por 'const updates = {};' (quitar tipo TypeScript)"
echo "2. Verificar que no haya caracteres invisibles"
echo "3. Asegurarse de que el archivo esté guardado con encoding UTF-8"

echo ""
echo "💡 El error sugiere que el código está escrito en TypeScript pero se ejecuta como JavaScript"
echo "   Node.js no entiende la sintaxis de tipos de TypeScript"