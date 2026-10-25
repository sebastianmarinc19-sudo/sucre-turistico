// Reemplaza la contrasena de una cuenta de administrador directo en la base.
//
// Uso:
//   node scripts/cambiar-contrasena-admin.js
//
// Para cuando se olvido la contrasena: no se puede recuperar (solo se guarda
// el hash de bcrypt), pero si reemplazar. Pide el email de la cuenta, la
// contrasena nueva dos veces y la contrasena de TiDB, todo sin mostrarlo.
// Los datos de conexion son los mismos de aplicar-esquema.js.

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Igual que api-gateway/src/auth/routes.js.
const RONDAS_BCRYPT = 10;

const CONFIG = {
  host: process.env.DB_HOST || 'gateway01.us-east-1.prod.aws.tidbcloud.com',
  port: Number(process.env.DB_PORT || 4000),
  user: process.env.DB_USER || 'hetoq6ErZJGq64t.root',
  database: process.env.DB_NAME || 'sucre_turistico',
  ssl: process.env.DB_SSL === 'false' ? undefined : {},
  connectTimeout: 20000,
};

// Una sola interfaz y una cola de lineas: si se pegan varias respuestas de
// una vez, las que llegan antes de su pregunta quedan esperando en vez de
// perderse.
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
let ocultando = false;
rl._writeToOutput = (texto) => { if (!ocultando) rl.output.write(texto); };

const pendientes = [];
let alResponder = null;
rl.on('line', (linea) => {
  if (alResponder) {
    const responder = alResponder;
    alResponder = null;
    responder(linea);
  } else {
    pendientes.push(linea);
  }
});

// Cada pregunta va en su propia linea: algunas terminales no muestran una
// linea sin terminar y la pregunta quedaba oculta (ver crear-admin.js).
function preguntar(texto, ocultar = false) {
  process.stdout.write(`${texto}\n> `);
  ocultando = ocultar;
  return new Promise((resolve) => {
    const responder = (valor) => {
      if (ocultando) process.stdout.write('\n');
      ocultando = false;
      resolve(valor.trim());
    };
    if (pendientes.length) responder(pendientes.shift());
    else alResponder = responder;
  });
}

function salir(mensaje) {
  console.log(`\n${mensaje}`);
  process.exit(1);
}

(async () => {
  console.log(`Base de datos: ${CONFIG.user}@${CONFIG.host}:${CONFIG.port}/${CONFIG.database}\n`);

  const email = await preguntar('1/4  Email de la cuenta de administrador:');
  if (!email) salir('Falta el email. Cancelado.');

  const nueva = await preguntar('2/4  Contrasena NUEVA del panel (minimo 8, no se va a ver):', true);
  if (nueva.length < 8) salir('La contrasena debe tener al menos 8 caracteres. Cancelado.');
  const repetida = await preguntar('3/4  Repite la contrasena nueva:', true);
  if (nueva !== repetida) salir('Las dos contrasenas no coinciden. Cancelado, no se cambio nada.');

  const passwordDb = process.env.DB_PASSWORD || await preguntar('4/4  Contrasena de TiDB (la de DB_PASSWORD en Render):', true);
  if (!passwordDb) salir('Falta la contrasena de TiDB. Cancelado.');
  rl.close();

  let conexion;
  try {
    conexion = await mysql.createConnection({ ...CONFIG, password: passwordDb });
    const hash = await bcrypt.hash(nueva, RONDAS_BCRYPT);
    const [resultado] = await conexion.query('UPDATE usuarios SET password_hash = ? WHERE email = ?', [hash, email]);

    if (resultado.affectedRows === 0) {
      const [filas] = await conexion.query('SELECT email FROM usuarios ORDER BY id');
      console.log(`\nNO SE CAMBIO NADA: no hay ninguna cuenta con el email "${email}".`);
      console.log(`  Cuentas que existen: ${filas.map((f) => f.email).join(', ') || '(ninguna)'}`);
      process.exitCode = 1;
      return;
    }
    console.log(`\nCONTRASENA CAMBIADA para ${email}.`);
    console.log('Ya puedes entrar al panel con la nueva. Guardala bien.');
  } catch (err) {
    console.log('\nFALLO');
    console.log(`  codigo : ${err.code || err.name}`);
    console.log(`  mensaje: ${err.message}`);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') console.log('\n  -> La contrasena de TiDB no es correcta.');
    process.exitCode = 1;
  } finally {
    if (conexion) await conexion.end();
  }
})();
