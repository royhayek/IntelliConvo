#!/usr/bin/env tsx
/**
 * Script to manually create missing billing transaction for invoice in_1Sgjhi7kyBl6EleGOTglx3fa
 * This fixes the issue where the webhook failed to create a transaction because the invoice
 * had no subscription ID attached.
 */

import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const INVOICE_ID = 'in_1Sgjhi7kyBl6EleGOTglx3fa';
const SUBSCRIPTION_ID = '9f585a84-4264-41b3-9d79-f199e1720bf9';

async function fixMissingTransaction() {
  console.log('🔍 Checking if transaction already exists...');

  // Check if transaction already exists
  const existingTransaction = await prisma.billingTransaction.findFirst({
    where: { stripeInvoiceId: INVOICE_ID },
  });

  if (existingTransaction) {
    console.log('✅ Transaction already exists:', existingTransaction.id);
    console.log('   No action needed.');
    await prisma.$disconnect();
    return;
  }

  console.log('📋 Fetching invoice details from Stripe...');

  // Fetch invoice from Stripe
  let invoice: Stripe.Invoice;
  try {
    invoice = await stripe.invoices.retrieve(INVOICE_ID);
    console.log('   Amount paid:', (invoice.amount_paid || 0) / 100, invoice.currency.toUpperCase());
    console.log('   Subscription:', invoice.subscription || 'NONE');
    console.log('   Customer:', invoice.customer);
  } catch (error: any) {
    console.error('❌ Failed to fetch invoice from Stripe:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log('🔍 Fetching subscription from database...');

  // Get subscription
  const subscription = await prisma.subscription.findUnique({
    where: { id: SUBSCRIPTION_ID },
    include: {
      site: { select: { siteName: true } },
      user: { select: { email: true } },
    },
  });

  if (!subscription) {
    console.error('❌ Subscription not found:', SUBSCRIPTION_ID);
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log('   Subscription found:', subscription.site.siteName);
  console.log('   User:', subscription.user.email);

  // Create the missing transaction
  console.log('💾 Creating billing transaction...');

  const transaction = await prisma.billingTransaction.create({
    data: {
      userId: subscription.userId,
      siteId: subscription.siteId,
      invoiceId: invoice.number || invoice.id,
      amount: (invoice.amount_paid || 0) / 100,
      currency: invoice.currency.toUpperCase(),
      status: 'paid',
      stripeInvoiceId: invoice.id,
    },
  });

  console.log('✅ Transaction created successfully!');
  console.log('   Transaction ID:', transaction.id);
  console.log('   Amount:', transaction.amount, transaction.currency);

  // Update subscription's currentPeriodEnd if needed
  if (invoice.lines?.data?.[0]?.period?.end) {
    const newPeriodEnd = new Date(invoice.lines.data[0].period.end * 1000);

    console.log('📅 Updating subscription currentPeriodEnd...');
    console.log('   Current:', subscription.currentPeriodEnd);
    console.log('   New:', newPeriodEnd);

    await prisma.subscription.update({
      where: { id: SUBSCRIPTION_ID },
      data: {
        currentPeriodStart: new Date(invoice.lines.data[0].period.start * 1000),
        currentPeriodEnd: newPeriodEnd,
      },
    });

    console.log('✅ Subscription updated!');
  }

  console.log('');
  console.log('🎉 All done! The missing transaction has been created.');

  await prisma.$disconnect();
}

fixMissingTransaction().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
