import('./index.cjs').catch((err) => {
  console.error('Failed to start EGCHAT server:', err);
  process.exit(1);
});