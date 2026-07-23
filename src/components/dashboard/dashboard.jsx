import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import TabIcon from './icons';
import AreaPanel from './area';
import DemographicsPanel from './demographics';
import LivelihoodPanel from './livelihood';
import SafetyPanel from './safety';
import InfrastructurePanel from './infrastructure';
import ActivityPanel from './activity';

/* =========================================================================
   CATCH-UP Data Bank - Dashboard (container)
   Holds the sidebar, header, filter row, and tab bar. Each tab's content
   lives in its own file and is swapped in here. Overview lives in this
   file and now runs off a generated province-wide mock dataset.
========================================================================= */

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'doc' },
  { id: 'area', label: 'Area', icon: 'pin' },
  { id: 'demographics', label: 'Demographics', icon: 'users' },
  { id: 'livelihood', label: 'Livelihood', icon: 'trend' },
  { id: 'infrastructure', label: 'Infrastructure', icon: 'building' },
  { id: 'safety', label: 'Safety', icon: 'shield' },
  { id: 'activity', label: 'Activity', icon: 'pulse', badge: 3 },
];

/* =========================================================================
   REAL ADMINISTRATIVE DATA — the 10 municipalities of South Cotabato
   (excluding Koronadal City) and their actual barangays, per PSA/PhilAtlas.
   Used to populate the Municipality / Barangay filters and as the frame
   the generated mock sitio data is built on top of.
========================================================================= */

export const MUNICIPALITY_BARANGAYS = {
  Banga: ['Benitez', 'Cabudian', 'Cabuling', 'Cinco', 'Derilon', 'El Nonok', 'Improgo Village', 'Kusan', 'Lam-apos', 'Lamba', 'Lambingi', 'Lampari', 'Liwanay', 'Malaya', 'Punong Grande', 'Rang-ay', 'Reyes', 'Rizal', 'Rizal Poblacion', 'San Jose', 'San Vicente', 'Yangco Poblacion'],
  'Lake Sebu': ['Bacdulong', 'Denlag', 'Halilan', 'Hanoon', 'Klubi', 'Lake Lahit', 'Lamcade', 'Lamdalag', 'Lamfugon', 'Lamlahak', 'Lower Maculan', 'Luhib', 'Ned', 'Poblacion', 'Siluton', 'Takunel', 'Talisay', 'Tasiman', 'Upper Maculan'],
  Norala: ['Benigno Aquino, Jr.', 'Dumaguil', 'Esperanza', 'Kibid', 'Lapuz', 'Liberty', 'Lopez Jaena', 'Matapol', 'Poblacion', 'Puti', 'San Jose', 'San Miguel', 'Simsiman', 'Tinago'],
  Polomolok: ['Bentung', 'Cannery Site', 'Crossing Palkan', 'Glamang', 'Kinilis', 'Klinan 6', 'Koronadal Proper', 'Lam-Caliaf', 'Landan', 'Lapu', 'Lumakil', 'Magsaysay', 'Maligo', 'Pagalungan', 'Palkan', 'Poblacion', 'Polo', 'Rubber', 'Silway 7', 'Silway 8', 'Sulit', 'Sumbakil', 'Upper Klinan'],
  'Santo Niño': ['Ambalgan', 'Guinsang-an', 'Katipunan', 'Manuel Roxas', 'Panay', 'Poblacion', 'Sajaneba', 'San Isidro', 'San Vicente', 'Teresita'],
  Surallah: ['Buenavista', 'Canahay', 'Centrala', 'Colongulo', 'Dajay', 'Duengas', 'Lambontong', 'Lamian', 'Lamsugod', 'Libertad', 'Little Baguio', 'Moloy', 'Naci', 'Talahik', 'Tubiala', 'Upper Sepaka', 'Veterans'],
  Tampakan: ['Albagan', 'Buto', 'Danlag', 'Kipalbig', 'Lambayong', 'Lampitak', 'Liberty', 'Maltana', 'Palo', 'Poblacion', 'Pula-bato', 'San Isidro', 'Santa Cruz', 'Tablu'],
  Tantangan: ['Bukay Pait', 'Cabuling', 'Dumadalig', 'Libas', 'Magon', 'Maibo', 'Mangilala', 'New Cuyapo', 'New Iloilo', 'New Lambunao', 'Poblacion', 'San Felipe', 'Tinongcop'],
  "T'Boli": ['Aflek', 'Afus', 'Basag', 'Datal Bob', 'Desawo', 'Dlanag', 'Edwards', 'Kematu', 'Laconon', 'Lambangan', 'Lambuling', 'Lamhako', 'Lamsalome', 'Lemsnolon', 'Maan', 'Malugong', 'Mongocayo', 'New Dumangas', 'Poblacion', 'Salacafe', 'Sinolon', "T'bolok", 'Talcon', 'Talufo', 'Tudok'],
  Tupi: ['Acmonan', 'Bololmala', 'Bunao', 'Cebuano', 'Crossing Rubber', 'Kablon', 'Kalkam', 'Linan', 'Lunen', 'Miasong', 'Palian', 'Poblacion', 'Polonuling', 'Simbo', 'Tubeng'],
};

export const MUNICIPALITIES = Object.keys(MUNICIPALITY_BARANGAYS);

/* Approximate municipality centroids for the Area tab's province map.
   Stylized/illustrative positions, not survey-grade GPS. */
export const MUNI_COORDS = {
  Banga: { lat: 6.4667, lng: 124.7667 },
  'Lake Sebu': { lat: 6.2333, lng: 124.6667 },
  Norala: { lat: 6.5333, lng: 124.6667 },
  Polomolok: { lat: 6.2167, lng: 125.0667 },
  'Santo Niño': { lat: 6.4667, lng: 124.6167 },
  Surallah: { lat: 6.3667, lng: 124.7667 },
  Tampakan: { lat: 6.4667, lng: 124.9167 },
  Tantangan: { lat: 6.5333, lng: 124.7333 },
  "T'Boli": { lat: 6.0980, lng: 124.6180 },
  Tupi: { lat: 6.3333, lng: 124.9500 },
};

/* ===== Section C (Livelihood) — option lists, in form order ===== */
export const CLASS_OF_WORKER_TYPES = [
  { key: 'privateHousehold', label: 'Private Household' },
  { key: 'privateEstablishment', label: 'Private Establishment' },
  { key: 'government', label: 'Government' },
  { key: 'selfEmployed', label: 'Self-Employed' },
  { key: 'employer', label: 'Employer' },
  { key: 'ofw', label: 'OFW' },
  { key: 'wageAndSalary', label: 'Wage & Salary Worker' },
];

export const SOURCE_OF_INCOME_TYPES = [
  { key: 'wages', label: 'Wages / Salaries' },
  { key: 'entrepreneurial', label: 'Entrepreneurial Activity' },
  { key: 'remittances', label: 'Remittances' },
  { key: 'pension', label: 'Pension' },
  { key: 'other', label: 'Other' },
];

export const FARMER_TYPES = [
  { key: 'farmOwner', label: 'Farm Owner' },
  { key: 'tenantFarmer', label: 'Tenant Farmer' },
  { key: 'smallholderFarmer', label: 'Smallholder Farmer' },
  { key: 'agriculturalWorker', label: 'Agricultural Worker/Laborer' },
  { key: 'livestockRaiser', label: 'Livestock Raiser' },
];

export const MAJOR_CROPS = [
  'Corn', 'Coconut', 'Sugarcane', 'Coffee', 'Cacao', 'Abaca', 'Sweet Potato',
  'Mango', 'Banana', 'Cassava', 'Vegetables', 'Palay (Rice)', 'Pineapple',
  'Rubber', 'Oil Palm',
];

export const AQUACULTURE_SYSTEMS = ['Fishpond', 'Fish cage', 'Fish pen', 'Rice-fish system'];
export const AQUACULTURE_PRODUCTS = ['Tilapia', 'Hito (Catfish)', 'Carp', 'Dalag (Mudfish)', 'Ulang (Giant Freshwater Prawn)'];
export const LIVESTOCK_TYPES = ['Pigs', 'Cows', 'Carabaos', 'Horses', 'Goats', 'Chickens', 'Ducks'];
export const BACKYARD_COMMODITIES = ['Vegetables', 'Root crops', 'Fruits'];

const MUNI_PROFILE = {
  Banga: { gida: 0.12, caa: 0.03, cva: 0.02, ip: 0.04, moro: 0.03 },
  'Lake Sebu': { gida: 0.48, caa: 0.05, cva: 0.04, ip: 0.58, moro: 0.01 },
  Norala: { gida: 0.10, caa: 0.02, cva: 0.01, ip: 0.03, moro: 0.05 },
  Polomolok: { gida: 0.16, caa: 0.04, cva: 0.02, ip: 0.12, moro: 0.02 },
  'Santo Niño': { gida: 0.10, caa: 0.02, cva: 0.01, ip: 0.03, moro: 0.02 },
  Surallah: { gida: 0.12, caa: 0.02, cva: 0.01, ip: 0.05, moro: 0.02 },
  Tampakan: { gida: 0.38, caa: 0.14, cva: 0.06, ip: 0.32, moro: 0.02 },
  Tantangan: { gida: 0.10, caa: 0.02, cva: 0.01, ip: 0.03, moro: 0.03 },
  "T'Boli": { gida: 0.52, caa: 0.06, cva: 0.04, ip: 0.62, moro: 0.01 },
  Tupi: { gida: 0.20, caa: 0.04, cva: 0.02, ip: 0.18, moro: 0.02 },
};

/* Municipality-level hazard profiles for Q56 (illustrative, not survey
   data). Each value is the base probability a sitio in that municipality
   reports any occurrence of that hazard in the past 12 months. */
const MUNI_HAZARD_PROFILE = {
  Banga: { flood: 0.35, landslide: 0.05, drought: 0.40, earthquake: 0.15 },
  'Lake Sebu': { flood: 0.10, landslide: 0.45, drought: 0.20, earthquake: 0.25 },
  Norala: { flood: 0.45, landslide: 0.02, drought: 0.50, earthquake: 0.10 },
  Polomolok: { flood: 0.20, landslide: 0.10, drought: 0.30, earthquake: 0.30 },
  'Santo Niño': { flood: 0.30, landslide: 0.03, drought: 0.45, earthquake: 0.10 },
  Surallah: { flood: 0.40, landslide: 0.06, drought: 0.35, earthquake: 0.12 },
  Tampakan: { flood: 0.15, landslide: 0.35, drought: 0.25, earthquake: 0.28 },
  Tantangan: { flood: 0.38, landslide: 0.03, drought: 0.42, earthquake: 0.10 },
  "T'Boli": { flood: 0.12, landslide: 0.48, drought: 0.22, earthquake: 0.26 },
  Tupi: { flood: 0.18, landslide: 0.15, drought: 0.28, earthquake: 0.32 },
};
/* Placeholder "official" master-list total for South Cotabato's sitios.
   Swap this for a real count (e.g. from a Provincial Planning / DILG
   sitio master list) once that data source is wired in — it drives the
   Survey Coverage KPI so the dashboard can show data completeness, not
   just raw record counts. */
const TOTAL_KNOWN_SITIOS = 2350;

/* Section C (Livelihood) — dominant income-source categories, collapsed
   from the form's "Class of worker" + "Source of income" fields into a
   single representative sector per sitio for summary purposes. */
const LIVELIHOOD_SECTORS = ['Agriculture', 'Aquaculture', 'Livestock', 'Wage & Salary', 'OFW Remittance', 'Entrepreneurial'];

/* Mock survey years for the Livelihood tab's income year filter. Real
   sitios are only ever surveyed on their actual staggered ~3-year cycle
   (see getSurveyYear() in livelihood.jsx) — this pool exists purely to
   give the generated mock dataset a believable spread across 2023-2026
   so the year filter has real (mock) data to show, instead of every
   sitio silently defaulting to the same one year. */
const SURVEY_YEARS = [2023, 2024, 2025, 2026];

/* Section G — Sitio Priority Needs interventions, in form order. */
const PRIORITY_INTERVENTIONS = [
  { key: 'water', label: 'Water system' },
  { key: 'cr', label: 'Community CR (comfort room)' },
  { key: 'solar', label: 'Solar street lights' },
  { key: 'road', label: 'Road opening / concreting' },
  { key: 'farmTools', label: 'Farm tools / garden support' },
  { key: 'health', label: 'Health services' },
  { key: 'education', label: 'Education / school support' },
];

/* Section G urgency scale (0-3), used to score each intervention per
   sitio. Colors + descriptions drive the stacked bar segments and their
   hover tooltips / legend in the Community Priority Needs card. */
const PRIORITY_LEVELS = [
  {
    score: 0,
    label: 'Not Needed',
    color: '#23c66c',
    description: 'This intervention is not needed because the situation is already adequate or is not a concern in the sitio.',
  },
  {
    score: 1,
    label: 'Needed',
    color: '#1e93e2',
    description: 'This intervention would improve the community, but it is a lower priority compared to other needs.',
  },
  {
    score: 2,
    label: 'Important',
    color: '#e9a42c',
    description: 'This intervention addresses a major need and should be included in the next planning or implementation cycle. Delaying it is acceptable for a short period, but it should not be overlooked.',
  },
  {
    score: 3,
    label: 'Very Urgent',
    color: '#e04439',
    description: 'This intervention addresses a critical need that requires immediate action. Delaying implementation could result in serious problems, increased risks, or significant hardship for the community.',
  },
];
/* Deterministic PRNG (mulberry32) so the "tons of sitios" dataset is huge
   and varied but stable across re-renders instead of reshuffling on every
   tab click. */
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260716);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
function pickUnique(arr, count) {
  const pool = [...arr];
  const out = [];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i += 1) {
    out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  }
  return out;
}

const SITIO_WORDS = [
  'Bagong Silang', 'Kalubihan', 'Malipayon', 'Kauswagan', 'Kahayag', 'Lambak', 'Kadayawan',
  'Tagumpay', 'Kapatagan', 'Kaunlaran', 'Nangka', 'Kalinaw', 'Bakhaw', 'Mabuhay', 'Ilaya',
  'Ibaba', 'Centro', 'Silangan', 'Kanluran', 'Malinawon', 'Kahilwayan', 'Kaligayahan', 'Tabuk',
  'Bantawan', 'Danao', 'Kamansi', 'Lunhaw', 'Marang', 'Tugpahan', 'Lantad', 'Kasilak',
  'Riverside', 'Sto. Rosario', 'Sta. Cruz', 'Bulak', 'San Roque', 'Maharlika', 'Kapayapaan',
  'Upper Purok', 'Lower Purok', 'Kaharianan',
];

function makeSitioName(usedNames) {
  let attempt = `Sitio ${pick(SITIO_WORDS)}`;
  let n = 1;
  let name = attempt;
  while (usedNames.has(name)) {
    n += 1;
    name = `${attempt} ${n}`;
  }
  usedNames.add(name);
  return name;
}

function slugify(...parts) {
  return parts.join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/* =========================================================================
   GENERATED MOCK SITIOS — 5 to 20 sitios per barangay, across all 172
   barangays in the 10 municipalities (roughly 2,000+ records). Field names
   follow the validated Sitio Profiling Form question numbers so this can
   be swapped for a real fetch later without touching the panel logic:

   gida                        -> Q5
   conflictClassification      -> Q6  ('CAA' | 'CVA' | 'Neither')
   populationMale/Female       -> Q9
   households                  -> Q11
   moroPopulation               -> Q12
   ipPopulation                 -> Q13
   oscyCount                   -> Q16 (Out of School Children and Youth)
   withoutBirthCert            -> Q14 (civil registration gap)
   withoutPhilsysId            -> Q14 (National ID gap)
   livelihoodSector            -> Q25/Q27 (dominant class of worker / income source)
   householdIncome             -> Q26 (average household income, monthly)
   hazards.flood/landslide/drought/earthquake/other -> Q56
   foodSecurity                -> Q57 ('secure' | 'seasonal' | 'chronic')
   dogCount                    -> Q58
   catCount                    -> Q59
   vaccinatedDogs               -> Q60
   vaccinatedCats               -> Q61
   priorityNeeds                -> Q62 (0-3 urgency per intervention)
   householdsWithElectricity   -> Q51
   householdsWithoutToilet     -> Q44
   householdsWithInternet      -> Q54
   mobileSignal                -> Q53
========================================================================= */

function generateSitios() {
  const sitios = [];
  MUNICIPALITIES.forEach((municipality) => {
    const profile = MUNI_PROFILE[municipality];
    MUNICIPALITY_BARANGAYS[municipality].forEach((barangay) => {
      const usedNames = new Set();
      const count = randInt(5, 20);
      for (let i = 0; i < count; i += 1) {
        const gida = rand() < profile.gida;
        const conflictRoll = rand();
        const conflictClassification =
          conflictRoll < profile.caa ? 'CAA' : conflictRoll < profile.caa + profile.cva ? 'CVA' : 'Neither';

        const households = Math.max(12, randInt(18, 140) - (gida ? randInt(0, 40) : 0));
        const hhSize = 4.2 + rand() * 1.6;
        const totalPop = Math.round(households * hhSize);
        const femaleShare = 0.46 + rand() * 0.08;
        const populationFemale = Math.round(totalPop * femaleShare);
        const populationMale = totalPop - populationFemale;

        const ipShare = Math.min(profile.ip * (0.4 + rand() * 1.3), 0.95);
        const ipPopulation = Math.round(totalPop * ipShare);
        const moroShare = Math.min(profile.moro * (0.3 + rand() * 1.4), 0.4);
        const moroPopulation = Math.round(totalPop * moroShare);

        const elecRate = gida ? 0.22 + rand() * 0.35 : 0.55 + rand() * 0.42;
        const householdsWithElectricity = Math.min(households, Math.round(households * elecRate));

        const toiletGapRate = gida ? 0.25 + rand() * 0.35 : 0.04 + rand() * 0.2;
        const householdsWithoutToilet = Math.min(households, Math.round(households * toiletGapRate));

        const internetRate = gida ? 0.01 + rand() * 0.08 : 0.14 + rand() * 0.46;
        const householdsWithInternet = Math.min(households, Math.round(households * internetRate));

        const signalPool = gida ? ['2G', '2G', '3G', '3G', '4G'] : ['3G', '4G', '4G', '5G', '5G'];
        const mobileSignal = pick(signalPool);

        /* --- Demographics gaps (Section B) --- */
        const oscyCount = Math.round(totalPop * (gida ? 0.35 + rand() * 0.35 : 0.20 + rand() * 0.30));
        const withoutBirthCert = Math.round(totalPop * (gida ? 0.40 + rand() * 0.35 : 0.20 + rand() * 0.35));
        const withoutPhilsysId = Math.round(totalPop * (gida ? 0.50 + rand() * 0.30 : 0.30 + rand() * 0.40));

        /* --- Age group breakdown (Q11) — 0-14 / 15-64 / 65+ --- */
        const ageChildShare = 0.30 + rand() * 0.10;
        const ageSeniorShare = 0.04 + rand() * 0.05;
        const populationChildren = Math.round(totalPop * ageChildShare);
        const populationSenior = Math.round(totalPop * ageSeniorShare);
        const populationWorkingAge = Math.max(0, totalPop - populationChildren - populationSenior);

        /* --- Education participation (Q16) — attendingSchool is on top
           of oscyCount above; both drawn from an independent school-age
           estimate so neither formula disturbs the Overview OSCY gauge. */
        const schoolAgePopulation = Math.round(totalPop * (0.30 + rand() * 0.06));
        const attendingSchool = Math.max(0, schoolAgePopulation - oscyCount);

        /* --- Labor force (Q18-20) --- */
        const laborForceParticipation = gida ? 0.55 + rand() * 0.15 : 0.62 + rand() * 0.18;
        const votingAgePopulation = populationWorkingAge + populationSenior; // proxy for 18+
        const laborForceCount = Math.round(votingAgePopulation * laborForceParticipation);
        const lf15to24Share = 0.22 + rand() * 0.08;
        const lf25to54Share = 0.52 + rand() * 0.08;
        const lf55to64Share = 0.14 + rand() * 0.06;
        const lfShareSum = lf15to24Share + lf25to54Share + lf55to64Share;
        const laborForce15to24 = Math.round(laborForceCount * (lf15to24Share / lfShareSum));
        const laborForce25to54 = Math.round(laborForceCount * (lf25to54Share / lfShareSum));
        const laborForce55to64 = Math.round(laborForceCount * (lf55to64Share / lfShareSum));
        const laborForce65plus = Math.max(
          0,
          laborForceCount - laborForce15to24 - laborForce25to54 - laborForce55to64
        );
        const unemploymentRate = gida ? 0.10 + rand() * 0.12 : 0.05 + rand() * 0.09;
        const unemployedCount = Math.round(laborForceCount * unemploymentRate);

        /* --- Registered voters (Q21) --- */
        const voterRegistrationRate = gida ? 0.55 + rand() * 0.2 : 0.68 + rand() * 0.22;
        const registeredVoters = Math.round(votingAgePopulation * voterRegistrationRate);

        /* --- Social welfare beneficiary sectors (Q22) --- */
        const welfareChildren = Math.round(populationChildren * (0.10 + rand() * 0.20));
        const welfareSeniors = Math.round(populationSenior * (0.35 + rand() * 0.35));
        const welfarePWD = Math.round(totalPop * (0.01 + rand() * 0.025));
        const welfareSoloParents = Math.round(households * (0.03 + rand() * 0.07));

        /* --- PhilHealth coverage (Q23-24) --- */
        const philhealthIndirectShare = gida ? 0.55 + rand() * 0.25 : 0.35 + rand() * 0.25;
        const philhealthCoverageRate = gida ? 0.45 + rand() * 0.3 : 0.6 + rand() * 0.3;
        const philhealthCovered = Math.round(households * philhealthCoverageRate);
        const philhealthIndirect = Math.round(philhealthCovered * philhealthIndirectShare);
        const philhealthDirect = Math.max(0, philhealthCovered - philhealthIndirect);

        /* --- 4Ps beneficiaries (Q25) --- */
        const fourPsRate = gida ? 0.30 + rand() * 0.30 : 0.12 + rand() * 0.20;
        const fourPsBeneficiaries = Math.round(households * fourPsRate);

        /* --- Livelihood (Section C) --- */
        const livelihoodSector = gida
          ? pick(['Agriculture', 'Agriculture', 'Livestock', 'Aquaculture', 'Wage & Salary'])
          : pick(['Wage & Salary', 'Agriculture', 'Entrepreneurial', 'OFW Remittance', 'Aquaculture']);
        const householdIncome = Math.round((gida ? 5500 + rand() * 4000 : 9000 + rand() * 9000) / 100) * 100;

        /* --- Class of worker (Q26) — distributes this sitio's labor force
           across PSA class-of-worker categories. GIDA sitios skew toward
           self-employment/general wage work; non-GIDA lowland sitios skew
           toward government and private-establishment employment. --- */
        const cowWeights = gida
          ? { privateHousehold: 0.04, privateEstablishment: 0.08, government: 0.04, selfEmployed: 0.34, employer: 0.03, ofw: 0.02, wageAndSalary: 0.45 }
          : { privateHousehold: 0.06, privateEstablishment: 0.22, government: 0.10, selfEmployed: 0.20, employer: 0.06, ofw: 0.05, wageAndSalary: 0.31 };
        const classOfWorker = {};
        let cowRemaining = laborForceCount;
        const cowKeys = Object.keys(cowWeights);
        cowKeys.forEach((key, idx) => {
          if (idx === cowKeys.length - 1) {
            classOfWorker[key] = Math.max(0, cowRemaining);
          } else {
            const val = Math.min(cowRemaining, Math.max(0, Math.round(laborForceCount * cowWeights[key] * (0.75 + rand() * 0.5))));
            classOfWorker[key] = val;
            cowRemaining -= val;
          }
        });

        /* --- Source of income (Q28) — % of households reporting each
           source; not mutually exclusive (checkbox field). --- */
        const sourceOfIncome = {
          wages: Math.round(households * (gida ? 0.35 + rand() * 0.25 : 0.55 + rand() * 0.3)),
          entrepreneurial: Math.round(households * (gida ? 0.10 + rand() * 0.15 : 0.20 + rand() * 0.2)),
          remittances: Math.round(households * (gida ? 0.04 + rand() * 0.08 : 0.10 + rand() * 0.15)),
          pension: Math.round(households * (0.03 + rand() * 0.07)),
          other: Math.round(households * (0.02 + rand() * 0.05)),
        };

        /* --- Agriculture (Q29-33) --- */
        const isAgriHeavy = livelihoodSector === 'Agriculture' || livelihoodSector === 'Livestock' || gida;
        const numFarmers = Math.round(households * (isAgriHeavy ? 0.35 + rand() * 0.35 : 0.05 + rand() * 0.15));
        const farmerTypeWeights = { farmOwner: 0.38, tenantFarmer: 0.22, smallholderFarmer: 0.24, agriculturalWorker: 0.11, livestockRaiser: 0.05 };
        const farmerTypeCounts = {};
        let farmerRemaining = numFarmers;
        const ftKeys = Object.keys(farmerTypeWeights);
        ftKeys.forEach((key, idx) => {
          if (idx === ftKeys.length - 1) {
            farmerTypeCounts[key] = Math.max(0, farmerRemaining);
          } else {
            const val = Math.min(farmerRemaining, Math.round(numFarmers * farmerTypeWeights[key] * (0.7 + rand() * 0.6)));
            farmerTypeCounts[key] = val;
            farmerRemaining -= val;
          }
        });
        const numFarmerAssociations = numFarmers > 15 ? randInt(0, 3) : randInt(0, 1);
        const farmAreaHectares = Number((numFarmers * (0.8 + rand() * 1.6)).toFixed(1));
        const majorCrops = numFarmers > 0 ? pickUnique(MAJOR_CROPS, randInt(2, 6)) : [];

        /* --- Aquaculture (Q34-38) — concentrated in Lake Sebu & Banga per
           BFAR/SEAFDEC-documented freshwater commodity zones. --- */
        const aquacultureEligible = municipality === 'Lake Sebu' || municipality === 'Banga';
        const hasAquaculture = aquacultureEligible && rand() < (municipality === 'Lake Sebu' ? 0.55 : 0.2);
        const numMunicipalFisherfolk = hasAquaculture ? randInt(3, 40) : (aquacultureEligible ? randInt(0, 4) : 0);
        const numAquacultureOperators = hasAquaculture ? randInt(1, 18) : 0;
        const numFisherfolkAssociations = hasAquaculture && numMunicipalFisherfolk > 10 ? randInt(1, 2) : 0;
        const cultureSystems = hasAquaculture ? pickUnique(AQUACULTURE_SYSTEMS, randInt(1, 3)) : [];
        const aquacultureProducts = hasAquaculture ? pickUnique(AQUACULTURE_PRODUCTS, randInt(1, 3)) : [];

        /* --- Livestock & Poultry (Q39) --- */
        const livestockRaised = pickUnique(LIVESTOCK_TYPES, gida ? randInt(3, 7) : randInt(2, 5));

        /* --- Backyard food production (Q40-41) --- */
        const backyardGardenRate = gida ? 0.30 + rand() * 0.35 : 0.15 + rand() * 0.3;
        const householdsWithBackyardGarden = Math.min(households, Math.round(households * backyardGardenRate));
        const backyardCommodities = householdsWithBackyardGarden > 0 ? pickUnique(BACKYARD_COMMODITIES, randInt(1, 3)) : [];

        /* --- Safety (Section E) --- */
        const foodRoll = rand();
        const foodSecurity = gida
          ? (foodRoll < 0.35 ? 'chronic' : foodRoll < 0.75 ? 'seasonal' : 'secure')
          : (foodRoll < 0.08 ? 'chronic' : foodRoll < 0.32 ? 'seasonal' : 'secure');

        /* Q56 — Environmental hazards, frequency of occurrence (times in
           the past 12 months) per hazard type. GIDA sitios run somewhat
           higher across the board; "Other" is a rare catch-all. */
        const hazardProfile = MUNI_HAZARD_PROFILE[municipality];
        const hazardGidaMult = gida ? 1.5 : 1;
        const rollHazard = (baseProb) => {
          const occurs = rand() < Math.min(0.9, baseProb * hazardGidaMult);
          if (!occurs) return 0;
          return randInt(1, baseProb > 0.3 ? 6 : 3);
        };
        const hazards = {
          flood: rollHazard(hazardProfile.flood),
          landslide: rollHazard(hazardProfile.landslide),
          drought: rollHazard(hazardProfile.drought),
          earthquake: rollHazard(hazardProfile.earthquake),
          other: rand() < 0.06 ? randInt(1, 2) : 0,
        };
        const hazardExposed = Object.values(hazards).some((v) => v > 0);

        /* Q58-61 — Animal population & rabies vaccination coverage.
           Vaccination rates run lower in GIDA sitios (harder vet access). */
        const dogCount = Math.max(0, Math.round(households * (0.5 + rand() * 0.9)));
        const catCount = Math.max(0, Math.round(households * (0.25 + rand() * 0.6)));
        const dogVaccinationRate = gida ? 0.12 + rand() * 0.28 : 0.35 + rand() * 0.45;
        const catVaccinationRate = gida ? 0.08 + rand() * 0.22 : 0.25 + rand() * 0.4;
        const vaccinatedDogs = Math.min(dogCount, Math.round(dogCount * dogVaccinationRate));
        const vaccinatedCats = Math.min(catCount, Math.round(catCount * catVaccinationRate));

        /* --- Priority Needs (Section G) — 0 Not needed / 1 Needed /
           2 Important / 3 Very urgent, biased by GIDA status and by
           whichever infra gaps this sitio actually has. */
        const priorityNeeds = {};
        PRIORITY_INTERVENTIONS.forEach(({ key }) => {
          let base = gida ? 1.6 : 0.9;
          if (key === 'water' && households && householdsWithoutToilet / households > 0.2) base += 0.6;
          if (key === 'road' && gida) base += 0.5;
          if (key === 'health' && gida) base += 0.3;
          const roll = rand();
          priorityNeeds[key] = Math.max(0, Math.min(3, Math.round(base + (roll - 0.5) * 2.4)));
        });

        /* --- Area / Access (Section A) --- */
        const gpsLatitude = Number((MUNI_COORDS[municipality].lat + (rand() - 0.5) * 0.12).toFixed(5));
        const gpsLongitude = Number((MUNI_COORDS[municipality].lng + (rand() - 0.5) * 0.12).toFixed(5));

        const accessPool = gida
          ? ['Unpaved road', 'Unpaved road', 'Footpath / trail', 'Footpath / trail', 'Boat access', 'Paved road']
          : ['Paved road', 'Paved road', 'Paved road', 'Unpaved road', 'Unpaved road', 'Footpath / trail'];
        const mainAccessType =
          municipality === 'Lake Sebu' && rand() < 0.18 ? 'Boat access' : pick(accessPool);

        const transportPool =
          mainAccessType === 'Boat access'
            ? ['Boat', 'Motorcycle', 'Tricycle']
            : gida
            ? ['Motorcycle', 'Tricycle', 'Bicycle', 'Four-Wheel Vehicle']
            : ['Tricycle', 'Motorcycle', 'Four-Wheel Vehicle', 'Bicycle'];
        const transportModes = pickUnique(transportPool, gida ? randInt(1, 2) : randInt(1, 3));

        /* Mock survey year — simulates the staggered ~3-year survey
           cycle by assigning each sitio one year from SURVEY_YEARS. For
           Tantangan and Lake Sebu, we intentionally keep the mock records
           in 2023–2025 so the livelihood year filter shows data for those
           municipalities in the requested range. */
        const usesFixedLivelihoodYears = municipality === 'Tantangan' || municipality === 'Lake Sebu';
        const surveyYear = usesFixedLivelihoodYears
          ? [2023, 2024, 2025][i % 3]
          : pick(SURVEY_YEARS);

        sitios.push({
          id: slugify(municipality, barangay, String(i + 1)),
          municipality,
          surveyYear,
          barangay,
          sitioName: makeSitioName(usedNames),
          gida,
          conflictClassification,
          populationMale,
          populationFemale,
          households,
          moroPopulation,
          ipPopulation,
          householdsWithElectricity,
          householdsWithoutToilet,
          householdsWithInternet,
          mobileSignal,
          oscyCount,
          withoutBirthCert,
          withoutPhilsysId,
          populationChildren,
          populationSenior,
          populationWorkingAge,
          schoolAgePopulation,
          attendingSchool,
          votingAgePopulation,
          laborForceCount,
          laborForce15to24,
          laborForce25to54,
          laborForce55to64,
          laborForce65plus,
          unemployedCount,
          registeredVoters,
          welfareChildren,
          welfareSeniors,
          welfarePWD,
          welfareSoloParents,
          philhealthDirect,
          philhealthIndirect,
          fourPsBeneficiaries,
          livelihoodSector,
          householdIncome,
          classOfWorker,
          sourceOfIncome,
          numFarmers,
          farmerTypeCounts,
          numFarmerAssociations,
          farmAreaHectares,
          majorCrops,
          numMunicipalFisherfolk,
          numAquacultureOperators,
          numFisherfolkAssociations,
          cultureSystems,
          aquacultureProducts,
          livestockRaised,
          householdsWithBackyardGarden,
          backyardCommodities,
          foodSecurity,
          hazardExposed,
          hazards,
          dogCount,
          catCount,
          vaccinatedDogs,
          vaccinatedCats,
          priorityNeeds,
          gpsLatitude,
          gpsLongitude,
          mainAccessType,
          transportModes,
        });
      }
    });
  });
  return sitios;
}

const ALL_SITIOS = generateSitios();

/* IP-area classification threshold: a sitio counts as an "Indigenous
   Community" area if IP population is >10% of total population. This is
   a derived flag (the form only gives a raw IP population count in Q13,
   not a yes/no area flag) — adjust here if your team defines it differently. */
const IP_AREA_THRESHOLD = 0.10;

export function pct(numerator, denominator) {
  if (!denominator) return 0;
  return (numerator / denominator) * 100;
}

function useOverviewStats(sitios) {
  return useMemo(() => {
    const totalSitios = sitios.length;

    const totalPopulation = sitios.reduce(
      (sum, s) => sum + (s.populationMale || 0) + (s.populationFemale || 0),
      0
    );
    const totalMale = sitios.reduce((sum, s) => sum + (s.populationMale || 0), 0);
    const totalFemale = sitios.reduce((sum, s) => sum + (s.populationFemale || 0), 0);
    const totalHouseholds = sitios.reduce((sum, s) => sum + (s.households || 0), 0);
    const avgPerHousehold = totalHouseholds ? totalPopulation / totalHouseholds : 0;
    const avgHouseholdsPerSitio = totalSitios ? totalHouseholds / totalSitios : 0;
    const avgPopulationPerSitio = totalSitios ? totalPopulation / totalSitios : 0;

    const municipalities = new Set(sitios.map((s) => s.municipality)).size;
    const barangays = new Set(sitios.map((s) => `${s.municipality}|${s.barangay}`)).size;
    const province = sitios[0]?.province || 'South Cotabato';

    const householdsWithElectricity = sitios.reduce(
      (sum, s) => sum + (s.householdsWithElectricity || 0),
      0
    );
    const householdsWithToilet = sitios.reduce(
      (sum, s) => sum + Math.max((s.households || 0) - (s.householdsWithoutToilet || 0), 0),
      0
    );
    const householdsWithInternet = sitios.reduce(
      (sum, s) => sum + (s.householdsWithInternet || 0),
      0
    );

    const electricityPct = pct(householdsWithElectricity, totalHouseholds);
    const sanitationPct = pct(householdsWithToilet, totalHouseholds);
    const internetPct = pct(householdsWithInternet, totalHouseholds);
    const strongSignalCount = sitios.filter(
      (s) => s.mobileSignal === '4G' || s.mobileSignal === '5G'
    ).length;
    const signalCoveragePct = pct(strongSignalCount, totalSitios);

    const gidaCount = sitios.filter((s) => s.gida).length;
    const ipAreaCount = sitios.filter(
      (s) =>
        pct(s.ipPopulation, (s.populationMale || 0) + (s.populationFemale || 0)) >
        IP_AREA_THRESHOLD * 100
    ).length;
    const conflictAffectedCount = sitios.filter((s) => s.conflictClassification === 'CAA').length;
    const classificationTotal = gidaCount + ipAreaCount + conflictAffectedCount;

    const municipalityCounts = {};
    sitios.forEach((s) => {
      municipalityCounts[s.municipality] = (municipalityCounts[s.municipality] || 0) + 1;
    });
    const sitiosByMunicipality = Object.entries(municipalityCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    /* --- Demographics (Section B) rollups --- */
    const totalOSCY = sitios.reduce((sum, s) => sum + (s.oscyCount || 0), 0);
    const totalWithoutBirthCert = sitios.reduce((sum, s) => sum + (s.withoutBirthCert || 0), 0);
    const totalWithoutPhilsysId = sitios.reduce((sum, s) => sum + (s.withoutPhilsysId || 0), 0);
    const withoutBirthCertPct = pct(totalWithoutBirthCert, totalPopulation);
    const withoutPhilsysPct = pct(totalWithoutPhilsysId, totalPopulation);

    /* --- Livelihood (Section C) rollups --- */
    const avgHouseholdIncome = totalSitios
      ? sitios.reduce((sum, s) => sum + (s.householdIncome || 0), 0) / totalSitios
      : 0;
    const sectorCounts = {};
    sitios.forEach((s) => {
      sectorCounts[s.livelihoodSector] = (sectorCounts[s.livelihoodSector] || 0) + 1;
    });
    const sortedSectors = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1]);
    const dominantSector = sortedSectors[0]?.[0] || '—';
    const dominantSectorCount = sortedSectors[0]?.[1] || 0;
    const dominantSectorPct = pct(dominantSectorCount, totalSitios);

    /* --- Safety (Section E) rollups --- */
    const foodCounts = { secure: 0, seasonal: 0, chronic: 0 };
    sitios.forEach((s) => {
      if (foodCounts[s.foodSecurity] !== undefined) foodCounts[s.foodSecurity] += 1;
    });
    const foodSecurePct = pct(foodCounts.secure, totalSitios);
    const foodSeasonalPct = pct(foodCounts.seasonal, totalSitios);
    const foodChronicPct = pct(foodCounts.chronic, totalSitios);
    const hazardExposedCount = sitios.filter((s) => s.hazardExposed).length;
    const hazardExposedPct = pct(hazardExposedCount, totalSitios);

    /* --- Survey coverage against the province-wide known-sitio baseline --- */
    const coveragePct = pct(totalSitios, TOTAL_KNOWN_SITIOS);

    return {
      totalSitios,
      totalPopulation,
      totalMale,
      totalFemale,
      totalHouseholds,
      avgPerHousehold,
      avgHouseholdsPerSitio,
      avgPopulationPerSitio,
      municipalities,
      barangays,
      province,
      householdsWithElectricity,
      householdsWithToilet,
      householdsWithInternet,
      electricityPct,
      sanitationPct,
      internetPct,
      strongSignalCount,
      signalCoveragePct,
      gidaCount,
      ipAreaCount,
      conflictAffectedCount,
      classificationTotal,
      sitiosByMunicipality,
      totalOSCY,
      totalWithoutBirthCert,
      totalWithoutPhilsysId,
      withoutBirthCertPct,
      withoutPhilsysPct,
      avgHouseholdIncome,
      dominantSector,
      dominantSectorCount,
      dominantSectorPct,
      foodSecurePct,
      foodSeasonalPct,
      foodChronicPct,
      hazardExposedPct,
      coveragePct,
    };
  }, [sitios]);
}

/* ===== Animated primitives — the "life" layer ===== */

export function useInView(delay = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30 + delay);
    return () => clearTimeout(t);
  }, [delay]);
  return visible;
}

export function CountUp({ value, decimals = 0, duration = 1000, suffix = '', prefix = '' }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = value || 0;
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => raf.current && cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);
  return (
    <>
      {prefix}
      {display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </>
  );
}

/* Small tooltip used for the trend badges and info dots. Native-title free
   so it can be styled consistently with the rest of the dashboard. */
export function InfoTooltip({ children, text, trigger = 'hover' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isClickTrigger = trigger === 'click';

  useEffect(() => {
    if (!open || !isClickTrigger) return undefined;
    const handleOutsideClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open, isClickTrigger]);

  return (
    <span
      className={`tooltipWrap${isClickTrigger ? ' clickTooltip' : ''}${open ? ' open' : ''}`}
      tabIndex={0}
      ref={ref}
      role={isClickTrigger ? 'button' : undefined}
      aria-expanded={isClickTrigger ? open : undefined}
      onClick={isClickTrigger ? () => setOpen((value) => !value) : undefined}
      onKeyDown={isClickTrigger ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setOpen((value) => !value);
        }
      } : undefined}
    >
      {children}
      <span className="tooltipBubble">{text}</span>
    </span>
  );
}

/* Larger, card-level tooltip anchored to the top-right corner of its
   parent card (parent must be position:relative). Used where a KPI needs
   more explanation than the inline InfoTooltip comfortably fits. */
export function CornerTooltip({ title, text, linkHref, linkLabel, links, whyTitle, whyText, whyLinkHref, whyLinkLabel, whyLinks, pages, trigger = 'hover' }) {
  const [open, setOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const ref = useRef(null);
  const tooltipId = useRef(`corner-tooltip-${Math.random().toString(36).slice(2, 10)}`);
  const isClickTrigger = trigger === 'click';

  const closeTooltip = () => {
    setOpen(false);
    setPageIndex(0);
  };

  const toggleTooltip = (e) => {
    e.stopPropagation();
    setOpen((o) => {
      const next = !o;
      if (next && typeof window !== 'undefined' && isClickTrigger) {
        window.dispatchEvent(new CustomEvent('corner-tooltip-open', { detail: tooltipId.current }));
      }
      return next;
    });
  };

  // Click-to-toggle + outside-click-to-close stays in as a touch/keyboard
  // fallback. Hover is only used when the trigger is set to hover.
  useEffect(() => {
    if (!open || !isClickTrigger) return;
    function handleOutsideClick(e) {
      if (ref.current && !ref.current.contains(e.target)) closeTooltip();
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isClickTrigger]);

  useEffect(() => {
    if (!isClickTrigger || typeof window === 'undefined') return;
    function handleOtherTooltipOpen(event) {
      if (event.detail && event.detail !== tooltipId.current) {
        closeTooltip();
      }
    }
    window.addEventListener('corner-tooltip-open', handleOtherTooltipOpen);
    return () => window.removeEventListener('corner-tooltip-open', handleOtherTooltipOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClickTrigger]);

  const sourceLinks = links || (linkHref ? [{ href: linkHref, label: linkLabel || 'View source document' }] : []);
  const defaultPages = [{ title: title || 'Source', text, links: sourceLinks }];
  if (whyText) {
    const whyPageLinks = whyLinks || (whyLinkHref ? [{ href: whyLinkHref, label: whyLinkLabel || 'View source document' }] : []);
    defaultPages.push({ title: whyTitle || 'Why This Chart', text: whyText, links: whyPageLinks });
  }
  const tooltipPages = pages && pages.length ? pages : defaultPages;
  const activePage = tooltipPages[Math.min(pageIndex, tooltipPages.length - 1)];
  const hasMultiplePages = tooltipPages.length > 1;
  const isLastPage = pageIndex === tooltipPages.length - 1;

  return (
    <span
      className={`cornerTooltipWrap${open ? ' open' : ''}`}
      tabIndex={0}
      ref={ref}
      onMouseEnter={isClickTrigger ? undefined : () => setOpen(true)}
      onMouseLeave={isClickTrigger ? undefined : closeTooltip}
      onFocus={isClickTrigger ? undefined : () => setOpen(true)}
      onBlur={isClickTrigger ? undefined : closeTooltip}
    >
      <span
        className="infoDotMark cornerInfoDot"
        onClick={toggleTooltip}
      >
        ?
      </span>
      <span className="cornerTooltipBubble">
        <span className="cornerTooltipTitle">{activePage.title}</span>
        <span className="cornerTooltipText">{activePage.text}</span>
        {activePage.links && activePage.links.length ? (
          <span className="cornerTooltipLinks">
            {activePage.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="cornerTooltipLink"
                onClick={(e) => e.stopPropagation()}
              >
                {l.label}
              </a>
            ))}
          </span>
        ) : null}
        {hasMultiplePages ? (
          <span className="cornerTooltipFooter">
            <span className="cornerTooltipDots">
              {tooltipPages.map((_, i) => (
                <span key={i} className={`cornerTooltipDot${i === pageIndex ? ' active' : ''}`} />
              ))}
            </span>
            <button
              type="button"
              className="cornerTooltipNextBtn"
              onClick={(e) => {
              e.stopPropagation();
                setPageIndex((p) => (p + 1) % tooltipPages.length);
              }}
            >
              {isLastPage ? 'Back to source' : 'Next'} <span aria-hidden="true">&rarr;</span>
            </button>
          </span>
        ) : null}
      </span>
    </span>
  );
}
/* Per-segment hover tooltip for stacked bar / graph elements (bar chart
   rows, and each individual color segment inside the gender-split and
   food-security bars). This wraps just ONE colored segment so hovering
   that segment shows only its own value — not the whole bar's combined
   figures. Pass `style` to control the wrapper's own width/flex sizing
   when it's used as a flex child (e.g. one slice of a stacked bar). */
export function BarTooltip({ children, text, style, trigger = 'hover' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Click-outside-to-close only matters for click-triggered tooltips —
  // hover ones close on mouse-leave/blur instead.
  useEffect(() => {
    if (trigger !== 'click' || !open) return;
    function handleOutsideClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open, trigger]);

  const interactionProps =
    trigger === 'click'
      ? {
          onClick: (e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          },
        }
      : {
          onMouseEnter: () => setOpen(true),
          onMouseLeave: () => setOpen(false),
          onFocus: () => setOpen(true),
          onBlur: () => setOpen(false),
        };

  return (
    <span
      className={`barTooltipWrap${open ? ' open' : ''}`}
      style={style}
      tabIndex={0}
      ref={ref}
      {...interactionProps}
    >
      {children}
      <span className="barTooltipBubble">{text}</span>
    </span>
  );
}

export function TrendBadge({ delta }) {
  if (delta === undefined || delta === null) return null;
  const up = delta >= 0;
  return (
    <InfoTooltip text={`${up ? 'Up' : 'Down'} compared to the previous data collection recorded for these sitios.`}>
      <span className={`trendBadge ${up ? 'up' : 'down'}`}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          {up ? <path d="M4 17 L12 8 L20 17" /> : <path d="M4 8 L12 17 L20 8" />}
        </svg>
        {Math.abs(delta).toFixed(1)}%
      </span>
    </InfoTooltip>
  );
}

function InfoDot() {
  return <span className="infoDotMark">?</span>;
}

export function StatCard({ icon, iconBg, iconColor, label, value, decimals = 0, suffix = '', sub, delta, index = 0, tooltip, cornerTooltip, cornerTooltipTrigger = 'hover' }) {
  const visible = useInView(index * 70);
  return (
    <div className={`statCard${visible ? ' in' : ''}`} style={{ transitionDelay: `${index * 60}ms` }}>
      {(cornerTooltip || delta !== undefined) ? (
        <div className="statCardCornerRow">
          {delta !== undefined ? <TrendBadge delta={delta} /> : null}
          {cornerTooltip ? (
            <CornerTooltip
              title={cornerTooltip.title}
              text={cornerTooltip.text}
              linkHref={cornerTooltip.linkHref}
              linkLabel={cornerTooltip.linkLabel}
              whyTitle={cornerTooltip.whyTitle}
              whyText={cornerTooltip.whyText}
              whyLinkHref={cornerTooltip.whyLinkHref}
              whyLinkLabel={cornerTooltip.whyLinkLabel}
              trigger={cornerTooltipTrigger}
            />
          ) : null}
        </div>
      ) : null}
      <div className="statCardTop">
        <div className="statCardIcon" style={{ background: iconBg, color: iconColor }}>
          <TabIcon name={icon} />
        </div>
      </div>
      <div className="statCardLabel">
        {label}
        {tooltip ? (
          <InfoTooltip text={tooltip}>
            <span className="infoDot"><InfoDot /></span>
          </InfoTooltip>
        ) : null}
      </div>
      <div className="statCardValue">
        <CountUp value={value} decimals={decimals} suffix={suffix} />
      </div>
      {sub ? <div className="statCardSub">{sub}</div> : null}
    </div>
  );
}

function ProgressRing({ pctValue, colorFrom, colorTo, size = 88, stroke = 10, gradientId }) {
  const visible = useInView(150);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pctValue));
  const offset = c - (visible ? clamped / 100 : 0) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="progressRing">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colorFrom} />
          <stop offset="100%" stopColor={colorTo} />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(20,21,26,0.07)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="progressRingFill"
      />
    </svg>
  );
}

function UtilityCard({ tone, icon, colorFrom, colorTo, label, value, sub, delta, index = 0 }) {
  const visible = useInView(index * 80 + 100);
  return (
    <div className={`utilityCard tone-${tone}${visible ? ' in' : ''}`} style={{ transitionDelay: `${index * 70}ms` }}>
      {delta !== undefined ? <div className="utilityCardTrend"><TrendBadge delta={delta} /></div> : null}
      <div className="utilityRingWrap">
        <ProgressRing pctValue={value} colorFrom={colorFrom} colorTo={colorTo} gradientId={`ring-${tone}`} />
        <div className="utilityRingCenter">
          <TabIcon name={icon} />
        </div>
      </div>
      <div className="utilityCardText">
        <div className="utilityCardLabelRow">
          <div className="utilityCardLabel">{label}</div>
        </div>
        <div className="utilityCardValue">{value.toFixed(1)}%</div>
        <div className="utilityCardSub">{sub}</div>
      </div>
    </div>
  );
}
/* ===== Half-gauge chart — used by the Demographics Snapshot cards.
   Draws a semicircular arc (0 -> max) filled proportionally to `value`,
   with the raw/percent figure in the center and min/max labels at the
   ends of the arc, matching the reference gauge-chart style. Scales
   fluidly with its container (viewBox + width:100%) and shows a hover
   tooltip on the arc itself (track or fill) with the exact underlying
   figure. ===== */
export function GaugeChart({ value, max = 25, label, sublabel, colorFrom, colorTo, gradientId, valueDisplay, minLabel, maxLabel, index = 0, hoverText, delta }) {
  const visible = useInView(index * 90 + 150);
  const [hovered, setHovered] = useState(false);
  const size = 180;
  const stroke = 16;
  const cx = size / 2;
  const cy = size / 2 + 6;
  const r = (size - stroke) / 2 - 4;
  const length = Math.PI * r;
  const clamped = Math.max(0, Math.min(max, value));
  const frac = max ? clamped / max : 0;
  const offset = length - (visible ? frac : 0) * length;
  const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const tipText = hoverText || sublabel || `${value.toFixed(1)}%`;

  return (
    <div className="gaugeCard">
      <div className="gaugeLabel gaugeLabelTop">{label}</div>
      <div className="gaugeSvgWrap">
        <svg viewBox={`0 0 ${size} ${size / 2 + 34}`} className="gaugeSvg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colorFrom} />
              <stop offset="100%" stopColor={colorTo} />
            </linearGradient>
          </defs>
          <path
            d={d}
            fill="none"
            stroke="rgba(20,21,26,0.08)"
            strokeWidth={stroke}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ cursor: 'pointer' }}
          />
          <path
            d={d}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={length}
            strokeDashoffset={offset}
            className="gaugeArcFill"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ cursor: 'pointer' }}
          />
          <text x={cx} y={cy - 8} textAnchor="middle" className="gaugeValueText">{valueDisplay}</text>
        </svg>
        <div className="gaugePctNearNumber">{value.toFixed(1)}%</div>
        {delta !== undefined ? <div className="gaugeTrendNearNumber"><TrendBadge delta={delta} /></div> : null}
        {hovered ? (
          <div className="gaugeHoverTip" style={{ borderLeftColor: colorFrom }}>
            {tipText}
          </div>
        ) : null}
      </div>
      {sublabel ? <div className="gaugeSub">{sublabel}</div> : null}
    </div>
  );
}
function ClassificationRow({ tone, icon, title, sub, count, pctValue, index = 0 }) {
  const visible = useInView(index * 70 + 120);
  return (
    <div className={`classRow tone-${tone}${visible ? ' in' : ''}`} style={{ transitionDelay: `${index * 60}ms` }}>
      <div className="classRowIcon">
        <TabIcon name={icon} />
      </div>
      <div className="classRowText">
        <div className="classRowTitle">{title}</div>
        <div className="classRowSub">{sub}</div>
      </div>
      <div className="classRowPct">{pctValue.toFixed(1)}%</div>
      <div className={`classRowCount tone-${tone}`}>{count}</div>
    </div>
  );
}

function ClassificationDonut({ gida, ip, conflict, total, size = 210, stroke = 30 }) {
  const visible = useInView(160);
  if (!total) return null;
  const r = (size - stroke) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * r;
  const segments = [
    { key: 'gida', label: 'GIDA', value: gida, color: '#eab308' },
    { key: 'ip', label: 'Indigenous', value: ip, color: '#2f6fed' },
    { key: 'conflict', label: 'Conflict Affected', value: conflict, color: '#e0392f' },
  ];
  let offset = 0;

  return (
    <>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="classDonut">
        <circle cx={center} cy={center} r={r} fill="none" stroke="#f0f1f4" strokeWidth={stroke} />
        {segments.map((seg, i) => {
          const fraction = seg.value / total;
          const dash = visible ? fraction * circumference : 0;
          const circle = (
            <circle
              key={seg.key}
              cx={center}
              cy={center}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${center} ${center})`}
              className="classDonutSeg"
              style={{ transitionDelay: `${i * 120}ms` }}
            />
          );
          offset += visible ? fraction * circumference : 0;
          return circle;
        })}
      </svg>
    </>
  );
}

/* Gender split bar — each color segment (male / female) is wrapped in its
   own BarTooltip so hovering just that segment shows only its own value,
   not a combined figure for the whole bar. */
function GenderSplitBar({ male, female }) {
  const visible = useInView(180);
  const total = male + female || 1;
  const malePct = (male / total) * 100;
  const femalePct = 100 - malePct;
  return (
    <div className="genderSplit">
      <div className="genderSplitHead">
        <span><span className="dot" style={{ background: '#2f6fed' }} /> Male &middot; {malePct.toFixed(1)}%</span>
        <span><span className="dot" style={{ background: '#ec4899' }} /> Female &middot; {femalePct.toFixed(1)}%</span>
      </div>
      <div className="genderSplitTrack">
        <BarTooltip
          text={`Male · ${malePct.toFixed(1)}%`}
          style={{ width: visible ? `${malePct}%` : 0, transition: 'width 1.1s cubic-bezier(.16,1,.3,1)' }}
        >
          <div className="genderSplitFill male" />
        </BarTooltip>
        <BarTooltip
          text={`Female · ${femalePct.toFixed(1)}%`}
          style={{ width: visible ? `${femalePct}%` : 0, transition: 'width 1.1s cubic-bezier(.16,1,.3,1)' }}
        >
          <div className="genderSplitFill female" />
        </BarTooltip>
      </div>
    </div>
  );
}

/* Stacked bar for Section G — Community Priority Needs. Each row shows
   the full 0–3 breakdown for one intervention as four proportional
   segments (Not Needed / Needed / Important / Very Urgent), styled like
   the Safety & Food Security bar. Hovering a segment shows the sitio
   count, percent, and level for just that segment. */
function PriorityNeedStackRow({ label, counts, total, index = 0 }) {
  const visible = useInView(index * 70 + 100);
  return (
    <div className={`needStackRow${visible ? ' in' : ''}`} style={{ transitionDelay: `${index * 60}ms` }}>
      <div className="needRowLabel">{label}</div>
      <div className="needStackTrack">
        {PRIORITY_LEVELS.map((lvl) => {
          const count = counts[lvl.score] || 0;
          const widthPct = total ? (count / total) * 100 : 0;
          return (
            <BarTooltip
              key={lvl.score}
              text={`${count.toLocaleString()} sitio${count === 1 ? '' : 's'} say ${lvl.score} \u2013 ${lvl.label} \u00b7 ${pct(count, total).toFixed(1)}%`}
              style={{ width: visible ? `${widthPct}%` : 0, transition: 'width 1s cubic-bezier(.16,1,.3,1)' }}
            >
              <div className="needStackFill" style={{ background: lvl.color }} />
            </BarTooltip>
          );
        })}
      </div>
    </div>
  );
}

/* Section G rollup — for each intervention, tallies how many sitios gave
   each 0–3 score. Sort order is still weighted toward urgency (very
   urgent counts 3x, important 2x, needed 1x) so the most pressing
   interventions surface at the top of the list. */
function usePriorityAgg(sitios) {
  return useMemo(() => {
    const total = sitios.length;
    return PRIORITY_INTERVENTIONS.map(({ key, label }) => {
      const counts = { 0: 0, 1: 0, 2: 0, 3: 0 };
      sitios.forEach((s) => {
        const v = s.priorityNeeds?.[key];
        if (counts[v] !== undefined) counts[v] += 1;
      });
      const weighted = counts[3] * 3 + counts[2] * 2 + counts[1] * 1;
      return { key, label, counts, total, weighted };
    }).sort((a, b) => b.weighted - a.weighted);
  }, [sitios]);
}

/* Overview stays here since dashboard.jsx *is* the Overview tab's home. */
function OverviewPanel({ sitios, hasFilters, onClearFilters }) {
  const stats = useOverviewStats(sitios);
  const priorityAgg = usePriorityAgg(sitios);


  if (!stats.totalSitios) {
    return (
      <div className="panelEmpty">
        <div className="panelEmptyIcon"><TabIcon name="pin" /></div>
        <div className="panelEmptyTitle">No sitios match these filters</div>
        <div className="panelEmptySub">Try a different municipality, barangay, or search term.</div>
        {hasFilters ? (
          <button type="button" className="clearFiltersBtn" onClick={onClearFilters}>Clear filters</button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="panelStack">
      {/* ===== KPI row ===== */}
      <div className="kpiGrid">
        <StatCard
          index={0}
          icon="pin"
          iconBg="#e6f1fb"
          iconColor="#185fa5"
          label="Total Sitios"
          value={stats.totalSitios}
          sub="recorded communities"
          delta={4.6}
          cornerTooltipTrigger="click"
          cornerTooltip={{
            title: 'Source',
            text: 'Sitio counts are grouped from completed profiling records and standardized against the PSA Philippine Standard Geographic Code (PSGC).',
            linkHref: 'https://psa.gov.ph/classification/psgc',
            linkLabel: 'PSA — PSGC',
            whyTitle: 'Why This Visualization',
            whyText: 'A headline KPI is appropriate for one unambiguous total: it makes the current scope immediately scannable without adding a chart whose only message would be the same single number.',
            whyLinkHref: 'https://books.google.com/books/about/Information_Dashboard_Design.html?id=qWER8Im-WYIC',
            whyLinkLabel: 'Few — Information Dashboard Design',
          }}
        />
        <StatCard
          index={1}
          icon="users"
          iconBg="#e4f8ef"
          iconColor="#0f9d58"
          label="Population"
          value={stats.totalPopulation}
          sub={`${stats.avgPerHousehold.toFixed(1)} avg / household`}
          delta={3.1}
          cornerTooltipTrigger="click"
          cornerTooltip={{
            title: 'Source',
            text: 'Population and household counts are aggregated from the PSA Community-Based Monitoring System (CBMS) Household Profile Questionnaire.',
            linkHref: 'https://cbms.psa.gov.ph',
            linkLabel: 'PSA — CBMS',
            whyTitle: 'Why This Visualization',
            whyText: 'A KPI pairs the province-wide population total with one supporting rate (average people per household), giving the overview its key scale cue without making users decode a chart before seeing the headline.',
            whyLinkHref: 'https://books.google.com/books/about/Information_Dashboard_Design.html?id=qWER8Im-WYIC',
            whyLinkLabel: 'Few — Information Dashboard Design',
          }}
        />
        <StatCard
          index={2}
          icon="doc"
          iconBg="#f2e9fb"
          iconColor="#7c3aed"
          label="Households"
          value={stats.totalHouseholds}
          sub={`${stats.avgHouseholdsPerSitio.toFixed(1)} avg / sitio`}
          delta={2.4}
          cornerTooltipTrigger="click"
          cornerTooltip={{
            title: 'Source',
            text: 'Household counts are aggregated from completed PSA CBMS-aligned sitio profiling records.',
            linkHref: 'https://cbms.psa.gov.ph',
            linkLabel: 'PSA — CBMS',
            whyTitle: 'Why This Visualization',
            whyText: 'This is a single operational total, so a compact KPI preserves space for the comparison and composition views below while still exposing the supporting average.',
            whyLinkHref: 'https://books.google.com/books/about/Information_Dashboard_Design.html?id=qWER8Im-WYIC',
            whyLinkLabel: 'Few — Information Dashboard Design',
          }}
        />
        <StatCard
          index={3}
          icon="building"
          iconBg="#fdecd8"
          iconColor="#c2650a"
          label="Survey Coverage"
          value={stats.coveragePct}
          decimals={1}
          suffix="%"
          sub={`${stats.totalSitios.toLocaleString()} of ${TOTAL_KNOWN_SITIOS.toLocaleString()} known sitios profiled`}
          cornerTooltipTrigger="click"
          cornerTooltip={{
            title: 'Survey Coverage',
            text: `Known sitios: ${TOTAL_KNOWN_SITIOS.toLocaleString()} total sitios on record for the province. Surveyed: ${stats.totalSitios.toLocaleString()} sitios where profiling has already been completed and submitted.`,
            linkHref: 'https://psa.gov.ph/classification/psgc',
            linkLabel: 'PSA — PSGC',
            whyTitle: 'Why This Chart',
            whyText: 'A single KPI number is used, not a gauge or bar, because this is the one figure reviewers scan first on the page. Dashboard research shows large standalone numbers are read fastest and should be reserved for the single most decision-relevant metric on a card (Few, Information Dashboard Design).',
            whyLinkHref: 'https://www.perceptualedge.com/library.php',
            whyLinkLabel: 'Stephen Few — Information Dashboard Design',
          }}
        />
      </div>

      {/* ===== Community Overview + Administrative Coverage ===== */}
      <div className="overviewGrid">
        <div className="overviewCard glow-purple">
          <CornerTooltip
            title="Source"
            text="Total population, sex distribution, and household counts are aggregated from the PSA CBMS Household Profile Questionnaire (HPQ), per RA 11315 (Community-Based Monitoring System Act)."
            linkHref="https://cbms.psa.gov.ph"
            linkLabel="cbms.psa.gov.ph"
            whyTitle="Why This Visualization"
            whyText="The 100% stacked bar communicates a two-part composition—male and female residents—on one common whole. Length along the same baseline supports faster part-to-whole comparison than separate counts alone, while the exact figures remain visible below."
            whyLinkHref="https://doi.org/10.2307/2288400"
            whyLinkLabel="Cleveland & McGill (1984) — graphical perception"
            trigger="click"
          />
          <div className="overviewCardHead">
            <div className="overviewCardIcon purple"><TabIcon name="pulse" /></div>
            <div>
              <div className="overviewCardTitle">Community Overview</div>
              <div className="overviewCardSub">Population composition across all recorded sitios</div>
            </div>
          </div>
          <GenderSplitBar male={stats.totalMale} female={stats.totalFemale} />
          <div className="miniStatRow">
            <div className="miniStat">
              <div className="miniStatValue"><CountUp value={stats.totalMale} /></div>
              <div className="miniStatLabel">Male residents</div>
            </div>
            <div className="miniStat">
              <div className="miniStatValue"><CountUp value={stats.totalFemale} /></div>
              <div className="miniStatLabel">Female residents</div>
            </div>
            <div className="miniStat">
              <div className="miniStatValue"><CountUp value={stats.avgHouseholdsPerSitio} decimals={1} /></div>
              <div className="miniStatLabel">HH / sitio avg</div>
            </div>
          </div>
        </div>

        <div className="overviewCard">
          <CornerTooltip
            title="Source"
            text="Municipality, barangay, and sitio names follow the PSA Philippine Standard Geographic Code (PSGC)."
            linkHref="https://psa.gov.ph/classification/psgc"
            linkLabel="psa.gov.ph/classification/psgc"
            whyTitle="Why This Visualization"
            whyText="A compact labeled list is used because these are distinct administrative facts, not a quantitative distribution. It lets readers verify geographic scope directly without implying comparison through a decorative chart."
            whyLinkHref="https://www.oreilly.com/library/view/visualization-analysis-and/9781466508910/K14708_C005.xhtml"
            whyLinkLabel="Munzner — marks and channels"
            trigger="click"
          />
          <div className="overviewCardHead adminCardHead">
            <div className="overviewCardIcon blue"><TabIcon name="building" /></div>
            <div>
              <div className="overviewCardTitle">Administrative Coverage</div>
              <div className="overviewCardSub">Geographic and administrative scope</div>
            </div>
          </div>
          <div className="adminRowList">
            <div className="adminRow">
              <div className="adminRowLabel">Province</div>
              <div className="adminRowValue">{stats.province}</div>
            </div>
            <div className="adminRow">
              <div className="adminRowLabel">Municipalities</div>
              <div className="adminRowValue"><CountUp value={stats.municipalities} /></div>
            </div>
            <div className="adminRow">
              <div className="adminRowLabel">Barangays</div>
              <div className="adminRowValue"><CountUp value={stats.barangays} /></div>
            </div>
            <div className="adminRow adminRowTotal">
              <div className="adminRowLabel">Total Sitios</div>
              <div className="adminRowValuePill"><CountUp value={stats.totalSitios} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Utilities at a Glance ===== */}
      <div className="sectionCard">
        <CornerTooltip
          title="Sources"
          text="Electricity access and source: DOE Household Electrification Program (Q52–53). Sanitation: PSA CBMS Core Indicator (d) (Q45–46). Mobile signal and household internet access: NTC / DICT (Q54–55)."
          links={[
            { href: 'https://doe.gov.ph', label: 'doe.gov.ph' },
            { href: 'https://ntc.gov.ph', label: 'ntc.gov.ph' },
          ]}
          whyTitle="Why This Visualization"
          whyText="Small, repeated KPI cards make four independently important service indicators easy to scan and compare. Each card shows the exact percentage and count, avoiding gauge-style decoration where precision matters."
          whyLinkHref="https://books.google.com/books/about/Information_Dashboard_Design.html?id=qWER8Im-WYIC"
          whyLinkLabel="Few — Information Dashboard Design"
          trigger="click"
        />
        <div className="overviewCardHead">
          <div className="overviewCardIcon purple"><TabIcon name="pulse" /></div>
          <div>
            <div className="overviewCardTitle">Utilities at a Glance</div>
            <div className="overviewCardSub">Infrastructure and connectivity metrics across all sitios</div>
          </div>
        </div>
        <div className="utilityGrid">
          <UtilityCard
            index={0}
            tone="yellow"
            icon="pulse"
            colorFrom="#f59e0b"
            colorTo="#eab308"
            label="Electricity"
            value={stats.electricityPct}
            sub={`${stats.householdsWithElectricity.toLocaleString()} households`}
            delta={2.8}
          />
          <UtilityCard
            index={1}
            tone="teal"
            icon="pin"
            colorFrom="#0ea5e9"
            colorTo="#14b8a6"
            label="Sanitation"
            value={stats.sanitationPct}
            sub={`${stats.householdsWithToilet.toLocaleString()} households`}
            delta={1.9}
          />
          <UtilityCard
            index={2}
            tone="blue"
            icon="doc"
            colorFrom="#2f6fed"
            colorTo="#6366f1"
            label="Internet"
            value={stats.internetPct}
            sub={`${stats.householdsWithInternet.toLocaleString()} households`}
            delta={-1.2}
          />
          <UtilityCard
            index={3}
            tone="lavender"
            icon="pulse"
            colorFrom="#7c3aed"
            colorTo="#a855f7"
            label="Mobile Signal"
            value={stats.signalCoveragePct}
            sub={`${stats.strongSignalCount.toLocaleString()} sitios 4G/5G`}
            delta={3.5}
          />
        </div>
      </div>

      {/* ===== Safety & Food Security ===== */}
      <div className="sectionCard">
        <CornerTooltip
          title="Sources"
          text="Hazard exposure: NDRRMC hazard advisories and barangay DRRM records (Q56). Food security status: the HFIAS used in FNRI-DOST's National Nutrition Survey, aligned with IPC chronic food insecurity levels (Q57)."
          links={[
            { href: 'https://ndrrmc.gov.ph', label: 'ndrrmc.gov.ph' },
            { href: 'https://www.fnri.dost.gov.ph/images/45thFSS/TS1-FoodSecurity.pdf', label: 'FNRI-DOST Food Security Survey' },
          ]}
          whyTitle="Why This Visualization"
          whyText="The headline KPI isolates the urgent hazard-exposure rate, while the 100% stacked bar shows how food-security statuses divide the same set of sitios. This gives both the priority signal and the full distribution without separate charts."
          whyLinkHref="https://doi.org/10.2307/2288400"
          whyLinkLabel="Cleveland & McGill (1984) — graphical perception"
          trigger="click"
        />
        <div className="overviewCardHead">
          <div className="overviewCardIcon" style={{ background: '#fdecea', color: '#c0392b' }}>
            <TabIcon name="shield" />
          </div>
          <div>
            <div className="overviewCardTitle">Safety &amp; Food Security</div>
            <div className="overviewCardSub">Hazard exposure and food security status across all sitios</div>
          </div>
        </div>
        <div className="foodSecurityRow">
          <div className="teaserTile foodTeaserTile">
            <div className="teaserValue">{stats.hazardExposedPct.toFixed(1)}%</div>
            <div className="teaserLabel">Sitios with hazard exposure in the past 12 months</div>
          </div>
          <div className="foodSplitWrap">
            <div className="foodSplitTrack">
              <BarTooltip
                text={`Food secure · ${stats.foodSecurePct.toFixed(1)}%`}
                style={{ width: `${stats.foodSecurePct}%` }}
              >
                <div className="foodSplitFill secure" />
              </BarTooltip>
              <BarTooltip
                text={`Seasonal scarcity · ${stats.foodSeasonalPct.toFixed(1)}%`}
                style={{ width: `${stats.foodSeasonalPct}%` }}
              >
                <div className="foodSplitFill seasonal" />
              </BarTooltip>
              <BarTooltip
                text={`Chronic shortage · ${stats.foodChronicPct.toFixed(1)}%`}
                style={{ width: `${stats.foodChronicPct}%` }}
              >
                <div className="foodSplitFill chronic" />
              </BarTooltip>
            </div>
            <div className="foodSplitLegend">
              <span><span className="dot" style={{ background: '#22c55e' }} />Food secure &middot; {stats.foodSecurePct.toFixed(1)}%</span>
              <span><span className="dot" style={{ background: '#eab308' }} />Seasonal scarcity &middot; {stats.foodSeasonalPct.toFixed(1)}%</span>
              <span><span className="dot" style={{ background: '#e0392f' }} />Chronic shortage &middot; {stats.foodChronicPct.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>


      {/* ===== Demographics + Livelihood teaser ===== */}
      <div className="overviewGrid">
        <div className="overviewCard">
          <CornerTooltip
            title="Sources"
            text="OSCY: PSA CBMS and DepEd BEIS using the PSA-FLEMMS OSCY definition (Q16–17). Birth registration and National ID: PSA Civil Registration and Vital Statistics and RA 11055 (PhilSys Act) (Q15)."
            linkHref="https://cbms.psa.gov.ph"
            linkLabel="cbms.psa.gov.ph"
            whyTitle="Why This Visualization"
            whyText="The three gauges are used as compact progress-to-100% displays for three separately actionable rates. Each includes the exact count and percentage so the visual cue does not require estimating an arc."
            whyLinkHref="https://books.google.com/books/about/Information_Dashboard_Design.html?id=qWER8Im-WYIC"
            whyLinkLabel="Few — Information Dashboard Design"
            trigger="click"
          />
          <div className="overviewCardHead">
          <div className="overviewCardIcon" style={{ background: '#e6f1fb', color: '#185fa5' }}>
              <TabIcon name="users" />
            </div>
            <div>
              <div className="overviewCardTitle">Demographics Snapshot</div>
              <div className="overviewCardSub">Vulnerability indicators across all recorded sitios</div>
            </div>
          </div>
          <div className="gaugeGrid">
            <GaugeChart
              index={0}
              gradientId="gauge-oscy"
              colorFrom="#17a673"
              colorTo="#22c55e"
              value={pct(stats.totalOSCY, stats.totalPopulation)}
              max={100}
              minLabel={`${pct(stats.totalOSCY, stats.totalPopulation).toFixed(1)}%`}
              maxLabel="100%"
              valueDisplay={stats.totalOSCY.toLocaleString()}
              label="Out-of-school children & youth"
              hoverText={`${stats.totalOSCY.toLocaleString()} \u00b7 ${pct(stats.totalOSCY, stats.totalPopulation).toFixed(1)}% of total population are OSCY`}
              delta={-2.1}
            />
            <GaugeChart
              index={1}
              gradientId="gauge-birthcert"
              colorFrom="#f97316"
              colorTo="#eab308"
              value={stats.withoutBirthCertPct}
              max={100}
              minLabel={`${stats.withoutBirthCertPct.toFixed(1)}%`}
              maxLabel="100%"
              valueDisplay={stats.totalWithoutBirthCert.toLocaleString()}
              label="Population without birth certificate"
              hoverText={`${stats.totalWithoutBirthCert.toLocaleString()} \u00b7 ${stats.withoutBirthCertPct.toFixed(1)}% of total population are without a birth certificate`}
              delta={-1.4}
            />
            <GaugeChart
              index={2}
              gradientId="gauge-philsys"
              colorFrom="#7c3aed"
              colorTo="#a855f7"
              value={stats.withoutPhilsysPct}
              max={100}
              minLabel={`${stats.withoutPhilsysPct.toFixed(1)}%`}
              maxLabel="100%"
              valueDisplay={stats.totalWithoutPhilsysId.toLocaleString()}
              label="Population without PhilSys ID"
              hoverText={`${stats.totalWithoutPhilsysId.toLocaleString()} \u00b7 ${stats.withoutPhilsysPct.toFixed(1)}% of total population are without a PhilSys ID`}
              delta={0.6}
            />
          </div>
        </div>

        <div className="overviewCard">
          <CornerTooltip
            title="Source"
            text="Dominant income source and average household income are collected under the PSA Family Income and Expenditure Survey (FIES) framework."
            linkHref="https://psa.gov.ph"
            linkLabel="psa.gov.ph (FIES)"
            whyTitle="Why This Visualization"
            whyText="A short ranked-summary layout is better than a chart here because the card answers two different questions: which income sector is most common, and what is the average household income. Direct labels keep both answers precise and easy to scan."
            whyLinkHref="https://www.oreilly.com/library/view/visualization-analysis-and/9781466508910/K14708_C005.xhtml"
            whyLinkLabel="Munzner — marks and channels"
            trigger="click"
          />
          <div className="overviewCardHead">
            <div className="overviewCardIcon" style={{ background: '#e4f8ef', color: '#0f9d58' }}>
              <TabIcon name="trend" />
            </div>
            <div>
              <div className="overviewCardTitle">Livelihood Snapshot</div>
              <div className="overviewCardSub">Dominant income sources across all recorded sitios</div>
            </div>
          </div>
          <div className="livelihoodRows">
            <BarTooltip text={`${stats.dominantSectorCount.toLocaleString()} of ${stats.totalSitios.toLocaleString()} sitios report this as their dominant income source`}>
              <div className="livelihoodRow">
                <div className="livelihoodRowText">
                  <div className="livelihoodRowLabel">Most common sector</div>
                  <div className="livelihoodRowValue">{stats.dominantSector}</div>
                </div>
                <div className="livelihoodRowStat">{stats.dominantSectorPct.toFixed(0)}%<span>of sitios</span></div>
              </div>
            </BarTooltip>
            <BarTooltip text={`Averaged across ${stats.totalSitios.toLocaleString()} surveyed sitios`}>
              <div className="livelihoodRow">
                <div className="livelihoodRowText">
                  <div className="livelihoodRowLabel">Avg. monthly household income</div>
                  <div className="livelihoodRowValue">&#8369;{Math.round(stats.avgHouseholdIncome).toLocaleString()}</div>
                </div>
              </div>
            </BarTooltip>
          </div>
        </div>
      </div>

      {/* ===== Sitio Classifications + Sitios by Municipality ===== */}
      <div className="overviewGrid">
        <div className="overviewCard">
          <CornerTooltip
            title="Sources"
            text="GIDA status: DOH Administrative Order No. 2020-0023. Indigenous Peoples area: NCIP. Conflict-affected classification: PAMANA Program Manual of Operations, OPAPRU."
            links={[
              { href: 'https://doh.gov.ph', label: 'doh.gov.ph' },
              { href: 'https://ncip.gov.ph', label: 'ncip.gov.ph' },
          ]}
          whyTitle="Why This Visualization"
          whyText="The aligned rows compare the three designation counts directly, while the donut provides a compact overview of their combined share. Exact counts and percentages in the legend prevent readers from relying on angle estimation alone."
          whyLinkHref="https://doi.org/10.2307/2288400"
          whyLinkLabel="Cleveland & McGill (1984) — graphical perception"
          trigger="click"
          />
          <div className="overviewCardHead">
            <div className="overviewCardIcon"><TabIcon name="pin" /></div>
            <div>
              <div className="overviewCardTitle">Sitio Classifications</div>
              <div className="overviewCardSub">Special area designations and vulnerability status</div>
            </div>
          </div>
          <div className="classList">
            <ClassificationRow
              index={0}
              tone="yellow"
              icon="pin"
              title="GIDA Status"
              sub="Geographically Isolated and Disadvantaged Area"
              count={stats.gidaCount}
              pctValue={pct(stats.gidaCount, stats.totalSitios)}
            />
            <ClassificationRow
              index={1}
              tone="green"
              icon="users"
              title="Indigenous Community"
              sub="Indigenous Peoples (IP) Area"
              count={stats.ipAreaCount}
              pctValue={pct(stats.ipAreaCount, stats.totalSitios)}
            />
            <ClassificationRow
              index={2}
              tone="red"
              icon="shield"
              title="Conflict-Affected"
              sub="Conflict-affected area"
              count={stats.conflictAffectedCount}
              pctValue={pct(stats.conflictAffectedCount, stats.totalSitios)}
            />
          </div>
          <div className="donutRow">
            <div className="donutWrap">
              <ClassificationDonut
                gida={stats.gidaCount}
                ip={stats.ipAreaCount}
                conflict={stats.conflictAffectedCount}
                total={stats.classificationTotal}
              />
              <div className="donutCenter">
                <div className="donutCenterLabel">Total Sitios</div>
                <div className="donutCenterValue"><CountUp value={stats.totalSitios} /></div>
              </div>
            </div>
            <div className="donutLegend">
              <div className="donutLegendRow">
                <span className="dot yellow" />GIDA: {stats.gidaCount} ({pct(stats.gidaCount, stats.classificationTotal).toFixed(1)}%)
              </div>
              <div className="donutLegendRow">
                <span className="dot blue" />Indigenous: {stats.ipAreaCount} ({pct(stats.ipAreaCount, stats.classificationTotal).toFixed(1)}%)
              </div>
              <div className="donutLegendRow">
                <span className="dot red" />Conflict Affected: {stats.conflictAffectedCount} ({pct(stats.conflictAffectedCount, stats.classificationTotal).toFixed(1)}%)
              </div>
            </div>
          </div>
        </div>

        <div className="overviewCard">
          <CornerTooltip
            title="Source"
            text="Sitio counts are grouped by municipality using locality names standardized against the PSA Philippine Standard Geographic Code (PSGC)."
            linkHref="https://psa.gov.ph/classification/psgc"
            linkLabel="psa.gov.ph/classification/psgc"
            whyTitle="Why This Visualization"
            whyText="Horizontal bars are used to rank municipality counts on a shared zero baseline. Position and length are among the most accurate visual encodings for comparing quantities across categories."
            whyLinkHref="https://doi.org/10.2307/2288400"
            whyLinkLabel="Cleveland & McGill (1984) — graphical perception"
            trigger="click"
          />
          <div className="overviewCardHead">
            <div className="overviewCardIcon blue"><TabIcon name="building" /></div>
            <div>
              <div className="overviewCardTitle">Sitios by Municipality</div>
              <div className="overviewCardSub">Number of recorded sitios per municipality</div>
            </div>
          </div>
          <div className="barChart">
            <div className="barChartLabel">Sitios</div>
            {stats.sitiosByMunicipality.map((m, i) => {
              const max = stats.sitiosByMunicipality[0]?.count || 1;
              const widthPct = pct(m.count, max);
              return <BarRow key={m.name} name={m.name} count={m.count} widthPct={widthPct} index={i} totalSitios={stats.totalSitios} />;
            })}
          </div>
        </div>
      </div>


      {/* ===== Self-reported community priorities (Section G) ===== */}
      <div className="selfReportedCard">
        <CornerTooltip
          title="Source"
          text="Urgency scale (0–3) adapted from JICA's Data Collection Survey on Sitio-Level Development Planning, South Cotabato Province."
          linkHref="https://openjicareport.jica.go.jp/pdf/12263109_02.pdf"
          linkLabel="Open JICA report (PDF)"
          whyTitle="Why This Chart"
          whyText="Each intervention is shown as a stacked bar across its 4 urgency levels rather than 7 separate pie charts, so all interventions can be ranked and compared on one shared scale — length is easier to compare across rows than angle across separate circles (Cleveland & McGill, 1984). Hovering a segment reveals its exact count, keeping the resting chart uncluttered per standard tooltip-usability guidance."
          whyLinkHref="https://www.nngroup.com/articles/tooltip-guidelines/"
          whyLinkLabel="NN/G: Tooltip Guidelines"
          trigger="click"
        />
        <div className="selfReportedHead">
          <span className="selfReportedBadge">Self-reported</span>
          <span className="selfReportedTitle">Community Priority Needs</span>
        </div>
        <div className="panelEmptySub" style={{ marginBottom: 14 }}>
          Sitio-leader-ranked intervention priorities (Section G). Not a government statistical
          indicator — this captures community voice directly, ranked here by combined urgency
          across all sitios in the current filter. Hover any segment for the exact count.
        </div>
        <div className="needLegend">
          {PRIORITY_LEVELS.map((lvl) => (
            <InfoTooltip key={lvl.score} text={lvl.description}>
              <span className="needLegendItem">
                <span className="dot" style={{ background: lvl.color }} />
                {lvl.score} &middot; {lvl.label}
                <span className="infoDot"><InfoDot /></span>
              </span>
            </InfoTooltip>
          ))}
        </div>
        <div className="needList">
          {priorityAgg.map((item, i) => (
            <PriorityNeedStackRow
              key={item.key}
              label={item.label}
              counts={item.counts}
              total={item.total}
              index={i}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function BarRow({ name, count, widthPct, index, totalSitios }) {
  const visible = useInView(index * 60 + 120);
  const ofTotalPct = totalSitios ? pct(count, totalSitios) : 0;
  return (
    <div className="barRow">
      <div className="barRowLabel">{name}</div>
      <BarTooltip text={`${count.toLocaleString()} sitios · ${ofTotalPct.toFixed(1)}% of total`}>
        <div className="barTrack">
          <div
            className="barFill"
            style={{
              width: visible ? `${widthPct}%` : 0,
              background: BAR_COLORS[index % BAR_COLORS.length],
              transitionDelay: `${index * 50}ms`,
            }}
          />
        </div>
      </BarTooltip>
      <div className="barRowValue"><CountUp value={count} duration={800} /></div>
    </div>
  );
}

const BAR_COLORS = [
  'linear-gradient(90deg,#2f6fed,#60a5fa)',
  'linear-gradient(90deg,#17a673,#4ade80)',
  'linear-gradient(90deg,#eab308,#fbbf24)',
  'linear-gradient(90deg,#7c3aed,#c084fc)',
  'linear-gradient(90deg,#06b6d4,#67e8f9)',
  'linear-gradient(90deg,#e0392f,#fb7185)',
  'linear-gradient(90deg,#f97316,#fdba74)',
  'linear-gradient(90deg,#0ea5e9,#7dd3fc)',
  'linear-gradient(90deg,#a855f7,#e9d5ff)',
  'linear-gradient(90deg,#22c55e,#bbf7d0)',
];

const PANELS = {
  area: AreaPanel,
  demographics: DemographicsPanel,
  livelihood: LivelihoodPanel,
  safety: SafetyPanel,
  infrastructure: InfrastructurePanel,
  activity: ActivityPanel,
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [municipality, setMunicipality] = useState('');
  const [barangay, setBarangay] = useState('');
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('latest');

  const barangayOptions = municipality ? MUNICIPALITY_BARANGAYS[municipality] : null;

  const handleMunicipalityChange = (e) => {
    const value = e.target.value;
    setMunicipality(value);
    setBarangay('');
  };

  const filteredSitios = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_SITIOS.filter((s) => {
      if (municipality && s.municipality !== municipality) return false;
      if (barangay && s.barangay !== barangay) return false;
      if (year === 'latest' && s.surveyYear !== SURVEY_YEARS[SURVEY_YEARS.length - 1]) return false;
      if (year !== 'latest' && s.surveyYear !== Number(year)) return false;
      if (q && !(`${s.sitioName} ${s.barangay} ${s.municipality}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [municipality, barangay, search, year]);

  const hasFilters = Boolean(municipality || barangay || search || year !== 'latest');
  const clearFilters = () => {
    setMunicipality('');
    setBarangay('');
    setSearch('');
    setYear('latest');
  };

  const ActivePanel = PANELS[activeTab];

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
            <div className="navItem active">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
              Dashboard
            </div>
          </div>

          <div className="navSection">
            <div className="navLabel">Data Management</div>
            <Link to="/sitio" className="navItem">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s7-6.6 7-12A7 7 0 0 0 5 10c0 5.4 7 12 7 12z" /><circle cx="12" cy="10" r="2.4" /></svg>
              Sitios
            </Link>
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
            <a href="/form" className="navItem formNavItem">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" /><path d="M14 2v5h5M8 13h8M8 17h5" /></svg>
              Form
            </a>
          </div>

          <div className="sidebarFooter">
            <div className="avatar">J</div>
            <div style={{ minWidth: 0 }}>
              <div className="userName">Bernard Aligagay</div>
              <div className="userEmail">bernard,aligagay@southcotabato.g&hellip;</div>
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
              <h1 className="pageTitle">Dashboard</h1>
              <p className="pageSub">Overview of sitios, community data, and activities</p>
            </div>
          </div>

          <div className="toolRow">
            <select className="toolSelect" value={municipality} onChange={handleMunicipalityChange}>
              <option value="">All Municipalities</option>
              {MUNICIPALITIES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select className="toolSelect" value={barangay} onChange={(e) => setBarangay(e.target.value)}>
              <option value="">All Barangays</option>
              {barangayOptions
                ? barangayOptions.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))
                : MUNICIPALITIES.map((m) => (
                    <optgroup label={m} key={m}>
                      {MUNICIPALITY_BARANGAYS[m].map((b) => (
                        <option key={`${m}-${b}`} value={b}>{b}</option>
                      ))}
                    </optgroup>
                  ))}
            </select>

            <div className="searchBox">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
              <input
                type="text"
                placeholder="Search sitio, barangay, municipality…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search ? (
                <button type="button" className="searchClear" onClick={() => setSearch('')} aria-label="Clear search">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              ) : null}
            </div>

            <div className="toolSelect toolSelectYear">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              <select className="toolSelectYearInner" value={year} onChange={(e) => setYear(e.target.value)} aria-label="Survey year">
                <option value="latest">Latest Year (2026)</option>
                {SURVEY_YEARS.map((surveyYear) => (
                  <option key={surveyYear} value={surveyYear}>{surveyYear}</option>
                ))}
              </select>
            </div>
            <div className="sitioCountChip">{filteredSitios.length.toLocaleString()} sitios</div>
          </div>

          {/* ===== Tab bar — sticky so it stays reachable while scrolling ===== */}
          <div className="dashTabBar">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`dashTab${activeTab === t.id ? ' active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                <TabIcon name={t.icon} />
                <span>{t.label}</span>
                {t.badge ? <span className="dashTabBadge">{t.badge}</span> : null}
              </button>
            ))}
          </div>

          <div className="dashPanelCard">
            {activeTab === 'overview' ? (
              <OverviewPanel sitios={filteredSitios} hasFilters={hasFilters} onClearFilters={clearFilters} />
            ) : (
              <ActivePanel
                sitios={filteredSitios}
                hasFilters={hasFilters}
                onClearFilters={clearFilters}
                municipality={municipality}
                barangay={barangay}
              />
            )}
          </div>

        </main>
      </div>
    </>
  );
}

const CSS = `
  :root {
    --bg: #edeff4;
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
    --radius: 12px;
    --radius-sm: 8px;
    --shadow-sm: 0 1px 3px rgba(16,24,40,0.07);
    --shadow-md: 0 6px 18px rgba(16,24,40,0.09);
    --shadow-lg: 0 18px 40px rgba(16,24,40,0.14);
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
  .main { flex: 1; min-width: 0; height: 100vh; overflow-y: auto; padding: 0 36px 60px; }
  .pageHead { display: flex; align-items: flex-start; gap: 14px; margin: 28px 0 26px; }
  .sidebarToggle { border: 1px solid var(--border-strong); background: var(--surface); border-radius: var(--radius-sm); width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); flex-shrink: 0; margin-top: 4px; cursor: pointer; }
  .pageTitle { font-size: 30px; font-weight: 800; margin: 0; letter-spacing: -0.01em; }
  .pageSub { font-size: 14px; color: var(--text-secondary); margin: 4px 0 0; }

  .toolRow { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
  .toolSelect {
    height: 40px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong);
    padding: 0 12px; font-size: 13.5px; background: var(--surface); font-family: inherit;
    color: var(--text-primary); min-width: 170px;
    display: flex; align-items: center; gap: 6px; transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  select.toolSelect:hover, .toolSelect:hover { border-color: var(--blue); }
  select.toolSelect:focus, .toolSelect:focus-within { outline: none; border-color: var(--blue); box-shadow: 0 0 0 3px rgba(47,111,237,0.15); }
  .toolSelectYear { min-width: 180px; padding: 0 8px 0 12px; color: var(--text-muted); }
  .toolSelectYear > svg { flex: 0 0 auto; }
  .toolSelectYearInner { appearance: auto; -webkit-appearance: auto; width: 100%; height: 100%; border: 0; outline: 0; background: transparent; color: var(--text-primary); font: inherit; cursor: pointer; }
  .searchBox {
    position: relative; display: flex; align-items: center; height: 40px; min-width: 260px; flex: 1 1 260px; max-width: 380px;
    border: 1px solid var(--border-strong); border-radius: var(--radius-sm); background: var(--surface);
    padding: 0 10px; color: var(--text-muted); transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .searchBox:focus-within { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(47,111,237,0.15); color: var(--blue); }
  .searchBox input {
    border: none; outline: none; font-family: inherit; font-size: 13.5px; color: var(--text-primary);
    background: transparent; flex: 1; height: 100%; padding: 0 8px;
  }
  .searchClear { border: none; background: #f0f1f4; color: var(--text-secondary); width: 20px; height: 20px; border-radius: 999px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
  .sitioCountChip {
    margin-left: auto; font-size: 12.5px; font-weight: 700; color: var(--blue-text);
    background: var(--blue-bg); border: 1px solid rgba(47,111,237,0.25); border-radius: 999px;
    padding: 8px 14px; transition: transform 0.15s ease;
  }

  /* ===== Tab bar — sticky, stretched full width, equal-width tabs ===== */
  .dashTabBar {
    position: sticky; top: 0; z-index: 1000;
    display: flex; align-items: stretch; gap: 7px; background: var(--surface);
    border: 1px solid var(--border); border-radius: 13px; padding: 7px;
    margin-bottom: 18px; width: 100%; box-shadow: var(--shadow-sm);
  }
  .dashTab {
    flex: 1 1 0;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 13.5px; font-weight: 600; white-space: nowrap;
    padding: 12px 12px; border-radius: 9px; border: none; background: transparent;
    color: var(--text-secondary); cursor: pointer; font-family: inherit; position: relative;
    transition: background 0.15s ease, color 0.15s ease;
  }
  .dashTab svg { width: 17px; height: 17px; }
  .dashTab:hover { background: #f4f5f7; color: var(--text-primary); }
  .dashTab.active { background: linear-gradient(135deg,#2f6fed,#3b82f6); color: #fff; }
  .dashTab.active svg { color: #fff; }
  .dashTabBadge {
    background: var(--red); color: #fff; font-size: 10.5px; font-weight: 700;
    min-width: 18px; height: 18px; border-radius: 999px; display: flex;
    align-items: center; justify-content: center; padding: 0 4px; margin-left: 2px;
  }

  .dashPanelCard {
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
    min-height: 360px; padding: 40px;
  }
  .dashPanelCard:has(> .panelEmpty) { display: flex; align-items: center; justify-content: center; }
  .panelStack { display: flex; flex-direction: column; gap: 24px; }
  .panelEmpty { text-align: center; max-width: 340px; margin: 0 auto; }
  .panelEmptyIcon {
    width: 48px; height: 48px; border-radius: 12px; background: var(--blue-bg); color: var(--blue-text);
    display: flex; align-items: center; justify-content: center; margin: 0 auto 14px;
  }
  .panelEmptyTitle { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; }
  .panelEmptySub { font-size: 13px; color: var(--text-muted); line-height: 1.5; }
  .clearFiltersBtn {
    margin-top: 16px; border: none; background: var(--blue); color: #fff; font-weight: 700;
    font-size: 13px; padding: 10px 18px; border-radius: 999px; cursor: pointer; font-family: inherit;
  }

  .selfReportedCard {
    position: relative;
    border: 2px dashed #9599a3;
    background: var(--surface);
    border-radius: var(--radius);
    padding: 20px 48px 24px 24px;
  }
  .selfReportedHead { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .selfReportedBadge {
    font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
    color: #fff; background: #52565f; border-radius: 999px; padding: 3px 9px;
  }
  .selfReportedTitle { font-size: 14px; font-weight: 700; color: var(--text-primary); }
  .selfReportedCard .panelEmptySub { text-align: left; max-width: none; }


  /* ===== Animation primitives ===== */
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

  /* ===== Tooltips (trend badges + info dots) ===== */
  .tooltipWrap { position: relative; display: inline-flex; align-items: center; cursor: help; }
  .tooltipWrap .tooltipBubble {
    position: absolute; bottom: calc(100% + 9px); right: -8px; left: auto; transform: translateY(4px);
    background: #16274d; color: #eef3ff; font-size: 11px; font-weight: 500; line-height: 1.45;
    padding: 9px 11px; border-radius: 8px; width: max-content; max-width: 220px;
    opacity: 0; pointer-events: none; transition: opacity 0.15s ease, transform 0.15s ease;
    box-shadow: 0 10px 24px rgba(16,33,77,0.35); z-index: 70; text-align: left;
  }
  .tooltipWrap .tooltipBubble::after {
    content: ''; position: absolute; top: 100%; right: 14px; left: auto;
    border: 5px solid transparent; border-top-color: #16274d;
  }
  .tooltipWrap:not(.clickTooltip):hover .tooltipBubble, .tooltipWrap:not(.clickTooltip):focus-within .tooltipBubble, .tooltipWrap:not(.clickTooltip):focus .tooltipBubble,
  .tooltipWrap.open .tooltipBubble {
    opacity: 1; transform: translateY(0);
  }
  .infoDot { margin-left: 5px; vertical-align: middle; }
  .infoDotMark {
    display: inline-flex; align-items: center; justify-content: center;
    width: 19px; height: 19px; border-radius: 999px; border: 1.5px solid currentColor;
    font-size: 12px; font-weight: 700; line-height: 1; font-family: inherit;
    color: var(--text-muted); background: transparent;
    transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  }

  /* Groups the trend badge + corner "?" tooltip together in the
     top-right of a StatCard, instead of the badge sitting in the
     card body. The tooltip's own absolute top/right is neutralized
     so it sits inline next to the badge instead of re-anchoring
     to the card corner on its own. */
  .statCardCornerRow {
    position: absolute; top: 14px; right: 14px; z-index: 20;
    display: flex; align-items: center; gap: 8px;
  }
  .statCardCornerRow .cornerTooltipWrap { position: static; top: auto; right: auto; }

  .tooltipWrap:not(.clickTooltip):hover .infoDotMark, .tooltipWrap:not(.clickTooltip):focus .infoDotMark,
  .tooltipWrap.open .infoDotMark,
  .cornerTooltipWrap.open .cornerInfoDot {
    color: #fff; background: #2f6fed; border-color: #2f6fed;
    box-shadow: 0 0 0 4px rgba(47,111,237,0.18), 0 0 14px 2px rgba(47,111,237,0.45);
  }

  /* ===== Per-segment hover tooltip — used on the horizontal bar chart
     rows and on each individual color segment of the gender-split and
     food-security stacked bars. Block-level, centered over whichever
     segment is hovered, same navy styling as the other tooltips. ===== */
  .barTooltipWrap { position: relative; display: block; cursor: pointer; }
  .barTooltipWrap .barTooltipBubble {
    position: absolute; bottom: calc(100% + 9px); left: 50%; transform: translateX(-50%) translateY(4px);
    background: #16274d; color: #eef3ff; font-size: 12px; font-weight: 600; line-height: 1.5;
    padding: 12px 15px; border-radius: 10px; white-space: normal; text-align: left;
    width: max-content; max-width: 260px;
    opacity: 0; pointer-events: none; transition: opacity 0.15s ease, transform 0.15s ease;
    box-shadow: 0 10px 24px rgba(16,33,77,0.35); z-index: 70;
  }
  .barTooltipWrap .barTooltipBubble::after {
    content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
    border: 5px solid transparent; border-top-color: #16274d;
  }
  .barTooltipWrap.open .barTooltipBubble {
    opacity: 1; transform: translateX(-50%) translateY(0); pointer-events: auto;
  }
  .barTooltipWrap.open .barTrack { box-shadow: inset 0 0 0 1px rgba(16,24,40,0.1); }
  .barTooltipWrap.open .genderSplitFill,
  .barTooltipWrap.open .foodSplitFill { filter: brightness(1.08); }

  /* ===== Donut chart hover tooltip — shown centered over the ring when a
     segment is hovered. ===== */
  .donutHoverTip {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: #0f1e3d; border-radius: 8px; padding: 9px 13px;
    box-shadow: 0 14px 30px rgba(16,24,40,0.3); pointer-events: none; z-index: 30;
    display: flex; flex-direction: column; gap: 3px; white-space: nowrap;
  }
  .donutHoverTipLabel { font-size: 10.5px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; color: #7fb2ff; }
  .donutHoverTipValue { font-size: 12.5px; font-weight: 700; color: #eef3ff; }

  /* ===== Corner tooltip — big, card-level tooltip pinned to the
     top-right of its parent card (e.g. Survey Coverage). Styled to
     match the app's existing navy "info bubble" pattern. ===== */
  .cornerTooltipWrap { position: absolute; top: 14px; right: 14px; cursor: pointer; z-index: 20; }
  /* An open source popover must sit above chart hover tooltips in nearby cards. */
  .cornerTooltipWrap.open { z-index: 1000; }
  .cornerTooltipBubble {
    position: absolute; top: calc(100% + 10px); right: 0;
    width: min(280px, calc(100vw - 32px)); background: #0f1e3d; border-radius: 10px;
    padding: 14px 16px; box-shadow: 0 18px 40px rgba(16,24,40,0.3);
    opacity: 0; pointer-events: none; transform: translateY(6px);
    transition: opacity 0.15s ease, transform 0.15s ease; z-index: 1001; text-align: left;
  }
  .cornerTooltipWrap.open .cornerTooltipBubble {
    opacity: 1; transform: translateY(0); pointer-events: auto;
  }
  .cornerTooltipTitle {
    display: block; font-size: 11.5px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
    color: #7fb2ff; margin-bottom: 6px;
  }
  .cornerTooltipText { display: block; font-size: 12.5px; line-height: 1.55; color: #e7ecf7; font-weight: 500; }
  .cornerTooltipLink {
    display: inline-block; margin-top: 10px; font-size: 12px; font-weight: 700;
    color: #7fb2ff; text-decoration: underline; text-underline-offset: 2px;
  }
  .cornerTooltipLink:hover { color: #a8ccff; }
  .cornerTooltipLinks { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
  .cornerTooltipLinks .cornerTooltipLink { margin-top: 0; }

  .cornerTooltipFooter {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.12);
  }
  .cornerTooltipDots { display: flex; gap: 5px; }
  .cornerTooltipDot { width: 6px; height: 6px; border-radius: 999px; background: rgba(255,255,255,0.25); transition: background 0.2s ease; }
  .cornerTooltipDot.active { background: #7fb2ff; }
  .cornerTooltipNextBtn {
    display: inline-flex; align-items: center; gap: 4px;
    font-family: inherit; font-size: 11.5px; font-weight: 700; color: #6fa1ff;
    background: rgba(111,161,255,0.12); border: none; border-radius: 6px;
    padding: 5px 10px; cursor: pointer;
    transition: background 0.15s ease;
  }
  .cornerTooltipNextBtn:hover { background: rgba(111,161,255,0.22); }

  /* ===== KPI row ===== */
  .kpiGrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .statCard {
    position: relative;
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 18px; box-shadow: var(--shadow-sm); opacity: 0; transform: translateY(14px);
    z-index: 1;
    transition: opacity 0.5s ease, transform 0.5s ease, box-shadow 0.2s ease, border-color 0.2s ease,
      z-index 0s linear 0.2s;
  }
  /* Each animated KPI card creates its own stacking context because of its
     transform. Raise the whole card—not only the popover—while its source
     tooltip is open, so the popup can clear adjacent KPI cards. The
     z-index transition-delay is asymmetric on purpose: opening jumps to
     1000 immediately (delay 0s below), but closing waits 0.2s before
     dropping back to 1 — long enough to cover the bubble's own 0.15s
     fade-out, so a neighboring card can't paint over it mid-fade. */
  .statCard:has(.cornerTooltipWrap.open) {
    z-index: 1000;
    transition: opacity 0.5s ease, transform 0.5s ease, box-shadow 0.2s ease, border-color 0.2s ease,
      z-index 0s linear 0s;
  }
  .statCard.in:hover { box-shadow: 0 6px 18px rgba(16,24,40,0.12); border-color: var(--border-strong); }
  .statCard.in { opacity: 1; transform: translateY(0); }
  .statCardTop { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .statCardIcon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
  .statCardTrend { margin: -4px 0 4px; display: flex; }
  .statCardLabel { font-size: 12.5px; color: var(--text-secondary); margin-bottom: 4px; display: flex; align-items: center; }
  .statCardValue { font-size: 26px; font-weight: 800; letter-spacing: -0.01em; }
  .statCardSub { font-size: 11.5px; color: var(--text-muted); margin-top: 4px; }
  .trendBadge { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 700; padding: 3px 7px; border-radius: 999px; }
  .trendBadge.up { color: #0f9d58; background: #e4f8ef; }
  .trendBadge.down { color: #d93025; background: #fdecea; }

  /* ===== Overview panel ===== */
  .overviewGrid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; align-items: start; }
  .sectionCard { position: relative; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; box-shadow: var(--shadow-sm); }
  .overviewCard { position: relative; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px; box-shadow: var(--shadow-sm); }
  .overviewCard.glow-purple { background: linear-gradient(180deg, #ffffff 0%, #faf7ff 100%); }
  .overviewCardHead { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 20px; }
  .overviewCardIcon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: var(--blue-bg); color: var(--blue-text); flex-shrink: 0; }
  .overviewCardIcon.purple { background: #f2e9fb; color: #7c3aed; }
  .overviewCardIcon.blue { background: #e6f1fb; color: #185fa5; }
  .overviewCardTitle { font-size: 15px; font-weight: 700; }
  .overviewCardSub { font-size: 12.5px; color: var(--text-muted); margin-top: 2px; }

  .genderSplit { margin-bottom: 18px; }
  .genderSplitHead { display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; }
  .genderSplitHead .dot { width: 8px; height: 8px; border-radius: 999px; display: inline-block; margin-right: 5px; }
  .genderSplitTrack { display: flex; height: 14px; border-radius: 999px; overflow: visible; background: #f0f1f4; }
  .genderSplitTrack > .barTooltipWrap:first-child .genderSplitFill { border-radius: 999px 0 0 999px; }
  .genderSplitTrack > .barTooltipWrap:last-child .genderSplitFill { border-radius: 0 999px 999px 0; }
  .genderSplitFill { height: 100%; width: 100%; transition: filter 0.15s ease; }
  .genderSplitFill.male { background: linear-gradient(90deg,#2f6fed,#60a5fa); }
  .genderSplitFill.female { background: linear-gradient(90deg,#ec4899,#f9a8d4); }
  .miniStatRow { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .miniStat { background: #f8f8fb; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px; text-align: center; }
  .miniStatValue { font-size: 17px; font-weight: 800; }
  .miniStatLabel { font-size: 10.5px; color: var(--text-muted); margin-top: 2px; }
  .overviewInsight { margin-top: 14px; padding: 12px 14px; background: #f8f8fb; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 12.5px; color: var(--text-secondary); line-height: 1.55; }
  .overviewInsight strong { color: var(--text-primary); }

  .statGrid2x2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

  /* ===== Administrative Coverage ===== */
  .adminCardHead { padding-bottom: 6px; margin-bottom: 6px !important; border-bottom: 1px solid var(--border); }
  .adminRowList { display: flex; flex-direction: column; gap: 4px; }
  .adminRow { display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; border-radius: var(--radius-sm); }
  .adminRow:nth-child(odd) { background: #f8f8fb; }
  .adminRowLabel { font-size: 12.5px; color: var(--text-secondary); font-weight: 600; }
  .adminRowValue { font-size: 13px; font-weight: 800; color: var(--text-primary); }
  .adminRowTotal { border-top: 1px dashed var(--border-strong); margin-top: 0; padding-top: 6px; }
  .adminRowValuePill { font-size: 12px; font-weight: 800; color: var(--blue-text); background: var(--blue-bg); padding: 3px 10px; border-radius: 999px; }

  .utilityGrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .utilityCard {
    position: relative;
    border-radius: var(--radius-sm); padding: 18px; display: flex; align-items: center; gap: 14px;
    opacity: 0; transform: translateY(10px);
    transition: opacity 0.5s ease, transform 0.5s ease, box-shadow 0.2s ease;
  }
  .utilityCardTrend { position: absolute; top: 8px; right: 8px; }
  
  .utilityCard.in:hover { box-shadow: 0 6px 16px rgba(16,24,40,0.12); }
  .utilityCard.in { opacity: 1; transform: translateY(0); }
  .utilityCard.tone-yellow { background: #fefbe8; }
  .utilityCard.tone-teal { background: #e6fbf5; }
  .utilityCard.tone-blue { background: var(--blue-bg); }
  .utilityCard.tone-lavender { background: var(--purple-bg); }
  .utilityRingWrap { position: relative; width: 88px; height: 88px; flex-shrink: 0; }
  .utilityRingCenter { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); }
  .progressRingFill { transition: stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1); }
  .utilityCardText { min-width: 0; }
  .utilityCardLabelRow { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-bottom: 2px; }
  .utilityCardLabel { font-size: 12.5px; color: var(--text-secondary); }
  .utilityCardValue { font-size: 22px; font-weight: 800; }
  .utilityCardSub { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

  /* ===== Half-gauge charts (Demographics Snapshot) ===== */
  .gaugeGrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .gaugeCard { background: #f8f8fb; border-radius: var(--radius-sm); padding: 14px 10px 16px; text-align: center; }
  .gaugePctNearNumber {
    position: absolute; left: 50%; top: 52%; transform: translate(-50%, -100%);
    font-size: 12px; font-weight: 700; color: var(--text-muted);
  }
  .gaugeTrendNearNumber {
    position: absolute; left: 50%; top: 78%; transform: translate(-50%, 0);
    display: flex; justify-content: center;
  }
  .gaugeSvgWrap { position: relative; display: block; }
  .gaugeSvg { display: block; margin: 0 auto; }
  .gaugeArcFill { transition: stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1); }
  .gaugeValueText { font-size: 22px; font-weight: 800; fill: var(--text-primary); font-family: inherit; }
  .gaugeLabel { font-size: 11.5px; font-weight: 700; color: var(--text-primary); margin-top: 2px; }
    .gaugeLabelTop { margin: 0 0 6px; }
  .gaugeSub { font-size: 10.5px; color: var(--text-muted); margin-top: 2px; line-height: 1.4; }
  .gaugeHoverTip {
    position: absolute; top: 6px; left: 50%; transform: translateX(-50%);
    background: #16274d; color: #eef3ff; font-size: 11.5px; font-weight: 600; line-height: 1.4;
    padding: 8px 12px; border-radius: 8px; white-space: normal; text-align: center;
    width: max-content; max-width: 200px;
    box-shadow: 0 10px 24px rgba(16,33,77,0.35);
    pointer-events: none; z-index: 60;
  }

  .classList { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
  .classRow {
    display: flex; align-items: center; gap: 12px; border-radius: var(--radius-sm); padding: 12px 14px;
    opacity: 0; transform: translateX(-8px); transition: opacity 0.45s ease, transform 0.45s ease, box-shadow 0.2s ease;
  }
  .classRow.in:hover { box-shadow: 0 4px 14px rgba(16,24,40,0.10); }
  .classRow.in { opacity: 1; transform: translateX(0); }
  .classRow.tone-yellow { background: #fefbe8; }
  .classRow.tone-green { background: var(--green-bg); }
  .classRow.tone-red { background: #fdecea; }
  .classRowIcon { color: var(--text-secondary); flex-shrink: 0; }
  .classRowText { flex: 1; min-width: 0; }
  .classRowTitle { font-size: 13.5px; font-weight: 700; }
  .classRowSub { font-size: 11.5px; color: var(--text-muted); }
  .classRowPct { font-size: 12.5px; font-weight: 700; background: #fff; border-radius: 999px; padding: 3px 10px; }
  .classRowCount { font-size: 14px; font-weight: 800; }
  .classRowCount.tone-yellow { color: #c2650a; }
  .classRowCount.tone-green { color: var(--green); }
  .classRowCount.tone-red { color: var(--red); }

  .donutRow { display: flex; align-items: center; justify-content: space-between; gap: 28px; flex-wrap: nowrap; }
  .donutWrap { position: relative; width: 210px; height: 210px; flex-shrink: 0; }
  .donutCenter { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
  .donutCenterTrend { margin-top: 2px; }
  .donutCenterLabel { font-size: 11.5px; color: var(--text-muted); }
  .donutCenterValue { font-size: 27px; font-weight: 800; }
  .classDonutSeg { transition: stroke-dasharray 1.1s cubic-bezier(.16,1,.3,1); }
  .donutLegend { flex: 1; font-size: 13.5px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .donutLegend .dot { width: 10px; height: 10px; border-radius: 999px; display: inline-block; margin-right: 9px; }
  .donutLegendRow { display: flex; align-items: center; padding: 8px 10px; border-radius: var(--radius-sm); }
  .dot.yellow { background: #eab308; }
  .dot.blue { background: #2f6fed; }
  .dot.red { background: #e0392f; }

  .barChart { display: flex; flex-direction: column; gap: 14px; }
  .barChartLabel { font-size: 12.5px; color: var(--text-muted); margin-bottom: 4px; }
  .barRow { display: grid; grid-template-columns: 110px 1fr 34px; align-items: center; gap: 10px; }
  .barRowLabel { font-size: 11.5px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .barTrack { background: #f2f3f6; border-radius: 6px; height: 24px; overflow: hidden; transition: box-shadow 0.15s ease; }
  .barFill { height: 100%; border-radius: 6px; transition: width 1s cubic-bezier(.16,1,.3,1); }
  .barRowValue { font-size: 12.5px; font-weight: 700; text-align: right; }

  /* ===== Demographics / Livelihood teaser tiles ===== */
  .teaserGrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .teaserGrid2 { grid-template-columns: repeat(2, 1fr); }

  .livelihoodRows { display: flex; flex-direction: column; gap: 12px; height: 100%; }
  .livelihoodRow {
    display: flex; align-items: center; gap: 12px; flex: 1;
    background: #eefaf4; border-radius: var(--radius-sm);
    padding: 20px 18px;
  }
  .livelihoodRowText { flex: 1; min-width: 0; }
  .livelihoodRowLabel { font-size: 12px; color: var(--text-muted); }
  .livelihoodRowValue { font-size: 19px; font-weight: 800; margin-top: 3px; }
  .livelihoodRowStat { font-size: 19px; font-weight: 800; text-align: right; color: var(--text-primary); }
  .livelihoodRowStat span { display: block; font-size: 10.5px; font-weight: 600; color: var(--text-muted); }
  .teaserTile { background: #f8f8fb; border-radius: var(--radius-sm); padding: 14px; text-align: center; transition: box-shadow 0.2s ease, background 0.2s ease; }
  .teaserTile:hover { box-shadow: 0 4px 14px rgba(16,24,40,0.10); background: #f2f3f8; }
  .foodTeaserTile:hover { box-shadow: none; background: #f8f8fb; }
  .teaserTileIcon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; margin: 0 auto 9px; box-shadow: 0 3px 8px rgba(16,24,40,0.14); }
  .teaserValue { font-size: 19px; font-weight: 800; line-height: 1.2; }
  .teaserLabel { font-size: 11px; color: var(--text-muted); margin-top: 4px; line-height: 1.4; }

  /* ===== Safety & Food Security ===== */
  .foodSecurityRow { display: grid; grid-template-columns: 220px 1fr; gap: 20px; align-items: center; }
  .foodTeaserTile { height: 100%; display: flex; flex-direction: column; justify-content: center; }
  .foodSplitWrap { display: flex; flex-direction: column; gap: 10px; }
  .foodSplitTrack { display: flex; height: 16px; border-radius: 999px; overflow: visible; background: #f0f1f4; }
  .foodSplitTrack > .barTooltipWrap:first-child .foodSplitFill { border-radius: 999px 0 0 999px; }
  .foodSplitTrack > .barTooltipWrap:last-child .foodSplitFill { border-radius: 0 999px 999px 0; }
  .foodSplitFill { height: 100%; width: 100%; transition: filter 0.15s ease; }
  .foodSplitFill.secure { background: linear-gradient(90deg,#17a673,#22c55e); }
  .foodSplitFill.seasonal { background: linear-gradient(90deg,#eab308,#fbbf24); }
  .foodSplitFill.chronic { background: linear-gradient(90deg,#e0392f,#f87171); }
  .foodSplitLegend { display: flex; flex-wrap: wrap; gap: 14px; font-size: 12px; color: var(--text-secondary); }
  .foodSplitLegend .dot { width: 8px; height: 8px; border-radius: 999px; display: inline-block; margin-right: 5px; }

  /* ===== Community Priority Needs (Section G) ===== */
  .needLegend { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
  .needLegendItem {
    display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700;
    color: var(--text-primary); background: rgba(255,255,255,0.65); border-radius: 999px;
    padding: 6px 10px 6px 8px; cursor: help;
  }
  .needLegendItem .dot { width: 9px; height: 9px; border-radius: 999px; display: inline-block; flex-shrink: 0; }
  .needLegendItem .infoDot { margin-left: 1px; }

  .needList { display: flex; flex-direction: column; gap: 12px; }
  .needStackRow {
    display: grid; grid-template-columns: 200px 1fr; align-items: center; gap: 14px;
    opacity: 0; transform: translateX(-8px); transition: opacity 0.45s ease, transform 0.45s ease;
  }
  .needStackRow.in { opacity: 1; transform: translateX(0); }
  .needRowLabel { font-size: 12.5px; font-weight: 700; color: var(--text-primary); }
  .needStackTrack {
    display: flex; height: 18px; border-radius: 999px; overflow: visible;
    background: rgba(124,58,237,0.10);
  }
  .needStackTrack > .barTooltipWrap:first-child .needStackFill { border-radius: 999px 0 0 999px; }
  .needStackTrack > .barTooltipWrap:last-child .needStackFill { border-radius: 0 999px 999px 0; }
  .needStackFill { height: 100%; width: 100%; transition: filter 0.15s ease; }

  @media (max-width: 1200px) {
    .kpiGrid { grid-template-columns: repeat(2, 1fr); }
    .utilityGrid { grid-template-columns: repeat(2, 1fr); }
    .overviewGrid { grid-template-columns: 1fr; }
    .foodSecurityRow { grid-template-columns: 1fr; }
    .needStackRow { grid-template-columns: 1fr; row-gap: 6px; }
    .donutRow { flex-wrap: wrap; }
    .donutLegend { min-width: 220px; }
    .gaugeGrid { grid-template-columns: repeat(3, 1fr); }
  }

  @media (max-width: 640px) {
    .gaugeGrid { grid-template-columns: 1fr; }
  }
  
  .formNavItem { background: var(--blue); color: #fff; font-weight: 700; }
  .formNavItem svg { color: #fff; }
  .formNavItem:hover { background: var(--blue); filter: brightness(1.08); }
`;
