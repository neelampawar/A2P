# backend/models.py
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class Product(BaseModel):
    id: str
    name: str
    price: float
    description: str
    quantity_text: Optional[str] = "N/A"

class CartItem(BaseModel):
    product_id: str
    quantity: int
    price: float

# --- MANDATES ---

class CartMandate(BaseModel):
    cart_id: str
    merchant_id: str
    items: List[CartItem]
    total_price: float
    currency: str = "INR"
    # Logic from Merchant Agent: The merchant signs this
    merchant_signature: str 

class PaymentMandate(BaseModel):
    mandate_id: str
    cart_id: str
    amount: float
    currency: str = "INR"
    payment_token: str
    # Logic from Root Agent: The user signs this
    user_signature: str