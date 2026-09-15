const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https://images.unsplash.com; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://wa.me;",
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    ...headers
  });
  res.end(body);
}

function json(res, status, data) {
  send(res, status, JSON.stringify(data), { 'Content-Type': 'application/json; charset=utf-8' });
}

function readJson(file, fallback = []) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJsonAtomic(file, data) {
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2));
  fs.renameSync(temp, file);
}

function collectBody(req, maxBytes = 2_500_000) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (Buffer.byteLength(body) > maxBytes) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function cleanText(value, max = 300) {
  return String(value ?? '').trim().replace(/[<>]/g, '').slice(0, max);
}

function validatePhone(phone) {
  return /^\+?\d[\d\s-]{7,18}$/.test(phone);
}

function saveReferenceImage(dataUrl, orderId) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
  if (!match) return null;
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 1_500_000) return null;
  const filename = `${orderId}.${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

function makeOrderId() {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `AA-${day}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function estimatedCustomPrice(payload) {
  const baseByServings = {
    '6-8': 65,
    '10-12': 85,
    '15-18': 115,
    '20-24': 145,
    '25-30': 180,
    '30+': 220
  };
  let total = baseByServings[payload.servings] || 85;
  if (payload.filling === 'ganache') total += 10;
  if (payload.filling === 'frutos-rojos') total += 12;
  if (payload.coverage === 'fondant') total += 25;
  if (payload.designComplexity === 'detallado') total += 30;
  if (payload.designComplexity === 'premium') total += 55;
  if (payload.deliveryMethod === 'delivery') total += 15;
  return total;
}

async function handleApi(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/products') {
    return json(res, 200, readJson(PRODUCTS_FILE, []));
  }

  if (req.method === 'GET' && url.pathname === '/api/availability') {
    const date = cleanText(url.searchParams.get('date'), 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json(res, 400, { ok: false, message: 'Fecha inválida.' });
    const orders = readJson(ORDERS_FILE, []);
    const count = orders.filter(o => o.eventDate === date && o.status !== 'cancelled').length;
    const capacity = 4;
    return json(res, 200, { ok: true, date, available: count < capacity, remaining: Math.max(0, capacity - count) });
  }

  if (req.method === 'POST' && url.pathname === '/api/orders') {
    try {
      const raw = await collectBody(req);
      const payload = JSON.parse(raw || '{}');
      const type = payload.type === 'custom' ? 'custom' : 'catalog';
      const customer = payload.customer || {};
      const name = cleanText(customer.name, 80);
      const phone = cleanText(customer.phone, 24);
      const eventDate = cleanText(payload.eventDate, 10);

      if (name.length < 2 || !validatePhone(phone)) {
        return json(res, 422, { ok: false, message: 'Completa un nombre y teléfono válidos.' });
      }
      if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
        return json(res, 422, { ok: false, message: 'La fecha del pedido no es válida.' });
      }

      const id = makeOrderId();
      let referenceImage = null;
      if (type === 'custom') referenceImage = saveReferenceImage(payload.referenceImage, id);

      const order = {
        id,
        createdAt: new Date().toISOString(),
        status: 'pending_confirmation',
        type,
        eventDate,
        customer: {
          name,
          phone,
          email: cleanText(customer.email, 120),
          district: cleanText(customer.district, 80)
        },
        notes: cleanText(payload.notes, 600),
        deliveryMethod: cleanText(payload.deliveryMethod, 20),
        paymentMethod: cleanText(payload.paymentMethod, 30),
        items: Array.isArray(payload.items) ? payload.items.slice(0, 20).map(item => ({
          id: cleanText(item.id, 60),
          name: cleanText(item.name, 100),
          qty: Math.max(1, Math.min(20, Number(item.qty) || 1)),
          price: Math.max(0, Number(item.price) || 0)
        })) : [],
        custom: type === 'custom' ? {
          occasion: cleanText(payload.occasion, 60),
          servings: cleanText(payload.servings, 20),
          shape: cleanText(payload.shape, 40),
          flavor: cleanText(payload.flavor, 60),
          filling: cleanText(payload.filling, 60),
          coverage: cleanText(payload.coverage, 40),
          palette: cleanText(payload.palette, 120),
          cakeMessage: cleanText(payload.cakeMessage, 120),
          designComplexity: cleanText(payload.designComplexity, 40),
          budget: cleanText(payload.budget, 40),
          allergies: cleanText(payload.allergies, 300),
          referenceImage,
          estimatedPrice: estimatedCustomPrice(payload)
        } : null
      };

      if (type === 'catalog' && order.items.length === 0) {
        return json(res, 422, { ok: false, message: 'Tu carrito está vacío.' });
      }

      const orders = readJson(ORDERS_FILE, []);
      orders.push(order);
      writeJsonAtomic(ORDERS_FILE, orders);

      return json(res, 201, {
        ok: true,
        id,
        status: order.status,
        estimatedPrice: order.custom?.estimatedPrice ?? null,
        message: 'Solicitud registrada. La pastelera debe confirmar disponibilidad, precio final y adelanto.'
      });
    } catch (error) {
      if (error.message === 'PAYLOAD_TOO_LARGE') return json(res, 413, { ok: false, message: 'La imagen o solicitud es demasiado grande.' });
      return json(res, 400, { ok: false, message: 'No se pudo procesar la solicitud.' });
    }
  }

  return json(res, 404, { ok: false, message: 'Ruta no encontrada.' });
}

function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  if (!path.extname(pathname)) pathname += '.html';

  const filePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!filePath.startsWith(PUBLIC_DIR)) return send(res, 403, 'Forbidden');

  fs.readFile(filePath, (err, data) => {
    if (err) {
      const notFound = path.join(PUBLIC_DIR, '404.html');
      return fs.readFile(notFound, (nfErr, nfData) => {
        if (nfErr) return send(res, 404, '404');
        send(res, 404, nfData, { 'Content-Type': 'text/html; charset=utf-8' });
      });
    }
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
  if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { ok: false, message: 'Método no permitido.' });
  return serveStatic(req, res, url);
});

server.listen(PORT, () => {
  console.log(`Alma & Azúcar disponible en http://localhost:${PORT}`);
});
