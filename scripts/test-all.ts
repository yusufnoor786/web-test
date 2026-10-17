import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';

// Terminal formatting colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

interface Step {
  id: string;
  name: string;
  command: string;
  args: string[];
}

const steps: Step[] = [
  {
    id: 'storage',
    name: 'Storage Sandboxing & Path Traversal Defenses',
    command: 'npx',
    args: ['tsx', 'scripts/test-storage.ts'],
  },
  {
    id: 'rate-limit',
    name: 'Rate Limiting & Concurrency Control',
    command: 'npx',
    args: ['tsx', 'scripts/test-rate-limit.ts'],
  },
  {
    id: 'e2e',
    name: 'Full E2E Lifecycle & Security Suite (64 Tests)',
    command: 'npx',
    args: ['tsx', 'scripts/test-e2e.ts'],
  },
  {
    id: 'typecheck',
    name: 'TypeScript Strict Type Safety Check',
    command: 'npx',
    args: ['tsc', '--noEmit'],
  },
  {
    id: 'build',
    name: 'Production Next.js Build & Static Generation',
    command: 'npm',
    args: ['run', 'build'],
  },
];

async function main() {
  console.clear?.();
  console.log(`\n${BOLD}${CYAN}╔═══════════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║            THE GROWTH ARCHIVE — COMPLETE VERIFICATION RUN         ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚═══════════════════════════════════════════════════════════════════╝${RESET}\n`);

  const results: { name: string; duration: string; passed: boolean }[] = [];
  const globalStart = performance.now();
  let hasFailure = false;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepNumber = `[${i + 1}/${steps.length}]`;
    console.log(`${BOLD}${CYAN}${stepNumber} Running: ${step.name}...${RESET}`);

    const start = performance.now();
    const child = spawnSync(step.command, step.args, {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' },
    });
    const duration = ((performance.now() - start) / 1000).toFixed(2) + 's';

    if (child.status === 0) {
      results.push({ name: step.name, duration, passed: true });
      console.log(`${GREEN}✔ Passed in ${duration}${RESET}\n`);
    } else {
      results.push({ name: step.name, duration, passed: false });
      console.error(`${RED}✖ Failed in ${duration} (exit code: ${child.status})${RESET}\n`);
      hasFailure = true;
      break;
    }
  }

  const totalDuration = ((performance.now() - globalStart) / 1000).toFixed(2) + 's';

  console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}                    VERIFICATION SUITE SUMMARY                     ${RESET}`);
  console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════════════════${RESET}`);

  for (const res of results) {
    const status = res.passed ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;
    const dots = '.'.repeat(Math.max(2, 54 - res.name.length));
    console.log(` ${res.name} ${DIM}${dots}${RESET} [${status}] ${DIM}(${res.duration})${RESET}`);
  }

  console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════════════════${RESET}`);
  console.log(` Total Execution Time: ${BOLD}${totalDuration}${RESET}`);

  if (hasFailure) {
    console.log(` Final Outcome: ${BOLD}${RED}TEST SUITE FAILED${RESET}\n`);
    process.exit(1);
  } else {
    console.log(` Final Outcome: ${BOLD}${GREEN}ALL SYSTEMS FULLY VERIFIED & PRODUCTION READY (100%)${RESET}\n`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
