import { useEffect, useState } from 'react';
import api, { mensajeDeError } from '../api/client';

// Carga una lista de la API y la vuelve a pedir cuando cambian los filtros.
// Los filtros vacios no se mandan (axios ignora los undefined).
export function useCatalogo(endpoint, filtros) {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const clave = JSON.stringify(filtros);

  useEffect(() => {
    let cancelado = false;
    const params = Object.fromEntries(Object.entries(JSON.parse(clave)).map(([k, v]) => [k, v || undefined]));
    api.get(endpoint, { params })
      .then(({ data }) => { if (!cancelado) { setDatos(data); setError(null); } })
      .catch((err) => { if (!cancelado) setError(mensajeDeError(err)); })
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [endpoint, clave]);

  return { datos, cargando, error };
}

// Municipios para el filtro. Si falla, el filtro queda solo con "Todos".
export function useMunicipios(endpoint) {
  const [municipios, setMunicipios] = useState([]);
  useEffect(() => {
    api.get(`${endpoint}/catalogos/municipios`).then(({ data }) => setMunicipios(data)).catch(() => setMunicipios([]));
  }, [endpoint]);
  return municipios;
}
