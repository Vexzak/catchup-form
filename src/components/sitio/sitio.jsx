import { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';

/* =========================================================================
   CATCH-UP Data Bank - Sitios Management
   Converted from test.html (static mockup) into a React component.

   NOTE: `sitios` below is still the same mock dataset from the HTML file.
   Swap it for real API/Supabase data later — every field this component
   reads (population, households, waterFunctioning, etc.) should map to a
   column/response from your NEW survey form. If a field name changed in
   the new form, update it in this array's shape and in `indicatorLabels`
   / `indicatorDescriptions` below so the two stay in sync.
========================================================================= */

/* ---------------------------------------------------------------------
   MOCK DATA
--------------------------------------------------------------------- */
const rawSitios = [
  { name: "Phase 1", loc: "Cacub, Koronadal", classification: [],
    population: 977, households: 193, farmers: 15, farmArea: 59, farmerType: "Mixed / Other",
    waterFunctioning: 4, waterNotFunctioning: 1,
    householdsNoToilet: 10, toiletType: "Water-sealed",
    householdsWithElectricity: 183, electricitySource: "Grid",
    roadLength: 4.2, pavedRoadLength: 1.5, mainAccess: "Paved road",
    facilitiesMax: 8, facilityTypes: { "Health Center": true, "Pharmacy": false, "Kindergarten": false, "Elementary School": true, "High School": false, "Madrasah": false, "Market/Talipapa": false, "Community Toilet": false },
    backyardGardenHH: 77, crop: "Vegetables",
    livestock: 120, dogsCats: 30, fisherfolk: 0, aquacultureOperators: 0,
    healthCenter: "Yes", pwd: 12, seniorCitizens: 45, noID: 8, fourPs: 20,
    oscy: 5, studentsPerClassroom: 32, moroPopulation: 0, madrasah: "No",
    hazardFreq: 1, foodSecurity: "Food secure" },

  { name: "Purok Fatima", loc: "New Iloilo, Tantangan", classification: ["GIDA"],
    population: 220, households: 46, farmers: 38, farmArea: 24, farmerType: "Corn farmer",
    waterFunctioning: 1, waterNotFunctioning: 3,
    householdsNoToilet: 18, toiletType: "Open pit",
    householdsWithElectricity: 9, electricitySource: "Solar",
    roadLength: 1.1, pavedRoadLength: 0, mainAccess: "Unpaved road",
    facilitiesMax: 8, facilityTypes: { "Health Center": false, "Pharmacy": false, "Kindergarten": true, "Elementary School": false, "High School": false, "Madrasah": false, "Market/Talipapa": false, "Community Toilet": false },
    backyardGardenHH: 28, crop: "Corn",
    livestock: 80, dogsCats: 25, fisherfolk: 0, aquacultureOperators: 0,
    healthCenter: "No", pwd: 4, seniorCitizens: 18, noID: 22, fourPs: 30,
    oscy: 15, studentsPerClassroom: 48, moroPopulation: 10, madrasah: "No",
    hazardFreq: 3, foodSecurity: "Seasonal scarcity" },

  { name: "Sitio Mabuhay", loc: "Yangco, Banga", classification: ["IP"],
    population: 427, households: 67, farmers: 52, farmArea: 319, farmerType: "Coconut farmer",
    waterFunctioning: 3, waterNotFunctioning: 1,
    householdsNoToilet: 7, toiletType: "Water-sealed",
    householdsWithElectricity: 40, electricitySource: "Grid",
    roadLength: 3.4, pavedRoadLength: 0.7, mainAccess: "Unpaved road",
    facilitiesMax: 8, facilityTypes: { "Health Center": false, "Pharmacy": true, "Kindergarten": true, "Elementary School": true, "High School": true, "Madrasah": false, "Market/Talipapa": true, "Community Toilet": false },
    backyardGardenHH: 23, crop: "Coconut",
    livestock: 210, dogsCats: 40, fisherfolk: 12, aquacultureOperators: 3,
    healthCenter: "No", pwd: 8, seniorCitizens: 30, noID: 15, fourPs: 18,
    oscy: 10, studentsPerClassroom: 35, moroPopulation: 5, madrasah: "No",
    hazardFreq: 2, foodSecurity: "Food secure" },

  { name: "Sitio Sampaguita", loc: "Little Baguio, Surallah", classification: ["GIDA"],
    population: 347, households: 76, farmers: 61, farmArea: 88, farmerType: "Mixed / Other",
    waterFunctioning: 2, waterNotFunctioning: 2,
    householdsNoToilet: 23, toiletType: "Closed pit",
    householdsWithElectricity: 30, electricitySource: "Battery",
    roadLength: 2.0, pavedRoadLength: 0.2, mainAccess: "Footpath / trail",
    facilitiesMax: 8, facilityTypes: { "Health Center": false, "Pharmacy": false, "Kindergarten": false, "Elementary School": true, "High School": false, "Madrasah": false, "Market/Talipapa": false, "Community Toilet": false },
    backyardGardenHH: 38, crop: "Coffee",
    livestock: 150, dogsCats: 33, fisherfolk: 0, aquacultureOperators: 0,
    healthCenter: "No", pwd: 6, seniorCitizens: 22, noID: 18, fourPs: 25,
    oscy: 12, studentsPerClassroom: 42, moroPopulation: 0, madrasah: "No",
    hazardFreq: 4, foodSecurity: "Seasonal scarcity" },

  { name: "Purok Santo Ni\u00f1o", loc: "El Nonok, Banga", classification: ["GIDA"],
    population: 221, households: 58, farmers: 40, farmArea: 45, farmerType: "Rice farmer",
    waterFunctioning: 1, waterNotFunctioning: 3,
    householdsNoToilet: 32, toiletType: "Overhang / Drop type",
    householdsWithElectricity: 9, electricitySource: "None",
    roadLength: 0.6, pavedRoadLength: 0, mainAccess: "Footpath / trail",
    facilitiesMax: 8, facilityTypes: { "Health Center": false, "Pharmacy": false, "Kindergarten": false, "Elementary School": false, "High School": false, "Madrasah": true, "Market/Talipapa": false, "Community Toilet": false },
    backyardGardenHH: 12, crop: "Palay (Rice)",
    livestock: 95, dogsCats: 20, fisherfolk: 0, aquacultureOperators: 0,
    healthCenter: "No", pwd: 5, seniorCitizens: 15, noID: 30, fourPs: 35,
    oscy: 20, studentsPerClassroom: 50, moroPopulation: 40, madrasah: "Yes",
    hazardFreq: 5, foodSecurity: "Chronic shortage" }
];

const FACILITY_TYPES = ["Health Center", "Pharmacy", "Kindergarten", "Elementary School", "High School", "Madrasah", "Market/Talipapa", "Community Toilet"];

const sitios = rawSitios.map(s => {
  const facilities = FACILITY_TYPES.filter(t => s.facilityTypes[t]).length;
  return { ...s, facilities, facilitiesMissing: s.facilitiesMax - facilities };
});

/* ---------------------------------------------------------------------
   INDICATOR LABELS + DESCRIPTIONS
--------------------------------------------------------------------- */
const indicatorLabels = {
  waterFunctioning: "Water sources functioning (count)",
  waterNotFunctioning: "Water sources not functioning (count)",
  householdsNoToilet: "Households without toilet (count)",
  householdsWithElectricity: "Households with electricity (count)",
  roadLength: "Road length (km)",
  pavedRoadLength: "Paved road length (km)",
  facilities: "Facility types present (out of 8 tracked)",
  facilitiesMissing: "Facility types missing (out of 8 tracked)",
  farmers: "Number of farmers",
  farmArea: "Farm area (ha)",
  backyardGardenHH: "Households with backyard garden (count)",
  livestock: "Livestock and poultry count",
  fisherfolk: "Municipal fisherfolk count",
  aquacultureOperators: "Aquaculture operators",
  pwd: "Persons with disability",
  seniorCitizens: "Senior citizens",
  noID: "Individuals without ID",
  fourPs: "4Ps beneficiaries",
  oscy: "Out of school children/youth",
  studentsPerClassroom: "Students per classroom",
  moroPopulation: "Moro population",
  hazardFreq: "Hazard events (past 12 mos)",
  population: "Population",
  households: "Households"
};

const indicatorDescriptions = {
  waterFunctioning: "Number of water sources in the sitio (spring, hand pump, communal faucet, or house connection) that are currently working, from Q44.",
  waterNotFunctioning: "Number of water sources that exist in the sitio but are currently broken, dry, or otherwise not usable, from Q44.",
  householdsNoToilet: "Number of households that have no toilet facility of any kind, from Q45.",
  householdsWithElectricity: "Number of households connected to any power source \u2014 grid, solar, battery, or generator \u2014 from Q52.",
  roadLength: "Total length, in kilometers, of all roads and paths in the sitio, added together regardless of surface type (asphalt, concrete, gravel, or earth), from Q51.",
  pavedRoadLength: "Length, in kilometers, of roads with a paved surface (asphalt or concrete only) \u2014 a subset of total road length, from Q51.",
  facilities: "Number of facility types present in the sitio, out of 8 types the survey tracks: Health Center, Pharmacy, Kindergarten, Elementary School, High School, Madrasah, Market/Talipapa, and Community Toilet. Hover the number in a sitio's row to see which ones.",
  facilitiesMissing: "Number of the 8 tracked facility types (Health Center, Pharmacy, Kindergarten, Elementary School, High School, Madrasah, Market/Talipapa, Community Toilet) that this sitio does not have. Hover the number in a sitio's row to see which ones.",
  farmers: "Number of individuals in the sitio who farm as a livelihood, from Q29.",
  farmArea: "Total land area, in hectares, currently used for farming in the sitio, from Q32.",
  backyardGardenHH: "Number of households that grow food in a small home garden, distinct from farm-scale agriculture, from Q40.",
  livestock: "Combined count of all livestock and poultry raised in the sitio \u2014 e.g. pigs, cows, carabao, goats, chickens \u2014 from Q39.",
  fisherfolk: "Number of individuals engaged in capture fishing (not fish farming) as a livelihood, from Q34.",
  aquacultureOperators: "Number of individuals who own or operate a fishpond, fish cage, or fish pen, from Q35.",
  pwd: "Number of individuals in the sitio identified as Persons with Disability, from Q22.",
  seniorCitizens: "Number of individuals aged 60 and above, from Q22.",
  noID: "Number of individuals without a National ID (PhilSys), from Q15.",
  fourPs: "Number of individuals/households receiving Pantawid Pamilyang Pilipino Program (4Ps) benefits, from Q25.",
  oscy: "Number of children and youth of school age who are not currently attending school, from Q17.",
  studentsPerClassroom: "Average number of students assigned to a single classroom in the sitio, from Q49.",
  moroPopulation: "Estimated number of individuals identifying as part of the Moro population, from Q12.",
  hazardFreq: "Combined number of hazard occurrences recorded in the past 12 months across all hazard types (flood, landslide, drought, earthquake) \u2014 not a single hazard type, from Q56.",
  population: "Total estimated number of residents in the sitio, from Q9.",
  households: "Total number of households in the sitio, from Q11."
};

/* ---------------------------------------------------------------------
   PRESETS
--------------------------------------------------------------------- */
const presets = [
  { group: "Water and sanitation", value: "water_rehab", label: "Water System Rehabilitation", icon: "droplet",
    indicators: ["waterFunctioning", "waterNotFunctioning", "hazardFreq"], filters: ["mainAccess"] },
  { group: "Water and sanitation", value: "cr", label: "Community Comfort Room (CR)", icon: "door",
    indicators: ["householdsNoToilet", "waterFunctioning", "pwd"], filters: ["toiletType"] },
  { group: "Infrastructure", value: "solar_lights", label: "Solar Street Lights", icon: "bulb",
    indicators: ["householdsWithElectricity", "roadLength"], filters: ["mainAccess", "electricitySource"] },
  { group: "Infrastructure", value: "solar_water", label: "Solar Water System", icon: "droplet",
    indicators: ["waterFunctioning", "householdsWithElectricity", "hazardFreq"], filters: ["electricitySource"] },
  { group: "Infrastructure", value: "road", label: "Access Road Improvement", icon: "road",
    indicators: ["roadLength", "pavedRoadLength", "hazardFreq"], filters: ["mainAccess"] },
  { group: "Infrastructure", value: "multipurpose", label: "Multi-purpose Facility", icon: "building",
    indicators: ["facilities", "facilitiesMissing"], filters: [] },
  { group: "Agriculture", value: "farm_tools", label: "Farm Tools Distribution", icon: "wrench",
    indicators: ["farmers", "farmArea"], filters: ["farmerType"] },
  { group: "Agriculture", value: "seeds", label: "Seeds and Seedlings Distribution", icon: "sprout",
    indicators: ["farmArea", "backyardGardenHH"], filters: ["crop"] },
  { group: "Agriculture", value: "agri_assist", label: "Agricultural Assistance", icon: "wheat",
    indicators: ["farmers", "farmArea", "livestock"], filters: ["crop"] },
  { group: "Agriculture", value: "gardening", label: "Community Gardening", icon: "leaf",
    indicators: ["backyardGardenHH", "households"], filters: ["foodSecurity"] },
  { group: "Fisheries and livestock", value: "vet", label: "Veterinary Services", icon: "paw",
    indicators: ["livestock", "dogsCats"], filters: [] },
  { group: "Fisheries and livestock", value: "fisheries", label: "Fisheries Assistance", icon: "fish",
    indicators: ["fisherfolk", "aquacultureOperators"], filters: [] },
  { group: "Health and social services", value: "medical", label: "Medical Outreach", icon: "stethoscope",
    indicators: ["pwd", "seniorCitizens", "noID"], filters: ["healthCenter"] },
  { group: "Health and social services", value: "caravan", label: "Serbisyo Caravan", icon: "users",
    indicators: ["noID", "fourPs", "pwd", "seniorCitizens"], filters: [] },
  { group: "Education", value: "education", label: "Education Support", icon: "cap",
    indicators: ["oscy", "studentsPerClassroom", "fourPs"], filters: [] },
  { group: "Education", value: "madrasah", label: "Madrasah Support", icon: "book",
    indicators: ["moroPopulation", "oscy", "studentsPerClassroom"], filters: ["madrasah"] },
  { group: "Safety and risk", value: "drr", label: "Disaster Risk Reduction", icon: "alert",
    indicators: ["hazardFreq", "roadLength", "pavedRoadLength"], filters: ["mainAccess"] }
];

const ICONS = {
  droplet: '<path d="M12 3c-3.6 4.4-6.5 8-6.5 11.2A6.5 6.5 0 0 0 12 20.7a6.5 6.5 0 0 0 6.5-6.5C18.5 11 15.6 7.4 12 3z"/>',
  door: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><circle cx="15" cy="12" r="0.9" fill="currentColor" stroke="none"/>',
  bulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a6 6 0 0 0-3.6 10.8c.5.5.9.9 1 1.7l.1.5h5l.1-.5c.1-.8.5-1.2 1-1.7A6 6 0 0 0 12 2z"/>',
  road: '<path d="M6 3 3 21"/><path d="M18 3l3 18"/><path d="M12 3v3"/><path d="M12 10.5v3"/><path d="M12 17v3"/>',
  building: '<path d="M4 21V8l8-5 8 5v13"/><path d="M9 21v-6h6v6"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L2.6 18.4l3 3L12.3 14.7a4 4 0 0 0 5.4-5.4l-2.8 2.8-2-2z"/>',
  sprout: '<path d="M12 20v-8"/><path d="M9 12C6 12 4 10 4 7c3 0 5 2 5 5z"/><path d="M15 12c3 0 5-2 5-5-3 0-5 2-5 5z"/>',
  wheat: '<path d="M12 22V4"/><path d="M8 8l4-4 4 4"/><path d="M8 14l4-4 4 4"/><path d="M8 20l4-4 4 4"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-6 7-11 7-11s7 5 7 11a7 7 0 0 1-7 7z"/>',
  paw: '<circle cx="8" cy="8.5" r="1.6"/><circle cx="16" cy="8.5" r="1.6"/><circle cx="5.5" cy="13" r="1.6"/><circle cx="18.5" cy="13" r="1.6"/><path d="M12 13c-3 0-5.2 2.1-5.2 4.6 0 2 1.9 3.4 5.2 3.4s5.2-1.4 5.2-3.4C17.2 15.1 15 13 12 13z"/>',
  fish: '<path d="M3 12c4-4 10-5 14-2 1.6 1.2 2.6 1.8 4 2-1.4.2-2.4.8-4 2-4 3-10 2-14-2z"/><circle cx="7.2" cy="11.2" r="0.8" fill="currentColor" stroke="none"/>',
  stethoscope: '<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M14 10v2a6 6 0 0 1-12 0v-2"/><circle cx="19" cy="16.5" r="2.5"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7"/><circle cx="17" cy="8" r="2.6"/><path d="M16 14.2c2.6.6 4.5 2.9 4.5 5.8"/>',
  cap: '<path d="M2 9 12 4l10 5-10 5-10-5z"/><path d="M6 11.5V17c0 1.5 3 3 6 3s6-1.5 6-3v-5.5"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 19.5V4.5"/>',
  alert: '<path d="M12 2 2 20h20L12 2z"/><line x1="12" y1="9" x2="12" y2="13.5"/><circle cx="12" cy="16.5" r="0.9" fill="currentColor" stroke="none"/>'
};

const IconTag = ({ name }) => (
  <svg
    className="presetIcon" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }}
  />
);

const groupOrder = [...new Set(presets.map(p => p.group))];
const groupedPresets = groupOrder.map(g => presets.filter(p => p.group === g));

const classPills = ["GIDA", "Indigenous", "Conflict-Affected"];
const pillKeyMap = { "GIDA": "GIDA", "Indigenous": "IP", "Conflict-Affected": "CAA" };
const badgeClassMap = { "GIDA": "gida", "IP": "ip", "CAA": "caa" };

function distinctValues(field) {
  return [...new Set(sitios.map(s => s[field]))];
}

function formatVal(key, val) {
  if (key === "farmArea") return val.toFixed(1) + " ha";
  if (key === "roadLength" || key === "pavedRoadLength") return val.toFixed(1) + " km";
  return val;
}

/* ---------------------------------------------------------------------
   Tooltip (replaces the CSS-hover bubble + JS overflow-flip logic)
--------------------------------------------------------------------- */
function Tooltip({ ariaLabel, label, children, variant = 'info', prefix }) {
  const bubbleRef = useRef(null);
  const [flipClass, setFlipClass] = useState('');

  const reposition = () => {
    const bubble = bubbleRef.current;
    if (!bubble) return;
    bubble.style.left = '50%';
    bubble.style.right = 'auto';
    bubble.style.transform = 'translateX(-50%)';
    bubble.style.display = 'block';

    const rect = bubble.getBoundingClientRect();
    const margin = 12;
    let next = '';
    if (rect.right > window.innerWidth - margin) {
      bubble.style.left = 'auto';
      bubble.style.right = '0';
      bubble.style.transform = 'none';
      next = 'flip-right';
    } else if (rect.left < margin) {
      bubble.style.left = '0';
      bubble.style.right = 'auto';
      bubble.style.transform = 'none';
      next = 'flip-left';
    }
    bubble.style.display = '';
    setFlipClass(next);
  };

  return (
    <span className="tooltipWrap" onMouseEnter={reposition}>
      {prefix}
      <button
        type="button"
        className={`tooltipIcon${variant === 'info' ? ' indicatorInfoIcon' : ''}`}
        tabIndex={0}
        aria-label={ariaLabel}
        onFocus={reposition}
        onClick={(e) => e.stopPropagation()}
      >
        ?
      </button>
      <span ref={bubbleRef} className={`tooltipBubble ${flipClass}`}>
        <span className="tooltipBubbleLabel">{label}</span>
        {children}
      </span>
    </span>
  );
}

function FacilityCell({ s, fieldKey }) {
  const present = FACILITY_TYPES.filter(t => s.facilityTypes[t]);
  const missing = FACILITY_TYPES.filter(t => !s.facilityTypes[t]);
  const list = fieldKey === 'facilities' ? present : missing;
  const bubbleLabel = fieldKey === 'facilities' ? `Present at ${s.name}` : `Missing at ${s.name}`;
  return (
    <Tooltip ariaLabel={bubbleLabel} label={bubbleLabel} variant="info" prefix={<span>{s[fieldKey]}</span>}>
      {list.length ? list.map(t => <div key={t}>{t}</div>) : <div style={{ opacity: .7 }}>None</div>}
    </Tooltip>
  );
}

/* =========================================================================
   MAIN COMPONENT
========================================================================= */
export default function Sitio() {
  const [activePills, setActivePills] = useState([]);
  const [currentPreset, setCurrentPreset] = useState(null);
  const [activeIndicators, setActiveIndicators] = useState([]);
  const [visibleIndicators, setVisibleIndicators] = useState([]);
  const [tableSort, setTableSort] = useState(null);
  const [filterValues, setFilterValues] = useState({});
  const [sortPanelOpen, setSortPanelOpen] = useState(false);

  const sortPanelRef = useRef(null);
  const sortPanelBodyRef = useRef(null);

  const toggleSortPanel = () => {
    const opening = !sortPanelOpen;
    if (!opening) {
      if (sortPanelBodyRef.current) sortPanelBodyRef.current.style.overflow = 'hidden';
      if (sortPanelRef.current) sortPanelRef.current.style.overflow = 'hidden';
    }
    setSortPanelOpen(opening);
  };

  const handleSortPanelTransitionEnd = () => {
    if (sortPanelOpen) {
      if (sortPanelBodyRef.current) sortPanelBodyRef.current.style.overflow = 'visible';
      if (sortPanelRef.current) sortPanelRef.current.style.overflow = 'visible';
    }
  };

  const togglePill = (key) => {
    setActivePills(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]);
  };

  const selectPreset = (preset) => {
    setCurrentPreset(preset);
    const FIXED_COLUMNS = ['population', 'households'];
    const togglable = preset ? preset.indicators.filter(k => !FIXED_COLUMNS.includes(k)) : [];
    setActiveIndicators(togglable);
    setVisibleIndicators(togglable);
    setFilterValues({});
    setTableSort(null);
  };

  const handleFilterChange = (field, value) => {
    setFilterValues(prev => ({ ...prev, [field]: value }));
  };

  const handleFilterClear = (field) => {
    setFilterValues(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const toggleIndicatorVisible = (key, checked) => {
    setVisibleIndicators(prev => {
      if (checked) return prev.includes(key) ? prev : [...prev, key];
      return prev.filter(k => k !== key);
    });
    if (!checked && tableSort && tableSort.key === key) setTableSort(null);
  };

  const handleSortClick = (key) => {
    setTableSort(prev => {
      if (prev && prev.key === key) {
        return prev.dir === 'asc' ? { key, dir: 'desc' } : null;
      }
      return { key, dir: 'desc' };
    });
  };

  const filteredSortedList = useMemo(() => {
    let list = sitios.filter(s => {
      if (activePills.length && !activePills.some(p => s.classification.includes(p))) return false;
      for (const f in filterValues) {
        if (filterValues[f] && s[f] !== filterValues[f]) return false;
      }
      return true;
    });
    if (tableSort) {
      list = [...list].sort((a, b) => {
        const diff = a[tableSort.key] - b[tableSort.key];
        return tableSort.dir === 'asc' ? diff : -diff;
      });
    }
    return list;
  }, [activePills, filterValues, tableSort]);

  const extraCols = visibleIndicators.filter(k => k !== 'population' && k !== 'households');

  const stats = useMemo(() => ({
    totalSitios: sitios.length,
    municipalities: new Set(sitios.map(s => s.loc.split(',').pop().trim())).size,
    totalPop: sitios.reduce((a, s) => a + s.population, 0),
    totalHh: sitios.reduce((a, s) => a + s.households, 0)
  }), []);

  const sortIndicator = (key) => {
    if (!tableSort || tableSort.key !== key) return null;
    return tableSort.dir === 'asc' ? ' \u2191' : ' \u2193';
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {/* ===================== SIDEBAR ===================== */}
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-icon">
              <img src="/logo.png" alt="CATCH-UP Data Bank logo" className="brand-icon-img" />
            </div>
            <div>
              <div className="brand-name">CATCH-UP Data Bank</div>
              <div className="brand-sub">Admin Portal</div>
            </div>
          </div>
 
            <div className="navSection">
              <div className="navLabel">Main</div>
                <Link to="/dashboard" className="navItem">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
                Dashboard
              </Link>
            </div>

          <div className="navSection">
            <div className="navLabel">Data Management</div>
            <div className="navItem active">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s7-6.6 7-12A7 7 0 0 0 5 10c0 5.4 7 12 7 12z" /><circle cx="12" cy="10" r="2.4" /></svg>
              Sitios
            </div>
            <div className="navItem">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" /></svg>
              Projects
            </div>
            <div className="navItem">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7z" /></svg>
              My Submissions<span className="navBadge">2</span>
            </div>
            <div className="navItem">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 3v3h6V3M9 12l2 2 4-4" /></svg>
              Review Queue<span className="navBadge">7</span>
            </div>
          </div>

          <div className="navSection">
            <div className="navLabel">Utilities</div>
            <div className="navItem">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M4 4l6.5 6.5" /></svg>
              Compare Data
            </div>
            <div className="navItem">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" /><path d="M14 2v5h5M8 13h8M8 17h5" /></svg>
              Reports
            </div>
          </div>

          <div className="navSection">
            <div className="navLabel">System</div>
            <div className="navItem">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" /><path d="M14 2v5h5" /></svg>
              Audit Logs
            </div>
            <Link to="/" className="navItem">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6M10 14 21 3" /></svg>
              View Public Portal
            </Link>
            <Link to="/form" className="navItem formNavItem">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" /><path d="M14 2v5h5M8 13h8M8 17h5" /></svg>
              Form
            </Link>
          </div>

          <div className="sidebarFooter">
            <div className="avatar">J</div>
            <div style={{ minWidth: 0 }}>
              <div className="userName">Juan Dela Cruz</div>
              <div className="userEmail">juan.delacruz@southcotabato.g&hellip;</div>
            </div>
          </div>
        </aside>

        {/* ===================== MAIN ===================== */}
        <main className="main">

          <div className="pageHead">
            <div className="sidebarToggle">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /></svg>
            </div>
            <div>
              <h1 className="pageTitle">Sitios Management</h1>
              <p className="pageSub">Manage sitio records and yearly data</p>
            </div>
          </div>

          {/* ===== Stat cards ===== */}
          <div className="statRow">
            <div className="statCard">
              <div className="statIcon" style={{ background: 'var(--blue-bg)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2"><path d="M12 22s7-6.6 7-12A7 7 0 0 0 5 10c0 5.4 7 12 7 12z" /><circle cx="12" cy="10" r="2.4" /></svg>
              </div>
              <div><div className="statLabel">Total Sitios</div><div className="statValue">{stats.totalSitios}</div></div>
            </div>
            <div className="statCard">
              <div className="statIcon" style={{ background: 'var(--blue-bg)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2"><path d="M4 21V8l8-5 8 5v13" /><path d="M9 21v-6h6v6" /></svg>
              </div>
              <div><div className="statLabel">Municipalities</div><div className="statValue">{stats.municipalities}</div></div>
            </div>
            <div className="statCard">
              <div className="statIcon" style={{ background: 'var(--purple-bg)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--purple-text)" strokeWidth="2"><circle cx="9" cy="8" r="3" /><path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7" /><circle cx="17" cy="8" r="2.6" /><path d="M16 14.2c2.6.6 4.5 2.9 4.5 5.8" /></svg>
              </div>
              <div><div className="statLabel">Total Population</div><div className="statValue">{stats.totalPop.toLocaleString()}</div></div>
            </div>
            <div className="statCard">
              <div className="statIcon" style={{ background: 'var(--green-bg)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M3 11 12 3l9 8" /><path d="M5 10v10h14V10" /></svg>
              </div>
              <div><div className="statLabel">Total Households</div><div className="statValue">{stats.totalHh.toLocaleString()}</div></div>
            </div>
          </div>

          {/* ===== Search + filter row ===== */}
          <div className="toolRow">
            <div className="searchBox">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input type="text" placeholder="Search sitios..." />
            </div>
            <select className="toolSelect"><option>All Municipalities</option></select>
            <select className="toolSelect"><option>All Barangays</option></select>
            <div style={{ display: 'flex', gap: 8 }}>
              {classPills.map(p => {
                const key = pillKeyMap[p];
                const on = activePills.includes(key);
                return (
                  <button key={key} className={`pillBtn${on ? ' on' : ''}`} onClick={() => togglePill(key)}>
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ===== Collapsible: Indicators by Project Type ===== */}
          <div ref={sortPanelRef} className={`sortPanel${sortPanelOpen ? ' open' : ''}`}>
            <div className="sortPanelHead" onClick={toggleSortPanel}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /><circle cx="17" cy="6" r="1.6" fill="currentColor" stroke="none" /><circle cx="9" cy="12" r="1.6" fill="currentColor" stroke="none" /><circle cx="14" cy="18" r="1.6" fill="currentColor" stroke="none" /></svg>
              <span className="label">View Indicators by Project Type</span>
              <svg className="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
            <div ref={sortPanelBodyRef} className="sortPanelBody" onTransitionEnd={handleSortPanelTransitionEnd}>
              <div className="sortPanelInner">

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 2 }}>
                  <div className="catNav">
                    {groupOrder.map((g, i) => {
                      const projectsInGroup = groupedPresets[i];
                      const groupHasActive = currentPreset && currentPreset.group === g;
                      return (
                        <div className="catItem" key={g}>
                          <button type="button" className={`catBtn${groupHasActive ? ' hasActive' : ''}`}>
                            <span>{g}</span>
                            <span className="caret">&#9660;</span>
                          </button>
                          <div className="catDropdown">
                            {projectsInGroup.map(p => {
                              const isActive = currentPreset && currentPreset.value === p.value;
                              return (
                                <button
                                  type="button"
                                  key={p.value}
                                  className={`projBtn${isActive ? ' active' : ''}`}
                                  onClick={() => selectPreset(isActive ? null : p)}
                                >
                                  <IconTag name={p.icon} />
                                  <span>{p.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {currentPreset && (
                      <div className="presetHintChip" style={{ display: 'flex' }}>
                        <span className="chipLabel">Showing indicators relevant to:</span>
                        <IconTag name={currentPreset.icon} />
                        <span>{currentPreset.label}</span>
                      </div>
                    )}
                    {currentPreset && (
                      <button className="clearPresetBtn" onClick={() => selectPreset(null)}>&times; Clear selection</button>
                    )}
                  </div>
                </div>

                {!currentPreset && (
                  <p className="presetHint">
                    Hover a category to see its projects, then pick one to bring up the data that matters for it. The DSS surfaces the numbers &mdash; the decision is yours.
                  </p>
                )}

                {currentPreset && (
                  <div className="filtersRankingPanel" style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap', marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
                      {currentPreset.filters.map(f => {
                        const opts = distinctValues(f);
                        const hasValue = !!filterValues[f];
                        return (
                          <div className="filterChip" key={f}>
                            <div>
                              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
                                {indicatorLabels[f] || f}
                              </label>
                              <select value={filterValues[f] || ''} onChange={(e) => handleFilterChange(f, e.target.value)}>
                                <option value="">All</option>
                                {opts.map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            </div>
                            <button
                              type="button"
                              className="filterX"
                              title="Clear this filter"
                              disabled={!hasValue}
                              onClick={() => handleFilterClear(f)}
                            >
                              &times;
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {currentPreset.filters.length > 0 && <div className="rankingDivider" style={{ display: 'block' }} />}

                    <div style={{ flex: 1, minWidth: 280 }}>
                      {activeIndicators.length > 0 && (
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center' }}>
                          <span>Indicators shown for this project (uncheck any you don't need &mdash; click a column header in the table to sort by it):</span>
                          <Tooltip
                            ariaLabel="Why are only some indicators shown?"
                            label="Why these indicators"
                            variant="main"
                          >
                            The DSS pre-selects a small number of indicators per project type, following the M&amp;E convention of prioritizing a &ldquo;vital few&rdquo; most-relevant metrics over displaying an entire indicator set at once &mdash; consistent with cognitive load findings (Miller, 1956; Cowan, 2001) showing that decision quality does not improve, and can degrade, when too many variables are presented simultaneously.
                          </Tooltip>
                        </div>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {activeIndicators.length === 0 && (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            No extra indicators for this project &mdash; Population and Households cover it.
                          </span>
                        )}
                        {activeIndicators.map(key => {
                          const on = visibleIndicators.includes(key);
                          const desc = indicatorDescriptions[key] || 'No description available for this indicator.';
                          return (
                            <label key={key} className={`indicatorToggle${on ? ' on' : ''}`}>
                              <input
                                type="checkbox"
                                checked={on}
                                onChange={(e) => toggleIndicatorVisible(key, e.target.checked)}
                              />
                              <span>{indicatorLabels[key] || key}</span>
                              <Tooltip
                                ariaLabel={`What does ${indicatorLabels[key] || key} mean?`}
                                label={indicatorLabels[key] || key}
                                variant="info"
                              >
                                {desc}
                              </Tooltip>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* ===== Table ===== */}
          <div className="tableCard">
            <div className="tableCardHead">
              <h3>All Sitios <span className="countMuted">({filteredSortedList.length})</span></h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {tableSort ? `Sorted by: ${indicatorLabels[tableSort.key] || tableSort.key}${tableSort.dir === 'asc' ? ' \u2191' : ' \u2193'}` : ''}
                </span>
                <button className="refreshBtn" title="Refresh">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.5 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.65 4.36A9 9 0 0 0 20.5 15" /></svg>
                </button>
              </div>
            </div>
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Sitio</th>
                  <th>Location</th>
                  <th className="num sortableCol" onClick={() => handleSortClick('population')}>Population{sortIndicator('population')}</th>
                  <th className="num sortableCol" onClick={() => handleSortClick('households')}>Households{sortIndicator('households')}</th>
                  {extraCols.map(k => (
                    <th className="num sortableCol" key={k} onClick={() => handleSortClick(k)}>
                      {indicatorLabels[k] || k}{sortIndicator(k)}
                    </th>
                  ))}
                  <th className="num">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSortedList.map(s => (
                  <tr key={s.name}>
                    <td>
                      <span className="sitioName">{s.name}</span>
                      {s.classification.map(c => (
                        <span key={c} className={`badge ${badgeClassMap[c] || ''}`}>{c}</span>
                      ))}
                    </td>
                    <td className="locCell">{s.loc}</td>
                    <td className="num">{s.population.toLocaleString()}</td>
                    <td className="num">{s.households.toLocaleString()}</td>
                    {extraCols.map(k => (
                      <td className="num" key={k}>
                        {(k === 'facilities' || k === 'facilitiesMissing')
                          ? <FacilityCell s={s} fieldKey={k} />
                          : formatVal(k, s[k])}
                      </td>
                    ))}
                    <td className="num">
                      <div className="actionsCell">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" /></svg>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </main>
      </div>

      </>
  );
}

/* ---------------------------------------------------------------------
   CSS — copied unchanged from test.html's <style> block.
--------------------------------------------------------------------- */
const CSS = `
  :root {
    --bg: #f8f9fb;
    --surface: #ffffff;
    --border: #e6e7eb;
    --border-strong: #d7d9de;
    --text-primary: #14151a;
    --text-secondary: #63666f;
    --text-muted: #9497a1;
    --blue: #2f6fed;
    --blue-bg: #e8f0fe;
    --blue-text: #1a56c4;
    --green: #17a673;
    --green-bg: #e4f8ef;
    --purple-bg: #f2e9fb;
    --purple-text: #7c3aed;
    --orange-bg: #fdecd8;
    --orange-text: #c2650a;
    --red: #e0392f;
    --radius: 10px;
    --radius-sm: 7px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text-primary); }
  svg { display: block; }
  html, body { height: 100%; }
  .app { display: flex; height: 100vh; overflow: hidden; }
  .sidebar { width: 288px; flex-shrink: 0; height: 100vh; overflow: hidden; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 22px 16px; }
  .brand { display: flex; align-items: center; gap: 11px; padding: 4px 6px 24px; }
  .brand-icon { width: 48px; height: 48px; border-radius: 11px; display:flex; align-items:center; justify-content:center; overflow: hidden; flex-shrink:0; }
  .brand-icon-img { width: 100%; height: 100%; object-fit: cover; }
  .brand-name { font-size: 15px; font-weight: 700; line-height: 1.2; }
  .brand-sub { font-size: 12px; color: var(--text-muted); }
  .navSection { margin-top: 16px; }
  .navSection:first-of-type { margin-top: 0; }
  .navLabel { font-size: 11.5px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; padding: 0 10px 7px; }
  .navItem { display: flex; align-items: center; gap: 11px; font-size: 14px; color: var(--text-secondary); padding: 10px 12px; border-radius: var(--radius-sm); cursor: pointer; text-decoration: none; transition: background 0.15s ease, color 0.15s ease; }
  .navItem:hover { background: #f4f5f7; }
  .navItem.active { background: #f0f2f5; color: var(--text-primary); font-weight: 600; }
  .navItem svg { flex-shrink: 0; color: var(--text-secondary); }
  .navItem.active svg { color: var(--text-primary); }
  .navBadge { margin-left: auto; background: var(--red); color: #fff; font-size: 10.5px; font-weight: 700; min-width: 18px; height: 18px; border-radius: 999px; display: flex; align-items: center; justify-content: center; padding: 0 5px; }
  .sidebarFooter { margin-top: auto; display: flex; align-items: center; gap: 11px; padding: 14px 12px 4px; border-top: 1px solid var(--border); }
  .avatar { width: 36px; height: 36px; border-radius: 999px; background: var(--blue); color: #fff; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .userName { font-size: 13.5px; font-weight: 600; }
  .userEmail { font-size: 11.5px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
  .main { flex: 1; min-width: 0; height: 100vh; overflow-y: auto; padding: 28px 36px 60px; }
  .pageHead { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 26px; }
  .sidebarToggle { border: 1px solid var(--border-strong); background: var(--surface); border-radius: var(--radius-sm); width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); flex-shrink: 0; margin-top: 4px; cursor: pointer; }
  .pageTitle { font-size: 30px; font-weight: 800; margin: 0; letter-spacing: -0.01em; }
  .pageSub { font-size: 14px; color: var(--text-secondary); margin: 4px 0 0; }
  .statRow { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 22px; }
  .statCard { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px 18px; display: flex; align-items: center; gap: 14px; }
  .statIcon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .statLabel { font-size: 12.5px; color: var(--text-secondary); margin-bottom: 3px; }
  .statValue { font-size: 22px; font-weight: 800; }
  .toolRow { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
  .searchBox { flex: 1; min-width: 220px; position: relative; }
  .searchBox svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
  .searchBox input { width: 100%; height: 40px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); padding: 0 12px 0 36px; font-size: 13.5px; background: var(--surface); font-family: inherit; }
  select.toolSelect { height: 40px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); padding: 0 10px; font-size: 13.5px; background: var(--surface); font-family: inherit; color: var(--text-primary); min-width: 150px; }
  .pillBtn { height: 40px; padding: 0 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface); font-size: 13.5px; font-weight: 600; cursor: pointer; color: var(--text-primary); font-family: inherit; }
  .pillBtn:hover { background: #f4f5f7; }
  .pillBtn.on { background: var(--blue-bg); border-color: var(--blue); color: var(--blue-text); }
  .sortPanel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 18px; overflow: hidden; }
  .sortPanelHead { display: flex; align-items: center; gap: 10px; padding: 15px 18px; cursor: pointer; user-select: none; }
  .sortPanelHead .label { font-size: 14.5px; font-weight: 700; flex: 1; }
  .sortPanelHead svg.chev { color: var(--text-secondary); transition: transform 0.18s ease; }
  .sortPanel.open .sortPanelHead svg.chev { transform: rotate(180deg); }
  .sortPanelBody { max-height: 0; overflow: hidden; transition: max-height 0.22s ease; border-top: 1px solid transparent; }
  .sortPanel.open .sortPanelBody { max-height: 900px; border-top-color: var(--border); }
  .sortPanelInner { padding: 18px; }
  .catNav { display: flex; gap: 8px; flex-wrap: wrap; position: relative; z-index: 5; margin-bottom: 4px; }
  .catItem { position: relative; }
  .catBtn { display: flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; padding: 10px 14px; white-space: nowrap; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface); cursor: pointer; font-family: inherit; color: var(--text-primary); }
  .catBtn .caret { font-size: 9px; color: var(--text-muted); transition: transform 0.15s ease; }
  .catItem:hover .catBtn .caret { transform: rotate(180deg); }
  .catItem:hover .catBtn { background: #f4f5f7; }
  .catBtn.hasActive { border-color: var(--blue); color: var(--blue-text); background: var(--blue-bg); }
  .catBtn.hasActive .caret { color: var(--blue-text); }
  .catItem::after { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 8px; }
  .catDropdown { display: none; flex-direction: column; gap: 4px; position: absolute; top: calc(100% + 8px); left: 0; min-width: 240px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-sm); box-shadow: 0 10px 28px rgba(20,21,26,0.12); padding: 6px; z-index: 30; }
  .catItem:hover .catDropdown, .catItem:focus-within .catDropdown { display: flex; }
  .projBtn { display: flex; align-items: center; gap: 8px; text-align: left; font-size: 12.5px; line-height: 1.3; font-family: inherit; padding: 8px 10px; border-radius: 6px; border: 1px solid transparent; background: transparent; color: var(--text-primary); cursor: pointer; width: 100%; }
  .projBtn .presetIcon { flex-shrink: 0; color: var(--text-secondary); }
  .projBtn.active .presetIcon { color: var(--blue-text); }
  .projBtn:hover { background: #f4f5f7; }
  .projBtn.active { background: var(--blue-bg); border-color: var(--blue); color: var(--blue-text); font-weight: 700; }
  .presetHint { font-size: 12.5px; color: var(--text-muted); margin: 14px 0 12px; }
  .filtersRankingPanel { background: #fafbfc; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px 18px; }
  .rankingDivider { width: 1px; background: var(--border-strong); align-self: stretch; flex-shrink: 0; }
  .presetHintChip { display: none; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: var(--blue-text); background: var(--blue-bg); border: 1px solid var(--blue); border-radius: var(--radius-sm); padding: 7px 12px; white-space: nowrap; }
  .presetHintChip .chipLabel { font-weight: 500; color: var(--text-secondary); }
  .clearPresetBtn { font-size: 12px; font-weight: 600; color: var(--red); border: 1px solid var(--border-strong); border-radius: var(--radius-sm); padding: 7px 12px; background: var(--surface); cursor: pointer; font-family: inherit; }
  .clearPresetBtn:hover { background: #fdeceb; border-color: var(--red); }
  .filterChip { display: flex; align-items: flex-end; gap: 4px; }
  .filterChip select { height: 38px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); padding: 0 10px; font-size: 12.5px; font-family: inherit; min-width: 180px; background: var(--surface); }
  .filterX { height: 38px; width: 32px; padding: 0; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
  .filterX:hover:not(:disabled) { color: var(--red); border-color: var(--red); background: #fdeceb; }
  .filterX:disabled { opacity: 0.35; cursor: default; }
  .priorityRow { display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 7px 10px; }
  .rankBadge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: var(--blue-bg); color: var(--blue-text); }
  .iconBtn { border: 1px solid var(--border-strong); background: var(--surface); border-radius: 6px; padding: 4px 7px; cursor: pointer; font-size: 11px; font-family: inherit; }
  .iconBtn:hover { background: #f4f5f7; }
  .indicatorToggle { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 500; padding: 7px 12px; border-radius: 999px; border: 1px solid var(--border-strong); background: var(--surface); cursor: pointer; color: var(--text-secondary); user-select: none; }
  .indicatorToggle input { accent-color: var(--blue); width: 13px; height: 13px; cursor: pointer; margin: 0; }
  .indicatorToggle.on { background: var(--blue-bg); border-color: var(--blue); color: var(--blue-text); font-weight: 600; }
  th.sortableCol { cursor: pointer; user-select: none; }
  th.sortableCol:hover { color: var(--text-primary); }
  .tableCard { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
  .tableCardHead { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; }
  .tableCardHead h3 { font-size: 17px; font-weight: 800; margin: 0; }
  .countMuted { font-size: 13px; color: var(--text-muted); font-weight: 500; margin-left: 6px; }
  .refreshBtn { border: none; background: none; color: var(--text-muted); cursor: pointer; padding: 4px; }
  table.dataTable { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  table.dataTable th { text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.02em; color: var(--text-muted); font-weight: 700; padding: 0 8px 12px; border-bottom: 1px solid var(--border-strong); }
  table.dataTable th.num, table.dataTable td.num { text-align: right; }
  table.dataTable td { padding: 14px 8px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  .sitioName { font-weight: 700; }
  .badge { font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 999px; margin-left: 8px; letter-spacing: 0.01em; }
  .badge.gida { background: var(--orange-bg); color: var(--orange-text); }
  .badge.ip { background: var(--purple-bg); color: var(--purple-text); }
  .badge.caa { background: #fdecec; color: #b02a2a; }
  .locCell { color: var(--text-secondary); text-transform: uppercase; font-size: 12.5px; letter-spacing: 0.01em; }
  .actionsCell { display: flex; gap: 10px; justify-content: flex-end; color: var(--text-muted); }
  .actionsCell svg { cursor: pointer; }
  .actionsCell svg:hover { color: var(--text-primary); }
  .sortedByLine { font-size: 12px; color: var(--text-muted); margin: -4px 0 12px; }
  .tooltipWrap { position: relative; display: inline-flex; align-items: center; vertical-align: middle; margin-left: 7px; }
  .tooltipIcon { width: 19px; height: 19px; border-radius: 999px; background: #f0631f; color: #fff; font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; cursor: help; flex-shrink: 0; border: 2px solid #fff; padding: 0; font-family: inherit; box-shadow: 0 1px 4px rgba(240,99,31,0.5); line-height: 1; }
  .tooltipIcon:hover, .tooltipIcon:focus { background: #d6540f; outline: none; }
  .indicatorInfoIcon { width: 15px; height: 15px; font-size: 10px; border: 1.5px solid var(--blue); background: transparent; color: var(--blue-text); box-shadow: none; opacity: 0.45; }
  .indicatorInfoIcon:hover, .indicatorInfoIcon:focus { background: var(--blue); color: #fff; border-color: var(--blue); opacity: 1; outline: none; }
  .tooltipBubble { display: none; position: absolute; bottom: calc(100% + 11px); left: 50%; transform: translateX(-50%); width: 320px; max-width: calc(100vw - 24px); background: #14151f; color: #fff; font-size: 12.5px; font-weight: 400; line-height: 1.55; letter-spacing: 0; text-transform: none; padding: 14px 16px; border-radius: 10px; box-shadow: 0 14px 32px rgba(20,21,26,0.35); z-index: 40; text-align: left; }
  .tooltipBubble::after { content: ""; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 7px solid transparent; border-top-color: #14151f; }
  .tooltipBubble.flip-right::after { left: auto; right: 9px; transform: none; }
  .tooltipBubble.flip-left::after { left: 9px; transform: none; }
  .tooltipBubbleLabel { display: block; color: #f0631f; font-size: 10.5px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 5px; }
  .tooltipWrap:hover .tooltipBubble, .tooltipIcon:focus + .tooltipBubble { display: block; }
  .formNavItem { background: var(--blue); color: #fff; font-weight: 700; }
  .formNavItem svg { color: #fff; }
  .formNavItem:hover { background: var(--blue); filter: brightness(1.08); }
`;