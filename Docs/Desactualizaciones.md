# Desactualizaciones detectadas en la documentación oficial

Discrepancias encontradas entre lo que dice la documentación oficial de
AIOManager (`https://aiomanager.sandokan.dev/kronorium/...`) y el
comportamiento real del software, verificado contra el código fuente. Cada
entrada indica la página fuente, lo que dice la doc, y el dato correcto.

Estas notas también están marcadas como **[dato desactualizado]** in situ en
[AIOManager-Guide.md](./AIOManager-Guide.md).

---

## 1. Puerto por defecto (`PORT`)

- **Fuente:** `/kronorium/reference/configuration`
- **Dice la doc:** el valor por defecto de `PORT` es `16100` (y que Docker lo sobreescribe a `1610`).
- **Dato real:** el valor por defecto en el código es `1610`. `16100` no es el default real — es solo un valor sugerido para desarrollo local, para no chocar con una instancia Docker ya escuchando en `1610`.

## 2. Tamaño máximo de payload de sync (`MAX_SYNC_PAYLOAD_SIZE`)

- **Fuente:** `/kronorium/reference/configuration` (inconsistente entre páginas — otra página del propio sitio da un valor distinto)
- **Dice la doc:** una página indica `15mb`, otra indica `100mb`.
- **Dato real:** el valor por defecto en el código es 100 MB (`104857600` bytes).

## 3. Nombre del fichero de base de datos SQLite

- **Fuente:** `/kronorium/getting-started/installation` y `/kronorium/reference/troubleshooting` (comandos de recuperación de emergencia)
- **Dice la doc:** el fichero se llama `aiomanager.db`.
- **Dato real:** el nombre por defecto es `aio.db` (confirmado en el esquema de configuración y en la estructura de ficheros real).

## 4. `SQLITE_DB_PATH` como variable configurable por el usuario

- **Fuente:** `/kronorium/reference/configuration`
- **Dice la doc:** la lista `SQLITE_DB_PATH` junto al resto de variables de entorno pensadas para configurarse manualmente.
- **Dato real:** el propio esquema de configuración la marca como interna — se establece programáticamente al arrancar el servidor y no debe fijarse a mano.

## 5. Cobertura incompleta de variables de entorno

- **Fuente:** `/kronorium/reference/configuration`
- **Dice la doc:** documenta únicamente ~11 variables de entorno.
- **Dato real:** el esquema real del servidor define del orden de ~40 variables. Las no documentadas cubren, entre otras cosas: ajuste fino del motor de actividad (`ACTIVITY_*`), ajuste fino de Autopilot (`AUTOPILOT_*`), pool y reintentos de PostgreSQL (`DB_POOL_SIZE`, `DB_MAX_RETRIES`, `DB_SSL_REJECT_UNAUTHORIZED`), réplicas de solo lectura (`READ_ONLY_REPLICA`), protección SSRF (`SSRF_ALLOW_PRIVATE`), confianza en el proxy inverso (`TRUST_PROXY`), y caché de imágenes (`IMAGE_CACHE_*`, `IMAGE_PROXY_*`). Es probable que sean adiciones posteriores a la última sincronización de esa página de la doc oficial.

---

## Verificado como correcto (para referencia)

Por si sirve de contraste, estos puntos de la doc oficial sí se comprobaron
contra el código y son exactos:

- El comportamiento de fallback de `ENCRYPTION_KEY` (usa la clave nueva para datos nuevos, cae a la clave del fichero antiguo para datos existentes — nadie se queda fuera).
- Los límites de rate limiting citados (sync 60/min, proxy 30/min, health checks 30/min).
- El comportamiento de CORS por defecto (solo orígenes localhost si `CORS_ORIGINS` no se define).
