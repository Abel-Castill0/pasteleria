const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const PRODUCTS = [
  {
    "id": "torta-flores",
    "name": "Torta Flores de Vainilla",
    "category": "tortas",
    "price": 85,
    "servings": "10–12 porciones",
    "leadTime": "48 h",
    "badge": "Más pedida",
    "description": "Bizcocho de vainilla húmedo, relleno de manjar y crema suave, acabado floral minimalista.",
    "image": "https://images.unsplash.com/photo-1613140952277-1c6bd0386ff5?auto=format&fit=crop&w=1200&q=85",
    "alt": "Torta elegante con decoración floral en tonos suaves"
  },
  {
    "id": "torta-choco-rosa",
    "name": "Torta Choco Rosa",
    "category": "tortas",
    "price": 95,
    "servings": "12–14 porciones",
    "leadTime": "48 h",
    "badge": "Signature",
    "description": "Chocolate intenso, ganache cremosa y rosetones de buttercream. Ideal para cumpleaños y celebraciones.",
    "image": "https://images.unsplash.com/photo-1584818676673-f034ea74ccfc?auto=format&fit=crop&w=1200&q=85",
    "alt": "Torta de chocolate decorada con crema rosada"
  },
  {
    "id": "cupcakes-box",
    "name": "Box de 6 Cupcakes",
    "category": "cupcakes",
    "price": 48,
    "servings": "6 unidades",
    "leadTime": "24 h",
    "badge": "Para regalar",
    "description": "Cupcakes artesanales con crema decorada. Se puede elegir hasta 2 sabores por caja.",
    "image": "https://images.unsplash.com/photo-1635211876039-7b7b53cd7514?auto=format&fit=crop&w=1200&q=85",
    "alt": "Selección de cupcakes artesanales decorados"
  },
  {
    "id": "mini-torta",
    "name": "Mini Torta Personalizada",
    "category": "tortas",
    "price": 55,
    "servings": "4–6 porciones",
    "leadTime": "48 h",
    "badge": "Nueva",
    "description": "Formato pequeño para detalles especiales. Incluye hasta 2 colores y mensaje corto.",
    "image": "https://images.unsplash.com/photo-1584818676680-44804433340c?auto=format&fit=crop&w=1200&q=85",
    "alt": "Pastel pequeño con crema rosada"
  },
  {
    "id": "brownies-box",
    "name": "Box de Brownies",
    "category": "postres",
    "price": 42,
    "servings": "9 porciones",
    "leadTime": "24 h",
    "badge": "Favorito",
    "description": "Brownies húmedos de chocolate, acabado crocante y toppings de temporada.",
    "image": "https://images.unsplash.com/photo-1623246123320-0d6636755796?auto=format&fit=crop&w=1200&q=85",
    "alt": "Postres de chocolate artesanales"
  },
  {
    "id": "cheesecake-frutos",
    "name": "Cheesecake de Frutos Rojos",
    "category": "postres",
    "price": 72,
    "servings": "8–10 porciones",
    "leadTime": "48 h",
    "badge": "Temporada",
    "description": "Cheesecake cremoso con base crocante y salsa casera de frutos rojos.",
    "image": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=85",
    "alt": "Cheesecake artesanal con frutos rojos"
  }
];

const orders = [];

function json(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function cleanText(value, max = 300) {
  return String(value ?? '').trim().replace(/[<>]/g, '').slice(0, max);
}

function validatePhone(phone) {
  return /^\+?\d[\d\s-]{7,18}$/.test(phone);
}

function makeOrderId() {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `AA-${day}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function estimatedCustomPrice(payload) {
  const baseByServings = {
    '6-8': 65, '10-12': 85, '15-18': 115,
    '20-24': 145, '25-30': 180, '30+': 220
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

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && url.pathname === '/api/products') {
    return json(res, 200, PRODUCTS);
  }

  if (req.method === 'GET' && url.pathname === '/api/availability') {
    const date = cleanText(url.searchParams.get('date'), 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return json(res, 400, { ok: false, message: 'Fecha inválida.' });
    }
    const count = orders.filter(o => o.eventDate === date && o.status !== 'cancelled').length;
    const capacity = 4;
    return json(res, 200, {
      ok: true, date,
      available: count < capacity,
      remaining: Math.max(0, capacity - count)
    });
  }

  if (req.method === 'POST' && url.pathname === '/api/orders') {
    let raw = '';
    for await (const chunk of req) raw += chunk;

    try {
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
      const order = {
        id,
        createdAt: new Date().toISOString(),
        status: 'pending_confirmation',
        type,
        eventDate,
        customer: {
          name, phone,
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
          referenceImage: null,
          estimatedPrice: estimatedCustomPrice(payload)
        } : null
      };

      if (type === 'catalog' && order.items.length === 0) {
        return json(res, 422, { ok: false, message: 'Tu carrito está vacío.' });
      }

      orders.push(order);

      return json(res, 201, {
        ok: true, id,
        status: order.status,
        estimatedPrice: order.custom?.estimatedPrice ?? null,
        message: 'Solicitud registrada. La pastelera debe confirmar disponibilidad, precio final y adelanto.'
      });
    } catch (error) {
      return json(res, 400, { ok: false, message: 'No se pudo procesar la solicitud.' });
    }
  }

  return json(res, 404, { ok: false, message: 'Ruta no encontrada.' });
};
