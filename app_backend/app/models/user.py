from pydantic import BaseModel

class UserSignup(BaseModel):
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserVerify(BaseModel):
    email: str
    code: str
