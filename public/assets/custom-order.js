const form = document.querySelector('[data-custom-form]');
const steps = [...document.querySelectorAll('.form-step')];
let current = 0;
let referenceImage = null;

const labels = {
  occasion: {'cumpleanos':'Cumpleaños','aniversario':'Aniversario','baby-shower':'Baby shower','boda':'Boda / civil','corporativo':'Corporativo','otro':'Otra ocasión'},
  servings: {'6-8':'6–8','10-12':'10–12','15-18':'15–18','20-24':'20–24','25-30':'25–30','30+':'30+'},
  flavor: {'vainilla':'Vainilla','chocolate':'Chocolate','red-velvet':'Red velvet','limon':'Limón','zanahoria':'Zanahoria'},
  filling: {'manjar':'Manjar','ganache':'Ganache','frutos-rojos':'Frutos rojos','crema-vainilla':'Crema de vainilla'},
  coverage: {'buttercream':'Buttercream','chantilly':'Chantilly estabilizada','fondant':'Fondant'},
  designComplexity: {'simple':'Minimalista','detallado':'Detallado','premium':'Premium / modelado'}
};

function selected(name) {
  return form?.querySelector(`[name="${name}"]:checked`)?.value || form?.elements[name]?.value || '';
}
function labelFor(name, value) { return labels[name]?.[value] || value || '—'; }

function calculateEstimate() {
  const servings = selected('servings');
  const bases = {'6-8':65,'10-12':85,'15-18':115,'20-24':145,'25-30':180,'30+':220};
  let total = bases[servings] || 85;
  if (selected('filling') === 'ganache') total += 10;
  if (selected('filling') === 'frutos-rojos') total += 12;
  if (selected('coverage') === 'fondant') total += 25;
  if (selected('designComplexity') === 'detallado') total += 30;
  if (selected('designComplexity') === 'premium') total += 55;
  if (selected('deliveryMethod') === 'delivery') total += 15;
  return total;
}

function updateSummary() {
  const map = {
    occasion: labelFor('occasion', selected('occasion')),
    servings: labelFor('servings', selected('servings')),
    flavor: labelFor('flavor', selected('flavor')),
    filling: labelFor('filling', selected('filling')),
    date: form?.elements.eventDate?.value || 'Por definir'
  };
  Object.entries(map).forEach(([key,value]) => {
    const el = document.querySelector(`[data-summary-${key}]`); if (el) el.textContent = value || '—';
  });
  const price = document.querySelector('[data-estimate]');
  if (price) price.textContent = money(calculateEstimate());
}

function validateStep(index) {
  const fields = steps[index].querySelectorAll('input, select, textarea');
  for (const field of fields) {
    if (!field.checkValidity()) { field.reportValidity(); return false; }
  }
  const requiredGroups = steps[index].querySelectorAll('[data-required-group]');
  for (const group of requiredGroups) {
    const name = group.dataset.requiredGroup;
    if (!selected(name)) {
      group.scrollIntoView({behavior:'smooth',block:'center'});
      group.style.boxShadow = '0 0 0 3px rgba(158,103,91,.16)';
      setTimeout(() => group.style.boxShadow = '', 900);
      return false;
    }
  }
  return true;
}

function showStep(index) {
  current = Math.max(0, Math.min(steps.length - 1, index));
  steps.forEach((step, i) => step.classList.toggle('active', i === current));
  document.querySelectorAll('.progress-dot').forEach((dot,i) => dot.classList.toggle('active', i <= current));
  document.querySelector('[data-prev]').style.visibility = current === 0 ? 'hidden' : 'visible';
  document.querySelector('[data-next]').style.display = current === steps.length - 1 ? 'none' : 'inline-flex';
  document.querySelector('[data-submit]').style.display = current === steps.length - 1 ? 'inline-flex' : 'none';
  document.querySelector('.form-card')?.scrollIntoView({behavior:'smooth',block:'start'});
  updateSummary();
}

const minDate = new Date();
minDate.setDate(minDate.getDate() + Number(CONFIG.minCustomLeadDays || 3));
if (form?.elements.eventDate) form.elements.eventDate.min = minDate.toISOString().slice(0,10);

document.querySelector('[data-next]')?.addEventListener('click', () => { if (validateStep(current)) showStep(current + 1); });
document.querySelector('[data-prev]')?.addEventListener('click', () => showStep(current - 1));
form?.addEventListener('input', updateSummary);
form?.addEventListener('change', updateSummary);

const upload = document.querySelector('#referenceImage');
upload?.addEventListener('change', () => {
  const file = upload.files?.[0];
  const preview = document.querySelector('[data-upload-preview]');
  const note = document.querySelector('[data-upload-note]');
  referenceImage = null;
  preview?.classList.remove('visible');
  if (!file) return;
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { note.textContent = 'Formato no permitido. Usa JPG, PNG o WEBP.'; upload.value=''; return; }
  if (file.size > 1_500_000) { note.textContent = 'La imagen debe pesar menos de 1.5 MB.'; upload.value=''; return; }
  const reader = new FileReader();
  reader.onload = () => { referenceImage = reader.result; preview.src = reader.result; preview.classList.add('visible'); note.textContent = file.name; };
  reader.readAsDataURL(file);
});

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!validateStep(current)) return;
  const alert = document.querySelector('[data-custom-alert]');
  const fd = new FormData(form);
  const payload = {
    type: 'custom',
    eventDate: fd.get('eventDate'),
    occasion: fd.get('occasion'),
    servings: fd.get('servings'),
    shape: fd.get('shape'),
    flavor: fd.get('flavor'),
    filling: fd.get('filling'),
    coverage: fd.get('coverage'),
    palette: fd.get('palette'),
    cakeMessage: fd.get('cakeMessage'),
    designComplexity: fd.get('designComplexity'),
    budget: fd.get('budget'),
    allergies: fd.get('allergies'),
    deliveryMethod: fd.get('deliveryMethod'),
    notes: fd.get('notes'),
    referenceImage,
    customer: { name: fd.get('name'), phone: fd.get('phone'), email: fd.get('email'), district: fd.get('district') }
  };
  alert.className = 'alert';
  const submit = document.querySelector('[data-submit]');
  submit.disabled = true; submit.textContent = 'Registrando…';
  try {
    const response = await fetch('/api/orders', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'No se pudo registrar la solicitud.');
    alert.textContent = `Solicitud ${result.id} registrada correctamente. Abriendo WhatsApp…`;
    alert.className = 'alert success visible';
    const msg = `Hola, registré la solicitud personalizada ${result.id} en la web.\n\nOcasión: ${labelFor('occasion',payload.occasion)}\nFecha: ${payload.eventDate}\nPorciones: ${labelFor('servings',payload.servings)}\nSabor: ${labelFor('flavor',payload.flavor)}\nRelleno: ${labelFor('filling',payload.filling)}\nCobertura: ${labelFor('coverage',payload.coverage)}\nDiseño: ${labelFor('designComplexity',payload.designComplexity)}\nEstimado web: ${money(result.estimatedPrice)}\n\nEntiendo que el precio y la fecha quedan sujetos a confirmación.`;
    setTimeout(() => window.open(waLink(msg), '_blank', 'noopener'), 700);
  } catch (error) {
    alert.textContent = error.message;
    alert.className = 'alert error visible';
  } finally {
    submit.disabled = false; submit.textContent = 'Enviar solicitud';
  }
});

showStep(0);
