# Despliegue de StockPlus

Esta guía cubre los tres escenarios reales de entrega:

1. **Un solo computador** con la aplicación en `http://localhost:5000`.
2. **Red local** para que varios equipos usen el mismo servidor.
3. **Internet** detrás de un proxy inverso con HTTPS.

Antes de empezar, lee [INSTALACION_LOCAL.md](INSTALACION_LOCAL.md) si nunca has
instalado Node.js ni PostgreSQL.

---

## 1. Requisitos

| Componente | Versión recomendada |
|---|---|
| Node.js | 22 o 24 LTS |
| PostgreSQL | 16 o 17 |
| Navegador | Chrome, Edge, Firefox o Safari actualizado |

Node.js 18 y 20 ya no tienen soporte. PostgreSQL 14 termina su ciclo de vida en
noviembre de 2026.

---

## 2. Preparar el paquete

Desde la carpeta raíz del proyecto:

```bash
npm run setup
```

El asistente:

- crea `backend/.env` con una clave JWT aleatoria;
- instala dependencias del backend y del frontend;
- crea la base de datos y aplica `database/schema.sql`;
- carga datos de demostración (se puede omitir, ver abajo);
- compila la aplicación web en `frontend/dist`.

Para una instalación con datos reales, sin productos, clientes ni usuarios de
demostración:

```bash
STOCKPLUS_SKIP_SEED=1 npm run setup
npm run db:create-admin -- --email=admin@negocio.com --password=ClaveSegura123 --nombre="Administrador"
```

En PowerShell o CMD el prefijo anterior no funciona; ejecuta primero
`$env:STOCKPLUS_SKIP_SEED="1"` (PowerShell) o `set STOCKPLUS_SKIP_SEED=1` (CMD)
y después `npm run setup`.

> El registro público crea usuarios vendedores. Para un servidor expuesto a
> internet desactívalo con `ALLOW_REGISTRATION=false` y crea las cuentas con
> `npm run db:create-admin`.

### Qué no se debe entregar

No copies ni publiques:

- `backend/.env` (contiene la contraseña de PostgreSQL y el secreto JWT);
- `node_modules/`;
- `backups/`;
- `coverage/`;
- carpetas de evidencias o material académico que no formen parte del sistema.

---

## 3. Un solo computador

```bash
npm start
```

Abre `http://localhost:5000`. El arranque normal usa `NODE_ENV=production`:
no registra el texto de las consultas SQL y valida que el secreto JWT sea fuerte.

Para desarrollo con recarga en caliente:

```bash
npm run dev
```

API en `http://localhost:5000` y web en `http://localhost:5173`.

### Windows

- `SETUP.bat` instala.
- `INICIAR.bat` arranca y abre el navegador.

### Linux o macOS

```bash
bash setup.sh
bash iniciar.sh
```

---

## 4. Red local

1. Asigna una **IP fija** al computador servidor (por ejemplo `192.168.1.10`) o
   reserva la IP en el router.
2. Permite el puerto en el firewall:
   - Windows: Regla de entrada TCP 5000 para la red privada.
   - Linux con UFW: `sudo ufw allow 5000/tcp`.
3. Inicia con `npm start`.
4. Desde otro equipo entra a `http://IP-DEL-SERVIDOR:5000`.
5. Comprueba el estado en `http://IP-DEL-SERVIDOR:5000/api/ping`.

La aplicación ya está preparada para HTTP en red local: no fuerza HTTPS en los
assets. Cuando publiques con HTTPS, el redirect debe hacerlo el proxy inverso.

Si necesitas cambiar el puerto, edita `PORT` en `backend/.env`. `npm start`,
`npm run dev` y el proxy de Vite leen ese valor.

---

## 5. Arranque automático y reinicio

### PM2 (Windows, Linux y macOS)

```bash
npx pm2 start ecosystem.config.cjs
npx pm2 save
npx pm2 startup
```

En Windows, `pm2 startup` requiere `pm2-windows-startup` o crear una tarea
programada que ejecute `pm2 resurrect` al iniciar sesión.

### Windows con NSSM

```bat
nssm install StockPlus "C:\Program Files\nodejs\node.exe" "C:\StockPlus\backend\src\app.js"
nssm set StockPlus AppDirectory "C:\StockPlus\backend"
nssm set StockPlus AppEnvironmentExtra NODE_ENV=production
nssm start StockPlus
```

Ajusta las rutas según la ubicación real del proyecto.

### Linux con systemd

Copia `deploy/stockplus.service` a `/etc/systemd/system/`, ajusta usuario y
rutas, y ejecuta:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now stockplus
sudo systemctl status stockplus
```

### Programador de tareas de Windows

Crea una tarea "Al iniciar el sistema" con:

- Programa: `C:\Program Files\nodejs\node.exe`
- Argumentos: `C:\StockPlus\backend\src\app.js`
- Iniciar en: `C:\StockPlus\backend`

---

## 6. Internet con HTTPS

La aplicación no debe exponerse directamente. Usa un proxy inverso que termine
TLS y reenvíe a `127.0.0.1:5000`.

### Nginx

Hay un ejemplo completo en `deploy/nginx.conf.example`. Lo esencial:

```nginx
server {
    listen 443 ssl http2;
    server_name stockplus.midominio.com;

    ssl_certificate     /etc/letsencrypt/live/stockplus.midominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stockplus.midominio.com/privkey.pem;

    client_max_body_size 2m;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name stockplus.midominio.com;
    return 301 https://$host$request_uri;
}
```

Configura en `backend/.env`:

```env
NODE_ENV=production
TRUST_PROXY=1
ALLOW_REGISTRATION=false
CORS_ORIGINS=https://stockplus.midominio.com
```

`TRUST_PROXY=1` es obligatorio para que el rate limit use la IP real del cliente
y no la del proxy.

### PostgreSQL gestionado

Si usas Render, Railway, Neon, Supabase u otro proveedor:

```env
DATABASE_URL=postgresql://usuario:clave@host:5432/stockplus
PG_SSL=true
PG_SSL_REJECT_UNAUTHORIZED=false
```

Si el proveedor entrega un certificado verificable, pon
`PG_SSL_REJECT_UNAUTHORIZED=true`. Sin `PG_SSL=true` la conexión suele fallar
con "no pg_hba.conf entry" o un error de TLS.

### Proceso

```bash
npx pm2 start ecosystem.config.cjs
npx pm2 save
```

Una sola instancia es intencional: el rate limit se guarda en memoria. Si
necesitas varias instancias, mueve el rate limit a Redis antes de escalar.

---

## 7. Variables de entorno

| Variable | Uso | Valor recomendado |
|---|---|---|
| `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DB` | PostgreSQL local | Según tu instalación |
| `DATABASE_URL` | PostgreSQL gestionado | Cadena del proveedor |
| `PG_SSL` | TLS hacia PostgreSQL | `true` en nube |
| `PG_SSL_REJECT_UNAUTHORIZED` | Verificar certificado | `true` si el proveedor lo permite |
| `PG_DB_TEST` | Base de pruebas | `stockplus_test` |
| `JWT_SECRET_KEY` | Firma de sesiones | 48 bytes aleatorios |
| `JWT_EXPIRES_IN` | Duración del token | `8h` |
| `PORT` | Puerto HTTP | `5000` |
| `NODE_ENV` | Modo de ejecución | `production` |
| `TRUST_PROXY` | Proxy inverso | `1` detrás de Nginx/Render |
| `ALLOW_REGISTRATION` | Registro público | `false` en internet |
| `API_RATE_LIMIT_MAX` | Peticiones por IP cada 15 min | `1000` |
| `CORS_ORIGINS` | Orígenes permitidos | Dominio HTTPS si aplica |

Genera el secreto JWT con:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 8. Respaldos y restauración

Generar un respaldo:

```bash
npm run db:backup
```

Se guarda en `backups/stockplus-FECHA.sql`. La retención por defecto es de 30
días; se cambia con `BACKUP_RETENTION_DAYS`.

Programa el respaldo:

- Windows: Programador de tareas, diario.
- Linux/macOS: `crontab -e` con `0 2 * * * cd /ruta/stockplus && npm run db:backup`.

Restaurar (detén la aplicación primero):

```bash
psql -U postgres -d stockplus -f backups/stockplus-FECHA.sql
```

Prueba la restauración al menos una vez antes de usar datos reales.

---

## 9. Actualización

1. Detén el servicio (`pm2 stop stockplus`, `nssm stop StockPlus` o el servicio
   de systemd).
2. Guarda un respaldo.
3. Reemplaza el código sin tocar `backend/.env` ni `backups/`.
4. Ejecuta `npm --prefix backend ci --omit=dev`, `npm --prefix frontend ci` y
   `npm run build`.
5. Inicia el servicio y verifica `/api/ping`.
6. Si algo falla, restaura el respaldo y vuelve a la versión anterior.

---

## 10. Verificación de entrega

- [ ] `npm test` termina con 80/80 pruebas.
- [ ] `npm run build` genera `frontend/dist/index.html`.
- [ ] `/api/ping` y `/healthz` responden 200.
- [ ] Login con administrador y con vendedor.
- [ ] Inventario, ventas, clientes y proveedores cargan datos.
- [ ] Una venta descuenta stock y aparece en el historial.
- [ ] El acceso por `http://IP-LOCAL:5000` muestra la aplicación (no pantalla en blanco).
- [ ] `npm run db:backup` genera un archivo en `backups/`.
- [ ] Las contraseñas de demostración fueron cambiadas.
- [ ] `backend/.env` no se entregó junto con el código.

---

## 11. Problemas frecuentes

**Pantalla en blanco al entrar por IP de red local.**
Ya está corregido en esta versión. Si reaparece, revisa que la CSP no incluya
`upgrade-insecure-requests`.

**El puerto 5000 está ocupado.**
Cambia `PORT` en `backend/.env` o cierra el proceso que lo usa. En Windows:
`netstat -ano | findstr :5000` y luego `taskkill /PID <PID> /F`.

**Todos los usuarios comparten el límite de login.**
Falta `TRUST_PROXY=1` detrás del proxy inverso.

**Error de conexión a PostgreSQL en la nube.**
Falta `PG_SSL=true` o `DATABASE_URL` con el parámetro `sslmode=require`.

**El registro responde 403.**
`ALLOW_REGISTRATION=false`. Crea la cuenta con `npm run db:create-admin`.

**El login funciona pero las peticiones fallan por CORS.**
Agrega el dominio exacto (con `https://`) en `CORS_ORIGINS`.
