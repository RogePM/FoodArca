const { execSync } = require('child_process');
try {
  const output = execSync('wmic process where "name=\'node.exe\'" get ProcessId,CommandLine', { encoding: 'utf8' });
  console.log(output);
} catch (e) {
  console.error(e.message);
}
