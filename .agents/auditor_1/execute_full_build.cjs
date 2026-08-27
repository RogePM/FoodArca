const { execSync } = require('child_process');

console.log('--- RELEASING DEV LOCK FOR CLEAN PRODUCTION BUILD ---');

// Find and kill next dev processes
try {
  const pidsOutput = execSync('wmic process where "name=\'node.exe\'" get ProcessId,CommandLine', { encoding: 'utf8' });
  const lines = pidsOutput.split('\n');
  for (const line of lines) {
    if (line.includes('next') && line.includes('dev')) {
      const match = line.match(/(\d+)\s*$/);
      if (match) {
        const pid = match[1];
        console.log(`Terminating stale next dev process ${pid}...`);
        try {
          execSync(`taskkill /F /PID ${pid} /T`);
        } catch (e) {
          // ignore
        }
      }
    }
  }
} catch (e) {
  console.log('Process check error:', e.message);
}

// Wait 2 seconds for locks to release
console.log('Waiting 2s for file locks to clear...');
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  await wait(2000);

  console.log('\n--- RUNNING NPM RUN BUILD ---');
  try {
    const buildOutput = execSync('npm run build', {
      cwd: 'C:\\Users\\COMP1\\.gemini\\antigravity\\worktrees\\FoodArca\\migrate-supabase-realtime-inventory',
      encoding: 'utf8',
      stdio: 'pipe'
    });
    console.log('=== BUILD SUCCEEDED WITH EXIT CODE 0 ===');
    console.log(buildOutput);
  } catch (err) {
    console.error('=== BUILD FAILED ===');
    console.error('Exit code:', err.status);
    console.error('Stdout:', err.stdout ? err.stdout.toString() : '');
    console.error('Stderr:', err.stderr ? err.stderr.toString() : '');
    process.exit(1);
  }
}

run();
