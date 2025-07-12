from fastapi import Depends, HTTPException, Header
import jwt
import requests
from jose import jwt, JWTError, ExpiredSignatureError
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")  
SUPABASE_PROJECT_ID = os.getenv("SUPABASE_PROJECT_ID")  
JWT_ALG = "HS256"

if not SUPABASE_JWT_SECRET or not SUPABASE_PROJECT_ID:
    raise RuntimeError("SUPABASE_JWT_SECRET and SUPABASE_PROJECT_ID environment variables must be set")

def verify_token(authorization: str = Header(...)):
    """
    Verifies a Supabase access token sent in the Authorization header.
    """

    
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(status_code=500, detail="JWT secret is not configured")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.replace("Bearer ", "")
    print(f"Received token: {token}")
    print(f"Using secret: {SUPABASE_JWT_SECRET}")

    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=[JWT_ALG] , audience="authenticated")
        return payload
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

