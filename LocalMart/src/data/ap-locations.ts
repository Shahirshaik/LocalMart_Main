// Andhra Pradesh — Districts, Mandals, Villages, PINs
// Primary focus: Prakasam district → Pamuru mandal → Pamuru village

export const AP_DISTRICTS = [
  "Anantapur",
  "Bapatla",
  "Chittoor",
  "East Godavari",
  "Eluru",
  "Guntur",
  "Kadapa",
  "Kakinada",
  "Krishna",
  "Kurnool",
  "Nandyal",
  "Nellore",
  "NTR (Vijayawada)",
  "Palnadu",
  "Parvathipuram Manyam",
  "Prakasam",
  "Sri Sathya Sai",
  "Srikakulam",
  "Tirupati",
  "Visakhapatnam",
  "Vizianagaram",
  "West Godavari",
  "YSR Kadapa",
];

// Mandals per district
export const AP_MANDALS: Record<string, string[]> = {
  "Prakasam": [
    "Addanki", "Ardhaveedu", "Ballikurava", "Bestavaripeta",
    "Chimakurthy", "Chirala", "Cumbum", "Darsi", "Donakonda",
    "Dornala", "Giddalur", "Gongadala", "Gudlur", "Inkollu",
    "Kandukur", "Kanigiri", "Komarolu", "Kondapi", "Kothapatnam",
    "Kurichedu", "Lingasamudram", "Maddipadu", "Markapur",
    "Martur", "Mundlamur", "Narasaraopet", "Ongole", "Pamuru",
    "Parchur", "Pedacherlopalle", "Podili", "Pullalacheruvu",
    "Racherla", "Santhamagaluru", "Santanutalapadu", "Singarayakonda",
    "Tanguturu", "Tarlupadu", "Tripuranthakam", "Ulavapadu",
    "Veligandla", "Vetapalem", "Yerragondapalem", "Zarugumilli",
  ],

  "Guntur": [
    "Amaravati", "Bapatla", "Chebrolu", "Chilakaluripet",
    "Edlapadu", "Guntur", "Gurazala", "Ipuru",
    "Kakumanu", "Kollipara", "Krosuru", "Lank",
    "Macherla", "Mangalagiri", "Narasaraopet", "Narsala",
    "Palnadu", "Pedakurapadu", "Phirangipuram", "Piduguralla",
    "Rentachintala", "Repalle", "Sattenapallli", "Tadikonda",
    "Tenali", "Thullur", "Vinukonda", "Vemuru",
  ],

  "Krishna": [
    "Avanigadda", "Bantumilli", "Bapulapadu", "Chandarlapadu",
    "G. Kondur", "Gannavaram", "Ghantasala", "Gudivada",
    "Kaikalur", "Kalidindi", "Kankipadu", "Koduru",
    "Krishnalanka", "Machilipatnam", "Mopidevi", "Movva",
    "Nagayalanka", "Nandigama", "Nuzvid", "Pamarru",
    "Pedana", "Penamaluru", "Thotlavalluru", "Tiruvuru",
    "Unguturu", "Vijayawada", "Vuyyuru",
  ],

  "Kurnool": [
    "Adoni", "Allagadda", "Alur", "Atmakur",
    "Banaganapalle", "Bethamcherla", "C. Belagal", "Chagalamarri",
    "Devanakonda", "Dhone", "Dornipadu", "Gadivemula",
    "Gospadu", "Kodumur", "Kolimigundla", "Kosigi",
    "Kurnool", "Maddikera", "Mantralayam", "Midthur",
    "Nandavaram", "Nandyal", "Orvakal", "Owk",
    "Panyam", "Pamulapadu", "Peapully", "Rudravaram",
    "Sanjamala", "Uyyalawada", "Velgode", "Yemmiganur",
  ],

  "Nellore": [
    "Allur", "Atmakur", "Bogolu", "Buchireddipalem",
    "Chillakur", "Dagadarthi", "Dakkili", "Gudur",
    "Indukurpet", "Jaladanki", "Kaligiri", "Kavali",
    "Kodavalur", "Kovur", "Krishnapatnam", "Kota",
    "Manubolu", "Marripadu", "Muthukur", "Naidupeta",
    "Nellore", "Pellakur", "Podalakur", "Rapur",
    "Sangam", "Sarvepalli", "Sullurpeta", "T. Sundupalle",
    "Tada", "Udayagiri", "Vakadu", "Venkatachalam",
    "Vidavalur", "Vinjamur",
  ],

  "Kadapa": [
    "B. Kodur", "Badvel", "Chakrayapeta", "Chapadu",
    "Chinnamandem", "Cuddapah", "Duvvur", "Galiveedu",
    "Jammalmadugu", "Kamalapuram", "Khajipet", "Kodur",
    "Kondapuram", "Lakkireddipalle", "Lingala", "Muddanur",
    "Mydukur", "Nandalur", "Obulavaripalle", "Pendlimarri",
    "Proddutur", "Pullampeta", "Pulivendula", "Rajampet",
    "Ramapuram", "Sambepalle", "Simhadripuram", "Sidhout",
    "T. Sundupalle", "Vallur", "Vempalle", "Yerraguntla",
  ],

  "Chittoor": [
    "Bangarupalyam", "Bhamini", "Chandragiri", "Chittoor",
    "Gangadhara Nellore", "Gudipala", "Irala", "K.V.B. Puram",
    "Kalakada", "Kambhamvaripalle", "Kuppam", "Madanapalle",
    "Nagalapuram", "Narayanavanam", "Nindra", "Pakala",
    "Palamaneru", "Palamaner", "Penumur", "Piler",
    "Putalapattu", "Punganur", "Ramakuppam", "Renigunta",
    "Satyavedu", "Srikalahasti", "Tirupati", "Vayalpadu",
    "Vedurukuppam",
  ],

  "Anantapur": [
    "Agali", "Amadagur", "Anantapur", "Atmakur",
    "Bathalapalle", "Beluguppa", "Bommanahal", "Brahmasamudram",
    "Bukkapatnam", "Chttur", "D. Hirehal", "Dharmavaram",
    "Guntakal", "Gooty", "Hindupur", "Kadiri",
    "Kanekal", "Kalyandurg", "Kothacheruvu", "Kudair",
    "Kundurpi", "Madakasira", "Mudigubba", "Nallamada",
    "Narpala", "Pamidi", "Penukonda", "Puttaparthi",
    "Rayadurgam", "Roddam", "Rolla", "Settur",
    "Singanamala", "Tadimarri", "Talupula", "Tanakal",
    "Uravakonda", "Vajrakarur", "Vidapanakal", "Yadiki",
  ],

  "Visakhapatnam": [
    "Anandapuram", "Araku Valley", "Bheemunipatnam", "Bhimili",
    "Butchayyapeta", "Chodavaram", "Devarapalle", "Dumbriguda",
    "Elamanchili", "G. Madugula", "Gajuwaka", "Golugonda",
    "Hukumpeta", "Kasimkota", "Koyyuru", "Munchingiputtu",
    "Munagapaka", "Nakkapalle", "Narsipatnam", "Nathavaram",
    "Paderu", "Paravada", "Pendurthi", "Rambilli",
    "Rolugunta", "S. Kota", "Sabbavaram", "Srungavarapukota",
    "Visakhapatnam", "Yelamanchili",
  ],

  "East Godavari": [
    "Addateegala", "Ainavilli", "Allavaram", "Amalapuram",
    "Anaparthy", "Biccavole", "Devipatnam", "Gandepalle",
    "Gangavaram", "Gollaprolu", "I.Polavaram", "Kadiyam",
    "Kajuluru", "Kakinada", "Karapa", "Kothapalle",
    "Kothapeta", "Malkipuram", "Mamidikuduru", "Mandapeta",
    "Peddapuram", "Pinapaka", "P. Gannavaram", "Prathipadu",
    "Rajanagaram", "Rajamundry", "Rajole", "Rampachodavaram",
    "Ravulapalem", "Razam", "Razole", "Samarlakota",
    "Thondangi", "Tuni", "U. Kothapalli", "Undi",
    "Velairpad", "Yeleswaram",
  ],

  "West Godavari": [
    "Akiveedu", "Attili", "Bhimadole", "Bhimavaram",
    "Buttayagudem", "Chintalapudi", "Denduluru", "Dwaraka Tirumala",
    "Eluru", "Ganapavaram", "Gopalapuram", "Jagannadhapuram",
    "Jangareddigudem", "Kaikaluru", "Kamavarapu Kota", "Koyyalagudem",
    "Lingapalem", "Nallajerla", "Narsapur", "Nidadavolu",
    "P. Gannavaram", "Palacole", "Penumantra", "Poduru",
    "Powerapeta", "Raghunadhapalem", "Raghunathapalle", "Tanuku",
    "Tadepalligudem", "Unguturu", "Undi", "Yelamanchili",
  ],

  "Srikakulam": [
    "Amadalavalasa", "Bhamini", "Burja", "Etcherla",
    "G. Sigadam", "Gara", "Hiramandalam", "Jalumuru",
    "Kanchili", "Kaviti", "Kothuru", "Laveru",
    "Mandasa", "Meliaputti", "Narasannapeta", "Palakonda",
    "Pathapatnam", "Polaki", "R. Amadalasavala", "Rajam",
    "Saravakota", "Sompeta", "Srikakulam", "Tekkali",
    "Vangara", "Vajrapukotturu",
  ],

  "Vizianagaram": [
    "Badangi", "Bheemunipatnam", "Bobbili", "Cheepurupalli",
    "Dattirajeru", "Gajapathinagaram", "Gantyada", "Garugubilli",
    "Jami", "Komarada", "Kothavalasa", "Lakkavarapukota",
    "Mentada", "Merakamudidam", "Munchingputtu", "Nellimarla",
    "Pachipenta", "Palakonda", "Partivada", "Poosapatirega",
    "Pydibhimavaram", "Salur", "Srungavarapukota", "Vizianagaram",
    "Vepada",
  ],

  "Nandyal": [
    "Allagadda", "Atmakur", "Banaganapalle", "Bethamcherla",
    "Chagalamarri", "Dornipadu", "Gospadu", "Kolimigundla",
    "Kosigi", "Maddikera", "Midthur", "Nandyal",
    "Owk", "Panyam", "Rudravaram", "Uyyalawada",
  ],
};

// Villages per mandal — fully listed for Pamuru and Markapur (primary focus)
export const AP_VILLAGES: Record<string, string[]> = {
  // ─── PAMURU MANDAL (Primary focus — user's home) ───────────────
  "Pamuru": [
    "Pamuru",
    "Gurrampodu",
    "Kothapalli",
    "Koppolu",
    "Cherukupalli",
    "Darbavaram",
    "Vempadu",
    "Kondaveedu",
    "Narasimhapuram",
    "Chittedu",
    "Bejjanki",
    "Ramannapeta",
    "Gajuluru",
    "Chellampadu",
    "Varipalli",
    "Kodavali",
    "Lingasamudram",
    "Vellampalli",
    "Pedaparimi",
    "Chinnaparimi",
    "Thummalapenta",
    "Gangadevipalle",
    "Gopinathapuram",
    "Krishnapuram",
    "Lakshmipuram",
    "Nagarajupalle",
    "Seetharamapuram",
    "Venkataramapuram",
  ],

  // ─── MARKAPUR MANDAL ────────────────────────────────────────────
  "Markapur": [
    "Markapur",
    "Bethapudi",
    "Pothulavaripalem",
    "Koripadu",
    "Gurrampadu",
    "Tammampadu",
    "Velugubanda",
    "Mudumala",
    "Sivaramapuram",
    "Chagantipadu",
    "Gangisettipalem",
    "Jogaraopeta",
    "Kothuru",
    "Lakshmapuram",
    "Narayanapuram",
    "Raghavapuram",
    "Siripuram",
    "Venkataramapuram",
  ],

  // ─── ONGOLE MANDAL ──────────────────────────────────────────────
  "Ongole": [
    "Ongole",
    "Kothapatnam",
    "Ramayapatnam",
    "Chirala Road",
    "Bhagavanpadu",
    "Pothunapadu",
    "Vallur",
    "Venkatapalem",
  ],

  // ─── GIDDALUR MANDAL ────────────────────────────────────────────
  "Giddalur": [
    "Giddalur",
    "Cumbum",
    "Dornala",
    "Ardhaveedu",
    "Peddakothapalle",
    "Yakkamanda",
    "Ravipadu",
    "Bethakunta",
  ],

  // ─── DARSI MANDAL ───────────────────────────────────────────────
  "Darsi": [
    "Darsi",
    "Karavadi",
    "Siripuram",
    "Talluru",
    "Ballikurava",
    "Nallavanipeta",
  ],

  // ─── KANDUKUR MANDAL ────────────────────────────────────────────
  "Kandukur": [
    "Kandukur",
    "Singarayakonda",
    "Karumanchi",
    "Errabalem",
    "Kuragallu",
    "Pedapariya",
  ],

  // ─── CUMBUM MANDAL ──────────────────────────────────────────────
  "Cumbum": [
    "Cumbum",
    "Koilkuntla",
    "Peddakovvur",
    "Chinnakovvur",
    "Maddumala",
    "Uppunoothala",
  ],

  // ─── CHIRALA MANDAL ─────────────────────────────────────────────
  "Chirala": [
    "Chirala",
    "Vetapalem",
    "Bapatla",
    "Parchur",
    "Inkollu",
    "Santhamagaluru",
  ],

  // ─── NARASARAOPET MANDAL ────────────────────────────────────────
  "Narasaraopet": [
    "Narasaraopet",
    "Macherla",
    "Gurazala",
    "Chilakaluripet",
    "Sattenapalle",
    "Vinukonda",
  ],

  // ─── ADDANKI MANDAL ─────────────────────────────────────────────
  "Addanki": [
    "Addanki",
    "Karamchedu",
    "Kukunoorpadu",
    "Reddigudem",
    "Tsundur",
  ],

  // ─── BESTAVARIPETA MANDAL ───────────────────────────────────────
  "Bestavaripeta": [
    "Bestavaripeta",
    "Tripuranthakam",
    "Mundlamur",
    "Donakonda",
    "Podili",
    "Kurichedu",
  ],

  // ─── KANIGIRI MANDAL ────────────────────────────────────────────
  "Kanigiri": [
    "Kanigiri",
    "Kondapi",
    "Zarugumilli",
    "Racherla",
    "Martur",
    "Veligandla",
    "Komarolu",
  ],
};

// Known PIN codes for Prakasam mandals
export const AP_MANDAL_PINS: Record<string, string> = {
  "Pamuru": "523272",
  "Markapur": "523316",
  "Ongole": "523001",
  "Giddalur": "523357",
  "Darsi": "523247",
  "Kandukur": "523105",
  "Chirala": "523157",
  "Narasaraopet": "522601",
  "Cumbum": "523323",
  "Addanki": "523201",
  "Kanigiri": "523230",
  "Bestavaripeta": "523270",
  "Tripuranthakam": "523333",
  "Podili": "523240",
  "Donakonda": "523346",
  "Singarayakonda": "523101",
  "Vetapalem": "523187",
  "Inkollu": "523167",
  "Parchur": "523169",
  "Santhamagaluru": "523168",
  "Komarolu": "523367",
  "Gongadala": "523331",
  "Mundlamur": "523336",
  "Yerragondapalem": "523371",
  "Kondapi": "523230",
  "Zarugumilli": "523261",
  "Martur": "523325",
  "Racherla": "523372",
  "Veligandla": "523253",
  "Pedacherlopalle": "523260",
};
