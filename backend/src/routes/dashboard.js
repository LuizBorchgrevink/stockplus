/**
 * StockPlus - Rutas del Dashboard
 * Estadísticas y métricas para el panel principal
 */
const express = require('express');
const { query } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * GET /api/dashboard/stats
 * Retorna todas las estadísticas para el dashboard
 */
router.get('/stats', async (req, res) => {
  try {
    // Total de productos
    const totalProductosResult = await query('SELECT COUNT(*) AS total FROM productos');
    const total_productos = parseInt(totalProductosResult.rows[0].total, 10);

    // Valor total del inventario
    const valorResult = await query(
      'SELECT COALESCE(SUM(precio * cantidad_stock), 0) AS valor FROM productos'
    );
    const valor_inventario = parseFloat(valorResult.rows[0].valor);

    // Alertas de stock bajo
    const alertasResult = await query(
      'SELECT COUNT(*) AS total FROM productos WHERE cantidad_stock <= stock_minimo'
    );
    const alertas_stock = parseInt(alertasResult.rows[0].total, 10);

    // Total de clientes
    const clientesResult = await query('SELECT COUNT(*) AS total FROM clientes');
    const total_clientes = parseInt(clientesResult.rows[0].total, 10);

    // Ventas de la última semana
    const ventasSemanaResult = await query(`
      SELECT COUNT(*) AS total, COALESCE(SUM(total), 0) AS monto
      FROM ventas WHERE fecha >= NOW() - INTERVAL '7 days'
    `);
    const ventas_semana = {
      cantidad: parseInt(ventasSemanaResult.rows[0].total, 10),
      monto: parseFloat(ventasSemanaResult.rows[0].monto)
    };

    // Ventas del último mes
    const ventasMesResult = await query(`
      SELECT COUNT(*) AS total, COALESCE(SUM(total), 0) AS monto
      FROM ventas WHERE fecha >= NOW() - INTERVAL '30 days'
    `);
    const ventas_mes = {
      cantidad: parseInt(ventasMesResult.rows[0].total, 10),
      monto: parseFloat(ventasMesResult.rows[0].monto)
    };

    // Productos con stock bajo (top 10)
    const stockBajoResult = await query(`
      SELECT id_producto, nombre, cantidad_stock, stock_minimo, precio
      FROM productos WHERE cantidad_stock <= stock_minimo
      ORDER BY cantidad_stock ASC LIMIT 10
    `);
    const productos_stock_bajo = stockBajoResult.rows;

    // Gráfica de ventas por día (última semana)
    const ventasGraficaResult = await query(`
      SELECT DATE(fecha) AS dia, COUNT(*) AS cantidad, SUM(total) AS monto
      FROM ventas WHERE fecha >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(fecha) ORDER BY dia
    `);
    const ventas_grafica = ventasGraficaResult.rows.map(r => ({
      dia: r.dia ? r.dia.toISOString().split('T')[0] : null,
      cantidad: parseInt(r.cantidad, 10),
      monto: parseFloat(r.monto)
    }));

    // Ventas por mes (últimos 6 meses)
    const ventasMensualesResult = await query(`
      SELECT TO_CHAR(fecha, 'YYYY-MM') AS mes,
             COUNT(*) AS cantidad,
             COALESCE(SUM(total), 0) AS monto
      FROM ventas
      WHERE fecha >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(fecha, 'YYYY-MM')
      ORDER BY mes
    `);
    const ventas_mensuales = ventasMensualesResult.rows.map(r => ({
      mes: r.mes,
      cantidad: parseInt(r.cantidad, 10),
      monto: parseFloat(r.monto)
    }));

    return res.json({
      total_productos,
      valor_inventario,
      alertas_stock,
      total_clientes,
      ventas_semana,
      ventas_mes,
      productos_stock_bajo,
      ventas_grafica,
      ventas_mensuales
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
