import { prisma } from '../../config/prisma.js';
import type {
  ChapaInitializeRequest,
  ChapaInitializeResponse,
  ChapaVerifyResponse
} from './subscription.interface.js';
import { v4 as uuidv4 } from 'uuid';
import https from 'node:https';

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
const CHAPA_API_URL = 'https://api.chapa.co/v1';

export class SubscriptionService {
  async getAllPlans() {
    return await prisma.plan.findMany({
      where: { isActive: true },
    });
  }

  async initializePayment(userId: string, planId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!user || !plan) {
      throw new Error('User or Plan not found');
    }

    const txRef = `tx-${uuidv4()}`;

    // Create a pending transaction
    await prisma.paymentTransaction.create({
      data: {
        userId,
        planId,
        amount: plan.price,
        currency: plan.currency,
        txRef,
        status: 'PENDING',
      },
    });

    const payload: ChapaInitializeRequest = {
      amount: plan.price.toString(),
      currency: plan.currency,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      tx_ref: txRef,
      callback_url: process.env.CHAPA_CALLBACK_URL,
      return_url: `${process.env.CHAPA_RETURN_URL}?tx_ref=${txRef}`,
      customization: {
        title: `Sub: ${plan.name}`.substring(0, 16).replace(/[^a-zA-Z0-9.\-_ ]/g, ''),
        description: (plan.description || 'Premium features subscription').substring(0, 50),
      },
    };

    const response = await fetch(`${CHAPA_API_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json() as any;

    if (!response.ok || data.status !== 'success') {
      console.error('[Chapa Initialization Error]:', JSON.stringify(data, null, 2));
      throw new Error(
        typeof data.message === 'string'
          ? data.message
          : JSON.stringify(data.message) || 'Failed to initialize payment'
      );
    }

    return data.data;
  }

  async verifyPayment(txRef: string) {
    if (!txRef) {
      return { success: false, message: 'Transaction reference is required' };
    }

    return new Promise((resolve) => {
      console.log(`[SubscriptionService] Verifying payment for txRef: ${txRef}`);
      
      const options = {
        hostname: 'api.chapa.co',
        path: `/v1/transaction/verify/${txRef}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CHAPA_SECRET_KEY}`
        },
        timeout: 15000 // 15 seconds timeout
      };

      const req = https.get(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', async () => {
          try {
            const parsedData = JSON.parse(data);
            if (res.statusCode !== 200) {
              console.error(`[Chapa Verification Error]: HTTP ${res.statusCode}`, JSON.stringify(parsedData, null, 2));
              return resolve({ 
                success: false, 
                message: parsedData.message || `Chapa returned HTTP ${res.statusCode}` 
              });
            }

            if (parsedData.status === 'success' && parsedData.data.status === 'success') {
              await this.handleSuccessfulPayment(txRef, parsedData.data);
              return resolve({ success: true, message: 'Payment verified' });
            }

            resolve({ success: false, message: parsedData.message || 'Payment verification failed' });
          } catch (e) {
            console.error('[SubscriptionService] Error parsing verify response:', e);
            resolve({ success: false, message: 'Invalid response from payment gateway' });
          }
        });
      });

      req.on('error', (error) => {
        console.error('[SubscriptionService] HTTPS request failed:', error.message);
        resolve({ success: false, message: `Network error: ${error.message}` });
      });

      req.on('timeout', () => {
        req.destroy();
        console.error('[SubscriptionService] Verification request timed out');
        resolve({ success: false, message: 'Payment verification timed out' });
      });
    });
  }

  private async handleSuccessfulPayment(txRef: string, chapaData: any) {
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { txRef },
      include: { plan: true },
    });

    if (!transaction || transaction.status === 'SUCCESS') {
      return;
    }

    // Update transaction
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'SUCCESS',
        payload: chapaData,
      },
    });

    // Create or update subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + transaction.plan.durationDays);

    await prisma.subscription.create({
      data: {
        userId: transaction.userId,
        planId: transaction.planId,
        status: 'ACTIVE',
        startDate,
        endDate,
        txRef,
      },
    });
  }

  async getUserSubscription(userId: string) {
    return await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: {
          gt: new Date(),
        },
      },
      include: {
        plan: true,
      },
    });
  }
}
