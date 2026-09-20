// Implementacion del repositorio de usuarios que vive en memoria, sin MySQL.
// La usan las pruebas, y sirve tambien para levantar el gateway sin base de datos
// mientras se trabaja en el front-end.
function crearRepoEnMemoria(iniciales = []) {
  const usuarios = iniciales.map((u, i) => ({ id: i + 1, ...u }));
  let siguienteId = usuarios.length + 1;

  return {
    async buscarPorEmail(email) {
      return usuarios.find((u) => u.email === email) || null;
    },
    async crear({ nombre, email, passwordHash, rol }) {
      const usuario = { id: siguienteId++, nombre, email, password_hash: passwordHash, rol };
      usuarios.push(usuario);
      return { id: usuario.id, nombre, email, rol };
    },
    async contar() {
      return usuarios.length;
    },
  };
}

module.exports = { crearRepoEnMemoria };
