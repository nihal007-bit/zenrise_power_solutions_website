"""Create or reset the one local admin account without printing its password."""

from getpass import getpass
from pathlib import Path
import re
import secrets

from dotenv import dotenv_values
from pwdlib import PasswordHash


env_path = Path(__file__).with_name(".env")
if not env_path.exists() or not dotenv_values(env_path).get("DB_PASSWORD"):
    raise SystemExit("Create backend/.env with DB_PASSWORD first.")

username = input("Admin username [admin]: ").strip() or "admin"
if not re.fullmatch(r"[A-Za-z0-9_.-]{3,32}", username):
    raise SystemExit("Use 3-32 letters, digits, dots, underscores or hyphens.")

password = getpass("Choose admin password (12+ characters): ")
confirmation = getpass("Type it again: ")
if len(password) < 12 or password != confirmation:
    raise SystemExit("Passwords differ or are shorter than 12 characters.")

hashed = PasswordHash.recommended().hash(password)
signing_key = secrets.token_urlsafe(48)
admin_keys = {"ADMIN_USERNAME", "ADMIN_PASSWORD_HASH", "JWT_SECRET"}
existing_lines = env_path.read_text(encoding="utf-8").splitlines()
retained_lines = [
    line for line in existing_lines
    if line.split("=", 1)[0].strip() not in admin_keys
]
retained_lines += [
    f"ADMIN_USERNAME={username}",
    f"ADMIN_PASSWORD_HASH={hashed}",
    f"JWT_SECRET={signing_key}",
]
# Write in place: Windows can reject the atomic rename used by dotenv.set_key.
env_path.write_text("\n".join(retained_lines) + "\n", encoding="utf-8")
print("Admin configured. Keep backend/.env private.")
