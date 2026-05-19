const navToggle = document.querySelector("#navToggle");
const siteNav = document.querySelector("#siteNav");

navToggle?.addEventListener("click", () => {
  siteNav.classList.toggle("open");
});

siteNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => siteNav.classList.remove("open"));
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.16 });

document.querySelectorAll(".reveal").forEach((item) => observer.observe(item));

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

const pages = [
  { title: "Products", desc: "Solar panels, battery storage, and inverters", url: "products.html" },
  { title: "Offers", desc: "Pricing, discounts, subsidies, and EMI plans", url: "offers.html" },
  { title: "Projects", desc: "Gallery, videos, and customer stories", url: "projects.html" },
  { title: "Services", desc: "Installation, repair, maintenance, and energy consulting", url: "services.html" },
  { title: "Contact", desc: "Location, message form, support, and WhatsApp", url: "contact.html" },
  { title: "Customer Portal", desc: "Quotes, payments, and support tickets", url: "customer-portal.html" },
  { title: "Owner Operation", desc: "Owner-only CRUD operation panel", url: "owner-login.html" }
];

const searchBtn = document.querySelector("#siteSearchBtn");
const shareBtn = document.querySelector("#siteShareBtn");
const searchOverlay = document.querySelector("#siteSearchOverlay");
const searchClose = document.querySelector("#siteSearchClose");
const searchInput = document.querySelector("#siteSearchInput");
const searchResults = document.querySelector("#siteSearchResults");

function renderSearch(query = "") {
  if (!searchResults) return;
  const needle = query.trim().toLowerCase();
  const matches = pages.filter(page => !needle || `${page.title} ${page.desc}`.toLowerCase().includes(needle));
  searchResults.innerHTML = matches.map(page => `
    <a href="${page.url}">
      <strong>${page.title}</strong>
      <span style="display:block;color:var(--gray);font-size:0.78rem;margin-top:4px">${page.desc}</span>
    </a>
  `).join("");
}

searchBtn?.addEventListener("click", () => {
  searchOverlay?.classList.add("open");
  searchOverlay?.setAttribute("aria-hidden", "false");
  renderSearch();
  setTimeout(() => searchInput?.focus(), 50);
});

searchClose?.addEventListener("click", () => {
  searchOverlay?.classList.remove("open");
  searchOverlay?.setAttribute("aria-hidden", "true");
});

searchOverlay?.addEventListener("click", event => {
  if (event.target === searchOverlay) searchClose?.click();
});

searchInput?.addEventListener("input", () => renderSearch(searchInput.value));

shareBtn?.addEventListener("click", async () => {
  const shareData = {
    title: "RAISER Energy Corporation",
    text: "Premium solar installation, battery storage, inverter systems, and owner-managed solar services.",
    url: location.href
  };
  if (navigator.share) {
    await navigator.share(shareData).catch(() => {});
  } else {
    await navigator.clipboard?.writeText(location.href);
    shareBtn.textContent = "Copied";
    setTimeout(() => { shareBtn.textContent = "Share"; }, 1600);
  }
});

const billRange = document.querySelector("#billRange");
const areaRange = document.querySelector("#areaRange");
const billValue = document.querySelector("#billValue");
const areaValue = document.querySelector("#areaValue");
const systemSize = document.querySelector("#systemSize");
const monthlySavings = document.querySelector("#monthlySavings");
const yearlySavings = document.querySelector("#yearlySavings");

function money(value) {
  return `Rs. ${Math.round(value).toLocaleString("en-IN")}`;
}

function updateSavings() {
  if (!billRange || !areaRange) return;
  const bill = Number(billRange.value);
  const area = Number(areaRange.value);
  const suggestedKw = Math.max(2, Math.min(25, Math.round(Math.min(bill / 1200, area / 120))));
  const monthly = Math.min(bill * 0.82, suggestedKw * 1150);
  billValue.textContent = money(bill);
  areaValue.textContent = `${area.toLocaleString("en-IN")} sq.ft`;
  systemSize.textContent = `${suggestedKw}kW`;
  monthlySavings.textContent = money(monthly);
  yearlySavings.textContent = money(monthly * 12);
}

billRange?.addEventListener("input", updateSavings);
areaRange?.addEventListener("input", updateSavings);
updateSavings();
