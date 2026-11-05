-- ============================================
-- StockPlus - Esquema de base de datos (PostgreSQL)
-- Script idempotente: se puede ejecutar varias veces
-- sin borrar informacion existente.
-- ============================================

-- Tipo ENUM para roles
DO $$ BEGIN
    CREATE TYPE rol_usuario AS ENUM ('administrador', 'vendedor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario    SERIAL PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    correo        VARCHAR(100) UNIQUE NOT NULL,
    contrasena    VARCHAR(255) NOT NULL,
    rol           rol_usuario NOT NULL DEFAULT 'vendedor',
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id_proveedor  SERIAL PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    contacto      VARCHAR(100),
    telefono      VARCHAR(20),
    direccion     VARCHAR(255),
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id_producto     SERIAL PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    descripcion     TEXT,
    precio          DECIMAL(12, 2) NOT NULL CHECK (precio > 0),
    cantidad_stock  INT NOT NULL DEFAULT 0 CHECK (cantidad_stock >= 0),
    stock_minimo    INT NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
    id_proveedor    INT,
    activo          BOOLEAN NOT NULL DEFAULT true,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor) ON DELETE RESTRICT
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id_cliente  SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    correo      VARCHAR(100),
    telefono    VARCHAR(20),
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS ventas (
    id_venta    SERIAL PRIMARY KEY,
    fecha       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_cliente  INT,
    total       DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    id_usuario  INT,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE RESTRICT,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

-- Tabla de detalle de venta
CREATE TABLE IF NOT EXISTS detalle_venta (
    id_detalle        SERIAL PRIMARY KEY,
    id_venta          INT NOT NULL,
    id_producto       INT NOT NULL,
    cantidad          INT NOT NULL CHECK (cantidad > 0),
    precio_unitario   DECIMAL(12, 2) NOT NULL CHECK (precio_unitario > 0),
    subtotal          DECIMAL(14, 2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE RESTRICT
);

-- ============================================
-- Restricciones para bases existentes
-- (no fallan si ya existen)
-- ============================================

-- Corrige stock negativo heredado de versiones anteriores; sin esto
-- la restriccion de stock no se puede crear en una base ya usada.
UPDATE productos SET cantidad_stock = 0 WHERE cantidad_stock < 0;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'productos_cantidad_stock_check') THEN
        ALTER TABLE productos ADD CONSTRAINT productos_cantidad_stock_check CHECK (cantidad_stock >= 0);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'productos_stock_minimo_check') THEN
        ALTER TABLE productos ADD CONSTRAINT productos_stock_minimo_check CHECK (stock_minimo >= 0);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'detalle_venta_cantidad_check') THEN
        ALTER TABLE detalle_venta ADD CONSTRAINT detalle_venta_cantidad_check CHECK (cantidad > 0);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'detalle_venta_precio_unitario_check') THEN
        ALTER TABLE detalle_venta ADD CONSTRAINT detalle_venta_precio_unitario_check CHECK (precio_unitario > 0);
    END IF;
END $$;

-- Evita eliminar clientes con ventas y proveedores con productos.
DO $$ BEGIN
    ALTER TABLE ventas DROP CONSTRAINT IF EXISTS ventas_id_cliente_fkey;
    ALTER TABLE ventas ADD CONSTRAINT ventas_id_cliente_fkey
        FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE RESTRICT;
END $$;

DO $$ BEGIN
    ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_id_proveedor_fkey;
    ALTER TABLE productos ADD CONSTRAINT productos_id_proveedor_fkey
        FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor) ON DELETE RESTRICT;
END $$;

-- ============================================
-- Indices
-- ============================================
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre);
CREATE INDEX IF NOT EXISTS idx_productos_stock ON productos(cantidad_stock);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(id_cliente);
CREATE INDEX IF NOT EXISTS idx_ventas_usuario ON ventas(id_usuario);
CREATE INDEX IF NOT EXISTS idx_detalle_venta_id ON detalle_venta(id_venta);
CREATE INDEX IF NOT EXISTS idx_detalle_producto ON detalle_venta(id_producto);
CREATE INDEX IF NOT EXISTS idx_usuarios_correo ON usuarios(correo);
CREATE INDEX IF NOT EXISTS idx_clientes_correo ON clientes(correo);
