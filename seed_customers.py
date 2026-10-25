"""Add 75 fictional customer records to the local Zenrise PostgreSQL database.

Run from the backend folder with: python seed_customers.py
The script is safe to run again: existing demo phone numbers are skipped.
"""

from datetime import datetime, timedelta, timezone
from pathlib import Path
import os

import psycopg
from dotenv import load_dotenv


load_dotenv(Path(__file__).with_name(".env"))

FIRST_NAMES = [
    "Asha", "Rahul", "Neha", "Arjun", "Meera", "Vivek", "Anjali", "Nikhil",
    "Priya", "Kiran", "Divya", "Rohan", "Sneha", "Aditya", "Lakshmi",
]
LAST_NAMES = ["Nair", "Menon", "Thomas", "Kumar", "Varghese", "Das", "Mathew", "Joseph", "Pillai", "George"]
LOCATIONS = ["Kochi", "Ernakulam", "Aluva", "Thrippunithura", "Kakkanad", "Edappally", "Eroor", "Vyttila"]
PRODUCTS = ["Solar Systems", "Online UPS", "Inverters", "Batteries", "Servo Stabilizers"]


def main():
    if not os.getenv("DB_PASSWORD"):
        raise SystemExit("DB_PASSWORD is missing. Check backend/.env before running this script.")

    inserted = 0
    with psycopg.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        dbname=os.getenv("DB_NAME", "zenrise_db"),
        user=os.getenv("DB_USER", "zenrise_app"),
        password=os.environ["DB_PASSWORD"],
    ) as connection:
        for number in range(1, 76):
            first = FIRST_NAMES[(number - 1) % len(FIRST_NAMES)]
            last = LAST_NAMES[(number - 1) // len(FIRST_NAMES)]
            # All-zero prefixes make these unmistakably fictitious contact numbers.
            phone = f"000000{number:04d}"
            created = datetime.now(timezone.utc) - timedelta(days=(75 - number) * 2)
            cursor = connection.execute(
                """
                INSERT INTO customers (name, phone, email, location, product, notes, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (phone) DO NOTHING
                RETURNING id
                """,
                (
                    f"{first} {last} (Demo)",
                    phone,
                    f"demo{number:03d}@example.com",
                    LOCATIONS[(number - 1) % len(LOCATIONS)],
                    PRODUCTS[(number - 1) % len(PRODUCTS)],
                    "Fictional customer for project testing; do not contact.",
                    created,
                ),
            )
            inserted += cursor.fetchone() is not None

        demo_total = connection.execute(
            "SELECT COUNT(*) FROM customers WHERE phone LIKE '000000____'"
        ).fetchone()[0]
        all_customers = connection.execute("SELECT COUNT(*) FROM customers").fetchone()[0]

    print(f"Added {inserted} new demo customers.")
    print(f"Demo customers in this set: {demo_total}; all customers: {all_customers}.")


if __name__ == "__main__":
    main()
