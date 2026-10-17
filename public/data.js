window.TM_DATA=(()=>{
const P={
  sj:{n:'San Juan, La Union',s:'San Juan',lat:16.670,lng:120.330,al:['san juan','urbiztondo']},
  sf:{n:'San Fernando, La Union',s:'San Fernando',lat:16.616,lng:120.316,al:['san fernando','la union','sevilla']},
  sg:{n:'San Gabriel, La Union',s:'San Gabriel',lat:16.633,lng:120.413,al:['san gabriel']},
  bg:{n:'Baguio City',s:'Baguio',lat:16.402,lng:120.596,al:['baguio']},
  sa:{n:'Sagada, Mountain Province',s:'Sagada',lat:17.081,lng:120.901,al:['sagada','mountain province']},
  vg:{n:'Vigan, Ilocos Sur',s:'Vigan',lat:17.575,lng:120.387,al:['vigan','ilocos sur','ilocos']},
  tg:{n:'Tagaytay, Cavite',s:'Tagaytay',lat:14.115,lng:120.962,al:['tagaytay','cavite']},
  cb:{n:'Cebu City',s:'Cebu City',lat:10.316,lng:123.885,al:['cebu']},
  bo:{n:'Boracay, Aklan',s:'Boracay',lat:11.967,lng:121.925,al:['boracay','aklan','malay']},
  en:{n:'El Nido, Palawan',s:'El Nido',lat:11.178,lng:119.393,al:['el nido','palawan']}
};
Object.assign(P,{
  tk:{n:'Tokyo, Japan',s:'Tokyo',c:'Japan',lat:35.676,lng:139.650,al:['tokyo','shibuya','shinjuku'],h:1},
  ky:{n:'Kyoto, Japan',s:'Kyoto',c:'Japan',lat:35.011,lng:135.768,al:['kyoto','gion']},
  se:{n:'Seoul, South Korea',s:'Seoul',c:'South Korea',lat:37.566,lng:126.978,al:['seoul','myeongdong']},
  sn:{n:'Singapore',s:'Singapore',c:'Singapore',lat:1.290,lng:103.852,al:['singapore','marina bay'],h:1},
  bk:{n:'Bangkok, Thailand',s:'Bangkok',c:'Thailand',lat:13.756,lng:100.502,al:['bangkok']},
  pk:{n:'Phuket, Thailand',s:'Phuket',c:'Thailand',lat:7.880,lng:98.392,al:['phuket','patong']},
  bl:{n:'Bali, Indonesia',s:'Bali',c:'Indonesia',lat:-8.650,lng:115.170,al:['bali','ubud','seminyak'],h:1},
  pr:{n:'Paris, France',s:'Paris',c:'France',lat:48.857,lng:2.352,al:['paris'],h:1},
  rm:{n:'Rome, Italy',s:'Rome',c:'Italy',lat:41.903,lng:12.496,al:['rome','roma']},
  bc:{n:'Barcelona, Spain',s:'Barcelona',c:'Spain',lat:41.385,lng:2.173,al:['barcelona']},
  ld:{n:'London, United Kingdom',s:'London',c:'United Kingdom',lat:51.507,lng:-0.128,al:['london']},
  ny:{n:'New York, United States',s:'New York',c:'United States',lat:40.713,lng:-74.006,al:['new york','nyc','manhattan'],h:1},
  sy:{n:'Sydney, Australia',s:'Sydney',c:'Australia',lat:-33.869,lng:151.209,al:['sydney']},
  ak:{n:'Auckland, New Zealand',s:'Auckland',c:'New Zealand',lat:-36.848,lng:174.763,al:['auckland']}
});
Object.values(P).forEach(p=>{p.c=p.c||'Philippines'});
Object.assign(P.bo,{h:1});
Object.keys(P).forEach(k=>P[k].k=k);

const HOTELS=[
['Azure Bay Resort','sj',4,4500,4.8,128,'WiFi,Pool,Parking,Beachfront,Air conditioning,24-hour front desk,Breakfast','Beachfront resort in San Juan, a four-minute walk from the surf break. Rooms face either the garden or the gulf, and the on-site kitchen serves breakfast until 10:00.','beach',1],
['Surfers Rest Inn','sj',3,2200,4.4,73,'WiFi,Air conditioning,Surf rental,Breakfast','Budget-friendly inn a short walk from the surf lessons, with a shared lounge and a rooftop deck.','beach',1],
['Coco Grove Beach House','sj',4,3800,4.6,54,'WiFi,Pool,Parking,Beachfront','Small beach house with a garden pool and rooms that sleep up to four.','beach',0],
['Poro Point Bay Hotel','sf',4,3400,4.3,91,'WiFi,Pool,Parking,Breakfast,Air conditioning','Full-service hotel in the provincial capital, close to the port, the city market and the bus terminal.','city',1],
['Tangadan Riverside Lodge','sg',2,1600,4.5,32,'WiFi,Parking,Breakfast,Tour guide available','Simple riverside lodge used by trekkers heading up to the falls.','pine',0],
['Pine Crest Inn','bg',3,3200,4.4,61,'WiFi,Breakfast','Mountain-side inn in Baguio with cool evenings, a small lounge and a short ride to the city centre.','pine',0],
['Camp Hill Lodge','bg',4,5200,4.7,104,'WiFi,Parking,Breakfast,Fireplace','Timber-lined lodge near the pine forest with a fireplace lounge and a hearty breakfast.','pine',1],
['Cloudline Suites','bg',5,7400,4.8,88,'WiFi,Pool,Parking,Breakfast,Spa','Upscale suites with city and valley views, a spa and an all-day cafe.','city',1],
['Session Road Backpackers','bg',2,900,4.1,140,'WiFi,Kitchen access,Lockers','Hostel with dorms and private rooms a few minutes on foot from the main street.','city',0],
['Echo Valley Lodge','sa',3,2000,4.6,47,'WiFi,Breakfast,Mountain view','Family-run lodge with valley views and a small tea room.','pine',0],
['Misty Ridge Homestay','sa',2,1200,4.5,39,'WiFi,Parking,Breakfast,Hot shower','Homestay near the town centre with hot showers and a shared kitchen.','pine',0],
['Casa Crisologo Heritage Inn','vg',4,4100,4.6,66,'WiFi,Air conditioning,Breakfast,Courtyard','Restored ancestral house with a courtyard, steps from the cobblestone street.','temple',1],
['Bantay View Pension','vg',2,1500,4.2,58,'WiFi,Air conditioning,Parking','Basic, clean rooms for travelers exploring the heritage district.','city',0],
['Ridgeview Tagaytay Hotel','tg',4,5600,4.5,120,'WiFi,Pool,Parking,Breakfast,Lake view','Hotel on the ridge with lake and volcano views and a rooftop restaurant.','pine',1],
['Cool Breeze Cabins','tg',3,2900,4.3,77,'WiFi,Parking,Fireplace','Cabins for small groups, with a garden and a fire pit.','pine',0],
['Harbor Point Hotel','cb',4,4800,4.5,210,'WiFi,Pool,Parking,Breakfast,Air conditioning','Business-friendly hotel near the waterfront and the city centre.','city',1],
['Colon Central Inn','cb',2,1400,4.0,165,'WiFi,Air conditioning','Simple central inn close to shops and transport.','city',0],
['Shoreline White Beach Resort','bo',5,9200,4.8,180,'WiFi,Pool,Beachfront,Breakfast,Spa','Beachfront resort on the white sand strip with sunset-facing rooms.','beach',1],
['Palm Path Bungalows','bo',3,3100,4.4,96,'WiFi,Air conditioning,Breakfast','Bungalows set back from the beach around a quiet garden.','beach',0],
['Lagoon Bay Retreat','en',4,6800,4.7,84,'WiFi,Pool,Breakfast,Tour desk','Cottages by the bay, with island tours bookable at the front desk.','beach',1],
['Bacuit Backpackers','en',2,1100,4.3,120,'WiFi,Air conditioning,Tour desk','Hostel in town, close to boat tours and restaurants.','beach',0]
];

const RESTAURANTS=[
['Kusina ni Aling Rosa','sj','Filipino',250,500,4.7,86,'Filipino,Seafood,Family-friendly,Takeout,Air conditioning,WiFi','A cozy Filipino restaurant known for home-style meals, fresh seafood, and generous servings. Popular with travelers looking for a relaxed dinner after a day at the beach.','food'],
['Wave Cafe & Brunch','sj','Cafe',180,420,4.5,64,'Cafe,Brunch,WiFi,Vegetarian options','Casual brunch spot, popular after early surf lessons.','food'],
['Pizza on the Sand','sj','Italian',300,650,4.4,52,'Italian,Pizza,Family-friendly,Late night','Wood-fired pizza and cold drinks a few steps from the beach.','food'],
['Longganisa & Empanada House','sf','Filipino',80,250,4.5,101,'Filipino,Local favorites,Takeout,Budget','Ilocano staples served all day, good for a cheap and filling stop.','food'],
['Harbor Grill','sf','Seafood',350,800,4.3,49,'Seafood,Grill,Family-friendly','Grilled catch of the day near the port.','food'],
['Trailhead Karinderya','sg','Filipino',90,200,4.4,27,'Filipino,Budget,Takeout,Local favorites','Roadside eatery for hungry trekkers.','food'],
['Strawberry Hill Cafe','bg','Cafe',150,380,4.6,133,'Cafe,Dessert,WiFi,Vegetarian options','Strawberry desserts and hot chocolate, a short walk from the park.','food'],
['Pine Table Bistro','bg','Filipino',300,700,4.7,98,'Filipino,Farm-to-table,Family-friendly,Air conditioning','Farm-to-table plates built around highland vegetables.','food'],
['Ramen Ridge','bg','Japanese',280,520,4.3,76,'Japanese,Ramen,Late night,Air conditioning','Warm bowls for cold evenings.','ramen'],
['Ridge Kitchen','sa','Filipino',150,350,4.5,44,'Filipino,Vegetarian options,Local favorites','Home cooking and local coffee near the town centre.','food'],
['Rice Terrace Corner','sa','Filipino',120,280,4.4,31,'Filipino,Local favorites,Budget','Simple meals for trekkers coming off the trails.','food'],
['Empanada Alley Stall','vg','Filipino',70,180,4.6,88,'Filipino,Street food,Budget,Local favorites','Crisp Vigan-style empanada and other snacks.','food'],
['Kalesa Dinner House','vg','Filipino',300,650,4.4,62,'Filipino,Family-friendly,Air conditioning','Sit-down dinners in a heritage house.','food'],
['Bulalo Point','tg','Filipino',300,600,4.6,150,'Filipino,Family-friendly,Scenic view','Beef shank soup with a ridge view.','food'],
['Taal View Cafe','tg','Cafe',180,400,4.4,90,'Cafe,Scenic view,WiFi,Dessert','Coffee and cake with a view of the lake.','food'],
['Lechon Lane','cb','Filipino',200,450,4.6,220,'Filipino,Takeout,Local favorites','Roast pork by the plate or by the kilo.','food'],
['Sugbo Seafood Grill','cb','Seafood',350,900,4.4,130,'Seafood,Grill,Family-friendly','Choose your catch and have it grilled to order.','food'],
['Sunset Grill','bo','Seafood',400,1000,4.5,170,'Seafood,Grill,Beachfront,Late night','Beachfront tables for sunset dinners.','food'],
['Station 2 Noodle Bar','bo','Asian',250,500,4.2,66,'Asian,Noodles,Budget','Quick noodle bowls and rice plates.','ramen'],
['Bay Catch Restaurant','en','Seafood',350,850,4.6,79,'Seafood,Grill,Beachfront','Fresh catch of the day, grilled to order.','food'],
['Cliffside Coffee','en','Cafe',150,350,4.4,55,'Cafe,Scenic view,WiFi','Coffee and light meals with a view of the bay.','food']
];

const ATTRACTIONS=[
['Urbiztondo Beach','sj','Beach',0,4.6,310,'Beach,Surfing,Sunset,Family-friendly,Free entry','The surf town beach break, with lessons and board rentals along the shore. Busiest on weekends and at sunset.','beach','2–4 hours'],
['Ma-Cho Temple','sf','Landmark',0,4.7,212,'Culture,Temple,Photography,Free entry','A colorful Taoist temple on a hill with views over the city and the sea.','temple','1 hour'],
['Poro Point Lighthouse','sf','Landmark',0,4.4,95,'Landmark,Sea view,Photography,Free entry','A coastal lighthouse with sea views and a quiet walk around the point.','city','1 hour'],
['Tangadan Falls Trek','sg','Nature',50,4.9,214,'Waterfall,Hiking,Swimming,Nature,Tour guide available,Parking','A popular nature adventure featuring a scenic trek through forest trails leading to a waterfall and natural swimming pools. Best for travelers who enjoy outdoor activities.','falls','3–4 hours'],
['Burnham Park','bg','Park',0,4.5,420,'Park,Boating,Family-friendly,Free entry','The central park, with a man-made lake, bike rentals and picnic lawns.','pine','1–2 hours'],
['Mines View Park','bg','Viewpoint',0,4.2,260,'Viewpoint,Photography,Souvenirs,Free entry','A mountain viewpoint with souvenir stalls along the way.','pine','1 hour'],
['BenCab Museum','bg','Museum',150,4.7,190,'Museum,Art,Culture,Cafe','Art museum with galleries, gardens and a cafe.','city','2 hours'],
['Tam-awan Village','bg','Culture',100,4.5,140,'Culture,Art,Photography,Nature','A recreated Cordillera village with huts, art studios and a small gallery.','pine','1–2 hours'],
['Sumaguing Cave','sa','Cave',0,4.8,180,'Cave,Adventure,Guide required','A guided cave trek through large chambers. Wear shoes with good grip.','falls','2–3 hours'],
['Hanging Coffins','sa','Culture',0,4.6,150,'Culture,History,Photography,Guide recommended','Cliffside burial tradition, reached by a short walk with a local guide.','temple','1–2 hours'],
['Kiltepan Viewpoint','sa','Viewpoint',0,4.8,210,'Viewpoint,Sunrise,Photography,Nature','Sunrise views over terraces and a sea of clouds.','pine','1–2 hours'],
['Calle Crisologo','vg','Heritage',0,4.7,300,'Heritage,Culture,Photography,Shopping,Free entry','A cobblestone street lined with ancestral houses, shops and cafes.','temple','1–2 hours'],
['Bantay Church Bell Tower','vg','Landmark',0,4.4,90,'Landmark,History,Photography,Free entry','A historic bell tower on a hill just outside the town centre.','temple','1 hour'],
['Picnic Grove','tg','Park',50,4.3,240,'Park,Scenic view,Family-friendly,Picnic','A ridge park with picnic areas and a view of the lake.','pine','2–3 hours'],
["People's Park in the Sky",'tg','Viewpoint',0,4.2,170,'Viewpoint,History,Photography','A hilltop viewpoint with wide views on clear days.','city','1 hour'],
["Magellan's Cross",'cb','Landmark',0,4.3,280,'Landmark,History,Photography,Free entry','A small chapel housing the historic cross in the old city.','temple','30 minutes'],
['Basilica del Santo Niño','cb','Church',0,4.7,330,'Church,History,Culture,Free entry','One of the oldest churches in the country, in the heart of the old city.','temple','1 hour'],
['Fort San Pedro','cb','Heritage',30,4.4,190,'Heritage,History,Photography','A compact Spanish-era fort by the waterfront.','city','1 hour'],
['White Beach','bo','Beach',0,4.8,520,'Beach,Swimming,Sunset,Water sports,Free entry','The long white sand strip, with restaurants and water sports along the way.','beach','Half day'],
['Puka Shell Beach','bo','Beach',0,4.6,240,'Beach,Swimming,Quiet,Free entry','A quieter beach on the north end of the island.','beach','2–3 hours'],
['Mount Luho Viewpoint','bo','Viewpoint',150,4.4,130,'Viewpoint,Photography,Scenic view','Highest point on the island, with a panorama of the coast.','pine','1 hour'],
['Big Lagoon Tour','en','Island tour',1200,4.8,260,'Island hopping,Snorkeling,Swimming,Nature','Boat tour to the lagoons and small islands of the bay.','falls','Full day'],
['Nacpan Beach','en','Beach',0,4.8,200,'Beach,Swimming,Sunset,Free entry','A long, wide beach with a relaxed pace.','beach','Half day'],
['Taraw Cliff Viewpoint','en','Adventure',500,4.5,110,'Adventure,Viewpoint,Hiking,Photography','A steep climb rewarded by a view over the town and the bay.','falls','2–3 hours']
];

/* International listings. Appended after the original catalogue so existing listing IDs do not change. Prices are shown in PHP, like the rest of the site. */
const INTL_HOTELS=[
['Imperial Park Tower Tokyo','tk',5,26000,4.8,310,'WiFi,Pool,Spa,Breakfast,Air conditioning,24-hour front desk','Upscale tower hotel with skyline views, a spa and a short walk to the subway.','city',1],
['Asakusa Lantern Inn','tk',2,2600,4.3,220,'WiFi,Air conditioning,Luggage storage','Compact, spotless rooms a few minutes from Senso-ji and the river.','temple',0],
['Gion Machiya Inn','ky',4,9800,4.7,140,'WiFi,Breakfast,Courtyard,Air conditioning','Restored wooden townhouse in the geisha district with tatami rooms and a garden courtyard.','temple',1],
['Han River View Hotel','se',4,7600,4.5,260,'WiFi,Pool,Breakfast,Air conditioning,River view','Modern hotel with river views and direct access to the subway.','city',1],
['Hanok Stay Bukchon','se',3,5400,4.6,95,'WiFi,Breakfast,Courtyard','Traditional hanok guesthouse among the palace-district lanes.','temple',0],
['Marina Bay Sands','sn',5,27500,4.7,980,'WiFi,Pool,Spa,Breakfast,Air conditioning,24-hour front desk,Skypark','Landmark integrated resort with a rooftop infinity pool, a mall and a casino on the bay.','city',1],
['Little India Boutique Hotel','sn',3,6200,4.4,150,'WiFi,Air conditioning,Breakfast','Colorful boutique hotel close to hawker food and the MRT.','city',0],
['Chao Phraya Riverside Hotel','bk',5,9800,4.7,420,'WiFi,Pool,Spa,Breakfast,River view,Air conditioning','Riverside hotel with a pool terrace, a spa and a free shuttle boat.','city',1],
['Sukhumvit Budget Stay','bk',2,1900,4.1,300,'WiFi,Air conditioning','Simple rooms next to the skytrain, ideal for short city stays.','city',0],
['Andaman Cove Resort','pk',5,14500,4.8,260,'WiFi,Pool,Beachfront,Spa,Breakfast,Air conditioning','Beachfront resort with sea-view villas, a spa and sunset dining.','beach',1],
['Patong Palm Hotel','pk',3,3400,4.2,330,'WiFi,Pool,Air conditioning,Breakfast','Mid-range hotel a short walk from the beach and night market.','beach',0],
['Ubud Rice Terrace Villas','bl',4,7200,4.8,210,'WiFi,Pool,Breakfast,Garden,Spa','Private villas overlooking rice terraces, with daily breakfast and yoga.','pine',1],
['Seminyak Surf Resort','bl',4,8900,4.6,175,'WiFi,Pool,Beachfront,Breakfast,Surf rental','Beachside resort with a surf school and an open-air restaurant.','beach',1],
['The Ritz Paris','pr',5,58000,4.9,640,'WiFi,Pool,Spa,Breakfast,Air conditioning,24-hour front desk','Historic palace hotel on Place Vend\u00f4me with a spa, a garden and several restaurants.','city',1],
['Left Bank Boutique Hotel','pr',3,12500,4.5,380,'WiFi,Breakfast,Air conditioning','Small hotel on a quiet street, a short walk from the river and the Latin Quarter.','city',0],
['Trastevere Boutique Hotel','rm',4,11500,4.6,240,'WiFi,Breakfast,Air conditioning,Rooftop terrace','Stylish hotel in the old Trastevere quarter, with a terrace overlooking the rooftops.','temple',1],
['Sagrada Vista Hotel','bc',4,13000,4.5,290,'WiFi,Pool,Breakfast,Air conditioning,Rooftop terrace','Rooftop pool and views of the basilica, close to the metro.','city',1],
['Gothic Quarter Suites','bc',3,8800,4.4,200,'WiFi,Air conditioning,Kitchenette','Apartment-style suites in the medieval lanes of the old town.','temple',0],
['Thames Embankment Hotel','ld',5,32000,4.8,520,'WiFi,Spa,Breakfast,Air conditioning,24-hour front desk','Grand riverside hotel with afternoon tea and views of the London Eye.','city',1],
['Camden Lock Inn','ld',3,9500,4.2,310,'WiFi,Breakfast','Simple inn beside the canal market, with quick tube access.','city',0],
['Midtown Lights Hotel','ny',4,18500,4.5,700,'WiFi,Air conditioning,Gym,24-hour front desk','Central hotel a few blocks from Times Square and Central Park.','city',1],
['Brooklyn Bridge Inn','ny',3,11000,4.3,260,'WiFi,Breakfast,Air conditioning','Small inn with views of the bridge and the skyline.','city',0],
['Harbour Bridge Suites','sy',5,22000,4.7,360,'WiFi,Pool,Spa,Breakfast,Air conditioning,Harbour view','Waterfront suites with views of the bridge and the opera house.','city',1],
['Bondi Beach Lodge','sy',3,8200,4.4,240,'WiFi,Beachfront,Breakfast','Relaxed lodge steps from the sand and the coastal walk.','beach',0],
['Waitemata Harbour Hotel','ak',4,9600,4.6,190,'WiFi,Pool,Breakfast,Air conditioning,Harbour view','Harbour-front hotel near the ferry terminal and the city centre.','city',1],
['Shangri-La Boracay Resort','bo',5,28000,4.9,330,'WiFi,Pool,Beachfront,Spa,Breakfast,Air conditioning','Cliffside luxury resort on a private cove with infinity pools and a spa.','beach',1]
];
const INTL_RESTAURANTS=[
['Sushi Kaede','tk','Japanese',1100,2200,4.8,260,'Japanese,Seafood,Air conditioning','Counter-seat sushi with a seasonal omakase menu.','food'],
['Ramen Hoshino','tk','Japanese',350,600,4.6,540,'Japanese,Takeout,Budget-friendly','Rich pork-bone ramen served at a busy counter near the station.','food'],
['Kaiseki Tsukiyomi','ky','Japanese',1800,3200,4.9,120,'Japanese,Fine dining,Air conditioning','Multi-course kaiseki in a quiet townhouse dining room.','food'],
['Gwangjang Kitchen','se','Korean',400,800,4.5,430,'Korean,Street food,Family-friendly','Market-style stalls serving bibimbap, mandu and grilled meats.','food'],
['Marina Hawker Corner','sn','Singaporean',250,500,4.5,610,'Singaporean,Street food,Budget-friendly,Family-friendly','Open-air hawker stalls known for chicken rice, satay and laksa.','food'],
['Baan Mali Thai Kitchen','bk','Thai',300,700,4.6,380,'Thai,Family-friendly,Air conditioning','Home-style curries and noodles in a restored shophouse.','food'],
['Old Town Seafood House','pk','Seafood',500,1100,4.5,290,'Thai,Seafood,Family-friendly','Fresh catch grilled to order in the old town.','food'],
['Warung Sawah','bl','Indonesian',250,600,4.7,310,'Indonesian,Vegetarian options,Garden seating','Family warung with rice-field views and slow-cooked curries.','food'],
['Bistro des Quais','pr','French',1300,2400,4.6,450,'French,Wine,Air conditioning','Classic bistro fare and a short wine list by the river.','food'],
['Trattoria da Lucia','rm','Italian',900,1700,4.7,520,'Italian,Pasta,Family-friendly','Hand-rolled pasta and Roman classics in a lively neighborhood trattoria.','food'],
['Tapas del Born','bc','Spanish',800,1500,4.5,400,'Spanish,Tapas,Wine','Small plates and vermouth in the Born district.','food'],
['The Gilded Pie & Ale','ld','British',900,1600,4.4,360,'British,Pub,Family-friendly','Traditional pub with pies, roasts and cask ales.','food'],
['Hudson Street Diner','ny','American',800,1500,4.4,610,'American,Brunch,Family-friendly,Takeout','All-day diner with pancakes, burgers and bottomless coffee.','food'],
['Circular Quay Oyster Bar','sy','Seafood',1300,2400,4.6,280,'Seafood,Wine,Waterfront','Oysters and grilled fish with a view of the harbour.','food'],
['Harbourside Kitchen','ak','Modern New Zealand',1000,1900,4.5,210,'Modern NZ,Seafood,Wine,Waterfront','Seasonal menu built on local lamb, seafood and wine.','food']
];
const INTL_ATTRACTIONS=[
['Senso-ji Temple','tk','Temple',0,4.7,900,'Temple,Culture,Photography,Free entry','Tokyo\u2019s oldest temple, reached through a lantern-lit market street.','temple','1\u20132 hours'],
['Shibuya Crossing','tk','Landmark',0,4.5,800,'Landmark,Photography,Free entry','The famously busy scramble crossing, best seen from the surrounding viewpoints.','city','30 minutes'],
['Fushimi Inari Shrine','ky','Culture',0,4.8,950,'Culture,Hiking,Photography,Free entry','Thousands of red torii gates winding up a forested mountain.','temple','2\u20133 hours'],
['Gyeongbokgung Palace','se','Heritage',150,4.7,520,'Heritage,History,Culture,Photography','The largest of Seoul\u2019s royal palaces, with a changing-of-the-guard ceremony.','temple','2 hours'],
['Gardens by the Bay','sn','Park',500,4.8,1200,'Park,Photography,Family-friendly,Nature','Futuristic gardens with giant tree structures and two climate-controlled domes.','city','2\u20133 hours'],
['Grand Palace','bk','Heritage',850,4.5,700,'Heritage,History,Culture,Photography','Ornate royal complex with temples and gilded halls.','temple','2\u20133 hours'],
['Phang Nga Bay Boat Tour','pk','Island tour',1800,4.7,330,'Island hopping,Swimming,Nature,Photography','Boat tour among limestone cliffs and hidden lagoons.','falls','Full day'],
['Tegallalang Rice Terraces','bl','Nature',30,4.6,480,'Nature,Photography,Scenic view','Layered rice terraces with swings and walking paths.','pine','1\u20132 hours'],
['Uluwatu Temple','bl','Temple',70,4.6,410,'Temple,Culture,Sunset,Photography','Clifftop sea temple with sunset dance performances.','temple','2 hours'],
['Eiffel Tower','pr','Landmark',1300,4.7,2100,'Landmark,Photography,Scenic view,Family-friendly','The iron icon of Paris, with lifts and stairs to three levels.','city','2 hours'],
['Louvre Museum','pr','Museum',1100,4.7,1800,'Museum,Art,Culture,History','One of the world\u2019s largest art museums, home to the Mona Lisa.','city','Half day'],
['Colosseum','rm','Heritage',1000,4.8,1900,'Heritage,History,Photography,Culture','The ancient amphitheatre at the heart of Rome.','temple','2 hours'],
['Sagrada Fam\u00edlia','bc','Church',1300,4.8,1700,'Church,Architecture,Culture,Photography','Gaud\u00ed\u2019s unfinished basilica, famous for its light-filled interior.','temple','2 hours'],
['British Museum','ld','Museum',0,4.7,1500,'Museum,History,Culture,Free entry','World collections spanning two million years of history.','city','Half day'],
['Tower of London','ld','Heritage',1700,4.6,1100,'Heritage,History,Photography,Family-friendly','A medieval fortress that houses the Crown Jewels.','temple','2\u20133 hours'],
['Central Park','ny','Park',0,4.8,2200,'Park,Nature,Family-friendly,Free entry','A vast green park with lakes, trails and open lawns in Manhattan.','pine','2\u20133 hours'],
['Statue of Liberty','ny','Landmark',1100,4.6,1400,'Landmark,History,Photography,Ferry','The island monument reached by a short ferry ride.','city','Half day'],
['Sydney Opera House','sy','Landmark',1000,4.7,1300,'Landmark,Architecture,Photography,Culture','Guided tours and performances in the sail-roofed harbour landmark.','city','1\u20132 hours'],
['Bondi to Coogee Coastal Walk','sy','Adventure',0,4.8,780,'Hiking,Beach,Photography,Free entry','A cliff-top path linking beaches, rock pools and bays.','beach','2\u20133 hours'],
['Sky Tower','ak','Viewpoint',1500,4.5,420,'Viewpoint,Photography,Scenic view','An observation deck with panoramas of the city and harbour.','city','1 hour']
];

const hash=s=>{let h=7;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h};
const jit=(s,k)=>((hash(s+k)%1000)/1000-.5)*0.04;
let seq=0;
const mk=(kind,name,pl,ph,r,n,tags,blurb,x)=>({id:'L'+String(++seq).padStart(3,'0'),kind,name,pl,loc:P[pl].n,c:P[pl].c,area:P[pl].s,
  lat:P[pl].lat+jit(name,'a'),lng:P[pl].lng+jit(name,'b'),ph,r,n,tags:tags.split(','),blurb,...x});

const ITEMS=[
  ...HOTELS.map(h=>mk('Hotel',h[0],h[1],h[8],h[4],h[5],h[6],h[7],{st:h[2],p:h[3],free:h[9]})),
  ...RESTAURANTS.map(h=>mk('Restaurant',h[0],h[1],h[9],h[5],h[6],h[7],h[8],{cuisine:h[2],p:h[3],hi:h[4]})),
  ...ATTRACTIONS.map(h=>mk('Attraction',h[0],h[1],h[8],h[4],h[5],h[6],h[7],{type:h[2],p:h[3],dur:h[9]})),
  ...INTL_HOTELS.map(h=>mk('Hotel',h[0],h[1],h[8],h[4],h[5],h[6],h[7],{st:h[2],p:h[3],free:h[9],intl:1})),
  ...INTL_RESTAURANTS.map(h=>mk('Restaurant',h[0],h[1],h[9],h[5],h[6],h[7],h[8],{cuisine:h[2],p:h[3],hi:h[4],intl:1})),
  ...INTL_ATTRACTIONS.map(h=>mk('Attraction',h[0],h[1],h[8],h[4],h[5],h[6],h[7],{type:h[2],p:h[3],dur:h[9],intl:1}))
];
return {PLACES:P,ITEMS};
})();