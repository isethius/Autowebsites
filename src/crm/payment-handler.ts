import Stripe from 'stripe';
import { Lead } from './lead-model';
import { Contract } from './contract-generator';
import { ActivityLogger } from './activity-logger';

export interface PaymentConfig {
  stripeSecretKey: string;
  webhookSecret?: string;
  testMode?: boolean;
}

export interface PaymentLink {
  id: string;
  url: string;
  amount: number;
  description: string;
  lead_id: string;
  contract_id?: string;
  expires_at?: string;
}

export interface Invoice {
  id: string;
  stripe_invoice_id: string;
  lead_id: string;
  contract_id?: string;
  amount: number;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  due_date: string;
  paid_at?: string;
  invoice_url?: string;
  invoice_pdf?: string;
}

export interface Payment {
  id: string;
  stripe_payment_id: string;
  lead_id: string;
  invoice_id?: string;
  amount: number;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  payment_method: string;
  created_at: string;
}

export class PaymentHandler {
  private stripe: Stripe;
  private webhookSecret?: string;
  private activityLogger?: ActivityLogger;
  private testMode: boolean;

  constructor(config: PaymentConfig, activityLogger?: ActivityLogger) {
    this.stripe = new Stripe(config.stripeSecretKey);
    this.webhookSecret = config.webhookSecret;
    this.activityLogger = activityLogger;
    this.testMode = config.testMode ?? config.stripeSecretKey.startsWith('sk_test_');
  }

  async createCustomer(lead: Lead): Promise<string> {
    const customer = await this.stripe.customers.create({
      name: lead.contact_name || lead.business_name,
      email: lead.email || undefined,
      phone: lead.phone || undefined,
      metadata: {
        lead_id: lead.id,
        business_name: lead.business_name,
        website: lead.website_url,
      },
      address: lead.address
        ? {
            line1: lead.address,
            city: lead.city || undefined,
            state: lead.state || undefined,
            postal_code: lead.zip || undefined,
            country: lead.country || 'US',
          }
        : undefined,
    });

    return customer.id;
  }

  async getOrCreateCustomer(lead: Lead): Promise<string> {
    // Search for existing customer by email
    if (lead.email) {
      const existing = await this.stripe.customers.list({
        email: lead.email,
        limit: 1,
      });

      if (existing.data.length > 0) {
        return existing.data[0].id;
      }
    }

    return this.createCustomer(lead);
  }

  async createPaymentLink(
    lead: Lead,
    amount: number,
    description: string,
    options: { contractId?: string; expiresInDays?: number } = {}
  ): Promise<PaymentLink> {
    const customerId = await this.getOrCreateCustomer(lead);

    // Create a price for this specific payment
    const price = await this.stripe.prices.create({
      unit_amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      product_data: {
        name: description,
        metadata: {
          lead_id: lead.id,
          contract_id: options.contractId || '',
        },
      },
    });

    // Create payment link
    const expiresAt = options.expiresInDays
      ? Math.floor(Date.now() / 1000) + options.expiresInDays * 24 * 60 * 60
      : undefined;

    const paymentLink = await this.stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: {
        lead_id: lead.id,
        contract_id: options.contractId || '',
        customer_id: customerId,
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.DASHBOARD_URL || 'http://localhost:3001'}/payment-success?lead_id=${lead.id}`,
        },
      },
    });

    return {
      id: paymentLink.id,
      url: paymentLink.url,
      amount,
      description,
      lead_id: lead.id,
      contract_id: options.contractId,
      expires_at: expiresAt ? new Date(expiresAt * 1000).toISOString() : undefined,
    };
  }

  async createInvoice(
    lead: Lead,
    items: { description: string; amount: number }[],
    options: { contractId?: string; dueInDays?: number; memo?: string } = {}
  ): Promise<Invoice> {
    const customerId = await this.getOrCreateCustomer(lead);

    // Create invoice
    const invoice = await this.stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: options.dueInDays || 15,
      metadata: {
        lead_id: lead.id,
        contract_id: options.contractId || '',
      },
      description: options.memo,
    });

    // Add line items
    for (const item of items) {
      await this.stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        description: item.description,
        amount: Math.round(item.amount * 100),
        currency: 'usd',
      });
    }

    // Finalize and send
    const finalizedInvoice = await this.stripe.invoices.finalizeInvoice(invoice.id);
    await this.stripe.invoices.sendInvoice(invoice.id);

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const dueDate = new Date(Date.now() + (options.dueInDays || 15) * 24 * 60 * 60 * 1000);

    // Log activity
    if (this.activityLogger) {
      await this.activityLogger.log({
        lead_id: lead.id,
        type: 'custom',
        title: `Invoice created: $${totalAmount.toLocaleString()}`,
        metadata: { invoice_id: invoice.id, amount: totalAmount },
      });
    }

    return {
      id: `inv_${Date.now()}`,
      stripe_invoice_id: invoice.id,
      lead_id: lead.id,
      contract_id: options.contractId,
      amount: totalAmount,
      status: 'open',
      due_date: dueDate.toISOString(),
      invoice_url: finalizedInvoice.hosted_invoice_url || undefined,
      invoice_pdf: finalizedInvoice.invoice_pdf || undefined,
    };
  }

  async createDepositInvoice(lead: Lead, contract: Contract): Promise<Invoice> {
    return this.createInvoice(
      lead,
      [
        {
          description: `Website Development Deposit - ${contract.selected_tier.name} Package`,
          amount: contract.deposit_amount,
        },
      ],
      {
        contractId: contract.id,
        dueInDays: 7,
        memo: `Deposit for ${lead.business_name} website project`,
      }
    );
  }

  async createFinalInvoice(lead: Lead, contract: Contract): Promise<Invoice> {
    const finalAmount = contract.total_amount - contract.deposit_amount;

    return this.createInvoice(
      lead,
      [
        {
          description: `Website Development Final Payment - ${contract.selected_tier.name} Package`,
          amount: finalAmount,
        },
      ],
      {
        contractId: contract.id,
        dueInDays: 15,
        memo: `Final payment for ${lead.business_name} website project`,
      }
    );
  }

  async getInvoiceStatus(stripeInvoiceId: string): Promise<Invoice['status']> {
    const invoice = await this.stripe.invoices.retrieve(stripeInvoiceId);

    switch (invoice.status) {
      case 'draft':
        return 'draft';
      case 'open':
        return 'open';
      case 'paid':
        return 'paid';
      case 'void':
        return 'void';
      case 'uncollectible':
        return 'uncollectible';
      default:
        return 'open';
    }
  }

  async handleWebhook(
    payload: string,
    signature: string
  ): Promise<{ type: string; data: any }> {
    if (!this.webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.webhookSecret
    );

    const eventData = event.data.object as any;

    switch (event.type) {
      case 'invoice.paid': {
        const leadId = eventData.metadata?.lead_id;
        if (leadId && this.activityLogger) {
          await this.activityLogger.logPaymentReceived(
            leadId,
            eventData.amount_paid / 100,
            eventData.id
          );
        }
        break;
      }

      case 'invoice.payment_failed': {
        const leadId = eventData.metadata?.lead_id;
        if (leadId && this.activityLogger) {
          await this.activityLogger.log({
            lead_id: leadId,
            type: 'custom',
            title: 'Payment failed',
            metadata: { invoice_id: eventData.id },
          });
        }
        break;
      }

      case 'checkout.session.completed': {
        const leadId = eventData.metadata?.lead_id;
        if (leadId && this.activityLogger) {
          await this.activityLogger.logPaymentReceived(
            leadId,
            eventData.amount_total / 100,
            eventData.id
          );
        }
        break;
      }
    }

    return { type: event.type, data: eventData };
  }

  async listPayments(
    leadId: string,
    options: { limit?: number } = {}
  ): Promise<Payment[]> {
    // In production, you'd query your database
    // For now, we'll search Stripe directly
    const payments: Payment[] = [];

    const charges = await this.stripe.charges.list({
      limit: options.limit || 10,
    });

    for (const charge of charges.data) {
      if (charge.metadata?.lead_id === leadId) {
        payments.push({
          id: charge.id,
          stripe_payment_id: charge.id,
          lead_id: leadId,
          amount: charge.amount / 100,
          status: charge.status === 'succeeded' ? 'succeeded' : charge.refunded ? 'refunded' : 'pending',
          payment_method: charge.payment_method_details?.type || 'unknown',
          created_at: new Date(charge.created * 1000).toISOString(),
        });
      }
    }

    return payments;
  }

  async refund(chargeId: string, amount?: number): Promise<void> {
    await this.stripe.refunds.create({
      charge: chargeId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });
  }

  isTestMode(): boolean {
    return this.testMode;
  }
}

export function createPaymentHandler(
  config?: Partial<PaymentConfig>,
  activityLogger?: ActivityLogger
): PaymentHandler {
  const stripeKey = config?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new Error('STRIPE_SECRET_KEY is required');
  }

  return new PaymentHandler(
    {
      stripeSecretKey: stripeKey,
      webhookSecret: config?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET,
      testMode: config?.testMode,
    },
    activityLogger
  );
}
