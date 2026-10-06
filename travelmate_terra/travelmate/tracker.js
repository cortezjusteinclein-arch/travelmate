(() => {
  const sb = window.sb; if (!sb) return;
  const ls = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  let vid = ls('tm_vid');
  if (!vid) { vid = 'V' + Math.random().toString(36).slice(2, 10); try { localStorage.setItem('tm_vid', vid); } catch (e) {} }
  const page = location.pathname.split('/').pop() || 'index.html';
  const uid = () => { try { return ls('tm_token') ? (JSON.parse(ls('tm_users') || '[]')[0] || {}).id || '' : ''; } catch (e) { return ''; } };
  const quiet = p => Promise.resolve(p).catch(() => {});

  quiet(sb.from('traffic_visits').insert({ Vid: vid, Page: page, UserID: uid() }));
  const beat = () => quiet(sb.from('traffic_live').upsert({ Vid: vid, at: Date.now(), Page: page, UserID: uid() }));
  beat(); setInterval(beat, 15000);
  addEventListener('beforeunload', () => quiet(sb.from('traffic_live').delete().eq('Vid', vid)));

  window.TMTrack = {
    login: p => quiet(sb.from('traffic_logins').insert({ UserID: p.UserID, UserName: p.UserName, Email: p.Email, Role: p.Role, Result: 'success', Source: 'site' })),
    failed: email => quiet(sb.from('traffic_logins').insert({ Email: String(email || ''), Result: 'failed', Source: 'site' }))
  };
})();