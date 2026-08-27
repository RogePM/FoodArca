const { execSync, spawn } = require('child_process');

function getNextBuildProcesses() {
  try {
    const output = execSync('wmic process where "name=\'node.exe\'" get ProcessId,CommandLine', { encoding: 'utf8' });
    const lines = output.split('\n');
    const builds = lines.filter(l => l.includes('next') && l.includes('build') && !l.includes('run_build.cjs'));
    return builds;
  } catch (e) {
    return [];
  }
}

async function main() {
  console.log('Waiting for concurrent next build processes to finish...');
  let attempts = 0;
  while (attempts < 30) {
    const procs = getNextBuildProcesses();
    if (procs.length === 0) {
      console.log('No concurrent next build processes found. Proceeding with clean npm run build.');
      break;
    }
    console.log(`Detected ${procs.length} build process(es) in progress. Waiting 3s... (attempt ${attempts + 1}/30)`);
    await new Promise(r => setTimeout(r, 3000));
    attempts++;
  }

  console.log('\n--- EXECUTING INDEPENDENT NEXT.JS PRODUCTION BUILD ---');
  const startTime = Date.now();
  try {
    const buildOutput = execSync('npm run build', {
      cwd: 'C:\\Users\\COMP1\\.gemini\\antigravity\\worktrees\\FoodArca\\migrate-supabase-realtime-inventory',
      encoding: 'utf8',
      stdio: 'pipe'
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`BUILD COMPLETED SUCCESSFULLY in ${duration}s!`);
    console.log('--- BUILD OUTPUT ---');
    console.log(buildOutput);
    process.exit(0);
  } catch (err) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`BUILD FAILED after ${duration}s with exit code ${err.status}`);
    console.error('--- STDOUT ---');
    console.error(err.stdout ? err.stdout.toString() : '');
    console.error('--- STDERR ---');
    console.error(err.stderr ? err.stderr.toString() : '');
    process.exit(1);
  }
}

main();
