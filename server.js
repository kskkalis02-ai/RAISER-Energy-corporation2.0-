const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname);
const port = Number(process.env.PORT || 5500);
const dataFile = path.join(root, "data", "site-data.json");
const ownerEmail = process.env.OWNER_EMAIL || "owner@raiserenergy.com";
const ownerPassword = process.env.OWNER_PASSWORD || "vishal@2006";
const sessions = new Set();

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type });
  res.end(type.includes("json") ? JSON.stringify(body) : body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 2_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body ? JSON.parse(body) : {}));
    req.on("error", reject);
  });
}

function getBearer(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

async function handleApi(req, res, pathname) {
  if (pathname === "/api/owner/login" && req.method === "POST") {
    const body = await readBody(req);
    if (body.email === ownerEmail && body.password === ownerPassword) {
      const token = crypto.randomBytes(24).toString("hex");
      sessions.add(token);
      send(res, 200, { token, owner: ownerEmail });
      return;
    }
    send(res, 401, { error: "Invalid owner login" });
    return;
  }

  if (pathname === "/api/data" && req.method === "GET") {
    fs.readFile(dataFile, "utf8", (error, data) => {
      if (error) {
        send(res, 500, { error: "Unable to read site data" });
        return;
      }
      send(res, 200, JSON.parse(data));
    });
    return;
  }

  if (pathname === "/api/data" && req.method === "PUT") {
    if (!sessions.has(getBearer(req))) {
      send(res, 401, { error: "Owner login required" });
      return;
    }
    const body = await readBody(req);
    await fs.promises.mkdir(path.dirname(dataFile), { recursive: true });
    await fs.promises.writeFile(dataFile, JSON.stringify(body, null, 2), "utf8");
    send(res, 200, { ok: true });
    return;
  }

  send(res, 404, { error: "API route not found" });
}

http.createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, `http://localhost:${port}`);
    if (pathname.startsWith("/api/")) {
      await handleApi(req, res, pathname);
      return;
    }

    const safePath = path.normalize(decodeURIComponent(pathname))
      .replace(/^[/\\]+/, "")
      .replace(/^(\.\.[/\\])+/, "");
    const filePath = path.resolve(root, safePath === "" ? "index.html" : safePath);

    if (!filePath.startsWith(root + path.sep) && filePath !== root) {
      send(res, 403, "Forbidden", "text/plain; charset=utf-8");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        send(res, 404, "Not found", "text/plain; charset=utf-8");
        return;
      }
      res.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" });
      res.end(data);
    });
  } catch (error) {
    send(res, 500, { error: error.message });
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`RAISER Energy running at http://127.0.0.1:${port}/`);
  console.log(`Owner panel: http://127.0.0.1:${port}/owner-login.html`);
});
