// Stub web para firebase/database
export const getDatabase = () => ({});
export const ref = () => ({});
export const onValue = () => () => {};
export const set = () => Promise.resolve();
export const onDisconnect = () => ({ set: () => Promise.resolve() });
export const serverTimestamp = () => Date.now();
