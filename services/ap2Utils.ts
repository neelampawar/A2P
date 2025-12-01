/**
 * AP2 (Agent Payments Protocol) Utilities
 * 
 * This module implements the core data structures and utilities for the
 * Agent Payments Protocol v1, enabling secure agent-to-agent communication
 * for payment transactions.
 * 
 * Key Concepts:
 * - IntentMandate: User's shopping intent
 * - CartMandate: Merchant's offer (signed by merchant)
 * - PaymentMandate: User's payment authorization (signed by user)
 * - A2A Message: Agent-to-Agent communication wrapper with mandates as DataParts
 */

// ============================================================
// CORE AP2 TYPES
// ============================================================

export interface AP2Extension {
  uri: string;
  description: string;
  required: boolean;
}

export interface AP2Capability {
  extensions: AP2Extension[];
}

export interface AP2AgentCard {
  name: string;
  description: string;
  capabilities: AP2Capability;
  skills: Array<{
    id: string;
    name: string;
    description: string;
    tags: string[];
  }>;
  defaultInputModes: string[];
  defaultOutputModes: string[];
  url: string;
  version: string;
}

// ============================================================
// MANDATE TYPES (Core AP2 Protocol Objects)
// ============================================================

export interface CartItem {
  product_id: string;
  quantity: number;
  price: number;
  name?: string;
}

export interface CartMandate {
  cart_id: string;
  merchant_id: string;
  items: CartItem[];
  total_price: number;
  currency: string;
  valid_for_seconds: number; // How long the cart remains valid
  refundable_for_seconds: number; // How long purchase can be refunded
  merchant_signature: string; // Merchant's cryptographic signature
  created_at?: string;
}

export interface PaymentMandate {
  mandate_id: string;
  cart_id: string;
  amount: number;
  currency: string;
  payment_token: string; // Token from credentials provider
  user_signature: string; // User's cryptographic signature (from device biometric)
  created_at?: string;
}

export interface IntentMandate {
  intent_id: string;
  user_intent: string;
  categories?: string[];
  budget_limit?: number;
  currency: string;
}

// ============================================================
// A2A MESSAGE TYPES (Agent-to-Agent Communication)
// ============================================================

export interface TextPart {
  text: string;
}

export interface DataPart {
  mimeType: string;
  data: CartMandate | PaymentMandate | IntentMandate | any;
}

export interface A2APart {
  root?: TextPart;
  data?: DataPart;
}

export interface A2AMessage {
  messageId: string;
  timestamp: string;
  fromAgent: string;
  toAgent: string;
  parts: A2APart[];
  extensionsRequired: string[];
}

// ============================================================
// AGENT VALIDATION & REGISTRATION
// ============================================================

export interface AgentRegistry {
  [agentId: string]: {
    name: string;
    baseUrl: string;
    requiredExtensions: string[];
    publicKey?: string; // For signature verification
  };
}

// ============================================================
// BUILDERS: Create AP2 Objects
// ============================================================

export class MandateBuilder {
  /**
   * Builds a CartMandate as would be created by a Merchant Agent
   */
  static buildCartMandate(
    items: CartItem[],
    merchantId: string,
    totalPrice: number
  ): CartMandate {
    return {
      cart_id: `cart_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      merchant_id: merchantId,
      items,
      total_price: totalPrice,
      currency: "USD",
      valid_for_seconds: 900, // 15 minutes
      refundable_for_seconds: 2592000, // 30 days
      merchant_signature: this.generateMockSignature("merchant"),
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Builds a PaymentMandate as would be created by Shopping Agent and signed by User
   */
  static buildPaymentMandate(
    cartId: string,
    amount: number,
    paymentToken: string
  ): PaymentMandate {
    return {
      mandate_id: `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      cart_id: cartId,
      amount,
      currency: "USD",
      payment_token: paymentToken,
      user_signature: this.generateMockSignature("user"),
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Builds an IntentMandate representing user's shopping intent
   */
  static buildIntentMandate(userIntent: string, budget?: number): IntentMandate {
    return {
      intent_id: `intent_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      user_intent: userIntent,
      budget_limit: budget,
      currency: "USD",
    };
  }

  private static generateMockSignature(type: "user" | "merchant"): string {
    // In production, this would be a real cryptographic signature
    // using ECDSA or similar with private keys from hardware security modules
    return `sig_${type}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

// ============================================================
// VALIDATORS: Verify AP2 Objects
// ============================================================

export class MandateValidator {
  /**
   * Validates a CartMandate signature and structure
   */
  static validateCartMandate(mandate: CartMandate): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!mandate.cart_id) errors.push("Missing cart_id");
    if (!mandate.merchant_id) errors.push("Missing merchant_id");
    if (!mandate.items || mandate.items.length === 0)
      errors.push("Cart is empty");
    if (mandate.total_price <= 0) errors.push("Invalid total_price");
    if (!mandate.merchant_signature)
      errors.push("Missing merchant_signature");

    // In production, validate actual cryptographic signature
    if (mandate.merchant_signature && !mandate.merchant_signature.startsWith("sig_"))
      errors.push("Invalid signature format");

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates a PaymentMandate
   */
  static validatePaymentMandate(mandate: PaymentMandate): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!mandate.mandate_id) errors.push("Missing mandate_id");
    if (!mandate.cart_id) errors.push("Missing cart_id");
    if (mandate.amount <= 0) errors.push("Invalid amount");
    if (!mandate.payment_token) errors.push("Missing payment_token");
    if (!mandate.user_signature) errors.push("Missing user_signature");

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates an IntentMandate
   */
  static validateIntentMandate(mandate: IntentMandate): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!mandate.intent_id) errors.push("Missing intent_id");
    if (!mandate.user_intent || mandate.user_intent.length === 0)
      errors.push("Invalid user_intent");
    if (mandate.budget_limit && mandate.budget_limit <= 0)
      errors.push("Invalid budget_limit");

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// ============================================================
// A2A MESSAGE BUILDERS & HANDLERS
// ============================================================

export class A2AMessageBuilder {
  /**
   * Builds an A2A message with mandate data parts
   * This is what agents send to each other over HTTP with the
   * X-A2A-Extensions header
   */
  static buildMessage(
    fromAgent: string,
    toAgent: string,
    textContent: string,
    mandate?: CartMandate | PaymentMandate | IntentMandate
  ): A2AMessage {
    const parts: A2APart[] = [
      {
        root: { text: textContent },
      },
    ];

    if (mandate) {
      parts.push({
        data: {
          mimeType: this.getMimeTypeForMandate(mandate),
          data: mandate,
        },
      });
    }

    return {
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      fromAgent,
      toAgent,
      parts,
      extensionsRequired: ["https://github.com/google-agentic-commerce/ap2/v1"],
    };
  }

  private static getMimeTypeForMandate(mandate: any): string {
    if ("cart_id" in mandate && "merchant_id" in mandate) {
      return "application/vnd.ap2.cartmandate+json";
    } else if ("mandate_id" in mandate && "payment_token" in mandate) {
      return "application/vnd.ap2.paymentmandate+json";
    } else if ("user_intent" in mandate) {
      return "application/vnd.ap2.intentmandate+json";
    }
    return "application/json";
  }
}

// ============================================================
// EXTENSION VALIDATION
// ============================================================

export const AP2_EXTENSION_URI =
  "https://github.com/google-agentic-commerce/ap2/v1";
export const CARD_NETWORK_EXTENSION_URI =
  "https://sample-card-network.github.io/paymentmethod/types/v1";

export class ExtensionValidator {
  static requiredExtensions = [AP2_EXTENSION_URI, CARD_NETWORK_EXTENSION_URI];

  /**
   * Validates that an agent supports required AP2 extensions
   */
  static validateAgentExtensions(agentCard: AP2AgentCard): {
    supported: boolean;
    missing: string[];
  } {
    const supportedUris = agentCard.capabilities.extensions.map(
      (ext) => ext.uri
    );
    const missing = this.requiredExtensions.filter(
      (uri) => !supportedUris.includes(uri)
    );

    return {
      supported: missing.length === 0,
      missing,
    };
  }

  /**
   * Builds HTTP headers for A2A requests with extension requirements
   */
  static buildA2AHeaders(): Record<string, string> {
    return {
      "X-A2A-Extensions": this.requiredExtensions.join(","),
      "Content-Type": "application/json",
    };
  }
}

// ============================================================
// VERBOSE MODE UTILITIES
// ============================================================

export interface VerboseLog {
  timestamp: string;
  stage: string;
  description: string;
  agent: string;
  payload?: any;
  nextAction?: string;
}

export class VerboseLogger {
  private logs: VerboseLog[] = [];

  log(
    stage: string,
    description: string,
    agent: string,
    payload?: any,
    nextAction?: string
  ): void {
    this.logs.push({
      timestamp: new Date().toISOString(),
      stage,
      description,
      agent,
      payload,
      nextAction,
    });
  }

  getLogs(): VerboseLog[] {
    return this.logs;
  }

  getFormattedOutput(): string {
    return this.logs
      .map(
        (log) =>
          `[${log.timestamp}] [${log.stage}] [${log.agent}]\n` +
          `  ${log.description}\n` +
          (log.nextAction ? `  → Next: ${log.nextAction}\n` : "") +
          (log.payload ? `  Payload: ${JSON.stringify(log.payload, null, 2)}\n` : "")
      )
      .join("\n");
  }

  clear(): void {
    this.logs = [];
  }
}

// ============================================================
// KEY AGENT DEFINITIONS (From Protocol Sample)
// ============================================================

export const KNOWN_AGENTS: AgentRegistry = {
  shopping_agent: {
    name: "Shopping Agent",
    baseUrl: "http://localhost:8000",
    requiredExtensions: [AP2_EXTENSION_URI, CARD_NETWORK_EXTENSION_URI],
  },
  merchant_agent: {
    name: "Merchant Agent",
    baseUrl: "http://localhost:8001/a2a/merchant_agent",
    requiredExtensions: [AP2_EXTENSION_URI, CARD_NETWORK_EXTENSION_URI],
  },
  credentials_provider: {
    name: "Credentials Provider Agent",
    baseUrl: "http://localhost:8002/a2a/credentials_provider",
    requiredExtensions: [AP2_EXTENSION_URI, CARD_NETWORK_EXTENSION_URI],
  },
  merchant_payment_processor: {
    name: "Merchant Payment Processor Agent",
    baseUrl: "http://localhost:8003/a2a/merchant_payment_processor_agent",
    requiredExtensions: [AP2_EXTENSION_URI, CARD_NETWORK_EXTENSION_URI],
  },
};

/**
 * Maps agent roles to their responsibilities in the AP2 flow
 */
export const AGENT_RESPONSIBILITIES = {
  shopping_agent: {
    description: "Main orchestrator for the shopping flow",
    responsibilities: [
      "Engage with user for shopping intent",
      "Delegate to merchant agent for product discovery",
      "Collect shipping address",
      "Collect payment method selection",
      "Create and sign PaymentMandate",
      "Initiate payment with processor",
      "Handle OTP challenges",
    ],
  },
  merchant_agent: {
    description: "Product catalog and cart management",
    responsibilities: [
      "Search product catalog",
      "Create and sign CartMandate",
      "Validate shopping agent identity",
      "Update cart with new shipping address",
    ],
  },
  credentials_provider: {
    description: "User's payment methods and wallet",
    responsibilities: [
      "Provide list of eligible payment methods",
      "Tokenize payment cards",
      "Verify payment tokens",
      "Provide shipping address",
      "Handle payment credential delivery to processor",
    ],
  },
  merchant_payment_processor: {
    description: "Payment processing and OTP challenges",
    responsibilities: [
      "Verify payment mandates",
      "Initiate payment transactions",
      "Request OTP challenges for step-up authentication",
      "Coordinate with credentials provider for credentials",
      "Return payment results and receipts",
    ],
  },
};

// ============================================================
// TRANSACTION STATE MACHINE
// ============================================================

export enum TransactionState {
  IDLE = "IDLE",
  INTENT_CREATED = "INTENT_CREATED",
  SEARCHING_PRODUCTS = "SEARCHING_PRODUCTS",
  CART_MANDATE_RECEIVED = "CART_MANDATE_RECEIVED",
  SHIPPING_ADDRESS_COLLECTED = "SHIPPING_ADDRESS_COLLECTED",
  CART_UPDATED = "CART_UPDATED",
  PAYMENT_METHOD_SELECTED = "PAYMENT_METHOD_SELECTED",
  PAYMENT_MANDATE_CREATED = "PAYMENT_MANDATE_CREATED",
  PAYMENT_MANDATE_SIGNED = "PAYMENT_MANDATE_SIGNED",
  PAYMENT_SENT_TO_PROCESSOR = "PAYMENT_SENT_TO_PROCESSOR",
  OTP_CHALLENGE_REQUIRED = "OTP_CHALLENGE_REQUIRED",
  OTP_VERIFIED = "OTP_VERIFIED",
  PAYMENT_SUCCESSFUL = "PAYMENT_SUCCESSFUL",
  PAYMENT_FAILED = "PAYMENT_FAILED",
}
