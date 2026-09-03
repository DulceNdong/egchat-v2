# 🧪 Guía de Testing - Mi Djangue

## 📋 Checklist de Testing End-to-End

### ✅ Pre-requisitos
- [ ] Backend corriendo en https://egchat-api-xlxj.onrender.com
- [ ] App corriendo en http://localhost:8081
- [ ] Usuario con sesión activa y token válido
- [ ] Monedero con saldo suficiente (mínimo 10,000 XAF para pruebas)

---

## 🎯 Test 1: Crear Djangue

### Pasos:
1. Abrir http://localhost:8081
2. Iniciar sesión con usuario de prueba
3. Navegar a **Mini-Apps** → **Mi Djangue**
4. Click en **"+ Crear nuevo Djangue"**
5. Llenar formulario:
   - **Nombre**: "Djangue del Barrio"
   - **Descripción**: "Tanda mensual para el barrio"
   - **Frecuencia**: Seleccionar **Mensual** (debe mostrar icono calendario azul)
   - **Cuota**: 5000 XAF
   - **Integrantes**: 10 personas
   - **Secretario** (opcional): dejar vacío
6. Click **"Crear Djangue"**

### Resultado esperado:
- ✅ Alert de éxito: "Djangue creado"
- ✅ Redirección a pantalla de detalle
- ✅ Dashboard muestra:
  - Monedero del djangue: 0 XAF
  - Turno 1 de 10
  - Progreso: 0% (0 de 9 pagaron)
  - Badge azul con icono calendario "MENSUAL"
  - Solo tu usuario en la lista de integrantes
  - Rol: "Responsable"

---

## 🎯 Test 2: Agregar Miembros

### Pasos:
1. Desde el detalle del djangue, click en icono **+** (arriba derecha)
2. Ingresar teléfono de miembro: `+240555551001`
3. Click **"Buscar Usuario"**
4. Si existe, mostrar nombre y avatar
5. Click **"Agregar Integrante"**
6. Repetir proceso para agregar más miembros (mínimo 3 para testing completo)

### Resultado esperado:
- ✅ Alert: "Integrante agregado"
- ✅ Redirección a detalle
- ✅ Lista actualizada con nuevo miembro
- ✅ Cada miembro tiene turno asignado (1, 2, 3...)
- ✅ Badge del beneficiario actual muestra "Le toca"

---

## 🎯 Test 3: Pagar Cuota

### Pasos:
1. **Como miembro que NO es beneficiario del turno**:
2. Click en **"💳 Pagar cuota — 5,000 XAF"**
3. Revisar pantalla de pago:
   - Saldo actual del monedero
   - Cuota a pagar: 5,000 XAF
   - Saldo después del pago
4. Click **"Confirmar Pago"**

### Resultado esperado:
- ✅ Alert: "Cuota pagada correctamente"
- ✅ Monedero personal descontado: -5,000 XAF
- ✅ Progreso actualizado: 1 de 9 pagaron (11%)
- ✅ Badge verde "Pagó" junto a tu nombre
- ✅ Historial muestra tu contribución con fecha/hora

---

## 🎯 Test 4: Completar Turno (Testing con múltiples usuarios)

### Pasos:
1. Simular que **todos los miembros pagan** (excepto el beneficiario)
2. Usar API directamente o tener múltiples sesiones
3. Al último pago, verificar:

### Resultado esperado al completar turno:
- ✅ Beneficiario recibe transferencia automática al monedero
- ✅ Turno avanza: "Turno 2 de 10"
- ✅ Monedero del djangue vuelve a 0 XAF
- ✅ **Notificación push al nuevo beneficiario**: "🎉 ¡Es tu turno en Mi Djangue!"
- ✅ Todos los estados de pago se resetean para el nuevo turno
- ✅ Historial muestra todas las contribuciones del turno anterior

---

## 🎯 Test 5: Historial de Contribuciones

### Pasos:
1. Desde detalle del djangue, scroll hasta **"📊 Historial de pagos"**
2. Click para expandir

### Resultado esperado:
- ✅ **Animación suave** de expansión
- ✅ Icono chevron rota 180° al expandir
- ✅ Lista de contribuciones muestra:
  - Avatar del usuario
  - Nombre completo
  - Fecha y hora del pago
  - Monto en color verde
  - "Turno X" en gris
- ✅ Click nuevamente colapsa con animación

---

## 🎯 Test 6: Animaciones y UX

### Verificar:
- [ ] **Lista principal**: Tarjetas hacen fade-in + slide con efecto escalonado
- [ ] **Loader**: Puntos pulsantes verde-azul mientras carga
- [ ] **Historial**: Expansión/colapso suave con spring
- [ ] **Badges de frecuencia**: Iconos SVG correctos:
  - ☀️ Sol naranja → Diario
  - ✓ Calendario verde → Semanal
  - 📅 Calendario azul → Mensual
  - 🏆 Trofeo rosa → Anual
- [ ] **Progress bar**: Animación al actualizar porcentaje
- [ ] **Botones**: Respuesta táctil suave (activeOpacity)

---

## 🎯 Test 7: Validaciones y Errores

### Casos a probar:

#### Sin autenticación:
- [ ] Sin token → mostrar "Debes iniciar sesión"

#### Saldo insuficiente:
- [ ] Intentar pagar sin saldo → Alert "Saldo insuficiente"

#### Ya pagó:
- [ ] Intentar pagar dos veces → Alert "Ya pagaste tu cuota"

#### Es tu turno:
- [ ] Beneficiario intenta pagar → Alert "Es tu turno de recibir, no de pagar"

#### Solo responsable puede cancelar:
- [ ] Miembro regular no debe ver botón "Cancelar Djangue"
- [ ] Responsable puede cancelar → status cambia a "cancelled"

---

## 🎯 Test 8: Integración con Backend

### Verificar endpoints:

```bash
# 1. Listar djangues
curl -H "Authorization: Bearer $TOKEN" \
  https://egchat-api-xlxj.onrender.com/api/djangue

# 2. Detalle de un djangue
curl -H "Authorization: Bearer $TOKEN" \
  https://egchat-api-xlxj.onrender.com/api/djangue/{id}

# 3. Historial de contribuciones
curl -H "Authorization: Bearer $TOKEN" \
  https://egchat-api-xlxj.onrender.com/api/djangue/{id}/contributions

# 4. Crear djangue
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","frequency":"monthly","quota_amount":5000,"max_members":10}' \
  https://egchat-api-xlxj.onrender.com/api/djangue
```

---

## 🎯 Test 9: Notificaciones Push (Solo en dispositivo físico)

### Pre-requisitos:
- Build APK/IPA instalado en dispositivo
- Permisos de notificaciones otorgados
- Token push registrado en backend

### Pasos:
1. Crear djangue con al menos 3 miembros
2. Todos pagan turno 1 (excepto beneficiario)
3. Al completarse, beneficiario del turno 2 debe recibir notificación

### Resultado esperado:
- ✅ Notificación push: "🎉 ¡Es tu turno en Mi Djangue!"
- ✅ Body: "Este turno te toca recibir en [nombre]. Espera a que todos paguen."
- ✅ Al tocar notificación → abre detalle del djangue

---

## 📊 Métricas de Éxito

| Feature | Status | Notas |
|---------|--------|-------|
| Crear djangue | ⏳ | |
| Agregar miembros | ⏳ | |
| Pagar cuota | ⏳ | |
| Completar turno | ⏳ | |
| Historial | ⏳ | |
| Animaciones | ⏳ | |
| Notificaciones | ⏳ | Solo en físico |
| Colores EGCHAT | ⏳ | |
| Iconos SVG | ⏳ | |

**Leyenda**: ⏳ Pendiente | ✅ Pasó | ❌ Falló

---

## 🐛 Bugs Conocidos

- **iOS Build**: Error de react-native-gesture-handler (solo afecta build nativo, web OK)
- **Web**: Expo web funciona perfecto en localhost:8081

---

## 📝 Próximos Pasos Post-Testing

1. [ ] Corregir bugs encontrados
2. [ ] Optimizar queries de base de datos
3. [ ] Agregar más validaciones
4. [ ] Mejorar mensajes de error
5. [ ] Documentar API endpoints
6. [ ] Build APK/IPA para testing en dispositivos

---

## 🚀 Comando para Testing Rápido

```bash
# Iniciar servidor web
cd egchat-mobile
npx expo start --web --clear --port 8081

# En otra terminal, verificar backend
curl https://egchat-api-xlxj.onrender.com/api/health
```

---

**Última actualización**: 2026-08-20  
**Version**: v1.1.0 (Mi Djangue completo)
