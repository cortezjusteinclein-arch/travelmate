(() => {
  'use strict';
  const D = window.TM_DATA; if (!D || !D.ITEMS) return;
  const ITEMS = D.ITEMS, CK = 'tm_hidden_listings';
  D.ALL = ITEMS.slice();
  let hidden = new Set();
  try { hidden = new Set(JSON.parse(localStorage.getItem(CK) || '[]')); } catch (e) {}

  function apply() {
    const live = D.ALL.filter(i => !hidden.has(i.id));
    if (live.length === ITEMS.length && live.every((x, k) => x === ITEMS[k])) return false;
    ITEMS.length = 0; live.forEach(i => ITEMS.push(i));
    return true;
  }
  apply();

  const sb = window.sb; if (!sb) return;
  let busy = false;
  async function refresh() {
    if (busy) return; busy = true;
    try {
      const { data, error } = await sb.from('listing').select('ListingID,ListingStatus');
      if (error) { console.warn('Listing sync:', error.message); return; }
      if (!data || !data.length) return;
      const ok = new Set(data.filter(r => r.ListingStatus !== 'Delisted' && r.ListingStatus !== 'Pending Review').map(r => r.ListingID));
      const known = new Set(data.map(r => r.ListingID));
      hidden = new Set(D.ALL.filter(i => !ok.has(i.id) && !(i.intl && !known.has(i.id))).map(i => i.id));
      try { localStorage.setItem(CK, JSON.stringify([...hidden])); } catch (e) {}
      if (apply()) { window.dispatchEvent(new Event('tm:listings')); if (window.TM_REDRAW) window.TM_REDRAW(); }
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