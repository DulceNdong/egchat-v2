/** QR de contacto EGCHAT — compatible con _qr-scanner y versión web */

export interface ContactQrUser {
  id: string;
  phone?: string;
  name?: string;
}

export function buildContactQrPayload(user: ContactQrUser): string {
  return JSON.stringify({
    type: 'contact',
    app: 'EGCHAT',
    v: 1,
    user: {
      id: user.id,
      phone: user.phone || '',
      name: user.name || '',
    },
  });
}

/** Enlace web (paridad App.tsx) para escáneres externos */
export function buildContactQrUrl(user: ContactQrUser): string {
  const phone = encodeURIComponent(user.phone || '');
  const name = encodeURIComponent(user.name || '');
  const id = encodeURIComponent(user.id);
  return `https://egchat-v2.vercel.app/add?phone=${phone}&name=${name}&id=${id}`;
}
