# backend/main.py
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
from typing import Optional

from models import CartMandate, PaymentMandate, CartItem, Product
import mock_data

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class CartItemRequest(BaseModel):
    name: str
    quantity: int

class CreateCartRequest(BaseModel):
    items: list[CartItemRequest]

# --- MOCK CATALOG (Merchant Logic) ---
PRODUCTS = [
    Product(id="p1", name="Fresh Tomato Hybrid", price=38.00, description="Fresh hybrid tomatoes", quantity_text="500g"),
    Product(id="p2", name="Red Onion", price=45.00, description="Fresh red onions", quantity_text="1kg"),
    Product(id="p3", name="Potato (New Crop)", price=32.00, description="Fresh potatoes", quantity_text="1kg"),
    Product(id="p4", name="Amul Taaza Milk", price=27.00, description="Fresh milk", quantity_text="500ml"),
    Product(id="p5", name="Organic Carrots", price=45.00, description="Fresh carrots", quantity_text="500g"),
    Product(id="p6", name="Brown Bread", price=50.00, description="Whole wheat bread", quantity_text="400g"),
    Product(id="p7", name="Salted Butter", price=58.00, description="Pure butter", quantity_text="100g"),
    Product(id="p8", name="Lays India's Magic Masala", price=20.00, description="Flavored chips", quantity_text="50g"),
    Product(id="p9", name="Doritos Cheese", price=50.00, description="Cheese flavored chips", quantity_text="100g"),
    Product(id="p10", name="Coca Cola", price=40.00, description="Cold beverage", quantity_text="750ml"),
    Product(id="p11", name="Real Mixed Fruit Juice", price=110.00, description="Mixed fruit juice", quantity_text="1L"),
    Product(id="p12", name="Maggi 2-Minute Noodles", price=14.00, description="Quick noodles", quantity_text="70g"),
    Product(id="p13", name="Kissan Ketchup", price=120.00, description="Tomato ketchup", quantity_text="900g"),
    Product(id="p14", name="Acme Anvil", price=50.00, description="Heavy duty", quantity_text="N/A"),
]

# --- IN-MEMORY STATE FOR OTP ---
pending_transactions = {}

# --- IN-MEMORY STATE FOR AGENT LOGS ---
agent_logs = []

class ProductValidationRequest(BaseModel):
    product_name: str

class AgentActionLog(BaseModel):
    action: str
    details: dict
    timestamp: str

# ==========================================
# 0. AGENT COMMUNICATION & VALIDATION
# ==========================================

@app.get("/health")
async def health_check():
    """
    Health check endpoint for backend availability
    """
    return {
        "status": "healthy",
        "service": "Blinkit AP2 Backend",
        "timestamp": str(uuid.uuid4())
    }

@app.get("/merchant/products")
async def list_products():
    """
    Get all available products
    """
    return {
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "price": p.price,
                "description": p.description
            } for p in PRODUCTS
        ],
        "total": len(PRODUCTS)
    }

@app.post("/merchant/validate_product")
async def validate_product(req: ProductValidationRequest):
    """
    Validate if a product exists in the merchant catalog
    """
    product = next((p for p in PRODUCTS if p.name.lower() == req.product_name.lower()), None)
    
    if product:
        return {
            "exists": True,
            "product_id": product.id,
            "name": product.name,
            "price": product.price,
            "description": product.description
        }
    
    return {
        "exists": False,
        "message": f"Product '{req.product_name}' not found in catalog"
    }

@app.post("/merchant/log_agent_action")
async def log_agent_action(log: AgentActionLog):
    """
    Log agent actions for audit trail and debugging
    """
    agent_logs.append({
        "action": log.action,
        "details": log.details,
        "timestamp": log.timestamp
    })
    
    return {
        "status": "logged",
        "total_logs": len(agent_logs)
    }

@app.get("/merchant/agent_logs")
async def get_agent_logs():
    """
    Retrieve all agent logs for debugging
    """
    return {
        "logs": agent_logs,
        "total": len(agent_logs)
    }

# ==========================================
# 1. MERCHANT AGENT LOGIC
# Implements: roles/merchant_agent
# ==========================================

@app.post("/merchant/create_cart")
async def create_cart(
    request: CreateCartRequest,
    shopping_agent_id: str = Header(default="trusted_shopping_agent")
):
    """
    Logic from MerchantAgentExecutor._validate_shopping_agent
    And tools.update_cart
    """
    # 1. Validate Agent (from snippet)
    known_agents = ["trusted_shopping_agent", "demo_frontend"]
    if shopping_agent_id not in known_agents:
        raise HTTPException(status_code=403, detail=f"Unauthorized Shopping Agent: {shopping_agent_id}")

    # 2. Build Cart items
    cart_items = []
    total = 0.0
    
    for item in request.items:
        # Simple lookup
        product = next((p for p in PRODUCTS if p.name in item.name), None)
        if product:
            qty = item.quantity
            total += product.price * qty
            cart_items.append(CartItem(product_id=product.id, quantity=qty, price=product.price))
    
    # 3. Create Signed Mandate
    cart_id = f"cart_{uuid.uuid4().hex[:8]}"
    return CartMandate(
        cart_id=cart_id,
        merchant_id="merchant_agent_01",
        items=cart_items,
        total_price=total,
        merchant_signature=f"sig_merch_{uuid.uuid4().hex[:16]}"
    )

# ==========================================
# 2. CREDENTIALS PROVIDER LOGIC
# Implements: roles/credentials_provider_agent
# ==========================================

@app.get("/wallet/methods")
async def get_methods(user_email: str = "bugsbunny@gmail.com"):
    """Logic from tools.handle_search_payment_methods"""
    return mock_data.get_account_payment_methods(user_email)

@app.get("/wallet/address")
async def get_address(user_email: str = "bugsbunny@gmail.com"):
    """Logic from tools.handle_get_shipping_address"""
    return mock_data.get_account_shipping_address(user_email)

@app.post("/wallet/tokenize")
async def tokenize_card(request: dict):
    """
    Logic from tools.handle_create_payment_credential_token.
    Takes an alias, returns a token.
    """
    token = mock_data.create_payment_token(
        request.get("email", "bugsbunny@gmail.com"), 
        request.get("alias")
    )
    return {"token": token}

# ==========================================
# 3. PAYMENT PROCESSOR LOGIC
# Implements: roles/merchant_payment_processor_agent
# ==========================================

class PaymentRequest(BaseModel):
    payment_mandate: PaymentMandate
    otp: Optional[str] = None

@app.post("/processor/initiate_payment")
async def initiate_payment(req: PaymentRequest):
    """
    Logic from tools.initiate_payment & initiate_payment_with_otp.
    """
    
    # 1. Verify the Token (Credentials Provider Logic invoked by Processor)
    try:
        # In the snippet, the processor talks to credentials provider to verify
        card_details = mock_data.verify_token_and_get_method(
            req.payment_mandate.payment_token, 
            req.payment_mandate.mandate_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 2. Check for OTP Challenge
    # Logic: "The merchant payment processor agent will request an OTP challenge"
    
    transaction_id = req.payment_mandate.mandate_id
    
    # If this is the FIRST request (no OTP provided)
    if not req.otp:
        # Create a pending challenge state
        pending_transactions[transaction_id] = "123456" # Mock correct OTP
        
        return {
            "status": "CHALLENGE_REQUIRED",
            "message": "Step-up authentication required. Please provide OTP.",
            "display_text": "Enter the code sent to your device (Mock: 123456)"
        }

    # 3. Validate OTP
    # Logic from tools.initiate_payment_with_otp
    correct_otp = pending_transactions.get(transaction_id)
    
    if req.otp != correct_otp:
        raise HTTPException(status_code=400, detail="Incorrect OTP provided")
    
    # 4. Success
    del pending_transactions[transaction_id]
    
    return {
        "status": "SUCCESS",
        "receipt": {
            "id": f"rcpt_{uuid.uuid4().hex}",
            "amount": req.payment_mandate.amount,
            "merchant": "Merchant Agent 01",
            "card_brand": card_details['network'][0]['name']
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)