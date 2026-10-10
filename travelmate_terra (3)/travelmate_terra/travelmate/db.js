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
  PHOTOS:{pk:"PhotoID",cols:["PhotoID","UserID","PostID","ReviewID","ListingID","PhotoURL","Caption","Skin"]},
  FORUM_REPLIES:{pk:"ReplyID",cols:["ReplyID","PostID","UserID","ReplyText","ReplyDate","ParentMessageID","HelpfulCount"]}
};
const TABLES=Object.keys(SCHEMA);
function h(s){let x=5381;for(let i=0;i<s.length;i++)x=((x<<5)+x+s.charCodeAt(i))>>>0;return "sha$"+x.toString(16).padStart(8,"0");}

function catalog(){
  const items=(window.TM_DATA&&window.TM_DATA.ITEMS)||[];
  const c={LISTING:[],HOTELS:[],RESTAURANTS:[],ATTRACTIONS:[]};
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
  });
  return c;
}

const KEY="travelmate_db_v1";
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
  const db=ensure({});
  try{localStorage.setItem(KEY,JSON.stringify(db));}catch(e){}
  return db;
}

window.SCHEMA=SCHEMA;window.TABLES=TABLES;window.h=h;
window.TMDB={KEY,SCHEMA,TABLES,read,catalog};
})();