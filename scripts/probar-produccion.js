// Prueba rapida de que produccion funciona de punta a punta.
//
// Uso:
//   node scripts/probar-produccion.js
//   node scripts/probar-produccion.js <url-del-gateway> <url-del-frontend>
//
// Correrlo antes de una demo: ademas de comprobar todo, deja los servicios
// despiertos. No escribe nada en la base de datos.
//
// Termina con codigo 1 si algo falla, para poder usarlo en CI.

const GATEWAY = process.argv[2] || 'https://sucre-turistico.onrender.com';
const FRONTEND = process.argv[3] || 'https://sucre-turistico-frontend.vercel.app';

// Si el gateway llama a un servicio dormido, Render le responde 429 y no lo
// despierta (ver docs/DEPLOYMENT.md). Por eso primero se les pega directo.
// Misma lista que frontend/src/api/despertar.js.
const SERVICIOS = [
  'https://sucre-turistico-destinos-service.onrender.com',
  'https://sucre-turistico-alojamiento-service.onrender.com',
  'https://sucre-turistico-gastronomia-service.onrender.com',
  'https://sucre-turistico-experiencias-service.onrender.com',
  'https://sucre-turistico-eventos-service.onrender.com',
];

const CATALOGOS = ['destinos', 'alojamientos', 'gastronomia', 'experiencias', 'eventos'];

const resultados = [];

function registrar(ok, nombre, detalle) {
  resultados.push({ ok, nombre, detalle });
  console.log(`${ok ? 'OK   ' : 'FALLA'}  ${nombre.padEnd(42)} ${detalle}`);
}

async function pedir(url, opciones = {}) {
  const inicio = Date.now();
  const res = await fetch(url, { ...opciones, signal: AbortSignal.timeout(90000) });
  const texto = await res.text();
  return { status: res.status, texto, segundos: ((Date.now() - inicio) / 1000).toFixed(1) };
}

// Reintenta mientras el gateway responda 429 (servicio aun arrancando).
async function pedirConReintentos(url, intentos = 12) {
  for (let i = 1; ; i++) {
    const r = await pedir(url);
    if (r.status !== 429 || i >= intentos) return r;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

async function despertar() {
  console.log('Despertando los microservicios (puede tardar ~1 min si estaban dormidos)...\n');
  await Promise.all(SERVICIOS.map(async (url) => {
    const nombre = `despertar ${new URL(url).hostname.split('-')[2]}`;
    try {
      const r = await pedir(`${url}/health`);
      registrar(r.status === 200, nombre, `${r.status} en ${r.segundos}s`);
    } catch (err) {
      registrar(false, nombre, err.message);
    }
  }));
}

async function probarCatalogos() {
  console.log('\nCatalogos a traves del API Gateway:\n');
  for (const c of CATALOGOS) {
    try {
      const r = await pedirConReintentos(`${GATEWAY}/api/${c}`);
      const datos = r.status === 200 ? JSON.parse(r.texto) : null;
      const ok = Array.isArray(datos) && datos.length > 0;
      registrar(ok, `GET /api/${c}`, ok ? `${datos.length} registros en ${r.segundos}s` : `HTTP ${r.status}`);
    } catch (err) {
      registrar(false, `GET /api/${c}`, err.message);
    }
  }

  try {
    const r = await pedirConReintentos(`${GATEWAY}/api/eventos?desde=2000-01-01&hasta=2100-12-31`);
    registrar(r.status === 200 && Array.isArray(JSON.parse(r.texto)), 'GET /api/eventos con filtro de fechas', `HTTP ${r.status}`);
  } catch (err) {
    registrar(false, 'GET /api/eventos con filtro de fechas', err.message);
  }
}

async function probarSeguridad() {
  console.log('\nSeguridad:\n');
  try {
    const r = await pedir(`${GATEWAY}/api/destinos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'no deberia guardarse', municipio_id: 1, categoria: 'playa' }),
    });
    registrar(r.status === 401, 'POST sin token es rechazado', `HTTP ${r.status} (se espera 401)`);
  } catch (err) {
    registrar(false, 'POST sin token es rechazado', err.message);
  }

  // Con el cuerpo vacio no se crea nada: si no hay admin responde 400
  // (faltan datos); si ya hay, 401 (hace falta token).
  try {
    const r = await pedir(`${GATEWAY}/api/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    const detalle = r.status === 401
      ? 'existe al menos un administrador'
      : 'NO hay administrador: cualquiera puede crear el primero. Correr scripts/crear-admin.js';
    registrar(r.status === 401, 'Hay un administrador creado', detalle);
  } catch (err) {
    registrar(false, 'Hay un administrador creado', err.message);
  }
}

async function probarFrontend() {
  console.log('\nFrontend:\n');
  for (const ruta of ['/', '/eventos', '/admin']) {
    try {
      const r = await pedir(`${FRONTEND}${ruta}`);
      const ok = r.status === 200 && r.texto.includes('id="root"');
      registrar(ok, `Frontend ${ruta}`, `HTTP ${r.status}`);
    } catch (err) {
      registrar(false, `Frontend ${ruta}`, err.message);
    }
  }
}

(async () => {
  console.log(`Gateway:  ${GATEWAY}\nFrontend: ${FRONTEND}\n`);
  await despertar();
  await probarCatalogos();
  await probarSeguridad();
  await probarFrontend();

  const fallas = resultados.filter((r) => !r.ok);
  console.log(`\n${resultados.length - fallas.length}/${resultados.length} pruebas OK.`);
  if (fallas.length) {
    console.log('Fallaron:');
    for (const f of fallas) console.log(`  - ${f.nombre}: ${f.detalle}`);
    process.exitCode = 1;
  }
})();
