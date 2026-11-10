// Implementacion del repositorio de usuarios que vive en memoria, sin MySQL.
// La usan las pruebas, y sirve tambien para levantar el gateway sin base de
// datos mientras se trabaja en el front-end. Mismas funciones que
// usuarios-repo.js. Los usuarios iniciales sin rol son superadmin, como las
// cuentas que ya existian antes de los roles.
function crearRepoEnMemoria(iniciales = []) {
  const usuarios = iniciales.map((u, i) => ({
    id: i + 1, rol: 'superadmin', activo: true, debe_cambiar_password: false, ...u,
  }));
  let siguienteId = usuarios.length + 1;
  const publico = ({ password_hash: _hash, ...resto }) => ({ ...resto });

  return {
    async buscarPorEmail(email) {
      return usuarios.find((u) => u.email === email) || null;
    },
    async buscarPorId(id) {
      const u = usuarios.find((x) => x.id === Number(id));
      return u ? publico(u) : null;
    },
    async crear({ nombre, email, passwordHash, rol, debeCambiar = false }) {
      const usuario = { id: siguienteId++, nombre, email, password_hash: passwordHash, rol, activo: true, debe_cambiar_password: debeCambiar };
      usuarios.push(usuario);
      return { id: usuario.id, nombre, email, rol };
    },
    async contar() {
      return usuarios.length;
    },
    async listar() {
      return usuarios.map(publico);
    },
    async cambiarActivo(id, activo) {
      const u = usuarios.find((x) => x.id === Number(id));
      if (u) u.activo = activo;
      return Boolean(u);
    },
    async cambiarPassword(id, passwordHash, debeCambiar) {
      const u = usuarios.find((x) => x.id === Number(id));
      if (u) Object.assign(u, { password_hash: passwordHash, debe_cambiar_password: debeCambiar });
      return Boolean(u);
    },
  };
}

module.exports = { crearRepoEnMemoria };
