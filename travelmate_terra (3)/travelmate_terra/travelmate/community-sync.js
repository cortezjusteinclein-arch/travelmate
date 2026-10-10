(() => {
  'use strict';
  const sb = window.sb; if (!sb) return;

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const starStr = n => { n = Math.round(Math.max(0, Math.min(5, +n || 0))); return '★'.repeat(n) + '☆'.repeat(5 - n); };
  const initials = name => (String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('') || '?').toUpperCase();
  const fmtDate = v => { if (!v) return ''; const d = new Date(v); return isNaN(d) ? '' : d.toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' }); };
  const fmtDateTime = v => { if (!v) return ''; const d = new Date(v); return isNaN(d) ? '' : d.toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }); };

  // ---------- shared: look up display names for a batch of user ids ----------
  const profileCache = {};
  async function namesFor(ids) {
    const need = [...new Set(ids.filter(Boolean))].filter(id => !profileCache[id]);
    if (need.length) {
      const { data, error } = await sb.from('profiles_public').select('UserID,UserName').in('UserID', need);
      if (!error) (data || []).forEach(p => { profileCache[p.UserID] = p.UserName; });
    }
    const out = {}; ids.forEach(id => { out[id] = profileCache[id] || 'Traveler'; });
    return out;
  }

  // ================= REVIEWS (per listing detail page) =================
  const LINK = {
    Hotel: ['hotels', 'HotelID', 'hotel_reviews'],
    Restaurant: ['restaurants', 'RestaurantID', 'restaurant_reviews'],
    Attraction: ['attractions', 'AttractionID', 'attraction_reviews']
  };

  function reviewCard(r, name, kind) {
    return `<div class="rvcard"><div class="rvhead"><span class="avatar">${initials(name)}</span><div><b>${esc(name)}</b><br><small>${r.VisitDate ? (kind === 'Hotel' ? 'Stayed ' : 'Visited ') + fmtDate(r.VisitDate) + ' · ' : ''}Posted ${fmtDate(r.ReviewDate)}</small></div><span class="sp" style="flex:1"></span><span class="stars" style="font-size:13px">${starStr(r.Rating)}</span></div><b style="font-size:13.5px">${esc(r.Title)}</b><p style="margin:5px 0 0;font-size:13px;color:var(--ink-2);line-height:1.6">${esc(r.ReviewText)}</p><div class="actions"><span>✓ Verified ${kind === 'Hotel' ? 'stay' : 'visit'}</span><span>👍 Helpful (${r.HelpfulCount || 0})</span><span>Report</span></div></div>`;
  }

  async function fetchReviews(it) {
    const spec = LINK[it.kind]; if (!spec) return [];
    const [table, pk, linkTable] = spec;
    const { data: sub, error: e1 } = await sb.from(table).select(pk).eq('ListingID', it.id).maybeSingle();
    if (e1 || !sub) return [];
    const { data: links, error: e2 } = await sb.from(linkTable).select('ReviewID').eq(pk, sub[pk]);
    if (e2 || !links || !links.length) return [];
    const ids = links.map(l => l.ReviewID);
    const { data: revs, error: e3 } = await sb.from('reviews').select('*').in('ReviewID', ids).order('ReviewDate', { ascending: false });
    if (e3 || !revs) return [];
    const names = await namesFor(revs.map(r => r.UserID));
    return revs.map(r => ({ r, name: names[r.UserID] }));
  }

  // renders into every element on the page tagged data-reviews-for="<listingId>"
  async function renderReviewsFor(it) {
    if (!it || !it.id) return;
    const selector = '[data-reviews-for="' + it.id + '"]';
    if (!document.querySelector(selector)) return;
    const list = await fetchReviews(it);
    const hosts = document.querySelectorAll(selector); // re-query: page may have re-rendered while awaiting
    if (!hosts.length) return;
    const html = list.length ? list.map(x => reviewCard(x.r, x.name, it.kind)).join('')
      : '<p class="hint">No reviews yet. Be the first to share your experience.</p>';
    hosts.forEach(h => { h.innerHTML = html; });
  }
  window.TMReviews = { renderFor: renderReviewsFor };

  // ================= FORUM (traveler forum board) =================
  function replyHtml(rep, name) {
    return `<div class="reply"><div class="rvhead"><span class="avatar">${initials(name)}</span><div><b>${esc(name)}</b><br><small>${fmtDateTime(rep.ReplyDate)}</small></div></div><p style="margin:0;font-size:13px;color:var(--ink-2);line-height:1.6">${esc(rep.ReplyText)}</p><div class="actions"><span>👍 ${rep.HelpfulCount || 0}</span><span>Reply</span></div></div>`;
  }
  function postHtml(p, name, replies) {
    return `<div class="post" data-pid="${esc(p.PostID)}" style="margin-bottom:13px"><div class="rvhead"><span class="avatar">${initials(name)}</span><div><b>${esc(name)}</b><br><small>${fmtDateTime(p.PostDate)}</small></div></div><p style="margin:0;font-size:14.5px;font-weight:600;line-height:1.5">${esc(p.Title)}</p><p style="margin:6px 0 0;font-size:13px;color:var(--ink-2);line-height:1.6">${esc(p.PostText)}</p><div class="actions"><span>💬 ${replies.length} repl${replies.length === 1 ? 'y' : 'ies'}</span><span>👍 Helpful (${p.HelpfulCount || 0})</span><span>Share</span><span>Report</span></div>${replies.map(x => replyHtml(x.rep, x.name)).join('')}<div style="display:flex;gap:9px;margin-top:14px;align-items:center"><span class="avatar" data-me="1"></span><input class="inp" placeholder="Write a reply…" style="flex:1"><button class="btn-line btn-sm"><svg class="i"><use href="#photo"/></svg></button><button class="btn-orange btn-sm">Post</button></div></div>`;
  }

  let loading = false, pending = false;
  async function loadForum() {
    const host = document.getElementById('forum-posts');
    if (!host) return;
    if (loading) { pending = true; return; }
    loading = true;
    try {
      const { data: posts, error } = await sb.from('forum_posts').select('*').order('PostDate', { ascending: false }).limit(100);
      if (error || !posts) return;
      const { data: replies } = await sb.from('forum_replies').select('*').order('ReplyDate', { ascending: true });
      const names = await namesFor([...posts.map(p => p.UserID), ...((replies || []).map(r => r.UserID))]);
      const byPost = {};
      (replies || []).forEach(r => { (byPost[r.PostID] = byPost[r.PostID] || []).push({ rep: r, name: names[r.UserID] }); });
      const host2 = document.getElementById('forum-posts'); if (!host2) return;
      host2.innerHTML = posts.length ? posts.map(p => postHtml(p, names[p.UserID], byPost[p.PostID] || [])).join('')
        : '<p class="hint">No discussions yet — be the first to start one.</p>';
      window.TMForumFilterReset && window.TMForumFilterReset();
    } finally {
      loading = false;
      if (pending) { pending = false; loadForum(); }
    }
  }
  window.TMForum = { reload: loadForum };

  let chan;
  function listen() {
    if (chan) return;
    let w;
    chan = sb.channel('tm-community')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_posts' }, () => { clearTimeout(w); w = setTimeout(loadForum, 400); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_replies' }, () => { clearTimeout(w); w = setTimeout(loadForum, 400); })
      .subscribe();
  }

  function init() { loadForum(); listen(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  addEventListener('focus', () => { if (!document.hidden) loadForum(); });
  setInterval(() => { if (!document.hidden) loadForum(); }, 15000);
})();