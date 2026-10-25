-- Run as postgres against zenrise_db. Safe to run again.
-- Create all tables on a fresh installation, or update the earlier lesson's table.

CREATE TABLE IF NOT EXISTS public.customers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    phone VARCHAR(10) NOT NULL UNIQUE,
    email TEXT,
    location TEXT,
    product TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.customers
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.enquiries (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    phone VARCHAR(10) NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    product TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'New'
        CHECK (status IN ('New', 'In Progress', 'Closed')),
    customer_id BIGINT REFERENCES public.customers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS enquiries_phone_idx
    ON public.enquiries (phone);
CREATE INDEX IF NOT EXISTS enquiries_created_at_idx
    ON public.enquiries (created_at);

CREATE TABLE IF NOT EXISTS public.service_requests (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id BIGINT REFERENCES public.customers(id) ON DELETE SET NULL,
    product TEXT NOT NULL DEFAULT '',
    issue TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open'
        CHECK (status IN ('Open', 'In Progress', 'Resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS service_requests_customer_id_idx
    ON public.service_requests (customer_id);

GRANT CONNECT ON DATABASE zenrise_db TO zenrise_app;
GRANT USAGE ON SCHEMA public TO zenrise_app;
GRANT SELECT, INSERT, UPDATE, DELETE
    ON public.customers, public.enquiries, public.service_requests
    TO zenrise_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO zenrise_app;
