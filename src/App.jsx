import React, { useState } from "react";
import {
  Users, Briefcase, Building2, ShieldAlert, MapPin, Sprout,
  HelpCircle, ChevronUp, ChevronDown, Check, ListChecks
} from "lucide-react";

/* ---------------------------------------------------------------
   MOCK DATA: a sample completed sitio profile
   Based on the style of real CATCH-UP entries (e.g. Sitio Proper
   Lampaco, Brgy. Liwanay, Banga) — used only to preview the form
---------------------------------------------------------------- */

const MOCK_SITIO = {
  region: "Region XII (SOCCSKSARGEN)",
  province: "South Cotabato",
  municipality: "Banga",
  barangay: "Liwanay",
  sitioName: "Proper Lampaco",
  lat: "6.5921",
  lng: "124.7853",
  moroPop: "14",
  ipPop: "0",
  gida: true,
  conflict: false,
  mainAccess: "Unpaved road",
  totalPop: "412",
  male: "224",
  female: "188",
  age0_14: "188",
  age15_64: "202",
  age65up: "22",
  households: "92",
  noBirthCert: "6",
  noNationalId: "31",
  schoolAge: "98",
  osy: "5",
  laborForce: "238",
  age15_24: "61",
  age25_54: "139",
  age55_64: "29",
  age65upWorking: "9",
  unemployed: "18",
  registeredVoters: "208",
  children: "188",
  seniors: "22",
  pwd: "7",
  soloParents: "9",
  philhealth: "0",
  fourPs: "16",
  classPrivateHH: "9",
  classPrivateEst: "41",
  classGov: "12",
  classSelfEmployed: "94",
  classEmployer: "3",
  classOFW: "4",
  avgIncome: "8810",
  incomeSource: "Wages / Salaries",
  numFarmers: "62",
  farmerType: ["Rice farmer"],
  farmerAssoc: "1",
  farmArea: "56",
  crops: ["Rice", "Coconut", "Corn", "Pineapple"],
  fisherfolk: "0",
  aquacultureOperators: "0",
  fisherfolkAssoc: "0",
  cultureSystems: [],
  aquacultureProducts: [],
  livestock: ["Pig", "Cow", "Carabao", "Goat", "Chicken", "Duck"],
  backyardHH: "70",
  backyardCommodity: "Vegetables",
  houseQuality: "Half-concrete",
  ownership: "Owned",
  waterLevel: "Natural (Spring/River/Well)",
  waterSystems: "1",
  waterCondition: "Functioning",
  noToilet: "12",
  toiletType: "Water-sealed",
  wasteSegregation: true,
  healthCenter: { exists: "No", value: "4.7", condition: "" },
  pharmacy: { exists: "No", value: "8", condition: "" },
  kinder: { exists: "No", value: "7.8", condition: "" },
  elem: { exists: "No", value: "9.4", condition: "" },
  highschool: { exists: "Yes", value: "3", condition: "4" },
  madrasah: { exists: "Yes", value: "3", condition: "2" },
  studentsPerRoom: "46",
  market: { exists: "No", value: "4.4", condition: "" },
  commToilet: { exists: "No", value: "9.6", condition: "" },
  asphalt: { exists: "No", value: "0", condition: "" },
  concrete: { exists: "No", value: "0", condition: "" },
  gravel: { exists: "No", value: "0", condition: "" },
  earth: { exists: "Yes", value: "3.2", condition: "2" },
  hhElectricity: "77",
  electricitySource: "Solar",
  mobileSignal: "4G",
  hhInternet: "31",
  hazards: "Flood",
  peaceOrder: "Peaceful",
  foodSecurity: "Seasonal scarcity",
  dogs: "56",
  cats: "35",
  dogsVaccinated: "40",
  catsVaccinated: "35",
  priorityRatings: {
    "Water system": 3,
    "Community CR (comfort room)": 2,
    "Solar street lights": 2,
    "Road opening / concreting": 3,
    "Farm tools / garden support": 1,
    "Health services": 3,
    "Education / school support": 1,
  },
  leaderName: "Elpidio Fallera",
  leaderPosition: "Sitio Leader",
  leaderContact: "0915 071 7076",
  surveyDate: "2026-06-23",
};

/* ---------------------------------------------------------------
   DATA: Pages → Categories → Indicators, with one source per category
---------------------------------------------------------------- */

const PAGES = [
  {
    id: "geo",
    label: "Geographic & Area Profile",
    icon: MapPin,
    accent: "#2563EB",
    categories: [
      {
        id: "sitio-id",
        title: "Sitio Identification",
        subtitle: "Location and cultural identity of the sitio",
        source: "PSA – Philippine Standard Geographic Code (PSGC); NAMRIA (GPS); NCMF / RA 11054 (Moro population); NCIP (Indigenous Peoples)",
        fields: [
          { label: "Municipality", type: "text", mock: "municipality" },
          { label: "Barangay", type: "text", mock: "barangay" },
          { label: "Purok / Sitio Name", type: "text", mock: "sitioName" },
          { label: "GPS Latitude", type: "text", mock: "lat" },
          { label: "GPS Longitude", type: "text", mock: "lng" },
          { label: "Moro Population (count)", type: "number", mock: "moroPop" },
          { label: "Indigenous Peoples Population (count)", type: "number", mock: "ipPop" },
        ],
      },
      {
        id: "area-class",
        title: "Area Classification",
        subtitle: "Isolation and conflict-vulnerability status",
        source: "DOH Administrative Order No. 2020-0023 (GIDA); OPAPP (Conflict-Affected Areas)",
        fields: [
          { label: "Geographically Isolated and Disadvantaged Area (GIDA)", type: "toggle", mock: "gida" },
          { label: "Conflict-Affected / Conflict-Vulnerable Area", type: "toggle", mock: "conflict" },
        ],
      },
      {
        id: "access",
        title: "Access & Transportation",
        subtitle: "Primary means of reaching the sitio",
        source: "DPWH Road Classification System",
        fields: [
          { label: "Main Access Type", type: "select", options: ["Paved road", "Unpaved road", "Footpath / trail", "Boat access", "Other"], mock: "mainAccess" },
        ],
      },
    ],
  },
  {
    id: "pop",
    label: "Population & Social Profile",
    icon: Users,
    accent: "#7C3AED",
    categories: [
      {
        id: "pop-hh",
        title: "Population & Households",
        subtitle: "Basic population and household counts",
        source: "PSA CBMS – Household Profile Questionnaire (HPQ), RA 11315",
        fields: [
          { label: "Total Population", type: "number", mock: "totalPop" },
          { label: "Male", type: "number", mock: "male" },
          { label: "Female", type: "number", mock: "female" },
          { label: "Age 0–14", type: "number", mock: "age0_14" },
          { label: "Age 15–64", type: "number", mock: "age15_64" },
          { label: "Age 65 and above", type: "number", mock: "age65up" },
          { label: "Total Households", type: "number", mock: "households" },
        ],
      },
      {
        id: "civil-doc",
        title: "Civil Documentation",
        subtitle: "Registration and identification gaps",
        source: "PSA Civil Registration and Vital Statistics; RA 11055 (PhilSys Act)",
        fields: [
          { label: "Without Birth Certificate", type: "number", mock: "noBirthCert" },
          { label: "Without National ID (PhilSys)", type: "number", mock: "noNationalId" },
        ],
      },
      {
        id: "education-part",
        title: "Education Participation",
        subtitle: "School-age population and education access gaps",
        source: "PSA CBMS Core Indicator (e); DepEd Basic Education Information System (BEIS)",
        fields: [
          { label: "School-Age Children (5–17)", type: "number", mock: "schoolAge" },
          { label: "Out-of-School Youth (OSY)", type: "number", mock: "osy" },
        ],
      },
      {
        id: "labor",
        title: "Labor & Employment",
        subtitle: "Working-age population and employment status",
        source: "PSA Labor Force Survey (LFS)",
        fields: [
          { label: "Labor Force Count (15+)", type: "number", mock: "laborForce" },
          { label: "Age 15–24 (working)", type: "number", mock: "age15_24" },
          { label: "Age 25–54 (working)", type: "number", mock: "age25_54" },
          { label: "Age 55–64 (working)", type: "number", mock: "age55_64" },
          { label: "Age 65+ (still working)", type: "number", mock: "age65upWorking" },
          { label: "Estimated Unemployed Persons", type: "number", mock: "unemployed" },
        ],
      },
      {
        id: "civic",
        title: "Civic Registration",
        subtitle: "Electoral registration status",
        source: "COMELEC Voter Registration Records",
        fields: [
          { label: "Registered Voters", type: "number", mock: "registeredVoters" },
        ],
      },
      {
        id: "vulnerable",
        title: "Social Welfare Beneficiary Sectors",
        subtitle: "Population groups covered by DSWD social protection programs",
        source: "DSWD Social Welfare and Development Indicators (SWDI); NCDA / RA 10754 (PWD)",
        fields: [
          { label: "Children", type: "number", mock: "children" },
          { label: "Senior Citizens (60+)", type: "number", mock: "seniors" },
          { label: "Persons with Disability (PWD)", type: "number", mock: "pwd" },
          { label: "Solo Parents", type: "number", mock: "soloParents" },
        ],
      },
      {
        id: "benefits",
        title: "Health & Social Benefits Coverage",
        subtitle: "Enrollment in national health and subsidy programs",
        source: "PhilHealth / RA 11223 (UHC Act); DSWD Pantawid Pamilyang Pilipino Program (4Ps)",
        fields: [
          { label: "PhilHealth Beneficiaries", type: "number", mock: "philhealth" },
          { label: "4Ps Beneficiaries", type: "number", mock: "fourPs" },
        ],
      },
    ],
  },
  {
    id: "livelihood",
    label: "Livelihood",
    icon: Sprout,
    accent: "#16A34A",
    categories: [
      {
        id: "class-worker",
        title: "Employment Classification",
        subtitle: "Number of workers by employment type",
        source: "PSA Labor Force Survey (LFS)",
        fields: [
          { label: "Private Household", type: "number", mock: "classPrivateHH" },
          { label: "Private Establishment", type: "number", mock: "classPrivateEst" },
          { label: "Government", type: "number", mock: "classGov" },
          { label: "Self-Employed", type: "number", mock: "classSelfEmployed" },
          { label: "Employer", type: "number", mock: "classEmployer" },
          { label: "OFW", type: "number", mock: "classOFW" },
        ],
      },
      {
        id: "income",
        title: "Income",
        subtitle: "Average household income and source",
        source: "PSA Family Income and Expenditure Survey (FIES)",
        fields: [
          { label: "Average Household Income (Monthly, ₱)", type: "number", mock: "avgIncome" },
          { label: "Source of Income", type: "select", options: ["Wages / Salaries", "Entrepreneurial activity", "Remittances", "Pension", "Other"], mock: "incomeSource" },
        ],
      },
      {
        id: "agriculture",
        title: "Agriculture",
        subtitle: "Farming activities and crop production",
        source: "DA Registry System for Basic Sectors in Agriculture (RSBSA); PSA Agricultural Census",
        fields: [
          { label: "Number of Farmers", type: "number", mock: "numFarmers" },
          { label: "Farmer Type", type: "checklist", options: ["Rice farmer", "Corn farmer", "Coconut farmer", "Mixed / Other"], mock: "farmerType" },
          { label: "Farmer Associations Established", type: "number", mock: "farmerAssoc" },
          { label: "Farm Area (hectares)", type: "number", mock: "farmArea" },
          { label: "Main Crops Produced", type: "tags", placeholder: "e.g. Rice, Coconut, Corn", mock: "crops" },
        ],
      },
      {
        id: "aquaculture",
        title: "Aquaculture",
        subtitle: "Fishery and aquaculture activities",
        source: "BFAR FishR (Fisherfolk Registration System); RA 8550 (Philippine Fisheries Code of 1998); BFAR Aquaculture Production Classification",
        fields: [
          { label: "Number of Municipal Fisherfolk (capture fishing)", type: "number", mock: "fisherfolk" },
          { label: "Number of Aquaculture Operators (fishpond/cage/pen owners)", type: "number", mock: "aquacultureOperators" },
          { label: "Fisherfolk Associations Established", type: "number", mock: "fisherfolkAssoc" },
          { label: "Aquaculture Culture Systems Present", type: "checklist", options: ["Fishpond", "Fish cage", "Fish pen", "Rice-fish system", "None (capture fishing only)"], mock: "cultureSystems" },
          { label: "Main Aquaculture Products", type: "tags", placeholder: "e.g. Tilapia", mock: "aquacultureProducts" },
        ],
      },
      {
        id: "livestock",
        title: "Livestock & Poultry",
        subtitle: "Animals raised in the sitio",
        source: "Bureau of Animal Industry (BAI) – DA",
        fields: [
          { label: "Livestock / Poultry Types", type: "tags", placeholder: "e.g. Pig, Cow, Carabao", mock: "livestock" },
        ],
      },
      {
        id: "backyard",
        title: "Backyard Food Production",
        subtitle: "Household gardening activities",
        source: "DA Gulayan sa Barangay Program",
        fields: [
          { label: "Households with Backyard Garden", type: "number", mock: "backyardHH" },
          { label: "Common Garden Commodities", type: "select", options: ["Vegetables", "Root crops", "Fruits", "Other"], mock: "backyardCommodity" },
        ],
      },
    ],
  },
  {
    id: "infra",
    label: "Infrastructure & Utilities",
    icon: Building2,
    accent: "#EA580C",
    categories: [
      {
        id: "housing",
        title: "Housing",
        subtitle: "Construction quality and ownership type",
        source: "PSA CBMS Core Indicator – Housing",
        fields: [
          { label: "House Construction Quality", type: "select", options: ["Concrete", "Wood", "Half-concrete", "Makeshift", "Other"], mock: "houseQuality" },
          { label: "Type of Ownership", type: "select", options: ["Owned", "Rented", "Portion of land", "Informal settler", "Owner-constructed on other's lot"], mock: "ownership" },
        ],
      },
      {
        id: "water-san",
        title: "Water & Sanitation",
        subtitle: "Water source level and sanitation access",
        source: "PSA CBMS Core Indicator (d); DOH–LWUA Water Supply Classification; RA 9003 (Ecological Solid Waste Management Act)",
        fields: [
          { label: "Water Source Level", type: "select", options: ["Natural (Spring/River/Well)", "Level I (Point source)", "Level II (Communal faucet)", "Level III (House connection)"], mock: "waterLevel" },
          { label: "Number of Existing Water Systems", type: "number", mock: "waterSystems" },
          { label: "Water Source Condition", type: "select", options: ["Functioning", "Not functioning"], mock: "waterCondition" },
          { label: "Households without Toilet Facility", type: "number", mock: "noToilet" },
          { label: "Toilet Facility Type", type: "select", options: ["Open pit", "Closed pit", "Overhang / Drop type", "Water-sealed"], mock: "toiletType" },
          { label: "Practices Waste Segregation", type: "toggle", mock: "wasteSegregation" },
        ],
      },
      {
        id: "health-fac",
        title: "Health Facilities",
        subtitle: "Inventory and condition of health services",
        source: "DOH GIDA Health Access Framework; PSA CBMS Core Indicator (a)",
        fields: [
          { label: "Health Center", rowLabel: "Health Center", type: "facility", mock: "healthCenter" },
          { label: "Pharmacy", rowLabel: "Pharmacy", type: "facility", mock: "pharmacy" },
        ],
      },
      {
        id: "edu-fac",
        title: "Education Facilities",
        subtitle: "Inventory, condition, and classroom density",
        source: "DepEd BEIS; DepEd Order No. 54 s. 2010 (Classroom-to-Student Ratio)",
        fields: [
          { label: "Kindergarten", rowLabel: "Kindergarten", type: "facility", mock: "kinder" },
          { label: "Elementary School", rowLabel: "Elementary School", type: "facility", mock: "elem" },
          { label: "High School", rowLabel: "High School", type: "facility", mock: "highschool" },
          { label: "Madrasah", rowLabel: "Madrasah", type: "facility", mock: "madrasah" },
          { label: "Average Students per Classroom", type: "number", mock: "studentsPerRoom" },
        ],
      },
      {
        id: "commerce-fac",
        title: "Commerce & Public Facilities",
        subtitle: "Markets and other public infrastructure",
        source: "PSA CBMS – Barangay Profile Questionnaire (BPQ)",
        fields: [
          { label: "Market / Talipapa", rowLabel: "Market / Talipapa", type: "facility", mock: "market" },
          { label: "Community Toilet", rowLabel: "Community Toilet", type: "facility", mock: "commToilet" },
          { label: "Other Facility (enumerator-added)", type: "add-custom" },
        ],
      },
      {
        id: "roads",
        title: "Roads",
        subtitle: "Inventory of road types and conditions",
        source: "DPWH Road Classification; DILG Road Condition Classification; RA 6763 (Concrete Barangay Roads Act)",
        fields: [
          { label: "Asphalt", rowLabel: "Asphalt", type: "facility", mock: "asphalt" },
          { label: "Concrete", rowLabel: "Concrete", type: "facility", mock: "concrete" },
          { label: "Gravel", rowLabel: "Gravel", type: "facility", mock: "gravel" },
          { label: "Natural / Earth", rowLabel: "Natural / Earth", type: "facility", mock: "earth" },
        ],
      },
      {
        id: "electricity",
        title: "Electricity & Connectivity",
        subtitle: "Power source and digital access",
        source: "DOE Household Electrification Program; NTC / DICT",
        fields: [
          { label: "Households with Electricity", type: "number", mock: "hhElectricity" },
          { label: "Electricity Source", type: "select", options: ["Grid", "Solar", "Battery", "Generator"], mock: "electricitySource" },
          { label: "Mobile Signal Strength", type: "select", options: ["None", "2G", "3G", "4G", "5G"], mock: "mobileSignal" },
          { label: "Households with Internet", type: "number", mock: "hhInternet" },
        ],
      },
    ],
  },
  {
    id: "safety",
    label: "Safety & Risk",
    icon: ShieldAlert,
    accent: "#DC2626",
    categories: [
      {
        id: "hazards",
        title: "Disaster Risk",
        subtitle: "Environmental hazard exposure",
        source: "NDRRMC; RA 10121 (Philippine DRRM Act)",
        fields: [
          { label: "Environmental Hazards Present", type: "select", options: ["Flood", "Landslide", "Drought", "Earthquake", "Other"], mock: "hazards" },
        ],
      },
      {
        id: "peace",
        title: "Peace & Order",
        subtitle: "Current safety condition of the sitio",
        source: "PSA CBMS Core Indicator (h) – Peace and Order",
        fields: [
          { label: "Peace and Order Status", type: "select", options: ["Peaceful", "Occasional incidents", "Frequent incidents"], mock: "peaceOrder" },
        ],
      },
      {
        id: "food-sec",
        title: "Food Security",
        subtitle: "Community-level food security concern",
        source: "FNRI (Food and Nutrition Research Institute); WFP Food Security Indicators",
        fields: [
          { label: "Primary Food Security Concern", type: "select", options: ["Food secure", "Seasonal scarcity", "Chronic shortage"], mock: "foodSecurity" },
        ],
      },
      {
        id: "animal-health",
        title: "Animal Health",
        subtitle: "Pet population and rabies vaccination coverage",
        source: "Bureau of Animal Industry (BAI); RA 9482 (Anti-Rabies Act of 2007)",
        fields: [
          { label: "Total Dogs", type: "number", mock: "dogs" },
          { label: "Total Cats", type: "number", mock: "cats" },
          { label: "Vaccinated Dogs", type: "number", mock: "dogsVaccinated" },
          { label: "Vaccinated Cats", type: "number", mock: "catsVaccinated" },
        ],
      },
    ],
  },
  {
    id: "priority",
    label: "Priority Needs & Validation",
    icon: ListChecks,
    accent: "#7C3AED",
    categories: [
      {
        id: "priority-needs",
        title: "Sitio Priority Needs",
        subtitle: "Community self-reported priorities, answered with the Sitio Leader",
        source: "Adapted from CATCH-UP's existing data collection instrument — not a government statistical framework, since community-articulated needs are primary qualitative input that no national indicator system can substitute for",
        fields: [
          { label: "Priority Ratings", type: "priority-grid", mock: "priorityRatings", options: [
            "Water system", "Community CR (comfort room)", "Solar street lights",
            "Road opening / concreting", "Farm tools / garden support",
            "Health services", "Education / school support",
          ] },
        ],
      },
      {
        id: "validation",
        title: "Validation",
        subtitle: "Completed by the Sitio Leader or designated representative to confirm accuracy",
        source: "Standard survey methodology practice (respondent attestation) — not a data indicator, so no government framework applies",
        fields: [
          { label: "Sitio Leader / Representative Name", type: "text", mock: "leaderName" },
          { label: "Position", type: "text", mock: "leaderPosition" },
          { label: "Contact Number", type: "text", mock: "leaderContact" },
          { label: "Date of Survey", type: "text", mock: "surveyDate" },
        ],
      },
    ],
  },
];

/* ---------------------------------------------------------------
   COMPONENTS
---------------------------------------------------------------- */

function InfoTooltip({ label, text, accent, align = "left" }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="src-wrap">
      <button
        type="button"
        className="src-btn"
        style={{ "--accent": accent }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        aria-label={`View ${label} info`}
      >
        <HelpCircle size={16} strokeWidth={2.2} />
      </button>
      {open && (
        <div className={`src-tooltip src-tooltip-${align}`} style={{ "--accent": accent }}>
          <div className="src-tooltip-label">{label}</div>
          <div className="src-tooltip-text">{text}</div>
        </div>
      )}
    </span>
  );
}

function SourceTooltip({ source, accent }) {
  return <InfoTooltip label="Source" text={source} accent={accent} />;
}

const CONDITION_SCALE_TEXT = (
  "5 - Excellent: In optimal condition; newly built, renovated, or exceeds standard requirements.\n" +
  "4 - Good: Fully functional and well-maintained; requires only routine maintenance.\n" +
  "3 - Average: Functional with minor defects; needs minor repairs and preventive maintenance.\n" +
  "2 - Poor: Functional but with significant wear; requires major repairs soon to prevent failure.\n" +
  "1 - Bad: Severely damaged, unsafe, or non-functional; requires immediate major intervention."
);

const DISTANCE_INFO_TEXT =
  "Distance from the sitio to the nearest facility of this type, in kilometers. Leave blank or enter 0 if the facility exists within the sitio itself.";

function FacilityTable({ fields, mockMode, mockData, accent, lengthLabel = "Distance (km)" }) {
  return (
    <div className="field field-wide">
      <table className="facility-table">
        <thead>
          <tr>
            <th className="ft-name-col">Facility</th>
            <th>Exists</th>
            <th>
              {lengthLabel} <InfoTooltip label={lengthLabel} text={DISTANCE_INFO_TEXT} accent={accent} align="right" />
            </th>
            <th>
              Condition <InfoTooltip label="Condition Scale" text={CONDITION_SCALE_TEXT} accent={accent} align="right" />
            </th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => {
            const mockValue = field.mock ? mockData?.[field.mock] : undefined;
            const mv = mockMode && mockValue ? mockValue : { exists: "", value: "", condition: "" };
            return (
              <tr key={field.label}>
                <td className="ft-name-col">{field.rowLabel || field.label}</td>
                <td>
                  <select className="input input-sm" defaultValue={mv.exists} key={`e-${mv.exists}`}>
                    <option value="">—</option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </td>
                <td>
                  <input className="input input-sm" placeholder="km" defaultValue={mv.value} key={`v-${mv.value}`} />
                </td>
                <td>
                  <select className="input input-sm" defaultValue={mv.condition} key={`c-${mv.condition}`}>
                    <option value="">—</option>
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Poor</option>
                    <option value="1">1 - Bad</option>
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Field({ field, mockMode, mockData }) {
  const mockValue = field.mock ? mockData?.[field.mock] : undefined;

  if (field.type === "toggle") {
    const initial = mockMode && typeof mockValue === "boolean" ? mockValue : false;
    const [on, setOn] = useState(initial);
    return (
      <div className="field field-toggle">
        <span className="field-label">{field.label}</span>
        <button
          type="button"
          className={`toggle ${on ? "toggle-on" : ""}`}
          onClick={() => setOn(!on)}
          aria-pressed={on}
        >
          <span className="toggle-knob" />
        </button>
      </div>
    );
  }

  if (field.type === "select") {
    const initial = mockMode && mockValue ? mockValue : "";
    return (
      <div className="field">
        <label className="field-label">{field.label}</label>
        <select className="input" defaultValue={initial} key={initial}>
          <option value="">Select…</option>
          {field.options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "checklist") {
    const initialChecked = mockMode && Array.isArray(mockValue) ? mockValue : [];
    const [checked, setChecked] = useState(initialChecked);
    const toggle = (opt) => {
      setChecked((prev) =>
        prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
      );
    };
    return (
      <div className="field field-wide">
        <label className="field-label">{field.label}</label>
        <div className="checklist-grid">
          {field.options.map((o) => (
            <label className="checklist-item" key={o}>
              <input
                type="checkbox"
                checked={checked.includes(o)}
                onChange={() => toggle(o)}
              />
              <span>{o}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "priority-grid") {
    const initialRatings = mockMode && mockValue ? mockValue : {};
    const [ratings, setRatings] = useState(initialRatings);
    const setRating = (item, val) => setRatings((prev) => ({ ...prev, [item]: val }));
    return (
      <div className="field field-wide">
        <div className="priority-scale-note">
          Scale: <strong>0</strong> = Not needed &nbsp; <strong>1</strong> = Needed &nbsp; <strong>2</strong> = Important &nbsp; <strong>3</strong> = Very urgent
        </div>
        <table className="priority-table">
          <thead>
            <tr>
              <th className="pt-name-col">Intervention</th>
              <th>0</th>
              <th>1</th>
              <th>2</th>
              <th>3</th>
            </tr>
          </thead>
          <tbody>
            {field.options.map((item) => (
              <tr key={item}>
                <td className="pt-name-col">{item}</td>
                {[0, 1, 2, 3].map((val) => (
                  <td key={val} className="pt-radio-cell">
                    <input
                      type="radio"
                      name={`priority-${item}`}
                      checked={String(ratings[item]) === String(val)}
                      onChange={() => setRating(item, val)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (field.type === "tags") {
    const initialTags = mockMode && Array.isArray(mockValue) ? mockValue : [];
    const [tags, setTags] = useState(initialTags);
    const [val, setVal] = useState("");
    const add = () => {
      if (val.trim()) {
        setTags([...tags, val.trim()]);
        setVal("");
      }
    };
    return (
      <div className="field field-wide">
        <label className="field-label">{field.label}</label>

        <div className="tag-row">
          <input
            className="input"
            placeholder={field.placeholder || "Type and press Add"}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          />
          <button type="button" className="add-btn" onClick={add}>Add</button>
        </div>
        <div className="tag-list">
          {tags.map((t, i) => (
            <span key={i} className="tag-chip">
              {t}
              <button type="button" onClick={() => setTags(tags.filter((_, j) => j !== i))}>×</button>
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "facility") {
    const mv = mockMode && mockValue ? mockValue : { exists: "", value: "", condition: "" };
    return (
      <div className="field field-wide facility-row">
        <span className="field-label">{field.label}</span>
        <div className="facility-inputs">
          <select className="input input-sm" defaultValue={mv.exists} key={`e-${mv.exists}`}>
            <option value="">Exists?</option>
            <option>Yes</option>
            <option>No</option>
          </select>
          <input className="input input-sm" placeholder="Value (km / count)" defaultValue={mv.value} key={`v-${mv.value}`} />
          <select className="input input-sm" defaultValue={mv.condition} key={`c-${mv.condition}`} title="5=Excellent, 4=Good, 3=Average, 2=Poor, 1=Bad">
            <option value="">Condition (1-5)</option>
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Good</option>
            <option value="3">3 - Average</option>
            <option value="2">2 - Poor</option>
            <option value="1">1 - Bad</option>
          </select>
        </div>
      </div>
    );
  }

  if (field.type === "system-area") {
    const mv = mockMode && mockValue ? mockValue : { exists: "", area: "" };
    return (
      <div className="field field-wide facility-row">
        <span className="field-label">{field.label}</span>
        <div className="facility-inputs">
          <select className="input input-sm" defaultValue={mv.exists} key={`e-${mv.exists}`}>
            <option value="">Exists?</option>
            <option>Yes</option>
            <option>No</option>
          </select>
          <input className="input input-sm" placeholder="Area / unit count" defaultValue={mv.area} key={`a-${mv.area}`} />
        </div>
      </div>
    );
  }

  if (field.type === "add-custom") {
    return (
      <div className="field field-wide">
        <button type="button" className="add-custom-btn">
          + Add facility not listed
        </button>
      </div>
    );
  }

  const initialVal = mockMode && mockValue !== undefined ? mockValue : "";
  return (
    <div className="field">
      <label className="field-label">{field.label}</label>
      <input
        className="input"
        type={field.type === "number" ? "number" : "text"}
        placeholder="—"
        defaultValue={initialVal}
        key={initialVal}
      />
    </div>
  );
}

function CategoryCard({ category, accent, mockMode, mockData }) {
  const [collapsed, setCollapsed] = useState(false);

  // Group consecutive "facility" fields into one shared table; render everything else normally.
  const renderItems = [];
  let facilityBuffer = [];
  category.fields.forEach((f, i) => {
    if (f.type === "facility") {
      facilityBuffer.push(f);
    } else {
      if (facilityBuffer.length) {
        renderItems.push({ kind: "table", fields: facilityBuffer, key: `tbl-${i}` });
        facilityBuffer = [];
      }
      renderItems.push({ kind: "field", field: f, key: `f-${i}` });
    }
  });
  if (facilityBuffer.length) {
    renderItems.push({ kind: "table", fields: facilityBuffer, key: "tbl-end" });
  }

  const lengthLabel = category.id === "roads" ? "Length (km)" : "Distance (km)";

  return (
    <div className="category-card" style={{ "--accent": accent }}>
      <button
        type="button"
        className="category-header"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="category-header-left">
          <div className="category-titles">
            <span className="category-title">
              {category.title}
              <SourceTooltip source={category.source} accent={accent} />
            </span>
            <span className="category-subtitle">{category.subtitle}</span>
          </div>
        </div>
        <span className="category-toggle-icon">
          {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </span>
      </button>
      {!collapsed && (
        <div className="category-body">
          {renderItems.map((item) =>
            item.kind === "table" ? (
              <FacilityTable
                fields={item.fields}
                mockMode={mockMode}
                mockData={mockData}
                accent={accent}
                lengthLabel={lengthLabel}
                key={`${mockMode}-${item.key}`}
              />
            ) : (
              <Field field={item.field} mockMode={mockMode} mockData={mockData} key={`${mockMode}-${item.key}`} />
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState(PAGES[0].id);
  const [mockMode, setMockMode] = useState(true);
  const page = PAGES.find((p) => p.id === activePage);
  const pageIndex = PAGES.findIndex((p) => p.id === activePage);

  return (
    <div className="app-shell">
      <style>{CSS}</style>

      <aside className="sidebar">
        <div className="sidebar-head">
          <div className="sidebar-head-icon">✦</div>
          <div>
            <div className="sidebar-title">Form Progress</div>
            <div className="sidebar-sub">{PAGES.length} sections · Year 2026</div>
          </div>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${((pageIndex + 1) / PAGES.length) * 100}%` }}
          />
        </div>

        <nav className="sidebar-nav">
          {PAGES.map((p, idx) => {
            const Icon = p.icon;
            const isActive = p.id === activePage;
            const isDone = idx < pageIndex;
            return (
              <button
                key={p.id}
                className={`nav-item ${isActive ? "nav-item-active" : ""}`}
                onClick={() => setActivePage(p.id)}
                style={isActive ? { "--accent": p.accent } : {}}
              >
                <span className={`nav-icon ${isDone ? "nav-icon-done" : ""}`} style={isActive ? { background: p.accent } : {}}>
                  {isDone ? <Check size={14} /> : <Icon size={14} />}
                </span>
                <span className="nav-text">
                  <span className="nav-label">{p.label}</span>
                  <span className="nav-status">
                    {isActive ? "In progress" : isDone ? "Completed" : "Not started"}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mock-toggle-wrap">
          <div className="mock-toggle-label">
            <span>Sample data</span>
            <span className="mock-toggle-sub">
              {mockMode ? "Sitio Proper Lampaco" : "Blank form"}
            </span>
          </div>
          <button
            type="button"
            className={`toggle ${mockMode ? "toggle-on" : ""}`}
            style={{ "--accent": "#6366F1" }}
            onClick={() => setMockMode(!mockMode)}
            aria-pressed={mockMode}
          >
            <span className="toggle-knob" />
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="main-header">
          <div className="main-header-icon" style={{ background: page.accent }}>
            <page.icon size={20} color="#fff" />
          </div>
          <div>
            <h1>{page.label}</h1>
            <p>Step {pageIndex + 1} of {PAGES.length} · Year 2026</p>
          </div>
          <div className="main-header-note">
            <HelpCircle size={14} /> Hover the <HelpCircle size={12} style={{ display: "inline", verticalAlign: "middle" }} /> icon on any category for its source
          </div>
        </header>

        <div className="cards-stack">
          {page.categories.map((cat) => (
            <CategoryCard
              category={cat}
              accent={page.accent}
              mockMode={mockMode}
              mockData={MOCK_SITIO}
              key={`${cat.id}-${mockMode}`}
            />
          ))}
        </div>

        <div className="footer-nav">
          <button
            className="footer-btn footer-btn-ghost"
            disabled={pageIndex === 0}
            onClick={() => setActivePage(PAGES[pageIndex - 1].id)}
          >
            ← Previous
          </button>
          <span className="footer-progress">
            {PAGES.map((p, i) => (
              <span key={p.id} className={`dot ${i <= pageIndex ? "dot-filled" : ""}`} />
            ))}
          </span>
          <button
            className="footer-btn footer-btn-solid"
            style={{ background: page.accent }}
            disabled={pageIndex === PAGES.length - 1}
            onClick={() => setActivePage(PAGES[pageIndex + 1].id)}
          >
            {pageIndex === PAGES.length - 1 ? "Finish" : `Next: ${PAGES[pageIndex + 1].label}`} →
          </button>
        </div>
      </main>
    </div>
  );
}

/* ---------------------------------------------------------------
   STYLES
---------------------------------------------------------------- */
const CSS = `
* { box-sizing: border-box; }
.app-shell {
  display: flex;
  min-height: 100vh;
  background: #F4F6F9;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #1C2433;
}

/* SIDEBAR */
.sidebar {
  width: 252px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #E5E9F0;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.sidebar-head { display: flex; align-items: center; gap: 10px; }
.sidebar-head-icon {
  width: 30px; height: 30px; border-radius: 9px;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-size: 14px;
}
.sidebar-title { font-size: 13.5px; font-weight: 700; color: #1C2433; }
.sidebar-sub { font-size: 11.5px; color: #8A93A6; }
.progress-track {
  height: 6px; background: #EDF0F5; border-radius: 99px; overflow: hidden;
}
.progress-fill {
  height: 100%; background: linear-gradient(90deg, #6366F1, #3B82F6);
  border-radius: 99px; transition: width .35s ease;
}
.sidebar-nav { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
.mock-toggle-wrap {
  margin-top: auto; display: flex; align-items: center; justify-content: space-between;
  gap: 10px; padding: 11px 12px; background: #F7F8FC; border: 1px solid #E5E9F0;
  border-radius: 12px;
}
.mock-toggle-label { display: flex; flex-direction: column; gap: 1px; }
.mock-toggle-label span:first-child { font-size: 12px; font-weight: 700; color: #1C2433; }
.mock-toggle-sub { font-size: 11px; color: #8A93A6; }
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; border-radius: 10px; border: none; background: transparent;
  cursor: pointer; text-align: left; width: 100%;
  transition: background .15s ease;
}
.nav-item:hover { background: #F4F6FB; }
.nav-item-active { background: #EFF3FF; }
.nav-icon {
  width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: #EDF0F5; color: #8A93A6;
}
.nav-item-active .nav-icon { color: #fff; }
.nav-icon-done { background: #DCFAE6 !important; color: #16A34A !important; }
.nav-text { display: flex; flex-direction: column; min-width: 0; }
.nav-label { font-size: 13px; font-weight: 600; color: #1C2433; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nav-status { font-size: 11px; color: #9AA2B3; }
.nav-item-active .nav-status { color: var(--accent); font-weight: 600; }

/* MAIN */
.main-panel { flex: 1; padding: 28px 36px 60px; max-width: 980px; }
.main-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 22px; position: relative; }
.main-header-icon {
  width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.main-header h1 { font-size: 21px; font-weight: 700; margin: 0 0 2px; letter-spacing: -0.01em; }
.main-header p { font-size: 12.5px; color: #8A93A6; margin: 0; }
.main-header-note {
  margin-left: auto; align-self: center; display: flex; align-items: center; gap: 6px;
  font-size: 11.5px; color: #9AA2B3; background: #fff; border: 1px solid #E5E9F0;
  border-radius: 99px; padding: 6px 12px; white-space: nowrap;
}

.cards-stack { display: flex; flex-direction: column; gap: 16px; }

.category-card {
  background: #fff; border-radius: 14px; border: 1px solid #E5E9F0;
  border-left: 4px solid var(--accent);
  box-shadow: 0 1px 2px rgba(20,25,40,0.03);
}
.category-header {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: 16px 18px; background: none; border: none; cursor: pointer; text-align: left;
  border-radius: 14px 14px 0 0;
}
.category-titles { display: flex; flex-direction: column; gap: 2px; }
.category-title {
  font-size: 14.5px; font-weight: 700; color: #1C2433;
  display: flex; align-items: center; gap: 7px;
}
.category-subtitle { font-size: 12px; color: #8A93A6; font-weight: 400; }
.category-toggle-icon { color: #9AA2B3; }

.src-wrap { position: relative; display: inline-flex; }
.src-btn {
  display: flex; align-items: center; justify-content: center;
  width: 19px; height: 19px; border-radius: 50%; border: none;
  background: #F1F3F8; color: #9AA2B3; cursor: help; padding: 0;
  transition: background .15s, color .15s;
}
.src-btn:hover { background: var(--accent); color: #fff; }
.src-tooltip {
  position: absolute; top: 24px; left: 0; z-index: 30;
  width: 280px; background: #1C2433; color: #fff; border-radius: 10px;
  padding: 11px 13px; box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  font-weight: 400;
}
.src-tooltip-right { left: auto; right: 0; }
.src-tooltip::before {
  content: ""; position: absolute; top: -5px; left: 9px;
  width: 10px; height: 10px; background: #1C2433; transform: rotate(45deg);
}
.src-tooltip-right::before { left: auto; right: 9px; }
.src-tooltip-label {
  font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em;
  color: var(--accent); font-weight: 700; margin-bottom: 4px;
}
.src-tooltip-text { font-size: 12px; line-height: 1.5; font-weight: 500; white-space: pre-line; }

.facility-table {
  width: 100%; border-collapse: collapse; font-size: 12.5px;
}
.facility-table th, .facility-table td {
  padding: 7px 8px; text-align: left; border-bottom: 1px solid #F0F2F6;
}
.facility-table th {
  font-size: 11.5px; font-weight: 700; color: #6B7280; text-transform: uppercase;
  letter-spacing: 0.03em; white-space: nowrap; position: relative;
}
.facility-table th .src-wrap { margin-left: 4px; vertical-align: middle; }
.facility-table .ft-name-col { width: 32%; font-weight: 600; color: #1C2433; text-transform: none; }
.facility-table td .input { width: 100%; }
.facility-table tbody tr:last-child td { border-bottom: none; }

.priority-scale-note {
  font-size: 12.5px; color: #4B5468; margin-bottom: 10px; font-weight: 500;
}
.priority-scale-note strong { color: #1C2433; }
.priority-table {
  width: 100%; border-collapse: collapse; font-size: 13px;
}
.priority-table th, .priority-table td {
  padding: 8px 10px; text-align: center; border-bottom: 1px solid #F0F2F6;
}
.priority-table th {
  font-size: 11.5px; font-weight: 700; color: #6B7280;
}
.priority-table .pt-name-col { text-align: left; width: 56%; font-weight: 600; color: #1C2433; }
.priority-table tbody tr:last-child td { border-bottom: none; }
.pt-radio-cell input[type="radio"] { width: 16px; height: 16px; accent-color: var(--accent, #7C3AED); cursor: pointer; }

.category-body {
  padding: 4px 18px 18px;
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px 16px;
  border-top: 1px solid #F0F2F6;
  padding-top: 16px;
  border-radius: 0 0 14px 14px;
}

.field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.field-wide { grid-column: 1 / -1; }
.field-label {
  font-size: 12px; font-weight: 600; color: #4B5468;
  min-height: 28px; display: flex; align-items: flex-start; line-height: 1.35;
}
.input {
  border: 1px solid #DEE2EA; border-radius: 9px; padding: 9px 11px;
  font-size: 13px; color: #1C2433; background: #FAFBFD; width: 100%;
  font-family: inherit;
}
.input:focus { outline: none; border-color: var(--accent, #6366F1); background: #fff; }
.input-sm { padding: 7px 9px; font-size: 12.5px; }

.field-toggle { flex-direction: row; align-items: center; justify-content: space-between; }
.field-toggle .field-label { min-height: 0; align-items: center; }
.toggle {
  width: 38px; height: 22px; border-radius: 99px; background: #E2E6ED;
  border: none; position: relative; cursor: pointer; flex-shrink: 0; padding: 0;
  transition: background .2s ease;
}
.toggle-on { background: var(--accent); }
.toggle-knob {
  position: absolute; top: 2px; left: 2px; width: 18px; height: 18px;
  background: #fff; border-radius: 50%; transition: transform .2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.toggle-on .toggle-knob { transform: translateX(16px); }

.tag-row { display: flex; gap: 8px; }
.add-btn {
  border: 1px solid #DEE2EA; background: #fff; border-radius: 9px;
  padding: 0 14px; font-size: 12.5px; font-weight: 600; color: #4B5468; cursor: pointer;
}
.add-btn:hover { background: #F4F6FB; }
.tag-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.tag-chip {
  display: inline-flex; align-items: center; gap: 6px;
  background: #EFF3FF; color: #3B4FE0; font-size: 12px; font-weight: 600;
  padding: 5px 6px 5px 11px; border-radius: 99px;
}
.tag-chip button {
  border: none; background: none; cursor: pointer; color: #3B4FE0;
  font-size: 14px; line-height: 1; padding: 0 2px;
}

.checklist-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 14px;
}
.checklist-item {
  display: flex; align-items: center; gap: 8px; font-size: 13px;
  color: #1C2433; cursor: pointer;
}
.checklist-item input[type="checkbox"] {
  width: 15px; height: 15px; accent-color: var(--accent, #6366F1); cursor: pointer;
}

.facility-row { display: flex; flex-direction: column; gap: 8px; }
.facility-inputs { display: flex; gap: 8px; }
.facility-inputs .input { flex: 1; }

.add-custom-btn {
  border: 1.5px dashed #C7CCD8; background: #FAFBFD; border-radius: 10px;
  padding: 10px; font-size: 12.5px; font-weight: 600; color: #6B7280;
  cursor: pointer; width: 100%;
}
.add-custom-btn:hover { border-color: var(--accent); color: var(--accent); background: #fff; }

.footer-nav {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 26px; padding-top: 20px; border-top: 1px solid #E5E9F0;
}
.footer-btn {
  border-radius: 10px; padding: 10px 18px; font-size: 13px; font-weight: 600;
  cursor: pointer; border: none;
}
.footer-btn-ghost { background: none; color: #6B7280; }
.footer-btn-ghost:disabled { opacity: 0.35; cursor: not-allowed; }
.footer-btn-solid { color: #fff; }
.footer-btn-solid:disabled { opacity: 0.4; cursor: not-allowed; }
.footer-progress { display: flex; gap: 6px; }
.dot { width: 7px; height: 7px; border-radius: 50%; background: #DDE1E9; }
.dot-filled { background: #3B82F6; }

@media (max-width: 860px) {
  .app-shell { flex-direction: column; }
  .sidebar { width: 100%; flex-direction: row; overflow-x: auto; }
  .category-body { grid-template-columns: 1fr 1fr; }
  .main-header-note { display: none; }
}
@media (max-width: 560px) {
  .category-body { grid-template-columns: 1fr; }
}
`;