// Los cuatro estados de toda lista que viene de la API: cargando, error,
// vacia y con datos. Cada pagina solo decide como pinta cada elemento.
function EstadoLista({ cargando, error, vacio, nombre, children }) {
  if (cargando) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status"><span className="visually-hidden">Cargando {nombre}…</span></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="alert alert-warning" role="alert">
        <p className="mb-1 fw-semibold">No se pudieron cargar los {nombre}</p>
        <p className="mb-0 small">{error}</p>
      </div>
    );
  }
  if (vacio) {
    return (
      <div className="text-center py-5 text-muted" role="status">
        <i className="fas fa-magnifying-glass fa-2x mb-3 d-block opacity-50" aria-hidden="true" />
        No hay {nombre} que coincidan con los filtros.
      </div>
    );
  }
  return <div className="row g-4">{children}</div>;
}

export default EstadoLista;
