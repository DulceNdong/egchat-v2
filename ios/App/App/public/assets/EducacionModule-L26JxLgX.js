import { r as reactExports, j as jsxRuntimeExports } from "./react-core-B1rSPtcn.js";
import { D as DocUploader } from "./DocUploader-DqUv4Md2.js";
const CIUDADES = ["Malabo", "Bata", "Ebebiyin", "Mongomo", "Añisoc", "Evinayong"];
const ESCUELAS = [
  // ── MALABO — Centros Privados ──
  { id: "m01", nombre: "Santo Thomas de Aquino", ciudad: "Malabo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 400, descripcion: "Centro privado de Malabo." },
  { id: "m02", nombre: "Santa Isabel", ciudad: "Malabo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 350, descripcion: "Centro privado de Malabo." },
  { id: "m03", nombre: "Mezile", ciudad: "Malabo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 300, descripcion: "Centro privado de Malabo." },
  { id: "m04", nombre: "Carlos Asú", ciudad: "Malabo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 300, descripcion: "Centro privado de Malabo." },
  { id: "m05", nombre: "Bisila", ciudad: "Malabo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 350, descripcion: "Centro privado de Malabo." },
  { id: "m06", nombre: "Amor de Dios", ciudad: "Malabo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 300, descripcion: "Centro privado de Malabo." },
  { id: "m07", nombre: "La Buena Semilla", ciudad: "Malabo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Malabo." },
  { id: "m08", nombre: "Ma Dolores", ciudad: "Malabo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Malabo." },
  { id: "m09", nombre: "Canige", ciudad: "Malabo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Malabo." },
  { id: "m10", nombre: "Santa Bibiana", ciudad: "Malabo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Malabo." },
  { id: "m11", nombre: "Santa Rufina", ciudad: "Malabo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Malabo." },
  { id: "m12", nombre: "Asamblea de Dios", ciudad: "Malabo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Malabo." },
  { id: "m13", nombre: "Virgen María de África", ciudad: "Malabo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 300, descripcion: "Centro privado de Malabo." },
  { id: "m14", nombre: "Mariacano", ciudad: "Malabo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Malabo." },
  { id: "m15", nombre: "Ateneo", ciudad: "Malabo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 300, descripcion: "Centro privado de Malabo." },
  { id: "m16", nombre: "Waiso Ipola", ciudad: "Malabo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Malabo." },
  { id: "m17", nombre: "Santa Sapience", ciudad: "Malabo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Malabo." },
  { id: "m18", nombre: "Alventista", ciudad: "Malabo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Malabo." },
  { id: "m19", nombre: "iBolo-Séra", ciudad: "Malabo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Malabo." },
  { id: "m20", nombre: "Elipe", ciudad: "Malabo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Malabo." },
  { id: "m21", nombre: "Claret", ciudad: "Malabo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 300, descripcion: "Centro privado de Malabo." },
  { id: "m22", nombre: "Don Gaspar", ciudad: "Malabo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Malabo." },
  { id: "m23", nombre: "Colegio Español", ciudad: "Malabo", barrio: "Caracolas", tipo: "privada", nivel: "Primaria/Secundaria/Bachillerato", tel: "+240 222 26 01 03", horario: "08:00-15:00", modalidades: ["Presencial"], plazas: 500, descripcion: "Centro privado con currículo español homologado." },
  { id: "m24", nombre: "Colegio Francés", ciudad: "Malabo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "08:00-15:00", modalidades: ["Presencial"], plazas: 400, descripcion: "Centro privado con currículo francés homologado." },
  // MALABO — Públicos
  { id: "m25", nombre: "La Salle", ciudad: "Malabo", barrio: "Centro", tipo: "publica", nivel: "Primaria/Secundaria", tel: "+240 222 26 01 01", horario: "07:30-14:00", modalidades: ["Presencial"], plazas: 800, descripcion: "Centro educativo nacional de referencia en Malabo." },
  { id: "m26", nombre: "Instituto Nacional de Malabo", ciudad: "Malabo", barrio: "Ela Nguema", tipo: "publica", nivel: "Bachillerato", tel: "+240 222 26 01 02", horario: "07:30-14:00", modalidades: ["Presencial"], plazas: 600, descripcion: "Instituto público de bachillerato." },
  // ── BATA — Privados ──
  { id: "b01", nombre: "Madre Catalana", ciudad: "Bata", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 400, descripcion: "Centro privado de Bata." },
  { id: "b02", nombre: "Micha", ciudad: "Bata", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 350, descripcion: "Centro privado de Bata." },
  { id: "b03", nombre: "El Moisés", ciudad: "Bata", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 300, descripcion: "Centro privado de Bata." },
  { id: "b04", nombre: "Don Teo", ciudad: "Bata", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 300, descripcion: "Centro privado de Bata." },
  { id: "b05", nombre: "La Salle", ciudad: "Bata", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 500, descripcion: "Centro privado de Bata." },
  { id: "b06", nombre: "Lea y Bomudi", ciudad: "Bata", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 300, descripcion: "Centro privado de Bata." },
  { id: "b07", nombre: "Escolapios", ciudad: "Bata", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 400, descripcion: "Centro privado de Bata." },
  { id: "b08", nombre: "Melfisa", ciudad: "Bata", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Bata." },
  { id: "b09", nombre: "Sane", ciudad: "Bata", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Bata." },
  { id: "b10", nombre: "Bondad de Cristo", ciudad: "Bata", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Bata." },
  { id: "b11", nombre: "Amiguitos de Jesús", ciudad: "Bata", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Bata." },
  { id: "b12", nombre: "Santo Ángel", ciudad: "Bata", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Bata." },
  { id: "b13", nombre: "La Resurrección", ciudad: "Bata", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Bata." },
  { id: "b14", nombre: "Nuestra Sra de Montserrat", ciudad: "Bata", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 300, descripcion: "Centro privado de Bata." },
  { id: "b15", nombre: "Gabriel Ondo", ciudad: "Bata", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Bata." },
  { id: "b16", nombre: "La Misión (CED)", ciudad: "Bata", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 300, descripcion: "Centro privado de Bata." },
  { id: "b17", nombre: "Okume", ciudad: "Bata", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Bata." },
  { id: "b18", nombre: "La Amistad", ciudad: "Bata", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Bata." },
  { id: "b19", nombre: "Padre Santi", ciudad: "Bata", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Bata." },
  { id: "b20", nombre: "Bisila", ciudad: "Bata", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Bata." },
  { id: "b21", nombre: "Bisa y Nkolombong", ciudad: "Bata", barrio: "Nkolombong", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Bata." },
  { id: "b22", nombre: "Esidang", ciudad: "Bata", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Bata." },
  { id: "b23", nombre: "Instituto Nacional Bata", ciudad: "Bata", barrio: "Centro", tipo: "publica", nivel: "Bachillerato", tel: "+240 222 26 02 01", horario: "07:30-14:00", modalidades: ["Presencial"], plazas: 700, descripcion: "Principal instituto público de bachillerato en Bata." },
  { id: "b24", nombre: "Escuela Primaria Bata Norte", ciudad: "Bata", barrio: "Nkolombong", tipo: "publica", nivel: "Primaria", tel: "+240 222 26 02 04", horario: "07:30-13:30", modalidades: ["Presencial"], plazas: 600, descripcion: "Escuela pública de primaria en el norte de Bata." },
  // ── MONGOMO — Privados ──
  { id: "mo01", nombre: "Ipes Padre Coll", ciudad: "Mongomo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 300, descripcion: "Centro privado de Mongomo." },
  { id: "mo02", nombre: "San Rafael", ciudad: "Mongomo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Mongomo." },
  { id: "mo03", nombre: "Nuestra Señora Virgen de Guadalupe", ciudad: "Mongomo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Mongomo." },
  { id: "mo04", nombre: "Santiago y Sinforosa", ciudad: "Mongomo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Mongomo." },
  { id: "mo05", nombre: "Mamá Pilar", ciudad: "Mongomo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Mongomo." },
  { id: "mo06", nombre: "Alejandro Evuna (Mebam)", ciudad: "Mongomo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Mongomo." },
  { id: "mo07", nombre: "María Mbasogo Nguí", ciudad: "Mongomo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Mongomo." },
  { id: "mo08", nombre: "Ndong Eni", ciudad: "Mongomo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Mongomo." },
  { id: "mo09", nombre: "Ángela de Mongomo (École Francophone)", ciudad: "Mongomo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado francófono de Mongomo." },
  { id: "mo10", nombre: "Amiguito de Jesús", ciudad: "Mongomo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Mongomo." },
  { id: "mo11", nombre: "Motutu", ciudad: "Mongomo", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Mongomo." },
  { id: "mo12", nombre: "I.N.E.S Mongomo", ciudad: "Mongomo", barrio: "", tipo: "publica", nivel: "Secundaria/Bachillerato", tel: "", horario: "07:30-14:00", modalidades: ["Presencial"], plazas: 500, descripcion: "Instituto Nacional de Enseñanza Secundaria de Mongomo." },
  { id: "mo13", nombre: "Patricio Lumumba", ciudad: "Mongomo", barrio: "", tipo: "publica", nivel: "Secundaria/Bachillerato", tel: "", horario: "07:30-14:00", modalidades: ["Presencial"], plazas: 450, descripcion: "Centro público nacional de Mongomo." },
  { id: "mo14", nombre: "I.N.E.S Akuakam", ciudad: "Mongomo", barrio: "Akuakam", tipo: "publica", nivel: "Secundaria/Bachillerato", tel: "", horario: "07:30-14:00", modalidades: ["Presencial"], plazas: 350, descripcion: "Instituto Nacional de Enseñanza Secundaria de Akuakam." },
  { id: "mo15", nombre: "Campamento FT", ciudad: "Mongomo", barrio: "", tipo: "publica", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:00", modalidades: ["Presencial"], plazas: 300, descripcion: "Centro público de Mongomo." },
  // ── EBEBIYIN ──
  { id: "eb01", nombre: "INES Nasser", ciudad: "Ebebiyin", barrio: "", tipo: "publica", nivel: "Secundaria/Bachillerato", tel: "", horario: "07:30-14:00", modalidades: ["Presencial"], plazas: 500, descripcion: "Instituto Nacional de Enseñanza Secundaria Nasser." },
  { id: "eb02", nombre: "Abang", ciudad: "Ebebiyin", barrio: "", tipo: "publica", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:00", modalidades: ["Presencial"], plazas: 400, descripcion: "Centro público de Ebebiyin." },
  { id: "eb03", nombre: "Nze Abuy", ciudad: "Ebebiyin", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Ebebiyin." },
  { id: "eb04", nombre: "La Inmaculada", ciudad: "Ebebiyin", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Ebebiyin." },
  { id: "eb05", nombre: "Jesús María", ciudad: "Ebebiyin", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Ebebiyin." },
  { id: "eb06", nombre: "Adán y Eva", ciudad: "Ebebiyin", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Ebebiyin." },
  { id: "eb07", nombre: "Gali", ciudad: "Ebebiyin", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Ebebiyin." },
  { id: "eb08", nombre: "Patos y Nietos", ciudad: "Ebebiyin", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Ebebiyin." },
  { id: "eb09", nombre: "Del Pilar", ciudad: "Ebebiyin", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Ebebiyin." },
  { id: "eb10", nombre: "Cristo Rey", ciudad: "Ebebiyin", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Ebebiyin." },
  { id: "eb11", nombre: "Bilingüe", ciudad: "Ebebiyin", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro bilingüe privado de Ebebiyin." },
  { id: "eb12", nombre: "Rebeca", ciudad: "Ebebiyin", barrio: "", tipo: "privada", nivel: "Primaria/Secundaria", tel: "", horario: "07:30-14:30", modalidades: ["Presencial"], plazas: 280, descripcion: "Centro privado de Ebebiyin." }
];
const UNIVERSIDADES = [
  { id: "u01", nombre: "Universidad Nacional de Guinea Ecuatorial (UNGE)", ciudad: "Malabo", barrio: "Malabo II", tipo: "publica", tel: "+240 222 26 10 01", web: "unge.gq", descripcion: "Principal universidad pública del país. Fundada en 1995.", facultades: ["Ciencias", "Derecho", "Medicina", "Ingeniería", "Humanidades", "Económicas"], plazas: 2e3, modalidades: ["Presencial"], requisitos: ["Título de Bachillerato", "Nota de corte mínima 6.0", "Prueba de acceso UNGE", "DNI / Pasaporte", "2 fotos carnet", "Certificado médico"] },
  { id: "u02", nombre: "Universidad Nacional de Educación a Distancia (UNED-GQ)", ciudad: "Malabo", barrio: "Centro", tipo: "publica", tel: "+240 222 26 10 02", web: "uned.gq", descripcion: "Universidad a distancia con convenio con UNED España.", facultades: ["Derecho", "Económicas", "Psicología", "Educación", "Informática"], plazas: 1500, modalidades: ["Online", "Semipresencial"], requisitos: ["Título de Bachillerato", "DNI / Pasaporte", "Formulario de inscripción online", "Pago de matrícula", "Foto carnet"] },
  { id: "u03", nombre: "Universidad de Bata (UNIBATA)", ciudad: "Bata", barrio: "Centro", tipo: "publica", tel: "+240 222 26 10 03", web: "unibata.gq", descripcion: "Universidad pública de la región continental. Fundada en 2002.", facultades: ["Ciencias Agrarias", "Ingeniería", "Medicina", "Derecho", "Económicas"], plazas: 1800, modalidades: ["Presencial"], requisitos: ["Título de Bachillerato", "Nota de corte mínima 5.5", "Prueba de acceso UNIBATA", "DNI / Pasaporte", "2 fotos carnet", "Certificado médico", "Certificado de buena conducta"] },
  { id: "u04", nombre: "Universidad Privada de Guinea Ecuatorial (UPGE)", ciudad: "Malabo", barrio: "Caracolas", tipo: "privada", tel: "+240 222 26 10 04", web: "upge.gq", descripcion: "Primera universidad privada del país. Convenios internacionales.", facultades: ["Administración de Empresas", "Derecho", "Informática", "Comunicación", "Turismo"], plazas: 800, modalidades: ["Presencial", "Semipresencial"], requisitos: ["Título de Bachillerato", "Entrevista de admisión", "DNI / Pasaporte", "2 fotos carnet", "Certificado médico", "Extracto bancario (solvencia)", "Carta de motivación"] },
  { id: "u05", nombre: "Instituto Superior de Ciencias de la Educación (ISCE)", ciudad: "Malabo", barrio: "Ela Nguema", tipo: "publica", tel: "+240 222 26 10 05", web: "isce.gq", descripcion: "Formación de docentes y profesionales de la educación.", facultades: ["Pedagogía", "Psicología Educativa", "Educación Física", "Lenguas Modernas"], plazas: 600, modalidades: ["Presencial"], requisitos: ["Título de Bachillerato", "Nota de corte mínima 6.5", "Prueba de aptitud pedagógica", "DNI / Pasaporte", "2 fotos carnet", "Certificado médico"] },
  { id: "u06", nombre: "Escuela Nacional de Administración (ENA-GQ)", ciudad: "Malabo", barrio: "Centro", tipo: "publica", tel: "+240 222 26 10 06", web: "ena.gq", descripcion: "Formación de funcionarios y gestores públicos.", facultades: ["Administración Pública", "Gestión Financiera", "Relaciones Internacionales", "Derecho Administrativo"], plazas: 400, modalidades: ["Presencial"], requisitos: ["Título de Bachillerato o Universitario", "Concurso de oposición", "DNI / Pasaporte", "Certificado de buena conducta", "Certificado médico", "Carta de recomendación"] }
];
const EducacionModule = ({ onClose }) => {
  const [screen, setScreen] = reactExports.useState("home");
  const [ciudad, setCiudad] = reactExports.useState("Malabo");
  const [tipoFiltro, setTipoFiltro] = reactExports.useState("todos");
  const [selected, setSelected] = reactExports.useState(null);
  const [form, setForm] = reactExports.useState({ nombre: "", dni: "", telefono: "", email: "", modalidad: "", curso: "", notas: "" });
  const [docFiles, setDocFiles] = reactExports.useState({});
  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const reqDocs = selected?.requisitos || [];
  const allDocsDone = reqDocs.length === 0 || reqDocs.every((d) => docFiles[d]?.uploaded);
  const escuelasFiltradas = ESCUELAS.filter(
    (e) => e.ciudad === ciudad && (tipoFiltro === "todos" || e.tipo === tipoFiltro)
  );
  const universidadesFiltradas = UNIVERSIDADES.filter((u) => u.ciudad === ciudad);
  const tipoColor = (t) => t === "publica" ? "#1B5E20" : t === "privada" ? "#1565C0" : "#7B1FA2";
  const tipoLabel = (t) => t === "publica" ? "Pública" : t === "privada" ? "Privada" : "Profesional";
  const tipoIcon = (t) => t === "publica" ? "🏫" : t === "privada" ? "🎓" : "🔧";
  if (screen === "ok") return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "40px 20px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "56px", marginBottom: "12px" }, children: "✅" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "20px", fontWeight: "900", color: "#1A2B4A", marginBottom: "8px" }, children: "¡Solicitud enviada!" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", color: "#8A9BB5", marginBottom: "6px" }, children: selected?.nombre }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#F0FAF5", borderRadius: "14px", padding: "16px", marginBottom: "20px", textAlign: "left" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", fontWeight: "700", color: "#16A34A", marginBottom: "8px" }, children: "¿Qué pasa ahora?" }),
      ["El centro revisará tu solicitud en 5-10 días hábiles", "Recibirás una llamada o email de confirmación", "Si es aprobada, deberás presentar los documentos originales", "La matrícula se formaliza en la secretaría del centro"].map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px", marginBottom: "6px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: "#16A34A", fontWeight: "700", flexShrink: 0 }, children: [
          i + 1,
          "."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "12px", color: "#5A7090" }, children: s })
      ] }, i))
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => {
          setScreen("home");
          setSelected(null);
          setForm({ nombre: "", dni: "", telefono: "", email: "", modalidad: "", curso: "", notas: "" });
        },
        style: { background: "linear-gradient(135deg,#4C1D95,#6B5BD6)", border: "none", borderRadius: "12px", padding: "13px 32px", color: "#fff", fontSize: "14px", fontWeight: "700", cursor: "pointer" },
        children: "Volver al inicio"
      }
    )
  ] });
  if (screen === "solicitud" && selected) return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "14px 16px 24px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(135deg,#4C1D95,#6B5BD6)", borderRadius: "14px", padding: "14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "28px" }, children: "📋" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "14px", fontWeight: "800", color: "#fff" }, children: selected.nombre }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.8)" }, children: [
          selected.ciudad,
          " · ",
          selected.nivel || selected.facultades?.join(", ")
        ] })
      ] })
    ] }),
    selected.requisitos && selected.requisitos.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
      DocUploader,
      {
        docs: selected.requisitos,
        onChange: setDocFiles,
        accentColor: "#6B5BD6",
        doneColor: "#4C1D95"
      }
    ),
    [
      { k: "nombre", l: "Nombre completo del solicitante", t: "text" },
      { k: "dni", l: "DNI / Pasaporte", t: "text" },
      { k: "telefono", l: "Teléfono de contacto", t: "tel" },
      { k: "email", l: "Correo electrónico", t: "email" },
      { k: "curso", l: "Curso / Facultad solicitada", t: "text" },
      { k: "notas", l: "Notas adicionales (opcional)", t: "text" }
    ].map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "#fff", borderRadius: "10px", padding: "0 14px", marginBottom: "8px", display: "flex", alignItems: "center", height: "50px", border: "1px solid #F0F2F5" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        type: f.t,
        placeholder: f.l,
        value: form[f.k],
        onChange: (e) => setF(f.k, e.target.value),
        style: { flex: 1, background: "none", border: "none", outline: "none", fontSize: "13px", color: "#111827", fontFamily: "inherit" }
      }
    ) }, f.k)),
    selected.modalidades && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", fontWeight: "600", color: "#9CA3AF", margin: "12px 0 8px" }, children: "Modalidad" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }, children: selected.modalidades.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setF("modalidad", m),
          style: { background: form.modalidad === m ? "#EDE9FE" : "#F9FAFB", border: `1.5px solid ${form.modalidad === m ? "#6B5BD6" : "#E5E7EB"}`, borderRadius: "10px", padding: "8px 16px", fontSize: "12px", fontWeight: "700", color: form.modalidad === m ? "#6B5BD6" : "#6B7280", cursor: "pointer" },
          children: m
        },
        m
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => {
          if (form.nombre && form.dni && form.telefono && allDocsDone) setScreen("ok");
        },
        style: { width: "100%", background: form.nombre && form.dni && form.telefono && allDocsDone ? "linear-gradient(135deg,#4C1D95,#6B5BD6)" : "#E5E7EB", border: "none", borderRadius: "12px", padding: "14px", color: form.nombre && form.dni && form.telefono && allDocsDone ? "#fff" : "#9CA3AF", fontSize: "14px", fontWeight: "700", cursor: form.nombre && form.dni && form.telefono && allDocsDone ? "pointer" : "default" },
        children: !allDocsDone && reqDocs.length > 0 ? "Sube todos los documentos para continuar" : "Enviar solicitud de plaza"
      }
    )
  ] });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { paddingBottom: "24px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(135deg,#4C1D95,#6B5BD6)", padding: "16px 16px 14px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "48px", height: "48px", borderRadius: "14px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }, children: "🎓" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "18px", fontWeight: "900", color: "#fff" }, children: "Educación" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.8)" }, children: "Centros educativos · Guinea Ecuatorial" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px" }, children: CIUDADES.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setCiudad(c),
          style: { flexShrink: 0, background: ciudad === c ? "#fff" : "rgba(255,255,255,0.2)", border: "none", borderRadius: "20px", padding: "5px 12px", fontSize: "11px", fontWeight: "700", color: ciudad === c ? "#4C1D95" : "#fff", cursor: "pointer" },
          children: c
        },
        c
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "14px 16px 0" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "20px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "14px", fontWeight: "800", color: "#1A2B4A" }, children: "🏫 Centros Escolares" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "4px" }, children: ["todos", "publica", "privada", "profesional"].map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setTipoFiltro(t),
              style: { background: tipoFiltro === t ? "#4C1D95" : "#F3F4F6", border: "none", borderRadius: "8px", padding: "4px 8px", fontSize: "10px", fontWeight: "700", color: tipoFiltro === t ? "#fff" : "#6B7280", cursor: "pointer" },
              children: t === "todos" ? "Todos" : tipoLabel(t)
            },
            t
          )) })
        ] }),
        escuelasFiltradas.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "20px", color: "#9CA3AF", fontSize: "13px" }, children: [
          "No hay centros en ",
          ciudad,
          " con este filtro"
        ] }) : escuelasFiltradas.map((e) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: { background: "#fff", borderRadius: "14px", padding: "14px", marginBottom: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", cursor: "pointer" },
            onClick: () => {
              setSelected(e);
              setScreen("solicitud");
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "flex-start", gap: "12px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "44px", height: "44px", borderRadius: "12px", background: `${tipoColor(e.tipo)}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }, children: tipoIcon(e.tipo) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", fontWeight: "800", color: "#1A2B4A", marginBottom: "2px" }, children: e.nombre }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "#8A9BB5", marginBottom: "4px" }, children: [
                  e.barrio,
                  " · ",
                  e.nivel
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { background: `${tipoColor(e.tipo)}15`, color: tipoColor(e.tipo), borderRadius: "6px", padding: "2px 8px", fontSize: "10px", fontWeight: "700" }, children: tipoLabel(e.tipo) }),
                  e.modalidades.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { background: "#F3F4F6", color: "#6B7280", borderRadius: "6px", padding: "2px 8px", fontSize: "10px", fontWeight: "600" }, children: m }, m))
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "right", flexShrink: 0 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "#8A9BB5" }, children: [
                  e.plazas,
                  " plazas"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "#CBD5E1", strokeWidth: "2.5", style: { marginTop: "4px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M9 18l6-6-6-6" }) })
              ] })
            ] })
          },
          e.id
        ))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "14px", fontWeight: "800", color: "#1A2B4A", marginBottom: "10px" }, children: "🏛️ Universidades" }),
        universidadesFiltradas.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "20px", color: "#9CA3AF", fontSize: "13px" }, children: [
          "No hay universidades en ",
          ciudad
        ] }) : universidadesFiltradas.map((u) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: { background: "#fff", borderRadius: "16px", padding: "16px", marginBottom: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", cursor: "pointer" },
            onClick: () => {
              setSelected(u);
              setScreen("solicitud");
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "10px" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "50px", height: "50px", borderRadius: "14px", background: u.tipo === "publica" ? "#1B5E2015" : "#1565C015", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", flexShrink: 0 }, children: "🏛️" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", fontWeight: "900", color: "#1A2B4A", marginBottom: "2px", lineHeight: "1.3" }, children: u.nombre }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "#8A9BB5" }, children: [
                    u.barrio,
                    " · ",
                    u.ciudad
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { background: u.tipo === "publica" ? "#1B5E2015" : "#1565C015", color: u.tipo === "publica" ? "#1B5E20" : "#1565C0", borderRadius: "6px", padding: "2px 8px", fontSize: "10px", fontWeight: "700", display: "inline-block", marginTop: "4px" }, children: u.tipo === "publica" ? "Pública" : "Privada" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "#8A9BB5", textAlign: "right", flexShrink: 0 }, children: [
                  u.plazas,
                  " plazas"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", color: "#5A7090", marginBottom: "10px", lineHeight: "1.4" }, children: u.descripcion }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "10px" }, children: u.facultades.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { background: "#F3F4F6", color: "#374151", borderRadius: "6px", padding: "3px 8px", fontSize: "10px", fontWeight: "600" }, children: f }, f)) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "6px", alignItems: "center" }, children: [
                u.modalidades.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { background: "#EDE9FE", color: "#6B5BD6", borderRadius: "6px", padding: "3px 8px", fontSize: "10px", fontWeight: "700" }, children: m }, m)),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: "11px", color: "#8A9BB5", marginLeft: "auto" }, children: [
                  "📞 ",
                  u.tel
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: (e) => {
                    e.stopPropagation();
                    setSelected(u);
                    setScreen("solicitud");
                  },
                  style: { width: "100%", background: "linear-gradient(135deg,#4C1D95,#6B5BD6)", border: "none", borderRadius: "10px", padding: "10px", color: "#fff", fontSize: "12px", fontWeight: "700", cursor: "pointer", marginTop: "10px" },
                  children: "Solicitar plaza"
                }
              )
            ]
          },
          u.id
        ))
      ] })
    ] })
  ] });
};
export {
  EducacionModule
};
