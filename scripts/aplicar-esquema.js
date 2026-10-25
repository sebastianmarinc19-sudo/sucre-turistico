// Aplica el esquema de docs/sql/ a la base de datos (TiDB en produccion).
//
// Uso:
//   node scripts/aplicar-esquema.js              (tablas + datos de ejemplo)
//   node scripts/aplicar-esquema.js --sin-datos  (solo tablas)
//
// Pide la contrasena por teclado sin mostrarla. Los demas datos salen del
// entorno, o de los valores por defecto de TiDB (los mismos que
// probar-conexion-db.js).
//
// Se puede correr varias veces: 01-03 usan CREATE TABLE IF NOT EXISTS e
// INSERT IGNORE, y 04 se salta si la tabla destinos ya tiene filas (sus
// INSERT no son idempotentes y duplicarian los datos de ejemplo).

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const readline = require('readline');

const SQL_DIR = path.join(__dirname, '..', 'docs', 'sql');
const ESQUEMA = ['01-usuarios.sql', '02-municipios.sql', '03-catalogo.sql'];
const DATOS = '04-datos-ejemplo.sql';
const TABLAS = ['usuarios', 'municipios', 'destinos', 'alojamientos', 'restaurantes', 'platos', 'experiencias', 'eventos'];

const CONFIG = {
  host: process.env.DB_HOST || 'gateway01.us-east-1.prod.aws.tidbcloud.com',
  port: Number(process.env.DB_PORT || 4000),
  user: process.env.DB_USER || 'hetoq6ErZJGq64t.root',
  database: process.env.DB_NAME || 'sucre_turistico',
  // TiDB exige TLS en el endpoint publico. DB_SSL=false solo para MySQL local.
  ssl: process.env.DB_SSL === 'false' ? undefined : {},
  multipleStatements: true,
  connectTimeout: 20000,
};

function pedirContrasena() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    process.stdout.write('Pega la contrasena (no se va a ver mientras escribes) y dale Enter: ');
    const alEscribir = rl.output.write.bind(rl.output);
    rl.output.write = () => {};
    rl.question('', (valor) => {
      rl.output.write = alEscribir;
      process.stdout.write('\n');
      rl.close();
      resolve(valor.trim());
    });
  });
}

async function contarFilas(conexion) {
  const [existentes] = await conexion.query('SHOW TABLES');
  const nombres = new Set(existentes.map((t) => Object.values(t)[0]));
  const conteo = {};
  for (const tabla of TABLAS) {
    if (!nombres.has(tabla)) { conteo[tabla] = '(no existe)'; continue; }
    const [[fila]] = await conexion.query(`SELECT COUNT(*) AS n FROM \`${tabla}\``);
    conteo[tabla] = fila.n;
  }
  return conteo;
}

function mostrar(titulo, conteo) {
  console.log(titulo);
  for (const [tabla, n] of Object.entries(conteo)) console.log(`  ${tabla.padEnd(13)} ${n}`);
  console.log('');
}

async function aplicar(conexion, archivo) {
  process.stdout.write(`Aplicando ${archivo} ... `);
  await conexion.query(fs.readFileSync(path.join(SQL_DIR, archivo), 'utf8'));
  console.log('ok');
}

(async () => {
  const sinDatos = process.argv.includes('--sin-datos');
  console.log(`Base de datos: ${CONFIG.user}@${CONFIG.host}:${CONFIG.port}/${CONFIG.database}\n`);

  // DB_PASSWORD solo para pruebas locales; en produccion se pide por teclado.
  const password = process.env.DB_PASSWORD || await pedirContrasena();
  if (!password) {
    console.log('No escribiste nada. Cancelado.');
    process.exit(1);
  }

  let conexion;
  try {
    conexion = await mysql.createConnection({ ...CONFIG, password });
    mostrar('Antes:', await contarFilas(conexion));

    for (const archivo of ESQUEMA) await aplicar(conexion, archivo);

    if (sinDatos) {
      console.log(`Saltando ${DATOS} (--sin-datos).`);
    } else {
      const [[{ n }]] = await conexion.query('SELECT COUNT(*) AS n FROM destinos');
      if (n > 0) console.log(`Saltando ${DATOS}: destinos ya tiene ${n} filas y se duplicarian.`);
      else await aplicar(conexion, DATOS);
    }

    console.log('');
    mostrar('Despues:', await contarFilas(conexion));
    console.log('Listo.');
  } catch (err) {
    console.log('\nFALLO');
    console.log(`  codigo : ${err.code || err.name}`);
    console.log(`  mensaje: ${err.message}`);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') console.log('\n  -> La contrasena no es correcta.');
    process.exitCode = 1;
  } finally {
    if (conexion) await conexion.end();
  }
})();
