// Filtro de una sola opcion con forma de chips, como en el prototipo.
// opciones: [{ valor, etiqueta }]. El chip "Todos" deja el valor vacio.
function Chips({ opciones, valor, onChange, todos = 'Todos', etiqueta }) {
  return (
    <div className="st-chips" role="group" aria-label={etiqueta}>
      <button type="button" className={`st-chip ${!valor ? 'activo' : ''}`} aria-pressed={!valor} onClick={() => onChange('')}>
        {todos}
      </button>
      {opciones.map((o) => (
        <button key={o.valor} type="button" className={`st-chip ${valor === o.valor ? 'activo' : ''}`}
          aria-pressed={valor === o.valor} onClick={() => onChange(valor === o.valor ? '' : o.valor)}>
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
}

export default Chips;
