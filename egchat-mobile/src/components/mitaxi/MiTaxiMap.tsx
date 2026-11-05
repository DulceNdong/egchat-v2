/**
 * MiTaxiMap — barrel de resolución de plataforma.
 * Metro bundler selecciona .native.tsx en iOS/Android y .web.tsx en web.
 * Este archivo no debería cargarse directamente — sirve como fallback.
 */
export { MiTaxiMap } from './MiTaxiMap.web';
export default function MiTaxiMap(props: any) {
  const { MiTaxiMap: Map } = require('./MiTaxiMap.web');
  return Map(props);
}
