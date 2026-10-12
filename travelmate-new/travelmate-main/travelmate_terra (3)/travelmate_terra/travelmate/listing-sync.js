(() => {
  'use strict';
  const D = window.TM_DATA; if (!D || !D.ITEMS) return;
  const ITEMS = D.ITEMS, CK = 'tm_hidden_listings';
  D.ALL = ITEMS.slice();
  D.ALL.forEach(i => { i.r = 0; i.n = 0; }); // data.js ships demo rating/review numbers; start from "no reviews" and fill in real ones below
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
  const baseIds = new Set(D.ALL.map(i => i.id)); // ids that come from the static data.js catalog
  const extraCache = {}; // ListingID -> item object, for listings hosts submitted through the site

  async function fetchExtra(lid, kind) {
    const table = kind === 'Hotel' ? 'hotels' : kind === 'Restaurant' ? 'restaurants' : 'attractions';
    const { data, error } = await sb.from(table).select('*').eq('ListingID', lid).maybeSingle();
    if (error || !data) return null;
    const photo = /^(data:image\/|https?:\/\/)/.test(data.ImageURL || '') ? data.ImageURL : '';
    const base = { id: lid, kind, loc: data.Address || '', c: 'Philippines', area: data.Address || '', photo,
      lat: 14.5995 + (Math.random() - 0.5) * 0.3, lng: 120.9842 + (Math.random() - 0.5) * 0.3, r: Number(data.Rating) || 0, n: 0 };
    if (kind === 'Hotel') return { ...base, ph: 'city', name: data.HotelName, tags: (data.Amenities || '').split(';').filter(Boolean),
      blurb: data.Description || '', st: Number(data.StarRating) || 3, p: Number(data.NightlyRate) || 0, free: 0 };
    if (kind === 'Restaurant') return { ...base, ph: 'food', name: data.RestaurantName, tags: [data.CuisineType].filter(Boolean),
      blurb: '', cuisine: data.CuisineType || 'Other', p: 0, hi: 0 };
    return { ...base, kind: 'Attraction', ph: 'city', name: data.AttractionName, tags: [data.Category].filter(Boolean),
      blurb: data.Description || '', type: data.Category || 'Other', p: Number(data.EntranceFee) || 0, dur: '' };
  }

  // Recompute each listing's rating/review count from the actual reviews people have published,
  // instead of the placeholder numbers baked into data.js. A listing with no reviews gets r:0,n:0
  // so the UI can show "No reviews yet" rather than a made-up rating.
  async function fetchRatings() {
    try {
      const [rv, hr, rr, ar, hs, rs, as_] = await Promise.all([
        sb.from('reviews').select('ReviewID,Rating'),
        sb.from('hotel_reviews').select('ReviewID,HotelID'),
        sb.from('restaurant_reviews').select('ReviewID,RestaurantID'),
        sb.from('attraction_reviews').select('ReviewID,AttractionID'),
        sb.from('hotels').select('HotelID,ListingID'),
        sb.from('restaurants').select('RestaurantID,ListingID'),
        sb.from('attractions').select('AttractionID,ListingID')
      ]);
      if (rv.error || hr.error || rr.error || ar.error || hs.error || rs.error || as_.error) return false;
      const ratingOf = {}; (rv.data || []).forEach(r => { ratingOf[r.ReviewID] = Number(r.Rating) || 0; });
      const lidOf = {};
      (hs.data || []).forEach(h => { lidOf['H' + h.HotelID] = h.ListingID; });
      (rs.data || []).forEach(r => { lidOf['R' + r.RestaurantID] = r.ListingID; });
      (as_.data || []).forEach(a => { lidOf['A' + a.AttractionID] = a.ListingID; });
      const agg = {};
      const add = (lid, rid) => { if (!lid || !(rid in ratingOf)) return; const a = agg[lid] || (agg[lid] = { sum: 0, n: 0 }); a.sum += ratingOf[rid]; a.n++; };
      (hr.data || []).forEach(x => add(lidOf['H' + x.HotelID], x.ReviewID));
      (rr.data || []).forEach(x => add(lidOf['R' + x.RestaurantID], x.ReviewID));
      (ar.data || []).forEach(x => add(lidOf['A' + x.AttractionID], x.ReviewID));
      let changed = false;
      D.ALL.forEach(i => {
        const a = agg[i.id], r = a ? Math.round((a.sum / a.n) * 10) / 10 : 0, n = a ? a.n : 0;
        if (i.r !== r || i.n !== n) { i.r = r; i.n = n; changed = true; }
      });
      return changed;
    } catch (e) { return false; }
  }

  // Pick up cover-photo changes for EVERY listing (including ones from the static data.js
  // catalog), not just host-submitted ones — admin.html can now set a real ImageURL on any
  // listing, and this is what carries that back into item.photo for display here.
  async function fetchPhotos() {
    try {
      const [hs, rs, as_] = await Promise.all([
        sb.from('hotels').select('ListingID,ImageURL'),
        sb.from('restaurants').select('ListingID,ImageURL'),
        sb.from('attractions').select('ListingID,ImageURL')
      ]);
      if (hs.error || rs.error || as_.error) return false;
      const urlOf = {};
      [...(hs.data || []), ...(rs.data || []), ...(as_.data || [])].forEach(r => {
        if (r.ListingID && /^(data:image\/|https?:\/\/)/.test(r.ImageURL || '')) urlOf[r.ListingID] = r.ImageURL;
      });
      let changed = false;
      D.ALL.forEach(i => {
        const u = urlOf[i.id];
        if (u && i.photo !== u) { i.photo = u; changed = true; }
      });
      return changed;
    } catch (e) { return false; }
  }

  async function refresh() {
    if (busy) return; busy = true;
    try {
      const { data, error } = await sb.from('listing').select('ListingID,ListingStatus,Category');
      if (error) { console.warn('Listing sync:', error.message); return; }
      if (!data || !data.length) return;
      const ok = new Set(data.filter(r => r.ListingStatus !== 'Delisted' && r.ListingStatus !== 'Pending Review').map(r => r.ListingID));
      const known = new Set(data.map(r => r.ListingID));
      hidden = new Set(D.ALL.filter(i => !ok.has(i.id) && !(i.intl && !known.has(i.id))).map(i => i.id));
      try { localStorage.setItem(CK, JSON.stringify([...hidden])); } catch (e) {}
      // pick up listings hosts submitted on the site (not in the static catalog) once they're approved
      const extras = data.filter(r => ok.has(r.ListingID) && !baseIds.has(r.ListingID) && !extraCache[r.ListingID]);
      if (extras.length) {
        const fetched = await Promise.all(extras.map(r => fetchExtra(r.ListingID, r.Category)));
        fetched.forEach((item, k) => { if (item) { extraCache[extras[k].ListingID] = item; baseIds.add(item.id); D.ALL.push(item); } });
      }
      const listingsChanged = apply();
      const ratingsChanged = await fetchRatings();
      const photosChanged = await fetchPhotos();
      if (listingsChanged || ratingsChanged || photosChanged) { window.dispatchEvent(new Event('tm:listings')); if (window.TM_REDRAW) window.TM_REDRAW(); }
    } catch (e) { }
    finally { busy = false; }
  }
  window.TMListings = { refresh };

  refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, 8000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  addEventListener('focus', refresh);
  try {
    let ch = sb.channel('tm-listing').on('postgres_changes', { event: '*', schema: 'public', table: 'listing' }, refresh);
    ['reviews', 'hotel_reviews', 'restaurant_reviews', 'attraction_reviews', 'hotels', 'restaurants', 'attractions'].forEach(t => {
      ch = ch.on('postgres_changes', { event: '*', schema: 'public', table: t }, refresh);
    });
    ch.subscribe();
  } catch (e) {}
})();