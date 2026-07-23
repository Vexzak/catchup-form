import React, { useState, useRef, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import {
  Users, Briefcase, Building2, ShieldAlert, MapPin, Sprout,
  HelpCircle, ChevronUp, ChevronDown, Check, ListChecks, Search, Plus, X,
  CloudRain, Mountain, Flame, Activity, ImagePlus, Upload, Image as ImageIcon,
  Droplets, HeartPulse, GraduationCap, Store, Route as RouteIcon, Zap
} from "lucide-react";
import Sitio from "./components/sitio/sitio.jsx";
import Dashboard from "./components/dashboard/dashboard.jsx";
import PublicPortal from "./components/public/public.jsx";

/* ---------------------------------------------------------------
   FIXED OPTION LISTS
   - Crops & Livestock: per existing CATCH-UP form screenshots
   - Aquaculture: BFAR commodity data narrowed to species actually
     documented in South Cotabato (Lake Sebu / Lake Seloton cage
     culture, Banga BFAR multi-species hatchery). Source: BFAR
     Philippine Fisheries Profile; SEAFDEC "Status of Tilapia
     Aquaculture in Lake Sebu, South Cotabato"; South Cotabato
     Provincial Government (BFAR Banga hatchery turnover release).
---------------------------------------------------------------- */

const CROP_OPTIONS = [
  "Corn", "Coconut", "Sugarcane", "Coffee", "Cacao", "Abaca",
  "Sweet Potato", "Mango", "Banana", "Cassava", "Vegetables", "Palay",
  "Pineapple", "Rubber", "Oil Palm", "Other",
];

const LIVESTOCK_OPTIONS = [
  "Pigs", "Cows", "Carabaos", "Horses", "Goats", "Chickens", "Ducks", "Other",
];

const AQUACULTURE_OPTIONS = [
  "Tilapia",
  "Hito (Catfish)",
  "Carp",
  "Dalag (Mudfish)",
  "Ulang (Giant Freshwater Prawn)",
  "Other",
];

const FARMER_TYPE_OPTIONS = [
  "Farm owner",
  "Tenant farmer",
  "Smallholder farmer",
  "Agricultural worker/laborer",
  "Livestock raiser",
];

/* ---------------------------------------------------------------
   HAZARD ICONS
   Used by the Safety & Risk "Environmental Hazards" grid.
---------------------------------------------------------------- */
const HAZARD_ICONS = {
  Flood: CloudRain,
  Landslide: Mountain,
  Drought: Flame,
  Earthquake: Activity,
  Other: HelpCircle,
};

/* ---------------------------------------------------------------
   INFRASTRUCTURE CATEGORY ICONS
   Small icon shown next to each Infrastructure & Utilities category
   title, to break up the section visually and give each card its
   own identity at a glance.
---------------------------------------------------------------- */
const INFRA_CATEGORY_ICONS = {
  housing: Building2,
  "water-san": Droplets,
  "health-fac": HeartPulse,
  "edu-fac": GraduationCap,
  "commerce-fac": Store,
  roads: RouteIcon,
  electricity: Zap,
};

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
  sitioCode: "SCT-BGA-LIW-001",
  lat: "6.5921",
  lng: "124.7853",
  moroPop: "14",
  ipPop: "0",
  gida: true,
  conflictAffected: false,
  conflictVulnerable: false,
  mainAccess: "Unpaved road",
  transportModes: ["Bicycle", "Motorcycle", "Tricycle"],
  totalPop: "412",
  male: "224",
  female: "188",
  age0_14: "188",
  age15_64: "202",
  age65up: "22",
  households: "92",
  noBirthCert: "6",
  noNationalId: "31",
  currentlyAttending: "98",
  oscy: "5",
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
  philhealthDirect: "0",
  philhealthIndirect: "0",
  fourPs: "16",
  classPrivateHH: "9",
  classPrivateEst: "41",
  classGov: "12",
  classSelfEmployed: "94",
  classEmployer: "3",
  classOFW: "4",
  wageSalaryWorker: "62",
  avgIncome: "8810",
  incomeSource: "Wages / Salaries",
  numFarmers: "62",
  farmerType: {
    "Farm owner": "22",
    "Tenant farmer": "18",
    "Smallholder farmer": "14",
    "Agricultural worker/laborer": "6",
    "Livestock raiser": "2",
  },
  farmerAssoc: "1",
  farmArea: "56",
  crops: ["Palay", "Coconut", "Corn", "Pineapple"],
  fisherfolk: "0",
  aquacultureOperators: "0",
  fisherfolkAssoc: "0",
  cultureSystems: [],
  aquacultureProducts: ["Tilapia"],
  livestock: ["Pigs", "Cows", "Carabaos", "Goats", "Chickens", "Ducks"],
  backyardHH: "70",
  backyardCommodity: "Vegetables",
  houseTypeCounts: {
    "Concrete": "10",
    "Wood": "5",
    "Half-concrete": "60",
    "Makeshift": "15",
    "Other": "2",
  },
  ownershipCounts: {
    "Owned": "70",
    "Rented": "5",
    "Portion of land": "10",
    "Informal settler": "5",
    "Owner-constructed on other's lot": "2",
  },
  waterSources: {
    "Natural": { exists: "Yes", functioning: "3", notFunctioning: "1" },
    "Level 1": { exists: "No", functioning: "", notFunctioning: "" },
    "Level 2": { exists: "No", functioning: "", notFunctioning: "" },
    "Level 3": { exists: "No", functioning: "", notFunctioning: "" },
  },
  noToilet: "12",
  toiletType: ["Water-sealed"],
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
  hazards: { Flood: "5", Landslide: "3", Drought: "4", Earthquake: "0", Other: "" },
  foodSecurity: "Seasonal scarcity",
  dogs: "56",
  cats: "35",
  dogsVaccinated: "40",
  catsVaccinated: "35",
  photos: [],
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
        source: "PSA – Philippine Standard Geographic Code (PSGC); NAMRIA (GPS)",
        fields: [
          { label: "Municipality", type: "text", mock: "municipality" },
          { label: "Barangay", type: "text", mock: "barangay" },
          { label: "Purok / Sitio Name", type: "text", mock: "sitioName" },
          { label: "Sitio Code", type: "text", mock: "sitioCode" },
          { label: "GPS Latitude", type: "text", mock: "lat" },
          { label: "GPS Longitude", type: "text", mock: "lng" },
        ],
      },
      {
        id: "area-class",
        title: "Area Classification",
        subtitle: "Isolation and conflict-vulnerability status",
        source: "DOH Administrative Order No. 2020-0023 (GIDA); PAMANA Program Manual of Operations, OPAPRU (Conflict-Affected/Conflict-Vulnerable Areas)",
        fields: [
          { label: "Geographically Isolated and Disadvantaged Area (GIDA)", type: "toggle", mock: "gida" },
          {
            type: "exclusive-toggle-pair",
            fields: [
              {
                label: "Conflict-Affected Area (CAA)",
                mock: "conflictAffected",
                tooltip: "Areas where actual armed encounters between government forces and political armed groups have occurred, or where political armed groups have dominance in the community.",
              },
              {
                label: "Conflict-Vulnerable Area (CVA)",
                mock: "conflictVulnerable",
                tooltip: "Communities near conflict-affected areas that are at risk of armed group activity, or that have resources (land, minerals, or symbolic value) that armed groups may find valuable.",
              },
            ],
          },
        ],
      },
      {
        id: "access",
        title: "Access & Transportation",
        subtitle: "Primary means of reaching the sitio",
        source: "DPWH Road Classification System",
        fields: [
          { label: "Main Access Type", type: "select", options: ["Paved road", "Unpaved road", "Footpath / trail", "Boat access", "Other"], mock: "mainAccess" },
          {
            label: "Most Common Mode of Transportation",
            type: "checklist",
            options: ["Bicycle", "Motorcycle", "Tricycle", "Four-Wheel Vehicle", "Boat"],
            mock: "transportModes",
          },
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
        source: "PSA CBMS – Household Profile Questionnaire (HPQ), RA 11315; NCMF / RA 11054 (Moro population); NCIP (Indigenous Peoples)",
        fields: [
          { label: "Total Population", type: "number", mock: "totalPop" },
          { label: "Male", type: "number", mock: "male" },
          { label: "Female", type: "number", mock: "female" },
          { label: "Age 0–14", type: "number", mock: "age0_14" },
          { label: "Age 15–64", type: "number", mock: "age15_64" },
          { label: "Age 65 and above", type: "number", mock: "age65up" },
          { label: "Total Households", type: "number", mock: "households" },
          { label: "Moro Population (count)", type: "number", mock: "moroPop" },
          { label: "Indigenous Peoples Population (count)", type: "number", mock: "ipPop" },
        ],
      },
      {
        id: "civil-reg-id",
        title: "Civil Registration and Identification",
        subtitle: "Registration, identification, and electoral registration gaps",
        source: "PSA Civil Registration and Vital Statistics; RA 11055 (PhilSys Act); COMELEC Voter Registration Records",
        fields: [
          { label: "Without Birth Certificate", type: "number", mock: "noBirthCert" },
          { label: "Without National ID (PhilSys)", type: "number", mock: "noNationalId" },
          { label: "Registered Voters", type: "number", mock: "registeredVoters" },
        ],
      },
      {
        id: "education-part",
        title: "Education Participation",
        subtitle: "School-age population and education access gaps",
        source: "PSA CBMS Core Indicator (e); DepEd Basic Education Information System (BEIS); PSA/FLEMMS Out-of-School Children and Youth (OSCY) definition",
        fields: [
          { label: "Currently Attending School", type: "number", mock: "currentlyAttending" },
          { label: "Out of School Children and Youth (OSCY)", type: "number", mock: "oscy" },
        ],
      },
      {
        id: "labor",
        title: "Labor & Employment",
        subtitle: "Working-age population and employment status",
        source: "PSA Labor Force Survey (LFS)",
        fields: [
          {
            label: "Labor Force Count (15+)",
            type: "number",
            mock: "laborForce",
            tooltip: "Total number of individuals aged 15 years and above who are either employed or unemployed but are actively looking for work.",
          },
          { label: "Age 15–24 (working)", type: "number", mock: "age15_24" },
          { label: "Age 25–54 (working)", type: "number", mock: "age25_54" },
          { label: "Age 55–64 (working)", type: "number", mock: "age55_64" },
          { label: "Age 65+ (still working)", type: "number", mock: "age65upWorking" },
          { label: "Estimated Unemployed Persons", type: "number", mock: "unemployed" },
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
        source: "RA 11223 (Universal Health Care Act); PhilHealth Membership Categories (Direct/Indirect Contributors); DSWD Pantawid Pamilyang Pilipino Program (4Ps)",
        fields: [
          {
            label: "PhilHealth Direct Contributors",
            type: "number",
            mock: "philhealthDirect",
            tooltip: "Members who personally pay their PhilHealth premiums, including employed individuals, self-employed workers, overseas Filipino workers (OFWs), and voluntary members.",
          },
          {
            label: "PhilHealth Indirect Contributors",
            type: "number",
            mock: "philhealthIndirect",
            tooltip: "Members whose PhilHealth premiums are subsidized or sponsored by the government or other entities, such as senior citizens, persons with disabilities (PWDs), indigent families, and other qualified beneficiaries.",
          },
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
        source: "PSA Labor Force Survey (LFS) – Class of Worker Classification",
        fields: [
          {
            label: "Private Household",
            type: "number",
            mock: "classPrivateHH",
            tooltip: "Individuals employed by private households to perform domestic or household services, such as housekeepers, maids, cooks, drivers, gardeners, and caregivers.",
          },
          {
            label: "Private Establishment",
            type: "number",
            mock: "classPrivateEst",
            tooltip: "Individuals employed by privately owned businesses, companies, corporations, or organizations.",
          },
          {
            label: "Government",
            type: "number",
            mock: "classGov",
            tooltip: "Individuals employed by national government agencies, local government units (LGUs), government-owned and controlled corporations (GOCCs), or other public sector institutions.",
          },
          { label: "Self-Employed", type: "number", mock: "classSelfEmployed" },
          { label: "Employer", type: "number", mock: "classEmployer" },
          { label: "OFW", type: "number", mock: "classOFW" },
          {
            label: "Wage and Salary Worker",
            type: "number",
            mock: "wageSalaryWorker",
            tooltip: "Individuals who work for an employer and receive regular wages or salaries in exchange for their services.",
          },
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
          { label: "Farmer Associations/Cooperatives Established", type: "number", mock: "farmerAssoc" },
          { label: "Estimated Total Farm Area (Hectares)", type: "number", mock: "farmArea" },
          {
            label: "Farmer Type Count",
            type: "count-breakdown",
            options: FARMER_TYPE_OPTIONS,
            mock: "farmerType",
          },
          {
            label: "Major Crops Produced",
            type: "select-tags",
            options: CROP_OPTIONS,
            addLabel: "Add Crop",
            searchPlaceholder: "Add/Search crop...",
            mock: "crops",
          },
        ],
      },
      {
        id: "aquaculture",
        title: "Aquaculture",
        subtitle: "Fishery and aquaculture activities",
        source: "BFAR FishR (Fisherfolk Registration System); RA 8550 (Philippine Fisheries Code of 1998); BFAR Aquaculture Production Classification; species list narrowed to BFAR/SEAFDEC-documented Lake Sebu & Banga (South Cotabato) freshwater aquaculture commodities",
        fields: [
          {
            label: "Number of Municipal Fisherfolk (capture fishing)",
            type: "number",
            mock: "fisherfolk",
            tooltip: "Total number of individuals engaged in small-scale or municipal fishing activities within inland or municipal waters.",
          },
          {
            label: "Number of Aquaculture Operators (fishpond/cage/pen owners)",
            type: "number",
            mock: "aquacultureOperators",
            tooltip: "Total number of individuals or entities engaged in aquaculture activities, such as fish, shrimp, shellfish, or seaweed farming.",
          },
          { label: "Fisherfolk Associations/Cooperatives Established", type: "number", mock: "fisherfolkAssoc" },
          { label: "Aquaculture Culture Systems Present", type: "checklist", options: ["Fishpond", "Fish cage", "Fish pen", "Rice-fish system", "None (capture fishing only)"], mock: "cultureSystems" },
          {
            label: "Major Aquaculture Products",
            type: "select-tags",
            options: AQUACULTURE_OPTIONS,
            addLabel: "Add Fish/Product",
            searchPlaceholder: "Add/Search fish or product...",
            mock: "aquacultureProducts",
          },
        ],
      },
      {
        id: "livestock",
        title: "Livestock & Poultry",
        subtitle: "Animals raised in the sitio",
        source: "Bureau of Animal Industry (BAI) – DA",
        fields: [
          {
            label: "Livestock / Poultry Types",
            type: "select-tags",
            options: LIVESTOCK_OPTIONS,
            addLabel: "Add Type",
            searchPlaceholder: "Add/Search livestock/poultry...",
            mock: "livestock",
          },
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
        subtitle: "Estimated counts by construction type and ownership type",
        source: "PSA CBMS Core Indicator – Housing",
        fields: [
          {
            label: "House Construction Type (Estimated Count)",
            type: "count-breakdown",
            options: ["Concrete", "Wood", "Half-concrete", "Makeshift", "Other"],
            mock: "houseTypeCounts",
          },
          {
            label: "Type of Ownership (Estimated Count)",
            type: "count-breakdown",
            options: ["Owned", "Rented", "Portion of land", "Informal settler", "Owner-constructed on other's lot"],
            mock: "ownershipCounts",
          },
        ],
      },
      {
        id: "water-san",
        title: "Water & Sanitation",
        subtitle: "Water source level and sanitation access",
        source: "PSA CBMS Core Indicator (d); DOH–LWUA Water Supply Classification; RA 9003 (Ecological Solid Waste Management Act)",
        fields: [
          {
            label: "Water Sources",
            subtitle: "Status of water sources by type",
            type: "water-source-table",
            options: [
              { label: "Natural", sublabel: "Spring/River/Well" },
              { label: "Level 1", sublabel: "Point source/Hand pump" },
              { label: "Level 2", sublabel: "Communal faucet" },
              { label: "Level 3", sublabel: "House connection" },
            ],
            mock: "waterSources",
          },
          { label: "Households without Toilet Facility", type: "number", mock: "noToilet" },
          {
            label: "Toilet Facility Type",
            type: "checklist",
            options: ["Open pit", "Closed pit", "Overhang / Drop type", "Water-sealed"],
            mock: "toiletType",
          },
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
        title: "Hazards & Risks",
        subtitle: "Identify natural hazards affecting the sitio",
        source: "NDRRMC; RA 10121 (Philippine DRRM Act)",
        fields: [
          {
            label: "Environmental Hazards Present",
            type: "hazard-grid",
            options: ["Flood", "Landslide", "Drought", "Earthquake", "Other"],
            mock: "hazards",
          },
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
    id: "images",
    label: "Photos & Images",
    icon: ImageIcon,
    accent: "#0EA5E9",
    categories: [
      {
        id: "sitio-photos",
        title: "Sitio Photos & Images",
        subtitle: "Add photos of the sitio community for documentation and reference",
        source: "Enumerator-collected field documentation — supplementary visual record, not a government statistical indicator",
        fields: [
          { label: "Sitio Photos", type: "image-upload", mock: "photos" },
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
            const existsYes = mv.exists === "Yes";
            return (
              <tr key={field.label}>
                <td className="ft-name-col">{field.rowLabel || field.label}</td>
                <td>
                  <select className={`input input-sm exists-select ${existsYes ? "exists-yes" : mv.exists === "No" ? "exists-no" : ""}`} defaultValue={mv.exists} key={`e-${mv.exists}`}>
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

/* ---------------------------------------------------------------
   COUNT-BREAKDOWN FIELD
   Used for Housing: instead of a single select ("what quality is
   THE house"), this collects an estimated count of households per
   category (construction type, or ownership type).
---------------------------------------------------------------- */
function CountBreakdownField({ field, mockMode, mockData, accent }) {
  const mockValue = field.mock ? mockData?.[field.mock] : undefined;
  const initial = mockMode && mockValue ? mockValue : {};

  return (
    <div className="field field-wide">
      <label className="field-label">
        {field.label}
        {field.tooltip && <InfoTooltip label={field.label} text={field.tooltip} accent={accent} />}
      </label>
      <table className="count-breakdown-table">
        <thead>
          <tr>
            <th className="ft-name-col">Category</th>
            <th>Estimated Count</th>
          </tr>
        </thead>
        <tbody>
          {field.options.map((opt) => (
            <tr key={opt}>
              <td className="ft-name-col">{opt}</td>
              <td>
                <input
                  className="input input-sm"
                  type="number"
                  placeholder="0"
                  defaultValue={initial[opt] || ""}
                  key={`${opt}-${initial[opt]}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------------------------------------
   WATER SOURCE TABLE
   Used for Water & Sanitation: instead of picking one "level" for
   the whole sitio, this tracks each water source type separately —
   whether it exists, and how many units are functioning vs. not.
---------------------------------------------------------------- */
function WaterSourceTable({ field, mockMode, mockData, accent }) {
  const mockValue = field.mock ? mockData?.[field.mock] : undefined;

  const buildInitial = () => {
    const initial = {};
    field.options.forEach((opt) => {
      const mv = mockMode && mockValue?.[opt.label]
        ? mockValue[opt.label]
        : { exists: "", functioning: "", notFunctioning: "" };
      initial[opt.label] = mv;
    });
    return initial;
  };

  const [rows, setRows] = useState(buildInitial);

  const updateRow = (label, key, value) => {
    setRows((prev) => ({ ...prev, [label]: { ...prev[label], [key]: value } }));
  };

  return (
    <div className="field field-wide">
      <table className="facility-table water-source-table">
        <thead>
          <tr>
            <th className="ft-name-col">Source Type</th>
            <th>Exists</th>
            <th>Functioning</th>
            <th>Not Functioning</th>
          </tr>
        </thead>
        <tbody>
          {field.options.map((opt) => {
            const row = rows[opt.label] || { exists: "", functioning: "", notFunctioning: "" };
            const exists = row.exists === "Yes";
            return (
              <tr key={opt.label}>
                <td className="ft-name-col">
                  <div className="wst-label">{opt.label}</div>
                  <div className="wst-sublabel">{opt.sublabel}</div>
                </td>
                <td>
                  <select
                    className={`input input-sm exists-select ${row.exists === "Yes" ? "exists-yes" : row.exists === "No" ? "exists-no" : ""}`}
                    value={row.exists}
                    onChange={(e) => updateRow(opt.label, "exists", e.target.value)}
                  >
                    <option value="">—</option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </td>
                <td>
                  {exists ? (
                    <input
                      className="input input-sm"
                      type="number"
                      placeholder="0"
                      value={row.functioning}
                      onChange={(e) => updateRow(opt.label, "functioning", e.target.value)}
                    />
                  ) : (
                    <span className="wst-dash">—</span>
                  )}
                </td>
                <td>
                  {exists ? (
                    <input
                      className="input input-sm"
                      type="number"
                      placeholder="0"
                      value={row.notFunctioning}
                      onChange={(e) => updateRow(opt.label, "notFunctioning", e.target.value)}
                    />
                  ) : (
                    <span className="wst-dash">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------------------------------------
   EXCLUSIVE TOGGLE PAIR
   Used for Conflict-Affected Area / Conflict-Vulnerable Area:
   two separate indicators, but only one (or neither) can be on
   at the same time since they are mutually exclusive.
---------------------------------------------------------------- */
function ExclusiveTogglePair({ field, mockMode, mockData, accent }) {
  const initialSelected = mockMode
    ? field.fields.find((f) => mockData?.[f.mock])?.mock || null
    : null;
  const [selected, setSelected] = useState(initialSelected);

  const handleToggle = (mockKey) => {
    setSelected((prev) => (prev === mockKey ? null : mockKey));
  };

  return (
    <div className="field field-wide exclusive-pair">
      {field.fields.map((f) => (
        <div className="field field-toggle" key={f.mock}>
          <span className="field-label">
            {f.label}
            {f.tooltip && <InfoTooltip label={f.label} text={f.tooltip} accent={accent} />}
          </span>
          <button
            type="button"
            className={`toggle ${selected === f.mock ? "toggle-on" : ""}`}
            onClick={() => handleToggle(f.mock)}
            aria-pressed={selected === f.mock}
          >
            <span className="toggle-knob" />
          </button>
        </div>
      ))}
      <div className="mutex-hint">Mutually exclusive — select one, or leave both off.</div>
    </div>
  );
}

/* ---------------------------------------------------------------
   HAZARD GRID
   Used for Safety & Risk → Environmental Hazards Present: each
   hazard is its own card with an icon and a "frequency in the
   past 12 months" input. A card lights up (accent border + fill)
   once a frequency greater than zero has been entered.
---------------------------------------------------------------- */
function HazardGrid({ field, mockMode, mockData, accent }) {
  const mockValue = field.mock ? mockData?.[field.mock] : undefined;

  const buildInitial = () => {
    const initial = {};
    field.options.forEach((opt) => {
      initial[opt] = mockMode && mockValue?.[opt] !== undefined ? mockValue[opt] : "";
    });
    return initial;
  };

  const [values, setValues] = useState(buildInitial);
  const setValue = (opt, val) => setValues((prev) => ({ ...prev, [opt]: val }));

  return (
    <div className="field field-wide">
      <label className="field-label">{field.label}</label>
      <div className="hazard-grid">
        {field.options.map((opt) => {
          const Icon = HAZARD_ICONS[opt] || HelpCircle;
          const val = values[opt];
          const active = val !== "" && Number(val) > 0;
          return (
            <div
              className={`hazard-card ${active ? "hazard-card-active" : ""}`}
              style={{ "--accent": accent }}
              key={opt}
            >
              <div className="hazard-card-top">
                <span className="hazard-icon">
                  <Icon size={16} />
                </span>
                <span className="hazard-name">{opt}</span>
                {active && (
                  <span className="hazard-check">
                    <Check size={12} />
                  </span>
                )}
              </div>
              <label className="hazard-sub">Frequency in past 12 months</label>
              <input
                className="input input-sm hazard-input"
                type="number"
                min="0"
                placeholder="0"
                value={val}
                onChange={(e) => setValue(opt, e.target.value)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   IMAGE UPLOAD FIELD
   Used for Photos & Images: a click/drag dropzone that reads
   files into memory (base64 preview) and shows them in a grid
   below, each removable. No data ever leaves the browser.
---------------------------------------------------------------- */
function ImageUploadField({ accent }) {
  const [images, setImages] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = (fileList) => {
    Array.from(fileList || []).forEach((file) => {
      if (!file.type || !file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [
          ...prev,
          { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, name: file.name, url: reader.result },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id) => setImages((prev) => prev.filter((img) => img.id !== id));

  return (
    <div className="field field-wide">
      <div
        className={`image-dropzone ${dragOver ? "image-dropzone-active" : ""}`}
        style={{ "--accent": accent }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="image-dropzone-icon">
          <ImagePlus size={22} />
        </div>
        <div className="image-dropzone-title">Drop images here or click to upload</div>
        <div className="image-dropzone-sub">Supports JPG, PNG, WebP up to 5MB each</div>
        <button
          type="button"
          className="image-browse-btn"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          <Upload size={14} /> Browse Files
        </button>
      </div>

      <div className="image-preview-panel">
        {images.length === 0 ? (
          <div className="image-empty">
            <div className="image-empty-icon">
              <ImageIcon size={20} />
            </div>
            <div className="image-empty-title">No images uploaded yet</div>
            <div className="image-empty-sub">Upload images to document the sitio community</div>
          </div>
        ) : (
          <div className="image-grid">
            {images.map((img) => (
              <div className="image-thumb" key={img.id}>
                <img src={img.url} alt={img.name} />
                <button
                  type="button"
                  className="image-remove-btn"
                  onClick={() => removeImage(img.id)}
                  aria-label={`Remove ${img.name}`}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   FIXED-LIST SELECT/TAGS FIELD
   Replaces free-text "tags" input for Crops, Livestock, and
   Aquaculture. Selected items render as removable rows; the
   "Add ___" button opens a searchable dropdown limited to the
   field's fixed option list (already-selected items are hidden).
---------------------------------------------------------------- */
function SelectTagsField({ field, mockMode, mockData }) {
  const mockValue = field.mock ? mockData?.[field.mock] : undefined;
  const initialItems = mockMode && Array.isArray(mockValue) ? mockValue : [];

  const [items, setItems] = useState(initialItems);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const remove = (item) => setItems(items.filter((i) => i !== item));
  const addItem = (opt) => {
    if (!items.includes(opt)) setItems([...items, opt]);
    setQuery("");
    setOpen(false);
  };

  const available = field.options.filter(
    (o) => !items.includes(o) && o.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="field field-wide" ref={wrapRef}>
      <label className="field-label">{field.label}</label>

      {items.length > 0 && (
        <div className="select-list">
          {items.map((item) => (
            <div className="select-row" key={item}>
              <span>{item}</span>
              <button type="button" onClick={() => remove(item)} aria-label={`Remove ${item}`}>
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="select-add-wrap">
        <button
          type="button"
          className="select-add-btn"
          onClick={() => setOpen((o) => !o)}
        >
          <Plus size={15} /> {field.addLabel || "Add"}
        </button>

        {open && (
          <div className="select-dropdown">
            <div className="select-search">
              <Search size={14} />
              <input
                autoFocus
                placeholder={field.searchPlaceholder || "Add/Search..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="select-options">
              {available.length === 0 ? (
                <div className="select-empty">No matches found</div>
              ) : (
                available.map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    className="select-option"
                    onClick={() => addItem(opt)}
                  >
                    {opt}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ field, mockMode, mockData, accent }) {
  const mockValue = field.mock ? mockData?.[field.mock] : undefined;

  if (field.type === "exclusive-toggle-pair") {
    return <ExclusiveTogglePair field={field} mockMode={mockMode} mockData={mockData} accent={accent} />;
  }

  if (field.type === "count-breakdown") {
    return <CountBreakdownField field={field} mockMode={mockMode} mockData={mockData} accent={accent} />;
  }

  if (field.type === "water-source-table") {
    return <WaterSourceTable field={field} mockMode={mockMode} mockData={mockData} accent={accent} />;
  }

  if (field.type === "hazard-grid") {
    return <HazardGrid field={field} mockMode={mockMode} mockData={mockData} accent={accent} />;
  }

  if (field.type === "image-upload") {
    return <ImageUploadField accent={accent} />;
  }

  if (field.type === "toggle") {
    const initial = mockMode && typeof mockValue === "boolean" ? mockValue : false;
    const [on, setOn] = useState(initial);
    return (
      <div className="field field-toggle">
        <span className="field-label">
          {field.label}
          {field.tooltip && <InfoTooltip label={field.label} text={field.tooltip} accent={accent} />}
        </span>
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
        <label className="field-label">
          {field.label}
          {field.tooltip && <InfoTooltip label={field.label} text={field.tooltip} accent={accent} />}
        </label>
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
        <label className="field-label">
          {field.label}
          {field.tooltip && <InfoTooltip label={field.label} text={field.tooltip} accent={accent} />}
        </label>
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

  if (field.type === "select-tags") {
    return <SelectTagsField field={field} mockMode={mockMode} mockData={mockData} />;
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
          <select className={`input input-sm exists-select ${mv.exists === "Yes" ? "exists-yes" : mv.exists === "No" ? "exists-no" : ""}`} defaultValue={mv.exists} key={`e-${mv.exists}`}>
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
      <label className="field-label">
        {field.label}
        {field.tooltip && <InfoTooltip label={field.label} text={field.tooltip} accent={accent} />}
      </label>
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

function CategoryCard({ category, accent, mockMode, mockData, pageId }) {
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
  const isInfra = pageId === "infra";
  const CategoryIcon = isInfra ? INFRA_CATEGORY_ICONS[category.id] : null;

  return (
    <div className={`category-card ${isInfra ? "category-card-infra" : ""}`} style={{ "--accent": accent }}>
      <button
        type="button"
        className="category-header"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="category-header-left">
          {CategoryIcon && (
            <span className="category-icon-badge">
              <CategoryIcon size={17} />
            </span>
          )}
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
              <Field field={item.field} mockMode={mockMode} mockData={mockData} accent={accent} key={`${mockMode}-${item.key}`} />
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   MAIN FORM (was `App`, renamed so App can handle routing instead)
---------------------------------------------------------------- */
function SitioForm() {
  const [activePage, setActivePage] = useState(PAGES[0].id);
  const [mockMode, setMockMode] = useState(true);
  const page = PAGES.find((p) => p.id === activePage);
  const pageIndex = PAGES.findIndex((p) => p.id === activePage);

  // Ref to the scrollable form panel on the right. Every time the active
  // page changes (Next / Previous buttons OR clicking a step in the
  // sidebar), we snap this panel back to the top so the person never has
  // to manually scroll up to see the new section's first question.
  const mainRef = useRef(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [activePage]);

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

      <main className="main-panel" ref={mainRef}>
        <header className={`main-header ${page.id === "infra" ? "main-header-infra" : ""}`}>
          <div className="main-header-icon" style={{ background: page.id === "infra" ? `linear-gradient(135deg, ${page.accent}, #FB923C)` : page.accent }}>
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

        <div className={`cards-stack ${page.id === "infra" ? "cards-stack-infra" : ""}`}>
          {page.categories.map((cat) => (
            <CategoryCard
              category={cat}
              accent={page.accent}
              mockMode={mockMode}
              mockData={MOCK_SITIO}
              pageId={page.id}
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

      {/* Floating nav button: jumps from the Form (this component) to the
          Sitio Filter dashboard (sitio.jsx). Fixed bottom-right so it
          stays visible no matter which page/section is active. */}
      <Link
        to="/sitio"
        className="floating-nav-btn"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "14px 22px",
          borderRadius: "999px",
          background: "#2563EB",
          color: "#fff",
          fontWeight: 700,
          fontSize: "13.5px",
          textDecoration: "none",
          boxShadow: "0 10px 24px rgba(37,99,235,0.35)",
        }}
      >
        <ListChecks size={16} /> Sitio Filter
      </Link>
    </div>
  );
}

/* ---------------------------------------------------------------
   APP — now just handles routing between the Form and the Sitio
   dashboard. Add more <Route> lines here later (e.g. /dashboard).
---------------------------------------------------------------- */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicPortal />} />
      <Route path="/form" element={<SitioForm />} />
      <Route path="/sitio" element={<Sitio />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

/* ---------------------------------------------------------------
   STYLES
---------------------------------------------------------------- */
const CSS = `
* { box-sizing: border-box; }
html, body, #root { height: 100%; }
.app-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #F4F6F9;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #1C2433;
}

/* SIDEBAR — fixed height, never scrolls. It stays put on screen while
   only the form panel on the right (.main-panel) scrolls independently. */
.sidebar {
  width: 252px;
  flex-shrink: 0;
  height: 100vh;
  overflow: hidden;
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

/* MAIN — this is the ONLY part of the app that scrolls. Fixed height
   matching the viewport, with its own independent scrollbar. */
.main-panel {
  flex: 1;
  height: 100vh;
  overflow-y: auto;
  padding: 28px 36px 60px;
  max-width: 980px;

  /* Hide scrollbar but keep scroll functionality */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}
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

/* Infrastructure page gets a subtle warm banner behind its header so the
   section reads distinctly from the others as soon as you land on it. */
.main-header-infra {
  background: linear-gradient(135deg, rgba(234,88,12,0.07), rgba(251,146,60,0.03));
  border: 1px solid rgba(234,88,12,0.14);
  border-radius: 16px;
  padding: 16px 18px;
  margin-bottom: 24px;
}
.main-header-infra .main-header-note { background: rgba(255,255,255,0.7); }

.cards-stack { display: flex; flex-direction: column; gap: 16px; }
.cards-stack-infra { gap: 18px; }

.category-card {
  background: #fff; border-radius: 14px; border: 1px solid #E5E9F0;
  border-left: 4px solid var(--accent);
  box-shadow: 0 1px 2px rgba(20,25,40,0.03);
}

/* Infrastructure cards get a little more visual weight: soft accent-tinted
   shadow, slightly larger radius, and a hover lift so the section doesn't
   read as flat rows of plain white boxes. */
.category-card-infra {
  border-radius: 16px;
  border-left-width: 5px;
  box-shadow: 0 2px 10px rgba(234,88,12,0.06), 0 1px 2px rgba(20,25,40,0.04);
  transition: box-shadow .2s ease, transform .2s ease;
}
.category-card-infra:hover {
  box-shadow: 0 6px 20px rgba(234,88,12,0.1), 0 1px 2px rgba(20,25,40,0.04);
  transform: translateY(-1px);
}

.category-header {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: 16px 18px; background: none; border: none; cursor: pointer; text-align: left;
  border-radius: 14px 14px 0 0;
}
.category-header-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.category-icon-badge {
  width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--accent) 12%, #fff);
  color: var(--accent);
}
.category-titles { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
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
  padding: 9px 8px; text-align: left; border-bottom: 1px solid #F0F2F6;
}
.facility-table th {
  font-size: 11.5px; font-weight: 700; color: #6B7280; text-transform: uppercase;
  letter-spacing: 0.03em; white-space: nowrap; position: relative;
}
.facility-table th .src-wrap { margin-left: 4px; vertical-align: middle; }
.facility-table .ft-name-col { width: 32%; font-weight: 600; color: #1C2433; text-transform: none; }
.facility-table td .input { width: 100%; }
.facility-table tbody tr:hover td { background: #FAFBFD; }
.facility-table tbody tr:last-child td { border-bottom: none; }

/* Colour-coded "Exists?" selects so a scan down the Infrastructure
   tables instantly shows what's present (green) vs. missing (red). */
.exists-select.exists-yes { border-color: #16A34A; background: #F0FDF4; color: #15803D; font-weight: 600; }
.exists-select.exists-no { border-color: #DC2626; background: #FEF2F2; color: #B91C1C; font-weight: 600; }

.count-breakdown-table {
  width: 100%; border-collapse: collapse; font-size: 12.5px; margin-top: 2px;
}
.count-breakdown-table th, .count-breakdown-table td {
  padding: 7px 8px; text-align: left; border-bottom: 1px solid #F0F2F6;
}
.count-breakdown-table th {
  font-size: 11.5px; font-weight: 700; color: #6B7280; text-transform: uppercase;
  letter-spacing: 0.03em; white-space: nowrap;
}
.count-breakdown-table .ft-name-col { width: 60%; font-weight: 600; color: #1C2433; text-transform: none; }
.count-breakdown-table td .input { width: 140px; }
.count-breakdown-table tbody tr:last-child td { border-bottom: none; }

.water-source-table th:not(.ft-name-col) { text-align: left; }
.wst-label { font-size: 13px; font-weight: 700; color: #1C2433; }
.wst-sublabel { font-size: 11px; color: #9AA2B3; font-weight: 400; margin-top: 1px; }
.wst-dash { color: #C7CCD8; font-size: 13px; }

.exclusive-pair { display: flex; flex-direction: column; gap: 4px; }
.mutex-hint { font-size: 11.5px; color: #9AA2B3; font-style: italic; margin-top: 2px; }

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

/* HAZARD GRID */
.hazard-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
}
.hazard-card {
  border: 1.5px solid #E5E9F0; border-radius: 14px; padding: 14px 16px;
  background: #fff; transition: border-color .15s ease, background .15s ease;
}
.hazard-card-active {
  border-color: var(--accent);
  background: linear-gradient(0deg, rgba(220,38,38,0.05), rgba(220,38,38,0.05));
}
.hazard-card-top { display: flex; align-items: center; gap: 9px; margin-bottom: 10px; }
.hazard-icon {
  width: 28px; height: 28px; border-radius: 9px; flex-shrink: 0;
  background: #F1F3F8; color: #6B7280;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s ease, color .15s ease;
}
.hazard-card-active .hazard-icon { background: var(--accent); color: #fff; }
.hazard-name { font-size: 13.5px; font-weight: 700; color: #1C2433; flex: 1; }
.hazard-check {
  width: 18px; height: 18px; border-radius: 50%; background: #16A34A; color: #fff;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.hazard-sub { display: block; font-size: 11px; color: #9AA2B3; margin-bottom: 6px; }
.hazard-input { width: 100%; }

/* IMAGE UPLOAD */
.image-dropzone {
  border: 1.5px dashed #C7CCD8; border-radius: 14px; background: #FAFBFD;
  padding: 34px 20px; text-align: center; cursor: pointer;
  transition: border-color .15s ease, background .15s ease;
}
.image-dropzone:hover, .image-dropzone-active { border-color: var(--accent); background: #fff; }
.image-dropzone-icon {
  width: 44px; height: 44px; border-radius: 12px; background: #EDF0F5; color: #6B7280;
  display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;
}
.image-dropzone-title { font-size: 14px; font-weight: 700; color: #1C2433; margin-bottom: 4px; }
.image-dropzone-sub { font-size: 12px; color: #9AA2B3; margin-bottom: 14px; }
.image-browse-btn {
  display: inline-flex; align-items: center; gap: 6px; border: 1px solid #DEE2EA;
  background: #fff; border-radius: 9px; padding: 8px 16px; font-size: 12.5px; font-weight: 700;
  color: #4B5468; cursor: pointer;
}
.image-browse-btn:hover { border-color: var(--accent); color: var(--accent); }

.image-preview-panel {
  margin-top: 14px; border: 1px solid #E5E9F0; border-radius: 14px; background: #fff; padding: 18px;
}
.image-empty { text-align: center; padding: 20px 10px; }
.image-empty-icon {
  width: 40px; height: 40px; border-radius: 50%; background: #F1F3F8; color: #9AA2B3;
  display: flex; align-items: center; justify-content: center; margin: 0 auto 10px;
}
.image-empty-title { font-size: 13px; font-weight: 700; color: #4B5468; margin-bottom: 2px; }
.image-empty-sub { font-size: 12px; color: #9AA2B3; }
.image-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.image-thumb {
  position: relative; border-radius: 10px; overflow: hidden; aspect-ratio: 1; background: #F1F3F8;
}
.image-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.image-remove-btn {
  position: absolute; top: 5px; right: 5px; width: 20px; height: 20px; border-radius: 50%;
  background: rgba(0,0,0,0.55); color: #fff; border: none; display: flex; align-items: center;
  justify-content: center; cursor: pointer;
}
.image-remove-btn:hover { background: rgba(220,38,38,0.85); }

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
  min-height: 28px; display: flex; align-items: flex-start; gap: 6px; line-height: 1.35;
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

/* SELECT-TAGS (fixed-list crops / livestock / aquaculture) */
.select-list {
  display: flex; flex-direction: column; border: 1px solid #E5E9F0;
  border-radius: 10px; overflow: hidden; background: #fff;
}
.select-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 13px; font-size: 13px; color: #1C2433; font-weight: 500;
  border-bottom: 1px solid #F0F2F6;
}
.select-row:last-child { border-bottom: none; }
.select-row button {
  border: none; background: none; cursor: pointer; color: #9AA2B3;
  display: flex; align-items: center; padding: 2px; border-radius: 6px;
}
.select-row button:hover { color: #DC2626; background: #FEF2F2; }

.select-add-wrap { position: relative; }
.select-add-btn {
  display: flex; align-items: center; gap: 6px;
  border: 1px solid #DEE2EA; background: #fff; border-radius: 9px;
  padding: 8px 14px; font-size: 12.5px; font-weight: 700; color: #4B5468; cursor: pointer;
}
.select-add-btn:hover { background: #F4F6FB; border-color: var(--accent, #6366F1); color: var(--accent, #6366F1); }

.select-dropdown {
  position: absolute; top: calc(100% + 6px); left: 0; z-index: 40;
  width: 280px; max-width: 90vw; background: #fff; border: 1px solid #E5E9F0;
  border-radius: 12px; box-shadow: 0 10px 30px rgba(20,25,40,0.12);
  overflow: hidden;
}
.select-search {
  display: flex; align-items: center; gap: 8px; padding: 10px 12px;
  border-bottom: 1px solid #F0F2F6; color: #9AA2B3;
}
.select-search input {
  border: none; outline: none; font-size: 13px; width: 100%;
  font-family: inherit; color: #1C2433; background: transparent;
}
.select-options { max-height: 220px; overflow-y: auto; padding: 4px; }
.select-option {
  display: block; width: 100%; text-align: left; border: none; background: none;
  padding: 9px 10px; font-size: 13px; color: #1C2433; cursor: pointer; border-radius: 8px;
  font-family: inherit;
}
.select-option:hover { background: #EFF3FF; color: #3B4FE0; }
.select-empty { padding: 14px 10px; font-size: 12.5px; color: #9AA2B3; text-align: center; }

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

/* Floating nav button hover state */
.floating-nav-btn:hover {
  filter: brightness(1.08);
}

/* On small screens, drop the fixed-height split-scroll layout in favor
   of normal page scrolling: the sidebar becomes a horizontal strip up
   top, and the whole page (not just .main-panel) scrolls vertically. */
@media (max-width: 860px) {
  .app-shell { flex-direction: column; height: auto; overflow: visible; }
  .sidebar { width: 100%; height: auto; overflow-x: auto; overflow-y: visible; flex-direction: row; }
  .main-panel { height: auto; overflow-y: visible; }
  .category-body { grid-template-columns: 1fr 1fr; }
  .main-header-note { display: none; }
  .image-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 560px) {
  .category-body { grid-template-columns: 1fr; }
  .hazard-grid { grid-template-columns: 1fr; }
  .image-grid { grid-template-columns: repeat(2, 1fr); }
}

.main-panel::-webkit-scrollbar { width: 0; height: 0; }
`;
