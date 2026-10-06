(() => {
  'use strict';
  const D = window.TM_DATA; if (!D || !D.ITEMS) return;
  const ITEMS = D.ITEMS, CK = 'tm_hidden_listings', DAY = 864e5, NEW_DAYS = 14;
  const base = ITEMS.slice(), baseIds = new Set(base.map(i => i.id)), created = {}, made = {};
  let hidden = new Set(), extra = [], last = '';
  D.ALL = base.slice();
  D.created = id => created[id] || 0;
  D.isNew = id => created[id] > 0 && Date.now() - created[id] < NEW_DAYS * DAY;
  D.ago = id => { const d = Math.floor((Date.now() - created[id]) / DAY); return d < 1 ? 'today' : d === 1 ? 'yesterday' : d + ' days ago'; };
  try { hidden = new Set(JSON.parse(localStorage.getItem(CK) || '[]')); } catch (e) {}

  function apply() {
    const live = D.ALL.filter(i => !hidden.has(i.id));
    if (live.length === ITEMS.length && live.every((x, k) => x === ITEMS[k])) return false;
    ITEMS.length = 0; live.forEach(i => ITEMS.push(i));
    return true;
  }
  apply();

  const sb = window.sb; if (!sb) return;
  const nums = s => (String(s || '').replace(/,/g, '').match(/\d+(\.\d+)?/g) || []).map(Number);
  const place = addr => {
    const t = String(addr || '').toLowerCase(); let best = null, bl = 0;
    for (const k in D.PLACES) for (const al of D.PLACES[k].al) if (t.includes(al) && al.length > bl) { best = D.PLACES[k]; bl = al.length; }
    return best;
  };
  function build(kind, r) {
    const p = place(r.Address); if (!p) { console.warn('Listing sync: no known destination in address "' + r.Address + '"'); return null; }
    const o = { id: r.ListingID, kind, pl: p.k, loc: p.n, area: p.s, lat: p.lat, lng: p.lng, ph: kind === 'Hotel' ? 'city' : kind === 'Restaurant' ? 'food' : 'falls', r: 0, n: 0, blurb: r.Description || '' };
    if (kind === 'Hotel') return { ...o, name: r.HotelName, st: +r.StarRating || 3, p: +r.NightlyRate || nums(r.PriceRange)[0] || 0, free: 0, tags: String(r.Amenities || '').split(';').map(s => s.trim()).filter(Boolean) };
    if (kind === 'Restaurant') { const v = nums(r.PriceRange); return { ...o, name: r.RestaurantName, cuisine: r.CuisineType || 'Restaurant', p: v[0] || 0, hi: v[1] || v[0] || 0, r: +r.Rating || 0, tags: [r.CuisineType].filter(Boolean) }; }
    return { ...o, name: r.AttractionName, type: r.Category || 'Attraction', p: +r.EntranceFee || 0, dur: 'Flexible', r: +r.Rating || 0, tags: [r.Category].filter(Boolean) };
  }
  async function loadExtra(ids) {
    const need = ids.filter(id => !(id in made));
    if (need.length) {
      const q = [['hotels', 'Hotel'], ['restaurants', 'Restaurant'], ['attractions', 'Attraction']];
      const res = await Promise.all(q.map(([t]) => sb.from(t).select('*').in('ListingID', need)));
      res.forEach((x, k) => { if (x.error) return console.warn('Listing sync:', x.error.message); (x.data || []).forEach(r => { made[r.ListingID] = build(q[k][1], r); }); });
      need.forEach(id => { if (!(id in made)) made[id] = null; });
    }
    return ids.map(id => made[id]).filter(Boolean);
  }

  let busy = false;
  async function refresh() {
    if (busy) return; busy = true;
    try {
      let res = await sb.from('listing').select('ListingID,ListingStatus,created_at');
      if (res.error) res = await sb.from('listing').select('ListingID,ListingStatus');
      const { data, error } = res;
      if (error) { console.warn('Listing sync:', error.message); return; }
      if (!data || !data.length) return;
      const live = data.filter(r => r.ListingStatus !== 'Delisted' && r.ListingStatus !== 'Pending Review');
      const ok = new Set(live.map(r => r.ListingID));
      data.forEach(r => { created[r.ListingID] = !baseIds.has(r.ListingID) && r.created_at ? Date.parse(r.created_at) : 0; });
      extra = await loadExtra(live.map(r => r.ListingID).filter(id => !baseIds.has(id)));
      D.ALL = base.concat(extra);
      hidden = new Set(D.ALL.filter(i => !ok.has(i.id)).map(i => i.id));
      try { localStorage.setItem(CK, JSON.stringify([...hidden])); } catch (e) {}
      apply();
      const sig = ITEMS.map(i => i.id + (D.isNew(i.id) ? '*' : '')).join();
      if (sig !== last) { last = sig; window.dispatchEvent(new Event('tm:listings')); if (window.TM_REDRAW) window.TM_REDRAW(); }
    } catch (e) { }
    finally { busy = false; }
  }
  window.TMListings = { refresh };

  refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, 8000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  addEventListener('focus', refresh);
  try {
    sb.channel('tm-listing').on('postgres_changes', { event: '*', schema: 'public', table: 'listing' }, refresh).subscribe();
  } catch (e) {}
})();