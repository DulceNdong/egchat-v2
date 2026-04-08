import { spawn } from 'child_process';
import { writeFileSync, appendFileSync } from 'fs';

const logFile = 'electron-debug.log';

// Clear log file
writeFileSync(logFile, '');

const log = (message) => {
  console.log(message);
  appendFileSync(logFile, message + '\n');
};

log('Starting Electron...');
log('Time: ' + new Date().toLocaleTimeString());

const electron = spawn('npx', ['electron', '.'], {
  stdio: 'inherit',
  shell: true
});

electron.on('error', (err) => {
  log('Error starting Electron: ' + err.message);
});

electron.on('close', (code) => {
  log('Electron closed with code ' + code);
  log('Time: ' + new Date().toLocaleTimeString());
  process.exit(code);
});

log('Electron process spawned with PID ' + electron.pid);
