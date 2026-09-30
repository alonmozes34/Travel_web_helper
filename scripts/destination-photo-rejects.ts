/**
 * Photographs looked at on a contact sheet and taken out by hand, by the
 * page the photograph came from: a wrong place that shares the capital's
 * name (Kingston, Ontario for Jamaica), a person or a crowd, or something
 * no traveller would recognise as the destination (a tick, a spider, a
 * shop interior). 30 September 2026.
 *
 * Both photograph scripts skip these, so a search never picks one again.
 */
export const REJECTED_PHOTO_PAGES = new Set<string>([
  "https://www.flickr.com/photos/21446942@N00/2267763656", // BJ Praia de Porto Novo - Portugal
  "https://www.flickr.com/photos/42033648@N00/2387201351", // BM Waikato River, Hamilton, New Zealand, 3 April 2008
  "https://www.flickr.com/photos/80651083@N00/4561546188", // CR San José de Gracia Church, Las Trampas, New Mexico
  "https://www.flickr.com/photos/36224384@N08/48123651221", // FK Stanley Lake Marsh Idaho
  "https://www.flickr.com/photos/22490717@N02/7390197446", // GD Bulgaria-0530 - Church of St George
  "https://www.flickr.com/photos/45611793@N00/2177985405", // GQ Foto de instantes previos al comienzo de la noche en la ciud
  "https://www.flickr.com/photos/39415781@N06/21118822545", // GS British Museum and Centre Point
  "https://www.flickr.com/photos/23165290@N00/14336948382", // GY Georgetown Rec Center basketball courts at Volta Park - Wash
  "https://www.flickr.com/photos/80824546@N00/16458057962", // IL JERUSALEM RESTAURANT 77 CAMDEN STREET REF-101601
  "https://www.flickr.com/photos/7156765@N05/51285457569", // JM Kingston Ontario - Canada - Frontenac Hotel - 186 Ontario St
  "https://www.flickr.com/photos/7156765@N05/51285457569", // NF Kingston Ontario - Canada - Frontenac Hotel - 186 Ontario St
  "https://www.flickr.com/photos/51764518@N02/40654358291", // PN Shopping In The Early Morning Hours Before Dawn At Renninger
  "https://www.flickr.com/photos/12950131@N06/9496934301", // PY Catedral Basilica de Guadalajara 'La Asunción de María',Esta
  "https://www.flickr.com/photos/89918055@N05/52004765992", // MS CHURCH OF ST MARY, HIGH STREET BRADING, ISLE OF WIGHT
  "https://www.flickr.com/photos/94852245@N00/6473672385", // RE basilique saint-denis, nave.
  "https://www.flickr.com/photos/50218657@N05/4633877714", // VC Farmers Market South Kingstown RI
  "https://www.flickr.com/photos/52450054@N04/52430978413", // YE White-banded Crab Spider - Misumenoides formosipes, Merrimac
  "https://www.flickr.com/photos/91008793@N00/14916298297", // DO 39 Church and Convent of Santo Domingo Lima Peru 1738
  "https://www.flickr.com/photos/47445767@N05/16055493589", // SV Calcarenitic eolianite (Hanna Bay Member, Rice Bay Formation
  "https://www.flickr.com/photos/47445767@N05/16709121702", // TC Codakia-rich fossiliferous limestone (Cockburn Town Member, 
  "https://www.flickr.com/photos/47445767@N05/16709121702", // CC Codakia-rich fossiliferous limestone (Cockburn Town Member, 
  "https://www.flickr.com/photos/41000732@N04/5681358732", // PS East Jerusalem Street Scene with Resident on Balcony - Jerus
  "https://www.flickr.com/photos/23442653@N00/463878580", // BI Road between Burundi Gitega and Bujumbura
  "https://www.flickr.com/photos/67163702@N07/38381090982", // BW Gaborone, Botswana, November 13, 2017: The SRSG, Maman Sidik
  "https://www.flickr.com/photos/36281822@N08/12222614936", // CF Central African Republic Airlift mission images from Bangui
  "https://www.flickr.com/photos/67163702@N07/14294770933", // CG Brazzaville deported gathered in Maluku camp near border
  "https://www.flickr.com/photos/61266278@N00/32548982480", // CO Street Musicians Bogotá Near Plaza Bolivar 5
  "https://www.flickr.com/photos/36281822@N08/5663823448", // DJ School renovation, Dikhil, Djibouti, April 2011
  "https://www.flickr.com/photos/29324474@N02/5343345128", // DZ 110107 Port of Algiers longshoremen strike over contract dis
  "https://www.flickr.com/photos/49503002894@N01/5619700053", // ML UN Global Youth Summit on HIV - Bamako, Mali, Africa
  "https://www.flickr.com/photos/186360156@N02/52305144661", // MP Marines at Red Beach 2. Saipan. 15 June, 1944.
  "https://www.flickr.com/photos/87690240@N03/20272200404", // NO Love - Oslo, Norway - Color street photography
  "https://www.flickr.com/photos/26602074@N06/8184140244", // PG HMAS Ballarat, Port Moresby, 1942
  "https://www.flickr.com/photos/115195291@N02/24563598964", // PM [Pont Saint-Pierre, travaux de construction]. 1/7/1930.
  "https://www.flickr.com/photos/14214150@N02/22747301982", // SL 'Now I want to be a doctor' - Celina Kamanda, Ebola survivor
  "https://www.flickr.com/photos/61765479@N08/6132785252", // SO 07/09/2011 Mogadishu - Mayor and President open new market a
  "https://www.flickr.com/photos/80854685@N08/7454925266", // SD Khartoum Dervishes
  "https://www.flickr.com/photos/165930373@N06/51941490085", // UA Volodymyr Zelenskyy met with the heads of governments of Pol
  "https://www.flickr.com/photos/70554537@N00/16238344850", // VU Shopping at Au Bon Marché supermarket, Port Vila, December 2
  "https://www.flickr.com/photos/28990363@N05/16301811831", // WS NSW TENNIS APIA INTERNATIONAL
  "https://www.flickr.com/photos/67769030@N07/15224228513", // BT Thimphu, Memorial Chorten, devotees
  "https://www.flickr.com/photos/97185651@N08/21242333355", // KY RUBBISH • Small Business Recycling Center • George Town • MA
  "https://www.flickr.com/photos/46781500@N00/5265607833", // IM THE DOUGLAS MOTORCYCLE.UK.
  "https://www.flickr.com/photos/58897785@N00/9681134164", // TF p012994
  "https://www.flickr.com/photos/87874260@N00/1497210282", // IR The former US embassy in Tehran
  "https://www.flickr.com/photos/9333548@N04/6597161985", // PF Yuan Wang 6 Tracking Ship (in port at Papeete) 远望
  "https://www.flickr.com/photos/11556778@N07/1141571600", // GA Libreville (Gabon)
  "https://www.flickr.com/photos/10345599@N03/1491521034", // LA Vientiane night market
  "https://www.flickr.com/photos/28990363@N05/17079090249", // NU ALOFI MATAELE
  "https://www.flickr.com/photos/48148847@N04/8564362706", // IO Diego Garcia
  "https://www.flickr.com/photos/48383507@N06/26985533000", // BD #green #plants #light #shade #shadow #dark #black #street #s
  "https://www.flickr.com/photos/131104726@N02/25596003234", // GF Dorsal view of Cayenne Tick
  "https://www.flickr.com/photos/61532128@N00/4859216547", // ST Fresh Cacao from São Tomé & Príncipe
  "https://www.flickr.com/photos/64607715@N05/10699349524", // ZW Roasted Coffee, Harar
  "https://www.flickr.com/photos/37583176@N00/14480948272", // ZM 4Y1A0678 Lusaka, Zambia
  "https://www.flickr.com/photos/53460575@N03/25826268297", // FM Western Rim of Palikir Crater
  "https://www.flickr.com/photos/19646736@N00/897321675", // FO Tórshavn old town, Black window 03 HDR
  "https://www.flickr.com/photos/68868401@N00/192990675", // KW KUWAIT CITY AURA [60 sec exposure]
  "https://www.flickr.com/photos/37472264@N04/50381716376", // KI Tarawa, Kiribati
  "https://www.flickr.com/photos/37472264@N04/51344945723", // MV Malé, the Maldives
  "https://www.flickr.com/photos/64886991@N00/48096651", // NA Meteorite Plaza, Windhoek
  "https://www.flickr.com/photos/35803445@N07/8151724700", // NC Nouméa-Magenta
  "https://www.flickr.com/photos/75062596@N00/23782232989", // MW View to the courtyard of Daeyang Luke Hospital in Lilongwe
  "https://www.flickr.com/photos/8942726@N03/3187382642", // NP Swayambhunath Stupa, Kathmandu, Nepal !!
  "https://www.flickr.com/photos/14214150@N02/36896208290", // VG View of damage caused by Hurricane Irma in Road Town, the ca
  "https://www.flickr.com/photos/81752595@N00/215513830", // VE Caracas... para l@s amig@s venezolan@s que están en el exter
  "https://www.flickr.com/photos/52086447@N00/7568309270", // ZA 152. 1981-01. Class 25NC 3406 leaves Bloemfontein Station wi
  "https://www.flickr.com/photos/23090954@N03/17481554132", // EE Tallinn | foggy port (2)
  "https://www.flickr.com/photos/76233712@N05/8586956272", // GH Accra
  "https://www.flickr.com/photos/131250044@N03/31809787767", // MR Fishermen boat carrying sardines on Nouakchott beach
  "https://www.flickr.com/photos/48213136@N06/29300056521", // TG Lomé City
  "https://www.flickr.com/photos/67769030@N07/6226208607", // UZ Tashkent, Chorsu Bazaar
  "https://www.flickr.com/photos/29913465@N00/147974996", // TN tunis market
  "https://www.flickr.com/photos/89555776@N00/2127404625", // CD Streets of Kinshasa
  "https://www.flickr.com/photos/21625416@N08/9536969688", // SB IMG_2914 Heritage Park Hotel, Honiara
  "https://www.flickr.com/photos/12836528@N00/9273967308", // LV Google Street View - Riga
  "https://www.flickr.com/photos/71284091@N00/3182433356", // LB Abandoned Mansion - Beirut
  "https://www.flickr.com/photos/126744325@N07/51805506229", // DK Mini Market in Copenhagen South / Kiosk i Syd København
  "https://www.flickr.com/photos/64607715@N05/7499750144", // ET Local Store, Addis Ababa
  "https://www.flickr.com/photos/72105154@N00/7826841010", // GM Wellington Street, Bathurst (now Banjul), capital city of Th
  "https://www.flickr.com/photos/32659528@N00/2214390238", // KE Nairobi 1980
  "https://www.flickr.com/photos/47945928@N02/39696707091", // CK Avarua, Rarotonga, in the 1980s
  "https://www.flickr.com/photos/39735679@N00/461554598", // IQ No Known Restrictions: Baghdad Aerial from Matson Collection
  "https://www.flickr.com/photos/22490717@N02/11047491385", // BG Bulgaria-02943 - Inside Saint Sofia Church
  "https://www.flickr.com/photos/22490717@N02/12727449153", // LU Luxembourg-5192 - Grand Ducal Palace Details
  "https://www.flickr.com/photos/77769742@N02/8206065127", // GI Superyacht M/Y Amaryllis berthed at Marina Bay, Gibraltar
  "https://www.flickr.com/photos/33398364@N08/3328366813", // GN conakry street
  "https://www.flickr.com/photos/40279385@N08/4268323481", // CV UM DIA NA PRAIA - ILHA COMPRIDA (A Day In Beach)
  "https://www.flickr.com/photos/89555776@N00/2575923454", // KG Road to Bishkek
  // Second look, 30 September 2026, after the landmarks run.
  "https://commons.wikimedia.org/wiki/File:Salar_de_Uyuni_-_panoramio_(10).jpg", // BO a white panorama, cropped to nothing
  "https://commons.wikimedia.org/wiki/File:Maafushi_island.jpg", // MV a telecom mast
  "https://www.flickr.com/photos/24736216@N07/8726199332", // BB a crowded street
  "https://www.flickr.com/photos/13176024@N02/2398635598", // BF people in the foreground
  "https://www.flickr.com/photos/124651729@N04/52578151165", // BS a shop sign and people
  "https://www.flickr.com/photos/32593403@N00/9238371602", // SC Victoria, British Columbia
  "https://www.flickr.com/photos/35653698@N06/14653418741", // HN one church's temple, at night
  "https://www.flickr.com/photos/17989497@N00/15232994305", // MK people in the street
  "https://www.flickr.com/photos/26781577@N07/11529987756", // MN a Beatles monument
  "https://www.flickr.com/photos/82576530@N00/144000893", // NI haze, nothing to see
  "https://www.flickr.com/photos/53046532@N03/4952321312", // TD a hotel car park
  "https://www.flickr.com/photos/68467272@N00/304273855", // TV a postcard with a black border
  "https://www.flickr.com/photos/62405357@N03/8502417471", // XK an unfinished church, not a picture of the city
  "https://commons.wikimedia.org/wiki/File:Pictures_from_an_armed_convoy_trip_in_Mogadishu.jpg", // SO an armed convoy
  // Wikidata lists Jerusalem among the capitals of Palestine; its landmark
  // (the Church of the Nativity, above in LANDMARKS) is used instead.
  "https://commons.wikimedia.org/wiki/File:Jerusalem-2013-Aerial-Temple_Mount_03.jpg", // PS
  // Third look, after the capitals run.
  "https://commons.wikimedia.org/wiki/File:Djibouti_City.jpg", // DJ a collage
  "https://commons.wikimedia.org/wiki/File:Gaborone_skyline.JPG", // BW almost all sky
  "https://commons.wikimedia.org/wiki/File:Tifariti_(Western_Sahara)_banner_Navarra_hospital.jpg", // EH a close-up of a wall
  "https://commons.wikimedia.org/wiki/File:Suva,_Fiji_52.jpg", // FJ people in the street
  "https://commons.wikimedia.org/wiki/File:Un_aper%C3%A7u_de_la_ville_de_conakry.jpg", // GN washed out
  "https://commons.wikimedia.org/wiki/File:Autobahnbau_in_Oyala.JPG", // GQ a building site
  "https://commons.wikimedia.org/wiki/File:King_Edward_Point_on_South_Georgia_(5663012751).jpg", // GS almost all sky
  "https://commons.wikimedia.org/wiki/File:WV_banner_Baghdad_Belts_Mosque_in_Fallujah.jpg", // IQ a wall and a sign
  "https://commons.wikimedia.org/wiki/File:Northern_Mariana_Islands_banner.jpg", // MP dark and blurred
  "https://commons.wikimedia.org/wiki/File:Plymouth_Montserrat_Heli.jpg", // MS the town buried in ash
  "https://commons.wikimedia.org/wiki/File:Arch_of_Triumph,_Chisinau,_Republic_of_Moldova_(51160304626_cropped).jpg", // MD two people in front
  // Fourth look, the last photographs of the day.
  "https://commons.wikimedia.org/wiki/File:Tsodilo_Hills_banner_Rock_paintings.jpg", // BW a close-up of rock
  "https://commons.wikimedia.org/wiki/File:Guinea_banner.jpg", // GN a portrait
  "https://commons.wikimedia.org/wiki/File:Republic_of_Moldova_banner.jpg", // MD blurred
  "https://commons.wikimedia.org/wiki/File:WelcomeCenterBrades.jpg", // MS a conference banner
  "https://commons.wikimedia.org/wiki/File:State_of_Melekeok.png", // PW a map
]);
