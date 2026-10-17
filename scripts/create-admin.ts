import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth/crypto';

const prisma = new PrismaClient();

function parseArgs(): Record<string, string> {
  const args = process.argv.slice(2);
  const result: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        result[key] = next;
        i++;
      } else {
        result[key] = 'true';
      }
    }
  }

  return result;
}

async function main() {
  const args = parseArgs();

  const email = (args.email || process.env.ADMIN_EMAIL || 'admin@thegrowtharchive.com').toLowerCase().trim();
  const name = args.name || process.env.ADMIN_NAME || 'Archive Lead Administrator';
  const password = args.password || process.env.ADMIN_PASSWORD || 'GrowthArchiveAdmin2026!#';
  const role = args.role || 'OWNER';

  if (!email.includes('@')) {
    console.error('Error: A valid email address is required.');
    process.exit(1);
  }

  if (password.length < 10) {
    console.error('Error: Password must be at least 10 characters long.');
    process.exit(1);
  }

  console.log(`[Admin CLI] Provisioning admin user: ${email} (Role: ${role})`);

  const passwordHash = hashPassword(password);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: role as any,
      isActive: true,
    },
    create: {
      email,
      name,
      passwordHash,
      role: role as any,
      isActive: true,
    },
  });

  // Create audit log record
  await prisma.auditLog.create({
    data: {
      adminUserId: admin.id,
      action: 'ADMIN_USER_PROVISIONED',
      targetType: 'ADMIN_USER',
      targetId: admin.id,
      details: JSON.stringify({
        email: admin.email,
        role: admin.role,
        provisionedVia: 'CLI',
      }),
    },
  });

  console.log(`[Admin CLI] Successfully provisioned admin user ID: ${admin.id}`);
  console.log(`[Admin CLI] Authentication method: scrypt (N=16384, r=8, p=1)`);
  console.log(`[Admin CLI] Raw credentials are NOT logged.`);
}

main()
  .catch((err) => {
    console.error('[Admin CLI] Failed to provision admin user:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
