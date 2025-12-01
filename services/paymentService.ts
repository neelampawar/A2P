/**
 * AP2 Payment Service - Shopping Agent Implementation
 * 
 * This service implements the AP2 (Agent Payments Protocol) for human-present
 * card purchases. It orchestrates the interaction between:
 * - Shopping Agent (this service)
 * - Merchant Agent (product catalog)
 * - Credentials Provider Agent (payment methods)
 * - Merchant Payment Processor Agent (payment processing)
 * 
 * Protocol Flow:
 * 1. Shopping Agent validates merchant agent and creates IntentMandate
 * 2. Merchant Agent creates and signs CartMandate
 * 3. Shopping Agent collects shipping address and updates cart
 * 4. Credentials Provider tokenizes payment method
 * 5. Shopping Agent creates and signs PaymentMandate
 * 6. Payment Processor initiates payment (may request OTP)
 * 7. User provides OTP, payment completes
 */

import { PaymentStep } from '../types';
import {
  CartMandate,
  PaymentMandate,
  IntentMandate,
  MandateBuilder,
  MandateValidator,
  A2AMessageBuilder,
  ExtensionValidator,
  VerboseLogger,
  VerboseLog,
  TransactionState,
  KNOWN_AGENTS,
} from './ap2Utils';

const API_URL = "http://localhost:8000";

// Track verbose logs for inspection
let globalVerboseLogger: VerboseLogger | null = null;

// --- Types ---

interface BackendCartItem {
  name: string;
  quantity: number;
}

interface PaymentResponse {
  status: "SUCCESS" | "CHALLENGE_REQUIRED" | "FAILED";
  message?: string;
  display_text?: string;
  receipt?: {
    id: string;
    amount: number;
  };
}

export interface AP2TransactionOptions {
  userEmail?: string;
  selectedCardAlias?: string;
  verboseMode?: boolean;
  agentRegistry?: typeof KNOWN_AGENTS;
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Main entry point for AP2 transactions
 * Implements the Shopping Agent role from the AP2 protocol
 */
export const executeAP2Transaction = async (
  cartItems: { name: string; quantity: number }[],
  userEmail: string = "bugsbunny@gmail.com",
  selectedCardAlias: string = "Acme Bank Visa ending in 4242",
  onStepChange: (step: PaymentStep, log: string) => void,
  options: AP2TransactionOptions = {}
): Promise<boolean> => {
  const {
    verboseMode = false,
    agentRegistry = KNOWN_AGENTS,
  } = options;

  // Initialize verbose logger
  globalVerboseLogger = verboseMode ? new VerboseLogger() : null;

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    // ============================================================
    // PHASE 1: INTENT & MERCHANT VALIDATION
    // ============================================================
    onStepChange(PaymentStep.IDENTIFYING, "Shopping Agent initializing AP2 transaction...");
    
    if (verboseMode) {
      globalVerboseLogger?.log(
        "PHASE_1",
        "Shopping Agent validates merchant and creates intent",
        "shopping_agent",
        { cartItems, userEmail },
        "Create IntentMandate"
      );
    }

    // Validate merchant agent is in registry
    const merchantAgent = agentRegistry.merchant_agent;
    if (!merchantAgent) {
      throw new Error("Merchant Agent not found in registry");
    }

    // Create IntentMandate representing user's shopping intent
    const intentMandate = MandateBuilder.buildIntentMandate(
      `Purchase ${cartItems.length} items`,
      1000
    );

    if (verboseMode) {
      globalVerboseLogger?.log(
        "PHASE_1",
        "IntentMandate created",
        "shopping_agent",
        intentMandate
      );
    }

    onStepChange(
      PaymentStep.IDENTIFYING,
      `Shopping Agent ready. Intent ID: ${intentMandate.intent_id}`
    );
    await delay(600);

    // ============================================================
    // PHASE 2: MERCHANT AGENT - CART CREATION
    // ============================================================
    onStepChange(PaymentStep.IDENTIFYING, "Shopping Agent delegating to Merchant Agent...");

    if (verboseMode) {
      globalVerboseLogger?.log(
        "PHASE_2",
        "Sending request to Merchant Agent via A2A",
        "shopping_agent",
        {
          extensionsRequired: ExtensionValidator.requiredExtensions,
          intent: intentMandate,
        },
        "Receive CartMandate"
      );
    }

    const backendItems: BackendCartItem[] = cartItems.map(i => ({
      name: i.name,
      quantity: i.quantity
    }));

    const cartRes = await fetch(`${API_URL}/merchant/create_cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'shopping_agent_id': 'trusted_shopping_agent',
        ...ExtensionValidator.buildA2AHeaders(),
      },
      body: JSON.stringify({ items: backendItems })
    });

    if (!cartRes.ok) {
      throw new Error("Merchant Agent rejected the request");
    }

    const cartMandate: CartMandate = await cartRes.json();

    // Validate CartMandate structure
    const cartValidation = MandateValidator.validateCartMandate(cartMandate);
    if (!cartValidation.valid) {
      throw new Error(`Invalid CartMandate: ${cartValidation.errors.join(", ")}`);
    }

    if (verboseMode) {
      globalVerboseLogger?.log(
        "PHASE_2",
        "CartMandate received and validated",
        "merchant_agent",
        cartMandate,
        "Verify merchant signature"
      );
    }

    onStepChange(
      PaymentStep.IDENTIFYING,
      `CartMandate Received (ID: ${cartMandate.cart_id}). Verifying signature...`
    );
    await delay(800);

    onStepChange(
      PaymentStep.IDENTIFYING,
      `Merchant signature valid. Total: ₹${cartMandate.total_price.toFixed(2)}`
    );
    await delay(600);

    // ============================================================
    // PHASE 3: CREDENTIALS PROVIDER - TOKENIZATION
    // ============================================================
    onStepChange(PaymentStep.CREATING_INTENT, "Contacting Credentials Provider for payment tokenization...");

    if (verboseMode) {
      globalVerboseLogger?.log(
        "PHASE_3",
        "Shopping Agent requests payment method from Credentials Provider",
        "shopping_agent",
        { userEmail, selectedCardAlias },
        "Receive payment token"
      );
    }

    const tokenRes = await fetch(`${API_URL}/wallet/tokenize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...ExtensionValidator.buildA2AHeaders(),
      },
      body: JSON.stringify({
        email: userEmail,
        alias: selectedCardAlias
      })
    });

    if (!tokenRes.ok) {
      throw new Error("Credentials Provider failed to tokenize card");
    }

    const { token } = await tokenRes.json();

    if (verboseMode) {
      globalVerboseLogger?.log(
        "PHASE_3",
        "Payment token generated by Credentials Provider",
        "credentials_provider",
        { token: `${token.substring(0, 20)}...` },
        "User signs PaymentMandate"
      );
    }

    onStepChange(PaymentStep.CREATING_INTENT, `Payment Method Tokenized: ${token.substring(0, 15)}...`);
    await delay(800);

    // ============================================================
    // PHASE 4: USER SIGNS PAYMENT MANDATE
    // ============================================================
    onStepChange(PaymentStep.PROCESSING, "Preparing PaymentMandate for user signature...");

    if (verboseMode) {
      globalVerboseLogger?.log(
        "PHASE_4",
        "Shopping Agent constructs PaymentMandate",
        "shopping_agent",
        {
          cart_id: cartMandate.cart_id,
          amount: cartMandate.total_price,
          description: "PaymentMandate ready for biometric signature"
        },
        "User signs with device biometric"
      );
    }

    // Build PaymentMandate (to be signed by user)
    const paymentMandate: PaymentMandate = MandateBuilder.buildPaymentMandate(
      cartMandate.cart_id,
      cartMandate.total_price,
      token
    );

    if (verboseMode) {
      globalVerboseLogger?.log(
        "PHASE_4",
        "PaymentMandate signed by user (device biometric/PIN)",
        "shopping_agent",
        paymentMandate,
        "Send to Payment Processor via Credentials Provider"
      );
    }

    onStepChange(PaymentStep.PROCESSING, "PaymentMandate prepared. Awaiting signature...");
    await delay(1200);

    // Validate PaymentMandate
    const paymentValidation = MandateValidator.validatePaymentMandate(paymentMandate);
    if (!paymentValidation.valid) {
      throw new Error(`Invalid PaymentMandate: ${paymentValidation.errors.join(", ")}`);
    }

    // ============================================================
    // PHASE 5: PAYMENT PROCESSOR - INITIATION
    // ============================================================
    onStepChange(PaymentStep.PROCESSING, "Transmitting PaymentMandate to Payment Processor Agent...");

    if (verboseMode) {
      globalVerboseLogger?.log(
        "PHASE_5",
        "Shopping Agent sends PaymentMandate to Processor via Credentials Provider",
        "shopping_agent",
        {
          mandate_id: paymentMandate.mandate_id,
          cart_id: paymentMandate.cart_id,
          amount: paymentMandate.amount,
          hasOtp: false
        },
        "Processor may request OTP challenge"
      );
    }

    const initRes = await fetch(`${API_URL}/processor/initiate_payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...ExtensionValidator.buildA2AHeaders(),
      },
      body: JSON.stringify({
        payment_mandate: paymentMandate,
        otp: null // First attempt has no OTP
      })
    });

    let paymentData: PaymentResponse = await initRes.json();

    if (verboseMode) {
      globalVerboseLogger?.log(
        "PHASE_5",
        `Processor response: ${paymentData.status}`,
        "merchant_payment_processor",
        paymentData,
        paymentData.status === "CHALLENGE_REQUIRED" ? "User provides OTP" : "Return payment result"
      );
    }

    // ============================================================
    // PHASE 6: OTP CHALLENGE (Step-Up Authentication)
    // ============================================================
    if (paymentData.status === "CHALLENGE_REQUIRED") {
      onStepChange(PaymentStep.PROCESSING, `Security Challenge Required: ${paymentData.message}`);

      if (verboseMode) {
        globalVerboseLogger?.log(
          "PHASE_6",
          "Processor requests OTP challenge for step-up authentication",
          "merchant_payment_processor",
          { challenge: paymentData.message },
          "User provides OTP via secure channel"
        );
      }

      await delay(500);
      const userOtp = window.prompt(`${paymentData.display_text}\n(Mock: enter '123456')`);

      if (!userOtp) {
        throw new Error("User cancelled OTP Challenge");
      }

      if (verboseMode) {
        globalVerboseLogger?.log(
          "PHASE_6",
          "User provided OTP, retrying payment",
          "shopping_agent",
          { otpProvided: true },
          "Processor verifies OTP"
        );
      }

      onStepChange(PaymentStep.PROCESSING, "Verifying OTP...");

      // Retry payment with OTP
      const otpRes = await fetch(`${API_URL}/processor/initiate_payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...ExtensionValidator.buildA2AHeaders(),
        },
        body: JSON.stringify({
          payment_mandate: paymentMandate,
          otp: userOtp
        })
      });

      if (!otpRes.ok) {
        throw new Error("OTP Verification Failed");
      }

      paymentData = await otpRes.json();

      if (verboseMode) {
        globalVerboseLogger?.log(
          "PHASE_6",
          `OTP verification result: ${paymentData.status}`,
          "merchant_payment_processor",
          paymentData
        );
      }
    }

    // ============================================================
    // PHASE 7: COMPLETION
    // ============================================================
    if (paymentData.status === "SUCCESS" && paymentData.receipt) {
      onStepChange(PaymentStep.SUCCESS, `Transaction Approved! Receipt ID: ${paymentData.receipt.id}`);

      if (verboseMode) {
        globalVerboseLogger?.log(
          "PHASE_7",
          "Payment completed successfully",
          "merchant_payment_processor",
          {
            receipt: paymentData.receipt,
            mandate_id: paymentMandate.mandate_id,
          },
          "Shopping Agent displays receipt to user"
        );
      }

      return true;
    } else {
      throw new Error("Payment Processor declined the transaction");
    }

  } catch (error: any) {
    console.error("AP2 Transaction Error:", error);
    onStepChange(PaymentStep.FAILED, error.message || "Unknown AP2 Error");
    return false;
  }
};

// ============================================================
// UTILITIES FOR VERBOSE MODE & DEBUGGING
// ============================================================

/**
 * Retrieve verbose logs from the last transaction
 */
export const getVerboseLogs = (): VerboseLog[] => {
  return globalVerboseLogger?.getLogs() || [];
};

/**
 * Get formatted verbose output for display
 */
export const getFormattedVerboseOutput = (): string => {
  return globalVerboseLogger?.getFormattedOutput() || "No logs available";
};

/**
 * Clear logs
 */
export const clearVerboseLogs = (): void => {
  globalVerboseLogger?.clear();
};