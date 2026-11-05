# Instalación local de StockPlus

Esta guía explica cómo instalar y ejecutar StockPlus en un computador con Windows, Linux o macOS. El sistema funciona de forma local: los datos se guardan en el PostgreSQL del propio equipo y no se envía información a internet.

## 1. Antes de empezar

Necesitas:

- **Node.js 22 o superior** (recomendado: 24 LTS).
- **PostgreSQL 16 o superior** en ejecución.
- Un navegador actualizado (Chrome, Edge, Firefox o Safari).
- La carpeta del proyecto descargada o descomprimida.

Recomendaciones:

- Guarda el proyecto en una ruta local y sencilla, por ejemplo `C:\StockPlus` o `/home/usuario/stockplus`.
- Evita `C:\Program Files`, ya que requiere permisos de administrador para escribir archivos.
- Evita carpetas sincronizadas con OneDrive, Google Drive o Dropbox: pueden bloquear archivos mientras la aplicación está en ejecución.
- No necesitas Docker, Python, Java ni una cuenta en la nube.

## 2. Instalación en Windows

### Paso 1: instalar Node.js

1. Abre <https://nodejs.org/>.
2. Descarga la versión **LTS** para Windows.
3. Ejecuta el instalador y acepta las opciones predeterminadas.
4. Abre una terminal nueva (PowerShell o Símbolo del sistema) y verifica:

```bat
node -v
npm -v
```

Debe aparecer una versión de Node.js 22 o superior y una versión de npm. Si el comando no se reconoce, cierra y vuelve a abrir la terminal; si continúa el problema, reinstala Node.js marcando la opción para agregarlo al PATH.

### Paso 2: instalar PostgreSQL

1. Abre <https://www.postgresql.org/download/windows/> y descarga el instalador oficial (EDB).
2. Ejecuta el instalador. Durante el proceso:
   - Anota la **contraseña** que asignes al usuario `postgres`. La necesitarás en la instalación de StockPlus.
   - Mantén el puerto **5432**, salvo que ya estés usando otro puerto.
   - Puedes instalar pgAdmin si deseas administrar la base de datos visualmente.
3. Finaliza la instalación y verifica que el servicio de PostgreSQL esté iniciado:
   - Abre el menú Inicio y busca **Servicios**.
   - Localiza un servicio llamado `postgresql-x64-...` y confirma que esté en estado **En ejecución**.

Si PostgreSQL no está en ejecución, haz clic derecho sobre el servicio y selecciona **Iniciar**.

### Paso 3: preparar la carpeta del proyecto

1. Descomprime el proyecto en una ruta local, por ejemplo `C:\StockPlus`.
2. Verifica que dentro de la carpeta existan `SETUP.bat`, `INICIAR.bat`, `backend`, `frontend`, `database` y `scripts`.

### Paso 4: ejecutar la instalación

1. Haz doble clic en **`SETUP.bat`**.
2. El asistente solicitará los datos de PostgreSQL:

| Pregunta | Valor habitual |
|---|---|
| Host | `localhost` |
| Puerto | `5432` |
| Usuario | `postgres` |
| Contraseña | La que definiste al instalar PostgreSQL |
| Nombre de la base de datos | `stockplus` |

3. La instalación realiza automáticamente estas tareas:
   - Crea el archivo de configuración `backend/.env` con una clave de seguridad aleatoria.
   - Instala las dependencias del backend y del frontend.
   - Crea la base de datos `stockplus` si no existe.
   - Carga el esquema y los datos de demostración.
   - Compila la aplicación web.

Al finalizar verás el mensaje **“StockPlus quedó instalado”** y las credenciales de demostración.

> Si la instalación falla, revisa la sección [Solución de problemas](#12-solución-de-problemas). El mensaje indica si el problema está en Node.js, en la conexión a PostgreSQL o en la instalación de dependencias.

### Paso 5: iniciar la aplicación

1. Haz doble clic en **`INICIAR.bat`**.
2. Espera unos segundos. El navegador se abrirá automáticamente en `http://localhost:5000`.
3. Inicia sesión con las credenciales de demostración:

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@stockplus.com` | `password123` |
| Vendedor | `vendedor@stockplus.com` | `password123` |

Para detener la aplicación, vuelve a la ventana de la terminal y presiona **Ctrl + C**. Cerrar solo el navegador no detiene el servidor.

## 3. Instalación en Linux o macOS

### Paso 1: instalar Node.js

- **macOS:** descarga el instalador LTS desde <https://nodejs.org/> o instálalo con Homebrew si ya lo usas: `brew install node`.
- **Ubuntu/Debian:** instala Node.js 22 o superior desde <https://nodejs.org/> o con NodeSource. Verifica con `node -v`.
- **Fedora:** `sudo dnf install nodejs npm`.
- **Otra distribución:** usa el binario oficial de Node.js para tu sistema desde <https://nodejs.org/>.

### Paso 2: instalar y iniciar PostgreSQL

- **macOS:** instala PostgreSQL desde <https://www.postgresql.org/download/macosx/> o con Homebrew: `brew install postgresql@16` y luego `brew services start postgresql@16`.
- **Ubuntu/Debian:** `sudo apt install postgresql` y luego `sudo systemctl start postgresql`.
- **Fedora:** `sudo dnf install postgresql-server` y luego `sudo postgresql-setup --initdb && sudo systemctl start postgresql`.

Define o conoce la contraseña del usuario `postgres`. En algunas instalaciones de Linux el usuario del sistema `postgres` usa autenticación local; en ese caso el instalador de StockPlus puede conectarse con el usuario y la contraseña que correspondan a tu configuración.

### Paso 3: ejecutar la instalación y el arranque

Desde la carpeta del proyecto:

```bash
bash setup.sh
bash iniciar.sh
```

Si prefieres usar npm directamente:

```bash
npm run setup
npm start
```

La aplicación queda disponible en `http://localhost:5000`.

## 4. Verificar que todo funciona

1. Abre en el navegador:

```text
http://localhost:5000/api/ping
```

Debe responder un JSON similar a:

```json
{
  "status": "ok",
  "db": "conectada",
  "servicio": "StockPlus API"
}
```

2. Abre `http://localhost:5000` e inicia sesión con el usuario administrador.
3. Comprueba que el dashboard muestra los productos y clientes de demostración.

Si `/api/ping` responde con error `503`, PostgreSQL no está disponible o las credenciales de `backend/.env` no son correctas.

## 5. Configuración: archivo `backend/.env`

La configuración efectiva se guarda en **`backend/.env`**. El instalador crea este archivo automáticamente. Si editas valores, guarda el archivo y reinicia la aplicación.

| Variable | Valor habitual | Descripción |
|---|---|---|
| `PG_HOST` | `localhost` | Dirección del servidor PostgreSQL |
| `PG_PORT` | `5432` | Puerto de PostgreSQL |
| `PG_USER` | `postgres` | Usuario de PostgreSQL |
| `PG_PASSWORD` | (tu contraseña) | Contraseña del usuario de PostgreSQL |
| `PG_DB` | `stockplus` | Nombre de la base de datos |
| `PG_DB_TEST` | `stockplus_test` | Base de datos usada solo por las pruebas automatizadas |
| `PG_SSL` | `false` | Activa SSL si usas un PostgreSQL administrado |
| `PG_POOL_MAX` | `20` | Conexiones simultáneas del pool |
| `PG_STATEMENT_TIMEOUT_MS` | `30000` | Tiempo máximo por consulta |
| `JWT_SECRET_KEY` | (generada) | Clave para firmar las sesiones. No la compartas |
| `JWT_EXPIRES_IN` | `8h` | Duración de la sesión |
| `PORT` | `5000` | Puerto de la aplicación |
| `NODE_ENV` | `production` | Entorno de ejecución |
| `TRUST_PROXY` | (vacío) | `1` si hay un proxy inverso delante |
| `ALLOW_REGISTRATION` | `true` | `false` desactiva el registro público |
| `API_RATE_LIMIT_MAX` | `1000` | Límite de solicitudes por IP cada 15 minutos |
| `CORS_ORIGINS` | (vacío) | Orígenes adicionales permitidos, separados por coma |

Notas:

- El archivo `backend/.env` contiene credenciales. No lo envíes por correo ni lo incluyas en repositorios públicos.
- Si existe un archivo `.env` en la raíz del proyecto, el arranque local **no lo utiliza**; la configuración que importa es `backend/.env`.
- Si cambias `PORT`, la dirección de la aplicación también cambia, por ejemplo `http://localhost:8080`.
- `JWT_SECRET_KEY` se genera automáticamente. Si la cambias, todas las sesiones activas deberán iniciar sesión de nuevo.
- Para PostgreSQL gestionado puedes usar `DATABASE_URL` en lugar de las variables `PG_*`.
- Para publicar el sistema en internet con HTTPS y arranque automático, consulta [DESPLIEGUE.md](DESPLIEGUE.md).

## 6. Uso diario

### Iniciar

- Windows: doble clic en `INICIAR.bat`.
- Linux/macOS: `bash iniciar.sh`.
- Cualquier sistema: `npm start`.

### Detener

Presiona **Ctrl + C** en la ventana donde se está ejecutando la aplicación.

### Datos

Los datos quedan guardados en PostgreSQL. Puedes cerrar el navegador, apagar el servidor de StockPlus o reiniciar el computador sin perder la información, siempre que la base de datos se conserve.

### Modo desarrollo (opcional)

Si necesitas modificar el código:

```bash
npm run dev
```

- API: `http://localhost:5000`
- Aplicación web con recarga automática: `http://localhost:5173`

En este modo, la web de Vite redirige las llamadas `/api` al backend.

## 7. Acceso desde otro equipo de la red local (opcional)

El servidor escucha en la red local. Para abrir la aplicación desde un celular u otro computador conectado a la misma red:

1. Averigua la dirección IP del equipo servidor:
   - Windows: `ipconfig` y busca la dirección IPv4.
   - Linux/macOS: `hostname -I` o `ifconfig`.
2. En el otro dispositivo, abre `http://IP-DEL-SERVIDOR:5000`.
3. Si Windows muestra un aviso del firewall, permite el acceso solo en redes privadas.

Recomendaciones:

- No expongas el puerto `5000` directamente a internet.
- No uses esta configuración en redes públicas o compartidas sin medidas adicionales.
- Para acceso remoto seguro con HTTPS y proxy inverso, sigue la [guía de despliegue](DESPLIEGUE.md).

## 8. Respaldos

Los respaldos protegen la información del negocio. Se recomienda hacerlos antes de actualizar el sistema, cambiar de equipo o realizar tareas de mantenimiento.

### Crear un respaldo

Desde la carpeta raíz:

```bash
npm run db:backup
```

El archivo se guarda en la carpeta `backups/` con un nombre similar a `stockplus-2026-11-02T16-30-00.sql`.

Este comando usa `pg_dump`, que viene incluido con PostgreSQL. Si aparece el error **“No se encontró pg_dump”**:

1. Localiza la carpeta `bin` de PostgreSQL, por ejemplo:
   `C:\Program Files\PostgreSQL\16\bin`.
2. Agrega esa carpeta al PATH, o define la variable `PG_DUMP` antes de ejecutar el respaldo:

```bat
set PG_DUMP=C:\Program Files\PostgreSQL\16\bin\pg_dump.exe
npm run db:backup
```

En Linux/macOS:

```bash
export PG_DUMP=/usr/lib/postgresql/16/bin/pg_dump
npm run db:backup
```

La ruta exacta depende de la versión y del sistema operativo.

### Restaurar un respaldo

> **Advertencia:** restaurar un respaldo reemplaza los datos actuales. Haz primero un respaldo de seguridad de la base que vas a reemplazar.

1. Detén StockPlus con **Ctrl + C**.
2. Abre una terminal en la carpeta del proyecto.
3. Elimina y vuelve a crear la base de datos. Con `psql`:

```bash
psql -U postgres -h localhost -d postgres -c "DROP DATABASE stockplus;"
psql -U postgres -h localhost -d postgres -c "CREATE DATABASE stockplus;"
```

4. Restaura el archivo:

```bash
psql -U postgres -h localhost -d stockplus -f backups/stockplus-2026-11-02T16-30-00.sql
```

5. Inicia la aplicación de nuevo con `npm start` o `INICIAR.bat`.

Si no tienes `psql` en el PATH, puedes usar pgAdmin:

1. Crea una base de datos vacía llamada `stockplus`.
2. Haz clic derecho sobre ella y elige **Query Tool**.
3. Abre el archivo `.sql` del respaldo y ejecútalo.

## 9. Restablecer los datos de demostración

> **Advertencia:** este procedimiento elimina todos los datos actuales (productos, ventas, clientes y usuarios). Haz un respaldo antes.

1. Detén la aplicación.
2. Elimina la base de datos:

```bash
psql -U postgres -h localhost -d postgres -c "DROP DATABASE stockplus;"
```

3. Ejecuta la instalación de nuevo:

```bash
npm run setup
```

El asistente crea la base, carga el esquema y vuelve a insertar los datos de demostración. Las cuentas de demostración vuelven a tener la contraseña `password123`.

## 10. Cambiar o restablecer contraseñas

### Desde la aplicación

Inicia sesión, abre el menú lateral y selecciona **Cambiar contraseña**. Debes conocer la contraseña actual.

### Desde la terminal (si olvidaste la contraseña)

```bash
npm run db:reset-password -- --email=admin@stockplus.com
```

El comando solicita la nueva contraseña de forma oculta. También puedes ejecutarlo sin argumentos para que pregunte el correo:

```bash
npm run db:reset-password
```

La nueva contraseña debe tener entre 8 y 72 caracteres.

## 11. Actualizar el sistema

Si recibes una nueva versión del proyecto:

1. Detén la aplicación.
2. Haz un respaldo con `npm run db:backup`.
3. Conserva tu archivo `backend/.env` (contiene la configuración y credenciales).
4. Reemplaza el código por la nueva versión, sin borrar la base de datos.
5. Ejecuta `npm run setup` para actualizar dependencias, aplicar cambios del esquema y recompilar.
6. Inicia con `npm start` o `INICIAR.bat`.

No es necesario copiar las carpetas `node_modules` ni `frontend/dist`; se generan de nuevo durante la instalación.

## 12. Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `node` o `npm` no se reconoce | Node.js no está instalado o no está en el PATH | Reinstala Node.js LTS y abre una terminal nueva |
| `No se pudo conectar a PostgreSQL` / `ECONNREFUSED` | El servicio de PostgreSQL está detenido o el puerto es incorrecto | Inicia el servicio desde **Servicios** en Windows o con `systemctl`/`brew services`; revisa `PG_PORT` |
| `password authentication failed` / `28P01` | Usuario o contraseña incorrectos | Corrige `PG_USER` y `PG_PASSWORD` en `backend/.env` y vuelve a ejecutar `npm run setup` |
| `No se pudo crear la base de datos` | El usuario no tiene permisos para crear bases | Crea la base `stockplus` con pgAdmin o `CREATE DATABASE stockplus;` y vuelve a ejecutar la instalación |
| `El puerto 5000 ya está en uso` | Otra instancia de StockPlus u otro programa usa el puerto | Cierra la otra instancia o cambia `PORT` en `backend/.env`. En Windows puedes revisar con `netstat -ano | findstr :5000` |
| `No se encontró pg_dump` | La carpeta `bin` de PostgreSQL no está en el PATH | Define `PG_DUMP` con la ruta completa o agrega la carpeta al PATH |
| La página queda en blanco o muestra una versión anterior | El frontend no está compilado o el navegador tiene caché | Ejecuta `npm run build`, recarga con **Ctrl + F5** y verifica que `frontend/dist/index.html` exista |
| Error de permisos al instalar (`EPERM`, `EACCES`) | Carpetas protegidas o sincronización en la nube | Mueve el proyecto a una ruta local como `C:\StockPlus` y cierra editores/OneDrive |
| La instalación de dependencias falla por red | Sin conexión o proxy bloqueando npm | Verifica internet, configura el proxy de npm si es necesario y vuelve a ejecutar `npm run setup` |
| `Demasiados intentos de inicio de sesión` | Se superó el límite de intentos fallidos | Espera 15 minutos o reinicia la aplicación |
| `Token expirado` | La sesión superó el tiempo configurado | Inicia sesión nuevamente |
| No aparecen usuarios de demostración | La base se creó parcialmente o los datos no se cargaron | Detén la aplicación, elimina la base y ejecuta `npm run setup` de nuevo |
| Cambié la contraseña y no la recuerdo | — | Usa `npm run db:reset-password` desde la terminal |
| El dashboard no carga datos | Backend detenido, base de datos desconectada o sesión vencida | Verifica `/api/ping`, revisa la ventana del servidor e inicia sesión de nuevo |

### Revisar la conexión a la base de datos

```bash
npm run setup
```

El asistente vuelve a comprobar la conexión, crea la base si no existe y carga el esquema de forma segura. Es idempotente: no duplica los datos de demostración.

## 13. Desinstalar

1. Detén la aplicación.
2. Si deseas conservar la información, crea un respaldo con `npm run db:backup`.
3. Elimina la base de datos `stockplus` desde pgAdmin o con `psql`.
4. Borra la carpeta del proyecto.
5. Desinstala Node.js y PostgreSQL solo si no los usas para otros fines.

## 14. Lista de verificación después de instalar

- [ ] `node -v` muestra una versión 22 o superior.
- [ ] El servicio de PostgreSQL está en ejecución.
- [ ] `SETUP.bat` o `bash setup.sh` terminó sin errores.
- [ ] `http://localhost:5000/api/ping` responde `status: ok`.
- [ ] Se puede iniciar sesión como administrador y como vendedor.
- [ ] El dashboard muestra los datos de demostración.
- [ ] Se puede registrar una venta de prueba y el stock disminuye.
- [ ] `npm run db:backup` genera un archivo en `backups/`.
- [ ] La contraseña de demostración del administrador fue cambiada.
