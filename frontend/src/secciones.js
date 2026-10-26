import { CATALOGO } from './catalogo';

// Las 5 secciones del menu, en el orden en que se muestran.
export const SECCIONES = Object.values(CATALOGO).map(({ ruta, titulo, icono }) => ({ ruta, texto: titulo, icono }));
