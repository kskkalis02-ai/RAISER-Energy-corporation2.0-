(function () {
  const fallbackData = {
    products: [],
    offers: [],
    projects: []
  };

  const escapeHtml = value => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  async function loadData() {
    try {
      const response = await fetch("data/site-data.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Data unavailable");
      return await response.json();
    } catch (error) {
      console.warn("Using static page content because site data could not be loaded.", error);
      return fallbackData;
    }
  }

  function renderProducts(products) {
    const section = document.querySelector("[data-render='products']");
    if (!section || !products.length) return;

    section.innerHTML = products.map((product, index) => `
      <div class="product-showcase" id="${escapeHtml(product.id)}">
        <div class="section-label">${escapeHtml(product.category)}</div>
        <h2 class="section-title" style="margin-bottom:40px">${escapeHtml(product.group.split(" ")[0])} <em>${escapeHtml(product.group.split(" ").slice(1).join(" ") || "Hardware")}</em></h2>
        <div class="product-row ${index % 2 ? "reverse" : ""}">
          <div class="product-image">
            <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.group)}" loading="lazy"/>
          </div>
          <div class="product-detail">
            <span class="product-badge">${escapeHtml(product.badge)}</span>
            <h2>${escapeHtml(product.title).replace(" ", "<br>")}</h2>
            <p>${escapeHtml(product.description)}</p>
            <div class="spec-table">
              ${(product.specs || []).map(spec => `
                <div class="spec-row"><div class="spec-key">${escapeHtml(spec.key)}</div><div class="spec-val">${escapeHtml(spec.value)}</div></div>
              `).join("")}
            </div>
            <div class="product-variants">
              ${(product.variants || []).map((variant, variantIndex) => `
                <div class="variant-card ${variantIndex === 0 ? "active" : ""}">
                  <div class="v-power">${escapeHtml(variant.power)}</div>
                  <div class="v-label">${escapeHtml(variant.label)}</div>
                  <div class="v-price">${escapeHtml(variant.price)}</div>
                </div>
              `).join("")}
            </div>
            <div style="margin-top:30px"><a href="customer-portal.html" class="btn-primary">Request Quote</a></div>
          </div>
        </div>
      </div>
    `).join("");
  }

  function renderOffers(offers) {
    const grid = document.querySelector("[data-render='offers']");
    if (!grid || !offers.length) return;

    grid.innerHTML = offers.map(offer => `
      <div class="offer-card">
        <div class="offer-tag">${escapeHtml(offer.tag)}</div>
        <h4>${escapeHtml(offer.title)}</h4>
        <p>${escapeHtml(offer.description)}</p>
        <div class="saving">${escapeHtml(offer.saving)}</div>
      </div>
    `).join("");
  }

  function renderProjects(projects) {
    const gallery = document.querySelector("[data-render='projects']");
    if (!gallery || !projects.length) return;

    gallery.innerHTML = projects.map(project => `
      <div class="gallery-item">
        <img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)}" loading="lazy"/>
        <div class="gallery-caption">
          <span>${escapeHtml(project.type)} · ${escapeHtml(project.location)}</span>
          <h4>${escapeHtml(project.title)}</h4>
        </div>
      </div>
    `).join("");
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const data = await loadData();
    renderProducts(data.products || []);
    renderOffers(data.offers || []);
    renderProjects(data.projects || []);
  });
})();
