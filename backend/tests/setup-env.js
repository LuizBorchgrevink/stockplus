/**
 * Configuracion previa a cada archivo de pruebas.
 * Se ejecuta antes de cargar la aplicacion, por lo que la base de datos
 * de pruebas se selecciona antes de crear el pool de PostgreSQL.
 */
process.env.NODE_ENV = 'test';
process.env.PG_DB = process.env.PG_DB_TEST || 'stockplus_test';
process.env.JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'stockplus-test-secret';
process.env.JWT_EXPIRES_IN = '1h';
