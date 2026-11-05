/**
 * StockPlus - Rutas del Dashboard
 * Metricas reales del negocio, solo productos activos.
 */
const express = require('express');
const { query } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/http');

const router = express.Router();

router.use(authMiddleware);

function toInt(value) {
  return parseInt(value, 10) || 0;
}

function toNumber(value) {
  return parseFloat(value) || 0;
}

/**
 * GET /api/dashboard/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const [
      inventario,
      clientes,
      usuarios,
      semana,
      mes,
      stockBajo,
      grafica,
      mensuales,
      unidadesSemana,
      topProductos
    ] = await Promise.all([
      query(`
        SELECT COUNT(*)::int AS total_productos,
               COALESCE(SUM(precio * cantidad_stock), 0) AS valor_inventario,
               COUNT(*) FILTER (WHERE cantidad_stock <= stock_minimo)::int AS alertas_stock,
               COALESCE(SUM(cantidad_stock), 0)::int AS unidades_stock
        FROM productos
        WHERE activo = true
      `),
      query('SELECT COUNT(*)::int AS total FROM clientes'),
      query('SELECT COUNT(*)::int AS total FROM usuarios'),
      query(`
        SELECT COUNT(*)::int AS cantidad, COALESCE(SUM(total), 0) AS monto
        FROM ventas
        WHERE fecha >= NOW() - INTERVAL '7 days'
      `),
      query(`
        SELECT COUNT(*)::int AS cantidad, COALESCE(SUM(total), 0) AS monto
        FROM ventas
        WHERE fecha >= NOW() - INTERVAL '30 days'
      `),
      query(`
        SELECT id_producto, nombre, cantidad_stock, stock_minimo, precio
        FROM productos
        WHERE activo = true AND cantidad_stock <= stock_minimo
        ORDER BY cantidad_stock ASC, nombre
        LIMIT 10
      `),
      query(`
        WITH dias AS (
          SELECT generate_series(
            CURRENT_DATE - INTERVAL '6 days',
            CURRENT_DATE,
            INTERVAL '1 day'
          )::date AS dia
        )
        SELECT TO_CHAR(d.dia, 'YYYY-MM-DD') AS dia,
               COUNT(v.id_venta)::int AS cantidad,
               COALESCE(SUM(v.total), 0) AS monto
        FROM dias d
        LEFT JOIN ventas v ON v.fecha::date = d.dia
        GROUP BY d.dia
        ORDER BY d.dia
      `),
      query(`
        WITH meses AS (
          SELECT generate_series(
            date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
            date_trunc('month', CURRENT_DATE),
            INTERVAL '1 month'
          ) AS mes
        )
        SELECT TO_CHAR(m.mes, 'YYYY-MM') AS mes,
               COUNT(v.id_venta)::int AS cantidad,
               COALESCE(SUM(v.total), 0) AS monto
        FROM meses m
        LEFT JOIN ventas v ON date_trunc('month', v.fecha) = m.mes
        GROUP BY m.mes
        ORDER BY m.mes
      `),
      query(`
        SELECT COALESCE(SUM(dv.cantidad), 0)::int AS unidades
        FROM detalle_venta dv
        JOIN ventas v ON v.id_venta = dv.id_venta
        WHERE v.fecha >= NOW() - INTERVAL '7 days'
      `),
      query(`
        SELECT p.id_producto,
               p.nombre,
               COALESCE(SUM(dv.cantidad), 0)::int AS unidades,
               COALESCE(SUM(dv.subtotal), 0) AS monto
        FROM detalle_venta dv
        JOIN ventas v ON v.id_venta = dv.id_venta
        JOIN productos p ON p.id_producto = dv.id_producto
        WHERE v.fecha >= NOW() - INTERVAL '30 days'
        GROUP BY p.id_producto, p.nombre
        ORDER BY unidades DESC, monto DESC
        LIMIT 8
      `)
    ]);

    const inv = inventario.rows[0];

    return res.json({
      total_productos: toInt(inv.total_productos),
      valor_inventario: toNumber(inv.valor_inventario),
      alertas_stock: toInt(inv.alertas_stock),
      unidades_stock: toInt(inv.unidades_stock),
      total_clientes: toInt(clientes.rows[0].total),
      total_usuarios: toInt(usuarios.rows[0].total),
      ventas_semana: {
        cantidad: toInt(semana.rows[0].cantidad),
        monto: toNumber(semana.rows[0].monto)
      },
      ventas_mes: {
        cantidad: toInt(mes.rows[0].cantidad),
        monto: toNumber(mes.rows[0].monto)
      },
      unidades_vendidas_semana: toInt(unidadesSemana.rows[0].unidades),
      productos_stock_bajo: stockBajo.rows.map(row => ({
        ...row,
        cantidad_stock: toInt(row.cantidad_stock),
        stock_minimo: toInt(row.stock_minimo),
        precio: toNumber(row.precio)
      })),
      top_productos: topProductos.rows.map(row => ({
        ...row,
        unidades: toInt(row.unidades),
        monto: toNumber(row.monto)
      })),
      ventas_grafica: grafica.rows.map(row => ({
        dia: row.dia,
        cantidad: toInt(row.cantidad),
        monto: toNumber(row.monto)
      })),
      ventas_mensuales: mensuales.rows.map(row => ({
        mes: row.mes,
        cantidad: toInt(row.cantidad),
        monto: toNumber(row.monto)
      }))
    });
  } catch (err) {
    return sendError(res, err, 'Error al calcular las estadisticas');
  }
});

module.exports = router;
