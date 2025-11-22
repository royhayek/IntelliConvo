/**
 * Database Seed Script
 * Creates initial admin user and default data
 *
 * Run with: npm run prisma:seed
 */

import { PrismaClient, AuthProvider } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create initial admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@intelligentconvo.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#';

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`Admin user already exists: ${adminEmail}`);

    // Ensure the user has admin privileges
    if (!existingAdmin.isAdmin) {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { isAdmin: true },
      });
      console.log(`Upgraded existing user to admin: ${adminEmail}`);
    }
  } else {
    // Hash the password
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: 'System Administrator',
        authProvider: AuthProvider.EMAIL,
        passwordHash,
        isAdmin: true,
      },
    });

    console.log(`Created admin user: ${admin.email}`);
    console.log('');
    console.log('='.repeat(50));
    console.log('ADMIN CREDENTIALS (save these securely):');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('='.repeat(50));
    console.log('');
    console.log('IMPORTANT: Change the admin password after first login!');
  }

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
