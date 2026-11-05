-- ============================================
-- StockPlus - Datos de demostracion
-- Hash bcrypt valido para la contrasena: password123
-- Se puede ejecutar varias veces sin duplicar registros.
-- ============================================

INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES
    ('Admin Principal', 'admin@stockplus.com', '$2a$12$Gqmf.l1Ezo0085zvqcWLQOhcb5u7MmjwFHL4LudodfaWrerRGXpNu', 'administrador'),
    ('Vendedor Demo', 'vendedor@stockplus.com', '$2a$12$Gqmf.l1Ezo0085zvqcWLQOhcb5u7MmjwFHL4LudodfaWrerRGXpNu', 'vendedor')
ON CONFLICT (correo) DO NOTHING;

INSERT INTO proveedores (nombre, contacto, telefono, direccion)
SELECT 'Distribuidora ABC', 'Carlos Lopez', '3001234567', 'Calle 10 #45-20, Bogota'
WHERE NOT EXISTS (SELECT 1 FROM proveedores WHERE nombre = 'Distribuidora ABC');

INSERT INTO proveedores (nombre, contacto, telefono, direccion)
SELECT 'Importaciones XYZ', 'Maria Garcia', '3109876543', 'Av. 30 #12-50, Medellin'
WHERE NOT EXISTS (SELECT 1 FROM proveedores WHERE nombre = 'Importaciones XYZ');

INSERT INTO productos (nombre, descripcion, precio, cantidad_stock, stock_minimo, id_proveedor, activo)
SELECT 'Laptop Dell 15"', 'Laptop Intel Core i5, 8GB RAM, 256GB SSD', 2500000, 10, 3,
       (SELECT id_proveedor FROM proveedores WHERE nombre = 'Distribuidora ABC' LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Laptop Dell 15"');

INSERT INTO productos (nombre, descripcion, precio, cantidad_stock, stock_minimo, id_proveedor, activo)
SELECT 'Mouse Inalambrico', 'Mouse ergonomico 2.4GHz', 45000, 50, 10,
       (SELECT id_proveedor FROM proveedores WHERE nombre = 'Distribuidora ABC' LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Mouse Inalambrico');

INSERT INTO productos (nombre, descripcion, precio, cantidad_stock, stock_minimo, id_proveedor, activo)
SELECT 'Teclado Mecanico', 'Teclado RGB switches azules', 180000, 25, 5,
       (SELECT id_proveedor FROM proveedores WHERE nombre = 'Importaciones XYZ' LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Teclado Mecanico');

INSERT INTO productos (nombre, descripcion, precio, cantidad_stock, stock_minimo, id_proveedor, activo)
SELECT 'Monitor 24"', 'Monitor Full HD IPS 75Hz', 650000, 8, 2,
       (SELECT id_proveedor FROM proveedores WHERE nombre = 'Importaciones XYZ' LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Monitor 24"');

INSERT INTO productos (nombre, descripcion, precio, cantidad_stock, stock_minimo, id_proveedor, activo)
SELECT 'Audifonos USB', 'Audifonos con microfono integrado', 95000, 3, 5,
       (SELECT id_proveedor FROM proveedores WHERE nombre = 'Distribuidora ABC' LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Audifonos USB');

INSERT INTO clientes (nombre, correo, telefono)
SELECT 'Juan Perez', 'juan@email.com', '3001111111'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE correo = 'juan@email.com');

INSERT INTO clientes (nombre, correo, telefono)
SELECT 'Ana Martinez', 'ana@email.com', '3002222222'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE correo = 'ana@email.com');

INSERT INTO clientes (nombre, correo, telefono)
SELECT 'Carlos Rueda', 'carlos@email.com', '3003333333'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE correo = 'carlos@email.com');
