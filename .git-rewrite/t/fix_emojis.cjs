const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf8');

// Mapa de reemplazos: [buscar, reemplazar]
const fixes = [
  // Notificaciones
  ['title: `?? ${senderName}`', 'title: `💬 ${senderName}`'],
  ['new Notification(`?? ${senderName}`', 'new Notification(`💬 ${senderName}`'],
  // Emojis personalizados
  ["label:'??', title:'Rico'", "label:'🦁', title:'Rico'"],
  ["label:'??', title:'Leon GQ'", "label:'🌍', title:'Leon GQ'"],
  ["label:'??', title:'Verde GQ'", "label:'💚', title:'Verde GQ'"],
  ["label:'??', title:'Medalla'", "label:'🏅', title:'Medalla'"],
  ["label:'??', title:'Fuerza'", "label:'💪', title:'Fuerza'"],
  // Transferencia
  ["title: '?? Transferencia enviada'", "title: '💸 Transferencia enviada'"],
  // Llamadas
  ["type === 'video' ? '??' : '??'", "type === 'video' ? '📹' : '📞'"],
  ["'missed' ? '?? Llamada perdida'", "'missed' ? '📵 Llamada perdida'"],
  ["'missed' ? '??' : (msg as any).callType === 'video' ? '??' : '??'", "'missed' ? '📵' : (msg as any).callType === 'video' ? '📹' : '📞'"],
  // Panel notificaciones
  ['>??</div>', '>🔔</div>'],
  // Fotos
  ["text: '?? Foto'", "text: '📷 Foto'"],
  ["text: `?? Foto`", "text: `📷 Foto`"],
  // Lia respuestas
  ['`?? TU SALDO ACTUAL', '`📊 TU SALDO ACTUAL'],
  ['`?? TRANSFERENCIA DE DINERO', '`💸 TRANSFERENCIA DE DINERO'],
  ['`?? NOTICIAS RECIENTES', '`📰 NOTICIAS RECIENTES'],
  ['`?? SERVICIOS BANCARIOS', '`🏦 SERVICIOS BANCARIOS'],
  ['`?? TUS CONTACTOS', '`👥 TUS CONTACTOS'],
  ['`??? CLIMA EN MALABO', '`🌤 CLIMA EN MALABO'],
  ['`?? Abriendo Mensajería...`', '`💬 Abriendo Mensajería...`'],
  ['`?? Abriendo monedero...`', '`💰 Abriendo monedero...`'],
  ['`?? Abriendo servicios...`', '`🛠 Abriendo servicios...`'],
  ['`?? Abriendo noticias...`', '`📰 Abriendo noticias...`'],
  ['`?? Volviendo al inicio...`', '`🏠 Volviendo al inicio...`'],
  ['`?? MIS CAPACIDADES', '`🤖 MIS CAPACIDADES'],
  ['`?? Archivo cargado:', '`📎 Archivo cargado:'],
  ['`?? AN', '`📄 AN'],
  ['`?? Estad', '`📊 Estad'],
  ['`?? Palabras', '`🔑 Palabras'],
  ['`?? Resumen:', '`📝 Resumen:'],
  ['`? AYUDA', '`❓ AYUDA'],
  // Grupos
  ['`?? ${sc.members', '`👥 ${sc.members'],
  // Contacto en chat
  ['text:`?? Contacto:', 'text:`👤 Contacto:'],
  // Dinero
  [".replace('?? ', '')", ".replace('💸 ', '')"],
  // Mensajería
  ["label: 'Mensajer\uFFFDa'", "label: 'Mensajería'"],
  ["'Mensajer\uFFFDa'", "'Mensajería'"],
  // Layouts
  ["icon: '??' }", "icon: '🏠' }"],
  // Foto en chat
  ["text: '?? Foto'", "text: '📷 Foto'"],
  // Video
  ['`?? ${file.name}', '`🎥 ${file.name}'],
  // Llamada saliente
  ['`?? Llamada saliente', '`📞 Llamada saliente'],
  // Llamada perdida
  ['`?? Llamada perdida', '`📵 Llamada perdida'],
  // Llamada video
  ['`?? Videollamada', '`📹 Videollamada'],
];

let count = 0;
for (const [search, replace] of fixes) {
  while (c.includes(search)) {
    c = c.replace(search, replace);
    count++;
  }
}

// También arreglar con regex los patrones más complejos
c = c.replace(/Mensajer.a/g, 'Mensajería');
c = c.replace(/`\?\? \$\{senderName\}`/g, '`💬 ${senderName}`');
c = c.replace(/`\?\? \$\{sc\.members/g, '`👥 ${sc.members');
c = c.replace(/`\?\? \$\{file\.name\}/g, '`🎥 ${file.name}');

fs.writeFileSync('App.tsx', c, 'utf8');
console.log('Fixed', count, 'occurrences');

// Contar restantes (solo los que son emojis, no operadores JS)
const lines = c.split('\n');
let remaining = 0;
for (const line of lines) {
  if (line.includes("'??'") || line.includes('`??') || line.includes("'?? ") || line.includes('`?? ')) {
    if (!line.includes('null ??') && !line.includes('??.') && !line.includes('= ??')) {
      remaining++;
    }
  }
}
console.log('Remaining ?? lines:', remaining);
