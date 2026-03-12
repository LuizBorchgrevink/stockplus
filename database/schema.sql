-- ============================================
-- StockPlus - Base de Datos
-- ============================================

CREATE DATABASE IF NOT EXISTS stockplus;
USE stockplus;

-- Tabla de usuarios
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    rol ENUM('administrador', 'vendedor') DEFAULT 'vendedor',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de proveedores
CREATE TABLE proveedores (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    contacto VARCHAR(100),
    telefono VARCHAR(20),
    direccion VARCHAR(255),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL CHECK (precio > 0),
    cantidad_stock INT NOT NULL DEFAULT 0,
    stock_minimo INT DEFAULT 5,
    id_proveedor INT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor) ON DELETE SET NULL
);

-- Tabla de clientes
CREATE TABLE clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100),
    telefono VARCHAR(20),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de ventas
CREATE TABLE ventas (
    id_venta INT AUTO_INCREMENT PRIMARY KEY,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_cliente INT,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    id_usuario INT,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE SET NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

-- Tabla de detalle de venta
CREATE TABLE detalle_venta (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE RESTRICT
);

-- ============================================
-- Datos de prueba
-- ============================================

INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES
('Admin Principal', 'admin@stockplus.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeSSiEMCcpNOGMFt/5TZjnMuW', 'administrador'),
('Vendedor Demo', 'vendedor@stockplus.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeSSiEMCcpNOGMFt/5TZjnMuW', 'vendedor');
-- Contraseña para ambos: password123

INSERT INTO proveedores (nombre, contacto, telefono, direccion) VALUES
('Distribuidora ABC', 'Carlos López', '3001234567', 'Calle 10 #45-20, Bogotá'),
('Importaciones XYZ', 'María García', '3109876543', 'Av. 30 #12-50, Medellín');

INSERT INTO productos (nombre, descripcion, precio, cantidad_stock, stock_minimo, id_proveedor) VALUES
('Laptop Dell 15"', 'Laptop Intel Core i5, 8GB RAM, 256GB SSD', 2500000, 10, 3, 1),
('Mouse Inalámbrico', 'Mouse ergonómico 2.4GHz', 45000, 50, 10, 1),
('Teclado Mecánico', 'Teclado RGB switches azules', 180000, 25, 5, 2),
('Monitor 24"', 'Monitor Full HD IPS 75Hz', 650000, 8, 2, 2),
('Audífonos USB', 'Audífonos con micrófono integrado', 95000, 3, 5, 1);

INSERT INTO clientes (nombre, correo, telefono) VALUES
('Juan Pérez', 'juan@email.com', '3001111111'),
('Ana Martínez', 'ana@email.com', '3002222222'),
('Carlos Rueda', 'carlos@email.com', '3003333333');
