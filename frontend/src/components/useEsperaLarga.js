import { useEffect, useState } from 'react';

// Pasado este tiempo cargando, casi seguro los servidores gratuitos de Render
// estaban dormidos: se le explica al turista en vez de dejarlo adivinando.
const ESPERA_LARGA_MS = 6000;

export function useEsperaLarga(cargando) {
  const [larga, setLarga] = useState(false);
  useEffect(() => {
    if (!cargando) return undefined;
    const t = setTimeout(() => setLarga(true), ESPERA_LARGA_MS);
    return () => clearTimeout(t);
  }, [cargando]);
  return cargando && larga;
}
