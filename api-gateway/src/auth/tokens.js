const jwt = require('jsonwebtoken');

const EXPIRA_EN = '8h';

// Si falta el secreto, la autenticacion queda deshabilitada, pero el gateway
// sigue en pie: el catalogo es publico y no tiene por que caerse porque el
// login este mal configurado. Las escrituras siguen rechazadas (503), asi que
// esto no abre ningun hueco: sin secreto no se puede emitir ni verificar nada.
function haySecreto() {
  return Boolean(process.env.JWT_SECRET);
}

function secreto() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET no esta definido');
  return s;
}

function firmar(usuario) {
  return jwt.sign(
    { sub: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol },
    secreto(),
    { expiresIn: EXPIRA_EN }
  );
}

function verificar(token) {
  return jwt.verify(token, secreto());
}

// Se llama al construir la app. No lanza: avisa fuerte en los logs para que
// quien despliegue lo vea, y sigue.
function avisarSiFaltaConfiguracion(log = console.warn) {
  if (haySecreto()) return;
  log(
    '[api-gateway] AVISO: falta la variable JWT_SECRET.\n' +
    '  El catalogo y el proxy funcionan normalmente.\n' +
    '  El login y las escrituras (POST/PUT/DELETE) quedan deshabilitados y responden 503.\n' +
    '  En local: corre `npm run setup` desde la raiz. En Render: definela en Environment.'
  );
}

module.exports = { firmar, verificar, haySecreto, avisarSiFaltaConfiguracion, EXPIRA_EN };
