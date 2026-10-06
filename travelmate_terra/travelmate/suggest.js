(()=>{
'use strict';
const DATA=window.TM_DATA;
if(!DATA)return;
const {PLACES,ITEMS}=DATA;
const INPUTS=['h-loc','r-loc'];
const PER_GROUP=4,TOTAL=10;

const GROUPS={
  Destination:{label:'Destinations',icon:'📍'},
  Hotel:{label:'Hotels',icon:'🏨'},
  Resort:{label:'Resorts',icon:'🏝️'},
  Restaurant:{label:'Restaurants',icon:'🍽️'},
  Attraction:{label:'Attractions',icon:'🏛️'},
  Activity:{label:'Activities & experiences',icon:'🌴'}
};
const SYN={
  Destination:['destination','destinations','city','town'],
  Hotel:['hotel','hotels','stay','inn','lodge','hostel','pension','homestay','cabin'],
  Resort:['resort','resorts','hotel','hotels','stay','beachfront'],
  Restaurant:['restaurant','restaurants','food','eat','dining','dinner','lunch','cafe','coffee'],
  Attraction:['attraction','attractions','sightseeing','landmark','museum','park','church','viewpoint'],
  Activity:['activity','activities','experience','experiences','tour','tours','trek','hike','hiking','adventure']
};
const ACTIVITY_TYPES=['Adventure','Island tour','Cave','Nature'];

const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const esc=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const stars=n=>'★'.repeat(n)+'☆'.repeat(5-n);
const lev=(a,b)=>{let p=Array.from({length:b.length+1},(_,j)=>j);for(let i=1;i<=a.length;i++){const c=[i];for(let j=1;j<=b.length;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}return p[b.length]};
const close_=(t,w)=>t.length>=4&&Math.abs(w.length-t.length)<=2&&Math.min(lev(t,w),lev(t,w.slice(0,t.length)))<=(t.length>=8?2:1);

const groupOf=i=>i.kind==='Hotel'?(/resort/i.test(i.name)?'Resort':'Hotel'):i.kind==='Restaurant'?'Restaurant':ACTIVITY_TYPES.includes(i.type)?'Activity':'Attraction';
const COUNT={};
const entry=(o,g,name,loc,extra)=>{const n=norm(name);return{...o,g,name:n,words:n.split(' '),compact:n.replace(/ /g,''),locW:norm(loc).split(' '),extraW:norm(extra).split(' ').filter(Boolean),syn:SYN[g]}};
let INDEX=[];
function build(){
  Object.keys(COUNT).forEach(k=>delete COUNT[k]);
  ITEMS.forEach(i=>{COUNT[i.pl]=(COUNT[i.pl]||0)+1});
  INDEX=[
    ...Object.values(PLACES).map(p=>entry({p},'Destination',p.n,p.al.join(' '),'')),
    ...ITEMS.map(i=>entry({i},groupOf(i),i.name,i.loc,[i.type,i.cuisine,...i.tags].filter(Boolean).join(' ')))
  ];
}
build();
window.addEventListener('tm:listings',build);

function tokenScore(t,e){
  let s=0;
  for(const w of e.words){if(w===t)return 100;if(w.startsWith(t))s=Math.max(s,t.length>1?80:70)}
  if(s||t.length<2)return s;
  if(e.name.includes(t))return 55;
  if(t.length>=4&&e.compact.includes(t))return 50;
  if(e.words.some(w=>close_(t,w)))return 45;
  if(e.locW.some(w=>w.startsWith(t)))return 30;
  if(e.extraW.some(w=>w.startsWith(t)))return 25;
  if(t.length>=3&&e.syn.some(w=>w.startsWith(t)))return 20;
  return 0;
}
function search(query){
  const q=norm(query);if(!q)return[];
  const toks=q.split(' '),qc=q.replace(/ /g,'');
  const hits=[];
  for(const e of INDEX){
    let sum=0;
    for(const t of toks){const s=tokenScore(t,e);if(!s){sum=-1;break}sum+=s}
    if(sum<0)continue;
    let sc=sum/toks.length+(e.name.startsWith(q)?60:e.name.includes(q)?30:e.compact.startsWith(qc)?40:0);
    sc+=e.i?e.i.r*2:6;
    hits.push({e,sc});
  }
  hits.sort((a,b)=>b.sc-a.sc);
  const by={},order=[];
  for(const h of hits){const g=h.e.g;if(!by[g]){by[g]=[];order.push(g)}if(by[g].length<PER_GROUP)by[g].push(h.e)}
  const out=[];let n=0;
  for(const g of order){const rows=by[g].slice(0,TOTAL-n);if(!rows.length)break;out.push({g,rows});n+=rows.length}
  return out;
}
const popular=()=>[{g:'Destination',title:'Popular destinations',rows:Object.values(PLACES).sort((a,b)=>COUNT[b.k]-COUNT[a.k]).slice(0,5).map(p=>INDEX.find(e=>e.p===p))}];

function mark(text,toks){
  const flat=text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,' ');
  if(flat.length!==text.length||!toks.length)return esc(text);
  const hit=new Array(text.length).fill(false);
  for(const t of toks){let at=flat.search(new RegExp('(^| )'+t));if(at>=0&&flat[at]===' ')at++;if(at<0)at=flat.indexOf(t);if(at>=0)for(let k=at;k<at+t.length;k++)hit[k]=true}
  let h='';for(let k=0;k<text.length;k++){const a=hit[k],b=hit[k-1];h+=(a&&!b?'<mark>':'')+(!a&&b?'</mark>':'')+esc(text[k])}
  return h+(hit[text.length-1]?'</mark>':'');
}
const pesos=i=>{const a=(i.p+i.hi)/2,n=a<=200?1:a<=450?2:a<=700?3:4;return`<span class="tm-pesos" aria-label="Price level ${n} of 4">${'₱'.repeat(n)}</span>`};
function meta(e){
  const i=e.i;
  if(e.p)return`<span>Destination</span> · <span>${COUNT[e.p.k]||0} places to stay, eat &amp; visit</span>`;
  if(e.g==='Hotel')return`<span class="tm-stars" aria-label="${i.st} star hotel">${stars(i.st)}</span> · ${i.st}-Star Hotel`;
  if(e.g==='Resort')return`<span class="tm-stars" aria-label="${i.st} star resort">${stars(i.st)}</span> · ${i.st>=5?'Luxury Resort':i.st+'-Star Resort'}`;
  if(e.g==='Restaurant')return`<span class="tm-rate" aria-label="Rated ${i.r} out of 5">★ ${i.r}</span> · ${esc(i.cuisine)} · ${pesos(i)}`;
  return`${esc(i.type)} · <span class="tm-rate" aria-label="Rated ${i.r} out of 5">★ ${i.r}</span>${i.n>=200?' · Popular':''}`;
}
function rowHtml(e,toks,idx){
  const i=e.i,title=e.p?e.p.s:i.name,loc=e.p?e.p.n:i.loc;
  const attr=e.p?`data-place="${e.p.k}"`:`data-open="${i.id}"`;
  return`<div class="tm-sug-item" role="option" id="tm-opt-${idx}" data-idx="${idx}" ${attr} aria-selected="false"><span class="tm-sug-ic" aria-hidden="true">${GROUPS[e.g].icon}</span><span class="tm-sug-tx"><b>${mark(title,toks)}</b><small>${esc(loc)}</small><small class="tm-meta">${meta(e)}</small></span></div>`;
}

const panel=document.createElement('div');
panel.id='tm-sug';panel.className='tm-sug';panel.setAttribute('role','listbox');panel.setAttribute('aria-label','Search suggestions');
document.body.appendChild(panel);
let cur=null,active=-1;
const rows=()=>[...panel.querySelectorAll('.tm-sug-item')];
const isSearchInput=el=>el&&el.tagName==='INPUT'&&INPUTS.includes(el.id);

function setActive(n){
  const R=rows();active=R.length?(n+R.length)%R.length:-1;
  R.forEach((r,k)=>{r.classList.toggle('on',k===active);r.setAttribute('aria-selected',k===active)});
  if(cur){active>=0?cur.setAttribute('aria-activedescendant',R[active].id):cur.removeAttribute('aria-activedescendant')}
  if(active>=0)R[active].scrollIntoView({block:'nearest'});
}
function render(){
  const q=cur.value.trim(),toks=norm(q).split(' ').filter(Boolean);
  const G=q?search(q):popular();
  let html='',idx=0;
  if(!G.length){
    const ex=Object.values(PLACES).sort((a,b)=>COUNT[b.k]-COUNT[a.k]).slice(0,3).map(p=>p.s);
    html=`<div class="tm-sug-empty"><span aria-hidden="true">🔍</span><b>No results found for “${esc(q)}”</b><p>Check the spelling, or try a destination such as ${ex.slice(0,-1).join(', ')} or ${ex[ex.length-1]}.</p></div>`;
  }else{
    for(const grp of G){
      html+=`<div class="tm-sug-h" role="presentation">${grp.title||GROUPS[grp.g].label}</div>`;
      for(const e of grp.rows)html+=rowHtml(e,toks,idx++);
    }
    html+='<div class="tm-sug-foot" aria-hidden="true">↑↓ to navigate · Enter to select · Esc to close</div>';
  }
  panel.innerHTML=html;active=-1;
  cur.removeAttribute('aria-activedescendant');
}
function position(){
  if(!cur||!document.contains(cur)||cur.offsetParent===null)return close();
  const a=cur.closest('.field')||cur,r=a.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=innerHeight,small=vw<600;
  const w=small?vw-16:Math.min(Math.max(r.width,380),vw-16);
  const s=panel.style;
  s.width=w+'px';s.left=(small?8:Math.min(Math.max(8,r.left),vw-w-8))+'px';s.top=(r.bottom+6)+'px';
  s.maxHeight=Math.max(180,vh-r.bottom-6-(vw<760?72:14))+'px';
}
function open(){render();panel.classList.add('open');cur.setAttribute('aria-expanded','true');position()}
function close(){
  panel.classList.remove('open');
  if(cur){cur.setAttribute('aria-expanded','false');cur.removeAttribute('aria-activedescendant')}
  active=-1;
}

function prepare(inp){
  if(inp._tm)return;inp._tm=1;
  inp.removeAttribute('list');
  inp.setAttribute('role','combobox');inp.setAttribute('aria-autocomplete','list');
  inp.setAttribute('aria-controls','tm-sug');inp.setAttribute('aria-expanded','false');
  const b=document.createElement('button');
  b.type='button';b.className='tm-clear';b.setAttribute('aria-label','Clear search');b.textContent='✕';
  inp.after(b);inp.style.paddingRight='28px';
  const host=inp.parentElement;if(getComputedStyle(host).position==='static')host.style.position='relative';
  inp._clr=b;
}
function syncClear(inp){
  const b=inp._clr;if(!b)return;
  b.hidden=!inp.value;
  b.style.top=(inp.offsetTop+(inp.offsetHeight-22)/2)+'px';
  b.style.left=(inp.offsetLeft+inp.offsetWidth-26)+'px';
}
function choose(row){
  if(row.dataset.place){
    const p=PLACES[row.dataset.place],inp=cur;
    inp.value=p.n;syncClear(inp);close();
    if(inp.id==='r-loc')inp.dispatchEvent(new Event('change',{bubbles:true}));
    else document.getElementById('btn-home-search')?.focus();
  }else{
    if(cur&&cur._prev!==undefined)cur.value=cur._prev;
    close();
  }
}
document.addEventListener('focusin',e=>{
  if(!isSearchInput(e.target))return;
  cur=e.target;prepare(cur);if(!cur._keep)cur._prev=cur.value;cur._keep=false;syncClear(cur);open();
  if(cur.value){const el=cur;setTimeout(()=>{if(document.activeElement===el)el.select()})}
});
document.addEventListener('input',e=>{
  if(!isSearchInput(e.target))return;
  cur=e.target;syncClear(cur);open();
});
document.addEventListener('keydown',e=>{
  if(!isSearchInput(e.target)||e.target!==cur)return;
  const isOpen=panel.classList.contains('open');
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){
    e.preventDefault();if(!isOpen)open();
    setActive(active<0?(e.key==='ArrowDown'?0:-1):active+(e.key==='ArrowDown'?1:-1));
  }else if(e.key==='Enter'){
    if(isOpen&&active>=0){e.preventDefault();rows()[active].click()}
    else{close();if(cur.id==='h-loc'){e.preventDefault();document.getElementById('btn-home-search')?.click()}}
  }else if(e.key==='Escape'){if(isOpen){e.preventDefault();close()}}
  else if(e.key==='Tab')close();
});
panel.addEventListener('mousedown',e=>e.preventDefault());
panel.addEventListener('mousemove',e=>{const r=e.target.closest('.tm-sug-item');if(r&&+r.dataset.idx!==active)setActive(+r.dataset.idx)});
panel.addEventListener('click',e=>{const r=e.target.closest('.tm-sug-item');if(r)choose(r)});
document.addEventListener('click',e=>{
  const t=e.target;
  if(t.closest&&t.closest('.tm-clear')){
    const inp=t.closest('.tm-clear').previousElementSibling;
    inp._keep=true;inp.value='';cur=inp;syncClear(inp);inp.focus();open();return;
  }
  if(panel.classList.contains('open')&&!panel.contains(t)&&t!==cur)close();
});
window.addEventListener('resize',()=>{if(panel.classList.contains('open')){position();if(cur)syncClear(cur)}});
window.addEventListener('scroll',()=>{if(panel.classList.contains('open'))position()},true);
window.addEventListener('hashchange',close);

(()=>{
  const row=document.querySelector('#s-home .searchcard .field-row'),loc=document.getElementById('h-loc');
  if(!row||!loc)return;
  const main=loc.closest('.field'),lbl=main.querySelector('label'),chk=document.querySelector('#s-home .searchcard .chk');
  lbl.textContent='Search';
  loc.placeholder='Hotels, restaurants, attractions or destinations';
  row.classList.add('tm-one');
  const card=row.parentElement,tg=document.createElement('button');
  tg.type='button';tg.className='tm-opts-toggle';tg.setAttribute('aria-expanded','false');
  const $v=id=>document.getElementById(id);
  const short=v=>v?new Date(v+'T00:00').toLocaleDateString('en-PH',{day:'numeric',month:'short'}):'';
  const paint=()=>{
    const g=+$v('h-g').value||1;
    tg.innerHTML=`<span>Dates &amp; guests</span><small>${short($v('h-in').value)} – ${short($v('h-out').value)} · ${g} guest${g===1?'':'s'}</small><i aria-hidden="true">▾</i>`;
  };
  paint();
  tg.addEventListener('click',()=>{const o=card.classList.toggle('tm-opts-open');tg.setAttribute('aria-expanded',o)});
  ['h-in','h-out','h-g'].forEach(id=>$v(id).addEventListener('input',paint));
  (chk||row).insertAdjacentElement(chk?'beforebegin':'afterend',tg);
})();

window.TM_SUGGEST={search};
})();
