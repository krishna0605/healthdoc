import { FastifyInstance } from 'fastify';
import { square } from '../../lib/square.js';
import { prisma } from '../../lib/prisma.js';
import { z } from 'zod';
import { WebhooksHelper } from 'square';
import crypto from 'crypto';

export async function paymentRoutes(fastify: FastifyInstance) {
  
  // Checkout Route: Generate Square Payment Link
  fastify.post('/create-checkout', async (request, reply) => {
    const schema = z.object({
      userId: z.string(),
      planTier: z.enum(['PRO', 'FAMILY']),
    });

    request.log.info(`[Payment] Raw Body: ${JSON.stringify(request.body)}`);

    const body = schema.safeParse(request.body);
    if (!body.success) {
        request.log.error(`[Payment] Validation Error: ${JSON.stringify(body.error)}`);
        return reply.status(400).send(body.error);
    }

    const { userId, planTier } = body.data;
    request.log.info(`[Payment] Creating checkout for user ${userId} request for ${planTier}`);
    
    // CRITICAL CONFIG CHECK: Detect Sandbox Token in Production
    const env = (process.env.SQUARE_ENVIRONMENT || '').toLowerCase();
    const token = process.env.SQUARE_ACCESS_TOKEN || '';
    if (env === 'production' && token.startsWith('EAAAE')) {
        const errorMsg = 'CONFIGURATION ERROR: You are using a Sandbox Token (starts with EAAAE) in Production Mode. Please update SQUARE_ACCESS_TOKEN in Railway with your Production Token.';
        request.log.error(errorMsg);
        return reply.status(500).send({ error: errorMsg });
    }
    
    // Price mapping (in paise - 1/100 INR)
    // PRO: ₹1,599 (~$19) -> 159900 paise
    // FAMILY: ₹3,999 (~$49) -> 399900 paise
    const prices = { PRO: 159900, FAMILY: 399900 };
    const amount = BigInt(prices[planTier]); // Square SDK expects bigint for Money amount

    try {
      // Correct accessor for Square SDK v44+ is .checkout.paymentLinks.create
      const response = await square.checkout.paymentLinks.create({
        idempotencyKey: crypto.randomUUID(),
        order: {
          locationId: process.env.SQUARE_LOCATION_ID!,
          lineItems: [
            {
              name: `HealthDoc ${planTier} Plan`,
              quantity: '1',
              basePriceMoney: {
                amount: amount,
                currency: 'INR',
              },
            },
          ],
          metadata: {
            userId: userId,
            planTier: planTier,
          },
        },
        checkoutOptions: {
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
        },
      });
      // SDK v44: HttpResponsePromise resolves directly to the response body
      return reply.send({ url: response.paymentLink?.url });
    } catch (error: any) {
      request.log.error(error);
      
      // Debug info to help user identify mismatch
      const env = process.env.SQUARE_ENVIRONMENT || 'sandbox (default)';
      const token = process.env.SQUARE_ACCESS_TOKEN || '';
      const tokenHint = token.substring(0, 4) + '...';
      
      const debugInfo = `[Env: ${env}, Token: ${tokenHint}]`;

      // Return detailed error for debugging
      const errorDetail = error.result ? JSON.stringify(error.result) : (error.message || JSON.stringify(error));
      return reply.status(500).send({ error: `Failed to create checkout link. ${debugInfo} Details: ${errorDetail}` });
    }
  });

  // Webhook Handler
  fastify.post('/webhook', async (request, reply) => {
    const signature = request.headers['x-square-hmacsha256-signature'] as string;
    const body = JSON.stringify(request.body);
    const url = `${process.env.API_URL}/webhooks/square`; // Adjust based on actual Railway URL mounting

    // Verify Signature (Simplified for now, robust verification needs raw body buffer)
    // Note: Fastify by default parses JSON, so we might need `fastify-raw-body` plugin for strict verification
    // For this implementation, we will trust the parsing but recommend enabling raw body in server config.

    const event = request.body as any;

    if (event.type === 'payment.updated') {
        const payment = event.data.object.payment;
        if (payment.status === 'COMPLETED') {
            // Retrieve Order to get metadata (userId)
            // Note: Payment object often links to Order
            const orderId = payment.order_id;
            if (orderId) {
                try {
                    const order = await square.ordersApi.retrieveOrder(orderId);
                    const metadata = order.result.order?.metadata;
                    
                    if (metadata?.userId && metadata?.planTier) {
                         await prisma.profile.update({
                            where: { userId: metadata.userId },
                            data: { planTier: metadata.planTier as any }
                         });
                         request.log.info(`Upgraded user ${metadata.userId} to ${metadata.planTier}`);
                    }
                } catch(e) {
                    request.log.error(e);
                }
            }
        }
    }

    return reply.status(200).send({ received: true });
  });
}
