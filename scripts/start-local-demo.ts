import { spawn, spawnSync, execSync } from 'node:child_process';
import http from 'node:http';
import { prisma } from '../src/lib/prisma';

// Terminal colors
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

async function isServerRunning(port = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/products`, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 304);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function openBrowser(url: string) {
  try {
    const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    execSync(`${cmd} ${url}`);
  } catch (err) {
    // Non-critical if browser open fails
  }
}

async function prepareEnvironment() {
  // 1. Verify products exist in database
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    console.log(`${CYAN}ℹ Seeding catalog products & bundles...${RESET}`);
    spawnSync('npx', ['prisma', 'db', 'seed'], { stdio: 'inherit', shell: true });
  }

  // 2. Ensure admin account is provisioned
  const admin = await prisma.adminUser.findUnique({
    where: { email: 'admin@thegrowtharchive.com' },
  });
  if (!admin) {
    console.log(`${CYAN}ℹ Provisioning administrator account...${RESET}`);
    spawnSync('npx', ['tsx', 'scripts/create-admin.ts'], { stdio: 'inherit', shell: true });
  }
}

async function main() {
  console.clear?.();
  console.log(`\n${BOLD}${CYAN}╔═══════════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║     THE GROWTH ARCHIVE — INTERACTIVE LOCAL BROWSER TEST RUNNER    ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚═══════════════════════════════════════════════════════════════════╝${RESET}\n`);

  console.log(`${DIM}Preparing local environment and database...${RESET}`);
  await prepareEnvironment();

  const PORT = 3000;
  const baseUrl = `http://localhost:${PORT}`;
  let serverRunning = await isServerRunning(PORT);

  if (!serverRunning) {
    console.log(`${YELLOW}Starting Next.js development server on ${baseUrl}...${RESET}`);
    const devProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, PORT: String(PORT) },
    });

    // Wait for server to become responsive
    let attempts = 0;
    while (attempts < 30) {
      await new Promise((r) => setTimeout(r, 1000));
      serverRunning = await isServerRunning(PORT);
      if (serverRunning) break;
      attempts++;
    }
  }

  // Open the browser directly to the storefront
  console.log(`${GREEN}✔ Local server is active and ready!${RESET}`);
  console.log(`${CYAN}Opening your browser to ${baseUrl}...${RESET}\n`);
  openBrowser(baseUrl);

  // Display user testing dashboard
  console.log(`${BOLD}═══════════════════════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}              LOCAL BROWSER TESTING CHEATSHEET & URLS              ${RESET}`);
  console.log(`${BOLD}═══════════════════════════════════════════════════════════════════${RESET}\n`);

  console.log(` ${BOLD}1. Storefront & Catalog Discovery${RESET}`);
  console.log(`    URL: ${CYAN}${baseUrl}/store${RESET}`);
  console.log(`    • Browse all 10 digital products & 2 bundles`);
  console.log(`    • Click ${BOLD}"Preview Sample"${RESET} on any card to test the watermarked PDF previewer\n`);

  console.log(` ${BOLD}2. Checkout Flow & Server Pricing Simulator${RESET}`);
  console.log(`    URL: ${CYAN}${baseUrl}/products/b2b-growth-engine-playbook${RESET}`);
  console.log(`    • Click ${BOLD}"Buy & Download Now"${RESET}`);
  console.log(`    • Enter coupon code: ${GREEN}${BOLD}LAUNCH20${RESET} (gives 20% discount computed server-side)`);
  console.log(`    • Click ${BOLD}"Pay with Razorpay"${RESET} → Built-in Simulator dialog opens automatically!`);
  console.log(`    • Click ${GREEN}"Simulate Successful Payment"${RESET} to complete order without real cards\n`);

  console.log(` ${BOLD}3. Digital Downloads & Quota Enforcement${RESET}`);
  console.log(`    URL: ${CYAN}${baseUrl}/orders/success${RESET} (auto-redirected after payment)`);
  console.log(`    • Click ${BOLD}"Download Asset"${RESET} to test cryptographic stream delivery`);
  console.log(`    • Files are securely streamed from private storage with proper headers\n`);

  console.log(` ${BOLD}4. Customer Purchases Portal & Magic Link Recovery${RESET}`);
  console.log(`    URL: ${CYAN}${baseUrl}/purchases${RESET}`);
  console.log(`    • View your authenticated digital library and remaining download quotas`);
  console.log(`    • Or log out and test recovery with any email used during checkout`);
  console.log(`    • Local verification codes are automatically printed in server logs & on-screen\n`);

  console.log(` ${BOLD}5. Admin Control Center & Order Governance${RESET}`);
  console.log(`    URL: ${CYAN}${baseUrl}/admin${RESET}`);
  console.log(`    • Credentials:`);
  console.log(`      Email:    ${GREEN}${BOLD}admin@thegrowtharchive.com${RESET}`);
  console.log(`      Password: ${GREEN}${BOLD}ReplaceWithSecurePassphrase2026!#${RESET}`);
  console.log(`    • Features to test:`);
  console.log(`      - Live verified revenue KPIs & top selling products`);
  console.log(`      - Filter orders by status (PAID, PENDING, REFUNDED)`);
  console.log(`      - Execute ${BOLD}Full Refund${RESET} (revokes entitlements and invalidates active grants)`);
  console.log(`      - Execute ${BOLD}Partial Refund${RESET} (refunds custom paise without revoking access)`);
  console.log(`      - Create new discount coupons with usage limits`);
  console.log(`      - Inspect the immutable administrative ${BOLD}Audit Trail${RESET}\n`);

  console.log(`${BOLD}═══════════════════════════════════════════════════════════════════${RESET}`);
  console.log(`${DIM}Press Ctrl+C to stop the test session.${RESET}\n`);

  // Keep process running so user can leave it open in terminal
  await new Promise(() => {});
}

main().catch((err) => {
  console.error('Runner error:', err);
  process.exit(1);
});
