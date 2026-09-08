# AIOManager — Resumen de la documentación oficial

Resumen reorganizado y depurado de la documentación oficial de AIOManager
(`https://aiomanager.sandokan.dev/kronorium/...` — la sección "kronorium" que
la propia app expone). Fuente: scrape puntual de esa web; el texto original,
mucho más largo y con artefactos de scraping (menús repetidos, enlaces
duplicados, preguntas de FAQ sin respuesta capturada), no se conserva aquí —
el historial de git es el respaldo si hace falta el texto crudo.

Correcciones marcadas **[dato desactualizado]** son discrepancias detectadas
entre lo que dice la documentación oficial y el comportamiento real del
software (código fuente), no opiniones.

## Índice

1. [Primeros pasos](#primeros-pasos)
2. [Cuentas](#cuentas)
3. [Addons](#addons)
4. [Biblioteca (Library)](#biblioteca-library)
5. [Autopilot](#autopilot)
6. [Actividad, métricas y Replay](#actividad-métricas-y-replay)
7. [Ajustes](#ajustes)
8. [Seguridad](#seguridad)
9. [Autoalojamiento (self-hosting)](#autoalojamiento-self-hosting)
10. [Referencia de API](#referencia-de-api)
11. [Solución de problemas y FAQ](#solución-de-problemas-y-faq)
12. [Créditos y soporte](#créditos-y-soporte)

---

## Primeros pasos

1. Usa una [instancia pública](#instancias-públicas) o auto-alójate.
2. Abre AIOManager y crea tu cuenta con una contraseña fuerte.
3. Añade una identidad de Stremio, cuenta local, Nuvio o RealStream.
4. Explora/instala addons (pestaña **Discover**).
5. Configura **Connections** en cualquier cuenta para reflejar la config en otras plataformas.

> Requiere HTTPS o `localhost` — HTTP plano sobre una IP de red rompe las APIs de
> Web Crypto que usan el Vault y Cloud Sync.

### Añadir tu primera cuenta

AIOManager tiene su propio login, separado de Stremio: **UUID + contraseña**,
generados al crear la cuenta. **No hay recuperación de contraseña — guárdalos
bien.** Un login de AIOManager puede gestionar muchas cuentas de Stremio.

**Añadir una:** Accounts → **Add Account** → elegir método.

| Método | Dificultad | Velocidad | Mejor para |
| --- | --- | --- | --- |
| Email/Password | Fácil | Rápido | Sync persistente desatendida |
| OAuth | Fácil | Media | Setup rápido sin compartir contraseña |
| AuthKey | Difícil | Rápido | Usuarios avanzados, alta masiva |
| Local | Fácil | Instantáneo | Pruebas, organización, sandbox |

- **OAuth:** genera un código de 6 caracteres → `stremio.com/activate` → login → introducir código → confirmar → AIOManager detecta la autorización. El token puede revocarse al cerrar sesión en Stremio Web; para sync persistente usa Email/Password.
- **Email & Password (recomendado para sync persistente):** login estándar; la contraseña se guarda cifrada en tu vault local (nunca en texto plano) para poder refrescar el token.
- **AuthKey (avanzado):** `web.stremio.com` → DevTools (`F12`) → Console → `JSON.parse(localStorage.getItem("profile")).auth.key` → pegar el resultado en AIOManager. No requiere contraseña de Stremio pero no se puede auto-refrescar si Stremio invalida la key.
- **Cuenta Local:** sin conexión externa; útil para organizar addons o como sandbox. Se le pueden añadir Connections más tarde.

### Instancias públicas

Instancias comunitarias gratuitas si no quieres auto-alojarte (tus datos
quedan en el servidor del host — para máxima privacidad, auto-alójate):

| Instancia | Canal | URL |
| --- | --- | --- |
| Elfhosted | stable | aiomanager.elfhosted.com |
| Midnight's | stable | aiomanagerfortheweebs.midnightignite.me |
| Yeb's | stable | aiomanager.fortheweak.cloud |
| Kuu's | stable | aiomanager.stremio.ru |
| Ibby's | beta | aiomanager.ibbylabs.dev |
| Kuu's | beta | aiomanager-beta.stremio.ru |
| Yeb's | beta | aiomanager-beta.fortheweak.cloud |

Las instancias *beta* corren builds pre-release. Cada instancia es
independiente (BD, límites y URL propios).

---

## Cuentas

Una cuenta es un contenedor de addons: identidad de Stremio, cuenta local, o
conexión a Nuvio/RealStream. La tarjeta de cuenta muestra avatar, nombre,
nº de addons, estado y accesos rápidos (Sync/Repair/Refresh).

### Sync vs. Repair vs. Refresh Addons

Tres acciones parecidas pero distintas — usar la incorrecta puede causar
comportamiento inesperado. **Refresh Addons** siempre conserva nombres/logos
personalizados y es más exhaustivo que Sync.

| Acción | Qué hace | Dirección | Cuándo usarla |
| --- | --- | --- | --- |
| **Sync** | Trae lo último de Stremio y actualiza local | Stremio → AIOManager | Instalaste un addon desde la app de Stremio |
| **Repair** | Re-descarga `manifest.json` de cada addon y valida | Fuente → AIOManager | La versión/comportamiento de un addon parece incorrecto |
| **Refresh Addons** | Re-obtiene manifests, conserva personalización, empuja la lista completa | AIOManager ↔ Stremio | Cambiaste config en AIOManager o los addons no aparecen en Stremio |

### Multi-dispositivo

El mismo ID de sync funciona en varios dispositivos (descifrado local en cada
uno). Resolución de conflictos: **gana la última escritura** — evita tener
AIOManager abierto en dos dispositivos a la vez con el mismo ID; cierra en
uno antes de abrir en otro.

### Estados de cuenta

| Estado | Significado | Acción |
| --- | --- | --- |
| Connected | Accesible | Ninguna |
| Syncing | Transferencia en curso | Esperar |
| Error | Fallo de conexión | Revisar credenciales |
| Expired | Necesita reautenticación | Reautenticar |

### Perfiles, protección y Connections

- **Profile Linking:** etiquetas personalizadas en la barra lateral vinculadas a una o varias cuentas (ej. "Kids"/"Parents"). Distinto de los *perfiles de Library*, que organizan addons guardados, no cuentas.
- **Protección:** una cuenta "Protected" se salta operaciones masivas como "Remove All".
- **Connections:** reflejan tu configuración de addons a plataformas externas (Stremio, Nuvio, RealStream vía email/contraseña; credenciales cifradas AES-256-GCM en el servidor). Un "reconciler" propaga altas/bajas/reordenaciones entre todas las plataformas conectadas, con tu cuenta AIOManager como fuente canónica. Estados: `active`/`degraded`/`expired`/`error`.
- **Hydra (apps sin backend propio):** apps que no tienen servidor propio pueden leer tu lista de addons vía el protocolo **Hydra**, usando la URL de tu instancia + tu API key de cuenta — aparecen como tarjeta **Pull** en Connections. Ver [Referencia de API](#hydra-api).
- **Batch Operations:** ejecutar una acción sobre varias cuentas a la vez (instalar desde Library/URLs, espejar desde otra cuenta, reinstalar, proteger/desproteger, eliminar por etiquetas). Toda operación se previsualiza antes de ejecutarse; "Remove Addons" y "Reinstall All" son irreversibles.

---

## Addons

Los addons son extensiones de Stremio: fuentes de contenido, metadatos,
subtítulos, etc. (manifest JSON, URL de instalación, catálogos, streams).

### Tarjeta de addon

Nombre, versión, descripción, badge de estado de Autopilot, interruptor
activar/desactivar, barra de URL, y una rejilla de acciones 2×2:

| Acción | Qué hace |
| --- | --- |
| **Configure** | Abre la página de configuración del addon (detección inteligente aunque no esté declarada en el manifest) |
| **Catalogs** | Abre el editor de catálogos (reordenar/ocultar) — deshabilitado si no tiene catálogos |
| **Customize** | Editor de metadatos: nombre, logo, descripción personalizados — persiste tras reinstalar |
| **Save to Library / Reinstall** | Guarda config para despliegue posterior, o re-obtiene el manifest sin perder personalización |
| **Remove Addon** | Elimina el addon de esta cuenta (con confirmación; deshabilitado si está protegido) |

### Badges de Autopilot

`Primary` (activo, saludable) · `Primary · Paused` · `Backup` (en espera) ·
`Backup · Paused` — pausar ocurre al activar/desactivar manualmente un addon
que forma parte de una cadena.

### Menú (⋮) y otros

- **Protect/Unprotect:** evita borrado accidental en operaciones masivas.
- **Clone to Account:** copia el addon (URL + nombre/logo) a otra cuenta.
- **Deploy to All:** lo empuja a todas las cuentas gestionadas de golpe.
- **Catalog Editor:** arrastra para reordenar catálogos o los oculta (el manifest no se toca, es reversible).
- **Cinemeta:** parches de manifest (quitar buscador, catálogos estándar, o el recurso "meta") que no rompen la app de metadatos ni las notificaciones — preferible a desinstalar Cinemeta del todo.

---

## Biblioteca (Library)

Repositorio personal de configuraciones de addons: guarda una vez, despliega
en cualquier cuenta al instante.

- **Se guarda:** URL de instalación, nombre/logo/descripción personalizados, etiquetas, perfil. **No se guarda:** protección ni estado activar/desactivar.
- **Sync with Installed:** vincula una entrada de Library con su instalación real — un cambio de URL en cualquiera de los dos lados se propaga al otro (y a todas las cuentas vinculadas).
- **Auto-Restore:** si un chequeo de salud marca un addon guardado como caído, se reintenta desde la URL guardada (backoff: inmediato, 1 min, 5 min, 15 min+).
- **Desplegar:** Library → seleccionar addons → Install → elegir cuentas destino (concretas, todas, por perfil o etiqueta).
- **Bulk URL Replace:** buscar/reemplazar una cadena en las URLs de addons guardados (útil al cambiar de dominio un proveedor o rotar una API key incrustada). Alcance: toda la Library, una cuenta, o varias cuentas seleccionadas.
- **Perfiles y etiquetas:** los perfiles son grupos con nombre en la barra lateral de Library (distintos de los perfiles de cuenta); las etiquetas son libres y filtrable.

---

## Autopilot

Failover automatizado: monitoriza la salud de tus addons de streaming en una
cadena de prioridad (el primero = **primary**) y cambia al siguiente si un
chequeo falla, revirtiendo automáticamente al recuperarse.

> Autopilot corre en tu propio servidor de AIOManager, no dentro de Stremio —
> aloja AIOManager separado de los addons que monitoriza, o si ambos caen
> juntos no podrá reaccionar.

- **Chequeos de salud:** pide el `manifest.json`, valida JSON y campos requeridos. Timeout/reintentos: 10s inicial, 2 reintentos, 14s máx total. **Cooldown** (intervalo entre chequeos): 1 min = agresivo, 5 min = equilibrado (recomendado), 15+ min = relajado — menos de 5 min puede provocar rate-limit en algunos hosts de addons.
- **Reliability score:** nº de chequeos exitosos consecutivos desde el último fallo (se resetea a 0 al fallar). Evita el "flapping" exigiendo varios éxitos antes de revertir. Umbrales de recuperación y de fallo están fijos en **2** (no configurables por el usuario).
- **Failover:** primary falla → score a 0 → siguiente en la cadena se activa en Stremio → el primary caído se desactiva → webhook (si está configurado) → el primary sigue monitorizado para recuperarse.
- **Anulación manual:** activar/desactivar manualmente un addon en una regla activa la pausa automáticamente, para respetar tu elección.
- **Crear una cadena:** modo selección en una cuenta → elegir 2+ addons (el primero elegido = primary) → botón ⚡ Autopilot crea la cadena al instante. También editable manualmente desde la pestaña Autopilot (nombre, webhook, cooldown).
- **Webhooks:** notifican cada failover/recuperación. Discord, Slack y JSON genérico se detectan automáticamente por la URL; webhook global (Ajustes) o uno por regla.
- **Cuándo NO usarlo:** un único punto de fallo si todos los addons comparten servidor, o si AIOManager está alojado junto a los addons que monitoriza; sin backup si solo hay un addon.

---

## Actividad, métricas y Replay

- **Activity Feed:** historial de visionado extraído de Stremio, guardado solo localmente en tu navegador (nunca se envía a ningún sitio).
- **Metrics:** pestañas Pulse (hábitos recientes), Community (comparativa con otros), Personality (perfil de hábitos), Vault (estadísticas de tiempo/género — *no confundir con el Key Vault de Ajustes*), Deep Dive (retención, contenido abandonado, año a año).
- **Replay:** resumen anual estilo "Spotify Wrapped", generado enteramente a partir del historial local — nunca sale de tu dispositivo salvo que lo compartas explícitamente (enlace de solo lectura, sin necesidad de cuenta para verlo).

---

## Ajustes

- **General:** nombre mostrado, Privacy Mode (oculta datos sensibles en la UI), ocultar addons desactivados, URL de webhook global, notificaciones por evento.
- **Data & Sync:** subir/descargar estado a la nube; exportar/importar todo como `.json` (cuentas, library, reglas de Autopilot, temas, ajustes) — usar como backup antes de operaciones destructivas.
- **Advanced & Danger Zone:** gestión de "dispositivos recordados" (revocar uno o todos); operaciones irreversibles bajo un seguro ("Unlock Actions"): vaciar cuentas, vaciar Library, purgar Autopilot, reseteo de fábrica.
- **Apariencia:** 50+ temas incluidos, editor de tema personalizado (color de acento, base clara/oscura, ajuste fino por rol de color), exportable/compartible como código.
- **Cloud Sync:** el almacenamiento es local por defecto; Cloud Sync lo respalda cifrado (AES-256-GCM bajo tu Master Key) en tu servidor y lo sincroniza entre dispositivos — sin recuperación si pierdes la Master Key.
- **Key Vault:** almacén cifrado localmente para API keys de servicios debrid (Real-Debrid, AllDebrid, Premiumize, TorBox, Debrid-Link, u otros). Las claves nunca salen del navegador ni llegan al servidor; monitoriza caducidad automáticamente para proveedores soportados. Sin recuperación de la contraseña maestra del vault.

---

## Seguridad

- **Cifrado local:** claves y contraseñas se cifran con **AES-256-GCM** en el navegador antes de guardarse (IndexedDB); clave derivada por PBKDF2 de tu Master Password. El servidor nunca recibe credenciales en texto plano.
- **Protecciones del servidor:** reglas de Autopilot cifradas en reposo con `ENCRYPTION_KEY`; protección SSRF en el proxy (bloquea IPs privadas/localhost salvo que se permita explícitamente); rate limiting (sync 60/min, proxy 30/min, health checks 30/min); comparación de contraseña resistente a timing attacks; validación de entradas y SQL parametrizado.
- **Gestión de `ENCRYPTION_KEY`:** si no se define, el servidor genera una y la guarda en `DATA_DIR/server_secret.key` al primer arranque — hay que respaldar ese fichero, o los datos cifrados en el servidor quedan irrecuperables. Cambiarla más tarde no bloquea a nadie: los datos antiguos siguen leyéndose con la clave anterior como fallback.
- **Dispositivos recordados (opcional):** el servidor solo guarda un hash scrypt de un token aleatorio por dispositivo (puede verificarlo pero no leerlo); las claves de vault/sync se guardan cifradas en el navegador junto a ese token. En dispositivos compatibles, el secreto puede residir en hardware seguro (passkey/TPM). Expiran a los 180 días sin uso, o al revocarse/cambiar contraseña.
- **Privacidad:** sin telemetría; las únicas conexiones externas son la API de Stremio y las URLs de los addons que instalas.

---

## Autoalojamiento (self-hosting)

Requiere servidor propio para Autopilot, Health Checks, Cloud Sync y Replay
compartido (un despliegue puramente estático no los soporta).

- **Docker (recomendado):** imagen oficial `ghcr.io/sonicx161/aiomanager:latest`. `docker compose up -d`, luego `http://localhost:1610`. Soporta SQLite (por defecto) o PostgreSQL (`DB_TYPE=postgres` + `DATABASE_URL`).
- **Unraid:** plantilla nativa (instalación manual, no está en Community Apps).
- **Manual (Node.js):** `git clone` → `npm install` → `.env` desde `.env.example` → `npm run build && npm run server`.
- **Proxy inverso:** ejemplos oficiales para Nginx, Caddy y Nginx Proxy Manager. **Requiere HTTPS o `localhost`** — el navegador bloquea las APIs de Web Crypto (Vault, Cloud Sync) en HTTP plano remoto.

### Variables de entorno (principales)

La tabla oficial documenta solo ~11 variables; el código real define bastantes
más (motor de actividad, ajuste fino de Autopilot, pool de BD, etc. — no
documentadas oficialmente). Las más relevantes para un despliegue típico:

| Variable | Por defecto | Descripción |
| --- | --- | --- |
| `PORT` | `1610` | Puerto de escucha. **[dato desactualizado]** la doc oficial dice `16100`. |
| `NODE_ENV` | `production` | Solo `"development"` cambia comportamiento. |
| `DATA_DIR` | `./data` | BD SQLite, `server_secret.key`, logs. |
| `MAX_SYNC_PAYLOAD_SIZE` | 100 MB | Tamaño máx. del blob de sync cifrado. **[dato desactualizado]** una página oficial dice 15 MB. |
| `DB_TYPE` / `DATABASE_URL` | `sqlite` / — | `sqlite` o `postgres` (+ cadena de conexión). |
| `ENCRYPTION_KEY` | auto-generada | Clave de cifrado del servidor (ver [Seguridad](#seguridad)). |
| `CORS_ORIGINS` | orígenes de dev en localhost | Lista separada por comas; fijar explícitamente en cualquier instancia pública. |
| `REGISTRATIONS_CLOSED` | `false` | Bloquea la creación de cuentas nuevas; las existentes siguen entrando. |
| `CUSTOM_HTML` | — | HTML inyectado sobre la pantalla de login. |
| `LOG_LEVEL` / `LOG_PRETTY_PRINT` | `info` / `true` | Nivel y formato de logs. |
| `PROXY_CONCURRENCY_LIMIT` | `50` | Peticiones proxy/metadata concurrentes máx. |

El nombre del fichero SQLite por defecto es **`aio.db`** (no `aiomanager.db`,
como indica erróneamente la doc oficial en dos sitios).

### Estructura de la base de datos

**SQLite** (por defecto): un único fichero en `DATA_DIR/aio.db`, con tablas
como `kv_store` (payloads cifrados de sync), `autopilot_rules`,
`failover_history`, `health_history`, `activity_events`, etc.
**PostgreSQL** (recomendado en producción): `DB_TYPE=postgres` +
`DATABASE_URL`.

```
data/
├── aio.db                 # Base de datos SQLite
├── server_secret.key      # Clave de cifrado auto-generada
└── logs/
```

---

## Referencia de API

Resumen de los endpoints principales (ver la documentación oficial para el
detalle completo de cada uno).

**Autenticación por endpoint:** `x-sync-password` (sync), `x-autopilot-token`
(autopilot), `x-sync-user` + `x-sync-password` (providers), `X-API-Key`
(Hydra).

| Grupo | Endpoints clave |
| --- | --- |
| Salud/config | `GET /api/health`, `GET /api/ready` (probes de solo-lectura), `GET /api/config` |
| Cloud Sync | `GET/POST/DELETE /api/sync/:id` |
| Addons | `GET /api/addon-health`, `GET /api/meta-proxy` (protegido contra SSRF) |
| Autopilot | `POST /api/autopilot/sync`, `GET /api/autopilot/state/:accountId`, `DELETE /api/autopilot/:id` |
| Providers | `POST /api/providers/sync/:accountId`, `GET /api/providers/status/:accountId`, endpoints de credenciales/token por plataforma (Nuvio, RealStream, Hydra) |

**Códigos de error comunes:** `400` bad request · `401` no autorizado ·
`403` protección SSRF · `404` no encontrado · `413` payload excede
`MAX_SYNC_PAYLOAD_SIZE` · `429` rate limit · `500` error interno.

### Hydra API

Protocolo HTTP de AIOManager para que apps externas lean/escriban la lista de
addons de un usuario. Rol **Pull** (habitual): AIOManager expone `/hydra/*`,
la app externa lee usando la URL de instancia + API key del usuario.

| Endpoint | Comportamiento |
| --- | --- |
| `GET /hydra/status` | Sin auth. Estado/capacidades del servidor |
| `GET /hydra/addons` | Lista de addons instalados |
| `POST /hydra/addons` | Instala uno (valida manifest, idempotente) |
| `DELETE /hydra/addons?url=` | Elimina por URL de transporte |
| `POST /hydra/reinstall` | Refresca config in situ — el método recomendado para actualizar un addon ya instalado |
| `POST /hydra/validate` | Valida un manifest sin instalar |
| `POST /hydra/register` | Se registra como suscriptor Pull (aparece en Connections) |

Rate limits: status 120/min · lecturas 60/min · escrituras 30/min ·
reinstall/sync/test 10/min.

---

## Solución de problemas y FAQ

### Diagnóstico rápido

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| "Server Unreachable" | Servidor caído / URL incorrecta | Verificar estado y URL en Ajustes |
| Addons no aparecen | Falta sincronizar | Sync en la tarjeta de cuenta |
| Catálogos fantasma | Caché de Stremio | Reinstalar el addon de respaldo |
| El Vault no desbloquea | Contraseña incorrecta | Verificar contraseña maestra |
| No sincroniza | Conflicto o sin conexión | Comprobar conexión, "pull from cloud" |

- **CORS:** funciona en localhost pero no en el dominio → fijar `CORS_ORIGINS` al dominio real.
- **HTTPS/contexto seguro:** el Vault falla al iniciar → servir por HTTPS o usar el flag de Chrome para tratar el origen como seguro.
- **Autopilot no falla:** revisar si la regla está desactivada, si todos los addons están caídos, si el servidor está offline, o bajar el cooldown.
- **Autopilot "flapping"** (cambia constantemente): subir el cooldown a 5+ min o cambiar de primary.
- **Contraseña maestra del Vault olvidada:** sin recuperación — hay que limpiar el vault y volver a añadir las claves.
- **Addons duplicados/fantasma tras failover:** abrir el addon de respaldo → Reinstall → dejar que Stremio refresque.

### FAQ (resumen)

- **¿Necesita mi contraseña de Stremio?** Solo si usas el método Email & Password, y se guarda cifrada.
- **¿Los cambios de addons se sincronizan de vuelta a Stremio?** Sí, vía Refresh Addons / el reconciler.
- **¿Dónde se guardan mis datos?** Cifrados localmente, y opcionalmente respaldados cifrados vía Cloud Sync.
- **¿Cómo se cifra?** AES-256-GCM con clave derivada por PBKDF2.
- **¿Olvidé mi Master Password?** Sin recuperación posible.
- **¿Qué base de datos usar?** SQLite (sin configuración) para uso personal; PostgreSQL para escala/multi-tenant.

---

## Créditos y soporte

AIOManager es una evolución del **Stremio Account Manager** original de
**Asymons**, a su vez basado en el trabajo de **pancake3000**. Proyecto
gratuito — usarlo y participar en la comunidad ya es suficiente apoyo.
Enlaces de repositorio, issues y donaciones apuntan al proyecto original
(`github.com/sonicx161/AIOManager`).
