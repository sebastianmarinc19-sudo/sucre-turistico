import { Check, Clock, MessageCircle, Phone, RotateCcw, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api, { mensajeDeError } from '../api/client';
import { CATALOGO } from '../catalogo';
import { rangoDeFechas } from '../fechas';
import { cargarReservas } from './reservasApi';

// Bandeja de reservas: las de las fichas del negocio (o todas, si es el
// superadmin), juntando las tres secciones que reciben reservas.

const FILTROS = [
  { valor: 'pendiente', texto: 'Pendientes' },
  { valor: 'confirmada', texto: 'Confirmadas' },
  { valor: 'rechazada', texto: 'Rechazadas' },
  { valor: '', texto: 'Todas' },
];
const ETIQUETA_ESTADO = { pendiente: 'Pendiente', confirmada: 'Confirmada', rechazada: 'Rechazada' };

// Un celular colombiano para abrir WhatsApp: 10 digitos que empiezan por 3.
function enlaceWhatsApp(r) {
  const digitos = String(r.telefono).replace(/\D/g, '').replace(/^57(?=3\d{9}$)/, '');
  if (!/^3\d{9}$/.test(digitos)) return null;
  const cuando = r.fecha_fin ? rangoDeFechas(r.fecha_inicio, r.fecha_fin) : `${rangoDeFechas(r.fecha_inicio)}${r.hora ? ` a las ${r.hora}` : ''}`;
  const texto = `Hola ${r.nombre_cliente}, te escribimos de ${r.ficha} por tu solicitud de reserva para ${cuando} (${r.personas} ${r.personas === 1 ? 'persona' : 'personas'}).`;
  return `https://wa.me/57${digitos}?text=${encodeURIComponent(texto)}`;
}

function Reservas({ onCambio }) {
  const [filtro, setFiltro] = useState('pendiente');
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelado = false;
    cargarReservas(filtro)
      .then((d) => { if (!cancelado) { setDatos(d); setError(null); } })
      .catch((err) => { if (!cancelado) setError(mensajeDeError(err)); });
    return () => { cancelado = true; };
  }, [filtro, version]);

  async function cambiarEstado(r, estado) {
    try {
      await api.patch(`${CATALOGO[r.seccionCatalogo].endpoint}/reservas/${r.id}`, { estado });
      toast.success({ confirmada: 'Reserva confirmada', rechazada: 'Reserva rechazada', pendiente: 'Volvió a pendientes' }[estado], {
        description: `${r.nombre_cliente} · ${r.ficha}${estado === 'confirmada' ? '. Recuerda avisarle.' : ''}`,
      });
      setVersion((v) => v + 1);
      onCambio?.();
    } catch (err) {
      toast.error('No se pudo cambiar la reserva', { description: mensajeDeError(err) });
    }
  }

  const reservas = datos?.reservas || [];

  return (
    <section className="st-tabla-tarjeta">
      <div className="st-tabla-barra">
        <div>
          <h2>Reservas</h2>
          <p>Solicitudes de los turistas. Contacta al cliente y confirma o rechaza.</p>
        </div>
        <div className="st-filtro-estado" role="group" aria-label="Filtrar por estado">
          {FILTROS.map((f) => (
            <button key={f.valor} type="button" className={`st-chip ${filtro === f.valor ? 'activo' : ''}`}
              aria-pressed={filtro === f.valor}
              onClick={() => { if (f.valor !== filtro) { setDatos(null); setFiltro(f.valor); } }}>{f.texto}</button>
          ))}
        </div>
      </div>

      {!datos && !error && <div className="text-center py-5"><div className="spinner-border" role="status"><span className="visually-hidden">Cargando…</span></div></div>}
      {error && <div className="alert alert-warning m-3" role="alert">{error}</div>}
      {datos?.fallidas.length > 0 && (
        <div className="alert alert-warning small m-3 mb-0" role="alert">
          No se pudieron cargar las reservas de: {datos.fallidas.map((s) => CATALOGO[s].titulo).join(', ')}. Recarga en un momento.
        </div>
      )}
      {datos && reservas.length === 0 && (
        <p className="text-center text-muted py-5 mb-0">
          {filtro === 'pendiente' ? 'No tienes reservas pendientes. Cuando un turista pida una, aparece aquí.' : 'No hay reservas en este estado.'}
        </p>
      )}

      {reservas.length > 0 && (
        <ul className="st-reservas">
          {reservas.map((r) => {
            const Icono = CATALOGO[r.seccionCatalogo].icono;
            const whatsapp = enlaceWhatsApp(r);
            return (
              <li key={`${r.seccion}-${r.id}`} className={`st-reserva ${r.estado}`}>
                <div className="st-reserva-cuando">
                  <strong>{r.fecha_fin ? rangoDeFechas(r.fecha_inicio, r.fecha_fin) : rangoDeFechas(r.fecha_inicio)}</strong>
                  {r.hora && <span><Clock size={13} aria-hidden="true" /> {r.hora}</span>}
                  <span><Users size={13} aria-hidden="true" /> {r.personas} {r.personas === 1 ? 'persona' : 'personas'}</span>
                </div>
                <div className="st-reserva-quien">
                  <span className="st-reserva-ficha"><Icono size={14} aria-hidden="true" /> {r.ficha}</span>
                  <strong>{r.nombre_cliente}</strong>
                  <span className="small text-muted">
                    <Phone size={12} aria-hidden="true" /> {r.telefono}{r.email ? ` · ${r.email}` : ''}
                  </span>
                  {r.mensaje && <p className="st-reserva-mensaje">“{r.mensaje}”</p>}
                </div>
                <div className="st-reserva-acciones">
                  <span className={`st-estado ${r.estado === 'confirmada' ? 'publicado' : r.estado === 'rechazada' ? 'oculto' : 'pendiente'}`}>{ETIQUETA_ESTADO[r.estado]}</span>
                  <div className="d-flex gap-1">
                    {whatsapp && <a className="btn btn-sm st-btn-whatsapp" href={whatsapp} target="_blank" rel="noreferrer" title="Escribirle por WhatsApp"><MessageCircle size={15} aria-hidden="true" /> WhatsApp</a>}
                    {r.estado !== 'confirmada' && <button type="button" className="btn btn-sm btn-primary" onClick={() => cambiarEstado(r, 'confirmada')}><Check size={15} aria-hidden="true" /> Confirmar</button>}
                    {r.estado === 'pendiente' && <button type="button" className="btn btn-sm btn-light" onClick={() => cambiarEstado(r, 'rechazada')}><X size={15} aria-hidden="true" /> Rechazar</button>}
                    {r.estado !== 'pendiente' && <button type="button" className="btn btn-sm btn-light" title="Volver a pendiente" aria-label="Volver a pendiente" onClick={() => cambiarEstado(r, 'pendiente')}><RotateCcw size={15} /></button>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default Reservas;
