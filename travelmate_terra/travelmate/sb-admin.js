(() => {
  'use strict';
  const sb = window.sb, T = window.TMDB, KEY = T.KEY, TKEY = KEY + ':traffic';
  const ORDER = ['USERS','LISTING','HOTELS','RESTAURANTS','ATTRACTIONS','TRIP_PLANS','TRIP_PLAN_ITEMS','BOOKINGS','REVIEWS',
    'HOTEL_REVIEWS','RESTAURANT_REVIEWS','ATTRACTION_REVIEWS','FORUM_POSTS','PHOTOS','FORUM_REPLIES'];
  const cols = t => T.SCHEMA[t].cols.filter(c => !(t === 'USERS' && c === 'Password'));
  const tbl = t => t.toLowerCase();
  const note = (m, type) => { try { window.toast(m, type || 'bad'); } catch (e) { console.error(m); } };
  const emptyDb = () => { const d = { _log: [], _audit: [], _session: null }; T.TABLES.forEach(t => d[t] = []); return d; };
  const put = (k, v) => { const s = JSON.stringify(v); try { if (localStorage.getItem(k) !== s) localStorage.setItem(k, s); } catch (e) {} };

  let ME = null, MEP = null, SNAP = {}, AUD = new Set(), dirty = false, timer = null, chan = null, bad = new Set(), seedPending = false;
  let pq = Promise.resolve();
  const SEEDED = 'tm_catalog_seeded';
  put(KEY, emptyDb());
  try { localStorage.removeItem(TKEY); } catch (e) {}

  async function all(table, select, order) {
    let out = [], from = 0;
    for (;;) {
      const { data, error } = await sb.from(table).select(select).order(order).range(from, from + 999);
      if (error) throw error;
      out = out.concat(data); if (data.length < 1000) return out; from += 1000;
    }
  }
  const audKey = a => [a.At, a.By, a.Action, a.Target, a.Detail].join('|');

  function pull() { return (pq = pq.then(doPull).catch(() => '')); }
  function seedCatalog(db) {
    const cat = T.catalog(); let n = 0;
    if (bad.has('LISTING')) return 0;
    cat.LISTING.forEach(r => { if (!db.LISTING.some(x => x.ListingID === r.ListingID)) { db.LISTING.push({ ...r, HostUserID: ME }); n++; } });
    ['HOTELS', 'RESTAURANTS', 'ATTRACTIONS'].forEach(t => { if (bad.has(t)) return; const pk = T.SCHEMA[t].pk;
      cat[t].forEach(r => { if (!db[t].some(x => x.ListingID === r.ListingID || x[pk] === r[pk])) { db[t].push(r); n++; } }); });
    return n;
  }
  async function doPull() {
    if (!ME || dirty) return '';
    const errs = [], db = emptyDb(), snap = {}, miss = new Set(); db._log = (T.read()._log || []); db._session = ME;
    for (const t of ORDER) {
      const pk = T.SCHEMA[t].pk; let rows;
      try { rows = await all(tbl(t), cols(t).join(','), pk); }
      catch (e1) {
        try { rows = await all(tbl(t), '*', pk); }
        catch (e) { miss.add(t); errs.push(tbl(t) + ': ' + (e.message || e)); continue; }
      }
      rows = rows.map(r => cols(t).reduce((o, c) => (o[c] = r[c] === undefined ? null : r[c], o), {}));
      snap[t] = {}; rows.forEach(r => { snap[t][r[pk]] = JSON.stringify(r); });
      db[t] = t === 'USERS' ? rows.map(r => ({ ...r, Password: '' })) : rows;
    }
    try {
      const aud = await sb.from('audit_log').select('At,By,Action,Target,Detail').order('id', { ascending: false }).limit(400);
      db._audit = aud.data || []; AUD = new Set(db._audit.map(audKey));
      const [v, l, lv] = await Promise.all([
        sb.from('traffic_visits').select('At,Vid,Page,UserID').order('At', { ascending: false }).limit(5000),
        sb.from('traffic_logins').select('At,UserID,UserName,Email,Role,Result,Source').order('At', { ascending: false }).limit(1000),
        sb.from('traffic_live').select('Vid,at,Page,UserID')]);
      [v, l, lv].forEach(x => { if (x.error) errs.push(x.error.message); });
      const live = {}; (lv.data || []).forEach(r => { live[r.Vid] = { at: r.at, page: r.Page, uid: r.UserID }; });
      if (!dirty) put(TKEY, { visits: v.data || [], logins: l.data || [], live, lastSession: '' });
      sb.from('traffic_live').delete().lt('at', Date.now() - 300000).then(() => {}, () => {});
    } catch (e) { errs.push(e.message || String(e)); }
    bad = miss;
    let seeded = 0;
    try { if (!localStorage.getItem(SEEDED)) { seeded = seedCatalog(db); if (!seeded && !errs.length) localStorage.setItem(SEEDED, '1'); } } catch (e) {}
    if (MEP && !db.USERS.some(u => u.UserID === ME)) db.USERS.push({ ...MEP, Password: '' });
    if (!dirty) { SNAP = snap; put(KEY, db); }
    if (errs.length) note('Supabase could not load: ' + errs[0] + (errs.length > 1 ? ' (+' + (errs.length - 1) + ' more)' : '') + '. Run supabase-sync.sql in the SQL editor.');
    if (seeded) { seedPending = true; push(); }
    return errs.join('; ');
  }

  async function doPush() {
    const db = T.read(), errs = [];
    for (const t of ORDER) {
      if (bad.has(t)) continue;
      const pk = T.SCHEMA[t].pk, snap = SNAP[t] = SNAP[t] || {};
      for (const r of db[t]) {
        const row = cols(t).reduce((o, c) => (o[c] = r[c] === undefined ? null : r[c], o), {}), id = row[pk], js = JSON.stringify(row);
        if (!(id in snap)) {
          const { error } = await sb.from(tbl(t)).insert(row);
          error ? errs.push(t + ' ' + id + ': ' + error.message) : (snap[id] = js);
        } else if (snap[id] !== js) {
          const old = JSON.parse(snap[id]), patch = {};
          cols(t).forEach(c => { if (JSON.stringify(old[c]) !== JSON.stringify(row[c])) patch[c] = row[c]; });
          const { data, error } = await sb.from(tbl(t)).update(patch).eq(pk, id).select(pk);
          if (error) errs.push(t + ' ' + id + ': ' + error.message);
          else if (!data || !data.length) errs.push(t + ' ' + id + ': blocked by Supabase permissions or row missing (run supabase-sync.sql, then sign in again)');
          else snap[id] = js;
        }
      }
    }
    for (const t of [...ORDER].reverse()) {
      if (bad.has(t)) continue;
      const pk = T.SCHEMA[t].pk, have = new Set(db[t].map(r => String(r[pk])));
      for (const id of Object.keys(SNAP[t] || {})) if (!have.has(id)) {
        const { data, error } = await sb.from(tbl(t)).delete().eq(pk, id).select(pk);
        if (error) errs.push(t + ' ' + id + ': ' + error.message);
        else if (!data || !data.length) errs.push(t + ' ' + id + ': delete blocked by Supabase permissions (run supabase-sync.sql)');
        else delete SNAP[t][id];
      }
    }
    if (!db._audit.length && AUD.size) { await sb.from('audit_log').delete().gt('id', 0); AUD.clear(); }
    for (const a of db._audit.filter(a => !AUD.has(audKey(a))).reverse()) {
      const { error } = await sb.from('audit_log').insert({ At: a.At, By: a.By, Action: a.Action, Target: a.Target, Detail: a.Detail });
      if (!error) AUD.add(audKey(a));
    }
    if (seedPending && !errs.length) { seedPending = false; try { localStorage.setItem(SEEDED, '1'); } catch (e) {} }
    if (errs.length) note('Not saved to Supabase — ' + errs[0] + (errs.length > 1 ? ' (+' + (errs.length - 1) + ' more)' : ''));
    return errs;
  }
  function flush() {
    if (!ME) return Promise.resolve([]);
    dirty = true; clearTimeout(timer);
    const safe = pq.then(() => { dirty = false; return doPush(); }).catch(e => { note('Supabase: ' + e.message); return [e.message]; });
    pq = safe.then(() => { pull(); });
    return safe;
  }
  function push() {
    if (!ME) return;
    dirty = true; clearTimeout(timer);
    timer = setTimeout(() => {
      pq = pq.then(() => { dirty = false; return doPush(); }).catch(e => note('Supabase: ' + e.message)).then(() => { pull(); });
    }, 150);
  }

  async function profile() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return null;
    const { data, error } = await sb.from('users').select('UserID,UserName,FirstName,LastName,Email,Role').eq('auth_id', session.user.id).maybeSingle();
    if (error) throw new Error('Could not read your profile: ' + error.message);
    return data;
  }
  function listen() {
    if (chan) return;
    let w; chan = sb.channel('tm-admin').on('postgres_changes', { event: '*', schema: 'public' }, () => { clearTimeout(w); w = setTimeout(pull, 400); }).subscribe();
  }
  async function start(p) { ME = p.UserID; MEP = p; const err = await pull(); listen(); return err; }

  window.SBR = {
    pull, push, flush,
    async init() {
      let p = null; try { p = await profile(); } catch (e) { note(e.message); }
      if (p && p.Role === 'Administrator') await start(p);
      setInterval(pull, 5000); addEventListener('focus', pull);
    },
    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, error: /invalid login/i.test(error.message) ? 'Incorrect email or password.' : error.message };
      let p; try { p = await profile(); } catch (e) { await sb.auth.signOut(); return { ok: false, error: e.message }; }
      if (!p) { await sb.auth.signOut(); return { ok: false, error: 'Signed in, but this account has no row in the "users" table (auth_id does not match).' }; }
      if (p.Role !== 'Administrator') { await sb.auth.signOut(); return { ok: false, error: 'That account is a ' + p.Role + ', not an Administrator.' }; }
      await start(p); return { ok: true, user: p };
    },
    async signOut() {
      ME = null; dirty = false; clearTimeout(timer); SNAP = {}; if (chan) { sb.removeChannel(chan); chan = null; } bad = new Set();
      await sb.auth.signOut(); put(KEY, emptyDb()); try { localStorage.removeItem(TKEY); } catch (e) {}
    },
    logLogin(email, u, ok) {
      sb.from('traffic_logins').insert({ UserID: u ? u.UserID : null, UserName: u ? u.UserName : null, Email: email,
        Role: u ? u.Role : null, Result: ok ? 'success' : 'failed', Source: 'admin' }).then(() => {}, () => {});
    }
  };
})();