# Resumen Consolidado — refactor/block-1-security

**Branch:** refactor/block-1-security | **Base:** staging | **Worktree:** api_rest_express_staging  
**Total commits:** 11 | **Total archivos cambiados:** 48 | **Total líneas:** +2524 / -1897

---

## Commits incluidos

| Hash | Mensaje | Archivos | Riesgo |
|------|---------|----------|--------|
| `a71ac4a` | fix(block-1): add missing await on commit/rollback in saveInfoGuias TLL path | 2 | MEDIUM |
| `9b92010` | feat(helpers): add dates helper — getTemplateVersion and parseLocalDate | 1 | LOW |
| `277c7bc` | fix(hangtag): restructure etiqueta layout — barcode column dominant, talla left | 4 | LOW |
| `5dc9181` | feat(produccion): optimize guia export queries with Promise.all and template versioning | 1 | MEDIUM |
| `7fbfdab` | feat(server): add handlebars helpers and partials for guia templates | 1 | LOW |
| `f04e47c` | chore: silence debug console.log across controllers and utils | 17 | LOW |
| `409d428` | fix(block-1): migration script detects VARCHAR(32) and exits with clear instructions | 1 | CRITICAL* |
| `c1a6245` | security(block-1): add operation-level authorization middleware | 4 | HIGH |
| `851c535` | fix(block-1): add missing await to all beginTransaction calls | 11 | HIGH |
| `237a1c4` | security(block-1): hash passwords with bcrypt — requires migration script | 4 | CRITICAL* |
| `ac99c0e` | security(block-1): move hardcoded credentials to env files | 4 | HIGH |

> *CRITICAL: estos commits no pueden desplegarse solos — el script de migración (237a1c4) y su prerequisito ALTER TABLE (409d428) deben ejecutarse en orden durante una ventana de mantenimiento. El riesgo no es del código sino de la secuencia de despliegue.

---

## Qué resuelve cada fix

### `ac99c0e` — Credenciales hardcodeadas movidas a env vars

Antes del fix, `Main/config.js` y `Main/utils.js` tenían credenciales de base de datos y secretos JWT escritos literalmente en el código fuente. Cualquier acceso al repositorio exponía las credenciales de producción. El fix mueve todas las variables sensibles a archivos `.env.*` (ignorados por git), añade validación de startup que falla con `[FATAL]` si alguna variable requerida está ausente, y documenta todas las variables en `.env.example`. **Verificado:** el servidor arrancado con `node --env-file .env.staging server.js` falla inmediatamente con mensaje claro si falta una variable; con todas las variables presentes, arranca correctamente.

### `237a1c4` — Bcrypt en login

Antes, el login hacía `WHERE tu.usu = ? AND tu.paz = ?` — la contraseña viajaba en texto plano hasta MySQL y se comparaba en SQL. El fix cambia el flujo: busca al usuario solo por nombre, luego compara la contraseña enviada contra el hash bcrypt almacenado usando `bcrypt.compare()`. Usuarios con nombre correcto pero contraseña incorrecta reciben el mismo mensaje que usuarios inexistentes (previene enumeración). **Dependencia crítica:** requiere que `tbl_user.paz` sea `VARCHAR(60)` y que el script de migración hashee todas las contraseñas antes del despliegue. **Verificado:** pre-migración el login retorna `{"ok":false,"message":"Credenciales incorrectas"}`; post-migración retorna `{"ok":true,...}` con hash bcrypt visible en la columna `paz`.

### `851c535` — await faltante en beginTransaction (69 instancias)

En 69 llamadas a `conn.beginTransaction()` a lo largo de 11 archivos de servicio faltaba el `await`. Sin él, el primer `INSERT`/`UPDATE` corría antes de que la transacción estuviera activa en MySQL, haciendo que un error posterior no pudiera revertir las escrituras parciales. El fix añade `await` a las 69 instancias. Como hallazgo secundario, el mismo commit detectó y corrigió el bug de `rollback()→commit()` en `saveInfoGuias` (función que llevaba activo desde marzo 2026, commit `5fd7e06`). **Verificado indirectamente** a través del test de caracterización de `saveInfoGuias` (17/17) que confirma que el rollback funciona correctamente cuando la transacción está activa.

### `c1a6245` — Middleware de autorización por operación

Antes, ninguna ruta verificaba el nivel de usuario (`niv`) del token JWT antes de ejecutar operaciones destructivas. El fix crea `Main/middleware/authorize.js` que extrae `req.session.niv` del token y lo compara contra el nivel mínimo requerido. Se aplica `authorize(1)` a todas las rutas DELETE en `ordenes/`, `produccion/` (15 rutas) y `almacen/` (3 rutas). Las rutas GET, POST y PUT se dejan sin restricción adicional en este bloque; autorización más granular está planificada para block-2. **No verificado en staging:** no se realizó un test explícito de 403 con niv>1 ni de 200 con niv=1 en esta sesión.

### `409d428` — Script de migración detecta VARCHAR(32) y sale con instrucciones claras

La columna `tbl_user.paz` en producción es `VARCHAR(32)` — insuficiente para un hash bcrypt de 60 caracteres. Sin esta mejora, el script de migración crasheaba a mitad de ejecución con un error de MySQL poco claro. El fix añade una verificación previa que detecta la longitud de la columna y, si es menor a 60, imprime el comando `ALTER TABLE` exacto que debe ejecutar un usuario privilegiado y sale con código 1. **Verificado:** en staging, `tbl_user.paz` ya es `VARCHAR(60)` — el script pasa esta validación y procede a hashear las contraseñas.

### `f04e47c` — Silenciar console.log de debug (17 archivos)

Decenas de `console.log()` de desarrollo activos en producción exponían información interna en los logs del servidor (datos de formularios, resultados de queries, IDs internos). El fix los convierte en `//console.log()`. Cambio puramente operacional, sin impacto en lógica. **No requiere verificación funcional.**

### `7fbfdab` — Helpers Handlebars y directorios de partials en server.js

El servidor no tenía helpers globales de Handlebars ni configuración de directorios de partials para las plantillas v2. El fix registra helpers reutilizables (`cuerpoTelas`, `cuerpoAvios`, `eq`, `ne`, `splitAtWord`, `contains`) y configura `views/partials`, `views/v2/partials` y `views/v2/layouts` como directorios de partials. **Verificado:** el servidor arranca sin errores de template con esta configuración.

### `5dc9181` — Optimización de queries en exportación de guías (produccion.js)

Varias funciones de exportación de guías hacían consultas en serie usando `await` encadenados. El fix las convierte a `Promise.all()` para paralelizar consultas independientes, reduciendo latencia en la generación de PDF. También introduce `getTemplateVersion()` para selección de plantilla basada en fecha de emisión (preparando la transición a plantillas v2). **Verificado:** el servidor arranca y el import del nuevo helper `dates.js` resuelve correctamente.

### `9b92010` — Helper dates.js (getTemplateVersion y parseLocalDate)

`Produccion/Controladores/produccion.js` importaba `getTemplateVersion` y `parseLocalDate` desde `Main/helpers/dates.js`, archivo que no existía. El servidor no arrancaba. El fix crea el archivo con implementaciones correctas: `getTemplateVersion` retorna siempre la plantilla v1 (cutoff 2099 hasta que existan plantillas v2), `parseLocalDate` parsea fechas `YYYY-MM-DD` de MySQL en hora local en lugar de UTC, evitando el desfase de un día en `toLocaleDateString()`. **Verificado:** el servidor arranca sin `ERR_MODULE_NOT_FOUND` después de este fix.

### `277c7bc` — Layout de etiqueta hangtag (dos columnas)

El código barras se renderizaba encima de la talla en la etiqueta física porque ambos usaban `position: absolute` en el mismo contenedor. El fix reestructura el helper `foo` en `almacenController.js` para generar dos columnas flexbox — columna izquierda con texto y talla, columna derecha con el código de barras rotado 90°. Corrige también el tipo MIME del base64 de `image/jpg` a `image/png` (el canvas genera PNG). Cambio puramente presentacional. **No verificado en staging:** la impresión física no fue confirmada en esta sesión.

### `a71ac4a` — await faltante en commit/rollback de saveInfoGuias

Durante la revisión del fix `851c535`, se detectó que `saveInfoGuias` tenía `await` en `beginTransaction` pero no en `conn.commit()` ni en el `conn.rollback()` del catch. El fix añade los dos `await`. **Verificado:** test de caracterización 17/17 — happy path persiste en 3 tablas, rollback mid-write revierte cab+det+fracciones limpiamente sin filas orphan.

---

## Dependencias de despliegue — BLOQUEANTES

Las siguientes acciones deben ocurrir en orden exacto antes de promover este branch a producción. Ninguna es opcional. Todas son operaciones de **modo guiado** (el dueño del proyecto las ejecuta, no Claude Code).

**1. ALTER TABLE en producción (usuario privilegiado, no app user)**

```sql
ALTER TABLE tbl_user MODIFY paz VARCHAR(60) NOT NULL;
```

El usuario de app (`erp_user` o equivalente) no tiene permisos `ALTER`. Debe ejecutarlo un usuario con privilegios de administración. Verificar antes de continuar:

```sql
SELECT CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'BD_FACTURADOR' AND TABLE_NAME = 'tbl_user' AND COLUMN_NAME = 'paz';
-- Debe retornar 60
```

**2. Migración de contraseñas en producción (ventana de mantenimiento, una sola vez)**

```bash
RUN_PASSWORD_MIGRATION=yes node --env-file .env.production scripts/migrate-passwords.js
```

- Ejecutar durante ventana de mantenimiento con usuarios notificados
- Hacer backup de `tbl_user` antes
- Si el proceso falla a mitad, restaurar el backup — no re-ejecutar el script parcialmente
- **El script NO puede ejecutarse dos veces** — double-hash bloquea todos los accesos

**3. Variables de entorno confirmadas en el proceso pm2 correcto**

Antes del reinicio, verificar que el proceso correcto tiene todas las variables:

```bash
pm2 describe 0    # confirmar que es api_rest_express, puerto 4001
pm2 env 0         # verificar JWT_SECRET, JWT_SECRET2, DB_HOST, DB_USER, DB_PASS, DB_NAME, PORT
```

Si alguna variable falta, configurarla vía ecosystem file antes de reiniciar. **No asumir que las variables están — verificar**.

**4. pm2 restart guiado, con usuario presente**

```bash
# Solo ejecutar después de confirmar pasos 1-3
pm2 restart 0
```

Verificar login inmediatamente después. Si falla, rollback inmediato (checkout de la rama `production` anterior + pm2 restart).

---

## Pendiente conocido (deuda técnica, no bloqueante)

**FTP credentials hardcodeadas:** `Ordenes/Controladores/ordenes.js` y `Productos/Servicios/productosService.js` tienen host/user/pass de FTP literales. Documentado en `ac99c0e` como hallazgo, diferido a block-2.

**Commit mixto 3984861 en release/... y production:** El commit de emergencia del 2026-06-19 mezcla port fix (relacionado con el incidente), TLL commit() fix (pre-existing bug) y hangtag layout (feature). Se decidió Option 3 — dejar el historial documentado y asegurar que los mismos fixes estén en este branch (confirmado: `851c535` ya incluye el rollback→commit fix de saveInfoGuias, y `277c7bc` incluye el hangtag). No requiere acción adicional.

**Commits no relacionados en block-1-security:** Los commits `f04e47c` (console.logs), `7fbfdab` (helpers server.js), `5dc9181` (produccion.js optimizations), `277c7bc` (hangtag), `9b92010` (dates helper) no pertenecen semánticamente a block-1-security. Entraron porque el stash creado durante el incidente mezclaba trabajo de seguridad con trabajo no relacionado, y al hacer `git stash pop` todo se commiteó sobre esta rama. Impacto: el PR tendrá más superficie de revisión de la esperada. No es bloqueante.

**Middleware de autorización incompleto:** `c1a6245` protege solo rutas DELETE. Rutas POST/PUT de operaciones críticas (creación de guías, cierre de órdenes) quedan sin restricción de nivel. Diferido a block-2.

**Plantillas v2 no creadas:** `getTemplateVersion` retorna siempre v1 (cutoff 2099). El directorio `views/v2/` existe vacío. Diferido a bloque de UI.

---

## Trabajo pendiente para Block 2

> Esta sección es el input directo para el prompt de inicio de block-2.
> No eliminar de este archivo hasta que block-2 esté completado.

### [BLOCK-2-1] await faltante en conn.commit()/rollback() — ~130 instancias

El commit `851c535` flaggeó explícitamente en su mensaje: *"conn.commit() and conn.rollback() missing await in several files"*. El grep sobre el codebase confirma el alcance real: **~130 call sites activos** sin `await` en **11 archivos de servicio**.

La función `saveInfoGuias` (Produccion/Servicios/produccion.js) fue el único caso corregido en block-1 (`a71ac4a`). El resto queda pendiente.

**Archivos afectados con conteo aproximado de instancias activas:**

| Archivo | Instancias |
|---------|------------|
| `Produccion/Servicios/produccion.js` | ~30 (funciones no-TLL: saveInfoGuiasGLB, saveInfoGuiasXPQ, y otras) |
| `Ordenes/Servicios/ordenes.js` | ~22 |
| `Abonos/Servicios/abonoServicio.js` | ~18 |
| `Almacen/Servicios/almacenService.js` | ~18 |
| `Cobros/Servicios/cobros.js` | ~10 |
| `Prestamos/Servicios/prestamo.js` | ~9 |
| `Proveedores/Services/proveedorService.js` | ~9 |
| `Productos/Servicios/productosService.js` | ~8 |
| `Servicios/Servicios/serviciosServiceModel.js` | ~6 |
| `Letras/Servicios/letrasServicio.js` | ~3 |
| `Reports/Controladores/reportController.js` | ~2 |

**Riesgo:** mismo clase que el bug ya corregido — COMMIT o ROLLBACK pueden enviarse a MySQL sin esperar confirmación, dejando el estado de la transacción ambiguo si la conexión falla entre el envío y la respuesta.

**Acción requerida en block-2:** sweep completo análogo al de `beginTransaction` en `851c535`. Verificar con characterization tests en las funciones de mayor riesgo (Ordenes, Abonos, Cobros).

### [BLOCK-2-2] FTP credentials hardcodeadas

`Ordenes/Controladores/ordenes.js` y `Productos/Servicios/productosService.js`. Mover a env vars, mismo patrón que `ac99c0e`.

### [BLOCK-2-3] Autorización en rutas POST/PUT

`c1a6245` protege solo DELETE. Las rutas de creación y modificación (guías, órdenes, cobros) no verifican `niv`. Diseñar la matriz de permisos antes de implementar.

---

## Módulo Planeamiento — fuera de scope de block-1 y block-2

Requiere definición de producto por parte del dueño antes de que comience cualquier trabajo de código. Ver `docs/planeamiento-borrador.md`. No bloquea el deploy de block-1 ni el trabajo de block-2.

**Decisión:** la validación de secuencia de ruta en `saveInfoGuias` (líneas 1134–1148, bloque comentado) NO se activa en block-1 ni block-2. El fix técnico (`RUTA.indexOf` en lugar de `RUTA[cabecera.servicio]`) es conocido pero no aplicar sin primero tener un mecanismo de cambio autorizado de ruta — activarlo sin ese mecanismo bloquearía flujos operativos legítimos que el negocio usa hoy. Las 34 guías históricas fuera de ruta en producción no se tocan; son evidencia de comportamiento operativo real, no errores confirmados.

---

## Pruebas ya ejecutadas (no repetir, ya confirmadas)

- **Startup FATAL:** servidor arranca correctamente con todas las env vars presentes; sale con `[FATAL] Missing required environment variable: X` si falta cualquiera de las 7 requeridas
- **Login pre-migración:** `curl POST /login` retorna `{"ok":false,"message":"Credenciales incorrectas"}` antes de correr el script de migración
- **Login post-migración:** `curl POST /login` retorna `{"ok":true,"message":"Credenciales correctas",...}` con hash bcrypt en la columna `paz`; token JWT y cookies `access_token`/`refresh_token` presentes en la respuesta
- **saveInfoGuias — tipo=TLL — 17/17 characterization tests:** happy path inserta y commitea en cab+det+fracciones; mid-write failure (fracciones vacías → SQL error después de cab+det escritas) produce rollback completo sin filas orphan en ninguna de las 5 tablas (commit `a71ac4a`)
- **saveInfoGuias — tipo=SERVICIOS — extendido a 31/31:** happy path con tipo=SERVICIOS llama `UpdateMasterProduccion` sin efectos colaterales en hojacorte; rollback mid-write revierte las mismas 5 tablas limpiamente (commit `fcfc8eb`)
- **Autorización 403/200/401 — 3/3 tests:** niv=2 recibe 403 en DELETE protegido; niv=1 recibe 200 y la fila es eliminada de la BD; sin sesión recibe 401 (interceptado por middleware de sesión previo a `authorize`). Nota: la rama `No autenticado` de `authorize.js:8` es dead code en la configuración actual — el middleware de sesión siempre actúa primero.

---

## Smoke test — resultado final (2026-06-19)

Ejecutado contra staging (backend :4003, frontend Vite :5174). Todos los pasos completados.

| Paso | Descripción | Resultado |
|------|-------------|-----------|
| 1 | Servicios up (backend pid en :4003, frontend en :5174) | ✓ OK |
| 2a | Login test_limited (niv=2) → token + datos.niv=2 | ✓ 200 |
| 2b | Login test_admin (niv=1) → token + datos.niv=1 | ✓ 200 |
| 3a | GET /ordenes/getordenes/ → 6 órdenes | ✓ 200 |
| 3b | GET /ordenes/201 → 73 campos, detalle completo | ✓ 200 |
| 3c | POST /ordenes/saveFaseOrden (nueva orden) → ok:true, idx=999902 | ✓ 200 |
| 3d | Orden idx=999902 visible en BD staging | ✓ confirmado vía query directo |
| 3e | GET /almacen/listarinventario → [] (staging vacío, correcto) | ✓ 200 |
| 4a | GET /ordenes/getordenes/ como niv=2 → 6 órdenes | ✓ 200 |
| 4b | DELETE /ordenes/201 como niv=2 → 403 con mensaje claro | ✓ 403 |
| 4c | Orden idx=201 intacta tras el 403 rechazado | ✓ no eliminada |
| 5 | Console.logs de block-1 (authorize.js, server.js startup) | ✓ sin leaks de datos |
| cleanup | DELETE /ordenes/999902 como niv=1 → ok:true | ✓ 200 |

**Hallazgos documentados (ninguno bloquea el PR):**

- **Step 3c — campo incorrecto:** la función activa `saveFaseOrden` (línea 1030) espera `-F "combos=..."` (no `combos_orden`). El primer intento falló con `"undefined" is not valid JSON` porque el campo enviado no coincidía. No es bug de block-1, es que la función usa un nombre diferente al de la versión backup en la misma clase.
- **Step 3d — orden no aparece en viewProduccionOrdenesV2:** `getordenes` usa esa vista que requiere datos adicionales (hojacorte, combos completos). La orden existe en `tbl2_fases_prod_ordenes` pero no en la vista. Comportamiento pre-existente, no regresión.
- **Step 4c — frontend no parsea 403:** `utils.tsx:90-97` trata 403 con `throw new Error('Otro codigo de error')` — el `mensaje` de `authorize()` nunca llega al usuario, que ve un error genérico. Adicionalmente emite `console.log("IUNfo abort data:", data)` en el browser. Pre-existente en el frontend; se activa ahora porque block-1 introduce las primeras respuestas 403 del backend. Diferido a block-2 junto con el resto de autorización en rutas POST/PUT.
- **Step 5 — console.logs activos en produccion.js:** 9 `console.log()` de debug activos en `Produccion/Servicios/produccion.js`, introducidos por el commit `5dc9181`. No son leaks de seguridad (van a stdout del servidor, no a responses), pero contradicen el propósito de `f04e47c`. Diferido a block-2.

**Estado del smoke test: PASS — block-1-security está listo para PR.**

---

## Pruebas pendientes antes del PR

- **Hangtag layout físico:** diferido — bajo riesgo, no bloquea el PR. El cambio CSS es puramente presentacional y fue revisado en código.
