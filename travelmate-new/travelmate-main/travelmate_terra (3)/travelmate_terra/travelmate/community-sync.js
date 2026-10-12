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

  function photoStrip(urls) {
    if (!urls || !urls.length) return '';
    return `<div class="rv-photos" style="display:flex;gap:7px;margin-top:9px;flex-wrap:wrap">${urls.map(u =>
      `<img src="${esc(u)}" alt="" data-lightbox="${esc(u)}" style="width:68px;height:68px;border-radius:9px;object-fit:cover;cursor:pointer">`).join('')}</div>`;
  }

  function reviewCard(r, name, kind, photos) {
    return `<div class="rvcard"><div class="rvhead"><span class="avatar">${initials(name)}</span><div><b>${esc(name)}</b><br><small>${r.VisitDate ? (kind === 'Hotel' ? 'Stayed ' : 'Visited ') + fmtDate(r.VisitDate) + ' · ' : ''}Posted ${fmtDate(r.ReviewDate)}</small></div><span class="sp" style="flex:1"></span><span class="stars" style="font-size:13px">${starStr(r.Rating)}</span></div><b style="font-size:13.5px">${esc(r.Title)}</b><p style="margin:5px 0 0;font-size:13px;color:var(--ink-2);line-height:1.6">${esc(r.ReviewText)}</p>${photoStrip(photos)}<div class="actions"><span>✓ Verified ${kind === 'Hotel' ? 'stay' : 'visit'}</span><span>👍 Helpful (${r.HelpfulCount || 0})</span><span>Report</span></div></div>`;
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
    // Reviews can carry photos the author attached when writing it (reviews.photos at submit
    // time) — pull those in too, the same way a Facebook-style comment shows its own image,
    // instead of leaving them visible only in admin.html's Photos gallery.
    const photosByReview = {};
    const { data: pics, error: e4 } = await sb.from('photos').select('ReviewID,PhotoURL').in('ReviewID', ids);
    if (!e4) (pics || []).forEach(ph => { if (ph.ReviewID && ph.PhotoURL) (photosByReview[ph.ReviewID] = photosByReview[ph.ReviewID] || []).push(ph.PhotoURL); });
    return revs.map(r => ({ r, name: names[r.UserID], photos: photosByReview[r.ReviewID] || [] }));
  }

  // renders into every element on the page tagged data-reviews-for="<listingId>"
  async function renderReviewsFor(it) {
    if (!it || !it.id) return;
    const selector = '[data-reviews-for="' + it.id + '"]';
    if (!document.querySelector(selector)) return;
    const list = await fetchReviews(it);
    const hosts = document.querySelectorAll(selector); // re-query: page may have re-rendered while awaiting
    if (!hosts.length) return;
    const html = list.length ? list.map(x => reviewCard(x.r, x.name, it.kind, x.photos)).join('')
      : '<p class="hint">No reviews yet. Be the first to share your experience.</p>';
    hosts.forEach(h => { h.innerHTML = html; });
  }
  window.TMReviews = { renderFor: renderReviewsFor };

  // ================= FORUM (traveler forum board) =================
  function replyHtml(rep, name, photo) {
    const img = photo ? `<img src="${esc(photo)}" alt="" data-lightbox="${esc(photo)}" style="max-width:240px;max-height:240px;border-radius:10px;margin-top:8px;display:block;object-fit:cover;cursor:pointer">` : '';
    return `<div class="reply"><div class="rvhead"><span class="avatar">${initials(name)}</span><div><b>${esc(name)}</b><br><small>${fmtDateTime(rep.ReplyDate)}</small></div></div><p style="margin:0;font-size:13px;color:var(--ink-2);line-height:1.6">${esc(rep.ReplyText)}</p>${img}<div class="actions"><span>👍 ${rep.HelpfulCount || 0}</span><span>Reply</span></div></div>`;
  }
  function postHtml(p, name, replies, photo) {
    const img = photo ? `<img src="${esc(photo)}" alt="" data-lightbox="${esc(photo)}" style="max-width:280px;max-height:280px;border-radius:10px;margin-top:9px;display:block;object-fit:cover;cursor:pointer">` : '';
    return `<div class="post" data-pid="${esc(p.PostID)}" style="margin-bottom:13px"><div class="rvhead"><span class="avatar">${initials(name)}</span><div><b>${esc(name)}</b><br><small>${fmtDateTime(p.PostDate)}</small></div></div><p style="margin:0;font-size:14.5px;font-weight:600;line-height:1.5">${esc(p.Title)}</p><p style="margin:6px 0 0;font-size:13px;color:var(--ink-2);line-height:1.6">${esc(p.PostText)}</p>${img}<div class="actions"><span>💬 ${replies.length} repl${replies.length === 1 ? 'y' : 'ies'}</span><span>👍 Helpful (${p.HelpfulCount || 0})</span><span>Share</span><span>Report</span></div>${replies.map(x => replyHtml(x.rep, x.name, x.photo)).join('')}<div class="reply-compose" style="margin-top:14px"><div class="rp-prev-slot"></div><div class="reply-row" style="display:flex;gap:9px;align-items:center"><span class="avatar" data-me="1"></span><input class="inp" placeholder="Write a reply…" style="flex:1"><button class="btn-line btn-sm"><svg class="i"><use href="#photo"/></svg></button><button class="btn-orange btn-sm">Post</button></div></div></div>`;
  }

  // A reply's text and any picked photo only ever live in the DOM (input.value / row.dataset.ph)
  // until "Post" is clicked — loadForum() used to blow that away on every periodic/realtime
  // refresh. Capture it before re-rendering and splice it back in afterwards so an in-progress
  // draft survives a reload instead of silently vanishing (and the photo silently never getting
  // attached when Post is eventually clicked).
  function captureReplyDrafts(host) {
    const drafts = {};
    if (!host) return drafts;
    host.querySelectorAll('.post[data-pid]').forEach(post => {
      const row = post.querySelector('.reply-row');
      if (!row) return;
      const input = row.querySelector('input');
      const text = input ? input.value : '';
      const photo = row.dataset.ph || '';
      const focused = document.activeElement === input;
      if (!text && !photo && !focused) return;
      drafts[post.dataset.pid] = { text, photo, focused,
        selStart: input ? input.selectionStart : null, selEnd: input ? input.selectionEnd : null };
    });
    return drafts;
  }
  function restoreReplyDrafts(host, drafts) {
    if (!host) return;
    const posts = [...host.querySelectorAll('.post[data-pid]')];
    Object.keys(drafts).forEach(pid => {
      const post = posts.find(p => p.dataset.pid === pid);
      const row = post && post.querySelector('.reply-row');
      if (!row) return;
      const d = drafts[pid], input = row.querySelector('input');
      if (input && d.text) input.value = d.text;
      if (d.photo) {
        row.dataset.ph = d.photo;
        const slot = post.querySelector('.rp-prev-slot');
        if (slot) slot.innerHTML = `<div class="rp-prev" style="position:relative;display:inline-block;margin:0 0 8px 43px"><img src="${d.photo}" style="width:84px;height:84px;object-fit:cover;border-radius:10px;display:block;border:1px solid rgba(0,0,0,.08)"><span class="rp-x" style="position:absolute;top:-7px;right:-7px;width:20px;height:20px;border-radius:50%;background:#333;color:#fff;font-size:12px;line-height:20px;text-align:center;cursor:pointer">✕</span></div>`;
      }
      if (d.focused && input) {
        input.focus();
        if (d.selStart != null) { try { input.setSelectionRange(d.selStart, d.selEnd); } catch (e) {} }
      }
    });
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
      // pull the photo (if any) each reply was posted with, so it can render inline in the thread
      const photoByReply = {};
      const replyIds = (replies || []).map(r => r.ReplyID);
      if (replyIds.length) {
        const { data: pics, error: pe } = await sb.from('photos').select('ReplyID,PhotoURL').in('ReplyID', replyIds);
        if (!pe) (pics || []).forEach(ph => { if (ph.ReplyID && ph.PhotoURL) photoByReply[ph.ReplyID] = ph.PhotoURL; });
      }
      // and the photo (if any) attached to the discussion post itself — same idea, but these
      // rows have ReplyID null so they don't get swept up in the query above.
      const photoByPost = {};
      const postIds = posts.map(p => p.PostID);
      if (postIds.length) {
        const { data: ppics, error: ppe } = await sb.from('photos').select('PostID,PhotoURL').is('ReplyID', null).in('PostID', postIds);
        if (!ppe) (ppics || []).forEach(ph => { if (ph.PostID && ph.PhotoURL) photoByPost[ph.PostID] = ph.PhotoURL; });
      }
      const byPost = {};
      (replies || []).forEach(r => { (byPost[r.PostID] = byPost[r.PostID] || []).push({ rep: r, name: names[r.UserID], photo: photoByReply[r.ReplyID] }); });
      const host2 = document.getElementById('forum-posts'); if (!host2) return;
      const drafts = captureReplyDrafts(host2);
      host2.innerHTML = posts.length ? posts.map(p => postHtml(p, names[p.UserID], byPost[p.PostID] || [], photoByPost[p.PostID])).join('')
        : '<p class="hint">No discussions yet — be the first to start one.</p>';
      restoreReplyDrafts(host2, drafts);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, () => { clearTimeout(w); w = setTimeout(loadForum, 400); })
      .subscribe();
  }

  function init() { loadForum(); listen(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  addEventListener('focus', () => { if (!document.hidden) loadForum(); });
  setInterval(() => { if (!document.hidden) loadForum(); }, 15000);
})();