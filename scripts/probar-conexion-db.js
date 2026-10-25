// Prueba si unas credenciales pueden conectarse a la base de datos.
//
// Uso:  node scripts/probar-conexion-db.js
//
// Pide la contrasena por teclado sin mostrarla, y no la guarda en ningun lado:
// no queda en el historial de la terminal ni en ningun archivo. Sirve para
// confirmar que una contrasena funciona ANTES de pegarla en Render.
//
// Los demas datos salen del entorno, o de los valores por defecto de TiDB.

const mysql = require('mysql2/promise');
const readline = require('readline');

const CONFIG = {
  host: process.env.DB_HOST || 'gateway01.us-east-1.prod.aws.tidbcloud.com',
  port: Number(process.env.DB_PORT || 4000),
  user: process.env.DB_USER || 'hetoq6ErZJGq64t.root',
  database: process.env.DB_NAME || 'sucre_turistico',
  // TiDB en endpoint publico EXIGE TLS. Sin esto responde
  // "Connections using insecure transport are prohibited".
  ssl: {},
  connectTimeout: 20000,
};

function pedirContrasena() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    process.stdout.write('Pega la contrasena (no se va a ver mientras escribes) y dale Enter: ');
    // Oculta lo que se teclea.
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

(async () => {
  console.log('Probando conexion a:');
  console.log(`  host     ${CONFIG.host}`);
  console.log(`  puerto   ${CONFIG.port}`);
  console.log(`  usuario  ${CONFIG.user}`);
  console.log(`  base     ${CONFIG.database}\n`);

  const password = await pedirContrasena();
  if (!password) {
    console.log('No escribiste nada. Cancelado.');
    process.exit(1);
  }
  console.log(`(recibidos ${password.length} caracteres)\n`);

  let conexion;
  try {
    conexion = await mysql.createConnection({ ...CONFIG, password });
    const [filas] = await conexion.query('SELECT DATABASE() AS base, VERSION() AS version');
    console.log('CONECTO CORRECTAMENTE');
    console.log(`  base de datos: ${filas[0].base}`);
    console.log(`  version      : ${filas[0].version}`);

    const [tablas] = await conexion.query('SHOW TABLES');
    console.log(`  tablas       : ${tablas.length === 0 ? '(ninguna todavia)' : tablas.map((t) => Object.values(t)[0]).join(', ')}`);
    console.log('\nEsta contrasena sirve. Ya puedes pegarla en Render con confianza.');
  } catch (err) {
    console.log('FALLO LA CONEXION');
    console.log(`  codigo : ${err.code || err.name}`);
    console.log(`  mensaje: ${err.message}`);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n  -> La contrasena no es correcta. Resetéala en TiDB Cloud y vuelve a probar.');
      console.log('     Ojo: al resetear, la anterior deja de servir de inmediato.');
    }
    if (err.code === 'ER_UNKNOWN_ERROR' && /insecure transport/i.test(err.message)) {
      console.log('\n  -> Falta TLS. TiDB no acepta conexiones sin cifrar en el endpoint publico.');
    }
    process.exitCode = 1;
  } finally {
    if (conexion) await conexion.end();
  }
})();
