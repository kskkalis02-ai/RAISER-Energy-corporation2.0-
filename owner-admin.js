(function () {
  const tokenKey = "raiserOwnerToken";
  const templates = {
    products: {
      empty: {
        id: "new-product",
        category: "Category",
        group: "Solar Product",
        badge: "Product Type",
        title: "RAISER Product",
        description: "Product description",
        image: "",
        specs: [{ key: "Warranty", value: "10 Years" }],
        variants: [{ power: "5kW", label: "Standard", price: "Rs. 60,000" }]
      },
      fields: ["id", "category", "group", "badge", "title", "description", "image", "specs", "variants"]
    },
    offers: {
      empty: { id: "new-offer", tag: "Active", title: "New Offer", description: "Offer details", saving: "Save now" },
      fields: ["id", "tag", "title", "description", "saving"]
    },
    projects: {
      empty: { id: "new-project", type: "Residential", location: "City", title: "New Project", image: "" },
      fields: ["id", "type", "location", "title", "image"]
    },
    customers: {
      empty: { id: "C-0000", name: "Customer Name", email: "customer@email.com", phone: "+91", city: "City", status: "New" },
      fields: ["id", "name", "email", "phone", "city", "status"]
    },
    orders: {
      empty: { id: "ORD-0000", customer: "Customer Name", product: "Product", amount: "Rs. 0", status: "New" },
      fields: ["id", "customer", "product", "amount", "status"]
    }
  };
  let siteData = null;

  const escapeHtml = value => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  function setStatus(message, type = "") {
    const node = document.getElementById("owner-status");
    if (!node) return;
    node.textContent = message;
    node.className = `owner-status ${type}`;
  }

  async function api(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    const token = sessionStorage.getItem(tokenKey);
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(path, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  async function loginOwner() {
    const email = document.getElementById("owner-email").value.trim();
    const password = document.getElementById("owner-password").value;
    const msg = document.getElementById("owner-login-msg");
    try {
      const result = await api("/api/owner/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      sessionStorage.setItem(tokenKey, result.token);
      window.location.href = "owner-panel.html";
    } catch (error) {
      msg.textContent = "Login failed. Start the website with server.js, then use the owner password.";
    }
  }

  function fieldValue(item, field) {
    const value = item[field];
    return Array.isArray(value) || typeof value === "object"
      ? JSON.stringify(value || [], null, 2)
      : String(value || "");
  }

  function renderCollection(name) {
    const pane = document.getElementById(`admin-${name}`);
    if (!pane) return;
    const config = templates[name];
    const rows = siteData[name] || [];
    pane.innerHTML = `
      <div class="admin-pane-head">
        <div>
          <h2>${escapeHtml(name[0].toUpperCase() + name.slice(1))}</h2>
          <p>Create, edit, delete, then save changes.</p>
        </div>
        <button class="btn-primary" data-add="${name}">Add New</button>
      </div>
      <div class="admin-list">
        ${rows.map((item, index) => `
          <article class="admin-card" data-collection="${name}" data-index="${index}">
            <div class="admin-card-head">
              <strong>${escapeHtml(item.title || item.name || item.id)}</strong>
              <button class="btn-outline danger" data-delete="${name}" data-index="${index}">Delete</button>
            </div>
            <div class="admin-fields">
              ${config.fields.map(field => `
                <label class="${field === "description" || field === "specs" || field === "variants" ? "wide" : ""}">
                  <span>${escapeHtml(field)}</span>
                  ${field === "description" || field === "specs" || field === "variants"
                    ? `<textarea data-field="${field}">${escapeHtml(fieldValue(item, field))}</textarea>`
                    : `<input data-field="${field}" value="${escapeHtml(fieldValue(item, field))}"/>`}
                </label>
              `).join("")}
            </div>
          </article>
        `).join("")}
      </div>
    `;
  }

  function renderAll() {
    Object.keys(templates).forEach(renderCollection);
  }

  function collectPane(name) {
    const config = templates[name];
    return Array.from(document.querySelectorAll(`[data-collection="${name}"]`)).map(card => {
      const item = {};
      config.fields.forEach(field => {
        const input = card.querySelector(`[data-field="${field}"]`);
        const value = input ? input.value.trim() : "";
        item[field] = field === "specs" || field === "variants" ? (value ? JSON.parse(value) : []) : value;
      });
      return item;
    });
  }

  async function loadOwnerData() {
    if (!sessionStorage.getItem(tokenKey)) {
      window.location.href = "owner-login.html";
      return;
    }
    try {
      siteData = await api("/api/data");
      renderAll();
      setStatus("Loaded latest website data.", "success");
    } catch (error) {
      setStatus(`${error.message}. Start server.js and login again.`, "error");
    }
  }

  async function saveOwnerData() {
    try {
      Object.keys(templates).forEach(name => {
        siteData[name] = collectPane(name);
      });
      await api("/api/data", { method: "PUT", body: JSON.stringify(siteData) });
      setStatus("Saved. Public pages now use the updated content.", "success");
    } catch (error) {
      setStatus(`Save failed: ${error.message}`, "error");
    }
  }

  function bindPanel() {
    document.querySelectorAll("[data-admin-tab]").forEach(button => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-admin-tab]").forEach(tab => tab.classList.remove("active"));
        document.querySelectorAll(".admin-pane").forEach(pane => pane.classList.remove("active"));
        button.classList.add("active");
        document.getElementById(`admin-${button.dataset.adminTab}`).classList.add("active");
      });
    });

    document.addEventListener("click", event => {
      const add = event.target.closest("[data-add]");
      const del = event.target.closest("[data-delete]");
      if (add) {
        const name = add.dataset.add;
        siteData[name].push(JSON.parse(JSON.stringify(templates[name].empty)));
        renderCollection(name);
      }
      if (del) {
        const name = del.dataset.delete;
        siteData[name].splice(Number(del.dataset.index), 1);
        renderCollection(name);
      }
    });

    document.getElementById("save-data")?.addEventListener("click", saveOwnerData);
    document.getElementById("reload-data")?.addEventListener("click", loadOwnerData);
    document.getElementById("owner-logout")?.addEventListener("click", () => {
      sessionStorage.removeItem(tokenKey);
      window.location.href = "owner-login.html";
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("owner-login-btn")?.addEventListener("click", loginOwner);
    document.getElementById("owner-password")?.addEventListener("keydown", event => {
      if (event.key === "Enter") loginOwner();
    });
    if (document.body.classList.contains("owner-panel-page")) {
      bindPanel();
      loadOwnerData();
    }
  });
})();
