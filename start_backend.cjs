#!/usr/bin/env node
/**
 * Start backend server script
 * Works on Windows, Mac, and Linux
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const backendDir = path.join(__dirname, 'backend');
const scriptPath = path.join(backendDir, 'run_backend_simple.py');

// Check if script exists
if (!fs.existsSync(scriptPath)) {
  console.error('ERROR: run_backend_simple.py not found!');
  console.error(`Expected at: ${scriptPath}`);
  process.exit(1);
}

// Determine Python command
// On Windows, prefer 'python' over 'py' to use the correct environment
// 'py' launcher may point to a different Python installation
// Prioritize Python 3.11+ for dedalus-labs compatibility
const isWin = process.platform === 'win32';
const pythonCommands = isWin ? ['python', 'py'] : ['python3.11', 'python3', 'python'];

let currentIndex = 0;

function tryStartPython() {
  if (currentIndex >= pythonCommands.length) {
    console.error('ERROR: Python not found!');
    console.error('Please install Python and make sure it\'s in your PATH.');
    process.exit(1);
  }

  const python = pythonCommands[currentIndex];
  console.log(`[backend] Trying to start with: ${python}`);

  const proc = spawn(python, ['run_backend_simple.py'], {
    cwd: backendDir,
    stdio: 'inherit',
    shell: isWin
  });

  proc.on('error', (err) => {
    if (err.code === 'ENOENT') {
      // Python command not found, try next one
      currentIndex++;
      tryStartPython();
    } else {
      console.error(`[backend] Error: ${err.message}`);
      process.exit(1);
    }
  });

  proc.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[backend] Process exited with code ${code}`);
      process.exit(code);
    }
  });
}

tryStartPython();

