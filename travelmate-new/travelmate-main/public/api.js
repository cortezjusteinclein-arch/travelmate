// Shared helper: include with <script src="api.js"></script> BEFORE app.js / your page script.
window.API = {
  token: () => localStorage.getItem('tm_token') || '',
  async call(method, url, body) {
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.token() },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: r.status });
    return data;
  }
};