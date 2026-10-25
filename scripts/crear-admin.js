// Crea la cuenta de administrador llamando a la API del gateway.
//
// Uso:
//   node scripts/crear-admin.js                      (contra el gateway local)
//   node scripts/crear-admin.js <url-del-gateway>    (contra produccion)
//
// Pide la contrasena por teclado sin mostrarla, asi no queda en el historial
// de la terminal. La primera cuenta se puede crear sin token; despues de esa,
// hace falta estar autenticado (ver docs/AUTENTICACION.md).

const readline = require('readline');

const API = process.argv[2] || 'http://localhost:4000';

function preguntar(texto, ocultar = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    process.stdout.write(texto);
    const escribirOriginal = rl.output.write.bind(rl.output);
    if (ocultar) rl.output.write = () => {};
    rl.question('', (valor) => {
      rl.output.write = escribirOriginal;
      if (ocultar) process.stdout.write('\n');
      rl.close();
      resolve(valor.trim());
    });
  });
}

(async () => {
  console.log(`Creando administrador en: ${API}\n`);

  const nombre = await preguntar('Nombre: ');
  const email = await preguntar('Email: ');
  const password = await preguntar('Contrasena (minimo 8, no se va a ver): ', true);

  if (!nombre || !email || !password) {
    console.log('\nFaltan datos. Cancelado.');
    process.exit(1);
  }
  if (password.length < 8) {
    console.log('\nLa contrasena debe tener al menos 8 caracteres.');
    process.exit(1);
  }

  try {
    const res = await fetch(`${API}/api/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password }),
    });
    const cuerpo = await res.json();

    if (res.status === 201) {
      console.log('\nCUENTA CREADA');
      console.log(`  id     ${cuerpo.id}`);
      console.log(`  nombre ${cuerpo.nombre}`);
      console.log(`  email  ${cuerpo.email}`);
      console.log('\nGuarda esa contrasena: no se puede recuperar, solo reemplazar.');
      return;
    }

    console.log(`\nNO SE PUDO CREAR  (HTTP ${res.status})`);
    console.log(`  ${cuerpo.error || JSON.stringify(cuerpo)}`);
    if (res.status === 401) {
      console.log('\n  -> Ya existe al menos una cuenta, asi que crear otra exige estar autenticado.');
    }
    if (res.status === 409) {
      console.log('\n  -> Ese email ya esta registrado.');
    }
    if (res.status === 503) {
      console.log('\n  -> Al servidor le falta la variable JWT_SECRET.');
    }
    process.exitCode = 1;
  } catch (err) {
    console.log('\nNO SE PUDO CONECTAR CON EL GATEWAY');
    console.log(`  ${err.message}`);
    console.log(`\n  -> ¿Esta corriendo ${API}?`);
    process.exitCode = 1;
  }
})();
