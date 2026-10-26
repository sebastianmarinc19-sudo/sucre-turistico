import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { alternarFavorito, esFavorito, useFavoritos } from '../favoritos';

// Corazon para guardar un lugar. Va encima de la foto de la tarjeta, que es
// un enlace: por eso corta el clic para no abrir el detalle.
function BotonFavorito({ seccion, registro, grande = false }) {
  useFavoritos(); // se vuelve a pintar cuando cambian los favoritos
  const marcado = esFavorito(seccion, registro.id);

  function alternar(e) {
    e.preventDefault();
    e.stopPropagation();
    const ahora = alternarFavorito(seccion, registro);
    toast(ahora ? 'Guardado en favoritos' : 'Quitado de favoritos', { description: registro.nombre, duration: 2000 });
  }

  return (
    <button
      type="button"
      className={`st-favorito ${marcado ? 'marcado' : ''} ${grande ? 'grande' : ''}`}
      onClick={alternar}
      aria-pressed={marcado}
      aria-label={marcado ? `Quitar ${registro.nombre} de favoritos` : `Guardar ${registro.nombre} en favoritos`}
    >
      <Heart size={grande ? 20 : 17} aria-hidden="true" />
    </button>
  );
}

export default BotonFavorito;
