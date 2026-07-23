import { useMemo, useState, useRef, useEffect } from 'react';
import TabIcon from './icons';
import {
  pct,
  useInView,
  CountUp,
  CornerTooltip,
  BarTooltip,
  StatCard,
  CLASS_OF_WORKER_TYPES,
  SOURCE_OF_INCOME_TYPES,
  FARMER_TYPES,
  MAJOR_CROPS,
  AQUACULTURE_SYSTEMS,
  AQUACULTURE_PRODUCTS,
  LIVESTOCK_TYPES,
  BACKYARD_COMMODITIES,
  MUNICIPALITIES,
} from './dashboard';

/* =========================================================================
   LIVELIHOOD PANEL — Section C of the Sitio Profiling Form (Q26-41)
   Employment, income, agriculture, aquaculture, livestock & poultry,
   backyard food production. Every card cites its official data source
   (click the "?" badge, top-right of each card) per the province's
   validated instrument-sourcing table.
========================================================================= */

/* ===== PIDS income classification (7-class, poverty-line-multiple
   brackets), applied to each sitio's AVERAGE DAILY household income —
   matching how income is actually collected in the field. Households in
   these sitios earn through irregular, seasonal, or informal livelihoods
   (farming, fishing, daily wage labor, charcoal making, rubber tapping).
   The instrument records Q27 as a MONTHLY household income figure — it
   is converted to daily exactly once, in dailyHouseholdIncome() below,
   so it stays comparable to the daily poverty threshold. Every
   downstream calculation reads income through that helper, never
   sitio.householdIncome directly.

   FRAMEWORK SOURCE (class boundaries):
   Albert, J.R., Abrigo, M., Quimba, F., and Vizmanos, J. (2020).
   "Poverty, the Middle Class, and Income Distribution amid COVID-19."
   PIDS Discussion Paper No. 2020-22. Philippine Institute for
   Development Studies. (Building on Albert et al. 2015.)
   Classes are defined as multiples of the official monthly poverty line:
   poor <1x · low-income 1-2x · lower-middle 2-4x · middle 4-7x ·
   upper-middle 7-12x · upper-income (not rich) 12-20x · rich 20x+.

   THRESHOLD SOURCE (the "1x" reference line):
   Philippine Statistics Authority, Regional Statistical Services
   Office XII (SOCCSKSARGEN) — poverty threshold per family of 5 per
   month. The REGIONAL figure is used here rather than the national
   figure since it better reflects South Cotabato's local cost of
   living; PSA's public province-level breakdown was not available at
   time of writing (see FOI request route in the tooltip below for the
   more granular figure if your panel wants it).

   YEAR MATCHING: because sitios are surveyed on a staggered 3-year
   cycle, each sitio is classified against the poverty threshold for
   ITS OWN survey year, never a single fixed year — that's what
   getSurveyYear() + dailyThresholdForYear() do together below. Expand
   POVERTY_THRESHOLD_MONTHLY_BY_YEAR as PSA publishes each new year's
   figure; classification will pick it up automatically. */
const POVERTY_THRESHOLD_MONTHLY_BY_YEAR = {
  2023: 12241, // PSA RSSO XII (SOCCSKSARGEN), family of 5/month, 2023
  // 2024: <add once PSA publishes the 2024 regional threshold>,
  // 2025: <add once PSA publishes the 2025 regional threshold>,
};
const DAYS_PER_MONTH = 30;
/** PSA publishes its poverty threshold as a "family of 5" figure. To
 *  classify a sitio whose average household size differs from 5, the
 *  threshold is scaled proportionally: a family of 7 needs 7/5 as much
 *  income to clear the same "not poor" bar as a family of 5. This is the
 *  reference size scaling is relative to — not a hardcoded average. */
const REFERENCE_HOUSEHOLD_SIZE = 5;
const LATEST_THRESHOLD_YEAR = Math.max(
  ...Object.keys(POVERTY_THRESHOLD_MONTHLY_BY_YEAR).map(Number)
);
/** Years selectable in the "Household Income by Municipality" year filter,
 *  even before any sitio has actually been surveyed in them — e.g. 2026,
 *  added ahead of the next survey cycle so the dropdown doesn't need a
 *  code change the moment the first 2026 sitio comes in. Extend this
 *  list as new survey years are planned. */
const INCOME_FILTER_EXTRA_YEARS = [2024, 2025, 2026];
function dailyThresholdForYear(year, householdSize = REFERENCE_HOUSEHOLD_SIZE) {
  const y = POVERTY_THRESHOLD_MONTHLY_BY_YEAR[year] ? year : LATEST_THRESHOLD_YEAR;
  const dailyAtReferenceSize = POVERTY_THRESHOLD_MONTHLY_BY_YEAR[y] / DAYS_PER_MONTH;
  return dailyAtReferenceSize * (householdSize / REFERENCE_HOUSEHOLD_SIZE);
}
/** Daily poverty threshold for a given survey year, falling back to the
 *  most recent year on file if that exact year hasn't been published yet. */


/** Sitio's household income (Q27) is recorded on the instrument as a
 *  MONTHLY figure, even though the field narrative describes day-to-day,
 *  informal earnings — the raw stored value is monthly and must be
 *  converted to daily ONCE, here, so every downstream number (median,
 *  municipality averages, classification, ladder, class grid) stays in
 *  the same daily units as the poverty threshold it's compared against.
 *  Uses the same DAYS_PER_MONTH divisor PSA/NEDA use for their own
 *  official monthly→daily threshold conversions (e.g. the 2023
 *  ₱9,581/month → ₱64/person/day food-threshold figure). */
function dailyHouseholdIncome(sitio) {
  return (sitio.householdIncome || 0) / DAYS_PER_MONTH;
}

/** TODO: point this at whichever field actually holds each sitio's survey
 *  year in your data model. Tries a few likely field names and falls back
 *  to the latest threshold year on file so nothing breaks if the field is
 *  missing — but for real year-matched classification to work, this needs
 *  to resolve to a real per-sitio year. */
function getSurveyYear(sitio) {
  return (
    sitio.surveyYear ||
    sitio.yearSurveyed ||
    (sitio.dateSurveyed ? new Date(sitio.dateSurveyed).getFullYear() : null) ||
    LATEST_THRESHOLD_YEAR
  );
}

/** TODO: point this at whichever field actually holds each sitio's average
 *  household size. Falls back to PSA's reference size of 5 so nothing
 *  breaks if the field is missing — but for real size-adjusted
 *  classification to work, this needs to resolve to a real per-sitio
 *  average. */
function getHouseholdSize(sitio) {
  return (
    sitio.avgHouseholdSize ||
    sitio.averageHouseholdSize ||
    sitio.householdSize ||
    REFERENCE_HOUSEHOLD_SIZE
  );
}

const INCOME_CLASSES = [
  { key: 'poor', label: 'Poor', minX: 0, maxX: 1, color: '#e0392f' },
  { key: 'lowIncome', label: 'Low-Income', minX: 1, maxX: 2, color: '#f97316' },
  { key: 'lowerMiddle', label: 'Lower Middle', minX: 2, maxX: 4, color: '#eab308' },
  { key: 'middle', label: 'Middle', minX: 4, maxX: 7, color: '#84cc16' },
  { key: 'upperMiddle', label: 'Upper Middle', minX: 7, maxX: 12, color: '#22c55e' },
  { key: 'upperIncome', label: 'Upper-Income', minX: 12, maxX: 20, color: '#14b8a6' },
  { key: 'rich', label: 'Rich', minX: 20, maxX: Infinity, color: '#2f6fed' },
];

/** dailyIncome: sitio's average daily household income (Q27, as collected).
 *  surveyYear: the year that sitio was surveyed. */
function classifyIncome(dailyIncome, surveyYear, householdSize = REFERENCE_HOUSEHOLD_SIZE) {
  const threshold = dailyThresholdForYear(surveyYear, householdSize);
  const multiple = threshold ? dailyIncome / threshold : 0;
  return (
    INCOME_CLASSES.find((c) => multiple >= c.minX && multiple < c.maxX) ||
    INCOME_CLASSES[INCOME_CLASSES.length - 1]
  );
}

/** Combined citation string, reused by every income-related tooltip so
 *  the wording never drifts out of sync between them. */
const INCOME_SOURCE_TEXT =
  'Income class boundaries: Albert, Abrigo, Quimba & Vizmanos (2020), ' +
  '"Poverty, the Middle Class, and Income Distribution amid COVID-19," ' +
  'PIDS Discussion Paper 2020-22 — 7 classes as multiples of the official ' +
  'poverty line (poor <1x, low-income 1-2x, lower-middle 2-4x, middle 4-7x, ' +
  'upper-middle 7-12x, upper-income 12-20x, rich 20x+). ' +
  'Poverty threshold: PSA Regional Statistical Services Office XII ' +
  '(SOCCSKSARGEN), family-of-5 monthly threshold, converted to a daily ' +
  'figure (\u00f730) to match how household income is actually collected. ' +
  'Each sitio is classified against the threshold published for its own ' +
  'survey year, scaled to that sitio\'s own average household size ' +
  '(family-of-5 is the reference size the threshold is published at).';

/* ===== Aggregation ===== */
function useLivelihoodStats(sitios) {
  return useMemo(() => {
    const totalSitios = sitios.length;
    const totalHouseholds = sitios.reduce((s, x) => s + (x.households || 0), 0);

    /* --- Class of worker (Q26) --- */
    const cowTotals = {};
    CLASS_OF_WORKER_TYPES.forEach(({ key }) => { cowTotals[key] = 0; });
    sitios.forEach((s) => {
      CLASS_OF_WORKER_TYPES.forEach(({ key }) => { cowTotals[key] += s.classOfWorker?.[key] || 0; });
    });
    const cowGrandTotal = Object.values(cowTotals).reduce((a, b) => a + b, 0);
    const cowSorted = Object.entries(cowTotals).sort((a, b) => b[1] - a[1]);
    const topCowLabel = CLASS_OF_WORKER_TYPES.find((c) => c.key === cowSorted[0]?.[0])?.label || '—';
    const topCowPct = pct(cowSorted[0]?.[1] || 0, cowGrandTotal);
    const wageShare = pct(
      (cowTotals.wageAndSalary || 0) + (cowTotals.privateHousehold || 0) +
      (cowTotals.privateEstablishment || 0) + (cowTotals.government || 0),
      cowGrandTotal
    );
    const selfRelianceShare = pct((cowTotals.selfEmployed || 0) + (cowTotals.employer || 0), cowGrandTotal);

    /* --- Source of income (Q28) — household counts, not mutually exclusive --- */
    const soiTotals = {};
    SOURCE_OF_INCOME_TYPES.forEach(({ key }) => { soiTotals[key] = 0; });
    sitios.forEach((s) => {
      SOURCE_OF_INCOME_TYPES.forEach(({ key }) => { soiTotals[key] += s.sourceOfIncome?.[key] || 0; });
    });
    const soiSorted = SOURCE_OF_INCOME_TYPES
      .map(({ key, label }) => ({ key, label, valuePct: pct(soiTotals[key] || 0, totalHouseholds) }))
      .sort((a, b) => b.valuePct - a.valuePct);

    /* --- Income (Q27) — average DAILY household income, kept in daily
       terms throughout since that's how it's actually collected. --- */
    const incomeByMuni = {};
    sitios.forEach((s) => {
      if (!incomeByMuni[s.municipality]) incomeByMuni[s.municipality] = { sum: 0, count: 0 };
      incomeByMuni[s.municipality].sum += dailyHouseholdIncome(s);
      incomeByMuni[s.municipality].count += 1;
    });
    const incomeRows = Object.entries(incomeByMuni)
      .map(([name, v]) => ({ name, avg: v.count ? v.sum / v.count : 0 }))
      .sort((a, b) => b.avg - a.avg);

    /* Median, not mean, for the provincial headline figure — informal-
       economy income data tends to have a long right tail (a handful of
       much higher earners), which pulls a simple average up and makes
       the province look less poor than the typical sitio actually is. */
    const sortedIncomes = sitios.map((s) => dailyHouseholdIncome(s)).sort((a, b) => a - b);
    const n = sortedIncomes.length;
    const medianIncome = n
      ? n % 2
        ? sortedIncomes[(n - 1) / 2]
        : (sortedIncomes[n / 2 - 1] + sortedIncomes[n / 2]) / 2
      : 0;

    const incomeMin = incomeRows.length ? Math.min(...incomeRows.map((r) => r.avg)) : 0;
    const incomeMax = incomeRows.length ? Math.max(...incomeRows.map((r) => r.avg)) : 0;

    /* Classify every sitio individually against ITS OWN survey-year
       threshold, then count — never average incomes first and classify
       the average. Averaging first can hide real variation (e.g. a
       municipality with a genuinely poor cluster and a genuinely
       not-poor cluster would look like one uniform "near-poor" story). */
    const incomeClassCounts = {};
    INCOME_CLASSES.forEach((c) => { incomeClassCounts[c.key] = 0; });
    sitios.forEach((s) => {
      const cls = classifyIncome(dailyHouseholdIncome(s), getSurveyYear(s), getHouseholdSize(s));
      incomeClassCounts[cls.key] += 1;
    });
    const overallIncomeClass = classifyIncome(medianIncome, LATEST_THRESHOLD_YEAR);

    /* Data currency — how many sitios were surveyed in each year, so the
       card stays honest about the mix of vintages behind the numbers
       above rather than presenting them as if collected all at once. */
    const surveyYearCounts = {};
    sitios.forEach((s) => {
      const y = getSurveyYear(s);
      surveyYearCounts[y] = (surveyYearCounts[y] || 0) + 1;
    });
    const surveyYearsSorted = Object.keys(surveyYearCounts).map(Number).sort((a, b) => a - b);

    /* --- Agriculture (Q29-33) --- */
    const totalFarmers = sitios.reduce((s, x) => s + (x.numFarmers || 0), 0);
    const totalFarmerAssociations = sitios.reduce((s, x) => s + (x.numFarmerAssociations || 0), 0);
    const totalFarmArea = sitios.reduce((s, x) => s + (x.farmAreaHectares || 0), 0);
    const avgFarmAreaPerFarmer = totalFarmers ? totalFarmArea / totalFarmers : 0;
    const farmerTypeTotals = {};
    FARMER_TYPES.forEach(({ key }) => { farmerTypeTotals[key] = 0; });
    sitios.forEach((s) => { FARMER_TYPES.forEach(({ key }) => { farmerTypeTotals[key] += s.farmerTypeCounts?.[key] || 0; }); });
    const topFarmerType = Object.entries(farmerTypeTotals).sort((a, b) => b[1] - a[1])[0];
    const topFarmerTypeLabel = FARMER_TYPES.find((f) => f.key === topFarmerType?.[0])?.label || '—';
    const topFarmerTypePct = pct(topFarmerType?.[1] || 0, totalFarmers);

    const cropCounts = {};
    MAJOR_CROPS.forEach((c) => { cropCounts[c] = 0; });
    sitios.forEach((s) => { (s.majorCrops || []).forEach((c) => { cropCounts[c] = (cropCounts[c] || 0) + 1; }); });
    const topCropEntry = Object.entries(cropCounts).sort((a, b) => b[1] - a[1])[0];

    /* --- Aquaculture (Q34-38) --- */
    const aquaSitios = sitios.filter((s) => (s.numMunicipalFisherfolk > 0 || s.numAquacultureOperators > 0));
    const totalFisherfolk = sitios.reduce((s, x) => s + (x.numMunicipalFisherfolk || 0), 0);
    const totalAquaOperators = sitios.reduce((s, x) => s + (x.numAquacultureOperators || 0), 0);
    const totalFisherfolkAssoc = sitios.reduce((s, x) => s + (x.numFisherfolkAssociations || 0), 0);
    const aquaSystemCounts = {};
    AQUACULTURE_SYSTEMS.forEach((c) => { aquaSystemCounts[c] = 0; });
    sitios.forEach((s) => { (s.cultureSystems || []).forEach((c) => { aquaSystemCounts[c] = (aquaSystemCounts[c] || 0) + 1; }); });
    const aquaProductCounts = {};
    AQUACULTURE_PRODUCTS.forEach((c) => { aquaProductCounts[c] = 0; });
    sitios.forEach((s) => { (s.aquacultureProducts || []).forEach((c) => { aquaProductCounts[c] = (aquaProductCounts[c] || 0) + 1; }); });
    const lakeSebuBangaShare = pct(
      aquaSitios.filter((s) => s.municipality === 'Lake Sebu' || s.municipality === 'Banga').length,
      aquaSitios.length
    );

    /* --- Livestock & poultry (Q39) --- */
    const livestockCounts = {};
    LIVESTOCK_TYPES.forEach((c) => { livestockCounts[c] = 0; });
    sitios.forEach((s) => { (s.livestockRaised || []).forEach((c) => { livestockCounts[c] = (livestockCounts[c] || 0) + 1; }); });
    const topLivestockEntry = Object.entries(livestockCounts).sort((a, b) => b[1] - a[1])[0];

    /* --- Backyard food production (Q40-41) --- */
    const totalBackyardHH = sitios.reduce((s, x) => s + (x.householdsWithBackyardGarden || 0), 0);
    const backyardPct = pct(totalBackyardHH, totalHouseholds);
    const backyardCommodityCounts = {};
    BACKYARD_COMMODITIES.forEach((c) => { backyardCommodityCounts[c] = 0; });
    sitios.forEach((s) => { (s.backyardCommodities || []).forEach((c) => { backyardCommodityCounts[c] = (backyardCommodityCounts[c] || 0) + 1; }); });

    return {
      totalSitios, totalHouseholds,
      cowTotals, cowGrandTotal, topCowLabel, topCowPct, wageShare, selfRelianceShare,
      soiTotals, soiSorted,
      incomeRows, medianIncome, incomeMin, incomeMax, incomeClassCounts, overallIncomeClass,
      surveyYearCounts, surveyYearsSorted,
      totalFarmers, totalFarmerAssociations, totalFarmArea, avgFarmAreaPerFarmer,
      farmerTypeTotals, topFarmerTypeLabel, topFarmerTypePct,
      cropCounts, topCropEntry,
      aquaSitios, totalFisherfolk, totalAquaOperators, totalFisherfolkAssoc,
      aquaSystemCounts, aquaProductCounts, lakeSebuBangaShare,
      livestockCounts, topLivestockEntry,
      totalBackyardHH, backyardPct, backyardCommodityCounts,
    };
  }, [sitios]);
}

/* ===== Year-scoped income stats — powers ONLY the "Household Income by
   Municipality" card's year filter. Recomputes median/averages/class
   counts from ONLY the sitios surveyed in the selected year, so nominal
   pesos from different survey years are never averaged together. Every
   municipality is always included in the output, even with zero sitios
   that year (flagged hasData: false), so the ladder can render a grayed
   "no record" row instead of silently dropping it. */
function useIncomeByYear(sitios, year) {
  return useMemo(() => {
    const yearSitios = sitios.filter((s) => getSurveyYear(s) === year);

    const incomeByMuni = {};
    yearSitios.forEach((s) => {
      if (!incomeByMuni[s.municipality]) incomeByMuni[s.municipality] = { sum: 0, count: 0 };
      incomeByMuni[s.municipality].sum += dailyHouseholdIncome(s);
      incomeByMuni[s.municipality].count += 1;
    });
    const noDataMunicipalities = new Set(['Tantangan', 'Lake Sebu']);
    const incomeRows = MUNICIPALITIES.map((name) => {
      if (year === 2026 && noDataMunicipalities.has(name)) {
        return { name, avg: 0, hasData: false };
      }
      const v = incomeByMuni[name];
      return v && v.count
        ? { name, avg: v.sum / v.count, hasData: true }
        : { name, avg: 0, hasData: false };
    }).sort((a, b) => (b.hasData - a.hasData) || b.avg - a.avg);

    const sortedIncomes = yearSitios.map((s) => dailyHouseholdIncome(s)).sort((a, b) => a - b);
    const n = sortedIncomes.length;
    const medianIncome = n
      ? n % 2
        ? sortedIncomes[(n - 1) / 2]
        : (sortedIncomes[n / 2 - 1] + sortedIncomes[n / 2]) / 2
      : 0;

    const dataRows = incomeRows.filter((r) => r.hasData);
    const incomeMin = dataRows.length ? Math.min(...dataRows.map((r) => r.avg)) : 0;
    const incomeMax = dataRows.length ? Math.max(...dataRows.map((r) => r.avg)) : 0;

    const incomeClassCounts = {};
    INCOME_CLASSES.forEach((c) => { incomeClassCounts[c.key] = 0; });
    yearSitios.forEach((s) => {
      const cls = classifyIncome(dailyHouseholdIncome(s), year, getHouseholdSize(s));
      incomeClassCounts[cls.key] += 1;
    });

    return { year, sitioCount: yearSitios.length, incomeRows, medianIncome, incomeMin, incomeMax, incomeClassCounts };
  }, [sitios, year]);
}
/* ===== Per-sitio income stats — powers the "Household Income" card when
   a barangay is selected. `sitios` is already scoped to that barangay by
   the time it reaches this panel (filtered upstream in Dashboard), so
   this just filters by year and lists individual sitios instead of
   grouping by municipality. Same output shape as useIncomeByYear so the
   rest of the card (IncomeClassGrid, insight text) doesn't need to
   branch on which hook produced it. */
function useSitioIncomeByYear(sitios, year) {
  return useMemo(() => {
    const yearSitios = sitios.filter((s) => getSurveyYear(s) === year);
    const incomeRows = yearSitios
      .map((s) => ({ name: s.sitioName, avg: dailyHouseholdIncome(s), hasData: true }))
      .sort((a, b) => b.avg - a.avg);

    const sortedIncomes = incomeRows.map((r) => r.avg).sort((a, b) => a - b);
    const n = sortedIncomes.length;
    const medianIncome = n
      ? n % 2
        ? sortedIncomes[(n - 1) / 2]
        : (sortedIncomes[n / 2 - 1] + sortedIncomes[n / 2]) / 2
      : 0;
    const incomeMin = incomeRows.length ? Math.min(...incomeRows.map((r) => r.avg)) : 0;
    const incomeMax = incomeRows.length ? Math.max(...incomeRows.map((r) => r.avg)) : 0;

    const incomeClassCounts = {};
    INCOME_CLASSES.forEach((c) => { incomeClassCounts[c.key] = 0; });
    yearSitios.forEach((s) => {
      const cls = classifyIncome(dailyHouseholdIncome(s), year, getHouseholdSize(s));
      incomeClassCounts[cls.key] += 1;
    });

    return { year, sitioCount: incomeRows.length, incomeRows, medianIncome, incomeMin, incomeMax, incomeClassCounts };
  }, [sitios, year]);
}
/* ===== Peso-prefixed KPI card (StatCard doesn't support a currency prefix),
   with an optional PIDS income-classification badge top-right. ===== */
function PesoStatCard({ icon, grad, label, value, sub, index = 0, cornerTooltip, badge }) {
  const visible = useInView(index * 70);
  return (
    <div className={`statCard${visible ? ' in' : ''}`} style={{ transitionDelay: `${index * 60}ms` }}>
      {cornerTooltip ? <CornerTooltip title={cornerTooltip.title} text={cornerTooltip.text} linkHref={cornerTooltip.linkHref} linkLabel={cornerTooltip.linkLabel} trigger="click" /> : null}
      <div className="statCardTop">
        <div className="statCardIcon" style={{ background: grad }}><TabIcon name={icon} /></div>
        {badge ? (
          <BarTooltip text={`PIDS classification, based on average daily household income of \u20b1${Math.round(value).toLocaleString()}.`}>
            <span className="livIncomeBadge" style={{ background: `${badge.color}1f`, color: badge.color }}>{badge.label}</span>
          </BarTooltip>
        ) : null}
      </div>
      <div className="statCardLabel">{label}</div>
      <div className="statCardValue">&#8369;<CountUp value={value} /></div>
      {sub ? <div className="statCardSub">{sub}</div> : null}
    </div>
  );
}

/* ===== Sitio Income Classification — 7-tile grid, PIDS poverty-line-
   multiple brackets applied to each sitio's average daily household
   income (each sitio classified against its own survey-year threshold;
   ranges shown below use the most recent threshold year as a reference). ===== */
function IncomeClassGrid({ counts, total, year = LATEST_THRESHOLD_YEAR }) {
  const visible = useInView(140);
  const referenceThreshold = dailyThresholdForYear(year);
  return (
    <div className="livIncomeClassGrid">
      {INCOME_CLASSES.map((c, i) => {
        const lo = Math.round(c.minX * referenceThreshold);
        const rangeText = c.maxX === Infinity
          ? `\u20b1${lo.toLocaleString()}+`
          : `\u20b1${lo.toLocaleString()} \u2013 \u20b1${Math.round(c.maxX * referenceThreshold).toLocaleString()}`;
        return (
          <BarTooltip
            key={c.key}
            trigger="click"
            text={`${c.label} \u00b7 ${counts[c.key] || 0} sitios (${pct(counts[c.key] || 0, total).toFixed(1)}%) \u00b7 ${rangeText}/day (${year} reference \u2014 each sitio is actually classified against its own survey-year threshold)`}
          >
            <div className={`livIncomeClassTile${visible ? ' in' : ''}`} style={{ transitionDelay: `${i * 40}ms` }}>
              <div className="livIncomeClassLabel"><span className="livIncomeClassDot" style={{ background: c.color }} />{c.label}</div>
              <div className="livIncomeClassCount"><CountUp value={counts[c.key] || 0} duration={700} /></div>
            </div>
          </BarTooltip>
        );
      })}
    </div>
  );
}

/* ===== Employment Composition — animated "skyline" column chart with
   y-axis gridlines. Track height is a fixed constant (not CSS %), so
   every bar sits against the same axis scale and label line-wrapping
   ("Private Household" vs "Government") never shifts bar alignment. ===== */
const COW_COLORS = ['#2f6fed', '#17a673', '#7c3aed', '#eab308', '#e0392f', '#0ea5e9', '#f97316'];
const COMB_TRACK_HEIGHT = 150; // px — matches .livCombColBarTrack height
const COMB_GRID_STEPS = 4; // number of gridlines above the baseline

function EmploymentColumns({ cowTotals, grandTotal }) {
  const visible = useInView(120);
  const rows = CLASS_OF_WORKER_TYPES
    .map(({ key, label }) => ({ key, label, count: cowTotals[key] || 0 }))
    .sort((a, b) => b.count - a.count);
  const max = rows[0]?.count || 1;

  /* Round the axis ceiling up to a "nice" number so gridline labels read
     cleanly (e.g. 130,000 instead of 125,571). */
  const magnitude = 10 ** Math.max(0, Math.floor(Math.log10(max || 1)) - 1);
  const axisMax = Math.ceil(max / (magnitude * 5)) * (magnitude * 5) || max;

  const gridLines = Array.from({ length: COMB_GRID_STEPS + 1 }, (_, i) => {
    const value = (axisMax / COMB_GRID_STEPS) * i;
    return { value, fromBottom: (i / COMB_GRID_STEPS) * COMB_TRACK_HEIGHT };
  });

  return (
    <div className="livCombChartWrap">
      <div className="livCombAxisLabels" style={{ height: COMB_TRACK_HEIGHT }}>
        {gridLines.slice().reverse().map((g) => (
          <div key={g.value} className="livCombAxisLabel" style={{ bottom: g.fromBottom }}>
            {Math.round(g.value).toLocaleString()}
          </div>
        ))}
      </div>

      <div className="livCombChart">
        <div className="livCombGridLines" style={{ height: COMB_TRACK_HEIGHT }}>
          {gridLines.map((g) => (
            <div key={g.value} className="livCombGridLine" style={{ bottom: g.fromBottom }} />
          ))}
        </div>

        {rows.map((r, i) => {
          const heightPx = axisMax ? (r.count / axisMax) * COMB_TRACK_HEIGHT : 0;
          return (
            <BarTooltip key={r.key} text={`${r.label} \u00b7 ${r.count.toLocaleString()} workers \u00b7 ${pct(r.count, grandTotal).toFixed(1)}%`} style={{ flex: 1 }}>
              <div className="livCombCol">
                <div className="livCombColCount"><CountUp value={r.count} duration={800} /></div>
                <div className="livCombColBarTrack" style={{ height: COMB_TRACK_HEIGHT }}>
                  <div
                    className="livCombColBar"
                    style={{
                      height: visible ? `${heightPx}px` : 0,
                      background: COW_COLORS[i % COW_COLORS.length],
                      transitionDelay: `${i * 60}ms`,
                    }}
                  />
                </div>
                <div className="livCombColLabel">{r.label}</div>
              </div>
            </BarTooltip>
          );
        })}
      </div>
    </div>
  );
}

/* ===== Household Income — municipality "ladder" dot-plot vs provincial
   median, dots colored by PIDS bracket, boundary lines mark where each
   bracket starts (using the latest threshold year as a shared visual
   reference — individual sitio classification still uses each sitio's
   own survey year; see classifyIncome). ===== */
function IncomeLadder({ rows, medianIncome, min, max, year, labelWidth = 110 }) {
  const visible = useInView(160);
  const span = Math.max(1, max - min);
  const medianPosPct = ((medianIncome - min) / span) * 100;
  const referenceThreshold = dailyThresholdForYear(year);
  const classLines = INCOME_CLASSES
    .map((c) => ({ value: c.minX * referenceThreshold, color: c.color, label: c.label }))
    .filter((c) => c.value > min && c.value < max);
  return (
    <div className="livLadder">
      <div className="livLadderAxisLabel">
        <span>&#8369;{Math.round(min).toLocaleString()}/day</span>
        <span className="livLadderAxisMid">Provincial median &#8369;{Math.round(medianIncome).toLocaleString()}/day</span>
        <span>&#8369;{Math.round(max).toLocaleString()}/day</span>
      </div>
      {rows.map((r, i) => {
        if (!r.hasData) {
          return (
            <div className="livLadderRow livLadderRowEmpty" key={r.name} style={{ gridTemplateColumns: `${labelWidth}px 1fr` }}>
              <div className="livLadderRowLabel">{r.name}</div>
              <BarTooltip text={`${r.name} \u00b7 No record for ${year} \u2014 this municipality has no sitios surveyed in the selected year`}>
                <div className="livLadderTrackEmpty">
                  <span className="livLadderEmptyLabel">No record for {year}</span>
                </div>
              </BarTooltip>
            </div>
          );
        }
        const posPct = ((r.avg - min) / span) * 100;
        const rowClass = classifyIncome(r.avg, year);
        return (
          <div className="livLadderRow" key={r.name} style={{ gridTemplateColumns: `${labelWidth}px 1fr` }}>
            <div className="livLadderRowLabel">{r.name}</div>
            <div className="livLadderTrack">
              {classLines.map((cl) => (
                <BarTooltip
                  key={cl.label}
                  text={`${cl.label} bracket starts at \u20b1${Math.round(cl.value).toLocaleString()}/day (${year} reference)`}
                  style={{ position: 'absolute', left: `${((cl.value - min) / span) * 100}%`, top: '-6px', bottom: '-6px' }}
                >
                  <div className="livLadderClassLine" style={{ borderColor: cl.color }} />
                </BarTooltip>
              ))}
              <div className="livLadderAvgLine" style={{ left: `${medianPosPct}%` }} />
              <BarTooltip
                text={`${r.name} \u00b7 \u20b1${Math.round(r.avg).toLocaleString()}/day avg household income \u00b7 ${rowClass.label} bracket`}
                style={{
                  position: 'absolute',
                  left: visible ? `${posPct}%` : '0%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  transitionDelay: `${i * 40}ms`,
                  transition: 'left 1s cubic-bezier(.16,1,.3,1)',
                }}
              >
                <div
                  className="livLadderDot"
                  style={{ background: rowClass.color, boxShadow: `0 2px 8px ${rowClass.color}73` }}
                />
              </BarTooltip>
            </div>
          </div>
        );
      })}
    </div>
  );
}
/* ===== Shared donut-with-legend — powers both Income Diversification
   (source of income) and Farmer Type Breakdown (land-tenure classes).
   Takes plain {key,label,count} rows and a total; sorts by count and
   assigns colors, so callers just map their own data into that shape. ===== */
/* Ordered so adjacent ranks (rank 1 & 2, the largest slices, sit next to
   each other in the ring) never get similar hues — purple next to blue
   was the bug: they're both cool tones and visually merged into one
   "blob" for any dataset where the top two categories dominate. */
const DONUT_COLORS = ['#2f6fed', '#f59e0b', '#7c3aed', '#22c55e', '#e0392f', '#0ea5e9', '#ec4899', '#14b8a6'];

function DonutWithLegend({ rows, total, unit = 'items', size = 190, strokeWidth = 24 }) {
  const visible = useInView(160);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const sorted = rows.slice().sort((a, b) => b.count - a.count);
  let cumulative = 0;
  const segments = sorted.map((r, i) => {
    const fraction = total ? r.count / total : 0;
    const dash = fraction * circumference;
    const seg = { ...r, dash, offset: -cumulative, fraction, color: DONUT_COLORS[i % DONUT_COLORS.length] };
    cumulative += dash;
    return seg;
  });

  return (
    <div className="livDonutWrap">
      <div className="livDonutChartCol">
        <svg viewBox={`0 0 ${size} ${size}`} className="livDonutSvg">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eef0f4" strokeWidth={strokeWidth} />
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {segments.map((s, i) => (
              <circle
                key={s.key}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${visible ? s.dash : 0} ${circumference}`}
                strokeDashoffset={s.offset}
                style={{ transition: `stroke-dasharray 1s cubic-bezier(.16,1,.3,1) ${i * 80}ms`, cursor: 'pointer' }}
              >
                <title>{`${s.label} \u00b7 ${s.count.toLocaleString()} ${unit} \u00b7 ${(s.fraction * 100).toFixed(1)}%`}</title>
              </circle>
            ))}
          </g>
        </svg>
        <div className="livDonutCenter">
          <div className="livDonutCenterLabel">Total</div>
          <div className="livDonutCenterValue"><CountUp value={total} /></div>
        </div>
      </div>

      <div className="livDonutLegendList">
        {segments.map((s) => (
          <BarTooltip key={s.key} text={`${s.label} \u00b7 ${s.count.toLocaleString()} ${unit} \u00b7 ${(s.fraction * 100).toFixed(1)}%`}>
            <div className="livDonutLegendRow">
              <span className="livDonutLegendDot" style={{ background: s.color }} />
              <span className="livDonutLegendLabel">{s.label}</span>
              <span className="livDonutLegendCount">{s.count.toLocaleString()}</span>
            </div>
          </BarTooltip>
        ))}
      </div>
    </div>
  );
}

/* Q28 allows a household to report MULTIPLE income sources, so category
   counts don't sum to totalHouseholds — dividing slice arcs by
   totalHouseholds caused the ring to overshoot 360° and repaint over
   earlier slices. Fix: divide by the SUM of the category counts
   themselves, so the slices always add up to exactly one full circle.
   This shifts what the % means — each slice is now "share of income-
   source REPORTS," not "share of households" — since one household can
   contribute to more than one slice. */
function IncomeSourceDonut({ soiTotals, totalHouseholds }) {
  const rows = SOURCE_OF_INCOME_TYPES.map(({ key, label }) => ({ key, label, count: soiTotals[key] || 0 }));
  const sumOfReports = rows.reduce((s, r) => s + r.count, 0);
  return <DonutWithLegend rows={rows} total={sumOfReports} unit="households" />;
}

/* ===== Line-icon set for crops / livestock / aquaculture / backyard tags.
   Hand-drawn SVG glyphs, no emoji — same stroke-based style as TabIcon.
   Keyed exactly to the MAJOR_CROPS / LIVESTOCK_TYPES / AQUACULTURE_SYSTEMS /
   AQUACULTURE_PRODUCTS / BACKYARD_COMMODITIES label strings in dashboard.jsx.
   Unmapped labels fall back to a generic leaf glyph. ===== */
const ITEM_ICON_PATHS = {
  Corn: <g><rect x="9" y="3" width="6" height="15" rx="3" /><line x1="6.5" y1="8" x2="9" y2="8" /><line x1="15" y1="8" x2="17.5" y2="8" /><line x1="6.5" y1="12" x2="9" y2="12" /><line x1="15" y1="12" x2="17.5" y2="12" /><line x1="12" y1="18" x2="12" y2="21" /></g>,
  Coconut: <g><circle cx="12" cy="13" r="7" /><circle cx="12" cy="13" r="2.6" /><path d="M12 6V3" /></g>,
  Sugarcane: <g><line x1="12" y1="21" x2="12" y2="5" /><line x1="9.5" y1="9.5" x2="14.5" y2="9.5" /><line x1="9.5" y1="14" x2="14.5" y2="14" /><path d="M12 5c0-1.4 1.6-2.4 3.5-3" /></g>,
  Coffee: <g><path d="M5 9h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9z" /><path d="M16 10.5h1.5a2 2 0 0 1 0 4H16" /><path d="M9 4c0 1-1 1-1 2s1 1 1 2M13 4c0 1-1 1-1 2s1 1 1 2" /></g>,
  Cacao: <g><path d="M12 3c4 2 6 7 4 12s-6 6-8 4-2-8 0-12 2.5-4 4-4z" /><path d="M12 4v15M9 8.5c1 1 1 2 0 3M15 8.5c-1 1-1 2 0 3M9 14.5c1 1 1 2 0 3M15 14.5c-1 1-1 2 0 3" /></g>,
  Abaca: <g><path d="M12 21V6" /><path d="M12 6C8 6 5 9 4 13c4 1 7-1 8-5z" /><path d="M12 10c4 0 7 3 8 7-4 1-7-1-8-5z" /></g>,
  'Sweet Potato': <g><path d="M4 15c0-4 4-7.5 9-7.5s7 3 6 6.5-6 6.5-10 6.5-5-1.8-5-5.5z" /><path d="M10 7.5c1-2 3-3 3-3" /></g>,
  Mango: <g><path d="M12 4c4 2 7 7 6 11-1 3.5-4.5 5-7 5s-6-1.5-7-5c-1-4 4-9 8-11z" /><path d="M12 4V2" /></g>,
  Banana: <g><path d="M6 18c0-6 4-12 12-13" /><path d="M18 5c1 0 2 1 1.5 2.5C18 12 12 19 5 19c-1.5 0-2.5-1-2-2.5" /></g>,
  Cassava: <g><path d="M12 3v4" /><path d="M8 7c-2 3-3 8-1 12 1.5 2.5 6 2.5 7 0 2-4 1-9-1-12z" /></g>,
  Vegetables: <g><path d="M12 21c0-6-3-9-7-10 1 5 3 8 7 10z" /><path d="M12 21c0-7 3-11 7-12-1 6-3 9-7 12z" /><line x1="12" y1="21" x2="12" y2="9" /></g>,
  'Palay (Rice)': <g><line x1="12" y1="4" x2="12" y2="21" /><path d="M12 6.5l-3-1M12 9.5l3-1M12 12.5l-3-1M12 15.5l3-1M12 18.5l-3-1" /></g>,
  Pineapple: <g><ellipse cx="12" cy="15" rx="6" ry="7" /><path d="M12 8V3M9 8l-2-4M15 8l2-4" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="16" x2="16" y2="16" /></g>,
  Rubber: <g><path d="M12 3c3 5 6 9 6 12a6 6 0 0 1-12 0c0-3 3-7 6-12z" /></g>,
  'Oil Palm': <g><line x1="12" y1="21" x2="12" y2="10" /><path d="M12 10c-3-2-6-2-8-1 1 3 4 4 8 3zM12 10c3-2 6-2 8-1-1 3-4 4-8 3zM12 10c-2-3-2-6-1-8 3 1 4 4 3 8zM12 10c2-3 2-6 1-8-3 1-4 4-3 8z" /></g>,

  Pigs: <g><circle cx="12" cy="13" r="7" /><path d="M7 8l2 3M17 8l-2 3" /><ellipse cx="12" cy="15" rx="3" ry="2" /><circle cx="11" cy="15" r="0.35" fill="currentColor" stroke="none" /><circle cx="13" cy="15" r="0.35" fill="currentColor" stroke="none" /></g>,
  Cows: <g><path d="M9 4c2 0 3 1.5 3 3M15 4c-2 0-3 1.5-3 3" /><ellipse cx="12" cy="13" rx="7" ry="6" /><path d="M6 10l-2-1M18 10l2-1" /><ellipse cx="12" cy="15" rx="3" ry="2" /></g>,
  Carabaos: <g><path d="M5 6c2-1.5 4.5 1 5.5 4.5M19 6c-2-1.5-4.5 1-5.5 4.5" /><ellipse cx="12" cy="13" rx="7" ry="6" /><ellipse cx="12" cy="15" rx="3" ry="2" /></g>,
  Horses: <g><path d="M9 3c-2 0-4 2-4 5 0 3 1 5 1 8 0 2 2 3 4 3h4c2 0 3-2 3-4 0-2-1-3-1-6 0-4-3-6-7-6z" /><path d="M8 6l3 2" /><circle cx="10" cy="9.5" r="0.4" fill="currentColor" stroke="none" /></g>,
  Goats: <g><path d="M9 5c-1-1-1-2 0-3M15 5c1-1 1-2 0-3" /><ellipse cx="12" cy="13" rx="6" ry="6" /><line x1="12" y1="18" x2="12" y2="21" /><ellipse cx="12" cy="14" rx="2.5" ry="1.8" /></g>,
  Chickens: <g><ellipse cx="11" cy="15" rx="6" ry="5" /><circle cx="15" cy="9" r="3" /><path d="M15 6c0-1 1-2 2-2M13 6c0-1-1-2-2-2" /><path d="M18 9l3 1-2 1" /><path d="M9 19l-2 3M13 19l1 3" /></g>,
  Ducks: <g><ellipse cx="11" cy="15" rx="7" ry="5" /><circle cx="17" cy="10" r="3.2" /><path d="M20 10h2.5c0 1-1 1.8-2.5 1.8z" /><path d="M8 19l-2 2M13 19l1 2" /></g>,

  Fishpond: <g><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M6 11c1-1 2-1 3 0s2 1 3 0 2-1 3 0 2 1 3 0 2-1 3 0" /><path d="M6 15c1-1 2-1 3 0s2 1 3 0 2-1 3 0 2 1 3 0 2-1 3 0" /></g>,
  'Fish cage': <g><rect x="4" y="4" width="16" height="16" rx="1" /><line x1="4" y1="9.3" x2="20" y2="9.3" /><line x1="4" y1="14.7" x2="20" y2="14.7" /><line x1="9.3" y1="4" x2="9.3" y2="20" /><line x1="14.7" y1="4" x2="14.7" y2="20" /></g>,
  'Fish pen': <g><circle cx="12" cy="13" r="7" /><line x1="12" y1="6" x2="12" y2="3" /><line x1="6" y1="9" x2="4" y2="7" /><line x1="18" y1="9" x2="20" y2="7" /><path d="M8 13c1-1 2-1 3 0s2 1 3 0 2-1 3 0" /></g>,
  'Rice-fish system': <g><path d="M4 18c1-1 2-1 3 0s2 1 3 0 2-1 3 0 2 1 3 0 2-1 3 0" /><line x1="8" y1="16" x2="8" y2="5" /><path d="M8 6.5l-2-1M8 9.5l2-1M8 12.5l-2-1" /></g>,

  Tilapia: <g><path d="M3 13c4-5 10-6 14-3 2 1.5 3 2 4 1-1 3-2 4-4 3-4 3-10 2-14-3z" /><circle cx="8" cy="12" r="0.5" fill="currentColor" stroke="none" /></g>,
  'Hito (Catfish)': <g><path d="M4 13c3-4 9-5 13-2 1.5 1 2.5 1.5 3.5.5-.7 2.5-1.8 3.2-3.5 2.2-4 3-10 1-13-2.7z" /><path d="M4 13l-2-2M4 13l-2 2" /><circle cx="7.5" cy="12" r="0.5" fill="currentColor" stroke="none" /></g>,
  Carp: <g><path d="M3 13c4-5 10-6 14-3 2 1.5 3 2 4 1-1 3-2 4-4 3-4 3-10 2-14-3z" /><path d="M7 10.5c1 1 1 3 0 4M10 10.5c1 1 1 3 0 4" /></g>,
  'Dalag (Mudfish)': <g><path d="M2 13c5-3 9-3 12-1 2 1 3 2 5 1 1 0 2 .5 3 1.5" /><path d="M2 13c5 3 9 3 12 1" /><circle cx="5" cy="13" r="0.5" fill="currentColor" stroke="none" /></g>,
  'Ulang (Giant Freshwater Prawn)': <g><path d="M6 17c-1-5 2-11 8-12 1 3 0 5-2 6 3 0 5 2 5 5 0 2-2 4-5 4-3 0-5-1-6-3z" /><path d="M14 5l4-3M14 6h5" /></g>,

  'Root crops': <g><path d="M12 3v4" /><path d="M7 8c-1 3-1 7 1 10 1.5 2 5 2 6.5 0 2-3 2-7 1-10z" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></g>,
  Fruits: <g><path d="M12 8c3 0 5 2.5 5 6a5 5 0 0 1-10 0c0-3.5 2-6 5-6z" /><path d="M12 8c0-1.5 1-2.5 2-3" /></g>,

  __default: <g><path d="M4 20c8 0 16-6 16-16-10 0-16 8-16 16z" /><path d="M4 20c2-6 6-10 12-12" /></g>,
};

function ItemIcon({ name, size = 15 }) {
  return (
    <svg
      className="livTagIcon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ITEM_ICON_PATHS[name] || ITEM_ICON_PATHS.__default}
    </svg>
  );
}

/* ===== Reusable frequency-weighted tag mosaic — crops, livestock,
   aquaculture systems/products, backyard commodities. Each pill leads
   with a hand-drawn line icon (see ITEM_ICON_PATHS above), sized along
   with the text as frequency increases. ===== */
function TagMosaic({ counts, total, tone = 'blue', unit = 'sitios' }) {
  const visible = useInView(140);
  const entries = Object.entries(counts).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    return <div className="livMosaicEmpty">Not recorded for the current filter.</div>;
  }
  const max = entries[0][1];
  return (
    <div className="livMosaic">
      {entries.map(([label, count], i) => {
        const weight = max ? count / max : 0;
        const fontSize = 12 + weight * 8;
        const iconSize = 14 + weight * 6;
        const padY = (6 + weight * 4).toFixed(1);
        const padX = (12 + weight * 8).toFixed(1);
        return (
          <BarTooltip key={label} text={`${label} \u00b7 ${count.toLocaleString()} ${unit} (${pct(count, total).toFixed(1)}%)`}>
            <span
              className={`livMosaicTag tone-${tone}${visible ? ' in' : ''}`}
              style={{ fontSize: `${fontSize}px`, padding: `${padY}px ${padX}px`, transitionDelay: `${i * 30}ms` }}
            >
              <ItemIcon name={label} size={iconSize} />
              {label}<em>{count}</em>
            </span>
          </BarTooltip>
        );
      })}
    </div>
  );
}
/* ===== Ranked bar list — icon + label + count + proportional fill bar.
   Used for Aquaculture's culture systems / major products, where seeing
   relative scale matters more than the tag-cloud emphasis TagMosaic gives. ===== */
function RankedBarList({ counts, total, tone = 'blue', unit = 'sitios' }) {
  const visible = useInView(150);
  const entries = Object.entries(counts).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    return <div className="livMosaicEmpty">Not recorded for the current filter.</div>;
  }
  const max = entries[0][1];
  return (
    <div className="livRankedList">
      {entries.map(([label, count], i) => {
        const widthPct = max ? (count / max) * 100 : 0;
        return (
          <BarTooltip key={label} text={`${label} \u00b7 ${count.toLocaleString()} ${unit} (${pct(count, total).toFixed(1)}%)`}>
            <div className="livRankedItem">
              <div className="livRankedItemHead">
                <span className={`livRankedIconWrap tone-${tone}`}><ItemIcon name={label} size={14} /></span>
                <span className="livRankedLabel">{label}</span>
                <span className="livRankedCount">{count.toLocaleString()}</span>
              </div>
              <div className="livRankedTrack">
                <div
                  className={`livRankedFill tone-${tone}`}
                  style={{ width: visible ? `${widthPct}%` : 0, transitionDelay: `${i * 60}ms` }}
                />
              </div>
            </div>
          </BarTooltip>
        );
      })}
    </div>
  );
}
/* ===== Icon-accented stat card — used for Aquaculture's top-row KPIs.
   Gives each figure a colored anchor instead of four identical gray boxes. ===== */
function AquaStat({ icon, color, bg, value, suffix = '', label, index = 0 }) {
  const visible = useInView(index * 70);
  return (
    <div className={`livAquaStat${visible ? ' in' : ''}`} style={{ transitionDelay: `${index * 60}ms` }}>
      <div className="livAquaStatIcon" style={{ background: bg, color }}><TabIcon name={icon} /></div>
      <div>
        <div className="livAquaStatValue"><CountUp value={value} />{suffix}</div>
        <div className="livAquaStatLabel">{label}</div>
      </div>
    </div>
  );
}
/* ===== Treemap — used for Major Crops and Livestock & Poultry. Uses the
   "squarified" treemap algorithm (Bruls, Huizing & van Wijk 2000): each
   row is built greedily, adding items as long as it keeps the row's
   tiles closer to square, then a new row starts. This produces a
   Fibonacci-like spiral — the largest item gets one big near-square
   block, and the rest shrink and wrap around it — instead of the
   uniform grid a plain half-split slice-and-dice would give when values
   are close in magnitude. `items` must already be sorted descending by
   value (Treemap below does this). ===== */
function worstAspectRatio(row, side) {
  const sum = row.reduce((s, r) => s + r.area, 0);
  const rowMax = Math.max(...row.map((r) => r.area));
  const rowMin = Math.min(...row.map((r) => r.area));
  const sideSq = side * side;
  const sumSq = sum * sum;
  return Math.max((sideSq * rowMax) / sumSq, sumSq / (sideSq * rowMin));
}

function squarify(items, x, y, w, h) {
  const results = [];
  let remaining = items.slice();
  let rx = x;
  let ry = y;
  let rw = w;
  let rh = h;

  while (remaining.length) {
    const shortSide = Math.min(rw, rh);
    let row = [remaining[0]];
    let bestRatio = worstAspectRatio(row, shortSide);
    let i = 1;
    while (i < remaining.length) {
      const testRow = [...row, remaining[i]];
      const testRatio = worstAspectRatio(testRow, shortSide);
      if (testRatio <= bestRatio) {
        row = testRow;
        bestRatio = testRatio;
        i += 1;
      } else {
        break;
      }
    }

    const rowSum = row.reduce((s, r) => s + r.area, 0);
    const rowThickness = rowSum / shortSide;
    let offset = 0;

    if (rw >= rh) {
      row.forEach((it) => {
        const itemHeight = (it.area / rowSum) * rh;
        results.push({ label: it.label, value: it.value, x: rx, y: ry + offset, w: rowThickness, h: itemHeight });
        offset += itemHeight;
      });
      rx += rowThickness;
      rw -= rowThickness;
    } else {
      row.forEach((it) => {
        const itemWidth = (it.area / rowSum) * rw;
        results.push({ label: it.label, value: it.value, x: rx + offset, y: ry, w: itemWidth, h: rowThickness });
        offset += itemWidth;
      });
      ry += rowThickness;
      rh -= rowThickness;
    }

    remaining = remaining.slice(row.length);
  }

  return results;
}

/** Treemap tile areas are remapped through a fixed min→max weight range
 *  (not the raw values directly), so the biggest item always renders
 *  meaningfully larger than the smallest — even when the underlying
 *  counts are close together (e.g. 649 vs 550, or 1249 vs 1225). Each
 *  item's weight is driven by its RANK between the group's min and max,
 *  not by how close the raw numbers happen to be, guaranteeing a
 *  consistent ~4.5x area contrast top-to-bottom every time. */
const TREEMAP_MIN_WEIGHT = 1;
const TREEMAP_MAX_WEIGHT = 4.5; // largest tile's area is ~4.5x the smallest's

function amplifyForTreemap(items) {
  const values = items.map((it) => it.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  return items.map((it) => {
    const norm = range ? (it.value - min) / range : 1;
    const weight = TREEMAP_MIN_WEIGHT + norm * (TREEMAP_MAX_WEIGHT - TREEMAP_MIN_WEIGHT);
    return { ...it, weight };
  });
}

function layoutTreemap(items, x, y, w, h) {
  if (!items.length) return [];
  const weighted = amplifyForTreemap(items);
  const total = weighted.reduce((s, it) => s + it.weight, 0);
  if (!total) return [];
  const scale = (w * h) / total;
  const scaledItems = weighted.map((it) => ({ ...it, area: it.weight * scale }));
  return squarify(scaledItems, x, y, w, h);
}

const TREEMAP_COLORS = ['#2f6fed', '#22c55e', '#a855f7', '#eab308', '#14b8a6', '#e0392f', '#f97316', '#0ea5e9', '#84cc16', '#ec4899', '#6366f1', '#f59e0b'];

function Treemap({ counts, total, unit = 'sitios', height = 260 }) {
  const visible = useInView(150);
  const entries = Object.entries(counts).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    return <div className="livMosaicEmpty">Not recorded for the current filter.</div>;
  }
  const layout = layoutTreemap(entries.map(([label, value]) => ({ label, value })), 0, 0, 100, 100);
  return (
    <div className="livTreemap" style={{ height }}>
      {layout.map((tile, i) => {
        // Scale font/icon size to the tile's actual rendered area so text
        // never overflows a small tile or looks tiny on a big one.
        const areaScore = Math.sqrt(tile.w * tile.h);
        const showIcon = tile.w > 15 && tile.h > 20;
        const showCount = tile.w > 9 && tile.h > 12;
        const fontSize = Math.max(8.5, Math.min(15, areaScore / 4.4));
        const iconSize = Math.max(11, Math.min(20, areaScore / 3.8));
        return (
          <BarTooltip
            key={tile.label}
            text={`${tile.label} \u00b7 ${tile.value.toLocaleString()} ${unit} (${pct(tile.value, total).toFixed(1)}%)`}
            style={{ position: 'absolute', left: `${tile.x}%`, top: `${tile.y}%`, width: `${tile.w}%`, height: `${tile.h}%` }}
          >
            <div className={`livTreemapTile${visible ? ' in' : ''}`} style={{ background: TREEMAP_COLORS[i % TREEMAP_COLORS.length], transitionDelay: `${i * 40}ms` }}>
              {showIcon ? <ItemIcon name={tile.label} size={iconSize} /> : null}
              <span className="livTreemapLabel" style={{ fontSize: `${fontSize}px` }}>{tile.label}</span>
              {showCount ? <span className="livTreemapCount" style={{ fontSize: `${Math.max(11, fontSize + 2)}px` }}>{tile.value.toLocaleString()}</span> : null}
            </div>
          </BarTooltip>
        );
      })}
    </div>
  );
}

/* ===== Farmer type — donut, reusing DonutWithLegend ===== */
function FarmerTypeDonut({ totals, total }) {
  const rows = FARMER_TYPES.map(({ key, label }) => ({ key, label, count: totals[key] || 0 }));
  return <DonutWithLegend rows={rows} total={total} unit="farmers" />;
}

/* ===== Backyard garden coverage — waffle chart ===== */
function WaffleChart({ valuePct, colorFrom = '#17a673', colorTo = '#22c55e' }) {
  const visible = useInView(160);
  const filled = Math.round(Math.max(0, Math.min(100, valuePct)));
  const cells = Array.from({ length: 100 }, (_, i) => i < filled);
  return (
    <div className="livWaffleWrap">
      <div className="livWaffleGrid">
        {cells.map((on, i) => (
          <div
            key={i}
            className={`livWaffleCell${on ? ' on' : ''}`}
            style={{
              transitionDelay: `${(i % 10) * 12 + Math.floor(i / 10) * 12}ms`,
              background: on ? `linear-gradient(135deg, ${colorFrom}, ${colorTo})` : undefined,
              opacity: visible ? 1 : 0,
            }}
          />
        ))}
      </div>
      <div className="livWaffleValue">{valuePct.toFixed(1)}<span>%</span></div>
    </div>
  );
}
/* ===== Backyard garden coverage — horizontal progress bar + tag list ===== */
function BackyardProgress({ valuePct, backyardHH, totalHouseholds, counts, total, unit = 'sitios' }) {
  const visible = useInView(160);
  const entries = Object.entries(counts).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);

  return (
    <div className="livGardenWrap">
      <div className="livGardenBarHead">
        <span className="livGardenBarLabel">Households with Gardens</span>
        <span className="livGardenBarPct">{valuePct.toFixed(1)}%</span>
      </div>
      <div className="livGardenBarTrack">
        <div className="livGardenBarFill" style={{ width: visible ? `${Math.min(100, valuePct)}%` : 0 }} />
      </div>
      <div className="livGardenBarSub">{backyardHH.toLocaleString()} out of {totalHouseholds.toLocaleString()} households</div>

      <div className="livGardenTagsHead">Common Garden Crops</div>
      {entries.length ? (
        <div className="livGardenTags">
          {entries.map(([label, count]) => (
            <BarTooltip key={label} text={`${label} \u00b7 ${count.toLocaleString()} ${unit} (${pct(count, total).toFixed(1)}%)`}>
              <span className="livGardenTag">
                <ItemIcon name={label} size={13} />
                {label}<em>{count}</em>
              </span>
            </BarTooltip>
          ))}
        </div>
      ) : (
        <div className="livMosaicEmpty">Not recorded for the current filter.</div>
      )}
    </div>
  );
}
/* ===== Source + Visualization-Rationale badge — same "?" corner popup as
   CornerTooltip, but with a Next button that flips to a second page showing
   why that specific chart type was chosen, with its citation + link. ===== */
function SourceVizBadge({ dataSource, vizSource }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0); // 0 = data source, 1 = viz rationale
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const pages = vizSource ? [dataSource, vizSource] : [dataSource];
  const current = pages[page] || pages[0];

  return (
    <div className="livSrcBadgeWrap" ref={wrapRef}>
      <button
        type="button"
        className={`livSrcBadgeBtn${open ? ' active' : ''}`}
        onClick={() => { setOpen((o) => !o); setPage(0); }}
        aria-label="Show source"
      >
        ?
      </button>
      {open ? (
        <div className="livSrcPopup">
          <div className="livSrcPopupLabel">{page === 0 ? (current.label || 'SOURCE') : 'WHY THIS CHART'}</div>
          <div className="livSrcPopupText">{current.text}</div>
          {current.linkHref ? (
            <a className="livSrcPopupLink" href={current.linkHref} target="_blank" rel="noopener noreferrer">
              {current.linkLabel || current.linkHref}
            </a>
          ) : null}
          {pages.length > 1 ? (
            <div className="livSrcPopupNav">
              <span className="livSrcPopupDots">
                {pages.map((_, i) => (
                  <span key={i} className={`livSrcPopupDot${i === page ? ' active' : ''}`} />
                ))}
              </span>
              <button
                type="button"
                className="livSrcPopupNextBtn"
                onClick={() => setPage((p) => (p + 1) % pages.length)}
              >
                {page === pages.length - 1 ? 'Back to source' : 'Next'} <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
/* ===== Main panel ===== */
export default function LivelihoodPanel({ sitios, hasFilters, onClearFilters, municipality, barangay }) {
  const stats = useLivelihoodStats(sitios);

  /* Year filter for the "Household Income" card only — every other card
     in this panel keeps using `stats` (all years combined) untouched.
     Defaults to the most recent year the filter supports — including
     forward-provisioned years like 2026 that may not have real survey
     data yet — rather than the latest year with actual data. */
  const availableIncomeYears = useMemo(() => {
    const years = new Set([...stats.surveyYearsSorted, ...INCOME_FILTER_EXTRA_YEARS]);
    return Array.from(years).sort((a, b) => a - b);
  }, [stats.surveyYearsSorted]);
  const [incomeYear, setIncomeYear] = useState(
    () => availableIncomeYears[availableIncomeYears.length - 1] || LATEST_THRESHOLD_YEAR
  );

  /* Switching between the municipality-aggregated ladder and the
     per-sitio ladder is driven entirely by whether a barangay is
     currently selected in the dashboard's top filter bar — when it is,
     `sitios` already only contains that barangay's records (filtered
     upstream in Dashboard), so no extra filtering happens here. */
  const isSitioMode = Boolean(barangay);
  const municipalityIncomeByYear = useIncomeByYear(sitios, incomeYear);
  const sitioIncomeByYear = useSitioIncomeByYear(sitios, incomeYear);
  const incomeByYear = isSitioMode ? sitioIncomeByYear : municipalityIncomeByYear;

  if (!sitios.length) {
    return (
      <div className="panelEmpty">
        <div className="panelEmptyIcon"><TabIcon name="trend" /></div>
        <div className="panelEmptyTitle">No sitios match these filters</div>
        <div className="panelEmptySub">Try a different municipality, barangay, or search term.</div>
        {hasFilters ? <button type="button" className="clearFiltersBtn" onClick={onClearFilters}>Clear filters</button> : null}
      </div>
    );
  }

  const topCrop = stats.topCropEntry?.[0] || '—';
  const topCropPct = pct(stats.topCropEntry?.[1] || 0, stats.totalSitios);
  const topLivestock = stats.topLivestockEntry?.[0] || '—';
  const topLivestockPct = pct(stats.topLivestockEntry?.[1] || 0, stats.totalSitios);
  const topSoi = stats.soiSorted[0];
  const bottomSoi = stats.soiSorted[stats.soiSorted.length - 1];

  return (
    <>
      <style>{CSS}</style>
      <div className="panelStack">

        {/* ===== Employment Composition ===== */}
        <div className="sectionCard">
          <SourceVizBadge
            dataSource={{ label: 'SOURCE', text: 'PSA Labor Force Survey (LFS) — Class of Worker Classification.', linkHref: 'https://psa.gov.ph', linkLabel: 'psa.gov.ph (LFS)' }}
            vizSource={{ text: 'Column chart used because position along a common scale is the most accurately-judged encoding for comparing magnitude across 7 discrete worker classes (Cleveland & McGill, 1984).', linkHref: 'https://doi.org/10.2307/2288400', linkLabel: 'Cleveland & McGill (1984)' }}
          />
          <div className="overviewCardHead">
            <div className="overviewCardIcon" style={{ background: '#e8f0fe', color: '#2f6fed' }}><TabIcon name="users" /></div>
            <div>
              <div className="overviewCardTitle">Employment Classification</div>
              <div className="overviewCardSub">Class of worker across the recorded working-age population (Q26)</div>
            </div>
          </div>
          <EmploymentColumns cowTotals={stats.cowTotals} grandTotal={stats.cowGrandTotal} />
          <div className="overviewInsight">
            <strong>{stats.topCowLabel}</strong> is the largest class-of-worker category at {stats.topCowPct.toFixed(1)}% of the recorded workforce.
            Roughly <strong>{stats.wageShare.toFixed(0)}%</strong> depend on wage-and-salary type work (private household, private establishment,
            government, or general wage labor), while only <strong>{stats.selfRelianceShare.toFixed(0)}%</strong> are self-employed or employers —
            a sign of thin entrepreneurial diversification outside formal wage work in these sitios.
          </div>
        </div>

        {/* ===== Income + Diversification (+ Farmer Type, stacked below) ===== */}
        <div className="overviewGrid">
          <div className="overviewCard">
            <SourceVizBadge
              dataSource={{ label: 'SOURCES', text: INCOME_SOURCE_TEXT, linkHref: 'https://rsso12.psa.gov.ph/statistics/poverty', linkLabel: 'rsso12.psa.gov.ph (poverty)' }}
              vizSource={{ text: 'Dot plot ("ladder") used so many municipalities can be compared against one shared reference line (the provincial median) without the clutter of bars all starting at zero (Cleveland & McGill, 1984).', linkHref: 'https://doi.org/10.2307/2288400', linkLabel: 'Cleveland & McGill (1984)' }}
            />
            <div className="overviewCardHead">
              <div className="overviewCardIcon" style={{ background: '#e4f8ef', color: '#0f9d58' }}><TabIcon name="trend" /></div>
              <div>
                <div className="overviewCardTitle">Household Income by Municipality</div>
                <div className="overviewCardSub">Average daily household income vs. provincial median (Q27)</div>
              </div>
            </div>

            <div className="livDataCurrency">
              <TabIcon name="doc" />
              {incomeByYear.sitioCount > 0 ? (
                <>
                  Showing {incomeYear} — {incomeByYear.sitioCount.toLocaleString()} of {stats.totalSitios.toLocaleString()} sitios
                  surveyed this year, classified against the {incomeYear} threshold
                </>
              ) : (
                <>
                  Showing {incomeYear} — 0 of {stats.totalSitios.toLocaleString()} sitios surveyed this year. Most recent actual data:{' '}
                  {stats.surveyYearsSorted.map((y) => `${y} (${stats.surveyYearCounts[y]} sitios)`).join(' · ')}
                </>
              )}
            </div>

            <div className="livSubheading livSubheadingWithTip">
              Sitio income classification
              <BarTooltip text={INCOME_SOURCE_TEXT}>
                <span className="livInlineTip">?</span>
              </BarTooltip>
            </div>
            <IncomeClassGrid counts={incomeByYear.incomeClassCounts} total={incomeByYear.sitioCount} year={incomeYear} />
            <div className="livCaption">
              Brackets: PIDS 7-class social-income scheme (Albert, Abrigo, Quimba &amp; Vizmanos 2020, PIDS DP 2020-22), poverty-line
              multiples of PSA RSSO XII's {incomeYear} regional threshold, average daily household income. Hover the &ldquo;?&rdquo; above for full sources.
            </div>

            <div className="livSubheadingRow" style={{ marginTop: 18 }}>
              <div className="livSubheading" style={{ marginBottom: 0 }}>
                {isSitioMode ? `Sitios in ${barangay}` : 'By municipality'}
              </div>
              <label className="livYearSelectWrap">
                <span className="livYearSelectLabel">Survey year</span>
                <select
                  className="livYearSelect"
                  value={incomeYear}
                  onChange={(e) => setIncomeYear(Number(e.target.value))}
                >
                  {availableIncomeYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </label>
            </div>

            {isSitioMode ? (
              incomeByYear.sitioCount > 0 ? (
                <>
                  <div className="livCaption" style={{ marginTop: -4, marginBottom: 8 }}>
                    Showing {incomeByYear.sitioCount.toLocaleString()} sitio{incomeByYear.sitioCount === 1 ? '' : 's'} surveyed in {incomeYear} under {barangay}.
                  </div>
                  <div className={incomeByYear.incomeRows.length > 10 ? 'livLadderScrollWrap' : undefined}>
                    <IncomeLadder
                      rows={incomeByYear.incomeRows}
                      medianIncome={incomeByYear.medianIncome}
                      min={incomeByYear.incomeMin}
                      max={incomeByYear.incomeMax}
                      year={incomeYear}
                      labelWidth={170}
                    />
                  </div>
                </>
              ) : (
                <div className="livMosaicEmpty">No sitios surveyed in {barangay} for {incomeYear} — try a different year.</div>
              )
            ) : (
              <>
                <div className="livCaption" style={{ marginTop: -4, marginBottom: 8 }}>
                  Showing {incomeByYear.sitioCount.toLocaleString()} sitios surveyed in {incomeYear}. Grayed rows have no {incomeYear} record for
                  that municipality — pick a different year to see their data.
                </div>
                <IncomeLadder
                  rows={incomeByYear.incomeRows}
                  medianIncome={incomeByYear.medianIncome}
                  min={incomeByYear.incomeMin}
                  max={incomeByYear.incomeMax}
                  year={incomeYear}
                />
              </>
            )}

            <div className="overviewInsight">
              {isSitioMode ? (
                <>
                  Among sitios with {incomeYear} data in {barangay}, average daily household income ranges from{' '}
                  <strong>&#8369;{Math.round(incomeByYear.incomeMin).toLocaleString()}</strong> to{' '}
                  <strong>&#8369;{Math.round(incomeByYear.incomeMax).toLocaleString()}</strong> — a spread of{' '}
                  <strong>&#8369;{Math.round(incomeByYear.incomeMax - incomeByYear.incomeMin).toLocaleString()}</strong>.
                </>
              ) : (
                <>
                  Among municipalities with {incomeYear} data, average daily household income ranges from{' '}
                  <strong>&#8369;{Math.round(incomeByYear.incomeMin).toLocaleString()}</strong> to{' '}
                  <strong>&#8369;{Math.round(incomeByYear.incomeMax).toLocaleString()}</strong> — a spread of{' '}
                  <strong>&#8369;{Math.round(incomeByYear.incomeMax - incomeByYear.incomeMin).toLocaleString()}</strong>. Municipalities sitting
                  furthest below the provincial median line are where livelihood interventions would have the largest income-equalizing effect.
                </>
              )}
            </div>
          </div>

          <div className="livStackCol">
            <div className="overviewCard">
              <SourceVizBadge
                dataSource={{ label: 'SOURCE', text: 'PSA Family Income and Expenditure Survey (FIES) — Source of Income.', linkHref: 'https://psa.gov.ph', linkLabel: 'psa.gov.ph (FIES)' }}
                vizSource={{ text: 'Donut chart used only because the category count is low; each slice is also paired with its exact value in the legend so precision isn\u2019t lost to angle-judgment error (Cleveland & McGill, 1984).', linkHref: 'https://doi.org/10.2307/2288400', linkLabel: 'Cleveland & McGill (1984)' }}
              />
              <div className="overviewCardHead">
                <div className="overviewCardIcon" style={{ background: '#f1e8fb', color: '#7c3aed' }}><TabIcon name="pulse" /></div>
                <div>
                  <div className="overviewCardTitle">Source Of Income</div>
                  <div className="overviewCardSub">Share of households reporting each income source (Q28)</div>
                </div>
              </div>
              <IncomeSourceDonut soiTotals={stats.soiTotals} totalHouseholds={stats.totalHouseholds} />
              <div className="overviewInsight">
                <strong>{topSoi?.label}</strong> is the most widely reported income source, cited by {topSoi?.valuePct.toFixed(0)}% of households.
                Reliance on <strong>{bottomSoi?.label.toLowerCase()}</strong> stays marginal at {bottomSoi?.valuePct.toFixed(1)}%, indicating narrow
                income diversification — most households have a single dominant income stream rather than layered sources.
              </div>
            </div>

            <div className="overviewCard">
              <SourceVizBadge
                dataSource={{ label: 'SOURCE', text: "DA-RSBSA. Concept only — the option wording (farm owner, tenant, smallholder, etc.) is the researchers'.", linkHref: 'https://www.da.gov.ph/rsbsa/', linkLabel: 'da.gov.ph/rsbsa' }}
                vizSource={{ text: 'Donut chart used for the same reason as Income Diversification: low category count keeps angle-judgment error acceptable, with exact values shown in the legend (Cleveland & McGill, 1984).', linkHref: 'https://doi.org/10.2307/2288400', linkLabel: 'Cleveland & McGill (1984)' }}
              />
              <div className="overviewCardHead">
                <div className="overviewCardIcon" style={{ background: '#fef7e0', color: '#eab308' }}><TabIcon name="users" /></div>
                <div>
                  <div className="overviewCardTitle">Farmer Type Breakdown</div>
                  <div className="overviewCardSub">Land-tenure classification of recorded farmers (Q30)</div>
                </div>
              </div>
              <FarmerTypeDonut totals={stats.farmerTypeTotals} total={stats.totalFarmers} />
              <div className="overviewInsight">
                <strong>{stats.topFarmerTypeLabel}</strong> is the most common classification, at {stats.topFarmerTypePct.toFixed(1)}% of all recorded
                farmers — useful context for tailoring land-tenure-sensitive support (e.g. tenant farmers often can't collateralize land for credit).
              </div>
            </div>
          </div>
        </div>

        {/* ===== Farmers & Farm Area (narrow) + Backyard Food Production ===== */}
        <div className="livNarrowGrid">
          <div className="overviewCard">
            <SourceVizBadge
              dataSource={{ label: 'SOURCE', text: 'DA Registry System for Basic Sectors in Agriculture (RSBSA); PSA Agricultural Census.', linkHref: 'https://www.da.gov.ph/rsbsa/', linkLabel: 'da.gov.ph/rsbsa' }}
              vizSource={{ text: 'Shown as plain KPI numbers, not a chart — charting a single count adds no analytical value over stating it directly (Few, 2006).', linkHref: 'https://www.perceptualedge.com/library.php', linkLabel: 'Few (2006)' }}
            />
            <div className="overviewCardHead">
              <div className="overviewCardIcon" style={{ background: '#e4f8ef', color: '#17a673' }}><TabIcon name="pin" /></div>
              <div>
                <div className="overviewCardTitle">Farmers &amp; Farm Area</div>
                <div className="overviewCardSub">Registered farmers, associations, and cultivated land (Q29, 31-32)</div>
              </div>
            </div>
            <div className="miniStatRow miniStatRowStack">
              <div className="miniStat"><div className="miniStatValue"><CountUp value={stats.totalFarmers} /></div><div className="miniStatLabel">Farmers</div></div>
              <div className="miniStat"><div className="miniStatValue"><CountUp value={stats.totalFarmerAssociations} /></div><div className="miniStatLabel">Associations / coops</div></div>
              <div className="miniStat"><div className="miniStatValue"><CountUp value={stats.totalFarmArea} decimals={0} /></div><div className="miniStatLabel">Hectares farmed</div></div>
            </div>
            <div className="overviewInsight">
              An average of <strong>{stats.avgFarmAreaPerFarmer.toFixed(1)} ha per farmer</strong> points to predominantly smallholder cultivation
              across the province, with <strong>{stats.totalFarmerAssociations.toLocaleString()}</strong> associations/cooperatives currently
              organizing collective access to RSBSA-linked support programs.
            </div>
          </div>

          <div className="overviewCard">
            <SourceVizBadge
              dataSource={{ label: 'SOURCE', text: 'DA Gulayan sa Barangay Program.', linkHref: 'https://www.da.gov.ph', linkLabel: 'da.gov.ph' }}
              vizSource={{ text: 'Progress bar used because it\u2019s the most direct encoding for "proportion of one whole" — a donut or gauge here would add complexity with no added clarity (Tufte, 2001).', linkHref: 'https://www.edwardtufte.com/tufte/books_vdqi', linkLabel: 'Tufte (2001)' }}
            />
            <div className="overviewCardHead">
              <div className="overviewCardIcon" style={{ background: '#e4f8ef', color: '#17a673' }}><TabIcon name="doc" /></div>
              <div>
                <div className="overviewCardTitle">Backyard Food Production</div>
                <div className="overviewCardSub">Household backyard garden coverage &amp; common commodities (Q40-41)</div>
              </div>
            </div>
            <BackyardProgress
              valuePct={stats.backyardPct}
              backyardHH={stats.totalBackyardHH}
              totalHouseholds={stats.totalHouseholds}
              counts={stats.backyardCommodityCounts}
              total={stats.totalSitios}
            />
            <div className="overviewInsight">
              <strong>{stats.backyardPct.toFixed(1)}%</strong> of households ({stats.totalBackyardHH.toLocaleString()} households) maintain a
              backyard garden — each filled square in the grid represents one percentage point of coverage. Expanding Gulayan sa Barangay
              enrollment toward GIDA sitios, where food insecurity is highest, would close this gap fastest.
            </div>
          </div>
        </div>

        {/* ===== Top Crops Grown + Top Livestock Raised — treemaps, tile
             area encodes prevalence, matching the province's farming &
             raising profile at a glance. ===== */}
        <div className="evenGrid">
          <div className="overviewCard">
            <SourceVizBadge
              dataSource={{ label: 'SOURCE', text: 'DA / PSA Agricultural Census.', linkHref: 'https://www.da.gov.ph', linkLabel: 'da.gov.ph' }}
              vizSource={{ text: 'Squarified treemap used because 15 crop categories would be unreadable as a pie chart; area (used here) is a stronger perceptual channel than angle (Bruls, Huizing & van Wijk, 2000).', linkHref: 'http://www.win.tue.nl/~vanwijk/stm.pdf', linkLabel: 'Bruls, Huizing & van Wijk (2000)' }}
            />
            <div className="overviewCardHead">
              <div className="overviewCardIcon" style={{ background: '#e4f8ef', color: '#22c55e' }}><TabIcon name="doc" /></div>
              <div>
                <div className="overviewCardTitle">Major Crops Produced</div>
                <div className="overviewCardSub">Tile area scales with sitio prevalence (Q33)</div>
              </div>
            </div>
            <Treemap counts={stats.cropCounts} total={stats.totalSitios} unit="sitios" height={300} />
            <div className="overviewInsight">
              <strong>{topCrop}</strong> is grown in {topCropPct.toFixed(1)}% of sitios, making it the province's dominant crop — a natural anchor
              commodity for extension services, post-harvest facilities, and market-linkage programs.
            </div>
          </div>

          <div className="overviewCard">
            <SourceVizBadge
              dataSource={{ label: 'SOURCE', text: 'Bureau of Animal Industry (BAI) – DA.', linkHref: 'https://bai.gov.ph', linkLabel: 'bai.gov.ph' }}
              vizSource={{ text: 'Same squarified treemap approach as Top Crops, for the same reason: area-based tiles scale to many categories better than a pie chart\u2019s angle encoding (Bruls, Huizing & van Wijk, 2000).', linkHref: 'http://www.win.tue.nl/~vanwijk/stm.pdf', linkLabel: 'Bruls, Huizing & van Wijk (2000)' }}
            />
            <div className="overviewCardHead">
              <div className="overviewCardIcon" style={{ background: '#fef7e0', color: '#f97316' }}><TabIcon name="shield" /></div>
              <div>
                <div className="overviewCardTitle">Major Livestock & Poultry Raised</div>
                <div className="overviewCardSub">Tile area scales with sitio prevalence (Q39)</div>
              </div>
            </div>
            <Treemap counts={stats.livestockCounts} total={stats.totalSitios} unit="sitios" height={300} />
            <div className="overviewInsight">
              <strong>{topLivestock}</strong> is raised in {topLivestockPct.toFixed(1)}% of sitios, the most widespread type recorded — a strong
              candidate for backyard-scale veterinary outreach and feed-subsidy programs given its reach.
            </div>
          </div>
        </div>

        {/* ===== Aquaculture ===== */}
        <div className="sectionCard">
          <SourceVizBadge
            dataSource={{
              label: 'SOURCE',
              text: 'BFAR FishR / RA 8550 (Philippine Fisheries Code); BFAR Aquaculture Production Classification. Species list narrowed to BFAR/SEAFDEC-documented Lake Sebu & Banga freshwater commodities.',
              linkHref: 'https://bfar.da.gov.ph',
              linkLabel: 'bfar.da.gov.ph',
            }}
            vizSource={{
              text: 'KPI counts use icon-stat cards (Few, 2006). Culture systems and products use horizontal ranked bars instead of a tag cloud, since bar length is a stronger perceptual channel than font size for the same frequency data (Cleveland & McGill, 1984).',
              linkHref: 'https://doi.org/10.2307/2288400',
              linkLabel: 'Cleveland & McGill (1984)',
            }}
          />
          <div className="overviewCardHead">
            <div className="overviewCardIcon" style={{ background: '#e8f0fe', color: '#0ea5e9' }}><TabIcon name="pulse" /></div>
            <div>
              <div className="overviewCardTitle">Aquaculture</div>
              <div className="overviewCardSub">Fisherfolk, operators &amp; culture systems — concentrated in freshwater zones (Q34-38)</div>
            </div>
          </div>
          <div className="livAquaStatRow">
            <AquaStat icon="users" color="#2f6fed" bg="var(--blue-bg)" value={stats.totalFisherfolk} label="Municipal fisherfolk" index={0} />
            <AquaStat icon="pulse" color="#14b8a6" bg="#e6faf6" value={stats.totalAquaOperators} label="Aquaculture operators" index={1} />
            <AquaStat icon="shield" color="#7c3aed" bg="var(--purple-bg)" value={stats.totalFisherfolkAssoc} label="Associations / coops" index={2} />
            <AquaStat icon="pin" color="#f97316" bg="var(--orange-bg)" value={stats.lakeSebuBangaShare.toFixed(0)} suffix="%" label="In Lake Sebu / Banga" index={3} />
          </div>
          <div className="evenGrid" style={{ gap: 24 }}>
            <div>
              <div className="livSubheading">Culture systems present</div>
              <RankedBarList counts={stats.aquaSystemCounts} total={stats.aquaSitios.length || 1} tone="blue" />
            </div>
            <div>
              <div className="livSubheading">Major products</div>
              <RankedBarList counts={stats.aquaProductCounts} total={stats.aquaSitios.length || 1} tone="green" />
            </div>
          </div>
          <div className="overviewInsight">
            {stats.aquaSitios.length} sitios report aquaculture activity, and <strong>{stats.lakeSebuBangaShare.toFixed(0)}%</strong> of them sit in
            Lake Sebu and Banga — matching the BFAR/SEAFDEC-documented freshwater zones. Other municipalities show negligible activity, so
            hatchery support, cold-chain, and market-access spend would concentrate highest impact in these two municipalities.
          </div>
        </div>

      </div>
    </>
  );
}

const CSS = `
  /* Let corner source-badges anchor correctly on the shared card shells */
  .dashPanelCard .overviewCard, .dashPanelCard .sectionCard { position: relative; }

  /* ===== Employment "skyline" column chart with y-axis ===== */
  .livCombChartWrap { display: flex; gap: 12px; padding: 4px 2px 0; }

  .livCombAxisLabels { position: relative; width: 48px; flex-shrink: 0; }
  .livCombAxisLabel {
    position: absolute; right: 8px; transform: translateY(50%);
    font-size: 10px; font-weight: 700; color: var(--text-muted);
    white-space: nowrap;
  }

  .livCombChart { position: relative; flex: 1; display: flex; align-items: flex-end; gap: 10px; }

  .livCombGridLines { position: absolute; left: 0; right: 0; bottom: 34px; pointer-events: none; }
  .livCombGridLine { position: absolute; left: 0; right: 0; border-top: 1px dashed var(--border); }

  .livCombCol { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; width: 100%; z-index: 1; }
  .livCombColCount { font-size: 12px; font-weight: 800; margin-bottom: 6px; color: var(--text-primary); }
  .livCombColBarTrack { width: 100%; max-width: 40px; display: flex; align-items: flex-end; background: transparent; border-radius: 8px 8px 0 0; overflow: hidden; margin: 0 auto; }
  .livCombColBar { width: 100%; border-radius: 8px 8px 0 0; transition: height 1s cubic-bezier(.16,1,.3,1); }
  .livCombColLabel {
    margin-top: 9px; font-size: 10.5px; font-weight: 700; color: var(--text-secondary);
    text-align: center; line-height: 1.3; max-width: 84px;
    min-height: 27px; display: flex; align-items: flex-start; justify-content: center;
  }

  @media (max-width: 640px) {
    .livCombAxisLabels { width: 38px; }
    .livCombAxisLabel { font-size: 9px; right: 6px; }
  }

  /* ===== Data currency strip — sits under the card title, above the
     income classification tiles, so the survey-year mix behind the
     numbers below is always visible, never buried in a tooltip alone. ===== */
  .livDataCurrency {
    display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: var(--text-secondary);
    background: #f8f8fb; border: 1px solid var(--border); border-radius: var(--radius-sm);
    padding: 8px 12px; margin: 12px 0 16px;
  }
  .livDataCurrency svg { width: 14px; height: 14px; flex-shrink: 0; opacity: 0.7; }

  /* ===== Income ladder ===== */
  .livLadder { display: flex; flex-direction: column; gap: 12px; }
  .livLadderScrollWrap {
    max-height: 460px; overflow-y: auto; padding-right: 8px; margin-right: -8px;
    scrollbar-width: thin; scrollbar-color: var(--border-strong) transparent;
  }
  .livLadderScrollWrap::-webkit-scrollbar { width: 7px; }
  .livLadderScrollWrap::-webkit-scrollbar-track { background: transparent; }
  .livLadderScrollWrap::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 999px; }
  .livLadderScrollWrap::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
  .livLadderAxisLabel { display: flex; justify-content: space-between; font-size: 10.5px; color: var(--text-muted); margin-bottom: 2px; }
  .livLadderAxisMid { font-weight: 700; color: var(--text-secondary); }
  .livLadderRow { display: grid; grid-template-columns: 110px 1fr; align-items: center; gap: 12px; }
  .livLadderRowLabel { font-size: 12px; font-weight: 600; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .livLadderTrack { position: relative; height: 8px; background: #f0f1f4; border-radius: 999px; }
  .livLadderAvgLine { position: absolute; top: -6px; bottom: -6px; width: 0; border-left: 2px dashed var(--text-muted); opacity: 0.6; }
  .livLadderClassLine { width: 0; height: 100%; border-left: 2px dashed; opacity: 0.4; cursor: pointer; }
  .livLadderClassLine:hover { opacity: 0.75; }
  .livLadderDot { width: 14px; height: 14px; border-radius: 999px; background: linear-gradient(135deg,#17a673,#22c55e); box-shadow: 0 2px 8px rgba(23,166,115,0.45); cursor: pointer; }
  .livLadderTrackEmpty {
    height: 8px; border-radius: 999px; cursor: help; display: flex; align-items: center; padding-left: 10px;
    background: repeating-linear-gradient(45deg, #eef0f3, #eef0f3 6px, #e4e6ea 6px, #e4e6ea 12px);
  }
  .livLadderEmptyLabel { font-size: 9.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.03em; }
  .livLadderRowEmpty .livLadderRowLabel { color: var(--text-muted); }

  /* ===== Stacked column (Income Diversification + Farmer Type) ===== */
  .livStackCol { display: flex; flex-direction: column; gap: 20px; }

  /* ===== Donut + legend list (shared by Income Diversification & Farmer Type) ===== */
  .livDonutWrap { display: flex; align-items: center; gap: 16px; flex-wrap: nowrap; }
  .livDonutChartCol { position: relative; width: 150px; height: 150px; flex-shrink: 0; }
  .livDonutSvg { width: 100%; height: 100%; }
  .livDonutSvg circle { cursor: pointer; }
  .livDonutCenter {
    position: absolute; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center; pointer-events: none;
  }
  .livDonutCenterLabel { font-size: 10px; font-weight: 700; color: var(--text-muted); }
  .livDonutCenterValue { font-size: 18px; font-weight: 800; color: var(--text-primary); margin-top: 2px; }

  .livDonutLegendList { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 0; }
  .livDonutLegendRow {
    display: grid; grid-template-columns: 8px 1fr auto; align-items: center; gap: 7px;
    background: #f8f8fb; border-radius: var(--radius-sm); padding: 6px 8px; cursor: pointer;
    transition: box-shadow 0.2s ease;
  }
  .livDonutLegendRow:hover { box-shadow: 0 4px 14px rgba(16,24,40,0.10); }
  .livDonutLegendDot { width: 8px; height: 8px; border-radius: 999px; flex-shrink: 0; }
  .livDonutLegendLabel { font-size: 11.5px; font-weight: 600; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
  .livDonutLegendCount { font-size: 11.5px; font-weight: 700; color: var(--text-primary); }

  @media (max-width: 900px) {
    .livDonutWrap { flex-direction: column; align-items: stretch; }
    .livDonutChartCol { align-self: center; }
  }
  /* ===== Tag mosaic ===== */
  .livMosaic { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .livMosaicEmpty { font-size: 12.5px; color: var(--text-muted); font-style: italic; }
  .livMosaicTag { display: inline-flex; align-items: center; gap: 7px; border-radius: 999px; font-weight: 700; opacity: 0; transform: scale(0.9); transition: opacity 0.4s ease, transform 0.4s ease; cursor: default; }
  .livMosaicTag.in { opacity: 1; transform: scale(1); }
  .livMosaicTag em { font-style: normal; background: rgba(255,255,255,0.65); border-radius: 999px; padding: 1px 7px; font-size: 10px; margin-left: 1px; }
  .livTagIcon { flex-shrink: 0; }
  .livMosaicTag.tone-blue { background: var(--blue-bg); color: var(--blue-text); }
  .livMosaicTag.tone-green { background: var(--green-bg); color: var(--green); }
  .livMosaicTag.tone-purple { background: var(--purple-bg); color: var(--purple-text); }
  .livMosaicTag.tone-orange { background: var(--orange-bg); color: var(--orange-text); }

  /* ===== Waffle chart ===== */
  .livBackyardRow { display: grid; grid-template-columns: 220px 1fr; gap: 28px; align-items: center; }
  .livBackyardTags { min-width: 0; }
  .livWaffleWrap { display: flex; align-items: center; gap: 18px; }
  .livWaffleGrid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 3px; width: 140px; flex-shrink: 0; }
  .livWaffleCell { aspect-ratio: 1; border-radius: 2px; background: #eef0f4; transition: opacity 0.4s ease; }
  .livWaffleValue { font-size: 28px; font-weight: 800; color: var(--text-primary); white-space: nowrap; }
  .livWaffleValue span { font-size: 16px; color: var(--text-muted); margin-left: 1px; }

  .livSubheading { font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px; }
  .livSubheadingWithTip { display: flex; align-items: center; gap: 6px; }
  .livSubheadingRow { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
  .livYearSelectWrap { display: flex; align-items: center; gap: 8px; }
  .livYearSelectLabel { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.03em; }
  .livYearSelect {
    font-family: inherit; font-size: 12.5px; font-weight: 700; color: var(--text-primary);
    background: #f8f8fb; border: 1px solid var(--border-strong); border-radius: var(--radius-sm);
    padding: 6px 10px; cursor: pointer;
  }
  .livYearSelect:hover { border-color: var(--blue); }
  .livYearSelect:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 3px rgba(47,111,237,0.15); }
  .livInlineTip {
    display: inline-flex; align-items: center; justify-content: center;
    width: 15px; height: 15px; border-radius: 999px; border: 1px solid var(--border);
    font-size: 10px; font-weight: 700; color: var(--text-muted); cursor: help; flex-shrink: 0;
  }
  .livInlineTip:hover { background: #f2f3f6; color: var(--text-secondary); }
  .livCaption { font-size: 10.5px; color: var(--text-muted); margin-top: 8px; font-style: italic; }

  /* ===== Even-split two-column layout (crops/livestock treemaps,
     aquaculture systems/products) — distinct from the 1.4fr/1fr
     .overviewGrid used elsewhere ===== */
  .evenGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }

  /* ===== Income classification badge (KPI card) ===== */
  .livIncomeBadge { font-size: 11px; font-weight: 800; padding: 4px 11px; border-radius: 999px; cursor: default; }

  /* ===== Sitio income classification grid ===== */
  .livIncomeClassGrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .livIncomeClassTile {
    background: #f8f8fb; border: 1px solid var(--border); border-radius: var(--radius-sm);
    padding: 12px 14px; opacity: 0; transform: translateY(8px); cursor: pointer;
    transition: opacity 0.4s ease, transform 0.4s ease, box-shadow 0.2s ease;
  }
  .livIncomeClassTile:hover { box-shadow: 0 4px 14px rgba(16,24,40,0.10); }
  .livIncomeClassTile.in { opacity: 1; transform: translateY(0); }
  .livIncomeClassDot { width: 8px; height: 8px; border-radius: 999px; display: inline-block; margin-right: 6px; flex-shrink: 0; }
  .livIncomeClassLabel { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: var(--text-secondary); display: flex; align-items: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .livIncomeClassCount { font-size: 20px; font-weight: 800; margin-top: 6px; color: var(--text-primary); }

  /* ===== Treemap (crops / livestock) ===== */
  .livTreemap { position: relative; width: 100%; }
  .livTreemapTile {
    position: absolute; inset: 2px; border-radius: 7px; color: #fff;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
    padding: 6px; text-align: center; opacity: 0; transform: scale(0.92);
    transition: opacity 0.5s ease, transform 0.5s ease, filter 0.15s ease;
    cursor: pointer; overflow: hidden;
  }
  .livTreemapTile.in { opacity: 1; transform: scale(1); }
  .livTreemapTile:hover { filter: brightness(1.08); }
  .livTreemapLabel {
    font-weight: 800; line-height: 1.2; max-width: 100%;
    white-space: normal; word-break: break-word;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden; text-overflow: ellipsis;
  }
  .livTreemapCount { font-weight: 800; }
  /* ===== Farmers & Farm Area (narrow) + Backyard Food Production side by side ===== */
  .livNarrowGrid { display: grid; grid-template-columns: 0.75fr 1.25fr; gap: 20px; align-items: start; }
  .miniStatRowStack { gap: 10px; }

  @media (max-width: 1200px) {
    .livNarrowGrid { grid-template-columns: 1fr; }
  }
  /* ===== Backyard garden — progress bar + tag list ===== */
  .livGardenWrap { display: flex; flex-direction: column; }
  .livGardenBarHead { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; }
  .livGardenBarLabel { font-size: 13px; font-weight: 700; color: var(--text-primary); }
  .livGardenBarPct { font-size: 15px; font-weight: 800; color: #17a673; }
  .livGardenBarTrack { height: 10px; background: #eef0f4; border-radius: 999px; overflow: hidden; }
  .livGardenBarFill {
    height: 100%; border-radius: 999px;
    background: linear-gradient(90deg, #17a673, #22c55e);
    transition: width 1s cubic-bezier(.16,1,.3,1);
  }
  .livGardenBarSub { font-size: 11.5px; color: var(--text-muted); margin-top: 8px; }

  .livGardenTagsHead { font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-top: 18px; margin-bottom: 8px; }
  .livGardenTags { display: flex; flex-wrap: wrap; gap: 8px; }
  .livGardenTag {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--green-bg); color: var(--green);
    border: 1px solid rgba(23,166,115,0.25);
    border-radius: 999px; padding: 6px 12px;
    font-size: 12px; font-weight: 700; cursor: default;
  }
  .livGardenTag em { font-style: normal; background: rgba(255,255,255,0.65); border-radius: 999px; padding: 1px 7px; font-size: 10.5px; margin-left: 1px; }

  @media (max-width: 1200px) {
    .livBackyardRow { grid-template-columns: 1fr; }
    .livRankedRow { grid-template-columns: 1fr; row-gap: 4px; }
    .livIncomeClassGrid { grid-template-columns: repeat(2, 1fr); }
    .evenGrid { grid-template-columns: 1fr; }
  }
  /* ===== Aquaculture icon-stat row ===== */
  .livAquaStatRow { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
  .livAquaStat {
    display: flex; align-items: center; gap: 12px;
    background: #f8f8fb; border: 1px solid var(--border); border-radius: var(--radius-sm);
    padding: 12px 14px; opacity: 0; transform: translateY(8px);
    transition: opacity 0.4s ease, transform 0.4s ease, box-shadow 0.2s ease;
  }
  .livAquaStat.in { opacity: 1; transform: translateY(0); }
  .livAquaStat:hover { box-shadow: 0 4px 14px rgba(16,24,40,0.08); }
  .livAquaStatIcon {
    width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .livAquaStatIcon svg { width: 17px; height: 17px; }
  .livAquaStatValue { font-size: 17px; font-weight: 800; color: var(--text-primary); line-height: 1.2; }
  .livAquaStatLabel { font-size: 10.5px; font-weight: 600; color: var(--text-muted); margin-top: 2px; }

  @media (max-width: 900px) {
    .livAquaStatRow { grid-template-columns: repeat(2, 1fr); }
  }

  /* ===== Ranked bar list (Aquaculture culture systems / products) ===== */
  .livRankedList { display: flex; flex-direction: column; gap: 12px; }
  .livRankedItem { cursor: default; }
  .livRankedItemHead { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
  .livRankedIconWrap {
    width: 24px; height: 24px; border-radius: 7px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .livRankedIconWrap.tone-blue { background: var(--blue-bg); color: var(--blue-text); }
  .livRankedIconWrap.tone-green { background: var(--green-bg); color: var(--green); }
  .livRankedIconWrap.tone-purple { background: var(--purple-bg); color: var(--purple-text); }
  .livRankedIconWrap.tone-orange { background: var(--orange-bg); color: var(--orange-text); }
  .livRankedLabel { font-size: 12.5px; font-weight: 700; color: var(--text-secondary); flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .livRankedCount { font-size: 12.5px; font-weight: 800; color: var(--text-primary); flex-shrink: 0; }
  .livRankedTrack { height: 6px; background: #eef0f4; border-radius: 999px; overflow: hidden; margin-left: 32px; }
  .livRankedFill { height: 100%; border-radius: 999px; transition: width 1s cubic-bezier(.16,1,.3,1); }
  .livRankedFill.tone-blue { background: linear-gradient(90deg, #2f6fed, #6366f1); }
  .livRankedFill.tone-green { background: linear-gradient(90deg, #17a673, #22c55e); }
  .livRankedFill.tone-purple { background: linear-gradient(90deg, #7c3aed, #a855f7); }
  .livRankedFill.tone-orange { background: linear-gradient(90deg, #f97316, #eab308); }


  /* ===== Source + visualization-rationale popup badge ===== */
  .livSrcBadgeWrap { position: absolute; top: 20px; right: 20px; z-index: 5; }
  .livSrcBadgeBtn {
    width: 26px; height: 26px; border-radius: 999px; cursor: pointer;
    background: #fff; color: var(--text-muted); font-size: 13px; font-weight: 800;
    border: 1px solid var(--border-strong);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 6px rgba(16,24,40,0.08);
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  }
  .livSrcBadgeBtn:hover { border-color: #2f6fed; color: #2f6fed; }
  .livSrcBadgeBtn.active {
    background: #2f6fed; color: #fff; border-color: #2f6fed;
    box-shadow: 0 2px 6px rgba(47,111,237,0.35);
  }

  .livSrcPopup {
    position: absolute; top: 34px; right: 0; width: 300px;
    background: #0e1a2e; border-radius: 12px; padding: 18px 20px;
    box-shadow: 0 12px 30px rgba(0,0,0,0.28);
    animation: livSrcPopIn 0.15s ease-out;
  }
  @keyframes livSrcPopIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

  .livSrcPopupLabel {
    font-size: 10.5px; font-weight: 800; letter-spacing: 0.06em;
    color: #6fa1ff; margin-bottom: 8px;
  }
  .livSrcPopupText { font-size: 13px; line-height: 1.55; color: #e6eaf2; }
  .livSrcPopupLink {
    display: inline-block; margin-top: 10px; font-size: 12.5px; font-weight: 700;
    color: #6fa1ff; text-decoration: underline; word-break: break-word;
  }
  .livSrcPopupLink:hover { color: #9cc0ff; }

  .livSrcPopupNav {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);
  }
  .livSrcPopupDots { display: flex; gap: 5px; }
  .livSrcPopupDot { width: 5px; height: 5px; border-radius: 999px; background: rgba(255,255,255,0.25); }
  .livSrcPopupDot.active { background: #6fa1ff; }
  .livSrcPopupNextBtn {
    font-family: inherit; font-size: 11.5px; font-weight: 700; color: #6fa1ff;
    background: rgba(111,161,255,0.12); border: none; border-radius: 6px;
    padding: 5px 10px; cursor: pointer; display: flex; align-items: center; gap: 4px;
  }
  .livSrcPopupNextBtn:hover { background: rgba(111,161,255,0.22); }
`;