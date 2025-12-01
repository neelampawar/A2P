/**
 * AP2 Quick Reference Guide & Examples
 * 
 * This file provides practical examples for using the AP2 protocol
 * in your application.
 */

// ============================================================
// EXAMPLE 1: Basic Payment Transaction
// ============================================================

/*
import { executeAP2Transaction } from './services/paymentService';

async function simplePayment() {
  const cartItems = [
    { name: "Coffee Maker", quantity: 1 },
    { name: "Coffee Beans", quantity: 2 }
  ];

  const success = await executeAP2Transaction(
    cartItems,
    "bugsbunny@gmail.com",
    "Acme Bank Visa ending in 4242",
    (step, log) => console.log(`${step}: ${log}`)
  );

  return success;
}
*/

// ============================================================
// EXAMPLE 2: Payment with Verbose Logging
// ============================================================

/*
import { 
  executeAP2Transaction, 
  getVerboseLogs,
  getFormattedVerboseOutput 
} from './services/paymentService';

async function paymentWithDebug() {
  const logs: string[] = [];

  const success = await executeAP2Transaction(
    [{ name: "Item", quantity: 1 }],
    "bugsbunny@gmail.com",
    "Acme Bank Visa ending in 4242",
    (step, log) => {
      logs.push(`[${step}] ${log}`);
      console.log(`[${step}] ${log}`);
    },
    { verboseMode: true }  // Enable verbose mode
  );

  // After transaction, inspect all mandates
  const verboseLogs = getVerboseLogs();
  
  verboseLogs.forEach(log => {
    console.log('\n=== VERBOSE LOG ===');
    console.log(`Stage: ${log.stage}`);
    console.log(`Agent: ${log.agent}`);
    console.log(`Description: ${log.description}`);
    
    if (log.payload) {
      console.log('Payload:');
      console.log(JSON.stringify(log.payload, null, 2));
    }
    
    if (log.nextAction) {
      console.log(`Next: ${log.nextAction}`);
    }
  });

  return success;
}
*/

// ============================================================
// EXAMPLE 3: React Component with Full AP2 Integration
// ============================================================

/*
import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { executeAP2Transaction, getVerboseLogs } from '../services/paymentService';
import { PaymentStep } from '../types';

const AdvancedCheckout: React.FC = () => {
  const { items, totalAmount } = useCart();
  const [status, setStatus] = useState<PaymentStep>(PaymentStep.IDLE);
  const [logs, setLogs] = useState<string[]>([]);
  const [verboseMode, setVerboseMode] = useState(false);
  const [showMandateViewer, setShowMandateViewer] = useState(false);

  const handlePayment = async () => {
    setStatus(PaymentStep.IDENTIFYING);
    setLogs([]);

    const success = await executeAP2Transaction(
      items.map(i => ({ name: i.name, quantity: i.quantity })),
      "bugsbunny@gmail.com",
      "Acme Bank Visa ending in 4242",
      (step, log) => {
        setStatus(step);
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`]);
      },
      { verboseMode }
    );

    if (success) {
      // Show receipt
    }
  };

  const handleViewMandates = () => {
    const logs = getVerboseLogs();
    
    // Extract mandates from logs
    const cartMandates = logs
      .filter(l => l.payload?.cart_id && l.payload?.merchant_signature)
      .map(l => l.payload);
    
    const paymentMandates = logs
      .filter(l => l.payload?.mandate_id && l.payload?.payment_token)
      .map(l => l.payload);

    console.log('CartMandates:', cartMandates);
    console.log('PaymentMandates:', paymentMandates);
  };

  return (
    <div className="p-4">
      <h2>Advanced Checkout</h2>
      
      <label>
        <input
          type="checkbox"
          checked={verboseMode}
          onChange={(e) => setVerboseMode(e.target.checked)}
        />
        Enable Verbose Mode
      </label>

      <button onClick={handlePayment}>
        Pay ${totalAmount.toFixed(2)}
      </button>

      <button onClick={handleViewMandates}>
        View Protocol Mandates
      </button>

      <div className="logs">
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  );
};

export default AdvancedCheckout;
*/

// ============================================================
// EXAMPLE 4: Mandate Building & Validation
// ============================================================

/*
import { 
  MandateBuilder, 
  MandateValidator,
  CartItem 
} from './services/ap2Utils';

// Build a CartMandate
const cartItems: CartItem[] = [
  { product_id: "p1", quantity: 2, price: 5.99, name: "Coffee" },
  { product_id: "p2", quantity: 1, price: 12.99, name: "Beans" }
];

const cartMandate = MandateBuilder.buildCartMandate(
  cartItems,
  "merchant_01",
  18.98  // total
);

console.log("Created CartMandate:", cartMandate);

// Validate CartMandate
const validation = MandateValidator.validateCartMandate(cartMandate);
if (validation.valid) {
  console.log("✓ CartMandate is valid");
} else {
  console.error("✗ Validation errors:", validation.errors);
}

// Build PaymentMandate
const paymentMandate = MandateBuilder.buildPaymentMandate(
  cartMandate.cart_id,
  cartMandate.total_price,
  "tok_ap2_secure"
);

console.log("Created PaymentMandate:", paymentMandate);

// Validate PaymentMandate
const paymentValidation = MandateValidator.validatePaymentMandate(paymentMandate);
if (paymentValidation.valid) {
  console.log("✓ PaymentMandate is valid");
}
*/

// ============================================================
// EXAMPLE 5: Custom Agent Registry
// ============================================================

/*
import { AgentRegistry, KNOWN_AGENTS } from './services/ap2Utils';

// Create custom registry with additional agents
const customRegistry: AgentRegistry = {
  ...KNOWN_AGENTS,
  
  // Add your own agents
  my_custom_agent: {
    name: "My Custom Agent",
    baseUrl: "http://myserver.com/a2a/agent",
    requiredExtensions: [
      "https://github.com/google-agentic-commerce/ap2/v1",
      "https://sample-card-network.github.io/paymentmethod/types/v1"
    ]
  }
};

// Pass to executeAP2Transaction
const success = await executeAP2Transaction(
  items,
  "user@example.com",
  "Card Alias",
  (step, log) => console.log(log),
  { agentRegistry: customRegistry }
);
*/

// ============================================================
// EXAMPLE 6: Handling Different Payment Outcomes
// ============================================================

/*
async function robustPayment() {
  const outcomes: string[] = [];

  const success = await executeAP2Transaction(
    items,
    "bugsbunny@gmail.com",
    "Acme Bank Visa ending in 4242",
    (step, log) => {
      outcomes.push(`[${step}] ${log}`);
      
      // Handle specific steps
      switch(step) {
        case PaymentStep.IDENTIFYING:
          console.log("🔍 Identifying agents...");
          break;
        case PaymentStep.CREATING_INTENT:
          console.log("💳 Creating payment intent...");
          break;
        case PaymentStep.PROCESSING:
          console.log("⏳ Processing payment...");
          break;
        case PaymentStep.SUCCESS:
          console.log("✅ Payment successful!");
          break;
        case PaymentStep.FAILED:
          console.log("❌ Payment failed!");
          break;
      }
    }
  );

  return {
    success,
    outcomes,
    totalSteps: outcomes.length
  };
}
*/

// ============================================================
// EXAMPLE 7: A2A Message Format Reference
// ============================================================

/*
// When agents communicate, they send A2A messages like this:

const a2aMessage = {
  messageId: "msg_123_abc",
  timestamp: "2025-01-15T10:30:00Z",
  fromAgent: "shopping_agent",
  toAgent: "merchant_agent",
  
  // Parts can contain text and data
  parts: [
    {
      root: {
        text: "Please create a cart for these items"
      }
    },
    {
      data: {
        mimeType: "application/vnd.ap2.intentmandate+json",
        data: {
          intent_id: "intent_123",
          user_intent: "Buy coffee supplies",
          budget_limit: 50,
          currency: "USD"
        }
      }
    }
  ],
  
  // These extensions are required
  extensionsRequired: [
    "https://github.com/google-agentic-commerce/ap2/v1",
    "https://sample-card-network.github.io/paymentmethod/types/v1"
  ]
};

// In HTTP headers:
// X-A2A-Extensions: https://github.com/google-agentic-commerce/ap2/v1,https://sample-card-network.github.io/paymentmethod/types/v1
*/

// ============================================================
// EXAMPLE 8: Transaction State Transitions
// ============================================================

/*
import { TransactionState } from './services/ap2Utils';

// The transaction moves through these states:
//
// IDLE
//   ↓
// INTENT_CREATED (User's shopping intent)
//   ↓
// SEARCHING_PRODUCTS (Merchant Agent searching)
//   ↓
// CART_MANDATE_RECEIVED (Merchant's signed offer)
//   ↓
// SHIPPING_ADDRESS_COLLECTED (User's delivery address)
//   ↓
// CART_UPDATED (New CartMandate with shipping)
//   ↓
// PAYMENT_METHOD_SELECTED (From Credentials Provider)
//   ↓
// PAYMENT_MANDATE_CREATED (Shopping Agent creates PaymentMandate)
//   ↓
// PAYMENT_MANDATE_SIGNED (User's biometric signature)
//   ↓
// PAYMENT_SENT_TO_PROCESSOR (PaymentMandate → Processor)
//   ↓
// OTP_CHALLENGE_REQUIRED (Optional: User provides OTP)
//   ↓
// OTP_VERIFIED (OTP valid)
//   ↓
// PAYMENT_SUCCESSFUL (Receipt received)
//
// OR at any point:
// PAYMENT_FAILED (Error occurred)

function logStateTransition(from: TransactionState, to: TransactionState) {
  console.log(`State: ${from} → ${to}`);
}
*/

// ============================================================
// EXAMPLE 9: Mandate Inspection for Debugging
// ============================================================

/*
function inspectTransaction(verboseLogs: VerboseLog[]) {
  // Find CartMandates
  const cartMandate = verboseLogs
    .find(l => l.payload?.cart_id && l.payload?.merchant_signature)
    ?.payload;

  console.log('=== CART MANDATE ===');
  console.log('Cart ID:', cartMandate?.cart_id);
  console.log('Items:', cartMandate?.items?.length);
  console.log('Total:', cartMandate?.total_price);
  console.log('Valid for (seconds):', cartMandate?.valid_for_seconds);
  console.log('Merchant Signature:', cartMandate?.merchant_signature);
  console.log('Created:', cartMandate?.created_at);

  // Find PaymentMandates
  const paymentMandate = verboseLogs
    .find(l => l.payload?.mandate_id && l.payload?.payment_token)
    ?.payload;

  console.log('\n=== PAYMENT MANDATE ===');
  console.log('Mandate ID:', paymentMandate?.mandate_id);
  console.log('Cart ID:', paymentMandate?.cart_id);
  console.log('Amount:', paymentMandate?.amount);
  console.log('Token:', paymentMandate?.payment_token?.substring(0, 20) + '...');
  console.log('User Signature:', paymentMandate?.user_signature);
  console.log('Created:', paymentMandate?.created_at);

  // Trace all agent communications
  console.log('\n=== AGENT COMMUNICATION TRACE ===');
  verboseLogs.forEach((log, idx) => {
    console.log(`${idx + 1}. [${log.stage}] ${log.agent}`);
    console.log(`   ${log.description}`);
    if (log.nextAction) {
      console.log(`   → ${log.nextAction}`);
    }
  });
}
*/

// ============================================================
// EXAMPLE 10: Error Handling & Recovery
// ============================================================

/*
async function safePayment(
  items: any[],
  email: string,
  card: string,
  retries = 3
) {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${retries}`);

      const success = await executeAP2Transaction(
        items,
        email,
        card,
        (step, log) => {
          if (step === PaymentStep.FAILED) {
            lastError = new Error(log);
          }
        }
      );

      if (success) {
        return { success: true, attempt };
      }

    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, lastError.message);

      if (attempt < retries) {
        // Wait before retry with exponential backoff
        const waitTime = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  return {
    success: false,
    lastError: lastError?.message,
    attempts: retries
  };
}

// Usage:
const result = await safePayment(items, email, card);
if (!result.success) {
  console.error(`Payment failed after ${result.attempts} attempts:`, result.lastError);
}
*/

// ============================================================
// EXPORT SUMMARY
// ============================================================

/*
Key functions to import:

From paymentService.ts:
  - executeAP2Transaction()     // Main payment function
  - getVerboseLogs()             // Get detailed transaction logs
  - getFormattedVerboseOutput()  // Get formatted output
  - clearVerboseLogs()           // Clear logs

From ap2Utils.ts:
  - MandateBuilder              // Create mandates
  - MandateValidator            // Validate mandates
  - A2AMessageBuilder           // Build A2A messages
  - ExtensionValidator          // Validate extensions
  - VerboseLogger               // Log verbose info
  - KNOWN_AGENTS                // Agent registry
  - TransactionState            // State enum

Example payment:
  const success = await executeAP2Transaction(
    items,
    "bugsbunny@gmail.com",
    "Acme Bank Visa ending in 4242",
    (step, log) => console.log(log),
    { verboseMode: true }
  );

When verboseMode is true:
  - All 7 transaction phases are logged
  - Each agent's actions are documented
  - All mandate objects are captured
  - Use getVerboseLogs() to inspect later
  - Check mandate signatures & structure
*/

export {};
