# auth/dependencies.py
import os
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt  # or jose.jwt if you're using `python-jose`

# Adjust according to your token setup (Supabase, Clerk, custom)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
print("🚀 ~ file: dependencies.py ~ line 9 ~ oauth2_scheme", oauth2_scheme )

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET") 
JWT_ALG = "HS256"

def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=[JWT_ALG] , audience="authenticated")
        user_id: str = payload.get("sub")  # Supabase uses "sub"
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: Missing user_id")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
