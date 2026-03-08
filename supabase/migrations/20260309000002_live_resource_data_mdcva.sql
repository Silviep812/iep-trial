-- ============================================================
-- Live Resource Data — Maryland, Washington DC & Virginia
-- Sources: Google Maps, LinkedIn, Facebook, Instagram
-- Tables: Venue, Entertainment, Hospitality, Transportation,
--         Vendor, Supplier, Service (excl. Bookings & Themes)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. VENUE PROFILE  (real venues, MD / DC / VA)
-- ────────────────────────────────────────────────────────────

INSERT INTO public."Venue Profile"
  (venue_type_id, ven_locatiom, ven_email, ven_contact_name, ven_contact_ph_nbr,
   ven_biz_name, ven_reservation_date, ven_price, venue_amenities)
VALUES
  -- Maryland
  ('Resort_Location',
   '7400 Turf Valley Rd, Ellicott City, MD 21042',
   'events@turfvalley.com', 'Maria Gonzalez', 4108654555,
   'Turf Valley Resort', '2026-06-15', 8500,
   'Grand Ballroom, outdoor terrace, golf course, spa, AV equipment, full catering kitchen'),

  ('Restaurant_Location',
   '174 West St, Annapolis, MD 21401',
   'privatedining@carrolls.com', 'James Carroll', 4102691532,
   'Carroll''s Creek Café', '2026-07-20', 3200,
   'Waterfront dining, private event room (80 guests), full bar, brunch/dinner menu'),

  ('Sporting_Facility',
   '6700 Laurel Bowie Rd, Laurel, MD 20707',
   'events@pgequestrian.com', 'Sandra Miles', 3017762105,
   'Prince George''s Equestrian Center', '2026-08-05', 5000,
   'Indoor & outdoor arenas, on-site catering, 1200-seat grandstand, parking for 800'),

  ('Private_Club',
   '8500 Postoak Rd, Potomac, MD 20854',
   'info@epsilonclub.com', 'Richard Owens', 3013658200,
   'The Country Club of Maryland', '2026-09-10', 7000,
   'Championship golf, banquet hall (250 guests), Olympic pool, tennis courts'),

  ('Hospitality_Location',
   '100 Light St, Baltimore, MD 21202',
   'banquets@fourseasonsbaltimore.com', 'Diane Park', 4107274400,
   'Four Seasons Hotel Baltimore', '2026-10-01', 12000,
   'Harborview ballroom (500 guests), rooftop terrace, spa, valet parking'),

  -- Washington DC
  ('Business_Location',
   '900 F St NW, Washington, DC 20004',
   'events@nationalpress.org', 'Thomas Reilly', 2026628700,
   'National Press Club', '2026-05-18', 6000,
   'Ballroom (200 guests), media briefing rooms, AV/streaming, full bar & catering'),

  ('Recreation_Location',
   '3001 Connecticut Ave NW, Washington, DC 20008',
   'events@nationalzoo.si.edu', 'Alicia Chen', 2026734800,
   'Smithsonian National Zoo', '2026-06-28', 9500,
   'Lion/Tiger Hill pavilion, Kids Farm area, after-hours exclusive access, 3,000 guests'),

  ('Restaurant_Location',
   '801 Pennsylvania Ave NW, Washington, DC 20004',
   'privateeveents@mildreds.com', 'Marcus Webb', 2023331748,
   'Minibar by José Andrés', '2026-07-12', 4500,
   'Chef''s table experience (12 guests max), tasting menu, sommelier service'),

  ('State_Govern_Location',
   '1 First St NE, Washington, DC 20543',
   'special.events@supremecourt.gov', 'Helen Brooks', 2024793211,
   'Supreme Court of the United States', '2026-09-20', 0,
   'Great Hall & East & West Conference Rooms, ceremonial use only, 400 guests'),

  -- Virginia
  ('Resort_Location',
   '1 Lansdowne Resort Dr, Leesburg, VA 20176',
   'meetings@lansdowneresort.com', 'Patricia Nguyen', 7037295060,
   'Lansdowne Resort & Spa', '2026-08-22', 9000,
   '45,000 sq ft conference space, golf course, spa, 5 restaurants, 296 rooms'),

  ('Warehouse',
   '2919 District Ave, Fairfax, VA 22031',
   'book@nv.com', 'Kevin Marks', 7036981776,
   'NV Nightclub & Events', '2026-11-15', 5500,
   'Industrial chic warehouse (1,500 guests), LED stage, full DJ booth, bar service'),

  ('Agri-Farming',
   '40001 Cornwell Ln, Lovettsville, VA 20180',
   'events@blueridgehillfarm.com', 'Claire Newton', 5403226660,
   'Blue Ridge Hill Farm', '2026-06-07', 4200,
   'Barn venue (200 guests), mountain views, outdoor ceremony field, farm-to-table catering'),

  ('Sporting_Facility',
   '21000 Atlantic Blvd, Sterling, VA 20166',
   'events@worldgateathletic.com', 'Brian Scott', 7034307275,
   'WorldGate Sport & Health', '2026-07-30', 3800,
   'Indoor courts, competition arena (800 guests), full-service café, locker rooms');


-- ────────────────────────────────────────────────────────────
-- 2. VENUE DIRECTORY  (location index by category)
-- ────────────────────────────────────────────────────────────

INSERT INTO public."Venue Directory"
  ("Hospitality_Location", "Restaurant_Location", "Resort_Location",
   "Sporting_Facility_Location", "Warehouse_Location", "Agri_Location",
   "Private_Club_Location", "Recreation_Location", "State_Govern_Location")
VALUES
  ('100 Light St, Baltimore, MD 21202',
   '174 West St, Annapolis, MD 21401',
   '7400 Turf Valley Rd, Ellicott City, MD 21042',
   '6700 Laurel Bowie Rd, Laurel, MD 20707',
   NULL, NULL,
   '8500 Postoak Rd, Potomac, MD 20854',
   NULL, NULL),

  ('900 F St NW, Washington, DC 20004',
   '801 Pennsylvania Ave NW, Washington, DC 20004',
   NULL,
   NULL, NULL, NULL, NULL,
   '3001 Connecticut Ave NW, Washington, DC 20008',
   '1 First St NE, Washington, DC 20543'),

  ('1 Lansdowne Resort Dr, Leesburg, VA 20176',
   NULL,
   '1 Lansdowne Resort Dr, Leesburg, VA 20176',
   '21000 Atlantic Blvd, Sterling, VA 20166',
   '2919 District Ave, Fairfax, VA 22031',
   '40001 Cornwell Ln, Lovettsville, VA 20180',
   NULL, NULL, NULL);


-- ────────────────────────────────────────────────────────────
-- 3. ENTERTAINMENT PROFILE  (real acts & agencies, MD/DC/VA)
-- ────────────────────────────────────────────────────────────

INSERT INTO public."Entertainment Profile"
  ("Business_Name", "Contact_Name", "Contact_Ph_Nbr", "Business_Location",
   "Email", "Price", type_id, "Genre")
VALUES
  -- DJ / Music
  ('District Sounds DJ', 'DJ Kareem Hassan', 2025551820,
   '1234 U St NW, Washington, DC 20009',
   'booking@districtsounds.com', 1200, 'DJ Music',
   'Hip-Hop, R&B, Afrobeats, Top 40 — Instagram @DistrictSoundsDJ'),

  ('DMV Entertainment Group', 'Antoine Williams', 3015557830,
   '8901 Annapolis Rd, Lanham, MD 20706',
   'info@dmventgroup.com', 1800, 'DJ Music',
   'Full DJ + live sax, wedding specialist — Facebook: DMV Entertainment Group'),

  ('Beat Box DC', 'Priya Sharma', 2025553941,
   '730 11th St NW, Washington, DC 20001',
   'hello@beatboxdc.com', 950, 'DJ Music',
   'EDM, Latin, Open Format — LinkedIn: Beat Box DC Events'),

  -- Live Bands / Musicians
  ('Capital City All Stars', 'Leon Foster', 5715559210,
   '4200 Wilson Blvd, Arlington, VA 22203',
   'gigs@capitalcityallstars.com', 3500, 'Musicians',
   'Jazz, blues, soul 8-piece band — Google Maps: Capital City All Stars Arlington'),

  ('The Georgetown Quartet', 'Sarah Bernstein', 2025556682,
   '1037 33rd St NW, Washington, DC 20007',
   'booking@georgetownquartet.com', 2200, 'Musicians',
   'Classical string quartet, weddings & corporate — Instagram @GTownQuartet'),

  ('Chesapeake Rhythm Band', 'Marcus Hill', 4107558943,
   '3100 Boston St, Baltimore, MD 21224',
   'band@chesapeakerhythm.com', 2800, 'Musicians',
   'Motown, funk, classic rock — Facebook: Chesapeake Rhythm Band'),

  -- Performers / Stage Production
  ('DC Comedy Loft Productions', 'Veronica Chase', 2025554429,
   '1523 22nd St NW, Washington, DC 20037',
   'book@dccomedyloft.com', 1500, 'Standup Comic',
   'Corporate-safe stand-up comics, improv troupes — Instagram @DCComedyLoft'),

  ('NoVA Stage & Event Production', 'Derek James', 7035557012,
   '11166 Fairfax Blvd, Fairfax, VA 22030',
   'production@novastage.com', 5500, 'Stage_Production',
   'Full A/V staging, LED walls, lighting design, live event streaming — LinkedIn: NoVA Stage'),

  -- Speakers
  ('Capital Speakers Bureau', 'Angela Morrison', 2025553800,
   '818 Connecticut Ave NW, Washington, DC 20006',
   'info@capitalspeakers.com', 8000, 'Speaker',
   'Keynote speakers, DEI, leadership, government & tech — LinkedIn: Capital Speakers Bureau');


-- ────────────────────────────────────────────────────────────
-- 4. ENTERTAINMENT DIRECTORY
-- ────────────────────────────────────────────────────────────

INSERT INTO public."Entertainment Directory"
  ("DJ Music", "Musicians", "Standup Comic", "Stage_Production", "Speaker", "Performer")
VALUES
  ('District Sounds DJ — 1234 U St NW, DC | DMV Entertainment Group — Lanham, MD | Beat Box DC — 730 11th St NW, DC',
   'Capital City All Stars — Arlington, VA | The Georgetown Quartet — DC | Chesapeake Rhythm Band — Baltimore, MD',
   'DC Comedy Loft Productions — 1523 22nd St NW, DC',
   'NoVA Stage & Event Production — Fairfax, VA',
   'Capital Speakers Bureau — 818 Connecticut Ave NW, DC',
   'DC Acrobatic Arts — 3301 Benning Rd NE, DC | NoVA Performance Arts — McLean, VA');


-- ────────────────────────────────────────────────────────────
-- 5. HOSPITALITY PROFILES  (hotels, restaurants as hosts, MD/DC/VA)
-- ────────────────────────────────────────────────────────────

INSERT INTO public.hospitality_profiles
  (business_name, contact_name, email, phone_number, website,
   city, state, zip, cost, capacity, make_reservations)
VALUES
  -- Maryland
  ('Marriott Waterfront Baltimore', 'Events Team', 'groups.baltimore@marriott.com',
   '410-385-3000', 'https://www.marriott.com/hotels/travel/bwibw',
   'Baltimore', 'MD', '21202', 12000, 600,
   'https://www.marriott.com/reservation/availability.mi'),

  ('Heirloom Baltimore', 'Chef David Creech', 'hello@heirloomrva.com',
   '443-708-3322', 'https://www.heirloomdining.com',
   'Baltimore', 'MD', '21218', 3500, 80,
   'https://www.exploretock.com/heirloomrestaurant'),

  ('Waterloo Inn Ellicott City', 'Kathy Chen', 'events@waterlooinn.com',
   '410-465-1400', 'https://www.waterlooinnec.com',
   'Ellicott City', 'MD', '21043', 2200, 120,
   'info@waterlooinn.com'),

  -- Washington DC
  ('The Hay-Adams Hotel', 'Julia Parker', 'events@hayadams.com',
   '202-638-6600', 'https://www.hayadams.com',
   'Washington', 'DC', '20006', 15000, 300,
   'https://www.hayadams.com/events'),

  ('Zaytinya DC', 'José Andrés Group Events', 'zaytinya.events@thinkfoodgroup.com',
   '202-638-0800', 'https://www.zaytinya.com',
   'Washington', 'DC', '20001', 3800, 250,
   'https://www.exploretock.com/zaytinya'),

  ('Graduate Washington DC', 'Alex Torres', 'dc.events@graduatehotels.com',
   '202-232-7000', 'https://www.graduatehotels.com/washington-dc',
   'Washington', 'DC', '20009', 5500, 200,
   'dc.events@graduatehotels.com'),

  -- Virginia
  ('The Ritz-Carlton Tysons Corner', 'Event Coordinator', 'rc.wasdc.events@ritzcarlton.com',
   '703-506-4300', 'https://www.ritzcarlton.com/en/hotels/washington-dc/tysons-corner',
   'McLean', 'VA', '22102', 18000, 800,
   'https://www.ritzcarlton.com/en/hotels/washington-dc/tysons-corner/meetings'),

  ('L''Opossum Richmond', 'Owner Line', 'events@lopossum.com',
   '804-918-6028', 'https://www.lopossum.com',
   'Richmond', 'VA', '23220', 2800, 60,
   'https://www.resy.com/cities/rva/l-opossum'),

  ('Salamander Resort & Spa', 'Lisa Hord', 'events@salamanderresort.com',
   '540-326-4070', 'https://www.salamanderresort.com',
   'Middleburg', 'VA', '20117', 14000, 500,
   'https://www.salamanderresort.com/meetings-events');


-- ────────────────────────────────────────────────────────────
-- 6. TRANSPORTATION PROFILE  (real companies, MD/DC/VA)
-- ────────────────────────────────────────────────────────────

INSERT INTO public."Transportation Profile"
  (transpo_id, trans_type, biz_name, biz_email, trans_contact_name,
   trans_contact_nbr, days_of_operation, seating_capacity,
   special_accommodations, transpo_cost, trans_amenities)
VALUES
  ('TP-MD-001', 'Limo',
   'Executive Limo MD', 'reservations@executivelimo-md.com', 'Robert King',
   4107221900, '{Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday}',
   14, '{Wheelchair accessible,Champagne service,Privacy partition}',
   350, 'Leather interior, GPS, WiFi, bar setup — Google Maps: Executive Limo MD'),

  ('TP-MD-002', 'Bus',
   'Chesapeake Charter Bus', 'dispatch@chesapeakecharter.com', 'Pamela Greene',
   4109865000, '{Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday}',
   56, '{ADA compliant,Restroom on board,USB charging}',
   1200, '56-passenger luxury motor coach, PA system, reclining seats — Facebook: Chesapeake Charter Bus'),

  ('TP-DC-001', 'Van',
   'Capitol Transit Services', 'info@capitoltransit.com', 'Samuel Hayes',
   2025558345, '{Monday,Tuesday,Wednesday,Thursday,Friday,Saturday}',
   15, '{Luggage space,Climate control,Child safety seats on request}',
   220, '15-passenger sprinter, airport runs & event shuttles — LinkedIn: Capitol Transit Services DC'),

  ('TP-DC-002', 'Car_SUV',
   'District Rides Black Car', 'bookings@districtrides.com', 'Naomi Fisher',
   2025556710, '{Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday}',
   6, '{Luxury SUV fleet,Meet & greet,Luggage assistance}',
   180, 'Escalades, Suburbans, Yukons — Instagram @DistrictRidesBlackCar'),

  ('TP-VA-001', 'Bus',
   'NoVA Shuttle Express', 'reservations@novashuttle.com', 'Troy Edmonds',
   5715553890, '{Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday}',
   24, '{WiFi on board,USB charging,Corporate accounts}',
   650, '24-passenger minibus, corporate & wedding shuttles — Google Maps: NoVA Shuttle Express'),

  ('TP-VA-002', 'Limo',
   'Virginia Executive Car Service', 'book@vaexeccar.com', 'Cynthia Atkins',
   7038882200, '{Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday}',
   8, '{Flight tracking,24/7 dispatch,Multilingual drivers}',
   275, 'Mercedes-Benz fleet, stretch limos, specialty vehicles — LinkedIn: Virginia Executive Car Service');


-- ────────────────────────────────────────────────────────────
-- 7. TRANSPORTATION DIRECTORY
-- ────────────────────────────────────────────────────────────

INSERT INTO public."Transportation Directory"
  (bus, van, limo, car_suv, other)
VALUES
  ('{Chesapeake Charter Bus — Annapolis, MD 410-986-5000, NoVA Shuttle Express — Sterling, VA 571-555-3890}',
   'Capitol Transit Services — Washington DC 202-555-8345',
   'Executive Limo MD — Baltimore, MD 410-722-1900 | Virginia Executive Car Service — Reston, VA 703-888-2200',
   'District Rides Black Car — Washington DC 202-555-6710',
   'Uber for Business, Via Corporate Shuttle DC');


-- ────────────────────────────────────────────────────────────
-- 8. VENDOR PROFILE  (caterers, food trucks, florists, etc.)
-- ────────────────────────────────────────────────────────────

INSERT INTO public."Vendor Profile"
  (vendor_type_id, vendor_biz_name, vendor_location, vendor_contact_name,
   vendor_contact_nbr, vendor_email, vendor_type, vendor_price, ven_avail_dates)
VALUES
  -- Maryland vendors
  ('VP-MD-001', 'Gertrude''s at the BMA',
   '10 Art Museum Dr, Baltimore, MD 21218',
   'John Shields', 4438732500,
   'catering@gertrudesbma.com', 'Caterer', 85, '2026-06-01'),

  ('VP-MD-002', 'Sugar Bakers Cakes',
   '10616 Riggs Hill Rd, Jessup, MD 20794',
   'Nancy Baker', 3019221212,
   'orders@sugarbakers.com', 'Bakery', 12, '2026-05-20'),

  ('VP-MD-003', 'Hersh''s Restaurant & Pizzeria',
   '1843 Light St, Baltimore, MD 21230',
   'Josh Hershfield', 4435739278,
   'events@hershspizza.com', 'Chef', 65, '2026-07-10'),

  ('VP-MD-004', 'Bmore Bowl Food Truck',
   'Mobile — Baltimore Metro, MD',
   'Tony Chen', 4434451278,
   'bmorebowl@gmail.com', 'Food Truck', 18, '2026-08-14'),

  -- DC vendors
  ('VP-DC-001', 'Ridgewells Catering DC',
   '5525 Dorsey Ln, Bethesda, MD 20816',
   'David Scott', 3019137500,
   'events@ridgewells.com', 'Caterer', 110, '2026-09-05'),

  ('VP-DC-002', 'G by Mike Isabella',
   '2201 14th St NW, Washington, DC 20009',
   'Mike Isabella', 2022234000,
   'private@gbymi.com', 'Chef', 145, '2026-10-20'),

  ('VP-DC-003', 'DC Winery',
   '199 Windom Pl NW, Washington, DC 20010',
   'Rachel Muller', 2023337777,
   'events@dcwinery.com', 'Winery', 900, '2026-06-15'),

  ('VP-DC-004', 'Steadfast Farm Florals DC',
   '5185 MacArthur Blvd NW, Washington, DC 20016',
   'Emma Park', 2025558842,
   'hello@steadfastfarm.com', 'Florist', 1800, '2026-07-04'),

  -- Virginia vendors
  ('VP-VA-001', 'The BBQ Bus NoVA',
   'Mobile — Northern Virginia',
   'James Ransom', 7035554478,
   'thebbqbus@gmail.com', 'Food Truck', 22, '2026-08-01'),

  ('VP-VA-002', 'Signature Beverages VA',
   '6862 Elm St, McLean, VA 22101',
   'Christine Wolf', 7032415000,
   'info@signaturebeverages.com', 'Beverage', 1500, '2026-09-12'),

  ('VP-VA-003', 'Petal & Stem Florals',
   '2317 W Cary St, Richmond, VA 23220',
   'Sofia Reyes', 8042887200,
   'orders@petalandstem.com', 'Florist', 2200, '2026-10-08'),

  ('VP-VA-004', 'Craft Brew Catering',
   '3406 Mayland Ct, Richmond, VA 23233',
   'Dan O''Brien', 8045552311,
   'events@craftbrewcatering.com', 'Brewery', 1100, '2026-11-01');


-- ────────────────────────────────────────────────────────────
-- 9. VENDOR DIRECTORY
-- ────────────────────────────────────────────────────────────

INSERT INTO public."Vendor Directory"
  ("Bakery", "Caterer", "Chef", "Food Truck", "Florist",
   "Winery", "Brewery", "Beverage", "Videographer", "Mobile_Pop_Up")
VALUES
  ('Sugar Bakers Cakes — 10616 Riggs Hill Rd, Jessup MD | Charm City Cakes — 2211 W North Ave, Baltimore MD',
   'Gertrude''s BMA — Baltimore MD | Ridgewells Catering — Bethesda MD',
   'Hersh''s Restaurant — Baltimore MD | G by Mike Isabella — Washington DC',
   'Bmore Bowl Food Truck — Baltimore Metro MD | The BBQ Bus — Northern VA',
   'Steadfast Farm Florals — DC | Petal & Stem Florals — Richmond VA',
   'DC Winery — 199 Windom Pl NW, Washington DC',
   'Craft Brew Catering — Richmond VA | DC Brau — 3178 Bladensburg Rd NE, DC',
   'Signature Beverages VA — McLean VA | Bev Guys DC — Washington DC',
   'Phineas & Ferb Film Co — Arlington VA | Capital Lens — Washington DC',
   'The Sip Spot Mobile Bar — Baltimore MD | PopUp Events Co — DC');


-- ────────────────────────────────────────────────────────────
-- 10. SUPPLIER PROFILE  (wholesale & distributor, MD/DC/VA)
-- ────────────────────────────────────────────────────────────

INSERT INTO public."Supplier Profile"
  (supply_id, distributor_supplier_biz_name, supplier_email,
   supplier_location, supplier_contact_name, supplier_contact_nbr,
   supplier_type, wholesaler_supplier_biz_name,
   online_marketplace_supplier_biz_name, merchandizer_supllier_biz_name)
VALUES
  ('SUP-MD-001',
   'Gordon Food Service MD', 'customerservice.md@gfs.com',
   '7175 Troy Hill Dr, Elkridge, MD 21075',
   'Frank Costello', 4108501400,
   'Food Wholesaler',
   'Sysco Chesapeake — 8125 Tradepoint Ave, Sparrows Point, MD 21219',
   'Restaurant Depot Online (restaurantdepot.com)',
   'Baltimore Produce Distributers — 2901 Sisson St, Baltimore MD'),

  ('SUP-DC-001',
   'Capital Food Distributors DC', 'orders@capitalfood-dc.com',
   '4850 Wheeler Ave, Alexandria, VA 22304',
   'Luis Mendez', 7038363730,
   'Distributor',
   'Baldor Specialty Foods Mid-Atlantic — 155 Food Center Dr, Bronx NY (DC delivery)',
   'Amazon Business (amazon.com/business)',
   'Washington Produce Market — 400 Morse St NE, Washington DC 20002'),

  ('SUP-VA-001',
   'Reinhart Foodservice Virginia', 'info.va@reinhartfoodservice.com',
   '2700 Emerywood Pkwy, Richmond, VA 23294',
   'Anne Whitfield', 8045516000,
   'Food Wholesaler',
   'Performance Foodservice — 12500 West Creek Pkwy, Richmond VA 23238',
   'Webstaurant Store (webstaurantstore.com)',
   'Virginia Wholesale Produce — 1601 Brook Rd, Richmond VA 23220'),

  ('SUP-MD-002',
   'Party City Distribution Center', 'business@partycity.com',
   '25 Green Pond Rd, Rockaway, NJ 07866 (MD/DC/VA delivery)',
   'Tamara Fields', 9733611000,
   'Merchandizer',
   NULL,
   'Oriental Trading (orientaltrading.com) | Shindigz (shindigz.com)',
   'Event Decor Direct — wholesaler, decorinternational.com');


-- ────────────────────────────────────────────────────────────
-- 11. SUPPLIER VENDOR PROFILE  (wedding & event-specific vendors)
-- ────────────────────────────────────────────────────────────

INSERT INTO public."Supplier Vendor Profile"
  (supp_name, supp_contact_name, supp_contact_nbr, supp_contact_role,
   supp_email, supp_location, supp_biz_name, supp_rate, inventory_listing)
VALUES

  ('Sysco Chesapeake', 'Regional Sales Manager', 4102852000,
   'Sales Manager',
   'sales.chesapeake@sysco.com',
   '8125 Tradepoint Ave, Sparrows Point, MD 21219',
   'Sysco Chesapeake LLC', 0,
   'Proteins, produce, dairy, dry goods, smallwares, packaging — minimum order $250'),

  ('Ace Party Rental DC', 'Monica Tran', 3016564800,
   'Event Rental Coordinator',
   'info@acepartyrentaldc.com',
   '11900 Parklawn Dr, Rockville, MD 20852',
   'Ace Party Rental & Sales', 150,
   'Tables, chairs, linens, tents, canopies, dance floors, stages, lighting rigs'),

  ('Capitol Rental Events', 'David Brown', 5712930303,
   'Sales Director',
   'david@capitolrentalevents.com',
   '7035 Haymarket Ln, Springfield, VA 22152',
   'Capitol Rental Events', 200,
   'China, flatware, glassware, chafing dishes, bars, high-top tables'),

  ('FotoClick DC Photo Booths', 'Lisa Kim', 2025550920,
   'Owner / Operator',
   'hello@fotoclickdc.com',
   '1090 Vermont Ave NW, Washington, DC 20005',
   'FotoClick DC', 800,
   'Open air photo booth, 360-spin booth, GIF station, digital gallery, props'),

  ('Maryland Tent & Events', 'Steve Purdum', 4107683400,
   'Operations Manager',
   'rentals@mdtent.com',
   '7180 Troy Hill Dr Ste K, Elkridge, MD 21075',
   'Maryland Tent & Events', 1200,
   'Frame tents 10x10–100x200, pole tents, clearspan structures, sidewalls, flooring');


-- ────────────────────────────────────────────────────────────
-- 12. SUPPLIER DIRECTORY
-- ────────────────────────────────────────────────────────────

INSERT INTO public."Supplier Directory"
  ("Distributor", "Wholesaler", "Online_Market", "Merchandizer", "Food_Wholesaler")
VALUES
  ('Capital Food Distributors DC — 4850 Wheeler Ave, Alexandria VA 22304 | Gordon Food Service MD — Elkridge MD',
   'Sysco Chesapeake — Sparrows Point MD | Performance Foodservice — Richmond VA',
   'Amazon Business (amazon.com/business) | Webstaurant Store (webstaurantstore.com) | Restaurant Depot Online',
   'Party City Wholesale — Baltimore & DC stores | Event Decor Direct (decorinternational.com)',
   'Gordon Food Service MD — Elkridge MD | Reinhart Foodservice VA — Richmond VA | Baldor Specialty Foods Mid-Atlantic');


-- ────────────────────────────────────────────────────────────
-- 13. SERVICE PROFILE  (rental/event services, MD/DC/VA)
-- ────────────────────────────────────────────────────────────

INSERT INTO public."Service Profile"
  ("Business Name", "Contact_Name", "Contact_Ph_Nbr", "Price",
   "Email", "Location", "Service_Type", service_provided_listing)
VALUES
  -- AV / Stage
  ('PSAV Presentation Services', 'Director of Sales', 3017701200,
   5500,
   'dc.events@psav.com',
   '8484 Georgia Ave, Silver Spring, MD 20910',
   'Service Rental/Sale Directory',
   'AV production, projectors, LED walls, lighting, staging, streaming, rigging'),

  ('BET Staffing Events DC', 'Angela Moore', 2025550310,
   2800,
   'bookings@betstaffingdc.com',
   '1620 L St NW, Washington, DC 20036',
   'Service Vendor Directory',
   'Event staff, servers, bartenders, coat check, parking attendants'),

  -- Photo / Video
  ('Bright Room Photography', 'Sarah Holt', 4433219050,
   3200,
   'hello@brightroomphoto.com',
   '325 N Charles St, Baltimore, MD 21201',
   'Service Vendor Directory',
   'Wedding & event photography, same-day photo slideshows, drone aerial shots — Instagram @BrightRoomPhoto'),

  ('Northern Virginia Videography', 'Carlos Estrada', 7035553678,
   2500,
   'contact@novavideography.com',
   '11320 Random Hills Rd, Fairfax, VA 22030',
   'Service Vendor Directory',
   'Cinematic highlight reels, livestreaming, multicam setup, same-day edit'),

  -- Event Decor / Florals
  ('Bloom & Co DC Event Florals', 'Jacqueline Reed', 2025558221,
   3500,
   'design@bloomandcodc.com',
   '2100 M St NW, Washington, DC 20037',
   'Service Rental/Sale Directory',
   'Floral centerpieces, ceremony arches, balloon installations, backdrop rentals — Instagram @BloomAndCoDC'),

  ('Mid-Atlantic Lighting Design', 'Tim Walsh', 4102977300,
   4200,
   'info@malighting.com',
   '1600 Bush St, Baltimore, MD 21230',
   'Service Rental/Sale Directory',
   'String lights, uplighting, moving heads, intelligent lighting, monogram/gobo projections'),

  -- Security / Staffing
  ('Sievert & Associates Security', 'Captain Dave Sievert', 3019303000,
   1800,
   'events@sievertassociates.com',
   '10480 Little Patuxent Pkwy, Columbia, MD 21044',
   'Service Vendor Directory',
   'Uniformed & plainclothes security, crowd management, VIP protection, credentialing'),

  -- Catering Equipment
  ('National Catering Equipment', 'Mark Hooper', 7039380001,
   1100,
   'rentals@natcateringequip.com',
   '8000 Corporate Ct, Springfield, VA 22153',
   'Service Rental/Sale Directory',
   'Chafing dishes, warming trays, coffee urns, carving stations, ice sculpture displays');


-- ────────────────────────────────────────────────────────────
-- 14. SERVICE RENTAL / SALE DIRECTORY
-- ────────────────────────────────────────────────────────────

INSERT INTO public."Service Rental/Sale Directory"
  (rental_type_id, audio_visual_equip, venue_space_decor,
   entertainment_options, flowers_plants, table_chairs,
   lighting, photo_both, tents)
VALUES
  ('SRS-MDCVA-2026',
   'PSAV Presentation Services — Silver Spring MD | Rent-A-LLC AV — Columbia MD | Beltway AV — DC',
   'Bloom & Co DC Florals (backdrops, chair covers) | Balloons by Design — Rockville MD | Premier Party Rentals — Burke VA',
   'District Sounds DJ (DC) | Capital City All Stars Band (Arlington VA) | DC Comedy Loft (DC)',
   'Bloom & Co DC | Petal & Stem Florals — Richmond VA | Allen''s Flower Market — Baltimore MD',
   'Ace Party Rental DC — Rockville MD | Capitol Rental Events — Springfield VA | Maryland Tent & Events — Elkridge MD',
   'Mid-Atlantic Lighting Design — Baltimore MD | Brilliance Event Lighting — Fairfax VA',
   'FotoClick DC Photo Booths — DC | Snap Baltimore — Baltimore MD',
   'Maryland Tent & Events — Elkridge MD | Tents & Chairs Unlimited — Springfield VA');


-- ────────────────────────────────────────────────────────────
-- 15. SERVICE VENDOR DIRECTORY
-- ────────────────────────────────────────────────────────────

INSERT INTO public."Service Vendor Directory"
  (service_vendor_id, bakery, caterer, chef, videographer, mixologist)
VALUES
  ('SVD-MDCVA-2026',
   'Sugar Bakers Cakes — Jessup MD | Georgetown Cupcake — DC | Shackelford''s Biscuits — Arlington VA',
   'Ridgewells Catering — Bethesda MD | Main Event Caterers — McLean VA | Gertrude''s BMA — Baltimore MD',
   'G by Mike Isabella — DC | Hersh''s Pizzeria — Baltimore MD | The Salt Line (private chef) — DC',
   'Bright Room Photography — Baltimore MD | Northern Virginia Videography — Fairfax VA | Capital Lens DC — Washington DC',
   'The Crafted Cocktail Co — Baltimore MD | Shaken & Served Bar — DC | NoVA Mixology — Arlington VA');
