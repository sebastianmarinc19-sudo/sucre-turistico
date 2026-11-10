import { KeyRound, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { mensajeDeError } from '../api/client';
import { cambiarPassword, usuarioActual } from '../api/sesion';

// Cambiar la contrasena. Si la cuenta trae una temporal (la creo o la
// restablecio el superadmin), el panel manda aqui antes de dejar hacer nada.
function CambiarClave() {
  const navigate = useNavigate();
  const usuario = usuarioActual();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetida, setRepetida] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  if (!usuario) return <Navigate to="/admin/login" replace />;
  const obligatoria = usuario.debe_cambiar_password;

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    if (nueva.length < 8) return setError('La nueva contraseña debe tener al menos 8 caracteres.');
    if (nueva !== repetida) return setError('Las dos contraseñas nuevas no coinciden.');
    setEnviando(true);
    try {
      await cambiarPassword(actual, nueva);
      toast.success('Contraseña actualizada');
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
    return undefined;
  }

  return (
    <section className="st-login">
      <div className="st-login-tarjeta">
        <span className="st-login-icono"><ShieldCheck size={28} aria-hidden="true" /></span>
        <h1 className="h4">{obligatoria ? 'Crea tu contraseña' : 'Cambiar contraseña'}</h1>
        <p className="text-muted small">
          {obligatoria
            ? `Hola, ${usuario.nombre}. Entraste con una contraseña temporal: elige una propia para seguir.`
            : 'Escribe tu contraseña actual y la nueva.'}
        </p>
        <form onSubmit={enviar}>
          {[
            ['clave-actual', obligatoria ? 'Contraseña temporal' : 'Contraseña actual', actual, setActual, 'current-password'],
            ['clave-nueva', 'Nueva contraseña (mínimo 8)', nueva, setNueva, 'new-password'],
            ['clave-repetida', 'Repite la nueva', repetida, setRepetida, 'new-password'],
          ].map(([id, etiqueta, valor, cambiar, autocompletar]) => (
            <div className="mb-3" key={id}>
              <label className="form-label small" htmlFor={id}>{etiqueta}</label>
              <div className="st-campo-icono">
                <KeyRound size={17} aria-hidden="true" />
                <input id={id} type="password" className="form-control" autoComplete={autocompletar} required value={valor} onChange={(e) => cambiar(e.target.value)} />
              </div>
            </div>
          ))}
          {error && <div className="alert alert-warning small py-2" role="alert">{error}</div>}
          <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Guardar contraseña'}
          </button>
          {!obligatoria && <Link to="/admin" className="btn btn-link w-100 mt-1">Volver al panel</Link>}
        </form>
      </div>
    </section>
  );
}

export default CambiarClave;
