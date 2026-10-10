(() => {
  const sb = window.sb;
  const fail = (m, status) => Object.assign(new Error(m), { status });
  const iso = v => { const d = new Date(v); return !v || isNaN(d) ? '' :
    d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const shapeUser = p => ({ id: p.UserID, first: p.FirstName, last: p.LastName, display: p.UserName,
    email: p.Email, role: p.Role, registered: p.DateRegistered });

  async function me() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) throw fail('Please log in.', 401);
    const { data, error } = await sb.from('users').select('*').eq('auth_id', session.user.id).maybeSingle();
    if (error) throw fail(error.message, 500);
    if (!data) throw fail('Your account profile was not found. Please log in again.', 401);
    return { session, profile: data };
  }
  const rnd = n => String(Math.floor(Math.random() * 10 ** n)).padStart(n, '0');
  const listingId = name => { const D = window.TM_DATA || {}; const it = (D.ALL || D.ITEMS || []).find(i => i.name === name); return it ? it.id : null; };
  const bookingOut = r => ({ id: r.BookingID, userId: r.UserID, name: r.ListingID, a: r.CheckInDate, b: r.CheckOutDate,
    g: r.NumGuests, total: r.TotalPrice, status: r.BookingStatus, created: r.created_at });

  const routes = {
    async 'POST /api/register'(b) {
      const em = String(b.email || '').trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(em)) throw fail('Enter a valid email address.', 400);
      if (!b.first || !b.last) throw fail('Enter your first and last name.', 400);
      if (!/^[\w.]{3,20}$/.test(b.display || '')) throw fail('Display name: 3–20 letters, numbers, _ or .', 400);
      if (!b.password || b.password.length < 8 || !/\d/.test(b.password)) throw fail('Password needs 8+ characters and a number.', 400);
      const taken = await sb.rpc('display_taken', { n: b.display });
      if (taken.data === true) throw fail('That display name is taken.', 409);
      const { data, error } = await sb.auth.signUp({ email: em, password: b.password,
        options: { data: { first: b.first.trim(), last: b.last.trim(), display: b.display.trim() } } });
      if (error) throw fail(/registered|exists/i.test(error.message) ? 'That email is already registered. Try logging in.' : error.message, 409);
      if (!data.session) throw fail('Account created. Check your email to confirm it, then log in.', 202);
      const { profile } = await me();
      window.TMTrack && TMTrack.login(profile);
      return { token: data.session.access_token, user: shapeUser(profile) };
    },
    async 'POST /api/login'(b) {
      const em = String(b.email || '').trim().toLowerCase();
      const { data, error } = await sb.auth.signInWithPassword({ email: em, password: String(b.password || '') });
      if (error) {
        window.TMTrack && TMTrack.failed(em);
        console.error('Supabase sign-in error:', error.status, error.message);
        const msg = /email not confirmed/i.test(error.message) ? 'Please confirm your email before logging in.'
          : /invalid login credentials/i.test(error.message) ? 'Incorrect email or password.'
          : error.message;
        throw fail(msg, 401);
      }
      const { profile } = await me();
      window.TMTrack && TMTrack.login(profile);
      return { token: data.session.access_token, user: shapeUser(profile) };
    },
    async 'POST /api/oauth'() {
      let r; try { r = await me(); } catch (e) { await new Promise(x => setTimeout(x, 900)); r = await me(); }
      window.TMTrack && TMTrack.login(r.profile);
      return { token: r.session.access_token, user: shapeUser(r.profile) };
    },
    async 'POST /api/logout'() { await sb.auth.signOut(); return { ok: true }; },
    async 'GET /api/me'() { return shapeUser((await me()).profile); },
    async 'POST /api/bookings'(b) {
      const { profile } = await me();
      if (!b.name || !b.kind) throw fail('Missing booking details.', 400);
      const row = { UserID: profile.UserID, ListingID: listingId(b.name), CheckInDate: iso(b.a), CheckOutDate: iso(b.b),
        NumGuests: Number(b.g) || 1, TotalPrice: Number(b.total) || 0, BookingStatus: b.status || 'Confirmed',
        PaymentRef: b.ref || 'tok_' + Math.random().toString(16).slice(2, 10) };
      const { data, error } = await sb.from('bookings').insert(row).select('BookingID').single();
      if (error) throw fail(error.message, 500);
      return { id: data.BookingID };
    },
    async 'GET /api/trip'() {
      const { profile } = await me();
      const { data: t, error } = await sb.from('trip_plans').select('*').eq('UserID', profile.UserID).limit(1).maybeSingle();
      if (error) throw fail(error.message, 500);
      if (!t) return null;
      const { data: items, error: e2 } = await sb.from('trip_plan_items').select('*').eq('TripID', t.TripID).order('StartTime');
      if (e2) throw fail(e2.message, 500);
      const days = { 1: [], 2: [], 3: [] };
      items.forEach(r => {
        const n = r.Notes || '', d = Number((/^Day (\d)/.exec(n) || [])[1]) || 1, c = /₱([\d,]+)/.exec(n), tm = /(\d\d:\d\d)/.exec(n);
        (days[d] || days[1]).push({ name: r.ItemName, type: r.ItemType, time: tm ? tm[1] : '09:00', cost: c ? Number(c[1].replace(/,/g, '')) : 0 });
      });
      return { name: t.TripName, days };
    },
    async 'PUT /api/trip'(b) {
      const { profile } = await me();
      const days = b.days || {}, start = iso(b.start) || iso(new Date());
      const dayDate = d => { const x = new Date(start + 'T00:00'); x.setDate(x.getDate() + d - 1); return iso(x); };
      const last = [1, 2, 3].filter(d => (days[d] || []).length).pop() || 1;
      const head = { TripName: String(b.name || 'My trip').slice(0, 100), StartTime: dayDate(1), EndTime: dayDate(last) };
      const found = await sb.from('trip_plans').select('TripID').eq('UserID', profile.UserID).limit(1).maybeSingle();
      if (found.error) throw fail(found.error.message, 500);
      let id = found.data && found.data.TripID, res;
      if (id) res = await sb.from('trip_plans').update(head).eq('TripID', id);
      else { id = 'T' + rnd(6); res = await sb.from('trip_plans').insert({ TripID: id, UserID: profile.UserID, ...head, Notes: '', TripStatus: 'Draft' }); }
      if (res.error) throw fail(res.error.message, 500);
      res = await sb.from('trip_plan_items').delete().eq('TripID', id);
      if (res.error) throw fail(res.error.message, 500);
      const rows = [];
      [1, 2, 3].forEach(d => (days[d] || []).forEach(s => rows.push({ ItemID: 'I' + rnd(7), TripID: id, ItemType: s.type, ItemName: s.name,
        StartTime: dayDate(d) + 'T' + (s.time || '09:00'), EndTime: null, Notes: 'Day ' + d + ' · ' + (s.time || '09:00') + ' · ₱' + (s.cost || 0),
        ListingID: s.type === 'Custom' ? null : listingId(s.name) })));
      if (rows.length) { res = await sb.from('trip_plan_items').insert(rows); if (res.error) throw fail(res.error.message, 500); }
      return { ok: true, id };
    },
    async 'GET /api/bookings'() {
      const { profile } = await me();
      const { data, error } = await sb.from('bookings').select('*').eq('UserID', profile.UserID).order('created_at');
      if (error) throw fail(error.message, 500);
      return data.map(bookingOut);
    },
    async 'PATCH /api/bookings'(b, id) {
      if (!['Cancelled', 'Completed'].includes(b.status)) throw fail('Invalid status.', 400);
      const { profile } = await me();
      const { data, error } = await sb.from('bookings').update({ BookingStatus: b.status })
        .eq('BookingID', id).eq('UserID', profile.UserID).select('BookingID');
      if (error) throw fail(error.message, 500);
      if (!data.length) throw fail('Not found.', 404);
      return { ok: true };
    },
    async 'POST /api/reviews'(b) {
      const { profile } = await me();
      const rating = Number(b.rating) || 0;
      if (!b.title || !b.body || rating < 1 || rating > 5) throw fail('Missing review details.', 400);
      const id = b.id || 'RV' + rnd(7);
      const row = { ReviewID: id, UserID: profile.UserID, BookingID: b.bookingId || null,
        Rating: rating, Title: b.title, ReviewText: b.body, VisitDate: iso(b.visitDate) || null,
        HelpfulCount: 0, Flagged: false };
      let res = await sb.from('reviews').insert(row);
      if (res.error) throw fail(res.error.message, 500);
      const subTable = b.kind === 'Hotel' ? 'hotels' : b.kind === 'Restaurant' ? 'restaurants' : b.kind === 'Attraction' ? 'attractions' : null;
      const subPk = b.kind === 'Hotel' ? 'HotelID' : b.kind === 'Restaurant' ? 'RestaurantID' : 'AttractionID';
      const linkTable = b.kind === 'Hotel' ? 'hotel_reviews' : b.kind === 'Restaurant' ? 'restaurant_reviews' : 'attraction_reviews';
      if (subTable && b.listingId) {
        const found = await sb.from(subTable).select(subPk).eq('ListingID', b.listingId).maybeSingle();
        if (!found.error && found.data) await sb.from(linkTable).insert({ ReviewID: id, [subPk]: found.data[subPk] });
      }
      if (Array.isArray(b.photos) && b.photos.length) {
        const rows2 = b.photos.slice(0, 8).filter(Boolean).map((url, k) => ({ PhotoID: 'PH' + rnd(7) + k,
          UserID: profile.UserID, PostID: null, ReviewID: id, PhotoURL: url, Caption: '', Skin: null }));
        if (rows2.length) { const pr = await sb.from('photos').insert(rows2); if (pr.error) console.warn('photo upload:', pr.error.message); }
      }
      return { id };
    },
    async 'POST /api/forumposts'(b) {
      const { profile } = await me();
      if (!b.title || !b.body) throw fail('Missing post details.', 400);
      const id = b.id || 'FP' + rnd(7);
      const { error } = await sb.from('forum_posts').insert({ PostID: id, UserID: profile.UserID,
        Title: b.title, PostText: b.body, HelpfulCount: 0, Flagged: false });
      if (error) throw fail(error.message, 500);
      return { id };
    },
    async 'POST /api/forumreplies'(b) {
      const { profile } = await me();
      if (!b.postId || !b.body) throw fail('Missing reply details.', 400);
      const id = b.id || 'FR' + rnd(7);
      const { error } = await sb.from('forum_replies').insert({ ReplyID: id, PostID: b.postId,
        UserID: profile.UserID, ReplyText: b.body, ParentMessageID: b.parentId || null, HelpfulCount: 0 });
      if (error) throw fail(error.message, 500);
      if (b.photo) {
        // ReplyID so the forum thread can show this photo on the exact reply it was attached to,
        // PostID kept too so admin's per-post photo counts keep working.
        const pr = await sb.from('photos').insert({ PhotoID: 'PH' + rnd(7), UserID: profile.UserID,
          PostID: b.postId, ReplyID: id, ReviewID: null, PhotoURL: b.photo, Caption: '', Skin: null });
        if (pr.error) console.warn('photo upload:', pr.error.message);
      }
      return { id };
    },
    async 'POST /api/listings'(b) {
      const { profile } = await me();
      if (!b.name) throw fail('Give your listing a name.', 400);
      const kind = ['Hotel', 'Restaurant', 'Attraction'].includes(b.kind) ? b.kind : 'Hotel';
      const lid = 'L' + rnd(6);
      b.photo = b.photo || b.photoName || '';
      let res = await sb.from('listing').insert({ ListingID: lid, Category: kind, ListingStatus: 'Pending Review', HostUserID: profile.UserID });
      if (res.error) throw fail(res.error.message, 500);
      const nums = String(b.price || '').match(/[\d,]+/g) || [];
      const lo = nums[0] ? Number(nums[0].replace(/,/g, '')) : 0, hi = nums[1] ? Number(nums[1].replace(/,/g, '')) : lo;
      let subTable, subRow;
      if (kind === 'Hotel') {
        subTable = 'hotels';
        subRow = { HotelID: 'H' + rnd(6), ListingID: lid, HotelName: b.name, StarRating: Number(b.star) || 3,
          PriceRange: b.price || '', NightlyRate: lo, Description: b.desc || '', Amenities: b.amenities || '',
          ImageURL: b.photo || '', ContactInfo: b.contact || '', Address: b.address || '' };
      } else if (kind === 'Restaurant') {
        subTable = 'restaurants';
        subRow = { RestaurantID: 'R' + rnd(6), ListingID: lid, RestaurantName: b.name, CuisineType: b.cuisine || 'Other',
          PriceRange: (b.price || '') + (hi ? ' (₱' + lo + '–₱' + hi + ')' : ''), Address: b.address || '', Rating: 0, ImageURL: b.photo || '' };
      } else {
        subTable = 'attractions';
        subRow = { AttractionID: 'A' + rnd(6), ListingID: lid, AttractionName: b.name, Category: b.type || 'Other',
          Address: b.address || '', Description: b.desc || '', ImageURL: b.photo || '', Rating: 0, EntranceFee: lo };
      }
      const subRes = await sb.from(subTable).insert(subRow);
      if (subRes.error) { await sb.from('listing').delete().eq('ListingID', lid); throw fail(subRes.error.message, 500); }
      // also track the cover photo in the shared photos table, so it shows up alongside
      // review/forum photos (e.g. in the admin Photos gallery) instead of only living on the listing row
      if (/^(data:image\/|https?:\/\/)/.test(b.photo || '')) {
        const pr = await sb.from('photos').insert({ PhotoID: 'PH' + rnd(7), UserID: profile.UserID, PostID: null,
          ReviewID: null, ListingID: lid, PhotoURL: b.photo, Caption: b.name || '', Skin: null });
        if (pr.error) console.warn('photo upload:', pr.error.message);
      }
      return { id: lid };
    }
  };

  window.API = {
    token: () => localStorage.getItem('tm_token') || '',
    async call(method, url, body) {
      const m = url.match(/^(\/api\/\w+)(?:\/([\w-]+))?$/);
      const h = m && routes[method + ' ' + m[1]];
      if (!h) throw fail('Unknown request: ' + method + ' ' + url, 404);
      try { return await h(body || {}, m[2]); }
      catch (e) { throw e.status ? e : fail(e.message === 'Failed to fetch' ? 'Cannot reach the server.' : e.message, 500); }
    }
  };
})();