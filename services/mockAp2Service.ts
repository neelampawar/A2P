import { PaymentStep } from '../types';

// This simulates the delays and handshake of the Agent Payment Protocol (AP2).
// In a real app, this would communicate with a secure backend that holds the private keys
// to sign tokens as per https://github.com/google-agentic-commerce/AP2/

export const simulateAP2Payment = async (
  amount: number,
  onStepChange: (step: PaymentStep, log: string) => void
): Promise<boolean> => {
  
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    // Step 1: Identification
    onStepChange(PaymentStep.IDENTIFYING, "Initiating AP2 Handshake...");
    await delay(1000);
    onStepChange(PaymentStep.IDENTIFYING, "Agent Identity Verified (Mock Signature)...");
    await delay(800);

    // Step 2: Intent Creation
    onStepChange(PaymentStep.CREATING_INTENT, "Constructing Transaction Intent...");
    // Simulating payload construction
    // e.g. { "amount": { "currency_code": "USD", "value": amount }, "payment_source": ... }
    await delay(1200);
    onStepChange(PaymentStep.CREATING_INTENT, `Intent Created: ID-AP2-${Math.floor(Math.random() * 100000)}`);
    await delay(800);

    // Step 3: Processing
    onStepChange(PaymentStep.PROCESSING, "Transmitting Card Data via Secure Agent Channel...");
    await delay(1500);
    onStepChange(PaymentStep.PROCESSING, "Waiting for Gateway Confirmation...");
    await delay(1000);

    // Success
    onStepChange(PaymentStep.SUCCESS, "Transaction Approved via Agent Protocol.");
    return true;

  } catch (e) {
    onStepChange(PaymentStep.FAILED, "Agent Protocol Error.");
    return false;
  }
};
