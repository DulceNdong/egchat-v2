// Ventanas de digitos del numero nacional (sin el prefijo) por pais. Son los 28
// codigos que los selectores de login, alta y recuperacion ofrecen. La tabla es
// la misma que PHONE_PLANES en el backend: lo que aqui se deja escribir tiene
// que pasar alli, y al reves. 15 digitos es el maximo E.164.
const PHONE_WINDOWS: Record<string, [number, number]> = {
  '240': [9, 9],
  '237': [9, 9],
  '241': [7, 8],
  '242': [8, 9],
  '236': [8, 8],
  '235': [8, 8],
  '244': [9, 9],
  '243': [7, 10],
  '234': [10, 10],
  '221': [9, 9],
  '225': [8, 10],
  '254': [9, 9],
  '233': [9, 9],
  '27': [9, 9],
  '212': [8, 9],
  '34': [9, 9],
  '33': [9, 9],
  '44': [9, 10],
  '49': [6, 13],
  '39': [6, 12],
  '351': [9, 9],
  '1': [10, 10],
  '55': [10, 11],
  '52': [10, 10],
  '57': [10, 10],
  '54': [10, 11],
  '58': [10, 10],
  '86': [10, 11],
};

export const soloDigitos = (value?: string | null) => String(value || '').replace(/\D/g, '');

// En Guinea Ecuatorial el 0 inicial es prefijo de red, no parte del numero, y el
// servidor lo quita al canonicizar. En los paises donde el 0 si es parte del
// numero (Gabon, Costa de Marfil) se deja.
export const nacionalLimpia = (prefijo: string, nacional: string) => {
  const digitos = soloDigitos(nacional);
  return soloDigitos(prefijo) === '240' ? digitos.replace(/^0+/, '') : digitos;
};

export const ventanaDigitos = (prefijo: string): [number, number] => {
  const digits = soloDigitos(prefijo);
  const ventana = PHONE_WINDOWS[digits];
  if (ventana) return ventana;
  const max = Math.max(6, 15 - digits.length);
  return [6, max];
};

// El campo nacional nunca admite mas digitos que el plan del pais elegido.
export const maxDigitos = (prefijo: string) => ventanaDigitos(prefijo)[1];

export const nacionalValida = (prefijo: string, nacional: string) => {
  const [min, max] = ventanaDigitos(prefijo);
  const n = nacionalLimpia(prefijo, nacional).length;
  return n >= min && n <= max;
};
