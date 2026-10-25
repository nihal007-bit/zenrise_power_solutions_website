"""Zenrise local API. Run schema.sql and setup_admin.py before serving."""

from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path
import os
import re
import secrets
from typing import Literal

import jwt
import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, field_validator
from pwdlib import PasswordHash


load_dotenv(Path(__file__).with_name(".env"))

app = FastAPI(title="Zenrise Power Solutions API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,"
            "http://localhost:5174,http://127.0.0.1:5174",
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

password_hash = PasswordHash.recommended()
bearer = HTTPBearer(auto_error=False)


def db():
    password = os.getenv("DB_PASSWORD")
    if not password:
        raise RuntimeError("DB_PASSWORD is missing from backend/.env")
    return psycopg.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        dbname=os.getenv("DB_NAME", "zenrise_db"),
        user=os.getenv("DB_USER", "zenrise_app"),
        password=password,
        row_factory=dict_row,
    )


def admin_config():
    username = os.getenv("ADMIN_USERNAME")
    hashed = os.getenv("ADMIN_PASSWORD_HASH")
    secret = os.getenv("JWT_SECRET")
    if not username or not hashed or not secret:
        raise HTTPException(
            status_code=503,
            detail="Admin login is not configured. Run setup_admin.py.",
        )
    return username, hashed, secret


def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
):
    username, _, secret = admin_config()
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Admin login required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(
            credentials.credentials,
            secret,
            algorithms=["HS256"],
            audience="zenrise-admin",
            issuer="zenrise-api",
            options={"require": ["sub", "exp", "iat", "aud", "iss"]},
        )
    except jwt.InvalidTokenError as error:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired login",
            headers={"WWW-Authenticate": "Bearer"},
        ) from error
    if not secrets.compare_digest(str(payload["sub"]), username):
        raise HTTPException(status_code=401, detail="Invalid admin login")
    return username


class LoginInput(BaseModel):
    username: str
    password: str


class ContactInput(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    phone: str
    email: str = Field(default="", max_length=254)
    product: str = Field(default="", max_length=100)

    @field_validator("name")
    @classmethod
    def tidy_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name is required")
        return value

    @field_validator("phone", mode="before")
    @classmethod
    def tidy_phone(cls, value: str) -> str:
        if not isinstance(value, str):
            raise ValueError("Contact number must be text")
        numbers = re.sub(r"\D", "", value)
        if len(numbers) == 12 and numbers.startswith("91"):
            numbers = numbers[2:]
        if len(numbers) != 10:
            raise ValueError("Enter a 10-digit contact number")
        return numbers


class CustomerInput(ContactInput):
    location: str = Field(default="", max_length=200)
    notes: str = Field(default="", max_length=5000)


class EnquiryInput(ContactInput):
    message: str = Field(default="", max_length=5000)


class EnquiryStatusInput(BaseModel):
    status: Literal["New", "In Progress", "Closed"]


class ServiceRequestInput(BaseModel):
    customerId: int = Field(gt=0)
    product: str = Field(default="", max_length=100)
    issue: str = Field(min_length=1, max_length=5000)

    @field_validator("issue")
    @classmethod
    def tidy_issue(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Request details are required")
        return value


class ServiceStatusInput(BaseModel):
    status: Literal["Open", "In Progress", "Resolved"]


CUSTOMER_COLUMNS = """
    id, name, phone, COALESCE(email, '') AS email,
    COALESCE(location, '') AS location, COALESCE(product, '') AS product,
    COALESCE(notes, '') AS notes, created_at AS "createdAt",
    updated_at AS "updatedAt"
"""
ENQUIRY_COLUMNS = """
    id, name, phone, COALESCE(email, '') AS email,
    COALESCE(product, '') AS product, COALESCE(message, '') AS message,
    status, customer_id AS "customerId", created_at AS "createdAt"
"""
SERVICE_COLUMNS = """
    id, customer_id AS "customerId", COALESCE(product, '') AS product,
    issue, status, created_at AS "createdAt"
"""


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/enquiries", status_code=status.HTTP_201_CREATED)
def submit_enquiry(item: EnquiryInput):
    """Public contact form: a submission is an enquiry, not yet a customer."""
    with db() as connection:
        row = connection.execute(
            """
            INSERT INTO enquiries (name, phone, email, product, message)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, status, created_at AS "createdAt"
            """,
            (item.name, item.phone, item.email, item.product, item.message),
        ).fetchone()
    return row


@app.post("/api/admin/login")
def admin_login(item: LoginInput):
    username, stored_hash, secret = admin_config()
    try:
        valid_password = password_hash.verify(item.password, stored_hash)
    except (TypeError, ValueError):
        valid_password = False
    if not (
        secrets.compare_digest(item.username, username) and valid_password
    ):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    now = datetime.now(timezone.utc)
    token = jwt.encode(
        {
            "sub": username,
            "iss": "zenrise-api",
            "aud": "zenrise-admin",
            "iat": now,
            "exp": now + timedelta(hours=1),
        },
        secret,
        algorithm="HS256",
    )
    return {"access_token": token, "token_type": "bearer", "expires_in": 3600}


# Every route on this router requires a valid admin bearer token.
admin = APIRouter(prefix="/api/admin", dependencies=[Depends(require_admin)])


@admin.get("/me")
def admin_profile():
    return {"username": os.getenv("ADMIN_USERNAME", "admin")}


@admin.get("/customers")
def list_customers():
    with db() as connection:
        return connection.execute(
            f"SELECT {CUSTOMER_COLUMNS} FROM customers ORDER BY id DESC"
        ).fetchall()


@admin.get("/customers/count")
def customer_count():
    with db() as connection:
        return {"count": connection.execute("SELECT count(*) AS n FROM customers").fetchone()["n"]}


@admin.get("/customers/{customer_id}")
def get_customer(customer_id: int):
    with db() as connection:
        row = connection.execute(
            f"SELECT {CUSTOMER_COLUMNS} FROM customers WHERE id = %s",
            (customer_id,),
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return row


@admin.post("/customers", status_code=status.HTTP_201_CREATED)
def create_customer(item: CustomerInput):
    try:
        with db() as connection:
            new_id = connection.execute(
                """
                INSERT INTO customers (name, phone, email, location, product, notes)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (item.name, item.phone, item.email, item.location, item.product, item.notes),
            ).fetchone()["id"]
            row = connection.execute(
                f"SELECT {CUSTOMER_COLUMNS} FROM customers WHERE id = %s",
                (new_id,),
            ).fetchone()
    except psycopg.errors.UniqueViolation as error:
        raise HTTPException(status_code=409, detail="Contact number already exists") from error
    return row


@admin.put("/customers/{customer_id}")
def update_customer(customer_id: int, item: CustomerInput):
    try:
        with db() as connection:
            row = connection.execute(
                """
                UPDATE customers
                SET name = %s, phone = %s, email = %s, location = %s,
                    product = %s, notes = %s, updated_at = now()
                WHERE id = %s
                RETURNING id
                """,
                (
                    item.name, item.phone, item.email, item.location,
                    item.product, item.notes, customer_id,
                ),
            ).fetchone()
            if row:
                row = connection.execute(
                    f"SELECT {CUSTOMER_COLUMNS} FROM customers WHERE id = %s",
                    (customer_id,),
                ).fetchone()
    except psycopg.errors.UniqueViolation as error:
        raise HTTPException(status_code=409, detail="Contact number already exists") from error
    if row is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return row


@admin.delete("/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int):
    with db() as connection:
        row = connection.execute(
            "DELETE FROM customers WHERE id = %s RETURNING id",
            (customer_id,),
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Customer not found")


@admin.get("/enquiries")
def list_enquiries():
    with db() as connection:
        return connection.execute(
            f"SELECT {ENQUIRY_COLUMNS} FROM enquiries ORDER BY id DESC"
        ).fetchall()


@admin.patch("/enquiries/{enquiry_id}/status")
def update_enquiry_status(enquiry_id: int, item: EnquiryStatusInput):
    with db() as connection:
        row = connection.execute(
            "UPDATE enquiries SET status = %s WHERE id = %s RETURNING id",
            (item.status, enquiry_id),
        ).fetchone()
        if row:
            row = connection.execute(
                f"SELECT {ENQUIRY_COLUMNS} FROM enquiries WHERE id = %s",
                (enquiry_id,),
            ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    return row


@admin.post("/enquiries/{enquiry_id}/convert")
def convert_enquiry(enquiry_id: int):
    """Link to an existing phone, or create one customer, in one transaction."""
    with db() as connection:
        enquiry = connection.execute(
            "SELECT * FROM enquiries WHERE id = %s FOR UPDATE",
            (enquiry_id,),
        ).fetchone()
        if enquiry is None:
            raise HTTPException(status_code=404, detail="Enquiry not found")
        customer_id = enquiry["customer_id"]
        if customer_id is None:
            existing = connection.execute(
                "SELECT id FROM customers WHERE phone = %s",
                (enquiry["phone"],),
            ).fetchone()
            if existing:
                customer_id = existing["id"]
            else:
                inserted = connection.execute(
                    """
                    INSERT INTO customers (name, phone, email, product, notes)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (phone) DO NOTHING
                    RETURNING id
                    """,
                    (
                        enquiry["name"], enquiry["phone"], enquiry["email"],
                        enquiry["product"], enquiry["message"],
                    ),
                ).fetchone()
                if inserted:
                    customer_id = inserted["id"]
                else:
                    customer_id = connection.execute(
                        "SELECT id FROM customers WHERE phone = %s",
                        (enquiry["phone"],),
                    ).fetchone()["id"]
        connection.execute(
            """
            UPDATE enquiries SET customer_id = %s, status = 'In Progress'
            WHERE id = %s
            """,
            (customer_id, enquiry_id),
        )
        return connection.execute(
            f"SELECT {ENQUIRY_COLUMNS} FROM enquiries WHERE id = %s",
            (enquiry_id,),
        ).fetchone()


@admin.get("/service-requests")
def list_service_requests():
    with db() as connection:
        return connection.execute(
            f"SELECT {SERVICE_COLUMNS} FROM service_requests ORDER BY id DESC"
        ).fetchall()


@admin.post("/service-requests", status_code=status.HTTP_201_CREATED)
def create_service_request(item: ServiceRequestInput):
    try:
        with db() as connection:
            new_id = connection.execute(
                """
                INSERT INTO service_requests (customer_id, product, issue)
                VALUES (%s, %s, %s) RETURNING id
                """,
                (item.customerId, item.product, item.issue),
            ).fetchone()["id"]
            row = connection.execute(
                f"SELECT {SERVICE_COLUMNS} FROM service_requests WHERE id = %s",
                (new_id,),
            ).fetchone()
    except psycopg.errors.ForeignKeyViolation as error:
        raise HTTPException(status_code=404, detail="Customer not found") from error
    return row


@admin.patch("/service-requests/{request_id}/status")
def update_service_status(request_id: int, item: ServiceStatusInput):
    with db() as connection:
        row = connection.execute(
            "UPDATE service_requests SET status = %s WHERE id = %s RETURNING id",
            (item.status, request_id),
        ).fetchone()
        if row:
            row = connection.execute(
                f"SELECT {SERVICE_COLUMNS} FROM service_requests WHERE id = %s",
                (request_id,),
            ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Service request not found")
    return row


@admin.delete("/service-requests/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service_request(request_id: int):
    with db() as connection:
        row = connection.execute(
            "DELETE FROM service_requests WHERE id = %s RETURNING id",
            (request_id,),
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Service request not found")


@admin.get("/analytics")
def analytics():
    with db() as connection:
        customers = connection.execute(
            """
            SELECT count(*) AS total,
                   count(*) FILTER (
                       WHERE created_at >= date_trunc('month', now())
                   ) AS new_this_month
            FROM customers
            """
        ).fetchone()
        enquiries = connection.execute(
            "SELECT count(*) AS total FROM enquiries"
        ).fetchone()["total"]
        repeat = connection.execute(
            """
            SELECT count(*) AS total FROM (
                SELECT phone FROM enquiries GROUP BY phone HAVING count(*) > 1
            ) repeated
            """
        ).fetchone()["total"]
        converted = connection.execute(
            """
            SELECT count(*) AS total FROM enquiries e
            WHERE e.customer_id IS NOT NULL OR EXISTS (
                SELECT 1 FROM customers c WHERE c.phone = e.phone
            )
            """
        ).fetchone()["total"]
        open_requests = connection.execute(
            "SELECT count(*) AS total FROM service_requests WHERE status <> 'Resolved'"
        ).fetchone()["total"]
        product_rows = connection.execute(
            """
            SELECT product, count(*) AS total FROM (
                SELECT product FROM customers
                UNION ALL
                SELECT product FROM enquiries
            ) interests
            WHERE product IS NOT NULL AND product <> ''
            GROUP BY product ORDER BY total DESC, product
            """
        ).fetchall()
        status_rows = connection.execute(
            "SELECT status, count(*) AS total FROM enquiries GROUP BY status"
        ).fetchall()
        month_rows = connection.execute(
            """
            SELECT to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM') AS month,
                   count(*) AS total
            FROM enquiries GROUP BY month
            """
        ).fetchall()

    status_counts = {"New": 0, "In Progress": 0, "Closed": 0}
    status_counts.update({row["status"]: row["total"] for row in status_rows})
    month_counts = Counter({row["month"]: row["total"] for row in month_rows})
    now = datetime.now(timezone.utc)
    monthly = []
    for offset in range(5, -1, -1):
        index = now.year * 12 + now.month - 1 - offset
        key = f"{index // 12:04d}-{index % 12 + 1:02d}"
        monthly.append({"month": key, "count": month_counts[key]})
    return {
        "totalCustomers": customers["total"],
        "newThisMonth": customers["new_this_month"],
        "totalEnquiries": enquiries,
        "repeatEnquirers": repeat,
        "convertedEnquiries": converted,
        "conversionRate": round(100 * converted / enquiries) if enquiries else 0,
        "openServiceRequests": open_requests,
        "productInterest": [
            {"product": row["product"], "count": row["total"]}
            for row in product_rows
        ],
        "enquiryStatus": status_counts,
        "monthlyEnquiries": monthly,
    }


app.include_router(admin)
