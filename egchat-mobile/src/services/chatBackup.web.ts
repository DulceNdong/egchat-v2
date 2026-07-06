/**
 * Stub para web — backup/restore no disponible en navegador
 * Las funciones retornan valores neutros sin hacer nada
 */
export function encryptBackup(data: object, password: string): string { return ''; }
export function decryptBackup(ciphertext: string, password: string): object | null { return null; }
export async function exportBackup(userId: string, password: string): Promise<boolean> { return false; }
export async function importBackup(fileUri: string, password: string): Promise<{ ok: boolean; data?: any; message?: string }> { return { ok: false, message: 'No disponible en web' }; }
