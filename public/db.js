/* ==========================================================================
   TravelMate — shared database (db.js)
   One database in localStorage ("travelmate_db_v1") used by every page:
     login.html  -> registers / signs in users        (USERS)
     index.html  -> bookings, trips, reviews, forum, host listings
     admin.html  -> reads and manages all of it, and refreshes live
   Load data.js first, then this file.
   Demo only: localStorage lives in the browser. A real deployment would put
   these same tables behind a server API and hash passwords on the server.
   ========================================================================== */
(()=>{
'use strict';
const SCHEMA={
  USERS:{pk:"UserID",cols:["UserID","UserName","FirstName","LastName","Email","Password","ProfilePhotoUrl","DateRegistered","Role"]},
  LISTING:{pk:"ListingID",cols:["ListingID","Category","ListingStatus","HostUserID"]},
  HOTELS:{pk:"HotelID",cols:["HotelID","ListingID","HotelName","StarRating","PriceRange","NightlyRate","Description","Amenities","ImageURL","ContactInfo","Address"]},
  RESTAURANTS:{pk:"RestaurantID",cols:["RestaurantID","ListingID","RestaurantName","CuisineType","PriceRange","Address","Rating","ImageURL"]},
  ATTRACTIONS:{pk:"AttractionID",cols:["AttractionID","ListingID","AttractionName","Category","Address","Description","ImageURL","Rating","EntranceFee"]},
  TRIP_PLANS:{pk:"TripID",cols:["TripID","UserID","TripName","StartTime","EndTime","Notes","TripStatus"]},
  TRIP_PLAN_ITEMS:{pk:"ItemID",cols:["ItemID","TripID","ItemType","ItemName","StartTime","EndTime","Notes","ListingID"]},
  BOOKINGS:{pk:"BookingID",cols:["BookingID","UserID","ListingID","CheckInDate","CheckOutDate","NumGuests","TotalPrice","BookingStatus","PaymentRef"]},
  REVIEWS:{pk:"ReviewID",cols:["ReviewID","UserID","BookingID","Rating","Title","ReviewText","VisitDate","ReviewDate","HelpfulCount","Flagged"]},
  HOTEL_REVIEWS:{pk:"ReviewID",cols:["ReviewID","HotelID"]},
  RESTAURANT_REVIEWS:{pk:"ReviewID",cols:["ReviewID","RestaurantID"]},
  ATTRACTION_REVIEWS:{pk:"ReviewID",cols:["ReviewID","AttractionID"]},
  FORUM_POSTS:{pk:"PostID",cols:["PostID","UserID","Title","PostText","PostDate","HelpfulCount","Flagged"]},
  PHOTOS:{pk:"PhotoID",cols:["PhotoID","UserID","PostID","ReviewID","PhotoURL","Caption","Skin"]},
  FORUM_REPLIES:{pk:"ReplyID",cols:["ReplyID","PostID","UserID","ReplyText","ReplyDate","ParentMessageID","HelpfulCount"]}
};
const TABLES=Object.keys(SCHEMA);
const SKINS=["beach","pine","food","ramen","temple","falls","city","sun","leaf","rose"];
function h(s){let x=5381;for(let i=0;i<s.length;i++)x=((x<<5)+x+s.charCodeAt(i))>>>0;return "sha$"+x.toString(16).padStart(8,"0");}

function seed(){
const CAT=catalog(),LID=n=>CAT.ids[n]?CAT.ids[n].ListingID:null,AID=n=>CAT.ids[n]?CAT.ids[n].AttractionID:null;
return{
 USERS:[
  {UserID:"U001",UserName:"ethanreyes",FirstName:"Ethan",LastName:"Reyes",Email:"ethan.reyes@gmail.com",Password:h("travel123"),ProfilePhotoUrl:"u001_profile.jpg",DateRegistered:"2026-01-05",Role:"Traveler"},
  {UserID:"U002",UserName:"mgarcia",FirstName:"Maria",LastName:"Garcia",Email:"maria.garcia@gmail.com",Password:h("travel123"),ProfilePhotoUrl:"u002_profile.jpg",DateRegistered:"2026-01-07",Role:"Host"},
  {UserID:"U003",UserName:"jdelacruz",FirstName:"Jose",LastName:"Dela Cruz",Email:"jose.delacruz@gmail.com",Password:h("travel123"),ProfilePhotoUrl:"",DateRegistered:"2026-01-09",Role:"Traveler"},
  {UserID:"U004",UserName:"akim",FirstName:"Ana",LastName:"Kim",Email:"ana.kim@gmail.com",Password:h("travel123"),ProfilePhotoUrl:"u004_profile.jpg",DateRegistered:"2026-01-11",Role:"Host"},
  {UserID:"U005",UserName:"admin",FirstName:"Site",LastName:"Administrator",Email:"admin@travelmate.ph",Password:h("admin123"),ProfilePhotoUrl:"",DateRegistered:"2026-01-01",Role:"Administrator"}],
 LISTING:CAT.LISTING,HOTELS:CAT.HOTELS,RESTAURANTS:CAT.RESTAURANTS,ATTRACTIONS:CAT.ATTRACTIONS,
 TRIP_PLANS:[
  {TripID:"T001",UserID:"U001",TripName:"La Union Escape",StartTime:"2026-03-14",EndTime:"2026-03-16",Notes:"Long weekend.",TripStatus:"Confirmed"},
  {TripID:"T002",UserID:"U001",TripName:"Baguio Weekend",StartTime:"2026-04-02",EndTime:"2026-04-04",Notes:"Bring a jacket.",TripStatus:"Draft"}],
 TRIP_PLAN_ITEMS:[
  {ItemID:"I001",TripID:"T001",ItemType:"Hotel",ItemName:"Azure Bay Resort",StartTime:"2026-03-14T14:00",EndTime:"2026-03-16T11:00",Notes:"2 nights",ListingID:LID("Azure Bay Resort")},
  {ItemID:"I002",TripID:"T001",ItemType:"Attraction",ItemName:"Ma-Cho Temple",StartTime:"2026-03-15T09:00",EndTime:"2026-03-15T11:00",Notes:"Go early",ListingID:LID("Ma-Cho Temple")},
  {ItemID:"I003",TripID:"T001",ItemType:"Restaurant",ItemName:"Kusina ni Aling Rosa",StartTime:"2026-03-15T12:00",EndTime:"2026-03-15T13:30",Notes:"Lunch stop",ListingID:LID("Kusina ni Aling Rosa")},
  {ItemID:"I004",TripID:"T001",ItemType:"Custom",ItemName:"Bonfire at Urbiztondo",StartTime:"2026-03-15T20:30",EndTime:"",Notes:"Bring firewood",ListingID:null},
  {ItemID:"I005",TripID:"T002",ItemType:"Hotel",ItemName:"Pine Crest Inn",StartTime:"2026-04-02T15:00",EndTime:"2026-04-04T11:00",Notes:"Book early",ListingID:LID("Pine Crest Inn")}],
 BOOKINGS:[
  {BookingID:"B001",UserID:"U001",ListingID:LID("Azure Bay Resort"),CheckInDate:"2026-03-14",CheckOutDate:"2026-03-16",NumGuests:2,TotalPrice:9000,BookingStatus:"Completed",PaymentRef:"tok_9f21c4e7"},
  {BookingID:"B002",UserID:"U001",ListingID:LID("Pine Crest Inn"),CheckInDate:"2026-04-02",CheckOutDate:"2026-04-04",NumGuests:3,TotalPrice:6400,BookingStatus:"Confirmed",PaymentRef:"tok_44be01a2"},
  {BookingID:"B003",UserID:"U003",ListingID:LID("Azure Bay Resort"),CheckInDate:"2026-04-10",CheckOutDate:"2026-04-12",NumGuests:2,TotalPrice:9000,BookingStatus:"Completed",PaymentRef:"tok_7c0d9911"}],
 REVIEWS:[
  {ReviewID:"RV001",UserID:"U001",BookingID:"B001",Rating:5,Title:"Worth every peso",ReviewText:"Clean rooms and the beach is steps away. Staff let us check out late without asking.",VisitDate:"2026-03-16",ReviewDate:"2026-03-18",HelpfulCount:12,Flagged:false},
  {ReviewID:"RV002",UserID:"U003",BookingID:"B003",Rating:4,Title:"Great location, thin walls",ReviewText:"Everything about the beach access is perfect. You will hear the corridor at night though.",VisitDate:"2026-04-12",ReviewDate:"2026-04-13",HelpfulCount:5,Flagged:false},
  {ReviewID:"RV003",UserID:"U001",BookingID:null,Rating:5,Title:"Best kare-kare in town",ReviewText:"Home-style cooking and generous servings. The kare-kare is the reason to come.",VisitDate:"2026-03-15",ReviewDate:"2026-03-17",HelpfulCount:8,Flagged:false},
  {ReviewID:"RV004",UserID:"U003",BookingID:null,Rating:5,Title:"Peaceful view",ReviewText:"Go early. The gulf view from the top of the steps is worth the climb.",VisitDate:"2026-04-11",ReviewDate:"2026-04-12",HelpfulCount:5,Flagged:true}],
 HOTEL_REVIEWS:[{ReviewID:"RV001",HotelID:"H001"},{ReviewID:"RV002",HotelID:"H001"}],
 RESTAURANT_REVIEWS:[{ReviewID:"RV003",RestaurantID:"R001"}],
 ATTRACTION_REVIEWS:[{ReviewID:"RV004",AttractionID:AID("Ma-Cho Temple")}],
 FORUM_POSTS:[
  {PostID:"P001",UserID:"U001",Title:"Best surf spots in La Union?",PostText:"Going up for a long weekend in March, complete beginner. Where do most people take their first lesson, and is board rental cheaper on the beach or through the hotel?",PostDate:"2026-03-20T09:15",HelpfulCount:14,Flagged:false},
  {PostID:"P002",UserID:"U004",Title:"Cheap eats near the city plaza?",PostText:"Budget is around ₱300 for two. Anything open past 9 PM?",PostDate:"2026-03-22T18:40",HelpfulCount:6,Flagged:true}],
 PHOTOS:[
  {PhotoID:"PH001",UserID:"U001",PostID:"P001",ReviewID:null,PhotoURL:"ph001.jpg",Caption:"Sunset at Urbiztondo",Skin:"beach"},
  {PhotoID:"PH002",UserID:"U001",PostID:"P001",ReviewID:null,PhotoURL:"ph002.jpg",Caption:"Board rental shacks",Skin:"city"},
  {PhotoID:"PH003",UserID:"U004",PostID:"P002",ReviewID:null,PhotoURL:"ph003.jpg",Caption:"Plaza food stalls",Skin:"food"},
  {PhotoID:"PH004",UserID:"U001",PostID:null,ReviewID:"RV001",PhotoURL:"ph004.jpg",Caption:"Room view",Skin:"beach"},
  {PhotoID:"PH005",UserID:"U001",PostID:null,ReviewID:"RV001",PhotoURL:"ph005.jpg",Caption:"Pool at sunrise",Skin:"falls"}],
 FORUM_REPLIES:[
  {ReplyID:"RP001",PostID:"P001",UserID:"U002",ReplyText:"Try Urbiztondo — the beach break is forgiving and instructors are everywhere. About ₱400 an hour including the lesson.",ReplyDate:"2026-03-20T10:02",ParentMessageID:null,HelpfulCount:8},
  {ReplyID:"RP002",PostID:"P001",UserID:"U003",ReplyText:"Carille is quieter if the weekend crowd bothers you. Same instructors drive over.",ReplyDate:"2026-03-20T11:40",ParentMessageID:"RP001",HelpfulCount:3},
  {ReplyID:"RP003",PostID:"P002",UserID:"U001",ReplyText:"Kusina ni Aling Rosa is open until 10 and two can eat well for ₱300.",ReplyDate:"2026-03-22T19:05",ParentMessageID:null,HelpfulCount:4}],
 _log:[],_audit:[],_session:null};
}

/* The traveler catalog in data.js is the source of truth for listings, so listing IDs (L001…) mean
   the same thing in the traveler app and in the admin console. */
function catalog(){
  const items=(window.TM_DATA&&window.TM_DATA.ITEMS)||[];
  const c={LISTING:[],HOTELS:[],RESTAURANTS:[],ATTRACTIONS:[],ids:{}};
  const n={Hotel:0,Restaurant:0,Attraction:0};
  const pad=(p,k)=>p+String(k).padStart(3,"0");
  const peso=v=>"₱"+Math.round(v).toLocaleString("en-PH");
  items.forEach((i,k)=>{
    const lid=i.id,img=lid.toLowerCase()+".jpg";
    c.LISTING.push({ListingID:lid,Category:i.kind,ListingStatus:"Published",HostUserID:k%2?"U004":"U002"});
    n[i.kind]++;
    let d;
    if(i.kind==="Hotel")d={HotelID:pad("H",n.Hotel),ListingID:lid,HotelName:i.name,StarRating:i.st,PriceRange:peso(i.p)+"–"+peso(i.p*1.5),NightlyRate:i.p,Description:i.blurb,Amenities:i.tags.join(";"),ImageURL:img,ContactInfo:"0917-555-"+String(1000+(Number(lid.slice(1))*137)%9000),Address:i.loc};
    else if(i.kind==="Restaurant")d={RestaurantID:pad("R",n.Restaurant),ListingID:lid,RestaurantName:i.name,CuisineType:i.cuisine,PriceRange:peso(i.p)+"–"+peso(i.hi),Address:i.loc,Rating:i.r,ImageURL:img};
    else d={AttractionID:pad("A",n.Attraction),ListingID:lid,AttractionName:i.name,Category:i.type,Address:i.loc,Description:i.blurb,ImageURL:img,Rating:i.r,EntranceFee:i.p};
    c[i.kind==="Hotel"?"HOTELS":i.kind==="Restaurant"?"RESTAURANTS":"ATTRACTIONS"].push(d);
    c.ids[i.name]=d;
  });
  return c;
}

/* ---------------- shared store ---------------- */
const KEY="travelmate_db_v1";
const stamp=()=>new Date().toISOString().slice(0,19).replace("T"," ");
function ensure(db){
  TABLES.forEach(t=>{if(!Array.isArray(db[t]))db[t]=[];});
  if(!Array.isArray(db._log))db._log=[];
  if(!Array.isArray(db._audit))db._audit=[];
  if(!("_session" in db))db._session=null;
  return db;
}
function raw(){try{return localStorage.getItem(KEY);}catch(e){return null;}}
function read(){
  const r=raw();
  if(r){try{return ensure(JSON.parse(r));}catch(e){}}
  const db=ensure(seed());
  try{localStorage.setItem(KEY,JSON.stringify(db));}catch(e){}
  return db;
}
function write(db){localStorage.setItem(KEY,JSON.stringify(db));}

/* Helpers that change a db object in memory; tx() saves it. */
const H={
  nid(db,t,pre,w){
    const pk=SCHEMA[t].pk;let m=0;
    db[t].forEach(r=>{const n=parseInt(String(r[pk]).replace(/\D/g,""),10);if(!isNaN(n)&&n>m)m=n;});
    return pre+String(m+1).padStart(w,"0");
  },
  log(db,sql){db._log.unshift({t:stamp().slice(11),sql});if(db._log.length>250)db._log.pop();},
  ins(db,t,row){db[t].push(row);H.log(db,"INSERT INTO "+t+" …");return row;},
  upd(db,t,id,patch){
    const pk=SCHEMA[t].pk,r=db[t].find(x=>x[pk]===id);if(!r)return null;
    Object.assign(r,patch);H.log(db,"UPDATE "+t+" SET "+Object.keys(patch).join(", ")+" WHERE "+pk+" = '"+id+"';");return r;
  },
  del(db,t,id){
    const pk=SCHEMA[t].pk,i=db[t].findIndex(x=>x[pk]===id);if(i<0)return false;
    db[t].splice(i,1);H.log(db,"DELETE FROM "+t+" WHERE "+pk+" = '"+id+"';");return true;
  },
  aud(db,action,target,detail,by){
    db._audit.unshift({At:stamp(),By:by||"—",Action:action,Target:target||"—",Detail:detail||""});
    if(db._audit.length>400)db._audit.pop();
  }
};

/* Read the latest copy, let fn change it, write it straight back. Because this all happens in one
   synchronous step, two tabs can never overwrite each other's changes. */
function tx(fn){const db=read();const out=fn(db,H);write(db);return out;}

window.SCHEMA=SCHEMA;window.TABLES=TABLES;window.SKINS=SKINS;window.h=h;window.seed=seed;
window.TMDB={KEY,SCHEMA,TABLES,h,seed,read,write,raw,tx,H,
  rows:t=>read()[t],
  one:(t,id)=>read()[t].find(r=>r[SCHEMA[t].pk]===id)||null};
})();