# 🔧 Solucionar Error de Build iOS

## ❌ Error encontrado:

```
Build failed: Unknown error. See logs of the Bundle JavaScript build phase
Build ID: eebefa53-16ba-4ffa-9308-152c1eb20e9b
```

---

## 🔍 Causas comunes y soluciones:

### Solución 1: Limpiar y reinstalar dependencias

```bash
cd /Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-mobile

# Limpiar todo
rm -rf node_modules
rm -rf ios
rm -rf android
rm -rf .expo

# Reinstalar
npm install

# Regenerar código nativo
npx expo prebuild --clean

# Intentar build nuevamente
eas build --platform ios --profile production --clear-cache
```

---

### Solución 2: Verificar errores de TypeScript/JavaScript

```bash
cd /Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-mobile

# Verificar que la app compila localmente
npx expo start --clear

# Si hay errores, revisar los archivos mencionados
```

---

### Solución 3: Revisar imports problemáticos

A veces hay imports circulares o módulos faltantes. Revisa:

```bash
# Buscar imports problemáticos
grep -r "import.*from.*'\.\.\/\.\.\/\.\.\/" app/ src/
```

---

### Solución 4: Verificar plugins de Expo

Revisa que todos los plugins en `app.json` estén correctamente instalados:

```bash
# Ver logs detallados del build
eas build:view eebefa53-16ba-4ffa-9308-152c1eb20e9b
```

O abre en el navegador:
https://expo.dev/accounts/reddington120/projects/egchat-mobile/builds/eebefa53-16ba-4ffa-9308-152c1eb20e9b

---

### Solución 5: Build sin cache

```bash
eas build --platform ios --profile production --clear-cache
```

---

### Solución 6: Revisar el archivo de entrada

Verifica que `expo-router/entry` sea correcto:

```bash
# En package.json debe estar:
"main": "expo-router/entry"

# Y en app.json NO debe haber:
"entryPoint": ...
```

---

## 🚀 Pasos recomendados (en orden):

### 1. Ver logs completos del build

```bash
eas build:view eebefa53-16ba-4ffa-9308-152c1eb20e9b
```

Busca líneas con:
- `ERROR`
- `Failed to compile`
- `Module not found`
- `Cannot resolve`

### 2. Limpiar cache y rebuild

```bash
cd /Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-mobile
rm -rf node_modules .expo
npm install
eas build --platform ios --profile production --clear-cache
```

### 3. Si sigue fallando, probar con development

```bash
# Build de desarrollo (más rápido, mejor para debugging)
eas build --platform ios --profile development
```

---

## 📋 Información útil del build:

- **Build ID:** eebefa53-16ba-4ffa-9308-152c1eb20e9b
- **Platform:** iOS
- **Profile:** production
- **SDK Version:** 54.0.0
- **Version:** 1.0.0
- **Build number:** 144
- **Started:** 11/5/2026, 6:33:48 PM
- **Failed:** 11/5/2026, 6:35:32 PM
- **Duration:** ~2 minutos

---

## 🆘 Si nada funciona:

1. **Crea un issue con los logs completos:**
   - Copia todo el output de `eas build:view`
   - Busca la sección "Bundle JavaScript"
   - Identifica el error específico

2. **Prueba con un perfil diferente:**
   ```bash
   # Development es más tolerante
   eas build --platform ios --profile development
   ```

3. **Verifica tu código localmente:**
   ```bash
   npx expo start
   # Si funciona localmente, el problema es específico del build
   ```

---

## 💡 Próximo paso recomendado:

```bash
# Abre los logs completos en el navegador
open "https://expo.dev/accounts/reddington120/projects/egchat-mobile/builds/eebefa53-16ba-4ffa-9308-152c1eb20e9b"

# Busca la sección "Bundle JavaScript" y copia el error exacto
```

Luego comparte el error específico para ayudarte mejor.
