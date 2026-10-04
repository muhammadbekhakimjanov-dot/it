(() => {
  const KEY = 'kiim_listings_v2';
  const CATEGORIES = ['Эркектер', 'Аялдар', 'Балдар', 'Сырткы кийим', 'Бут кийим', 'Спорт', 'Аксессуарлар'];
  const CONDITIONS = ['Жаңыдай', 'Абдан жакшы', 'Жакшы', 'Орточо'];
  const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28–34', '35–39', '40–46', 'Бала өлчөмү', 'Бирдей өлчөм'];
  const CITIES = ['Бишкек', 'Ош', 'Жалал-Абад', 'Каракол', 'Талас', 'Нарын', 'Баткен', 'Токмок'];

  const $ = (id) => document.getElementById(id);
  const grid = $('grid'), chips = $('chips'), dlg = $('dlg'), form = $('form');
  let activeCat = 'Бардыгы', query = '', photoData = '';

  const art = (bg, fg) => 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="${bg}"/>` +
    `<path d="M140 90l-80 60 35 55 35-20v215h140V185l35 20 35-55-80-60q-20 30-60 30t-60-30z" fill="${fg}"/></svg>`);
  const seed = () => [
    { id: 1, title: 'Кышкы куртка', price: 3200, size: 'L', condition: 'Абдан жакшы', category: 'Сырткы кийим', city: 'Бишкек', photo: art('#dfe3f2', '#1b1f3b'), desc: 'Жылуу, бир мезгил кийилген.' },
    { id: 2, title: 'Ак көйнөк', price: 900, size: 'M', condition: 'Жаңыдай', category: 'Аялдар', city: 'Ош', photo: art('#f6e7b4', '#c8102e'), desc: 'Таза, бир жолу кийилген.' },
    { id: 3, title: 'Балдар спорт костюму', price: 1100, size: 'Бала өлчөмү', condition: 'Жакшы', category: 'Балдар', city: 'Каракол', photo: art('#d6efe3', '#2b6e55'), desc: '6–8 жаштагы балага.' },
  ];

  const save = (list) => { try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch { return false; } };
  const load = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw === null) { const s = seed(); save(s); return s; }
      return JSON.parse(raw) || [];
    } catch { return []; }
  };
  let listings = load();

  const fill = (sel, items) => { sel.innerHTML = '<option value="" disabled selected>Тандаңыз</option>' + items.map(i => `<option>${i}</option>`).join(''); };
  fill(form.size, SIZES); fill(form.category, CATEGORIES); fill(form.condition, CONDITIONS); fill(form.city, CITIES);

  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => Number(n).toLocaleString('ru-RU') + ' сом';

  function renderChips() {
    chips.innerHTML = ['Бардыгы', ...CATEGORIES].map(c =>
      `<button type="button" class="chip" role="tab" aria-selected="${c === activeCat}" data-cat="${c}">${c}</button>`).join('');
  }

  function render() {
    const q = query.trim().toLowerCase();
    const shown = listings.filter(l =>
      (activeCat === 'Бардыгы' || l.category === activeCat) &&
      (!q || [l.title, l.city, l.desc, l.category, l.condition].join(' ').toLowerCase().includes(q)));
    grid.innerHTML = shown.map(l => `
      <article class="card">
        <img src="${l.photo}" alt="${esc(l.title)}" loading="lazy">
        <div class="body">
          <span class="price">${money(l.price)}</span>
          <h3>${esc(l.title)}</h3>
          <div class="meta"><span>Өлчөмү: ${esc(l.size)}</span><span>${esc(l.condition)}</span><span>${esc(l.city)}</span></div>
          ${l.desc ? `<p class="desc">${esc(l.desc)}</p>` : ''}
          <button class="sold" type="button" data-id="${l.id}">Сатылды</button>
        </div>
      </article>`).join('');
    $('count').textContent = `Жарыялар: ${shown.length}`;
    $('empty').hidden = shown.length > 0;
  }

  // Сүрөттү кичирейтип сактайбыз (localStorage көлөмү чектүү)
  function shrink(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onerror = reject;
      r.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const k = Math.min(1, 800 / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.75));
        };
        img.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }

  const showError = (msg) => { const e = $('formError'); e.textContent = msg; e.hidden = !msg; };
  $('openForm').addEventListener('click', () => { form.reset(); photoData = ''; $('preview').hidden = true; showError(''); dlg.showModal(); });
  $('cancel').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

  form.photo.addEventListener('change', async () => {
    const f = form.photo.files[0];
    if (!f) return;
    try { photoData = await shrink(f); $('preview').src = photoData; $('preview').hidden = false; showError(''); }
    catch { photoData = ''; showError('Сүрөттү окуу мүмкүн болгон жок.'); }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const title = (d.get('title') || '').trim(), price = Number(d.get('price'));
    if (!title || !(price > 0) || !d.get('size') || !d.get('category') || !d.get('condition') || !d.get('city'))
      return showError('Бардык милдеттүү талааларды толтуруңуз.');
    if (!photoData) return showError('Сүрөт жүктөңүз.');
    const item = { id: Date.now(), title, price, size: d.get('size'), condition: d.get('condition'), category: d.get('category'), city: d.get('city'), photo: photoData, desc: (d.get('desc') || '').trim() };
    const next = [item, ...listings];
    if (!save(next)) return showError('Эс тутум толду. Кичине сүрөт тандаңыз же эски жарыяны өчүрүңүз.');
    listings = next;
    activeCat = 'Бардыгы'; query = ''; $('search').value = '';
    renderChips(); render(); dlg.close();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.sold');
    if (!b || !confirm('Бул кийим сатылдыбы? Жарыя тизмеден өчөт.')) return;
    listings = listings.filter(l => String(l.id) !== b.dataset.id);
    save(listings); render();
  });
  chips.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (b) { activeCat = b.dataset.cat; renderChips(); render(); }
  });
  $('search').addEventListener('input', (e) => { query = e.target.value; render(); });

  renderChips(); render();
})();
