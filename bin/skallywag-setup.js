#!/usr/bin/env node
// `npx github:Moonwolf711/skallywag` — runs the platform installer that ships next to this file.
// Options are environment variables (see install.ps1 / install.sh): SKALLYWAG_DRYRUN=1 etc.
const { spawnSync } = require('child_process');
const path = require('path');
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`skallywag-setup\n\nRuns install.ps1 (Windows) or install.sh (macOS/Linux) from ${root}.\n` +
    'Env options: SKALLYWAG_DRYRUN=1  SKALLYWAG_SKIP_MODEL=1  SKALLYWAG_SKIP_SKILLS=1  SKALLYWAG_MODEL=<ollama model>  SKALLYWAG_ZIP=<purchased zip>\n' +
    'Flags: --dry-run  (same as SKALLYWAG_DRYRUN=1)');
  process.exit(0);
}
const env = { ...process.env };
if (args.includes('--dry-run')) env.SKALLYWAG_DRYRUN = '1';
const win = process.platform === 'win32';
const cmd = win ? 'powershell' : 'bash';
const cmdArgs = win
  ? ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(root, 'install.ps1')]
  : [path.join(root, 'install.sh')];
const r = spawnSync(cmd, cmdArgs, { stdio: 'inherit', env });
process.exit(r.status === null ? 1 : r.status);
