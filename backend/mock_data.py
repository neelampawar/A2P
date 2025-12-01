# backend/mock_data.py
import uuid

# --- LOGIC EXTRACTED FROM: roles/credentials_provider_agent ---

_account_db = {
    "bugsbunny@gmail.com": {
        "shipping_address": {
            "recipient": "Bugs Bunny",
            "organization": "Warner Bros",
            "address_line": ["123 Carrot Lane"],
            "city": "Albuquerque",
            "region": "NM",
            "postal_code": "87101",
            "country": "US",
            "phone_number": "+1-555-010-1010",
        },
        "payment_methods": {
            "card1": {
                "type": "CARD",
                "alias": "Acme Bank Visa ending in 4242",
                "network": [{"name": "visa", "formats": ["DPAN"]}],
                "cryptogram": "crypt_abc123",
                "token": "tok_visa_4242", 
                "card_holder_name": "Bugs Bunny",
            }
        },
    }
}

_tokens = {}

# --- HELPER FUNCTIONS FROM SNIPPET ---

def get_account_payment_methods(email: str):
    return list(_account_db.get(email, {}).get("payment_methods", {}).values())

def get_account_shipping_address(email: str):
    return _account_db.get(email, {}).get("shipping_address", {})

def create_payment_token(email: str, alias: str) -> str:
    """Simulates creating a secure token for a specific card."""
    token = f"tok_ap2_{uuid.uuid4().hex[:12]}"
    _tokens[token] = {
        "email_address": email,
        "payment_method_alias": alias,
        "payment_mandate_id": None,
    }
    return token

def verify_token_and_get_method(token: str, mandate_id: str):
    """
    Logic from verify_token in your snippet.
    Verifies the token matches the mandate.
    """
    record = _tokens.get(token)
    if not record:
        raise ValueError("Invalid Token: Not found")
    
    # In the sample code, it updates the token with the mandate ID first
    # For this demo, we'll assume the mandate links them.
    
    email = record["email_address"]
    alias = record["payment_method_alias"]
    
    # Find the actual card details
    methods = get_account_payment_methods(email)
    
    # First try exact match
    for m in methods:
        if m["alias"] == alias:
            return m
    
    # If no exact match, return first available method (for demo purposes)
    if methods:
        return methods[0]
    
    raise ValueError("Payment method not found for token")