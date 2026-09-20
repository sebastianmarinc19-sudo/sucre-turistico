const jwt = require('jsonwebtoken');

const EXPIRA_EN = '8h';

function secreto() {
  const s = process.env.JWT_SECRET;
  if (!s) {
    throw new Error(
      'Falta la variable JWT_SECRET. Corre `npm run setup` en la raiz del proyecto, ' +
      'o defínela en el entorno antes de arrancar el gateway.'
    );
  }
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

// Se llama al construir la app para fallar al arrancar, y no a mitad de un login,
// si el secreto no esta configurado.
function verificarConfiguracion() {
  secreto();
}

module.exports = { firmar, verificar, verificarConfiguracion, EXPIRA_EN };
