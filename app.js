(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const LS=localStorage,users=JSON.parse(LS.getItem('tm_users')||'[]');
const GUEST={first:'Ethan',last:'Reyes',display:'ethanreyes',email:'guest'};
const real=LS.getItem('tm_token')?users.find(u=>u.email===LS.getItem('tm_session')):null;
if(!real)LS.removeItem('tm_session');
const me=real||GUEST,isGuest=!real;

const KEY='tm_data_'+me.email;
const sb=(id,name,loc,a,b,g,total,status)=>({id,name,kind:'Hotel',loc,a,b,g,total,status});
const D={fav:[],listings:[],reviews:[],last:'B001',
  trips:[{id:'T-demo',name:'La Union Escape',status:'Pending',days:{1:[{name:'Azure Bay Resort',type:'Hotel',time:'14:00',cost:9000},{name:'Kusina ni Aling Rosa',type:'Restaurant',time:'18:30',cost:900},{name:'Bonfire at Urbiztondo',type:'Custom',time:'20:30',cost:0}],2:[],3:[]}}],
  bookings:[sb('B001','Azure Bay Resort','San Juan, La Union','14 Mar 2026','16 Mar 2026',2,9000,'Completed'),sb('B002','Pine Crest Inn','Baguio City','2 Apr 2026','4 Apr 2026',3,6400,'Confirmed'),sb('B003','Azure Bay Resort','San Juan, La Union','10 Apr 2026','12 Apr 2026',2,9000,'Cancelled')],
  ...JSON.parse(LS.getItem(KEY)||'{}')};
// Accounts that saved a trip before "My Trips" existed have a single tripName/days pair
// in storage instead of a trips[] array — fold that into a one-item array so nothing is lost.
if(!Array.isArray(D.trips)||!D.trips.length)D.trips=[{id:genId('T'),name:D.tripName||'My trip',status:'Pending',days:D.days||{1:[],2:[],3:[]}}];
D.trips.forEach(t=>{t.status=t.status==='Completed'?'Completed':'Pending';if(!t.days)t.days={1:[],2:[],3:[]};[1,2,3].forEach(d=>{if(!Array.isArray(t.days[d]))t.days[d]=[]})});
delete D.tripName;delete D.days;
if(isGuest)D.bookings=[];
else{try{const g=JSON.parse(LS.getItem('tm_data_guest')||'null');if(g&&g.fav){g.fav.forEach(n=>{if(!D.fav.includes(n))D.fav.push(n)});LS.removeItem('tm_data_guest')}}catch(e){}}
let ATRIP=D.trips[0].id,TRIPTAB='Pending';
const curTrip=()=>D.trips.find(t=>t.id===ATRIP);
const sync=fn=>fn().catch(e=>{if(e.status===401){LS.removeItem('tm_token');LS.removeItem('tm_session');location.replace('login.html?next=index.html&reason='+encodeURIComponent('Your session expired. Please log in again.'))}else if(e.status!==404)toast('Server: '+e.message,'warn')});
let tripSig=JSON.stringify(D.trips),tripT,tripQ=Promise.resolve();
const queueTripSync=fn=>{tripQ=tripQ.then(()=>sync(fn)).catch(()=>{});return tripQ};
const syncTrip=()=>{
  if(isGuest)return;
  const s=JSON.stringify(D.trips);if(s===tripSig)return;tripSig=s;clearTimeout(tripT);
  tripT=setTimeout(()=>{const t=curTrip();if(!t)return;
    queueTripSync(()=>API.call('PUT','/api/trips/'+t.id,{name:t.name,days:t.days,start:S.in,status:t.status}))},600)};
const save=()=>{try{LS.setItem(KEY,JSON.stringify(D));LS.setItem('tm_users',JSON.stringify(users))}catch(e){toast('Storage is full, so this change was not saved.','bad')}syncTrip()};

const day0=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.toLocaleDateString('en-CA')};
const S={loc:'',in:day0(14),out:day0(16),g:2,free:false,dist:60};
let DAY=1,SEL='Azure Bay Resort',REV=null,RATE=0,PM='card',CUR='',CAT='',CURIT=null,SORT='Recommended',FS={max:null,st:[],tg:[]},RVPHOTOS=[],HOSTPHOTO=null,hostPhotoReady=Promise.resolve(),HOSTPHOTONAME='';
const {PLACES:P,ITEMS}=window.TM_DATA;
const byName={},byId={};(window.TM_DATA.ALL||ITEMS).forEach(i=>{byName[i.name]=i;byId[i.id]=i});byName['Tangadan Falls']=byName['Tangadan Falls Trek'];
window.addEventListener('tm:listings',()=>{(window.TM_DATA.ALL||ITEMS).forEach(i=>{byName[i.name]=i;byId[i.id]=i})});
const COUNTRIES=[...new Set(Object.values(P).map(p=>p.c))].sort();
const TRIPCATS=[{k:'beach',l:'Beach',m:['beach']},{k:'pine',l:'Nature & Mountains',m:['pine']},{k:'falls',l:'Waterfalls & Adventure',m:['falls']},
  {k:'temple',l:'Culture & Heritage',m:['temple']},{k:'city',l:'City',m:['city']},{k:'food',l:'Food & Dining',m:['food','ramen']}];
const ICON={Hotel:['beach','bed'],Restaurant:['food','fork'],Attraction:['falls','ticket'],Custom:['city','pin']};
const fd=(i,w)=>new Date(i+'T00:00').toLocaleDateString('en-PH',{weekday:w?'short':undefined,day:'numeric',month:'short',year:'numeric'});
const nn=(a,b)=>Math.max(1,Math.round((new Date(b)-new Date(a))/864e5)||1);
const nights=()=>nn(S.in,S.out);
const pl=(n,w)=>n+' '+w+(n===1?'':'s');
const peso=n=>'₱'+Math.round(n).toLocaleString('en-PH');
const esc=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const phStyle=i=>i&&i.photo?` style="background-image:url(&quot;${esc(i.photo)}&quot;);background-size:cover;background-position:center"`:'';
const ini=()=>(me.first[0]+me.last[0]).toUpperCase();
const now=()=>new Date().toLocaleString('en-PH',{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'});
const t12=t=>{const[h,m]=t.split(':');return((h%12)||12)+':'+m+(h<12?' AM':' PM')};
const F=(sc,t)=>$$('label.lb',$(sc)).find(l=>l.textContent.trim().startsWith(t))?.parentElement.querySelector('input,select,textarea');
const paint=(el,n)=>[...el.children].forEach((c,i)=>c.classList.toggle('off',i>=n));
const nameOf=b=>b.closest('.lcard,.rrow')?.querySelector('h4')?.textContent||$('.bigname h2',b.closest('.screen'))?.textContent||'';
const newId=()=>'B'+String(D.bookings.length+1).padStart(3,'0');

function toast(m,t='good'){const e=document.createElement('div');e.className='site-toast '+t;e.textContent=m;$('.toast-stack').appendChild(e);setTimeout(()=>e.remove(),3200)}
function modal(title,html,onOk,okText='Save',onDel,cancelText){
  const d=document.createElement('dialog');d.className='tm-dialog';
  d.innerHTML=`<h3>${title}</h3><div class="frm">${html}</div><div class="tm-actions">${onDel?'<button type="button" class="btn-line btn-sm" data-del style="margin-right:auto;color:var(--tv-red);border-color:var(--tv-red)">Delete</button>':''}<button type="button" class="btn-line btn-sm" data-x>${cancelText||(onOk?'Cancel':'Close')}</button>${onOk?`<button type="button" class="btn-orange btn-sm" data-ok>${okText}</button>`:''}</div>`;
  document.body.appendChild(d);d.showModal();
  d.addEventListener('close',()=>d.remove());
  d.addEventListener('click',e=>{const c=e.target;if(c.closest('[data-x]'))return d.close();if(c.closest('[data-del]')){onDel();return d.close()}if(c.closest('[data-ok]')&&onOk(d)!==false)d.close()});
  return d;
}
function pick(cb,multi){const i=document.createElement('input');i.type='file';i.accept='image/*';i.multiple=!!multi;i.onchange=()=>cb([...i.files]);i.click()}
function thumbs(el,files,onData){files.slice(0,8).forEach(f=>{if(f.size>3e5)return toast(f.name+' is over 300 KB (demo limit).','warn');const r=new FileReader();r.onload=()=>{el.insertAdjacentHTML('beforeend',`<div class="ph" style="background:url(${r.result}) center/cover"></div>`);onData&&onData(r.result)};r.readAsDataURL(f)})}
function share(){const u=location.href.split('#')[0]+'#'+CUR;(navigator.clipboard?.writeText(u)||Promise.reject()).then(()=>toast('Link copied.'),()=>prompt('Copy this link:',u))}

const LIST={results:'Hotel',restaurants:'Restaurant',attractions:'Attraction'};
const LR={Hotel:'results',Restaurant:'restaurants',Attraction:'attractions'};
const DR={Hotel:'detail',Restaurant:'restaurant',Attraction:'attraction'};
const NAVR={detail:'results',restaurant:'restaurants',attraction:'attractions'};
const R=['home','results','restaurants','attractions','detail','restaurant','attraction','trips','booking','confirm','review','replies','forum','account','host'];
const draw={home:()=>renderHome(),results:()=>renderResults('Hotel'),restaurants:()=>renderResults('Restaurant'),attractions:()=>renderResults('Attraction'),
  detail:()=>renderDetail('Hotel'),restaurant:()=>renderDetail('Restaurant'),attraction:()=>renderDetail('Attraction'),
  trips:()=>{if(!curTrip())ATRIP=D.trips[0].id;renderTrip()},booking:()=>renderBooking(),confirm:()=>{renderBookings();pullBookings()},review:()=>{renderReview();pullBookings()},account:()=>renderAccount(),
  replies:()=>renderReplies(),
  forum:()=>{window.TMForum&&TMForum.reload()}};
const GATE={booking:'Log in or register to book your stay and pay.',confirm:'Log in or register to see your bookings.',account:'Log in or register to manage your account.',review:'Log in or register to write a review.'};
function needLogin(msg,route,mode){
  try{sessionStorage.setItem('tm_pending',JSON.stringify({route:route||CUR||'home',sel:SEL,s:S,cur:CURIT&&CURIT.id,cat:CAT}))}catch(e){}
  location.href='login.html?next='+encodeURIComponent('index.html')+(mode?'&mode='+mode:'')+(msg?'&reason='+encodeURIComponent(msg):'');
}
function go(r,push=true){
  if(!R.includes(r))r='home';
  if(isGuest&&GATE[r])return needLogin(GATE[r],r);
  CUR=r;
  const sc=LISTSCREEN(r);
  $$('.screen').forEach(s=>s.classList.toggle('on',s.id==='s-'+sc));
  const nr=NAVR[r]||r;
  $$('.site-nav [data-route],.bnav [data-route]').forEach(a=>a.classList.toggle('active',a.dataset.route===nr));
  if(push&&location.hash!=='#'+r)history.pushState(null,'','#'+r);
  scrollTo(0,0);draw[r]?.();
}
function LISTSCREEN(r){return LIST[r]?'results':r}
function openItem(id){const it=byId[id];if(!it)return;CURIT=it;go(DR[it.kind])}
window.TM_REDRAW=()=>{try{const gone=(CUR==='booking'&&byName[SEL]&&!ITEMS.includes(byName[SEL]))||(CURIT&&DR[CURIT.kind]===CUR&&!ITEMS.includes(CURIT));if(gone){toast('That listing is no longer available.','warn');CURIT=null;go(CUR==='booking'?'home':(NAVR[CUR]||'home'))}else draw[CUR]&&draw[CUR]()}catch(e){console.error(e)}};

function applyUser(){
  $$('.avatar').forEach(a=>{if(a.textContent==='ER'||a.dataset.me){a.textContent=ini();a.dataset.me=1}});
  $$('.user-displayname').forEach(u=>u.textContent=me.display);
  $('#home-greeting').textContent=isGuest?'Where are you headed?':`Where are you headed, ${me.first}?`;
  if(isGuest){
    $$('a[data-act="logout"]').forEach(a=>{a.dataset.act='login';a.textContent='Log in'});
    $$('.avatar.clickable[data-route="account"]').forEach(a=>a.outerHTML='<span class="auth-pair"><a href="#" class="auth-pill ghost" data-act="login">Log in</a><a href="#" class="auth-pill" data-act="signup">Sign up</a></span>');
  }
}
function renderAccount(){
  F('#s-account','First name').value=me.first;F('#s-account','Last name').value=me.last;F('#s-account','Display name').value=me.display;F('#s-account','Email').value=me.email;
  $('#acct-stats').innerHTML=[['Saved favorites',D.fav.length],['Trip stops',D.trips.reduce((t,tr)=>t+[1,2,3].reduce((s,d)=>s+tr.days[d].length,0),0)],['Bookings',D.bookings.length]].map(([a,b])=>`<div class="rowsp"><span>${a}</span><b>${b}</b></div>`).join('');
}
const ACT={
  login:()=>needLogin('',CUR),
  signup:()=>needLogin('',CUR,'register'),
  logout:()=>{try{API.call('POST','/api/logout').catch(()=>{})}catch(e){}LS.removeItem('tm_token');LS.removeItem('tm_session');location.replace('index.html')},
  'save-account':()=>{const f=F('#s-account','First name').value.trim(),l=F('#s-account','Last name').value.trim(),d=F('#s-account','Display name').value.trim();
    if(!f||!l||!/^[\w.]{3,20}$/.test(d))return toast('Fill in every field (display name: 3–20 letters, numbers, _ or .).','warn');
    Object.assign(me,{first:f,last:l,display:d});save();applyUser();toast('Profile updated.')},
  clear:()=>{if(confirm('Clear favorites, trip plan, bookings and reviews for this account?')){LS.removeItem(KEY);location.reload()}},
  'new-trip':()=>newTrip(),
  'trip-status-toggle':()=>{const t=curTrip();if(t)setTripStatus(t.id,t.status==='Completed'?'Pending':'Completed')}
};

const LBLS={Hotel:'Hotels',Restaurant:'Restaurants',Attraction:'Attractions'},UNIT={Hotel:'stay',Restaurant:'restaurant',Attraction:'attraction'};
const KI={Hotel:'bed',Restaurant:'fork',Attraction:'ticket'};
const RNG={Hotel:[1000,60000,500],Restaurant:[100,2000,50],Attraction:[0,2000,50]};
const PU={Hotel:'per night',Restaurant:'per person',Attraction:'entrance'};
const ratingLbl=r=>r>=4.8?'Exceptional':r>=4.5?'Excellent':r>=4.2?'Very good':'Good';
const km=(a,b)=>{const r=x=>x*Math.PI/180,dl=r(b.lat-a.lat),dg=r(b.lng-a.lng),h=Math.sin(dl/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dg/2)**2;return 12742*Math.asin(Math.sqrt(h))};
const fk=d=>d<0.1?'<100 m':d<1?Math.round(d*100)*10+' m':(d<10?d.toFixed(1):Math.round(d))+' km';
const score=x=>(x.d??0)-(x.i.r-4)*12;
const priceShort=i=>i.kind==='Hotel'?peso(i.p)+'/night':i.kind==='Restaurant'?peso(i.p)+'–'+peso(i.hi):(i.p?peso(i.p):'Free');
const sub=i=>i.kind==='Hotel'?`${i.st}-star hotel in ${i.area}`:i.kind==='Restaurant'?`${i.cuisine} · ${i.area}`:`${i.type} · ${i.area}`;
const CTRY={};Object.values(P).forEach(p=>{(CTRY[p.c]=CTRY[p.c]||[]).push(p)});
const CALIAS={uk:'United Kingdom',usa:'United States',america:'United States',korea:'South Korea'};
const countryName=t=>{t=(t||'').toLowerCase().trim();return Object.keys(CTRY).find(c=>c.toLowerCase()===t)||CALIAS[t]||null};
const countryPlace=c=>{const L=CTRY[c],m=k=>L.reduce((a,p)=>a+p[k],0)/L.length;return{n:c,s:c,k:'c:'+c,c,country:true,lat:m('lat'),lng:m('lng'),al:[]}};
function resolvePlace(t){
  t=(t||'').toLowerCase().trim();if(t.length<3)return null;
  let best=null,bl=0;
  for(const k in P)for(const al of P[k].al)if((t.includes(al)||(t.length>=4&&al.startsWith(t)))&&al.length>bl){best=P[k];bl=al.length}
  if(!best){const it=ITEMS.find(i=>i.name.toLowerCase()===t);if(it)best=P[it.pl]}
  if(!best){const c=countryName(t);if(c)best=countryPlace(c)}
  return best;
}
function spread(kind,n,used=[]){
  const seen=new Set(used.map(id=>byId[id]&&byId[id].c)),out=[];
  [...ITEMS.filter(i=>i.kind===kind&&!used.includes(i.id))].sort((x,y)=>y.r-x.r||y.n-x.n).forEach(i=>{if(out.length<n&&!seen.has(i.c)){seen.add(i.c);out.push({i,d:null})}});
  return out;
}
function nearby(kind,n,from,excl=[]){
  const a=from||resolvePlace(S.loc);
  return ITEMS.filter(i=>i.kind===kind&&!excl.includes(i.id)).map(i=>({i,d:a?km(a,i):null})).sort((x,y)=>score(x)-score(y)).slice(0,n);
}
const markFav=()=>$$('.lcard').forEach(c=>{const h=$('h4',c),f=$('.fav',c);if(f&&h)f.classList.toggle('favorite-active',D.fav.includes(h.textContent))});
const minicard=({i,d})=>`<div class="lcard clickable" data-open="${i.id}" style="display:flex;align-items:center;gap:12px;padding:13px"><div class="ph ${i.ph}" style="width:74px;height:60px;border-radius:8px;flex:none"><svg class="i"><use href="#${KI[i.kind]}"/></svg></div><div><h4 style="margin:0 0 3px;font-size:13.5px;font-weight:700">${esc(i.name)}</h4><div class="meta" style="margin:0">${i.n?`<span class="rate">${i.r}</span> `:''}<span>${i.n?'· ':''}${i.kind==='Hotel'?peso(i.p)+'/night':sub(i)}${d!=null?' · '+fk(d):''}</span></div><button class="pill" style="margin-top:6px;border:none;cursor:pointer">Add to trip</button></div></div>`;
const bigcard=({i,d})=>`<div class="lcard clickable" data-open="${i.id}"><div class="ph ${i.ph}"${phStyle(i)}><span class="lbl">${i.kind}</span><span class="fav"><svg class="i"><use href="#heart"/></svg></span><svg class="i"><use href="#${KI[i.kind]}"/></svg></div><div class="lbody"><h4>${esc(i.name)}</h4><div class="meta">${i.kind==='Hotel'?`<span class="stars">${'★'.repeat(i.st)}</span> `:''}<span>${i.kind==='Hotel'?'· '+i.area:sub(i)}${d!=null?' · '+fk(d):''}</span></div><div class="meta">${i.n?`<span class="rate">${i.r}</span> <span>${ratingLbl(i.r)} · ${pl(i.n,'review')}</span>`:'<span class="per">No reviews yet</span>'}</div><div class="price">${i.kind==='Hotel'?peso(i.p)+' <span class="per">/ night</span>':i.kind==='Restaurant'?peso(i.p)+'–'+peso(i.hi)+' <span class="per">/ person</span>':(i.p?peso(i.p):'Free')+' <span class="per">entrance</span>'}</div></div></div>`;

function renderHome(){
  const P0=resolvePlace(S.loc),w=P0?P0.s:'you';
  $('#home-sub').textContent=`Search ${ITEMS.length} hotels, restaurants and attractions in destinations around the world.`;
  $('#pop-h').textContent=P0?'Popular near '+w:'Popular destinations worldwide';
  const pop=P0?[...nearby('Hotel',2),...nearby('Restaurant',1),...nearby('Attraction',1)]:(()=>{const u=[],a=[];['Hotel','Hotel','Restaurant','Attraction'].forEach(k=>{const r=spread(k,1,u)[0];if(r){u.push(r.i.id);a.push(r)}});return a})();
  $('#pop-grid').innerHTML=pop.map(bigcard).join('');
  const used=pop.map(x=>x.i.id);
  $('#plan-grid').innerHTML=(P0?[...nearby('Attraction',1,null,used),...nearby('Restaurant',1,null,used)]:[...spread('Attraction',1,used),...spread('Restaurant',1,used)]).map(minicard).join('')+
   '<div class="lcard" style="display:flex;align-items:center;gap:12px;padding:13px"><div class="ph city" style="width:74px;height:60px;border-radius:8px;flex:none"><svg class="i"><use href="#chat"/></svg></div><div><h4 style="margin:0 0 3px;font-size:13.5px;font-weight:700">Ask the community</h4><div class="meta" style="margin:0"><span>412 open discussions</span></div><button class="pill" style="margin-top:6px;border:none;cursor:pointer" data-route="forum">Visit forum</button></div></div>';
  markFav();
}

function search(){
  const loc=$('#h-loc').value.trim(),a=$('#h-in').value,b=$('#h-out').value,g=+$('#h-g').value;
  if(!a||!b)return toast('Pick your check-in and check-out dates.','warn');
  if(a<day0(0))return toast('Check-in cannot be in the past.','warn');
  if(b<=a)return toast('Check-out must be after check-in.','warn');
  if(!(g>=1))return toast('Add at least one guest.','warn');
  Object.assign(S,{loc,in:a,out:b,g});go('results');
}
const onOf=f=>$$(`#s-results [data-f=${f}]`).filter(e=>$('.cb',e).classList.contains('on')).map(e=>e.dataset.v);
function syncFS(){if(!$('#f-p'))return;FS.max=+$('#f-p').value;FS.st=onOf('st');FS.tg=onOf('tg')}
function candidates(){
  const P0=resolvePlace(S.loc),q=(S.loc||'').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);
  let L=ITEMS.filter(i=>i.kind===CAT).map(i=>({i,d:P0?km(P0,i):null})),note='';
  if(P0&&P0.country)L=L.filter(x=>x.i.c===P0.c);
  else if(P0){if(S.dist)L=L.filter(x=>x.d<=S.dist)}
  else if(q.length){
    const M=L.filter(x=>q.some(t=>(x.i.name+' '+x.i.loc+' '+x.i.tags.join(' ')).toLowerCase().includes(t)));
    if(M.length)L=M;else note=`We couldn't find "${S.loc}", so these are the top-rated ${LBLS[CAT].toLowerCase()} across all destinations.`;
  }
  return{L,P0,note};
}
function buildFilters(){
  const[lo,hi,st]=RNG[CAT],mx=FS.max??hi,cnt={};
  ITEMS.filter(i=>i.kind===CAT).forEach(i=>i.tags.forEach(t=>cnt[t]=(cnt[t]||0)+1));
  const tags=Object.keys(cnt).sort((x,y)=>cnt[y]-cnt[x]||x.localeCompare(y)).slice(0,8);
  $('#s-results .filterbox').innerHTML=`<h5>Near</h5><input class="inp" id="r-loc" list="places" autocomplete="off" placeholder="City or place" value="${esc(S.loc)}"><select class="inp" id="r-dist" style="margin-top:7px">${[[10,'Within 10 km'],[30,'Within 30 km'],[60,'Within 60 km'],[150,'Within 150 km'],[0,'Anywhere']].map(([v,l])=>`<option value="${v}"${S.dist===v?' selected':''}>${l}</option>`).join('')}</select><div class="divider"></div><h5>Category</h5>${['Hotel','Restaurant','Attraction'].map(k=>`<div class="fopt clickable" data-cat="${LR[k]}"><i class="cb${k===CAT?' on':''}"></i> ${k}</div>`).join('')}<div class="divider"></div><h5>Max price ${PU[CAT]}</h5><input type="range" id="f-p" min="${lo}" max="${hi}" step="${st}" value="${mx}" style="width:100%"><div id="f-pl" class="per"></div>${CAT==='Hotel'?`<div class="divider"></div><h5>Star rating</h5>${[5,4,3,2].map(n=>`<div class="fopt clickable" data-f="st" data-v="${n}"><i class="cb${FS.st.includes(''+n)?' on':''}"></i> <span class="stars">${'★'.repeat(n)}</span></div>`).join('')}`:''}<div class="divider"></div><h5>${CAT==='Hotel'?'Amenities':CAT==='Restaurant'?'Cuisine & features':'Type & features'}</h5>${tags.map(t=>`<div class="fopt clickable" data-f="tg" data-v="${esc(t)}"><i class="cb${FS.tg.includes(t)?' on':''}"></i> ${esc(t)}</div>`).join('')}<button class="btn-line btn-sm" style="margin-top:12px;width:100%">Clear filters</button>`;
}
function row({i,d},P0){
  const n=nights();
  const side=i.kind==='Hotel'?`<div class="per">${pl(n,'night')}, ${pl(S.g,'guest')}</div><div class="price" style="font-size:23px">${peso(i.p*n)}</div><div class="per" style="margin-bottom:9px">${peso(i.p)} per night</div><button class="btn-orange" style="width:100%" data-book="${i.id}">Select room</button>`
   :`<div class="per">${i.kind==='Restaurant'?'Typical price':'Entrance'}</div><div class="price" style="font-size:22px">${i.kind==='Restaurant'?peso(i.p)+'–'+peso(i.hi):(i.p?peso(i.p):'Free')}</div><div class="per" style="margin-bottom:9px">${i.kind==='Restaurant'?'per person':'per person · '+i.dur}</div><button class="btn-orange" style="width:100%" data-open="${i.id}">View details</button>`;
  return `<div class="rrow clickable" data-open="${i.id}"><div class="ph ${i.ph}"${phStyle(i)}><span class="lbl">${i.kind}</span><svg class="i"><use href="#${KI[i.kind]}"/></svg></div><div class="rbody"><h4>${esc(i.name)}</h4><div class="meta">${i.kind==='Hotel'?`<span class="stars">${'★'.repeat(i.st)}</span>`:''}<span>${i.kind==='Hotel'?'· ':''}${esc(sub(i))}</span></div><div class="meta"><svg class="i" style="color:var(--tv-blue)"><use href="#pin"/></svg> ${esc(i.loc)}${d!=null?` · <b style="color:var(--ink)">${fk(d)}</b> from ${esc(P0.s)}`:''}</div><div class="meta">${i.n?`<span class="rate">${i.r}</span> <b style="color:var(--ink)">${ratingLbl(i.r)}</b> <span>· ${pl(i.n,'review')}</span>`:'<span class="per">No reviews yet</span>'}</div><div class="amen">${i.tags.slice(0,4).map(t=>`<span>${esc(t)}</span>`).join('')}</div><div style="margin-top:9px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">${i.kind==='Hotel'&&i.free?'<span class="pill ok">Free cancellation</span>':''}<span class="pill">Published</span><button class="pill" style="border:none;cursor:pointer">Add to trip</button></div></div><div class="rside">${side}</div></div>`;
}
function filt(){
  syncFS();
  const{L,P0,note}=candidates(),mx=FS.max;
  const V=L.filter(({i})=>i.p<=mx&&(!FS.st.length||FS.st.includes(''+i.st))&&FS.tg.every(t=>i.tags.includes(t))&&(!S.free||CAT!=='Hotel'||i.free));
  V.sort((a,b)=>SORT==='Price'?a.i.p-b.i.p:SORT==='Rating'?b.i.r-a.i.r||b.i.n-a.i.n:SORT==='Distance'?(a.d??1e9)-(b.d??1e9):P0?score(a)-score(b):b.i.r-a.i.r);
  $('#f-pl').textContent='Up to '+peso(mx);
  $('#r-note').textContent=note;
  $('#s-results .sortbar b').textContent=pl(V.length,UNIT[CAT])+(CAT==='Hotel'?' available':' found')+(P0?(P0.country?` · in ${P0.s}`:S.dist?` within ${S.dist} km of ${P0.s}`:` · sorted from ${P0.s}`):'');
  $('#rlist').innerHTML=V.map(x=>row(x,P0)).join('');
  $('#nores').style.display=V.length?'none':'';
}
function renderResults(kind){
  if(kind!==CAT){CAT=kind;FS={max:null,st:[],tg:[]}}
  const P0=resolvePlace(S.loc),where=P0?P0.n:(S.loc||'All destinations');
  $('#s-results .crumb').innerHTML=`<a href="#" data-route="home">Home</a> › <a href="#" data-route="${LR[CAT]}">${LBLS[CAT]}</a> › <b>${esc(where)}</b>`;
  $('#r-tabs').innerHTML=['Hotel','Restaurant','Attraction'].map(k=>`<a href="#" class="ctab${k===CAT?' on':''}" data-route="${LR[k]}"><svg class="i"><use href="#${KI[k]}"/></svg> ${LBLS[k]}</a>`).join('');
  $$('#s-results .sortpill').forEach(p=>p.classList.toggle('on',p.textContent.trim()===SORT));
  buildFilters();filt();
}
function sortRows(k){SORT=k;filt()}
function clearF(){
  FS={max:null,st:[],tg:[]};S.free=false;S.loc='';$('#h-loc').value='';renderResults(CAT);
}

const CATS={Hotel:['Cleanliness','Location','Service','Value'],Restaurant:['Food quality','Service','Ambience','Value'],Attraction:['Scenery','Experience','Accessibility','Value']};
const starStr=n=>{n=Math.round(Math.max(0,Math.min(5,n)));return '★'.repeat(n)+'☆'.repeat(5-n)};
const phone=i=>'0917-555-'+String(1000+(i.id.slice(1)*137)%9000);
function detailHTML(it){
  const k=it.kind,pp=P[it.pl]||{s:it.area||it.loc||'this area',n:it.area||it.loc||''},cats=CATS[k],n=nights();
  const catRows=cats.map((c,j)=>{const v=Math.min(5,Math.max(1,it.r+[.1,.1,-.2,-.1][j]));return `<div class="catrow"><span class="nm">${c}</span><span class="st">${starStr(v)}</span><span class="per">${v.toFixed(1)}</span></div>`}).join('');
  const others=['Hotel','Restaurant','Attraction'].filter(x=>x!==k).flatMap(x=>nearby(x,2,it,[it.id]));
  const details={
    Hotel:`<div><b style="display:block;color:var(--ink);font-size:13px">Check-in</b>2:00 PM</div><div><b style="display:block;color:var(--ink);font-size:13px">Check-out</b>11:00 AM</div><div><b style="display:block;color:var(--ink);font-size:13px">Contact</b>${phone(it)}</div>`,
    Restaurant:`<div><b style="display:block;color:var(--ink);font-size:13px">Opening hours</b>10:00 AM–10:00 PM</div><div><b style="display:block;color:var(--ink);font-size:13px">Price range</b>${peso(it.p)}–${peso(it.hi)}</div><div><b style="display:block;color:var(--ink);font-size:13px">Contact</b>${phone(it)}</div>`,
    Attraction:`<div><b style="display:block;color:var(--ink);font-size:13px">Duration</b>${it.dur}</div><div><b style="display:block;color:var(--ink);font-size:13px">Entrance</b>${it.p?peso(it.p):'Free'}</div><div><b style="display:block;color:var(--ink);font-size:13px">Best time</b>${/Beach|Viewpoint/.test(it.type)?'Sunrise or sunset':'Morning'}</div>`
  }[k];
  const sticky={
    Hotel:`<div class="per">Total for ${pl(n,'night')}</div><div class="price" style="font-size:27px;margin:2px 0">${peso(it.p*n)}</div>${it.free?'<span class="pill ok">Free cancellation until 2 days before</span>':'<span class="pill mut">Non-refundable rate</span>'}<div class="divider"></div><div class="frm"><div class="two"><div><label class="lb">Check-in</label><input class="inp" type="date" value="${S.in}"></div><div><label class="lb">Check-out</label><input class="inp" type="date" value="${S.out}"></div></div><div><label class="lb">Guests</label><input class="inp" type="number" min="1" value="${S.g}"></div><button class="btn-orange" style="width:100%">Book this stay</button><button class="btn-line" style="width:100%"><svg class="i" style="margin-right:5px"><use href="#plus"/></svg>Add to trip plan</button></div><p class="hint" style="text-align:center">You will not be charged yet.</p>`,
    Restaurant:`<div class="per">Typical meal for 2 guests</div><div class="price">${peso(it.p*2)}–${peso(it.hi*2)}</div>${it.r>=4.5?'<span class="pill ok">Popular with travelers</span>':''}<div class="divider"></div><div class="frm"><div><label class="lb">Date</label><input class="inp" type="date" min="${day0(0)}" value="${S.in}"></div><div><label class="lb">Guests</label><input class="inp" type="number" min="1" value="${S.g}"></div><button class="btn-orange">Request a table</button><button class="btn-line">Add to trip plan</button></div><p class="hint" style="text-align:center">Reservation request is subject to restaurant confirmation.</p>`,
    Attraction:`<div class="per">Experience for ${pl(S.g,'guest')}</div><div class="price">${it.p?peso(it.p*S.g):'Free'}</div><span class="pill ok">Free cancellation</span><div class="divider"></div><div class="frm"><div><label class="lb">Visit date</label><input class="inp" type="date" min="${day0(0)}" value="${S.in}"></div><div><label class="lb">Guests</label><input class="inp" type="number" min="1" value="${S.g}"></div><button class="btn-orange">Book experience</button><button class="btn-line">Add to trip plan</button></div><p class="hint" style="text-align:center">Availability may vary by date.</p>`
  }[k];
  return `<div class="crumb"><a href="#" data-route="home">Home</a> › <a href="#" data-route="${LR[k]}">${LBLS[k]}</a> › ${P[it.pl]?`<a href="#" data-near="${it.pl}" data-kind="${k}">${esc(pp.s)}</a>`:esc(pp.s)} › <b>${esc(it.name)}</b></div>
  <div class="gal"><div class="ph ${it.ph} big"${phStyle(it)}><span class="lbl">${k} · ${it.id}</span><svg class="i"><use href="#${KI[k]}"/></svg></div><div class="ph falls"><svg class="i"><use href="#photo"/></svg></div><div class="ph city"><svg class="i"><use href="#photo"/></svg></div><div class="ph food"><svg class="i"><use href="#photo"/></svg></div><div class="ph pine"><svg class="i"><use href="#photo"/></svg><span class="lbl" style="left:auto;right:8px;top:auto;bottom:8px">+${8+it.n%14} photos</span></div></div>
  <div class="side"><div>
    <div class="bigname"><div style="flex:1"><h2>${esc(it.name)}</h2><div class="meta">${k==='Hotel'?`<span class="stars">${'★'.repeat(it.st)}</span> `:''}<span class="pill">${k}</span> <span class="pill ok">Published</span></div><div class="meta"><svg class="i" style="color:var(--tv-blue)"><use href="#pin"/></svg> ${esc(it.loc)} · <a href="#" style="color:var(--tv-blue);text-decoration:none">See map</a></div><p style="font-size:13.5px;color:var(--ink-2);line-height:1.6;margin:10px 0 0;max-width:520px">${esc(it.blurb)}</p></div><div class="scorebox">${it.n?`<b>${it.r}</b><small>${pl(it.n,'review')}</small>`:'<b>—</b><small>No reviews yet</small>'}</div></div>
    <div class="card" style="padding:15px;margin-top:6px"><h5 style="margin:0 0 10px;font-size:13px;font-weight:800">${k==='Hotel'?'Amenities':k+' details'}</h5><div class="amen" style="gap:7px">${it.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div><div class="divider"></div><div style="display:flex;gap:26px;font-size:12.5px;color:var(--ink-2);flex-wrap:wrap">${details}</div></div>
    <div class="sec-h"><div><h3>Traveler reviews</h3><p>Only travelers who ${k==='Hotel'?'completed a stay':'visited'} can post</p></div><span class="sp"></span>${it.n?`<a href="#">All ${it.n} →</a>`:''}</div>
    ${it.n?`<div class="card" style="padding:15px;margin-bottom:12px;display:flex;gap:26px;align-items:center"><div style="text-align:center"><div style="font-size:34px;font-weight:800;letter-spacing:-1px">${it.r}</div><div class="stars" style="font-size:14px">${starStr(it.r)}</div><div class="per">${pl(it.n,'review')}</div></div><div style="flex:1">${catRows}</div></div>`:'<div class="card" style="padding:15px;margin-bottom:12px"><p class="hint" style="margin:0">No reviews yet. Be the first to share your experience.</p></div>'}
    <div style="display:grid;gap:11px" data-reviews-for="${it.id}"><p class="hint">Loading reviews…</p></div>
    <div class="sec-h" style="margin-top:22px"><div><h3>Also near ${esc(pp.s)}</h3><p>Nearby places you can add to your trip</p></div><span class="sp"></span><a href="#" data-route="trips">Open Trip Planner →</a></div>
    <div class="grid g2">${others.map(minicard).join('')}</div>
  </div><div class="sticky"><div class="card">${sticky}</div></div></div>`;
}
function renderDetail(kind){
  if(!CURIT||CURIT.kind!==kind)CURIT=nearby(kind,1)[0]?.i||ITEMS.find(i=>i.kind===kind);
  $('#d-'+kind).innerHTML=detailHTML(CURIT);
  window.TMReviews&&TMReviews.renderFor(CURIT);
  markFav();
}
function detTot(){const n=nights();$('#s-detail .sticky .price').textContent=peso(CURIT.p*n);$('#s-detail .sticky .per').textContent='Total for '+pl(n,'night')}
function reserve(kind){
  const sc=$(kind==='Restaurant'?'#s-restaurant':'#s-attraction'),[d,g]=$$('.sticky input',sc).map(i=>i.value),n=+g,it=CURIT;
  if(!d||d<day0(0))return toast('Please pick a date that is today or later.','warn');
  if(!(n>0))return toast('Enter the number of guests.','warn');
  const b={id:newId(),name:it.name,kind,loc:it.loc,a:fd(d),b:'',g:n,total:kind==='Attraction'?it.p*n:0,status:kind==='Restaurant'?'Requested':'Confirmed'};
  D.bookings.push(b);D.last=b.id;save();sync(async()=>{const r=await API.call('POST','/api/bookings',b);b.id=r.id;D.last=r.id;save();if(CUR==='confirm')renderBookings()});toast(kind==='Restaurant'?'Table request sent.':'Experience booked!');go('confirm');
}

function sumBooking(){
  const h=byName[SEL],n=nights(),tot=h.p*n;
  $('#s-booking .sticky .card').innerHTML=`<div style="display:flex;gap:11px;margin-bottom:12px"><div class="ph ${h.ph}" style="width:70px;height:56px;border-radius:7px;flex:none"><svg class="i" style="font-size:20px"><use href="#bed"/></svg></div><div><b style="font-size:13.5px">${SEL}</b><div class="meta" style="margin:3px 0 0"><span class="stars">${'★'.repeat(h.st)}</span>${h.n?`<span class="rate">${h.r}</span>`:''}</div><div class="per">${h.loc}</div></div></div><div class="divider"></div><div class="rowsp"><span>Check-in</span><b>${fd(S.in,1)}</b></div><div class="rowsp"><span>Check-out</span><b>${fd(S.out,1)}</b></div><div class="rowsp"><span>Guests</span><b>${S.g}</b></div><div class="divider"></div><div class="rowsp"><span>${peso(h.p)} × ${pl(n,'night')}</span><span>${peso(tot)}</span></div><div class="rowsp"><span>Taxes &amp; fees</span><span>Included</span></div><div class="rowsp total"><span>Total</span><span class="price" style="font-size:20px">${peso(tot)}</span></div><button class="btn-orange" style="width:100%;margin-top:12px">Pay now</button><p class="hint" style="text-align:center;margin-top:8px">${h.free?'Free cancellation until 2 days before check-in':'Non-refundable rate'}</p>`;
}
function renderBooking(){F('#s-booking','Number of guests').value=S.g;sumBooking()}
function setPM(i){
  PM=['card','gcash','maya'][i];
  $$('#s-booking .grid.g3>div').forEach((d,j)=>d.style.cssText=(j===i?'border:2px solid var(--tv-blue);background:#F5FAFF;font-weight:700;':'border:1px solid var(--line);font-weight:600;color:var(--ink-2);')+'border-radius:8px;padding:11px;text-align:center;font-size:12.5px;cursor:pointer');
  [...$$('#s-booking .frm')[1].children].slice(0,2).forEach(c=>c.style.display=i?'none':'');
}
function pay(){
  const v=t=>F('#s-booking',t).value.trim();
  if(!v('First name')||!v('Last name')||!/^\S+@\S+\.\S+$/.test(v('Email'))||v('Mobile').replace(/\D/g,'').length<10)return toast('Please complete your guest details.','bad');
  if(PM==='card'&&(v('Card number').replace(/\D/g,'').length<13||!/^\d\d\s*\/\s*\d\d$/.test(v('Expiry'))||v('CVV').replace(/\D/g,'').length<3||!v('Name on card')))return toast('Please check your card details.','bad');
  if(!$('#s-booking .chk i').classList.contains('on'))return toast('Please accept the cancellation policy.','warn');
  const h=byName[SEL],b={id:newId(),name:SEL,kind:'Hotel',loc:h.loc,a:fd(S.in),b:fd(S.out),g:S.g,total:h.p*nights(),status:'Confirmed',ref:'tok_'+Math.random().toString(16).slice(2,10)};
  D.bookings.push(b);D.last=b.id;save();sync(async()=>{const r=await API.call('POST','/api/bookings',b);b.id=r.id;D.last=r.id;save();if(CUR==='confirm')renderBookings()});
  ['Card number','Expiry','CVV','Name on card'].forEach(l=>F('#s-booking',l).value='');
  toast('Booking confirmed!');go('confirm');
}
const PILL={Completed:'ok',Confirmed:'ok',Requested:'warn',Cancelled:'mut'};
const act=x=>x.status==='Completed'?(x.reviewed?'<span class="pill ok">Reviewed</span>':`<button class="btn-orange btn-sm" data-do="review" data-id="${x.id}">Write review</button>`):x.status==='Confirmed'||x.status==='Requested'?`${x.status==='Confirmed'?`<button class="btn-line btn-sm" data-do="done" data-id="${x.id}">Mark completed</button> `:''}<button class="btn-line btn-sm" data-do="cancel" data-id="${x.id}">Cancel</button>`:'';
function renderBookings(){
  const b=D.bookings.find(x=>x.id===D.last)||D.bookings[0];
  if(b){
    $('#s-confirm .ticket h3').textContent=b.status==='Cancelled'?'Booking cancelled':b.status==='Requested'?'Request sent':'Booking confirmed';
    $('#s-confirm .ticket .top p').textContent='Saved to your account · '+me.email;
    $('#s-confirm .ticket .body').innerHTML=`<div style="display:flex;gap:13px;margin-bottom:14px"><div style="flex:1"><b style="font-size:16px">${esc(b.name)}</b><div class="meta" style="margin:4px 0 0"><span>${esc(b.loc||'')}</span></div><div class="mono" style="margin-top:5px">Booking ID · ${b.id}</div></div><span class="pill ${PILL[b.status]}" style="height:fit-content">${b.status}</span></div><div class="divider"></div><div class="three" style="gap:8px"><div><div class="per">${b.b?'Check-in':'Date'}</div><b style="font-size:13.5px">${b.a}</b></div><div><div class="per">${b.b?'Check-out':'Type'}</div><b style="font-size:13.5px">${b.b||b.kind}</b></div><div><div class="per">Guests</div><b style="font-size:13.5px">${b.g}</b></div></div><div class="divider"></div><div class="rowsp"><span>Total</span><span class="price">${b.total?peso(b.total):'Pay at venue'}</span></div><div class="rowsp"><span>Payment reference</span><span class="mono">${b.ref||'—'}</span></div><div style="display:flex;gap:9px;margin-top:14px"><button class="btn-orange" style="flex:1" data-do="voucher" data-id="${b.id}">Download voucher</button><button class="btn-line" style="flex:1" data-do="trip" data-id="${b.id}">Add to trip plan</button></div>`;
  }
  $('#s-confirm tbody').innerHTML=D.bookings.map(x=>`<tr class="clickable" data-id="${x.id}"><td class="mono">${x.id}</td><td><b>${esc(x.name)}</b><div class="per">${x.kind}</div></td><td>${x.a}${x.b?' – '+x.b:''}</td><td>${x.g}</td><td class="price" style="font-size:13px">${x.total?peso(x.total):'—'}</td><td><span class="pill ${PILL[x.status]}">${x.status}</span></td><td>${act(x)}</td></tr>`).join('');
}
const DO={
  review:id=>{REV=id;go('review')},
  done:id=>{D.bookings.find(b=>b.id===id).status='Completed';save();sync(()=>API.call('PATCH','/api/bookings/'+id,{status:'Completed'}));renderBookings();toast('Marked as completed. You can now write a review.')},
  cancel:id=>{if(!confirm('Cancel booking '+id+'?'))return;D.bookings.find(b=>b.id===id).status='Cancelled';save();sync(()=>API.call('PATCH','/api/bookings/'+id,{status:'Cancelled'}));renderBookings();toast('Booking cancelled.','warn')},
  trip:id=>{addStop(D.bookings.find(b=>b.id===id).name);go('trips')},
  voucher:id=>{const b=D.bookings.find(x=>x.id===id),a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([`TRAVELMATE BOOKING VOUCHER\n\nBooking ID: ${b.id}\nGuest: ${me.first} ${me.last}\nProperty: ${b.name}\nDates: ${b.a}${b.b?' - '+b.b:''}\nGuests: ${b.g}\nTotal: ${b.total?peso(b.total):'Pay at venue'}\nStatus: ${b.status}\n`],{type:'text/plain'}));
    a.download=b.id+'-voucher.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
};

function renderReview(){
  const b=D.bookings.find(x=>x.id===REV&&x.status==='Completed'&&!x.reviewed)||D.bookings.find(x=>x.status==='Completed'&&!x.reviewed);
  if(!b){toast('No completed stays are waiting for a review.','warn');return go('confirm')}
  REV=b.id;const d=D.draft&&D.draft.id===b.id?D.draft:{t:'',b:'',r:0};RATE=d.r;
  RVPHOTOS=[];const rvth=$('#rv-th');if(rvth)rvth.innerHTML='';
  paint($('#s-review .ratein'),RATE);$$('#s-review .catrow .st').forEach(s=>paint(s,0));
  $('#s-review .ratein + .hint').textContent=RATE?['Poor','Fair','Good','Very good','Exceptional'][RATE-1]+' — '+RATE+' out of 5':'Tap a star to rate';
  $('#s-review .card h5').textContent='How was '+b.name+'?';
  $('#s-review .card > .hint').innerHTML='Your review will be public under <b class="user-displayname">'+esc(me.display)+'</b>.';
  $('#s-review .sticky .card').innerHTML=`<b style="font-size:13.5px">${esc(b.name)}</b><div class="per">${b.kind}</div><span class="pill ok" style="margin-top:5px">Verified stay</span><div class="divider"></div><div class="rowsp"><span>Booking</span><span class="mono">${b.id}</span></div><div class="rowsp"><span>Dates</span><span>${b.a}${b.b?' – '+b.b:''}</span></div>`;
  F('#s-review','Review title').value=d.t;F('#s-review','Your review').value=d.b;$('#s-review textarea').dispatchEvent(new Event('input',{bubbles:true}));
}
function renderReplies(){
  const it=CURIT,name=it?it.name:'this listing',route=it?DR[it.kind]:'detail',kind=it?UNIT[it.kind]:'listing';
  const crumb=$('#s-replies .crumb a[data-route]');if(crumb){crumb.textContent=name;crumb.dataset.route=route}
  const pill=$('#s-replies .bigname .pill');if(pill)pill.textContent=name;
  const back=$('#s-replies #repl-back');if(back){back.dataset.route=route;back.textContent='Back to '+kind+' →'}
  const sb=$('#s-replies .scorebox');
  if(sb){sb.querySelector('b').textContent=it&&it.n?it.r:'—';sb.querySelector('small').textContent=it&&it.n?pl(it.n,'review'):'No reviews yet'}
  const host=$('#replies-reviews');host.innerHTML='<p class="hint">No reviews yet.</p>';
}
function publish(){
  const t=F('#s-review','Review title').value.trim(),body=F('#s-review','Your review').value.trim();
  if(!RATE)return toast('Please choose an overall rating.','warn');
  if(!t)return toast('Add a review title.','warn');
  if(body.length<50)return toast('Your review needs at least 50 characters.','warn');
  const b=D.bookings.find(x=>x.id===REV);
  b.reviewed=1;if(D.draft?.id===b.id)delete D.draft;save();
  toast('Review published.');
  const it=byName[b.name],photos=RVPHOTOS.slice();RVPHOTOS=[];
  const posted=sync(()=>API.call('POST','/api/reviews',{title:t,body,rating:RATE,bookingId:b.id,visitDate:b.a,kind:b.kind,listingId:it?it.id:null,photos}));
  if(it){CURIT=it;go(DR[it.kind]);posted.then(()=>window.TMReviews&&TMReviews.renderFor(it))}else go('confirm');
}
function draft(){D.draft={id:REV,t:F('#s-review','Review title').value,b:F('#s-review','Your review').value,r:RATE};save();toast('Draft saved.')}

const costOf=i=>i.kind==='Hotel'?i.p*nights():i.kind==='Restaurant'?Math.round((i.p+i.hi)/2*S.g):i.p*S.g;
const DEFT={Hotel:'14:00',Restaurant:'19:00',Attraction:'09:00',Custom:'12:00'};
const p2=n=>String(n).padStart(2,'0');
function freeTime(base){
  const T=curTrip();if(!T)return base;
  const taken=new Set(T.days[DAY].map(s=>s.time));let[h,m]=base.split(':').map(Number);
  while(taken.has(p2(h)+':'+p2(m))&&h<22)h++;
  return p2(h)+':'+p2(m);
}
function anchor(){
  const T=curTrip();if(!T)return null;
  const items=l=>l.slice().sort((x,y)=>x.time.localeCompare(y.time)).map(x=>byName[x.name]).filter(Boolean);
  const it=items(T.days[DAY]).pop()||[1,2,3].flatMap(d=>items(T.days[d])).pop();
  if(it)return{lat:it.lat,lng:it.lng,s:it.area};
  const p=resolvePlace(S.loc);return p?{lat:p.lat,lng:p.lng,s:p.s}:null;
}
function suggest({kind,q,n=6,country,cat}={}){
  const T=curTrip();if(!T)return[];
  const a=anchor(),have=new Set(T.days[DAY].map(s=>byName[s.name]?.name||s.name)),hasHotel=[1,2,3].some(d=>T.days[d].some(s=>s.type==='Hotel'));
  const catMatch=cat&&TRIPCATS.find(c=>c.k===cat);
  let L=ITEMS.filter(i=>!have.has(i.name)&&(!kind||kind==='All'||i.kind===kind)&&(!country||i.c===country)&&(!catMatch||catMatch.m.includes(i.ph)));
  if(q){const t=q.toLowerCase();L=L.filter(i=>(i.name+' '+i.loc+' '+i.kind+' '+i.tags.join(' ')).toLowerCase().includes(t))}
  const sc=x=>score(x)-(x.i.kind==='Hotel'&&!hasHotel?15:0);
  L=L.map(i=>({i,d:a?km(a,i):null})).sort((x,y)=>sc(x)-sc(y));
  if(q||(kind&&kind!=='All')||country||cat)return L.slice(0,n);
  const cap={Hotel:hasHotel?0:2,Restaurant:2,Attraction:2},cnt={},out=[];
  for(const x of L){if((cnt[x.i.kind]=(cnt[x.i.kind]||0)+1)<=cap[x.i.kind])out.push(x);if(out.length>=n)break}
  return out;
}
const sugRow=({i,d})=>`<div class="sug"><div class="ph ${i.ph}" style="width:48px;height:40px;border-radius:6px;flex:none"><svg class="i" style="font-size:15px"><use href="#${KI[i.kind]}"/></svg></div><div class="sp"><b>${esc(i.name)}</b><div class="per">${i.kind} · ${i.r} ★${d!=null?' · '+fk(d):''} · ${priceShort(i)}</div></div><button type="button" class="btn-line btn-sm" data-sadd="${i.id}">Add</button></div>`;
const TPILL={Pending:'warn',Completed:'ok'};
function renderTrip(){
  const T=curTrip();if(!T)return;
  $('#s-trips input.inp').value=T.name;
  $$('#s-trips .dayb').forEach((b,i)=>b.classList.toggle('on',i+1===DAY));
  const L=T.days[DAY],ord=L.map((s,i)=>i).sort((a,b)=>L[a].time.localeCompare(L[b].time)),a=anchor();
  const empty=`<div class="card" style="margin-bottom:12px"><b style="font-size:13.5px">Nothing planned for Day ${DAY} yet.</b><p class="hint" style="margin:3px 0 12px">Ideas${a?' near '+esc(a.s):''} — tap Add to drop one into the plan:</p>${suggest({n:3}).map(sugRow).join('')}</div>`;
  $('#s-trips .tl').innerHTML=(ord.map(i=>{const s=L[i],it=byName[s.name],ph=it?it.ph:ICON.Custom[0],ic=ICON[s.type][1],bk=D.bookings.some(b=>b.name===s.name&&b.status!=='Cancelled');
    return `<div class="tlitem${s.type==='Custom'?' custom':''}"><div class="tlbox"><span class="tm">${t12(s.time)}</span><div class="ph ${ph}" style="width:56px;height:44px;border-radius:6px;flex:none"><svg class="i" style="font-size:18px"><use href="#${ic}"/></svg></div><div class="sp"><b style="font-size:13.5px">${esc(s.name)}</b><div class="meta" style="margin:2px 0 0"><span class="pill${s.type==='Custom'?' mut':''}">${s.type==='Custom'?'Custom stop':s.type}</span>${s.cost?`<span>· ${peso(s.cost)}</span>`:''}${it?`<span>· ${esc(it.area)}</span>`:''}</div></div>${bk?'<span class="pill ok">Booked</span>':''}<button class="btn-line btn-sm" data-edit="${i}">Edit</button></div></div>`}).join('')||empty)+'<div class="addstop">+ Add a stop — pick a listing or type your own</div>';
  const all=[1,2,3].flatMap(d=>T.days[d]),n=all.filter(s=>s.type!=='Custom').length;
  $('#s-trips .sticky .card').innerHTML=`<h5 style="margin:0 0 10px;font-size:12.5px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-2)">Trip summary</h5><div class="rowsp"><span>Stops planned</span><b>${all.length}</b></div><div class="rowsp"><span>Linked to listings</span><b>${n}</b></div><div class="rowsp"><span>Custom stops</span><b>${all.length-n}</b></div><div class="rowsp"><span>Booked</span><b>${all.filter(s=>D.bookings.some(b=>b.name===s.name&&b.status!=='Cancelled')).length}</b></div><div class="rowsp total"><span>Estimated spend</span><span class="price">${peso(all.reduce((t,s)=>t+s.cost,0))}</span></div>`;
  $('#sug-card').innerHTML=`<h5 style="margin:0 0 9px;font-size:12.5px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-2)">Suggested near ${a?esc(a.s):'you'}</h5>${suggest({n:4}).map(sugRow).join('')||'<p class="hint">Everything nearby is already in your plan.</p>'}<p class="hint" style="margin-top:8px">Based on your latest Day ${DAY} stop and what is not in the plan yet.</p>`;
  const pill=$('#trip-status-pill'),idp=$('#trip-id-pill'),statusBtn=$('#btn-trip-status');
  if(pill){pill.textContent=T.status;pill.className='pill '+TPILL[T.status]}
  if(idp)idp.textContent=T.id;
  if(statusBtn)statusBtn.textContent=T.status==='Completed'?'Reopen trip':'Mark completed';
  renderTripsTable();
}
function addStop(name){
  if(!name)return;const T=curTrip();if(!T)return;
  const it=byName[name];name=it?it.name:name;const type=it?it.kind:'Custom',L=T.days[DAY];
  if(L.some(s=>(byName[s.name]?.name||s.name)===name))return toast(name+' is already on Day '+DAY+'.','warn');
  L.push({name,type,time:freeTime(DEFT[type]),cost:it?costOf(it):0});save();
  toast(name+' added to Day '+DAY+'.');if(CUR==='trips')renderTrip();
}
function newTrip(){
  const t={id:genId('T'),name:'New trip',status:'Pending',days:{1:[],2:[],3:[]}};
  D.trips.unshift(t);ATRIP=t.id;save();if(CUR==='trips')renderTrip();toast('New trip created — start adding stops.');
}
function setTripStatus(id,status){
  const t=D.trips.find(x=>x.id===id);if(!t)return;t.status=status;save();
  if(!isGuest)queueTripSync(()=>API.call('PATCH','/api/trips/'+t.id,{status}));
  if(CUR==='trips')renderTrip();
  toast(status==='Completed'?'Trip marked as completed.':'Trip moved back to pending.');
}
function deleteTrip(id){
  if(D.trips.length<=1)return toast('You need at least one trip plan.','warn');
  if(!confirm('Delete this trip plan? This cannot be undone.'))return;
  const t=D.trips.find(x=>x.id===id);if(!t)return;
  D.trips=D.trips.filter(x=>x.id!==id);
  if(ATRIP===id)ATRIP=D.trips[0].id;
  save();
  if(!isGuest)queueTripSync(()=>API.call('DELETE','/api/trips/'+t.id,{}));
  if(CUR==='trips')renderTrip();
  toast('Trip deleted.','warn');
}
function filterTrips(tab){TRIPTAB=tab;renderTripsTable()}
function renderTripsTable(){
  const tb=$('#trips-table tbody');if(!tb)return;
  $$('#s-trips .sortpill[data-trip-tab]').forEach(p=>p.classList.toggle('on',p.dataset.tripTab===TRIPTAB));
  const rows=D.trips.filter(t=>TRIPTAB==='All'||t.status===TRIPTAB);
  tb.innerHTML=rows.length?rows.map(t=>{
    const all=[1,2,3].flatMap(d=>t.days[d]);
    return `<tr class="clickable" data-trip="${t.id}"${t.id===ATRIP?' style="background:#F5FAFF"':''}><td><b>${esc(t.name)}</b><div class="per mono">${esc(t.id)}</div></td><td>${pl(all.length,'stop')}</td><td class="price" style="font-size:13px">${peso(all.reduce((s,x)=>s+x.cost,0))}</td><td><span class="pill ${TPILL[t.status]}">${t.status}</span></td><td style="white-space:nowrap"><button class="btn-line btn-sm" data-triptoggle="${t.id}">${t.status==='Completed'?'Reopen':'Mark completed'}</button> <button class="btn-line btn-sm" data-tripdel="${t.id}" style="color:var(--tv-red);border-color:var(--tv-red)">Delete</button></td></tr>`;
  }).join(''):`<tr><td colspan="5"><p class="hint" style="margin:10px 0">No ${TRIPTAB==='All'?'':TRIPTAB.toLowerCase()+' '}trips yet.</p></td></tr>`;
}
function addModal(){
  const T=curTrip();if(!T)return;
  let kind='All';
  const ctyOpts=`<option value="">Any country</option>`+COUNTRIES.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
  const catOpts=`<option value="">Any category</option>`+TRIPCATS.map(c=>`<option value="${c.k}">${esc(c.l)}</option>`).join('');
  const d=modal('Add a stop',`<div><label class="lb">Search a listing or type your own</label><input class="inp" id="m-n" placeholder="e.g. Burnham Park or Sunset at the pier" autocomplete="off"></div><div class="chips">${['All','Hotel','Restaurant','Attraction'].map((k,i)=>`<button type="button" class="ctab${i?'':' on'}" data-k="${k}">${k==='All'?'All':k+'s'}</button>`).join('')}</div><div class="two"><div><label class="lb">Country</label><select class="inp" id="m-c">${ctyOpts}</select></div><div><label class="lb">Category</label><select class="inp" id="m-cat">${catOpts}</select></div></div><div id="m-sug" class="sugbox"></div><div class="two"><div><label class="lb">Type (for your own stop)</label><select class="inp" id="m-t"><option>Custom</option><option>Hotel</option><option>Restaurant</option><option>Attraction</option></select></div><div><label class="lb">Time</label><input class="inp" id="m-h" type="time" value="09:00"></div></div>`,d=>{
    const n=$('#m-n',d).value.trim();if(!n){toast('Type a stop, or tap Add on a suggestion.','warn');return false}
    const it=byName[n];
    if(T.days[DAY].some(s=>(byName[s.name]?.name||s.name)===(it?it.name:n))){toast(n+' is already on Day '+DAY+'.','warn');return false}
    T.days[DAY].push({name:it?it.name:n,type:it?it.kind:$('#m-t',d).value,time:$('#m-h',d).value||'09:00',cost:it?costOf(it):0});save();renderTrip();toast('Stop added to Day '+DAY+'.')},'Add typed stop',undefined,'Done');
  const refresh=()=>{
    const q=$('#m-n',d).value.trim(),country=$('#m-c',d).value,cat=$('#m-cat',d).value;
    const L=suggest({kind,q,n:q||country||cat?8:6,country,cat}),a=anchor();
    const bits=[];if(country)bits.push(esc(country));if(cat)bits.push(esc(TRIPCATS.find(c=>c.k===cat).l));
    const label=q?'Matching listings':bits.length?bits.join(' · '):'Suggested near '+esc(a?a.s:'you')+' — updates as you add stops';
    $('#m-sug',d).innerHTML=`<div class="per" style="margin:0 0 8px">${label}</div>`+(L.map(sugRow).join('')||`<p class="hint" style="margin:0">No listing matches. Try a different country or category, or use “Add typed stop” to add it as your own stop.</p>`);
  };
  d.addEventListener('input',e=>{if(e.target.id==='m-n')refresh()});
  d.addEventListener('change',e=>{if(e.target.id==='m-c'||e.target.id==='m-cat')refresh()});
  d.addEventListener('click',e=>{
    const k=e.target.closest('[data-k]'),s=e.target.closest('[data-sadd]');
    if(k){kind=k.dataset.k;$$('.chips .ctab',d).forEach(c=>c.classList.toggle('on',c===k));refresh()}
    if(s){addStop(byId[s.dataset.sadd].name);refresh()}
  });
  refresh();
}
function editStop(i){
  const T=curTrip();if(!T)return;const s=T.days[DAY][i];
  modal('Edit stop',`<div><label class="lb">Name</label><input class="inp" id="m-n" value="${esc(s.name)}"></div><div><label class="lb">Time</label><input class="inp" id="m-h" type="time" value="${s.time}"></div>`,d=>{
    const n=$('#m-n',d).value.trim();if(!n)return false;s.name=n;s.time=$('#m-h',d).value||s.time;save();renderTrip()},'Save',()=>{T.days[DAY].splice(i,1);save();renderTrip();toast('Stop removed.','warn')});
}

function genId(p){return p+Math.random().toString(36).slice(2,10)}
async function postReply(b){
  const row=b.parentElement,i=$('input',row),v=i.value.trim(),post=row.closest('.post'),pid=post.dataset.pid,photo=row.dataset.ph;
  if(!v)return toast('Write a reply first.','warn');
  if(!pid)return toast('That discussion is still loading. Try again in a moment.','warn');
  i.value='';delete row.dataset.ph;row.querySelector('.rp-prev')?.remove();toast('Posting reply…');
  await sync(()=>API.call('POST','/api/forumreplies',{postId:pid,body:v,photo}));
  window.TMForum&&TMForum.reload();
}
function newPost(){
  modal('Start a discussion',`<div><label class="lb">Title</label><input class="inp" id="m-n" placeholder="e.g. Best time to visit Tangadan Falls?"></div><div><label class="lb">Details</label><textarea class="inp" id="m-b" rows="4"></textarea></div>`,d=>{
    const t=$('#m-n',d).value.trim(),b=$('#m-b',d).value.trim();
    if(!t||b.length<10){toast('Add a title and at least 10 characters of detail.','warn');return false}
    const pid=genId('FP');
    toast('Discussion posted.');
    sync(()=>API.call('POST','/api/forumposts',{id:pid,title:t,body:b})).then(()=>window.TMForum&&TMForum.reload())},'Post');
}
const RX={Philippines:/la union|urbiztondo|carille|surf|baguio|cebu|boracay|el nido|palawan|vigan|sagada|tagaytay|philippines/i,
  Asia:/tokyo|kyoto|japan|asakusa|shibuya|seoul|korea|bangkok|thailand|phuket|bali|indonesia|singapore/i,
  Europe:/paris|france|rome|italy|barcelona|spain|london|united kingdom|eiffel|left bank/i,
  Food:/food|eats|restaurant|dinner|lunch|bistro|ramen|sushi|tapas|cuisine/i};
const filterForum=k=>$$('#s-forum .post').forEach(p=>p.style.display=k==='Latest'?'':k==='Unanswered'?($('.reply',p)?'none':''):RX[k].test(p.textContent)?'':'none');
window.TMForumFilterReset=()=>{const on=$('#s-forum .sortpill.on');if(on)filterForum(on.textContent.trim())};
function actSpan(x){
  const s=x.textContent.trim();
  if(/👍/.test(s)){const on=x.dataset.on==='1';x.textContent=s.replace(/\d+/,m=>+m+(on?-1:1));x.dataset.on=on?'0':'1';return}
  if(/^Report/.test(s)){x.textContent='Reported';toast('Thanks. It was sent to moderators for review.','warn');return}
  if(/^Share/.test(s))return share();
  if(/^Reply/.test(s)){const p=x.closest('.post'),i=$('input',p),n=$('b',x.closest('.reply')||p);i.focus();if(n&&!i.value)i.value='@'+n.textContent+' '}
}

function ownerReply(){
  const v=$('#replyText').value.trim();
  if(v.length<10)return toast('Please write a longer reply.','warn');
  const host=$('#replies-reviews');if($('p.hint',host))host.innerHTML='';
  host.insertAdjacentHTML('beforeend',`<div class="rvcard"><div class="reply-owner">Property reply · ${fd(day0(0))}</div><p style="margin:5px 0 0;font-size:13px;color:var(--ink-2);line-height:1.6">${esc(v)}</p></div>`);
  $('#replyText').value='';$('#replyStatus').textContent='Reply posted.';toast('Reply posted.');
}
const addListing=l=>$('#s-host .sticky .card:last-child').insertAdjacentHTML('beforeend',`<div class="rowsp"><span>${esc(l.n)}</span><span class="pill ${l.st==='Draft'?'mut':'warn'}">${l.st}</span></div>`);
function clearHost(){$$('#s-host .frm input.inp,#s-host .frm textarea.inp').forEach(i=>i.value='');$('#s-host .lcard h4').textContent='Your property name';$('#s-host .lcard .price').innerHTML='₱0 <span class="per">/ night</span>';HOSTPHOTO=null;HOSTPHOTONAME='';hostPhotoReady=Promise.resolve();const lbl=$('#host-cover-label');if(lbl)lbl.textContent='Upload a cover photo';const ht=$('#host-th');if(ht)ht.innerHTML=''}
async function submit(st){
  const n=F('#s-host','Property name').value.trim(),a=F('#s-host','Address').value.trim(),c=F('#s-host','Contact').value.trim();
  if(!n)return toast('Give your listing a name first.','warn');
  if(st!=='Draft'&&(!a||c.replace(/\D/g,'').length<7))return toast('Address and a valid contact number are required.','warn');
  await hostPhotoReady; // wait for the cover photo to finish being read so HOSTPHOTO is actually set
  const kind=F('#s-host','Category').value,star=(F('#s-host','Star rating').value.match(/\d+/)||[])[0],
    price=F('#s-host','Price range').value.trim(),desc=F('#s-host','Description').value.trim(),
    photoName=HOSTPHOTONAME,photo=HOSTPHOTO,
    amen=$$('#s-host .amen span').filter(s=>s.textContent.trim().endsWith('✕')).map(s=>s.textContent.trim().replace(' ✕','')).join(';');
  const l={n,st};D.listings.push(l);save();addListing(l);clearHost();
  toast(st==='Draft'?'Draft saved.':'Listing submitted for review.');
  if(st!=='Draft'){
    sync(()=>API.call('POST','/api/listings',{name:n,kind,star,price,desc,address:a,contact:c,photo,photoName,amenities:amen}));
    go('home');
  }
}

const BTN=[
  [/^Search$/,search],
  [/^Book this stay$/,()=>{SEL=CURIT.name;go('booking')}],
  [/^Pay now$/,pay],
  [/^Add to trip( plan)?$/,b=>addStop(nameOf(b))],
  [/^Share$/,share],
  [/^Save plan$/,()=>{save();toast('Trip plan saved.')}],
  [/^Request a table$/,()=>reserve('Restaurant')],
  [/^Book experience$/,()=>reserve('Attraction')],
  [/^Start a discussion$/,newPost],
  [/^Post$/,postReply],
  [/^Post reply$/,ownerReply],
  [/moderation rules/,()=>modal('Moderation rules','<p>Keep replies helpful and respectful. Do not share personal information, promotions or links. Reported replies are reviewed by an administrator and may be removed.</p>')],
  [/^Publish review$/,publish],
  [/^Save draft$/,draft],
  [/^Submit for review$/,()=>submit('Pending review')],
  [/^Save as draft$/,()=>submit('Draft')],
  [/^Clear filters$/,clearF]
];
document.addEventListener('click',e=>{
  const t=e.target;if(t.closest('.tm-dialog'))return;let x;
  if(x=t.closest('[data-act]')){e.preventDefault();return ACT[x.dataset.act]?.()}
  if(x=t.closest('.fav')){const n=$('h4',x.closest('.lcard')).textContent,i=D.fav.indexOf(n);
    i<0?D.fav.push(n):D.fav.splice(i,1);x.classList.toggle('favorite-active',i<0);toast(i<0?'Saved to favorites.':'Removed from favorites.',i<0?'good':'warn');save();return}
  if(x=t.closest('[data-near]')){e.preventDefault();S.loc=P[x.dataset.near].n;const hl=$('#h-loc');if(hl)hl.value=S.loc;return go(LR[x.dataset.kind])}
  if(x=t.closest('[data-sadd]')){e.preventDefault();return addStop(byId[x.dataset.sadd].name)}
  if(x=t.closest('[data-book]')){e.preventDefault();SEL=byId[x.dataset.book].name;return go('booking')}
  if((x=t.closest('[data-open]'))&&!(t.closest('button')&&t.closest('button')!==x)){e.preventDefault();return openItem(x.dataset.open)}
  if(x=t.closest('[data-route]')){e.preventDefault();return go(x.dataset.route)}
  if(x=t.closest('[data-do]'))return DO[x.dataset.do](x.dataset.id);
  if(x=t.closest('[data-triptoggle]')){const t2=D.trips.find(y=>y.id===x.dataset.triptoggle);return t2&&setTripStatus(t2.id,t2.status==='Completed'?'Pending':'Completed')}
  if(x=t.closest('[data-tripdel]'))return deleteTrip(x.dataset.tripdel);
  if(x=t.closest('#trips-table tr[data-trip]')){ATRIP=x.dataset.trip;save();return renderTrip()}
  if(x=t.closest('a')){
    e.preventDefault();const s=x.textContent.trim();
    if(s==='See map')return window.open('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(($('.bigname h2',x.closest('.screen'))?.textContent||'')+' '+x.parentElement.textContent.replace('See map','').split('·')[0].trim()),'_blank','noopener');
    if(/^EN \|/.test(s))return modal('Language & currency','<p>TravelMate is available in <b>English</b> with prices in <b>Philippine peso (₱)</b>. More options are coming later.</p>');
    if(s==='My listings')return $('#s-host .sticky .card:last-child').scrollIntoView({behavior:'smooth'});
    if(s==='Help')return modal('Hosting help','<p>Fill in your property details, add at least 5 photos, then submit for review. Listings go live once approved.</p>');
    if(/^All \d+/.test(s))return modal('Reviews',$$('.rvcard',x.closest('.screen')).map(c=>c.outerHTML).join(''));
    return;
  }
  if(x=t.closest('.chk')){const i=$('i',x);i.classList.toggle('on');if(x.closest('#s-home'))S.free=i.classList.contains('on');return}
  if(x=t.closest('#s-results .sortpill')){$$('#s-results .sortpill').forEach(p=>p.classList.toggle('on',p===x));return sortRows(x.textContent.trim())}
  if(x=t.closest('#s-forum .sortpill')){$$('#s-forum .sortpill').forEach(p=>p.classList.toggle('on',p===x));return filterForum(x.textContent.trim())}
  if(x=t.closest('#s-trips .sortpill[data-trip-tab]')){$$('#s-trips .sortpill[data-trip-tab]').forEach(p=>p.classList.toggle('on',p===x));return filterTrips(x.dataset.tripTab)}
  if(x=t.closest('#s-results .fopt')){if(x.dataset.cat)return go(x.dataset.cat);$('.cb',x).classList.toggle('on');return filt()}
  if(x=t.closest('.dayb')){DAY=$$('.dayb').indexOf(x)+1;return renderTrip()}
  if(t.closest('.addstop'))return addModal();
  if(x=t.closest('#s-review .ratein span')){const p=x.parentElement;RATE=$$('span',p).indexOf(x)+1;paint(p,RATE);$('#s-review .ratein + .hint').textContent=['Poor','Fair','Good','Very good','Exceptional'][RATE-1]+' — '+RATE+' out of 5';return}
  if(x=t.closest('#s-review .catrow .st span')){const p=x.parentElement;return paint(p,$$('span',p).indexOf(x)+1)}
  if(t.closest('#s-review .drop'))return pick(f=>thumbs($('#rv-th'),f,u=>RVPHOTOS.push(u)),1);
  if(t.closest('#host-cover'))return pick(f=>{
    if(!f.length)return;
    HOSTPHOTONAME=f[0].name;
    $('#host-cover-label').textContent=f[0].name;
    toast('Cover photo selected.');
    HOSTPHOTO=null;
    hostPhotoReady=new Promise(res=>{const r=new FileReader();r.onload=()=>{HOSTPHOTO=r.result;res()};r.onerror=()=>res();r.readAsDataURL(f[0])});
  });
  if(t.closest('#s-host .drop'))return pick(f=>{
    if(!f.length)return;
    thumbs($('#host-th'),f);
    toast(pl(f.length,'photo')+' selected.');
  },1);
  if(x=t.closest('#s-host .amen span')){const s=x.textContent;
    if(s.endsWith('✕')){x.removeAttribute('style');x.textContent='+ '+s.replace(' ✕','')}else{x.style.cssText='background:#EAF5FF;border-color:#BFE2FF;color:#0B4C86;font-weight:600';x.textContent=s.replace('+ ','')+' ✕'}return}
  if(x=t.closest('#s-booking .grid.g3>div'))return setPM($$('#s-booking .grid.g3>div').indexOf(x));
  if(x=t.closest('.actions span'))return actSpan(x);
  if(x=t.closest('#s-confirm tr[data-id]')){D.last=x.dataset.id;save();return renderBookings()}
  if(x=t.closest('.gal .ph'))return modal('Photo',x.outerHTML.replace('class="ph','style="height:300px;border-radius:8px" class="ph'));
  if(x=t.closest('.rp-x')){const row=x.closest('[data-ph]');if(row){delete row.dataset.ph;x.closest('.rp-prev')?.remove()}return}
  const b=t.closest('button');if(!b)return;
  if(b.dataset.edit)return editStop(+b.dataset.edit);
  const tx=b.textContent.trim().replace(/\s+/g,' ');
  if(!tx&&$('use',b)?.getAttribute('href')==='#photo')return pick(f=>{const r=new FileReader();if(!f[0])return;if(f[0].size>25e4)return toast('Photo is over 250 KB (demo limit).','warn');r.onload=()=>{
    const row=b.parentElement;row.dataset.ph=r.result;
    let prev=row.querySelector('.rp-prev');
    if(!prev){prev=document.createElement('span');prev.className='rp-prev';
      prev.style.cssText='position:relative;width:34px;height:34px;border-radius:7px;flex:none;display:inline-block;background-size:cover;background-position:center';
      prev.innerHTML='<span class="rp-x" style="position:absolute;top:-5px;right:-5px;width:16px;height:16px;border-radius:50%;background:#333;color:#fff;font-size:10px;line-height:16px;text-align:center;cursor:pointer">✕</span>';
      row.insertBefore(prev,b);}
    prev.style.backgroundImage=`url(${r.result})`;
    toast('Photo attached to your reply.');
  };r.readAsDataURL(f[0])});
  const hit=BTN.find(([re])=>re.test(tx));
  if(hit&&isGuest&&/^(Pay now|Request a table|Book experience|Publish review|Save draft|Submit for review|Save as draft|Start a discussion|Post|Post reply)$/.test(tx)){
    return needLogin(/^(Pay now|Request a table|Book experience)$/.test(tx)?'Log in or register to complete your booking.':/review/i.test(tx)?GATE.review:/Save|Submit/.test(tx)?'Log in or register to publish a listing.':'Log in or register to post in the forum.',CUR);
  }
  hit?.[1](b);
});
document.addEventListener('submit',e=>e.preventDefault());
document.addEventListener('change',e=>{
  if(e.target.id==='r-loc'){S.loc=e.target.value.trim();const hl=$('#h-loc');if(hl)hl.value=S.loc;return renderResults(CAT)}
  if(e.target.id==='r-dist'){S.dist=+e.target.value;return renderResults(CAT)}
  if(e.target.matches('#s-host select')&&/Category/.test(e.target.parentElement.textContent))$('#s-host .lcard .lbl').textContent=e.target.value;
});
document.addEventListener('input',e=>{
  const t=e.target,id=t.id;
  if(id==='h-in'||id==='h-out'){const n=Math.round((new Date($('#h-out').value)-new Date($('#h-in').value))/864e5);$('#h-n').textContent=n>0?pl(n,'night'):''}
  else if(id==='f-p')filt();
  else if(t.closest('#s-detail .sticky')){const[i,o,g]=$$('#s-detail .sticky input');if(i.value)S.in=i.value;if(o.value)S.out=o.value;if(+g.value>0)S.g=+g.value;if(S.out<=S.in){S.out=day0(0);const d=new Date(S.in+'T00:00');d.setDate(d.getDate()+1);S.out=d.toLocaleDateString('en-CA');o.value=S.out}detTot()}
  else if(t.closest('#s-booking')&&/guests/i.test(t.parentElement.textContent)){if(+t.value>0){S.g=+t.value;sumBooking()}}
  else if(t.closest('#s-attraction .sticky')&&t.type==='number'){const g=Math.max(1,+t.value||1);$('#s-attraction .sticky .price').textContent=CURIT.p?peso(CURIT.p*g):'Free';$('#s-attraction .sticky .per').textContent='Experience for '+pl(g,'guest')}
  else if(t.matches('#s-review textarea'))t.nextElementSibling.textContent=t.value.length+' / 2000 characters · minimum 50';
  else if(t.matches('#s-trips input.inp')){const T=curTrip();if(T){T.name=t.value;save();renderTripsTable()}}
  else if(t.closest('#s-host .frm')){
    const n=F('#s-host','Property name').value.trim(),p=(F('#s-host','Price range').value.match(/[\d,]+/)||['0'])[0];
    $('#s-host .lcard h4').textContent=n||'Your property name';$('#s-host .lcard .price').innerHTML='₱'+p+' <span class="per">/ night</span>';
    $('#s-host .lcard .stars').textContent='★'.repeat(parseInt(F('#s-host','Star rating').value)||4);
  }
});
window.addEventListener('hashchange',()=>{if(location.hash.slice(1)!==CUR)go(location.hash.slice(1),false)});

$$('button[data-route]').forEach(b=>{if(/Select room|Book this stay|Pay now|Publish review|Submit for review|Add to trip plan/.test(b.textContent))b.removeAttribute('data-route')});
const fl=$$('#s-home .searchcard .field');
fl[0].innerHTML=`<label>City or property</label><div class="val"><svg class="i"><use href="#pin"/></svg><input class="inp" id="h-loc" list="places" autocomplete="off" placeholder="City or place" value="${esc(S.loc)}"></div>`;
fl[1].innerHTML=`<label>Check-in</label><div class="val"><svg class="i"><use href="#cal"/></svg><input class="inp" id="h-in" type="date" min="${day0(0)}" value="${S.in}"></div>`;
fl[2].innerHTML=`<label>Check-out</label><div class="val"><svg class="i"><use href="#cal"/></svg><input class="inp" id="h-out" type="date" min="${day0(0)}" value="${S.out}"></div>`;
fl[3].innerHTML=`<label>Guests</label><div class="val"><svg class="i"><use href="#user"/></svg><input class="inp" id="h-g" type="number" min="1" max="20" value="${S.g}"></div><small id="h-n">${pl(nights(),'night')}</small>`;
$('#s-home .chk i').classList.remove('on');
F('#s-booking','First name').value=me.first;F('#s-booking','Last name').value=me.last;F('#s-booking','Email').value=me.email;
[['Mobile number','09XX XXX XXXX'],['Card number','1234 5678 9012 3456'],['Expiry','MM / YY'],['CVV','•••'],['Name on card','As shown on card']].forEach(([l,p])=>{const i=F('#s-booking',l);i.value='';i.placeholder=p});
F('#s-booking','Number of guests').type='number';F('#s-booking','Number of guests').min=1;
$('#s-booking .chk i').classList.remove('on');setPM(0);
$('#s-review .ratein').innerHTML='<span>★</span>'.repeat(5);
$$('#s-review .catrow .st').forEach(s=>s.innerHTML='<span>★</span>'.repeat(5));
{const th=$('#s-review .thumbs');th.id='rv-th';th.innerHTML='';th.nextElementSibling.remove()}
F('#s-review','Date of stay').value='';F('#s-review','Date of stay').placeholder='e.g. 16 Mar 2026';F('#s-review','Trip type').value='';F('#s-review','Trip type').placeholder='e.g. Weekend getaway';
$('#s-host .drop').insertAdjacentHTML('afterend','<div class="thumbs" id="host-th"></div>');
F('#s-host','Star rating').innerHTML=[5,4,3,2,1].map(n=>`<option ${n===4?'selected':''}>${n} star${n>1?'s':''}</option>`).join('');
clearHost();$('#s-host .lcard .lbl').textContent='Hotel';
D.listings.forEach(addListing);
const SV=[['results','bed','Hotels','#0194F3'],['restaurants','fork','Restaurants','#FF5E1F'],['attractions','ticket','Attractions','#9B51E0'],['trips','map','Trip Planner','#00A651'],['forum','chat','Forum','#E5A100'],['host','plus','List property','#E5330B']];
$('#s-home .hero').insertAdjacentHTML('afterend','<div class="svc">'+SV.map(([r,ic,l,c])=>`<button data-route="${r}"><i style="background:${c}"><svg class="i"><use href="#${ic}"/></svg></i>${l}</button>`).join('')+'</div>');
$('#s-home .sec-h').insertAdjacentHTML('beforebegin','<div class="promos" style="margin-top:22px"><button class="promo" data-route="results" style="background:linear-gradient(135deg,#0770E3,#2BB3D6)"><b>Beach weekends</b><span>Find stays by the sea</span></button><button class="promo" data-route="trips" style="background:linear-gradient(135deg,#00A651,#79B98C)"><b>Plan day by day</b><span>Build your trip in the planner</span></button><button class="promo" data-route="host" style="background:linear-gradient(135deg,#FF5E1F,#FFB800)"><b>Host on TravelMate</b><span>Publish your property</span></button></div>');
document.body.insertAdjacentHTML('beforeend','<nav class="bnav">'+[['home','grid','Home'],['results','bed','Hotels'],['trips','map','Trips'],['confirm','bell','Bookings'],['account','user','Account']].map(([r,ic,l])=>`<a href="#" data-route="${r}"><svg class="i"><use href="#${ic}"/></svg>${l}</a>`).join('')+'</nav>');
document.body.insertAdjacentHTML('beforeend','<datalist id="places">'+Object.values(P).map(p=>`<option value="${p.n}">`).join('')+'</datalist>');
applyUser();
let START='', justLoggedIn=false;
if(!isGuest){try{const p=JSON.parse(sessionStorage.getItem('tm_pending')||'null');sessionStorage.removeItem('tm_pending');
  if(p){justLoggedIn=true;if(p.sel&&byName[p.sel])SEL=p.sel;if(p.s)Object.assign(S,p.s);if(p.cur&&byId[p.cur])CURIT=byId[p.cur];if(p.cat)CAT=p.cat}}catch(e){}}
if(!isGuest){const s0=tripSig;sync(async()=>{
  const rows=await API.call('GET','/api/trips');
  if(!rows||tripSig!==s0)return;
  if(rows.length){D.trips=rows;if(!D.trips.some(t=>t.id===ATRIP))ATRIP=D.trips[0].id}
  tripSig=JSON.stringify(D.trips);save();if(CUR==='trips')renderTrip()
})}

// Bookings only ever travel one way locally (create → local push), so a status change an
// admin makes in admin.html (Confirm / Complete / Cancel) never reaches this browser on its
// own. Pull the traveler's own bookings back from Supabase — like trips already do above —
// and merge statuses in, so "Mark completed" / "Write review" reflect what the admin did.
let bPulling=false,bPullAgain=false;
function pullBookings(){
  if(isGuest)return;
  if(bPulling){bPullAgain=true;return}
  bPulling=true;
  return sync(async()=>{
    const rows=await API.call('GET','/api/bookings');
    if(!rows)return;
    const byId={};D.bookings.forEach(b=>byId[b.id]=b);
    let changed=false;
    rows.forEach(r=>{
      const ex=byId[r.id];
      if(ex){if(ex.status!==r.status||ex.name!==r.name){Object.assign(ex,{status:r.status,name:r.name,kind:r.kind||ex.kind,loc:r.loc||ex.loc});changed=true}}
      else{D.bookings.push({...r,ref:'',reviewed:0});changed=true}
    });
    if(changed){save();if(CUR==='confirm')renderBookings();if(CUR==='review')renderReview()}
  }).finally(()=>{bPulling=false;if(bPullAgain){bPullAgain=false;pullBookings()}});
}
pullBookings();
addEventListener('focus',()=>{if(!document.hidden)pullBookings()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)pullBookings()});
setInterval(()=>{if(!document.hidden)pullBookings()},15000);
// Near-instant sync: as soon as the admin confirms/completes/cancels a booking (or anything
// else touches the bookings table), pull it straight into this tab instead of waiting on the
// 15s poll. RLS already restricts "bookings" reads to the signed-in traveler's own rows, so
// this channel only ever delivers events for bookings this user is allowed to see.
if(!isGuest&&window.sb){
  try{window.sb.channel('tm-bookings-'+me.email).on('postgres_changes',{event:'*',schema:'public',table:'bookings'},()=>pullBookings()).subscribe();}catch(e){}
}
try{go(justLoggedIn?'home':(START||location.hash.slice(1)||'home'),true)}catch(e){console.error('Route restore failed, falling back to home:',e);CURIT=null;SEL='Azure Bay Resort';try{go('home',true)}catch(e2){$('#s-home')?.classList.add('on')}}
})();