// ═══════════════════════════════════════════════════════════════
// AIRPORTS — curated list of major world airports for the flight
// search autocomplete. Local so it resolves instantly with no API
// call. Amadeus expects the 3-letter IATA `code`.
// Fields: code (IATA), city, name, country.
// ═══════════════════════════════════════════════════════════════

export var AIRPORTS = [
  // ── Africa ──
  { code:"NBO", city:"Nairobi", name:"Jomo Kenyatta Intl", country:"Kenya" },
  { code:"MBA", city:"Mombasa", name:"Moi Intl", country:"Kenya" },
  { code:"ADD", city:"Addis Ababa", name:"Bole Intl", country:"Ethiopia" },
  { code:"LOS", city:"Lagos", name:"Murtala Muhammed Intl", country:"Nigeria" },
  { code:"ABV", city:"Abuja", name:"Nnamdi Azikiwe Intl", country:"Nigeria" },
  { code:"ACC", city:"Accra", name:"Kotoka Intl", country:"Ghana" },
  { code:"JNB", city:"Johannesburg", name:"O. R. Tambo Intl", country:"South Africa" },
  { code:"CPT", city:"Cape Town", name:"Cape Town Intl", country:"South Africa" },
  { code:"CAI", city:"Cairo", name:"Cairo Intl", country:"Egypt" },
  { code:"CMN", city:"Casablanca", name:"Mohammed V Intl", country:"Morocco" },
  { code:"RAK", city:"Marrakesh", name:"Menara", country:"Morocco" },
  { code:"DAR", city:"Dar es Salaam", name:"Julius Nyerere Intl", country:"Tanzania" },
  { code:"ZNZ", city:"Zanzibar", name:"Abeid Amani Karume Intl", country:"Tanzania" },
  { code:"EBB", city:"Entebbe", name:"Entebbe Intl", country:"Uganda" },
  { code:"KGL", city:"Kigali", name:"Kigali Intl", country:"Rwanda" },
  { code:"DKR", city:"Dakar", name:"Blaise Diagne Intl", country:"Senegal" },
  { code:"TUN", city:"Tunis", name:"Tunis–Carthage", country:"Tunisia" },
  { code:"MRU", city:"Port Louis", name:"Sir Seewoosagur Ramgoolam", country:"Mauritius" },

  // ── Europe ──
  { code:"LHR", city:"London", name:"Heathrow", country:"United Kingdom" },
  { code:"LGW", city:"London", name:"Gatwick", country:"United Kingdom" },
  { code:"CDG", city:"Paris", name:"Charles de Gaulle", country:"France" },
  { code:"ORY", city:"Paris", name:"Orly", country:"France" },
  { code:"AMS", city:"Amsterdam", name:"Schiphol", country:"Netherlands" },
  { code:"FRA", city:"Frankfurt", name:"Frankfurt am Main", country:"Germany" },
  { code:"MUC", city:"Munich", name:"Munich", country:"Germany" },
  { code:"BER", city:"Berlin", name:"Brandenburg", country:"Germany" },
  { code:"MAD", city:"Madrid", name:"Barajas", country:"Spain" },
  { code:"BCN", city:"Barcelona", name:"El Prat", country:"Spain" },
  { code:"FCO", city:"Rome", name:"Fiumicino", country:"Italy" },
  { code:"MXP", city:"Milan", name:"Malpensa", country:"Italy" },
  { code:"LIS", city:"Lisbon", name:"Humberto Delgado", country:"Portugal" },
  { code:"ZRH", city:"Zurich", name:"Zurich", country:"Switzerland" },
  { code:"VIE", city:"Vienna", name:"Vienna Intl", country:"Austria" },
  { code:"IST", city:"Istanbul", name:"Istanbul", country:"Turkey" },
  { code:"ATH", city:"Athens", name:"Eleftherios Venizelos", country:"Greece" },
  { code:"DUB", city:"Dublin", name:"Dublin", country:"Ireland" },
  { code:"CPH", city:"Copenhagen", name:"Kastrup", country:"Denmark" },
  { code:"ARN", city:"Stockholm", name:"Arlanda", country:"Sweden" },

  // ── Middle East ──
  { code:"DXB", city:"Dubai", name:"Dubai Intl", country:"UAE" },
  { code:"AUH", city:"Abu Dhabi", name:"Zayed Intl", country:"UAE" },
  { code:"DOH", city:"Doha", name:"Hamad Intl", country:"Qatar" },
  { code:"RUH", city:"Riyadh", name:"King Khalid Intl", country:"Saudi Arabia" },
  { code:"JED", city:"Jeddah", name:"King Abdulaziz Intl", country:"Saudi Arabia" },
  { code:"TLV", city:"Tel Aviv", name:"Ben Gurion", country:"Israel" },

  // ── North America ──
  { code:"JFK", city:"New York", name:"John F. Kennedy Intl", country:"USA" },
  { code:"EWR", city:"New York", name:"Newark Liberty Intl", country:"USA" },
  { code:"LAX", city:"Los Angeles", name:"Los Angeles Intl", country:"USA" },
  { code:"ORD", city:"Chicago", name:"O'Hare Intl", country:"USA" },
  { code:"SFO", city:"San Francisco", name:"San Francisco Intl", country:"USA" },
  { code:"MIA", city:"Miami", name:"Miami Intl", country:"USA" },
  { code:"ATL", city:"Atlanta", name:"Hartsfield–Jackson", country:"USA" },
  { code:"BOS", city:"Boston", name:"Logan Intl", country:"USA" },
  { code:"IAD", city:"Washington", name:"Dulles Intl", country:"USA" },
  { code:"SEA", city:"Seattle", name:"Seattle–Tacoma", country:"USA" },
  { code:"YYZ", city:"Toronto", name:"Pearson Intl", country:"Canada" },
  { code:"YUL", city:"Montreal", name:"Trudeau Intl", country:"Canada" },
  { code:"MEX", city:"Mexico City", name:"Benito Juárez Intl", country:"Mexico" },

  // ── Asia ──
  { code:"DPS", city:"Bali", name:"Ngurah Rai Intl", country:"Indonesia" },
  { code:"CGK", city:"Jakarta", name:"Soekarno–Hatta Intl", country:"Indonesia" },
  { code:"SIN", city:"Singapore", name:"Changi", country:"Singapore" },
  { code:"BKK", city:"Bangkok", name:"Suvarnabhumi", country:"Thailand" },
  { code:"HKT", city:"Phuket", name:"Phuket Intl", country:"Thailand" },
  { code:"KUL", city:"Kuala Lumpur", name:"Kuala Lumpur Intl", country:"Malaysia" },
  { code:"HKG", city:"Hong Kong", name:"Hong Kong Intl", country:"Hong Kong" },
  { code:"NRT", city:"Tokyo", name:"Narita Intl", country:"Japan" },
  { code:"HND", city:"Tokyo", name:"Haneda", country:"Japan" },
  { code:"ICN", city:"Seoul", name:"Incheon Intl", country:"South Korea" },
  { code:"PEK", city:"Beijing", name:"Capital Intl", country:"China" },
  { code:"PVG", city:"Shanghai", name:"Pudong Intl", country:"China" },
  { code:"DEL", city:"Delhi", name:"Indira Gandhi Intl", country:"India" },
  { code:"BOM", city:"Mumbai", name:"Chhatrapati Shivaji", country:"India" },
  { code:"MLE", city:"Malé", name:"Velana Intl", country:"Maldives" },

  // ── Oceania & S. America ──
  { code:"SYD", city:"Sydney", name:"Kingsford Smith", country:"Australia" },
  { code:"MEL", city:"Melbourne", name:"Tullamarine", country:"Australia" },
  { code:"AKL", city:"Auckland", name:"Auckland", country:"New Zealand" },
  { code:"GRU", city:"São Paulo", name:"Guarulhos Intl", country:"Brazil" },
  { code:"GIG", city:"Rio de Janeiro", name:"Galeão Intl", country:"Brazil" },
  { code:"EZE", city:"Buenos Aires", name:"Ezeiza Intl", country:"Argentina" },
];

// Case-insensitive search over city, IATA code, airport name and country.
// Ranks exact code matches and city prefix matches first.
export function searchAirports(query, limit) {
  var q = (query || "").trim().toLowerCase();
  if (!q) return [];
  var scored = [];
  for (var i = 0; i < AIRPORTS.length; i++) {
    var a = AIRPORTS[i];
    var code = a.code.toLowerCase();
    var city = a.city.toLowerCase();
    var name = a.name.toLowerCase();
    var country = a.country.toLowerCase();
    var score = -1;
    if (code === q) score = 0;
    else if (city === q) score = 1;
    else if (city.indexOf(q) === 0) score = 2;
    else if (code.indexOf(q) === 0) score = 3;
    else if (city.indexOf(q) !== -1) score = 4;
    else if (name.indexOf(q) !== -1) score = 5;
    else if (country.indexOf(q) !== -1) score = 6;
    if (score !== -1) scored.push({ a: a, score: score });
  }
  scored.sort(function(x, y){ return x.score - y.score || x.a.city.localeCompare(y.a.city); });
  return scored.slice(0, limit || 6).map(function(s){ return s.a; });
}

export function airportByCode(code) {
  var c = (code || "").trim().toUpperCase();
  for (var i = 0; i < AIRPORTS.length; i++) {
    if (AIRPORTS[i].code === c) return AIRPORTS[i];
  }
  return null;
}
