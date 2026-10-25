import { useEffect, useState } from "react";
import "./App.css";

const products = [
  {
    name: "Online UPS",
    icon: "ups",
    description: "Dependable backup power for equipment that needs to stay on.",
  },
  {
    name: "Servo Stabilizers",
    icon: "stabilizer",
    description: "Stable voltage for homes, offices, and equipment.",
  },
  {
    name: "Inverters",
    icon: "inverter",
    description: "Practical backup power for everyday needs.",
  },
  {
    name: "Solar Systems",
    icon: "solar",
    description: "Explore solar power for your property.",
  },
  {
    name: "Batteries",
    icon: "battery",
    description: "Energy storage options for backup systems.",
  },
];

const adminPages = [
  "Overview",
  "Enquiries",
  "Customers",
  "Products",
  "Service Requests",
  "Customer Analytics",
  "Reports",
  "Settings",
];
const enquiryStatuses = ["New", "In Progress", "Closed"];
const serviceStatuses = ["Open", "In Progress", "Resolved"];
const blankCustomer = {
  name: "",
  phone: "",
  email: "",
  location: "",
  product: "",
  notes: "",
};
const blankEnquiry = {
  name: "",
  phone: "",
  email: "",
  product: "",
  message: "",
};

const API_BASE = "http://127.0.0.1:8000";

async function api(path, { token, ...options } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Cannot reach the backend. Start Uvicorn on port 8000 and try again.");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = body.detail;
    const message = typeof detail === "string"
      ? detail
      : Array.isArray(detail)
        ? detail.map((item) => item.msg).join("; ")
        : `Request failed (${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}

function digits(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(-10);
}

function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "—";
}

function ProductIcon({ type }) {
  const shapes = {
    ups: (
      <>
        <rect x="15" y="10" width="34" height="44" rx="4" />
        <rect x="22" y="17" width="20" height="11" rx="2" />
        <path d="M23 41h18M28 47h8" />
      </>
    ),
    stabilizer: (
      <>
        <rect x="10" y="15" width="44" height="34" rx="4" />
        <path d="M17 32h8l5-9 6 18 5-9h6" />
      </>
    ),
    inverter: (
      <>
        <rect x="8" y="16" width="48" height="32" rx="5" />
        <rect x="17" y="24" width="17" height="12" rx="2" />
        <circle cx="44" cy="30" r="3" />
        <path d="M18 48v5M46 48v5" />
      </>
    ),
    solar: (
      <>
        <path d="m10 26 42-6-7 25-41 4zM13 34l35-5M9 42l36-5M25 23l-5 24M39 21l-6 25M27 48v6M41 46v8M16 54h36" />
      </>
    ),
    battery: (
      <>
        <rect x="9" y="18" width="46" height="32" rx="4" />
        <path d="M20 18v-5h8v5M37 18v-5h8v5M20 34h9M40 30v9M35 34h10" />
      </>
    ),
  };
  return (
    <svg
      className="product-icon"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {shapes[type]}
    </svg>
  );
}

function Brand() {
  return (
    <div className="brand" aria-label="Zenrise Power Solutions Private Limited">
      <img className="brand-image" src="/zenrise-wordmark.jpeg" alt="Zenrise" />
      <div className="brand-subtitle">POWER SOLUTIONS PVT. LTD.</div>
    </div>
  );
}

function PublicSite({ onEnquiry }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState(blankEnquiry);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitEnquiry(event) {
    event.preventDefault();
    if (digits(form.phone).length !== 10) {
      setFeedback("Enter a valid 10-digit contact number.");
      return;
    }
    setSubmitting(true);
    try {
      await onEnquiry(form);
      setForm(blankEnquiry);
      setFeedback("Thank you. Your enquiry has been sent.");
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="public-site">
      <div className="utility-bar">
        <span>Ernakulam, Kerala</span>
        <a href="tel:+919895054854">+91 98950 54854</a>
        <a href="tel:+919746158054">+91 97461 58054</a>
      </div>
      <header className="public-header">
        <a className="brand-link" href="#home">
          <Brand />
        </a>
        <button
          className="mobile-menu"
          type="button"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
        <nav
          className={menuOpen ? "public-nav open" : "public-nav"}
          aria-label="Main navigation"
          onClick={() => setMenuOpen(false)}
        >
          <a href="#home">Home</a>
          <a href="#solutions">Products</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
          <a className="button button-orange" href="#enquiry">
            Get a Quote <span aria-hidden="true">→</span>
          </a>
        </nav>
      </header>

      <main>
        <section className="public-hero" id="home">
          <div className="hero-content">
            <div className="eyebrow light">POWER SOLUTIONS IN ERNAKULAM</div>
            <h1>
              Power that keeps you <span>moving</span>
            </h1>
            <p>Explore reliable power options for homes and businesses.</p>
            <div className="hero-actions">
              <a className="button button-orange" href="#solutions">
                Explore Solutions <span aria-hidden="true">→</span>
              </a>
              <a className="button button-outline" href="#contact">
                Contact Us
              </a>
            </div>
          </div>
        </section>

        <section className="section solutions-section" id="solutions">
          <div className="section-heading">
            <div className="eyebrow">OUR SOLUTIONS</div>
            <h2>Power solutions for every need</h2>
            <p>
              Tell us what you need, and our team can help you explore the right
              option.
            </p>
          </div>
          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.name}>
                <div className="product-art">
                  <ProductIcon type={product.icon} />
                </div>
                <div className="product-content">
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <a
                    href="#enquiry"
                    aria-label={`Enquire about ${product.name}`}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        product: product.name,
                      }))
                    }
                  >
                    Enquire now <span aria-hidden="true">→</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section" id="about">
          <div className="about-mark">
            <div className="orb orb-one" />
            <div className="orb orb-two" />
            <span>ZENRISE</span>
          </div>
          <div className="about-copy">
            <div className="eyebrow">ABOUT ZENRISE</div>
            <h2>Power support for the moments that matter</h2>
            <p>
              Zenrise Power Solutions Pvt. Ltd. is based in Ernakulam, Kerala.
              Our listed offerings include online UPS, servo stabilizers,
              inverters, solar systems, and batteries.
            </p>
            <a className="text-link" href="#contact">
              Talk to our team <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        <section className="section contact-section" id="contact">
          <div className="section-heading">
            <div className="eyebrow">GET IN TOUCH</div>
            <h2>Let’s talk power solutions</h2>
            <p>
              Send a product enquiry or contact our office and service centre.
            </p>
          </div>
          <div className="contact-layout">
            <form
              className="enquiry-form card"
              id="enquiry"
              onSubmit={submitEnquiry}
            >
              <h3>Send an enquiry</h3>
              <div className="field-grid">
                <label>
                  Customer name <span>*</span>
                  <input
                    required
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    placeholder="Your full name"
                  />
                </label>
                <label>
                  Contact number <span>*</span>
                  <input
                    required
                    type="tel"
                    inputMode="tel"
                    value={form.phone}
                    onChange={(event) =>
                      setForm({ ...form, phone: event.target.value })
                    }
                    placeholder="Your mobile number"
                  />
                </label>
              </div>
              <div className="field-grid">
                <label>
                  Email (optional)
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm({ ...form, email: event.target.value })
                    }
                    placeholder="you@example.com"
                  />
                </label>
                <label>
                  Interested in (optional)
                  <select
                    value={form.product}
                    onChange={(event) =>
                      setForm({ ...form, product: event.target.value })
                    }
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.name}>{product.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Message (optional)
                <textarea
                  rows="4"
                  value={form.message}
                  onChange={(event) =>
                    setForm({ ...form, message: event.target.value })
                  }
                  placeholder="Tell us what you need"
                />
              </label>
              <button className="button button-orange" type="submit" disabled={submitting}>
                {submitting ? "Sending…" : "Send Enquiry"} <span aria-hidden="true">→</span>
              </button>
              <p className="form-note">Your enquiry is sent to Zenrise Power Solutions.</p>
              {feedback && (
                <p className="form-feedback" role="status">
                  {feedback}
                </p>
              )}
            </form>
            <div className="contact-details">
              <div className="card address-card">
                <span className="round-icon">⌖</span>
                <h3>Registered Office</h3>
                <address>
                  No. 48/835, Mullappillil Building, Pisharipadi Road, Eroor,
                  Ernakulam 682306
                </address>
                <a href="tel:+919895054854">+91 98950 54854</a>
                <a href="tel:+919746158054">+91 97461 58054</a>
              </div>
              <div className="card address-card">
                <span className="round-icon">⌖</span>
                <h3>Service Centre</h3>
                <address>
                  GNRA 94, Gazari Nagar, Eroor, Ernakulam 682306
                </address>
                <a href="tel:+918129048333">+91 81290 48333</a>
                <a href="tel:+918129048555">+91 81290 48555</a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="public-footer">
        <Brand />
        <span>Ernakulam, Kerala</span>
        <span>
          Online UPS · Servo Stabilizers · Inverters · Solar Systems · Batteries
        </span>
      </footer>
    </div>
  );
}

function EmptyState({ title, detail }) {
  return (
    <div className="empty-state">
      <div className="empty-symbol">▧</div>
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  );
}

function StatCard({ icon, label, value, detail }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="stat-label">{label}</div>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function BarChart({ items, emptyText = "Add data to see this chart." }) {
  const highest = Math.max(1, ...items.map((item) => item.value));
  if (items.every((item) => item.value === 0))
    return <EmptyState title="No chart data yet" detail={emptyText} />;
  return (
    <div className="bar-chart">
      {items.map((item) => (
        <div className="bar-row" key={item.label}>
          <span>{item.label}</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${Math.max(3, (item.value / highest) * 100)}%` }}
            />
          </div>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ enquiries }) {
  const months = Array.from({ length: 6 }, (_, index) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 5 + index);
    return {
      label: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(d),
      key: `${d.getFullYear()}-${d.getMonth()}`,
      value: 0,
    };
  });
  enquiries.forEach((item) => {
    const d = new Date(item.createdAt);
    const bucket = months.find(
      (month) => month.key === `${d.getFullYear()}-${d.getMonth()}`,
    );
    if (bucket) bucket.value += 1;
  });
  const highest = Math.max(1, ...months.map((month) => month.value));
  return (
    <div className="trend-chart">
      {months.map((month) => (
        <div className="trend-item" key={month.key}>
          <span className="trend-value">{month.value}</span>
          <div className="trend-track">
            <div
              className="trend-fill"
              style={{
                height: `${month.value ? Math.max(8, (month.value / highest) * 100) : 2}%`,
              }}
            />
          </div>
          <span>{month.label}</span>
        </div>
      ))}
    </div>
  );
}

function Overview({ customers, enquiries, tickets, onNavigate }) {
  const newEnquiries = enquiries.filter((item) => item.status === "New").length;
  const openTickets = tickets.filter(
    (item) => item.status !== "Resolved",
  ).length;
  const recent = [...enquiries]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
  const interest = products.map((product) => ({
    label: product.name,
    value:
      enquiries.filter((item) => item.product === product.name).length +
      customers.filter((item) => item.product === product.name).length,
  }));
  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Overview</h1>
          <p>Customer activity saved in the database</p>
        </div>
        <span className="demo-pill">Live records</span>
      </div>
      <div className="stats-grid">
        <StatCard
          icon="✉"
          label="New Enquiries"
          value={newEnquiries}
          detail="Waiting for review"
        />
        <StatCard
          icon="⚙"
          label="Open Service Requests"
          value={openTickets}
          detail="Active requests"
        />
        <StatCard
          icon="♙"
          label="Customers"
          value={customers.length}
          detail="Saved records"
        />
        <StatCard
          icon="▣"
          label="Products"
          value={products.length}
          detail="Solution categories"
        />
      </div>
      <div className="dashboard-grid">
        <section className="admin-card">
          <div className="panel-heading">
            <h2>Monthly Enquiries</h2>
            <span>Last 6 months</span>
          </div>
          <TrendChart enquiries={enquiries} />
        </section>
        <section className="admin-card">
          <div className="panel-heading">
            <h2>Interest by Product</h2>
            <span>Enquiries + customers</span>
          </div>
          <BarChart items={interest} />
        </section>
      </div>
      <section className="admin-card">
        <div className="panel-heading">
          <h2>Recent Enquiries</h2>
          <button
            className="text-button"
            onClick={() => onNavigate("Enquiries")}
          >
            View all →
          </button>
        </div>
        {recent.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.product || "General"}</td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>
                      <span
                        className={`status ${item.status.toLowerCase().replace(" ", "-")}`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No enquiries yet"
            detail="Submit the website form to receive an enquiry."
          />
        )}
      </section>
    </>
  );
}

function EnquiriesPage({ enquiries, customers, onStatus, onConvert }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");
  const visible = [...enquiries]
    .filter(
      (item) =>
        (filter === "All" || item.status === filter) &&
        `${item.name} ${item.phone} ${item.product}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const selected = enquiries.find((item) => item.id === selectedId);
  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Customer enquiries</h1>
          <p>Review requests submitted through the public website</p>
        </div>
        <span className="demo-pill">Database</span>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="admin-card">
        <div className="controls-row">
          <input
            className="search-input"
            aria-label="Search enquiries"
            placeholder="Search name, phone or product"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            aria-label="Filter enquiries by status"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option>All</option>
            {enquiryStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
        {visible.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact number</th>
                  <th>Interested in</th>
                  <th>Received</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                    </td>
                    <td>{item.phone}</td>
                    <td>{item.product || "General"}</td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>
                      <span
                        className={`status ${item.status.toLowerCase().replace(" ", "-")}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="text-button"
                        onClick={() => setSelectedId(item.id)}
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No matching enquiries"
            detail="Try another filter or submit an enquiry through the website."
          />
        )}
      </div>
      {selected && (
        <div
          className="drawer-backdrop"
          onMouseDown={() => setSelectedId(null)}
        >
          <aside
            className="drawer"
            onMouseDown={(event) => event.stopPropagation()}
            aria-label="Enquiry details"
          >
            <div className="drawer-heading">
              <h2>Enquiry details</h2>
              <button
                className="icon-button"
                aria-label="Close details"
                onClick={() => setSelectedId(null)}
              >
                ×
              </button>
            </div>
            <div className="detail-identity">
              <div className="avatar">
                {selected.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <strong>{selected.name}</strong>
                <span>{formatDate(selected.createdAt)}</span>
              </div>
            </div>
            <dl className="detail-list">
              <dt>Contact number</dt>
              <dd>
                <a href={`tel:${selected.phone}`}>{selected.phone}</a>
              </dd>
              <dt>Email</dt>
              <dd>{selected.email || "—"}</dd>
              <dt>Product interest</dt>
              <dd>{selected.product || "General enquiry"}</dd>
              <dt>Message</dt>
              <dd>{selected.message || "No message provided"}</dd>
            </dl>
            <label className="drawer-label">
              Status
              <select
                value={selected.status}
                onChange={async (event) => {
                  try { await onStatus(selected.id, event.target.value); setError(""); }
                  catch (failure) { setError(failure.message); }
                }}
              >
                {enquiryStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
            <button
              className="button button-orange full-width"
              onClick={async () => {
                try { await onConvert(selected); setSelectedId(null); setError(""); }
                catch (failure) { setError(failure.message); }
              }}
              disabled={Boolean(selected.customerId)}
            >
              {selected.customerId
                ? "Linked to Customer"
                : customers.some(
                      (customer) =>
                        digits(customer.phone) === digits(selected.phone),
                    )
                  ? "Link to Existing Customer"
                  : "Add to Customers"}
            </button>
            <p className="muted-small">
              Existing contact numbers are linked instead of creating
              duplicates.
            </p>
          </aside>
        </div>
      )}
    </>
  );
}

function CustomerForm({ initial, onSave, onClose, customers }) {
  const [form, setForm] = useState(initial || blankCustomer);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (digits(form.phone).length !== 10) {
      setError("Enter a valid 10-digit contact number.");
      return;
    }
    if (
      customers.some(
        (customer) =>
          customer.id !== initial?.id &&
          digits(customer.phone) === digits(form.phone),
      )
    ) {
      setError("A customer with this contact number already exists.");
      return;
    }
    setSubmitting(true);
    try { await onSave(form); }
    catch (failure) { setError(failure.message); }
    finally { setSubmitting(false); }
  }
  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside
        className="drawer"
        onMouseDown={(event) => event.stopPropagation()}
        aria-label="Customer form"
      >
        <div className="drawer-heading">
          <h2>{initial ? "Edit Customer" : "Add Customer"}</h2>
          <button
            className="icon-button"
            aria-label="Close form"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <p className="muted-small">
          Only name and contact number are required.
        </p>
        <form onSubmit={submit} className="drawer-form">
          <label>
            Customer name <span>*</span>
            <input
              required
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              placeholder="Enter full name"
            />
          </label>
          <label>
            Contact number <span>*</span>
            <input
              required
              type="tel"
              value={form.phone}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
              placeholder="Enter mobile number"
            />
          </label>
          <h3>Optional details</h3>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              placeholder="Email address"
            />
          </label>
          <label>
            Location
            <input
              value={form.location}
              onChange={(event) =>
                setForm({ ...form, location: event.target.value })
              }
              placeholder="City or locality"
            />
          </label>
          <label>
            Product interest
            <select
              value={form.product}
              onChange={(event) =>
                setForm({ ...form, product: event.target.value })
              }
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product.name}>{product.name}</option>
              ))}
            </select>
          </label>
          <label>
            Notes
            <textarea
              rows="3"
              value={form.notes}
              onChange={(event) =>
                setForm({ ...form, notes: event.target.value })
              }
              placeholder="Additional notes"
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="drawer-actions">
            <button
              type="button"
              className="button button-muted"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="button button-orange" disabled={submitting}>
              {submitting ? "Saving…" : "Save Customer"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

function CustomersPage({ customers, onSave, onDelete }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(undefined);
  const [error, setError] = useState("");
  const visible = [...customers]
    .filter((item) =>
      `${item.name} ${item.phone} ${item.product} ${item.location}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  async function save(form) {
    await onSave(form);
    setEditing(undefined);
    setError("");
  }
  async function remove(customer) {
    if (
      window.confirm(
        `Permanently remove ${customer.name} from the database?`,
      )
    ) {
      try { await onDelete(customer.id); setError(""); }
      catch (failure) { setError(failure.message); }
    }
  }
  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Customers</h1>
          <p>Manage customer contact details</p>
        </div>
        <button
          className="button button-orange"
          onClick={() => setEditing(null)}
        >
          + Add Customer
        </button>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="admin-card">
        <div className="controls-row">
          <input
            className="search-input"
            aria-label="Search customers"
            placeholder="Search by name, number or product interest"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {visible.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact number</th>
                  <th>Product interest</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <strong>{customer.name}</strong>
                    </td>
                    <td>
                      <a href={`tel:${customer.phone}`}>{customer.phone}</a>
                    </td>
                    <td>{customer.product || "—"}</td>
                    <td>{customer.location || "—"}</td>
                    <td className="row-actions">
                      <button
                        className="text-button"
                        onClick={() => setEditing(customer)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-button danger"
                        onClick={() => remove(customer)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No customers found"
            detail="Add a customer manually or convert an enquiry."
          />
        )}
      </div>
      {editing !== undefined && (
        <CustomerForm
          initial={editing}
          customers={customers}
          onSave={save}
          onClose={() => setEditing(undefined)}
        />
      )}
    </>
  );
}

function ProductsPage() {
  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Products</h1>
          <p>Categories shown on the customer website</p>
        </div>
      </div>
      <div className="admin-products">
        {products.map((product) => (
          <article className="admin-card admin-product" key={product.name}>
            <div className="product-art">
              <ProductIcon type={product.icon} />
            </div>
            <h2>{product.name}</h2>
            <p>{product.description}</p>
          </article>
        ))}
      </div>
      <p className="muted-small">
        These categories come from the company certificate. Product
        specifications and pricing should be confirmed before publishing.
      </p>
    </>
  );
}

function ServicePage({ customers, tickets, onCreate, onStatus }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customerId: "", product: "", issue: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onCreate({ ...form, customerId: Number(form.customerId) });
      setForm({ customerId: "", product: "", issue: "" });
      setOpen(false);
      setError("");
    } catch (failure) { setError(failure.message); }
    finally { setSubmitting(false); }
  }
  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Service Requests</h1>
          <p>Track support requests for saved customers</p>
        </div>
        <button
          className="button button-orange"
          disabled={!customers.length}
          onClick={() => setOpen(true)}
        >
          + New Request
        </button>
      </div>
      {!customers.length && (
        <p className="notice">
          Add a customer before creating a service request.
        </p>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="admin-card">
        {tickets.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Request</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      {customers.find(
                        (customer) => customer.id === ticket.customerId,
                      )?.name || "Removed customer"}
                    </td>
                    <td>{ticket.product || "General"}</td>
                    <td>{ticket.issue}</td>
                    <td>{formatDate(ticket.createdAt)}</td>
                    <td>
                      <select
                        aria-label={`Status for ${ticket.issue}`}
                        value={ticket.status}
                        onChange={async (event) => {
                          try { await onStatus(ticket.id, event.target.value); setError(""); }
                          catch (failure) { setError(failure.message); }
                        }}
                      >
                        {serviceStatuses.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No service requests"
            detail="Create a request after adding a customer."
          />
        )}
      </div>
      {open && (
        <div className="drawer-backdrop" onMouseDown={() => setOpen(false)}>
          <aside
            className="drawer"
            onMouseDown={(event) => event.stopPropagation()}
            aria-label="New service request"
          >
            <div className="drawer-heading">
              <h2>New Service Request</h2>
              <button
                className="icon-button"
                aria-label="Close form"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={submit} className="drawer-form">
              <label>
                Customer <span>*</span>
                <select
                  required
                  value={form.customerId}
                  onChange={(event) =>
                    setForm({ ...form, customerId: event.target.value })
                  }
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option value={customer.id} key={customer.id}>
                      {customer.name} — {customer.phone}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Product
                <select
                  value={form.product}
                  onChange={(event) =>
                    setForm({ ...form, product: event.target.value })
                  }
                >
                  <option value="">General</option>
                  {products.map((product) => (
                    <option key={product.name}>{product.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Request details <span>*</span>
                <textarea
                  required
                  rows="5"
                  value={form.issue}
                  onChange={(event) =>
                    setForm({ ...form, issue: event.target.value })
                  }
                  placeholder="Describe the support request"
                />
              </label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <div className="drawer-actions">
                <button
                  type="button"
                  className="button button-muted"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button className="button button-orange" type="submit" disabled={submitting}>
                  Save Request
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}

function AnalyticsPage({ customers, enquiries }) {
  const repeatContacts = Object.values(
    enquiries.reduce((acc, item) => {
      const key = digits(item.phone);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  ).filter((count) => count > 1).length;
  const converted = enquiries.filter(
    (item) =>
      item.customerId ||
      customers.some(
        (customer) => digits(customer.phone) === digits(item.phone),
      ),
  ).length;
  const conversionRate = enquiries.length
    ? Math.round((converted / enquiries.length) * 100)
    : 0;
  const thisMonth = customers.filter((item) => {
    const d = new Date(item.createdAt);
    const now = new Date();
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }).length;
  const interest = products.map((product) => ({
    label: product.name,
    value:
      enquiries.filter((item) => item.product === product.name).length +
      customers.filter((item) => item.product === product.name).length,
  }));
  const statusCounts = enquiryStatuses.map((status) => ({
    label: status,
    value: enquiries.filter((item) => item.status === status).length,
  }));
  const top = [...interest].sort((a, b) => b.value - a.value)[0];
  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Customer Analytics</h1>
          <p>Insights calculated from saved customer and enquiry records</p>
        </div>
        <span className="demo-pill">Live records</span>
      </div>
      <div className="stats-grid">
        <StatCard
          icon="♙"
          label="Total Customers"
          value={customers.length}
          detail="Saved records"
        />
        <StatCard
          icon="✦"
          label="New This Month"
          value={thisMonth}
          detail="Customers added"
        />
        <StatCard
          icon="↻"
          label="Repeat Enquirers"
          value={repeatContacts}
          detail="More than one enquiry"
        />
        <StatCard
          icon="◈"
          label="Enquiry Conversion"
          value={`${conversionRate}%`}
          detail="Enquirers in customers"
        />
      </div>
      <div className="dashboard-grid">
        <section className="admin-card">
          <div className="panel-heading">
            <h2>Customer Enquiries</h2>
            <span>Last 6 months</span>
          </div>
          <TrendChart enquiries={enquiries} />
        </section>
        <section className="admin-card">
          <div className="panel-heading">
            <h2>Interest by Product</h2>
            <span>Recorded interests</span>
          </div>
          <BarChart items={interest} />
        </section>
        <section className="admin-card">
          <div className="panel-heading">
            <h2>Enquiry Status</h2>
            <span>Current totals</span>
          </div>
          <BarChart items={statusCounts} />
        </section>
        <section className="admin-card insight-panel">
          <div className="panel-heading">
            <h2>Customer Behaviour</h2>
            <span>Derived from saved records</span>
          </div>
          {enquiries.length ? (
            <div className="insight-list">
              <p>
                <strong>{repeatContacts}</strong> contact
                {repeatContacts === 1 ? " has" : "s have"} made more than one
                enquiry.
              </p>
              <p>
                <strong>{top?.value ? top.label : "No product yet"}</strong> has
                the most recorded product interest.
              </p>
              <p>
                <strong>{converted}</strong> enquirer
                {converted === 1 ? " is" : "s are"} linked to a saved customer
                record.
              </p>
            </div>
          ) : (
            <EmptyState
              title="No insights yet"
              detail="Submit enquiries to explore patterns."
            />
          )}
        </section>
      </div>
    </>
  );
}

function csvCell(value) {
  const text = String(value ?? "");
  const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

function exportCsv(filename, headings, rows) {
  const data = [headings, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\ufeff", data], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ReportsPage({ customers, enquiries, tickets }) {
  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Reports</h1>
          <p>Export the records loaded from the database</p>
        </div>
      </div>
      <div className="report-grid">
        <div className="admin-card report-card">
          <div className="report-symbol">♙</div>
          <h2>Customers</h2>
          <p>{customers.length} records</p>
          <button
            className="button button-orange"
            onClick={() =>
              exportCsv(
                "zenrise-customers.csv",
                [
                  "Name",
                  "Contact Number",
                  "Email",
                  "Location",
                  "Product Interest",
                  "Notes",
                ],
                customers.map((c) => [
                  c.name,
                  c.phone,
                  c.email,
                  c.location,
                  c.product,
                  c.notes,
                ]),
              )
            }
          >
            Download CSV
          </button>
        </div>
        <div className="admin-card report-card">
          <div className="report-symbol">✉</div>
          <h2>Enquiries</h2>
          <p>{enquiries.length} records</p>
          <button
            className="button button-orange"
            onClick={() =>
              exportCsv(
                "zenrise-enquiries.csv",
                [
                  "Name",
                  "Contact Number",
                  "Email",
                  "Product Interest",
                  "Message",
                  "Status",
                  "Received",
                ],
                enquiries.map((e) => [
                  e.name,
                  e.phone,
                  e.email,
                  e.product,
                  e.message,
                  e.status,
                  e.createdAt,
                ]),
              )
            }
          >
            Download CSV
          </button>
        </div>
        <div className="admin-card report-card">
          <div className="report-symbol">⚙</div>
          <h2>Service Requests</h2>
          <p>{tickets.length} records</p>
          <button
            className="button button-orange"
            onClick={() =>
              exportCsv(
                "zenrise-service.csv",
                ["Customer ID", "Product", "Issue", "Status", "Created"],
                tickets.map((t) => [
                  t.customerId,
                  t.product,
                  t.issue,
                  t.status,
                  t.createdAt,
                ]),
              )
            }
          >
            Download CSV
          </button>
        </div>
      </div>
      <p className="notice">
        These exports may contain contact details. Handle downloaded files
        carefully.
      </p>
    </>
  );
}

function SettingsPage({ customers, enquiries, tickets, onRefresh, onLogout }) {
  return (
    <>
      <div className="admin-title"><div><h1>Settings</h1><p>Connected to PostgreSQL through the admin API</p></div></div>
      <div className="settings-grid">
        <section className="admin-card">
          <h2>Saved records</h2>
          <p>{customers.length} customers · {enquiries.length} enquiries · {tickets.length} service requests</p>
          <button className="button button-orange" onClick={onRefresh}>Refresh data</button>
        </section>
        <section className="admin-card">
          <h2>Admin session</h2>
          <p>Your sign in expires after one hour.</p>
          <button className="button button-muted" onClick={onLogout}>Log out</button>
        </section>
      </div>
    </>
  );
}

function AdminSite({ customers, enquiries, tickets, token, onRefresh, onLogout, onError }) {
  const [page, setPage] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState("");
  function changePage(next) {
    setPage(next);
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  }
  async function perform(path, options = {}) {
    try {
      const result = await api(path, { ...options, token });
      await onRefresh();
      setError("");
      return result;
    } catch (failure) {
      if (failure.status === 401) onError(failure);
      setError(failure.message);
      throw failure;
    }
  }
  const body = (value) => JSON.stringify(value);
  const saveCustomer = (form) => perform(
    form.id ? `/api/admin/customers/${form.id}` : "/api/admin/customers",
    { method: form.id ? "PUT" : "POST", body: body({
      name: form.name, phone: form.phone, email: form.email,
      location: form.location, product: form.product, notes: form.notes,
    }) },
  );
  const deleteCustomer = (id) => perform(`/api/admin/customers/${id}`, { method: "DELETE" });
  const updateEnquiryStatus = (id, status) => perform(`/api/admin/enquiries/${id}/status`, {
    method: "PATCH", body: body({ status }),
  });
  const convertEnquiry = (enquiry) => perform(`/api/admin/enquiries/${enquiry.id}/convert`, { method: "POST" });
  const createService = (form) => perform("/api/admin/service-requests", {
    method: "POST", body: body(form),
  });
  const updateServiceStatus = (id, status) => perform(`/api/admin/service-requests/${id}/status`, {
    method: "PATCH", body: body({ status }),
  });
  return (
    <div className="admin-shell">
      <aside className={sidebarOpen ? "sidebar open" : "sidebar"}>
        <div className="sidebar-brand">
          <Brand />
        </div>
        <nav aria-label="Admin navigation">
          {adminPages.map((name) => (
            <button
              key={name}
              className={page === name ? "side-link active" : "side-link"}
              onClick={() => changePage(name)}
            >
              <span className="side-dot" />
              {name}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="demo-pill">Connected</span>
          <a href="/">← Customer website</a>
        </div>
      </aside>
      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <button
              className="admin-menu"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <strong>{page}</strong>
          </div>
          <div className="admin-profile">
            <span className="avatar small">A</span>
            <span>Admin</span>
          </div>
        </header>
        <div className="admin-content">
          {error && <p className="form-error" role="alert">{error}</p>}
          {page === "Overview" && (
            <Overview
              customers={customers}
              enquiries={enquiries}
              tickets={tickets}
              onNavigate={changePage}
            />
          )}
          {page === "Enquiries" && (
            <EnquiriesPage
              enquiries={enquiries}
              customers={customers}
              onStatus={updateEnquiryStatus}
              onConvert={convertEnquiry}
            />
          )}
          {page === "Customers" && (
            <CustomersPage customers={customers} onSave={saveCustomer} onDelete={deleteCustomer} />
          )}
          {page === "Products" && <ProductsPage />}
          {page === "Service Requests" && (
            <ServicePage
              customers={customers}
              tickets={tickets}
              onCreate={createService}
              onStatus={updateServiceStatus}
            />
          )}
          {page === "Customer Analytics" && (
            <AnalyticsPage customers={customers} enquiries={enquiries} />
          )}
          {page === "Reports" && (
            <ReportsPage
              customers={customers}
              enquiries={enquiries}
              tickets={tickets}
            />
          )}
          {page === "Settings" && (
            <SettingsPage
              customers={customers}
              enquiries={enquiries}
              tickets={tickets}
              onRefresh={onRefresh}
              onLogout={onLogout}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try { await onLogin(username, password); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  return (
    <main className="login-page">
      <div className="admin-card login-card">
        <Brand />
        <h1>Admin sign in</h1>
        <p>Enter the username and password you created in setup_admin.py.</p>
        <form onSubmit={submit} className="drawer-form">
          <label>Username<input required autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} /></label>
          <label>Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error && <p role="alert" className="form-error">{error}</p>}
          <button className="button button-orange" disabled={busy} type="submit">{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        <a href="/">← Customer website</a>
      </div>
    </main>
  );
}

function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem("zenrise-admin-token") || "");
  const [customers, setCustomers] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [loadError, setLoadError] = useState("");
  function logout() {
    sessionStorage.removeItem("zenrise-admin-token");
    setToken("");
    setCustomers([]);
    setEnquiries([]);
    setTickets([]);
  }
  async function refresh(currentToken = token) {
    try {
      const [savedCustomers, savedEnquiries, savedTickets] = await Promise.all([
        api("/api/admin/customers", { token: currentToken }),
        api("/api/admin/enquiries", { token: currentToken }),
        api("/api/admin/service-requests", { token: currentToken }),
      ]);
      setCustomers(savedCustomers);
      setEnquiries(savedEnquiries);
      setTickets(savedTickets);
      setLoadError("");
    } catch (failure) {
      if (failure.status === 401) logout();
      setLoadError(failure.message);
      throw failure;
    } finally { setLoading(false); }
  }
  useEffect(() => {
    if (token) refresh(token).catch(() => {});
    // Session initialization; subsequent refreshes happen after each change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  async function login(username, password) {
    const result = await api("/api/admin/login", {
      method: "POST", body: JSON.stringify({ username, password }),
    });
    sessionStorage.setItem("zenrise-admin-token", result.access_token);
    setToken(result.access_token);
    setLoading(true);
  }
  if (!window.location.pathname.startsWith("/admin"))
    return <PublicSite onEnquiry={(form) => api("/api/enquiries", {
      method: "POST", body: JSON.stringify(form),
    })} />;
  if (!token) return <AdminLogin onLogin={login} />;
  if (loading) return <main className="login-page"><p>Loading customer records…</p></main>;
  return (
    <>
      {loadError && <p className="form-error" role="alert">{loadError}</p>}
      <AdminSite customers={customers} enquiries={enquiries} tickets={tickets}
        token={token} onRefresh={() => refresh(token)} onLogout={logout}
        onError={(failure) => { if (failure.status === 401) logout(); }} />
    </>
  );
}

export default App;
