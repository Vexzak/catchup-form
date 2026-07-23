import { useMemo } from 'react';
import TabIcon from './icons';
import {
  pct,
  useInView,
  CountUp,
  InfoTooltip,
  CornerTooltip,
  BarTooltip,
  StatCard,
} from './dashboard';

/* =========================================================================
   INFRASTRUCTURE & UTILITIES — Section D of the Sitio Profiling Form
   (Q42-55). The generated sitio dataset in dashboard.jsx only carries a
   handful of infra fields (electricity/toilet/internet/signal/access), so
   this file derives the rest of Section D — house construction, tenure,
   water source levels, health/education/commerce facility reach, road
   composition, electricity source — deterministically from each sitio's
   id + GIDA status. Swap deriveInfra() for a real Section D fetch later;
   every output key matches a form question so the wiring stays 1:1.

   Q42-43 -> houseConstruction / ownership
   Q44-46 -> waterSources / predominantToilet
   Q47-48 -> facilities.healthCenter/pharmacy/kindergarten/.../madrasah
   Q49    -> avgStudentsPerClassroom
   Q50    -> facilities.market / communityToilet
   Q51    -> roadKm / roadCondition
   Q52-53 -> electricitySource (denominator: sitio.householdsWithElectricity)
   Q54-55 -> sitio.mobileSignal / sitio.householdsWithInternet (upstream)
========================================================================= */

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function makeRand(seedStr) {
  let a = hashSeed(seedStr);
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function distribute(total, weights) {
  const keys = Object.keys(weights);
  const sumW = keys.reduce((s, k) => s + weights[k], 0) || 1;
  let remaining = total;
  const out = {};
  keys.forEach((k, idx) => {
    if (idx === keys.length - 1) {
      out[k] = Math.max(0, remaining);
    } else {
      const v = Math.min(remaining, Math.max(0, Math.round(total * (weights[k] / sumW))));
      out[k] = v;
      remaining -= v;
    }
  });
  return out;
}
function waterPointCounts(rand, presenceProb, maxPoints) {
  if (rand() >= presenceProb) return { count: 0, functional: 0, defective: 0 };
  const count = 1 + Math.floor(rand() * maxPoints);
  const functionalRate = 0.5 + rand() * 0.45;
  const functional = Math.min(count, Math.round(count * functionalRate));
  const defective = count - functional;
  return { count, functional, defective };
}

const FACILITY_META = {
  healthCenter: { label: 'Health Center', group: 'Health' },
  pharmacy: { label: 'Pharmacy', group: 'Health' },
  kindergarten: { label: 'Kindergarten', group: 'Education' },
  elementary: { label: 'Elementary School', group: 'Education' },
  highSchool: { label: 'High School', group: 'Education' },
  madrasah: { label: 'Madrasah', group: 'Education' },
  market: { label: 'Market / Talipapa', group: 'Commerce' },
  communityToilet: { label: 'Community CR', group: 'Commerce' },
};

function deriveInfra(sitio) {
  const rand = makeRand(`${sitio.id}::infra`);
  const gida = sitio.gida;
  const households = sitio.households || 0;

  const houseConstruction = distribute(
    households,
    gida
      ? { concrete: 0.08, wood: 0.3, halfConcrete: 0.22, makeshift: 0.32, other: 0.08 }
      : { concrete: 0.3, wood: 0.22, halfConcrete: 0.3, makeshift: 0.12, other: 0.06 }
  );

  const ownership = distribute(
    households,
    gida
      ? { owned: 0.55, rented: 0.05, portionOfLand: 0.15, informalSettler: 0.18, ownerConstructed: 0.07 }
      : { owned: 0.62, rented: 0.14, portionOfLand: 0.12, informalSettler: 0.06, ownerConstructed: 0.06 }
  );

  const waterSources = {
    natural: waterPointCounts(rand, gida ? 0.55 : 0.25, 3),
    levelI: waterPointCounts(rand, gida ? 0.65 : 0.35, 3),
    levelII: waterPointCounts(rand, gida ? 0.3 : 0.55, 2),
    levelIII: waterPointCounts(rand, gida ? 0.12 : 0.55, 2),
  };

  const toiletWeights = gida
    ? { openPit: 0.42, closedPit: 0.28, overhang: 0.18, waterSealed: 0.12 }
    : { openPit: 0.12, closedPit: 0.22, overhang: 0.16, waterSealed: 0.5 };
  const toiletRoll = rand();
  let acc = 0;
  let predominantToilet = 'waterSealed';
  const toiletEntries = Object.entries(toiletWeights);
  for (let i = 0; i < toiletEntries.length; i += 1) {
    acc += toiletEntries[i][1];
    if (toiletRoll <= acc) {
      predominantToilet = toiletEntries[i][0];
      break;
    }
  }

  const facility = (existProb, distMin, distMax, condMin, condMax) => {
    const exists = rand() < existProb;
    return exists
      ? { exists: true, distance: 0, condition: Math.round(condMin + rand() * (condMax - condMin)) }
      : { exists: false, distance: Number((distMin + rand() * (distMax - distMin)).toFixed(1)), condition: null };
  };

  const hasMoro = (sitio.moroPopulation || 0) > 0;
  const facilities = {
    healthCenter: facility(gida ? 0.3 : 0.72, 3, 16, gida ? 1 : 3, gida ? 3 : 5),
    pharmacy: facility(gida ? 0.18 : 0.55, 4, 18, gida ? 1 : 3, gida ? 3 : 5),
    kindergarten: facility(gida ? 0.45 : 0.85, 2, 10, gida ? 2 : 3, gida ? 4 : 5),
    elementary: facility(gida ? 0.55 : 0.92, 1, 8, gida ? 2 : 3, gida ? 4 : 5),
    highSchool: facility(gida ? 0.22 : 0.6, 3, 14, gida ? 1 : 3, gida ? 3 : 5),
    madrasah: facility(hasMoro ? 0.2 : 0.04, 4, 18, 1, 4),
    market: facility(gida ? 0.25 : 0.68, 3, 15, gida ? 1 : 3, gida ? 3 : 5),
    communityToilet: facility(gida ? 0.2 : 0.45, 2, 10, gida ? 1 : 3, gida ? 3 : 5),
  };
  const hasClassroom = rand() >= (gida ? 0.35 : 0.05);
  const avgStudentsPerClassroom = hasClassroom ? Math.round(gida ? 38 + rand() * 22 : 28 + rand() * 16) : 0;
  const classroomRatioClass = !hasClassroom
    ? 'noClassroom'
    : avgStudentsPerClassroom < 46
    ? 'blue'
    : avgStudentsPerClassroom <= 50
    ? 'yellow'
    : avgStudentsPerClassroom <= 55
    ? 'gold'
    : 'red';

  const roadTotalKm = Number((1.2 + rand() * 6.5).toFixed(1));
  const roadWeights = gida
    ? { asphalt: 0.03, concrete: 0.12, gravel: 0.35, natural: 0.5 }
    : { asphalt: 0.22, concrete: 0.4, gravel: 0.26, natural: 0.12 };
  const roadKm = {};
  let remainKm = roadTotalKm;
  const rKeys = Object.keys(roadWeights);
  rKeys.forEach((k, idx) => {
    if (idx === rKeys.length - 1) {
      roadKm[k] = Number(Math.max(0, remainKm).toFixed(1));
    } else {
      const v = Number((roadTotalKm * roadWeights[k]).toFixed(1));
      roadKm[k] = v;
      remainKm = Number((remainKm - v).toFixed(1));
    }
  });
  const roadCondition = {
    asphalt: Math.round(3 + rand() * 2),
    concrete: Math.round(3 + rand() * 2),
    gravel: Math.round(1 + rand() * 3),
    natural: Math.round(1 + rand() * 2),
  };

  const elecHouseholds = sitio.householdsWithElectricity || 0;
  const elecWeights = gida
    ? { grid: 0.35, solar: 0.3, battery: 0.2, generator: 0.15 }
    : { grid: 0.78, solar: 0.1, battery: 0.06, generator: 0.06 };
  const electricitySource = distribute(elecHouseholds, elecWeights);

  return {
    houseConstruction,
    ownership,
    waterSources,
    predominantToilet,
    facilities,
    avgStudentsPerClassroom,
    hasClassroom,
    classroomRatioClass,
    roadTotalKm,
    roadKm,
    roadCondition,
    electricitySource,
  };
}

function useInfraStats(sitios) {
  return useMemo(() => {
    const total = sitios.length;
    if (!total) return null;

    const houseConstruction = { concrete: 0, wood: 0, halfConcrete: 0, makeshift: 0, other: 0 };
    const ownership = { owned: 0, rented: 0, portionOfLand: 0, informalSettler: 0, ownerConstructed: 0 };
    const waterAgg = {
      natural: { sitios: 0, functional: 0, defective: 0 },
      levelI: { sitios: 0, functional: 0, defective: 0 },
      levelII: { sitios: 0, functional: 0, defective: 0 },
      levelIII: { sitios: 0, functional: 0, defective: 0 },
    };
    const toiletCounts = { openPit: 0, closedPit: 0, overhang: 0, waterSealed: 0 };
    const roadKmTotals = { asphalt: 0, concrete: 0, gravel: 0, natural: 0 };
    const roadConditionSum = { asphalt: 0, concrete: 0, gravel: 0, natural: 0 };
    const elecSourceTotals = { grid: 0, solar: 0, battery: 0, generator: 0 };
    const facilityAgg = {};
    Object.keys(FACILITY_META).forEach((k) => {
      facilityAgg[k] = { existsCount: 0, distanceSum: 0, distanceCount: 0, conditionSum: 0, conditionCount: 0, ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    });
    const mobileSignalCounts = { None: 0, '2G': 0, '3G': 0, '4G': 0, '5G': 0 };
    const classroomBuckets = { blue: 0, yellow: 0, gold: 0, red: 0, noClassroom: 0 };

    let totalHouseholds = 0;
    let totalWithoutToilet = 0;
    let sitiosWithoutToilet = 0;
    let internetHouseholdsSum = 0;
    let studentsPerClassroomSum = 0;

    sitios.forEach((s) => {
      const infra = deriveInfra(s);
      Object.keys(houseConstruction).forEach((k) => { houseConstruction[k] += infra.houseConstruction[k]; });
      Object.keys(ownership).forEach((k) => { ownership[k] += infra.ownership[k]; });
      Object.keys(waterAgg).forEach((k) => {
        const w = infra.waterSources[k];
        if (w.count > 0) {
          waterAgg[k].sitios += 1;
          waterAgg[k].functional += w.functional;
          waterAgg[k].defective += w.defective;
        }
      });
      toiletCounts[infra.predominantToilet] += 1;
      Object.keys(roadKmTotals).forEach((k) => { roadKmTotals[k] += infra.roadKm[k]; });
      Object.keys(roadConditionSum).forEach((k) => { roadConditionSum[k] += infra.roadCondition[k]; });
      Object.keys(elecSourceTotals).forEach((k) => { elecSourceTotals[k] += infra.electricitySource[k]; });
      Object.keys(FACILITY_META).forEach((k) => {
        const f = infra.facilities[k];
        if (f.exists) {
          facilityAgg[k].existsCount += 1;
          facilityAgg[k].conditionSum += f.condition;
          facilityAgg[k].conditionCount += 1;
          facilityAgg[k].ratingCounts[f.condition] = (facilityAgg[k].ratingCounts[f.condition] || 0) + 1;
        } else {
          facilityAgg[k].distanceSum += f.distance;
          facilityAgg[k].distanceCount += 1;
        }
      });
      mobileSignalCounts[s.mobileSignal] = (mobileSignalCounts[s.mobileSignal] || 0) + 1;

      totalHouseholds += s.households || 0;
      totalWithoutToilet += s.householdsWithoutToilet || 0;
      if ((s.householdsWithoutToilet || 0) > 0) sitiosWithoutToilet += 1;
      internetHouseholdsSum += s.householdsWithInternet || 0;
      studentsPerClassroomSum += infra.avgStudentsPerClassroom;
      classroomBuckets[infra.classroomRatioClass] += 1;
    });

    const housePct = {};
    Object.keys(houseConstruction).forEach((k) => { housePct[k] = pct(houseConstruction[k], totalHouseholds); });
    const ownershipPct = {};
    Object.keys(ownership).forEach((k) => { ownershipPct[k] = pct(ownership[k], totalHouseholds); });

    const waterRows = Object.keys(waterAgg).map((k) => ({
      key: k,
      sitios: waterAgg[k].sitios,
      functional: waterAgg[k].functional,
      defective: waterAgg[k].defective,
    }));

    const toiletPct = {};
    Object.keys(toiletCounts).forEach((k) => { toiletPct[k] = pct(toiletCounts[k], total); });
    const withoutToiletPct = pct(totalWithoutToilet, totalHouseholds);

    const roadKmTotal = Object.values(roadKmTotals).reduce((a, b) => a + b, 0);
    const roadRows = Object.keys(roadKmTotals).map((k) => ({
      key: k,
      km: roadKmTotals[k],
      pctOfTotal: pct(roadKmTotals[k], roadKmTotal),
      avgCondition: roadConditionSum[k] / total,
    }));

    const elecSourceTotal = Object.values(elecSourceTotals).reduce((a, b) => a + b, 0);
    const elecSourcePct = {};
    Object.keys(elecSourceTotals).forEach((k) => { elecSourcePct[k] = pct(elecSourceTotals[k], elecSourceTotal); });
    const electrifiedHouseholds = elecSourceTotal;
    const electricityAccessPct = pct(electrifiedHouseholds, totalHouseholds);

    const facilityRows = Object.entries(FACILITY_META).map(([key, meta]) => {
      const agg = facilityAgg[key];
      return {
        key,
        label: meta.label,
        group: meta.group,
        existsCount: agg.existsCount,
        existsPct: pct(agg.existsCount, total),
        avgCondition: agg.conditionCount ? agg.conditionSum / agg.conditionCount : 0,
        avgDistance: agg.distanceCount ? agg.distanceSum / agg.distanceCount : 0,
        ratingCounts: agg.ratingCounts,
      };
    });

    const facilityRatingTotals = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    facilityRows.forEach((f) => {
      [1, 2, 3, 4, 5].forEach((n) => { facilityRatingTotals[n] += f.ratingCounts[n] || 0; });
    });
    const facilityExistsTotal = facilityRows.reduce((s, f) => s + f.existsCount, 0);

    const mobileSignalPct = {};
    Object.keys(mobileSignalCounts).forEach((k) => { mobileSignalPct[k] = pct(mobileSignalCounts[k], total); });
    const internetPct = pct(internetHouseholdsSum, totalHouseholds);

    const waterFunctionalityPct = pct(
      Object.values(waterAgg).reduce((a, b) => a + b.functional, 0),
      Object.values(waterAgg).reduce((a, b) => a + b.functional + b.defective, 0)
    );
    const housingAtRiskPct = pct(houseConstruction.makeshift + houseConstruction.other, totalHouseholds);
    const missingFacilityDistances = facilityRows.filter((f) => f.avgDistance > 0);
    const avgFacilityGapKm = missingFacilityDistances.length
      ? missingFacilityDistances.reduce((s, f) => s + f.avgDistance, 0) / missingFacilityDistances.length
      : 0;

    return {
      total,
      totalHouseholds,
      totalWithoutToilet,
      housePct,
      ownershipPct,
      waterRows,
      toiletPct,
      withoutToiletPct,
      sitiosWithoutToilet,
      roadRows,
      roadKmTotal,
      elecSourcePct,
      facilityRows,
      mobileSignalPct,
      internetPct,
      avgStudentsPerClassroom: studentsPerClassroomSum / total,
      waterFunctionalityPct,
      housingAtRiskPct,
      avgFacilityGapKm,
      classroomBuckets,
      mobileSignalCounts,
      facilityRatingTotals,
      facilityExistsTotal,
      electrifiedHouseholds,
      electricityAccessPct,
    };
  }, [sitios]);
}

/* ---------------------------- visual pieces ---------------------------- */

const HOUSE_COLORS = { concrete: '#2f6fed', wood: '#eab308', halfConcrete: '#17a673', makeshift: '#e0392f', other: '#9497a1' };
const HOUSE_LABELS = { concrete: 'Concrete', wood: 'Wood', halfConcrete: 'Half-concrete', makeshift: 'Makeshift', other: 'Other' };
const OWNERSHIP_LABELS = { owned: 'Owned', rented: 'Rented', portionOfLand: 'Portion of land', informalSettler: 'Informal settler', ownerConstructed: "Owner-built, other's lot" };
const OWNERSHIP_COLORS = { owned: '#17a673', rented: '#2f6fed', portionOfLand: '#eab308', informalSettler: '#e0392f', ownerConstructed: '#7c3aed' };
const WATER_LABELS = { natural: 'Natural (spring/river/well)', levelI: 'Level I (point source)', levelII: 'Level II (communal faucet)', levelIII: 'Level III (house connection)' };
const TOILET_LABELS = { openPit: 'Open Defecation', closedPit: 'Pit Latrine', overhang: 'Community CR', waterSealed: 'Water Sealed' };
const ROAD_LABELS = { asphalt: 'Asphalt', concrete: 'Concrete', gravel: 'Gravel', natural: 'Natural / earth' };
const ROAD_COLORS = { asphalt: '#2a2d34', concrete: '#8b8f99', gravel: '#c8956d', natural: '#8a6b4a' };
const ROAD_MARKINGS = { asphalt: true, concrete: true, gravel: false, natural: false };
const ELEC_LABELS = { grid: 'Grid', solar: 'Solar', battery: 'Battery', generator: 'Generator' };
const ELEC_COLORS = { grid: '#2f6fed', solar: '#eab308', battery: '#17a673', generator: '#e0392f' };
// Source: Department of Energy (DOE) Household Electrification Program, 2024.
const PH_ELECTRIFICATION_AVG_PCT = 93.12;
// Source: PSA/DICT 2024 National ICT Household Survey (NICTHS).
const PH_INTERNET_AVG_PCT = 48.8;
const SIGNAL_ORDER = ['None', '2G', '3G', '4G', '5G'];
const SIGNAL_COLORS = { None: '#9497a1', '2G': '#e0392f', '3G': '#eab308', '4G': '#17a673', '5G': '#2f6fed' };
const RATING_META = {
  5: { label: '5 · Excellent — optimal condition, newly built or exceeds standard', color: '#17a673' },
  4: { label: '4 · Good — fully functional, only routine maintenance needed', color: '#4ade80' },
  3: { label: '3 · Average — functional with minor defects, needs minor repairs', color: '#eab308' },
  2: { label: '2 · Poor — functional but significant wear, needs major repairs soon', color: '#f97316' },
  1: { label: '1 · Bad — severely damaged or non-functional, needs immediate intervention', color: '#e0392f' },
};

function toWaffleCells(pctObj, order) {
  const raw = order.map((k) => ({ k, exact: (pctObj[k] || 0) }));
  const cells = raw.map((r) => ({ k: r.k, count: Math.floor(r.exact), rem: r.exact - Math.floor(r.exact) }));
  let assigned = cells.reduce((s, c) => s + c.count, 0);
  let remaining = 100 - assigned;
  const sorted = [...cells].sort((a, b) => b.rem - a.rem);
  for (let i = 0; i < remaining; i += 1) sorted[i % sorted.length].count += 1;
  const out = [];
  order.forEach((k) => {
    const c = cells.find((x) => x.k === k);
    for (let i = 0; i < c.count; i += 1) out.push(k);
  });
  while (out.length < 100) out.push(order[order.length - 1]);
  return out.slice(0, 100);
}

function HousingWaffle({ housePct }) {
  const visible = useInView(120);
  const order = ['concrete', 'halfConcrete', 'wood', 'makeshift', 'other'];
  const cells = useMemo(() => toWaffleCells(housePct, order), [housePct]);
  return (
    <div className="infraWaffleWrap">
      <div className={`infraWaffle${visible ? ' in' : ''}`}>
        {cells.map((k, i) => (
          <span
            key={i}
            className="infraWaffleCell"
            style={{ background: HOUSE_COLORS[k], transitionDelay: `${(i % 10) * 12 + Math.floor(i / 10) * 12}ms` }}
          />
        ))}
      </div>
      <div className="infraLegendCol">
        {order.map((k) => (
          <InfoTooltip key={k} text={`${HOUSE_LABELS[k]} · ${housePct[k].toFixed(1)}% of households`} trigger="click">
            <span className="infraLegendItem">
              <span className="dot" style={{ background: HOUSE_COLORS[k] }} />
              {HOUSE_LABELS[k]} <b>{housePct[k].toFixed(1)}%</b>
            </span>
          </InfoTooltip>
        ))}
      </div>
    </div>
  );
}

function OwnershipRow({ ownerKey, value, index }) {
  const visible = useInView(index * 60 + 100);
  return (
    <BarTooltip text={`${OWNERSHIP_LABELS[ownerKey]} · ${value.toFixed(1)}% of households`}>
      <div className={`infraLedgerRow${visible ? ' in' : ''}`}>
        <div className="infraLedgerLabel">{OWNERSHIP_LABELS[ownerKey]}</div>
        <div className="infraLedgerTrack">
          <div
            className="infraLedgerFill"
            style={{ width: visible ? `${value}%` : 0, background: OWNERSHIP_COLORS[ownerKey] }}
          />
        </div>
        <div className="infraLedgerValue">{value.toFixed(1)}%</div>
      </div>
    </BarTooltip>
  );
}

function OwnershipLedger({ ownershipPct }) {
  const order = ['owned', 'portionOfLand', 'ownerConstructed', 'informalSettler', 'rented'];
  return (
    <div className="infraLedger">
      {order.map((k, i) => (
        <OwnershipRow key={k} ownerKey={k} value={ownershipPct[k]} index={i} />
      ))}
    </div>
  );
}

function WaterSourceRow({ waterKey, row, index }) {
  const visible = useInView(index * 60 + 100);
  return (
    <BarTooltip
      text={`${WATER_LABELS[waterKey]} · ${row.sitios} sitio${row.sitios === 1 ? '' : 's'} reporting this source · ${row.functional} functional, ${row.defective} defective`}
    >
      <div className={`waterTableRow${visible ? ' in' : ''}`}>
        <div className="waterTableLabel">{WATER_LABELS[waterKey].split(' (')[0]}</div>
        <div className="waterTableCell"><span className="waterSitioBadge">{row.sitios}</span></div>
        <div className="waterTableCell waterFunctional">{row.functional}</div>
        <div className="waterTableCell waterDefective">
          {row.defective > 0 ? row.defective : <span className="waterZero">0</span>}
        </div>
      </div>
    </BarTooltip>
  );
}

function ToiletDonut({ toiletPct, withoutToiletPct, sitiosWithoutToilet, total, totalHouseholds, householdsWithToilet }) {
  const visible = useInView(140);
  const size = 160;
  const stroke = 26;
  const r = (size - stroke) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * r;
  const order = ['waterSealed', 'closedPit', 'overhang', 'openPit'];
  const colors = { waterSealed: '#17a673', closedPit: '#eab308', overhang: '#2f6fed', openPit: '#e0392f' };
  let offset = 0;
  return (
    <div className="infraDonutWrap">
      <div className="infraDonutSvgWrap">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={center} cy={center} r={r} fill="none" stroke="#f0f1f4" strokeWidth={stroke} />
          {order.map((k, i) => {
            const fraction = (toiletPct[k] || 0) / 100;
            const dash = visible ? fraction * circumference : 0;
            const seg = (
              <circle
                key={k}
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke={colors[k]}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${center} ${center})`}
                style={{ transition: 'stroke-dasharray 1s cubic-bezier(.16,1,.3,1)', transitionDelay: `${i * 100}ms` }}
              />
            );
            offset += visible ? fraction * circumference : 0;
            return seg;
          })}
        </svg>
        <div className="infraDonutCenter">
          <InfoTooltip text="Number of households with a toilet in a sitio" trigger="click">
            <div style={{ width: '100%', textAlign: 'center' }}>
              <div className="infraDonutCenterValue">{householdsWithToilet}</div>
              <div className="infraDonutCenterLabel">HH with toilet</div>
            </div>
          </InfoTooltip>
        </div>
      </div>
      <div className="infraLegendCol toiletLegendCol">
        {order.map((k) => (
          <InfoTooltip key={k} text={`${TOILET_LABELS[k]} · ${toiletPct[k].toFixed(1)}% of sitios`} trigger="click">
            <span className="infraLegendItem small toiletLegendRow">
              <span className="dot" style={{ background: colors[k] }} />
              {TOILET_LABELS[k]} <b>{toiletPct[k].toFixed(1)}%</b>
            </span>
          </InfoTooltip>
        ))}
      </div>
    </div>
  );
}

function WaterTower({ waterRows, withoutToiletPct, toiletPct, sitiosWithoutToilet, total, totalHouseholds, householdsWithToilet }) {
  const order = ['natural', 'levelI', 'levelII', 'levelIII'];
  const byKey = Object.fromEntries(waterRows.map((r) => [r.key, r]));
  return (
    <div className="infraWaterSplit">
      <div className="infraSubCard" style={{ position: 'relative' }}>
        <CornerTooltip
          title="Source"
          trigger="click"
          text="Q44 — Water sources and functionality, per the DOH-LWUA Water Supply Classification."
          linkHref="https://lwua.gov.ph"
          linkLabel="lwua.gov.ph"
          whyText="A table is used here because the reader needs exact functional-vs-defective counts per source type, not just an approximate shape — tables preserve precision for lookup tasks that a chart would blur."
          whyLinkHref="https://www.domo.com/learn/charts/charts-vs-tables-which-one-to-use"
          whyLinkLabel="Domo — Charts vs. Tables: which one to use"
        />
        <div className="infraSubCardTitle">Water Source Levels</div>
        <div className="waterTable">
          <div className="waterTableHead">
            <div className="waterTableLabel">Source Type</div>
            <div className="waterTableCell">Sitios</div>
            <div className="waterTableCell waterFunctional">Functional</div>
            <div className="waterTableCell waterDefective">Defective</div>
          </div>
          {order.map((k, i) => (
            <WaterSourceRow key={k} waterKey={k} row={byKey[k]} index={i} />
          ))}
        </div>
      </div>
      <div className="infraSubCard" style={{ position: 'relative' }}>
        <CornerTooltip
          title="Source"
          trigger="click"
          text="Q45-46 — Predominant toilet facility type, per PSA CBMS Core Indicator (d)."
          linkHref="https://cbms.psa.gov.ph"
          linkLabel="cbms.psa.gov.ph"
          whyText="Donut chart used because there are only 4 discrete toilet-type categories, which keeps the ring readable, and the hollow center gives a dedicated slot for the 'HH with toilet' headline number without adding a separate stat card."
          whyLinkHref="https://www.domo.com/learn/charts/donut-charts"
          whyLinkLabel="Domo — What Is a Donut Chart?"
        />
        <div className="infraSubCardTitle">
          Predominant Toilet Facility Type
        </div>
        <ToiletDonut toiletPct={toiletPct} withoutToiletPct={withoutToiletPct} sitiosWithoutToilet={sitiosWithoutToilet} total={total} totalHouseholds={totalHouseholds} householdsWithToilet={householdsWithToilet} />
      </div>
    </div>
  );
}

function RoadRibbon({ roadRows, roadKmTotal }) {
  const visible = useInView(140);
  const order = ['asphalt', 'concrete', 'gravel', 'natural'];
  const byKey = Object.fromEntries(roadRows.map((r) => [r.key, r]));
  return (
    <div>
      <div className={`infraRoadRibbon${visible ? ' in' : ''}`}>
        {order.map((k) => {
          const row = byKey[k];
          return (
            <BarTooltip
              key={k}
              text={`${ROAD_LABELS[k]} · ${row.km.toFixed(1)} km (${row.pctOfTotal.toFixed(1)}%) · avg condition ${row.avgCondition.toFixed(1)}/5`}
              style={{ width: visible ? `${row.pctOfTotal}%` : 0 }}
            >
              <div className={`infraRoadSeg${ROAD_MARKINGS[k] ? ' roadMarking' : ''}`} style={{ background: ROAD_COLORS[k] }} />
            </BarTooltip>
          );
        })}
      </div>
      <div className="infraRoadLegend">
        {order.map((k) => (
          <span key={k} className="infraLegendItem small">
            <span className="dot" style={{ background: ROAD_COLORS[k] }} />
            {ROAD_LABELS[k]} &middot; {byKey[k].km.toFixed(1)} km
          </span>
        ))}
        <span className="infraRoadTotal">Total surveyed: <b>{roadKmTotal.toFixed(1)} km</b></span>
      </div>
    </div>
  );
}

function ConditionTicks({ rating }) {
  return (
    <div className="infraSignalTicks">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className="infraSignalTick"
          style={{
            height: `${6 + n * 2.4}px`,
            background: n <= Math.round(rating) ? (rating >= 4 ? '#17a673' : rating >= 2.5 ? '#eab308' : '#e0392f') : '#e7e8ec',
          }}
        />
      ))}
    </div>
  );
}

function FacilityConditionLegend() {
  const order = [5, 4, 3, 2, 1];
  return (
    <div className="infraConditionLegend">
      {order.map((n) => {
        const meta = RATING_META[n];
        return (
          <InfoTooltip key={n} text={meta.label} trigger="click">
            <div className="infraConditionLegendBadge" style={{ background: meta.color }}>{n}</div>
          </InfoTooltip>
        );
      })}
    </div>
  );
}

function FacilityConditionCounts({ ratingCounts }) {
  const order = [5, 4, 3, 2, 1];
  return (
    <div className="infraConditionCounts">
      {order.map((n) => {
        const count = ratingCounts?.[n] || 0;
        const meta = RATING_META[n];
        return (
          <InfoTooltip key={n} text={`${meta.label} · ${count} sitio${count === 1 ? '' : 's'}`} trigger="click">
            <div className={`infraConditionCount${count === 0 ? ' zero' : ''}`}>{count}</div>
          </InfoTooltip>
        );
      })}
    </div>
  );
}

function FacilityReach({ facilityRows, total, facilityRatingTotals, facilityExistsTotal }) {
  const groups = ['Health', 'Education', 'Commerce'];
  return (
    <div className="infraFacilityGrid">
      <div className="infraFacilityLegendRow">
        <div className="infraFacilityName" />
        <FacilityConditionLegend />
        <div className="infraFacilityDistance">Total Facilities</div>
      </div>
      {groups.map((g) => (
        <div className="infraFacilityGroup" key={g}>
          <div className="infraFacilityGroupTitle">{g}</div>
          {facilityRows
            .filter((f) => f.group === g)
            .map((f) => (
              <div className="infraFacilityRow" key={f.key}>
                <div className="infraFacilityName">{f.label}</div>
                <FacilityConditionCounts ratingCounts={f.ratingCounts} />
                <InfoTooltip text={`Present in ${f.existsCount} of ${total} sitios (${f.existsPct.toFixed(1)}%)`} trigger="click">
                  <div className="infraFacilityDistance" style={{ width: '100%', textAlign: 'right' }}>
                    {f.existsCount} / {total}
                  </div>
                </InfoTooltip>
              </div>
            ))}
        </div>
      ))}
      <div className="infraFacilityTotalsRow">
        <div className="infraFacilityName">Total</div>
        <div className="infraConditionCounts">
          {[5, 4, 3, 2, 1].map((n) => (
            <InfoTooltip key={n} text={`${facilityRatingTotals[n]} total facility reports rated ${n}`} trigger="click">
              <div className="infraConditionCount infraConditionTotalCount">{facilityRatingTotals[n]}</div>
            </InfoTooltip>
          ))}
        </div>
        <div className="infraFacilityDistance" style={{ width: '100%', textAlign: 'right' }}>
          {facilityExistsTotal} facilities
        </div>
      </div>
    </div>
  );
}

function ClassroomDensityCard({ classroomBuckets, total }) {
  const compliant = classroomBuckets.blue;
  const needIntervention = total - compliant;
  const compliantPct = pct(compliant, total);
  const interventionPct = pct(needIntervention, total);

  const rows = [
    { key: 'blue', color: '#2f6fed', label: '<46 (Blue)', desc: 'Meet RA 7880 with one shift', count: classroomBuckets.blue },
    { key: 'yellow', color: '#eab308', label: '46-50 (Yellow)', desc: 'Fails to meet RA 7880 with one shift', count: classroomBuckets.yellow },
    { key: 'gold', color: '#f97316', label: '51-55 (Gold)', desc: 'Does not meet RA 7880 even with double shifting', count: classroomBuckets.gold },
    { key: 'red', color: '#e0392f', label: '>56 (Red)', desc: 'Severe shortage of classrooms', count: classroomBuckets.red },
    { key: 'noClassroom', color: '#3f3f46', label: 'No Classroom (Black)', desc: 'No existing instructional rooms', count: classroomBuckets.noClassroom },
  ];

  return (
    <div className="overviewCard classroomDensityCard">
      <CornerTooltip
        title="Source"
        trigger="click"
        text="Q49 — Pupil-to-classroom ratio thresholds, per Republic Act 7880 (Fair and Equitable Access to Education Act) and DepEd BEIS classroom data."
        linkHref="https://beis.deped.gov.ph"
        linkLabel="beis.deped.gov.ph"
        whyText="A color-coded severity bucket (blue/yellow/gold/red/black) is used instead of a raw bar chart because the point isn't the exact ratio — it's which policy-defined compliance tier a sitio falls into, so a status classification communicates the actionable threshold faster than a continuous scale would."
        whyLinkHref="https://udair.missouri.edu/visualization-chart-best-practices/"
        whyLinkLabel="UDAIR — Visualization Best Practices"
      />
          <div className="overviewCardHead">
            <div className="overviewCardIcon" style={{ background: '#f2e9fb', color: '#7c3aed' }}>
              <TabIcon name="doc" />
            </div>
            <div>
              <div className="overviewCardTitle">Classroom Density</div>
              <div className="overviewCardSub">Pupil:Room Ratio Analysis</div>
            </div>
          </div>

      <div className="classroomComplianceBox">
        <div className="classroomComplianceTitle">RA 7880 COMPLIANCE SUMMARY</div>
        <div className="classroomComplianceStats">
          <div>
            <div className="classroomComplianceLabel">Compliant Sitios</div>
            <div className="classroomComplianceValue compliant">{compliant}</div>
            <div className="classroomComplianceSub">{compliantPct.toFixed(0)}% of total</div>
          </div>
          <div>
            <div className="classroomComplianceLabel">Need Intervention</div>
            <div className="classroomComplianceValue intervention">{needIntervention}</div>
            <div className="classroomComplianceSub">{interventionPct.toFixed(0)}% of total</div>
          </div>
        </div>
        <div className="classroomComplianceNote">
          {needIntervention} sitio{needIntervention === 1 ? '' : 's'} ({interventionPct.toFixed(0)}%) require intervention for classroom shortage
        </div>
      </div>

      <div className="classroomBreakdownTitle">BREAKDOWN BY PUPIL:ROOM RATIO</div>
      <div className="classroomBreakdownList">
        {rows.map((r) => (
          <div className="classroomBreakdownRow" key={r.key}>
            <div className="classroomBreakdownHead">
              <span className="classroomBreakdownLabel">
                <span className="dot" style={{ background: r.color }} />
                {r.label}
              </span>
              <span className="classroomBreakdownCount">{r.count} sitio{r.count === 1 ? '' : 's'}</span>
            </div>
            <div className="classroomBreakdownDesc">{r.desc}</div>
          </div>
        ))}
      </div>

      <div className="classroomInfoBox">
        <div className="classroomInfoTitle">REPUBLIC ACT 7880</div>
        <div className="classroomInfoText">
          Fair and Equitable Access to Education Act &mdash; mandates reasonable pupil-classroom ratio to ensure quality education delivery.
        </div>
        <div className="classroomInfoSource">
          Source: <a href="https://beis.deped.gov.ph" target="_blank" rel="noreferrer">Basic Education Information System (BEIS)</a>
        </div>
      </div>
    </div>
  );
}

function ElectricitySourceBar({ elecSourcePct, elecSourceTotals, electrifiedHouseholds, totalHouseholds, electricityAccessPct }) {
  const visible = useInView(160);
  const order = ['grid', 'solar', 'battery', 'generator'];
  const diffPct = electricityAccessPct - PH_ELECTRIFICATION_AVG_PCT;
  const isBelow = diffPct < 0;
  return (
    <div className="elecAccessWrap">
      <div className="elecAccessHead">
        <div className="elecAccessTitle">Electricity Access</div>
        <div className="elecAccessPct">{electricityAccessPct.toFixed(1)}%</div>
      </div>
      <div className="elecAccessTrack">
        <div className="elecAccessFill" style={{ width: visible ? `${electricityAccessPct}%` : 0 }} />
      </div>
      <div className="elecAccessSubRow">
        <div className="elecAccessSub">{electrifiedHouseholds} of {totalHouseholds} households</div>
        {PH_ELECTRIFICATION_AVG_PCT != null ? (
          <div className="elecAccessBenchmark">PH Avg: {PH_ELECTRIFICATION_AVG_PCT.toFixed(2)}%</div>
        ) : null}
      </div>
      {PH_ELECTRIFICATION_AVG_PCT != null ? (
        <InfoTooltip text="Source: Department of Energy (DOE) Household Electrification Program, 2024." trigger="click">
          <div className={`elecCompareBadge${isBelow ? ' below' : ' above'}`}>
            <span className="elecCompareArrow">{isBelow ? '↘' : '↗'}</span>
            Electricity {Math.abs(diffPct).toFixed(1)}% {isBelow ? 'below avg' : 'above avg'}
          </div>
        </InfoTooltip>
      ) : null}

      <div className="elecSourceBox">
        <div className="elecSourceBoxTitle">SOURCE BREAKDOWN (PER HOUSEHOLD)</div>
        {order.map((k) => (
          <BarTooltip key={k} text={`${ELEC_LABELS[k]} · ${elecSourceTotals[k]} households · ${elecSourcePct[k].toFixed(1)}%`}>
            <div className="elecSourceRow">
              <div className="elecSourceLabel">{ELEC_LABELS[k]}</div>
              <div className="elecSourceTrack">
                <div className="elecSourceFill" style={{ width: visible ? `${elecSourcePct[k]}%` : 0, background: ELEC_COLORS[k] }} />
              </div>
              <div className="elecSourceCount">({elecSourceTotals[k]})</div>
              <div className="elecSourcePct">{elecSourcePct[k].toFixed(0)}%</div>
            </div>
          </BarTooltip>
        ))}
      </div>
    </div>
  );
}

function SignalLadder({ mobileSignalPct, mobileSignalCounts, internetPct }) {
  const visible = useInView(180);
  const pillOrder = ['2G', '3G', '4G', '5G'];
  const distOrder = ['5G', '4G', '3G', '2G', 'None'];
  const internetDiffPct = internetPct - PH_INTERNET_AVG_PCT;
  const internetIsBelow = internetDiffPct < 0;
  return (
    <div>
      <div className={`signalPillRow${visible ? ' in' : ''}`}>
        {pillOrder.map((k) => {
          const present = (mobileSignalCounts?.[k] || 0) > 0;
          return (
            <BarTooltip key={k} text={`${k} · ${(mobileSignalPct[k] || 0).toFixed(1)}% of sitios`}>
              <div className="signalPillCol">
                <div className={`signalPill${present ? ' active' : ''}`} />
                <div className={`signalPillLabel${present ? ' active' : ''}`}>{k}</div>
              </div>
            </BarTooltip>
          );
        })}
      </div>

      <div className="signalDistBox">
        <div className="signalDistTitle">SITIO DISTRIBUTION</div>
        {distOrder.map((k) => (
          <div className="signalDistRow" key={k}>
            <div className="signalDistLabel">{k}</div>
            <div className="signalDistRight">
              <span className="signalDistCount">{mobileSignalCounts?.[k] || 0}</span>
              <span className="signalDistPct">{(mobileSignalPct[k] || 0).toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="infraInternetRow">
        <div className="infraInternetLabel">Household internet access</div>
        <div className="infraInternetTrack">
          <div className="infraInternetFill" style={{ width: visible ? `${internetPct}%` : 0 }} />
        </div>
        <div className="infraInternetValue">{internetPct.toFixed(1)}%</div>
      </div>
      <InfoTooltip text="Source: PSA/DICT 2024 National ICT Household Survey (NICTHS)." trigger="click">
        <div className={`elecCompareBadge${internetIsBelow ? ' below' : ' above'}`} style={{ marginTop: 8 }}>
          <span className="elecCompareArrow">{internetIsBelow ? '↘' : '↗'}</span>
          Internet {Math.abs(internetDiffPct).toFixed(1)}% {internetIsBelow ? 'below avg' : 'above avg'}
        </div>
      </InfoTooltip>
    </div>
  );
}

/* ------------------------------- panel ------------------------------- */

export default function InfrastructurePanel({ sitios, hasFilters, onClearFilters }) {
  const stats = useInfraStats(sitios);

  if (!stats) {
    return (
      <div className="panelEmpty">
        <div className="panelEmptyIcon"><TabIcon name="building" /></div>
        <div className="panelEmptyTitle">No sitios match these filters</div>
        <div className="panelEmptySub">Try a different municipality, barangay, or search term.</div>
        {hasFilters ? (
          <button type="button" className="clearFiltersBtn" onClick={onClearFilters}>Clear filters</button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="panelStack infraPanel">
      <style>{INFRA_CSS}</style>


      <div className="infraTwoCol">
        <div className="overviewCard" style={{ position: 'relative' }}>
          <CornerTooltip
            title="Source"
            trigger="click"
            text="Q42-43 — House construction type and type of ownership, per PSA CBMS Housing Indicator."
            linkHref="https://cbms.psa.gov.ph"
            linkLabel="cbms.psa.gov.ph"
            whyText="Waffle chart used because position/area judgments in a 10x10 grid let viewers count exact household shares, whereas angle-based encodings like a pie make it hard to judge whether one construction type is meaningfully bigger than another."
            whyLinkHref="https://www.cdc.gov/wcms/4.0/cdc-wp/data-presentation/waffle-chart.html"
            whyLinkLabel="CDC — Waffle Chart Best Practices"
          />
          <div className="overviewCardHead">
            <div className="overviewCardIcon" style={{ background: '#e8f0fe', color: '#2f6fed' }}>
              <TabIcon name="building" />
            </div>
            <div>
              <div className="overviewCardTitle">Housing Construction</div>
              <div className="overviewCardSub">Estimated household count per construction type</div>
            </div>
          </div>
          <HousingWaffle housePct={stats.housePct} />
        </div>

        <div className="overviewCard" style={{ position: 'relative' }}>
          <CornerTooltip
            title="Source"
            trigger="click"
            text="Q43 — Type of land/home ownership, per PSA CBMS Housing Indicator."
            linkHref="https://cbms.psa.gov.ph"
            linkLabel="cbms.psa.gov.ph"
            whyText="Sorted horizontal bars are used because position along a common scale is the most accurately-judged encoding for ranking categories, and horizontal orientation keeps long labels like 'Owner-built, other's lot' fully readable without rotation."
            whyLinkHref="https://medium.com/@antonioneto_17307/ranking-charts-425c900436f9"
            whyLinkLabel="Ranking Charts — Few & Knaflic on sorted bars"
          />
          <div className="overviewCardHead">
            <div className="overviewCardIcon" style={{ background: '#f2e9fb', color: '#7c3aed' }}>
              <TabIcon name="doc" />
            </div>
            <div>
              <div className="overviewCardTitle">Land &amp; Home Tenure</div>
              <div className="overviewCardSub">Ownership status across all households</div>
            </div>
          </div>
          <OwnershipLedger ownershipPct={stats.ownershipPct} />
        </div>
      </div>

      <div className="sectionCard">
        <div className="overviewCardHead">
          <div className="overviewCardIcon" style={{ background: '#e6fbf5', color: '#0ea5e9' }}>
            <TabIcon name="pulse" />
          </div>
          <div>
            <div className="overviewCardTitle">Water &amp; Sanitation</div>
            <div className="overviewCardSub">Share of sitios with each water source, tiered by service level</div>
          </div>
        </div>
        <WaterTower waterRows={stats.waterRows} withoutToiletPct={stats.withoutToiletPct} toiletPct={stats.toiletPct} sitiosWithoutToilet={stats.sitiosWithoutToilet} total={stats.total} totalHouseholds={stats.totalHouseholds} householdsWithToilet={stats.totalHouseholds - stats.totalWithoutToilet} />
      </div>

      <div className="sectionCard" style={{ position: 'relative' }}>
        <CornerTooltip
          title="Source"
          trigger="click"
          text="Q51 — Road types present, length, and condition, per DPWH Road Classification, the DILG Road Condition Classification, and RA 6763 (Concrete Barangay Roads Act)."
          links={[
            { href: 'https://dpwh.gov.ph', label: 'dpwh.gov.ph' },
            { href: 'https://dilg.gov.ph', label: 'dilg.gov.ph' },
          ]}
          whyText="A 100%-composition ribbon is used because the four surface types add up to one fixed total (surveyed km), so the story is the mix and its share of the whole rather than any single surface type's absolute length."
          whyLinkHref="https://affine.pro/blog/when-to-use-a-stacked-bar-chart"
          whyLinkLabel="AFFiNE — When to use a stacked bar chart"
        />
          <div className="overviewCardHead">
            <div className="overviewCardIcon" style={{ background: '#e8eaf0', color: '#2a2d34' }}>
              <TabIcon name="pin" />
            </div>
            <div>
              <div className="overviewCardTitle">Road Network Composition</div>
              <div className="overviewCardSub">Surveyed road length by surface type, weighted by share of total km</div>
          </div>
        </div>
        <RoadRibbon roadRows={stats.roadRows} roadKmTotal={stats.roadRows.reduce((s, r) => s + r.km, 0)} />
      </div>

      <div className="infraFacilitySplit">
        <div className="infraFacilityCol">
          <div className="infraTwoCol infraNarrowRow">
        <div className="overviewCard infraCompactCard" style={{ position: 'relative' }}>
         <CornerTooltip
            title="Source"
            trigger="click"
            text="Q52-53 — Households with electricity and electricity source, per the DOE Household Electrification Program."
            linkHref="https://doe.gov.ph"
            linkLabel="doe.gov.ph"
            whyText="A progress track (rather than a donut) is used because electrification is a single value against a known 100% ceiling, benchmarked against a national average — a linear fill communicates 'how far, versus what target' more directly than a part-to-whole shape."
            whyLinkHref="https://www.cdc.gov/wcms/4.0/cdc-wp/data-presentation/waffle-and-gauge.html"
            whyLinkLabel="CDC — Waffle and Gauge Best Practices"
          />
          <div className="overviewCardHead">
            <div className="overviewCardIcon" style={{ background: '#fef7e0', color: '#eab308' }}>
              <TabIcon name="pulse" />
            </div>
            <div>
              <div className="overviewCardTitle">Electricity Source</div>
              <div className="overviewCardSub">Share of electrified households by source</div>
            </div>
          </div>
          <ElectricitySourceBar
            elecSourcePct={stats.elecSourcePct}
            elecSourceTotals={{
              grid: Math.round((stats.elecSourcePct.grid / 100) * stats.electrifiedHouseholds),
              solar: Math.round((stats.elecSourcePct.solar / 100) * stats.electrifiedHouseholds),
              battery: Math.round((stats.elecSourcePct.battery / 100) * stats.electrifiedHouseholds),
              generator: Math.round((stats.elecSourcePct.generator / 100) * stats.electrifiedHouseholds),
            }}
            electrifiedHouseholds={stats.electrifiedHouseholds}
            totalHouseholds={stats.totalHouseholds}
            electricityAccessPct={stats.electricityAccessPct}
          />
        </div>

        <div className="overviewCard infraCompactCard" style={{ position: 'relative' }}>
         <CornerTooltip
            title="Source"
            trigger="click"
            text="Q54-55 — Mobile signal strength and household internet access, per NTC / DICT."
            links={[
              { href: 'https://ntc.gov.ph', label: 'ntc.gov.ph' },
              { href: 'https://dict.gov.ph', label: 'dict.gov.ph' },
            ]}
            whyText="Signal is shown as present/absent pills rather than a magnitude chart because the question per tier is binary (does this signal exist here at all), while the sitio-count distribution beneath it handles the actual ranking of how common each tier is."
            whyLinkHref="https://udair.missouri.edu/visualization-chart-best-practices/"
            whyLinkLabel="UDAIR — Visualization Best Practices"
          />
          <div className="overviewCardHead">
            <div className="overviewCardIcon" style={{ background: '#f2e9fb', color: '#7c3aed' }}>
              <TabIcon name="trend" />
            </div>
            <div>
              <div className="overviewCardTitle">Signal &amp; Internet</div>
              <div className="overviewCardSub">Mobile network strength and internet adoption</div>
            </div>
          </div>
          <SignalLadder mobileSignalPct={stats.mobileSignalPct} mobileSignalCounts={stats.mobileSignalCounts} internetPct={stats.internetPct} />
        </div>
      </div>
          <div className="sectionCard" style={{ position: 'relative' }}>
           <CornerTooltip
              title="Source"
              trigger="click"
              text="Q47-50 — Health, education, and commerce facility presence, distance, and condition, per the DOH GIDA Health Access Framework, DepEd BEIS / DepEd Order No. 54 s. 2010, and the PSA CBMS Barangay Profile Questionnaire."
              links={[
                { href: 'https://doh.gov.ph', label: 'doh.gov.ph' },
                { href: 'https://beis.deped.gov.ph', label: 'beis.deped.gov.ph' },
                { href: 'https://cbms.psa.gov.ph', label: 'cbms.psa.gov.ph' },
              ]}
              whyText="A repeated small-multiple grid (fixed 1-5 rating scale per facility row) is used instead of 8 separate charts because it lets the eye scan down a single consistent axis to compare condition across very different facility types at once."
              whyLinkHref="https://udair.missouri.edu/visualization-chart-best-practices/"
              whyLinkLabel="UDAIR — Visualization Best Practices"
            />
            <div className="overviewCardHead">
              <div className="overviewCardIcon" style={{ background: '#e4f8ef', color: '#17a673' }}>
                <TabIcon name="doc" />
              </div>
              <div>
                <div className="overviewCardTitle">Facility Reach</div>
                <div className="overviewCardSub">
                  Coverage, average condition (1&ndash;5), and distance when absent &middot; avg {stats.avgStudentsPerClassroom.toFixed(0)} students / classroom
                </div>
              </div>
            </div>
            <FacilityReach
              facilityRows={stats.facilityRows}
              total={stats.total}
              facilityRatingTotals={stats.facilityRatingTotals}
              facilityExistsTotal={stats.facilityExistsTotal}
            />
          </div>
        </div>
        <ClassroomDensityCard classroomBuckets={stats.classroomBuckets} total={stats.total} />
      </div>
    </div>
  );
}

const INFRA_CSS = `

  .infraTwoCol { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: stretch; }
  .infraNarrowRow { max-width: 100%; }
  @media (max-width: 900px) { .infraNarrowRow { max-width: 100%; } }
  .infraCompactCard { padding: 16px !important; }
  .infraCompactCard .overviewCardHead { margin-bottom: 12px; }
  .infraCompactCard .overviewCardTitle { font-size: 14px; }
  .infraCompactCard .overviewCardSub { font-size: 11.5px; }
  .infraCompactCard .elecAccessWrap { display: flex; flex-direction: column; height: 100%; }
  .infraCompactCard .elecSourceBox {
    padding: 18px; margin-top: 12px; flex: 1;
    display: flex; flex-direction: column; justify-content: space-evenly;
  }
  .infraCompactCard .elecSourceRow { padding: 8px 0; }
  .infraCompactCard .signalDistBox { padding: 12px; }
  .infraCompactCard .signalDistRow { padding: 5px 0; font-size: 12px; }
  .infraCompactCard .infraInternetRow { margin-top: 12px; padding-top: 10px; }
  .infraHalfCard { max-width: 50%; }
  @media (max-width: 900px) { .infraHalfCard { max-width: 100%; } }
  .infraTwoCol .overviewCard { display: flex; flex-direction: column; }
  .infraTwoCol .overviewCard .infraWaffleWrap { flex: 1; align-content: center; }
  .infraTwoCol .overviewCard .infraLedger { flex: 1; justify-content: space-between; }

  /* Housing waffle */
  .infraWaffleWrap { display: flex; gap: 24px; align-items: center; flex-wrap: wrap; }
  .infraWaffle {
    display: grid; grid-template-columns: repeat(10, 1fr); gap: 3px;
    width: 100%; max-width: 210px; flex-shrink: 0;
  }
  .infraWaffleCell {
    aspect-ratio: 1; border-radius: 3px; opacity: 0; transform: scale(0.4);
    transition: opacity 0.4s ease, transform 0.4s ease;
  }
  .infraWaffle.in .infraWaffleCell { opacity: 1; transform: scale(1); }
  .infraLegendCol { display: flex; flex-direction: column; gap: 12px; flex: 1; min-width: 180px; }
  .infraLegendItem { display: flex; align-items: center; gap: 9px; font-size: 15px; color: var(--text-secondary); cursor: help; }
  .infraLegendItem.small { font-size: 11.5px; }
  .infraLegendItem .dot { width: 11px; height: 11px; border-radius: 999px; flex-shrink: 0; }
  .infraLegendItem b { color: var(--text-primary); margin-left: auto; font-size: 15.5px; }
  .toiletLegendCol { gap: 8px; }
  .toiletLegendRow {
    background: #f8f8fb; border-radius: 10px; padding: 10px 12px;
  }

  /* Ownership ledger */
  .infraLedger { display: flex; flex-direction: column; gap: 11px; }
  .infraLedgerRow {
    display: grid; grid-template-columns: 150px 1fr 44px; align-items: center; gap: 10px;
    opacity: 0; transform: translateX(-6px); transition: opacity 0.4s ease, transform 0.4s ease;
  }
  .infraLedgerRow.in { opacity: 1; transform: translateX(0); }
  .infraLedgerLabel { font-size: 12px; color: var(--text-secondary); }
  .infraLedgerTrack { background: #f0f1f4; border-radius: 999px; height: 12px; overflow: hidden; }
  .infraLedgerFill { height: 100%; border-radius: 999px; transition: width 1s cubic-bezier(.16,1,.3,1); }
  .infraLedgerValue { font-size: 12px; font-weight: 700; text-align: right; }

  /* Water & Sanitation — two sub-cards side by side */
  .infraWaterSplit { display: grid; grid-template-columns: 1.6fr 1fr; gap: 16px; align-items: stretch; }
  .infraFacilitySplit { display: grid; grid-template-columns: 1.6fr 1fr; gap: 16px; align-items: start; }
  .infraFacilityCol { display: flex; flex-direction: column; gap: 16px; }
  @media (max-width: 900px) { .infraFacilitySplit { grid-template-columns: 1fr; } }

  .classroomDensityCard { position: relative; }
  .classroomComplianceBox {
    background: #fffbeb; border: 1px solid #fde68a; border-radius: var(--radius-sm);
    padding: 18px; margin: 16px 0;
  }
  .classroomComplianceTitle {
    font-size: 11px; font-weight: 800; letter-spacing: 0.05em; color: #b45309; margin-bottom: 14px;
  }
  .classroomComplianceStats { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .classroomComplianceLabel { font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; }
  .classroomComplianceValue { font-size: 30px; font-weight: 800; line-height: 1; }
  .classroomComplianceValue.compliant { color: #17a673; }
  .classroomComplianceValue.intervention { color: #e0392f; }
  .classroomComplianceSub { font-size: 11px; color: var(--text-muted); margin-top: 4px; }
  .classroomComplianceNote {
    font-size: 12px; color: #b45309; margin-top: 14px; padding-top: 14px;
    border-top: 1px solid #fde68a; line-height: 1.5;
  }
  .classroomBreakdownTitle {
    font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
    color: var(--text-muted); margin: 4px 0 10px;
  }
  .classroomBreakdownList { display: flex; flex-direction: column; gap: 10px; }
  .classroomBreakdownRow { border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px 14px; }
  .classroomBreakdownHead { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .classroomBreakdownLabel { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--text-primary); }
  .classroomBreakdownLabel .dot { width: 10px; height: 10px; border-radius: 999px; flex-shrink: 0; }
  .classroomBreakdownCount { font-size: 13.5px; font-weight: 800; color: var(--text-primary); }
  .classroomBreakdownDesc { font-size: 11.5px; color: var(--text-muted); margin-top: 4px; }
  .classroomInfoBox {
    background: #eff6ff; border: 1px solid #bfdbfe; border-radius: var(--radius-sm);
    padding: 14px 16px; margin-top: 16px;
  }
  .classroomInfoTitle { font-size: 11px; font-weight: 800; color: #1d4ed8; margin-bottom: 6px; }
  .classroomInfoText { font-size: 12px; color: #1e40af; line-height: 1.5; margin-bottom: 8px; }
  .classroomInfoSource { font-size: 11px; color: #1e40af; padding-top: 8px; border-top: 1px solid #bfdbfe; }
  .classroomInfoSource a { color: #1d4ed8; font-weight: 600; }
  .infraSubCard { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 18px; display: flex; flex-direction: column; }
  .infraSubCard .infraDonutWrap { flex: 1; }
  .infraSubCardTitle {
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;
    font-size: 12.5px; font-weight: 700; color: var(--text-primary); margin-bottom: 14px;
  }
  .infraSubHeadNote { font-size: 11.5px; font-weight: 600; color: var(--red); }

  .waterTable { display: flex; flex-direction: column; }
  .waterTableHead {
    display: grid; grid-template-columns: 1.6fr 0.7fr 0.9fr 0.9fr; align-items: center; gap: 8px;
    padding: 0 0 10px; font-size: 10px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
    color: var(--text-muted); border-bottom: 1px solid var(--border);
  }
  .waterTableHead .waterTableCell { text-align: center; }
  .waterTableRow {
    display: grid; grid-template-columns: 1.6fr 0.7fr 0.9fr 0.9fr; align-items: center; gap: 8px;
    padding: 12px 0; border-bottom: 1px solid var(--border); cursor: help;
    opacity: 0; transform: translateX(-6px); transition: opacity 0.4s ease, transform 0.4s ease;
  }
  .waterTableRow.in { opacity: 1; transform: translateX(0); }
  .waterTableRow:last-child { border-bottom: none; }
  .waterTableLabel { font-size: 13px; font-weight: 700; color: var(--text-primary); }
  .waterTableCell { text-align: center; font-size: 13.5px; font-weight: 700; color: var(--text-primary); }
  .waterSitioBadge {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 26px; height: 26px; padding: 0 6px; border-radius: 999px;
    background: #eff5f3; color: #17a673; font-size: 12.5px; font-weight: 800;
  }
  .waterFunctional { color: #17a673; font-weight: 500; }
  .waterDefective { color: #e0392f; font-weight: 500; }
  .waterZero { color: var(--text-muted); font-weight: 600; }

  /* Toilet donut */
  .infraDonutWrap { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; height: 100%; }
  .infraDonutSvgWrap { position: relative; width: 150px; height: 150px; flex-shrink: 0; }
  .infraDonutCenter { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: stretch; justify-content: center; text-align: center; padding: 0 10px; }
  .infraDonutCenterValue { font-size: 15px; font-weight: 800; color: var(--red); line-height: 1.15; }
  .infraDonutCenterLabel { font-size: 10px; color: var(--text-muted); }

  @media (max-width: 900px) {
    .infraWaterSplit { grid-template-columns: 1fr; }
  }

  /* Road ribbon */
  .infraRoadRibbon {
    display: flex; height: 36px; border-radius: 8px; overflow: visible;
    border-top: 3px dashed #f4f5f7; border-bottom: 3px dashed #f4f5f7; background: #d7d9de;
    opacity: 0; transition: opacity 0.5s ease;
  }
  .infraRoadRibbon.in { opacity: 1; }
  .infraRoadSeg { height: 100%; position: relative; transition: width 1s cubic-bezier(.16,1,.3,1); }
  .infraRoadSeg.roadMarking::after {
    content: ''; position: absolute; left: 0; right: 0; top: 50%;
    height: 2px; transform: translateY(-1px);
    background: repeating-linear-gradient(to right, #fff 0, #fff 10px, transparent 10px, transparent 20px);
    opacity: 0.85;
  }
  .infraRoadLegend { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 14px; align-items: center; }
  .infraRoadTotal { margin-left: auto; font-size: 12.5px; color: var(--text-secondary); }

  /* Facility reach */
  .infraFacilityGrid { display: flex; flex-direction: column; gap: 18px; }
  .infraFacilityGroupTitle {
    font-size: 11.5px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: 6px;
  }
  .infraFacilityRow {
    display: grid; grid-template-columns: 160px 1fr 100px; align-items: center; gap: 14px;
    padding: 9px 0; border-bottom: 1px solid var(--border);
  }
  .infraFacilityLegendRow {
    display: grid; grid-template-columns: 160px 1fr 100px; align-items: center; gap: 14px;
    padding-bottom: 8px; margin-bottom: 6px; border-bottom: 1px solid var(--border);
    font-size: 10px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-muted);
  }
  .infraFacilityLegendRow .infraFacilityDistance { text-align: right; }
  .infraConditionLegend { display: flex; width: 100%; }
  .infraConditionLegend > * { flex: 1; display: flex !important; justify-content: center; }
  .infraConditionLegendBadge {
    display: flex; align-items: center; justify-content: center;
    width: 22px; height: 22px; border-radius: 6px; color: #fff;
    font-size: 11px; font-weight: 800; cursor: help; transition: transform 0.15s ease;
  }
  .infraConditionLegendBadge:hover { transform: translateY(-2px); }

  .infraConditionCounts { display: flex; width: 100%; }
  .infraConditionCounts > * { flex: 1; display: flex !important; justify-content: center; }
  .infraConditionCount {
    display: flex; align-items: center; justify-content: center;
    font-size: 12.5px; font-weight: 700; color: var(--text-primary);
    cursor: help;
  }
  .infraConditionCount.zero { color: var(--text-muted); opacity: 0.5; }
  .infraFacilityGroup .infraFacilityRow:last-child { border-bottom: none; }
  .infraFacilityTotalsRow {
    display: grid; grid-template-columns: 160px 1fr 100px; align-items: center; gap: 14px;
    padding: 14px 0 4px; margin-top: 4px; border-top: 2px solid var(--border-strong);
  }
  .infraFacilityTotalsRow .infraFacilityName { font-weight: 800; color: var(--text-primary); }
  .infraConditionTotalCount { font-weight: 800; color: var(--text-primary); }
  .infraFacilityName { font-size: 12.5px; font-weight: 600; color: var(--text-primary); }
  .infraFacilityBarTrack { background: #f0f1f4; border-radius: 999px; height: 10px; overflow: hidden; }
  .infraFacilityBarFill { height: 100%; border-radius: 999px; background: linear-gradient(90deg,#17a673,#4ade80); transition: width 1s cubic-bezier(.16,1,.3,1); }
  .infraSignalTicks { display: flex; gap: 2px; align-items: flex-end; height: 18px; cursor: help; }
  .infraSignalTick { width: 5px; border-radius: 2px; transition: background 0.2s ease; }
  .infraFacilityDistance { font-size: 11.5px; color: var(--text-muted); text-align: right; }

  /* Electricity access */
  .elecAccessHead { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; }
  .elecAccessTitle { font-size: 15px; font-weight: 700; color: var(--text-primary); }
  .elecAccessPct { font-size: 20px; font-weight: 800; color: var(--text-primary); }
  .elecAccessTrack { background: #f0f1f4; border-radius: 999px; height: 10px; overflow: hidden; }
  .elecAccessFill { height: 100%; border-radius: 999px; background: #eab308; transition: width 1.1s cubic-bezier(.16,1,.3,1); }
  .elecAccessSubRow { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
  .elecAccessSub { font-size: 12.5px; color: var(--text-secondary); }
  .elecAccessBenchmark { font-size: 12px; font-weight: 600; color: var(--text-muted); }
  .elecCompareBadge {
    display: inline-flex; align-items: center; gap: 6px; margin-top: 10px;
    padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 700;
    cursor: help; width: fit-content;
  }
  .elecCompareBadge.below { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
  .elecCompareBadge.above { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  .elecCompareArrow { font-size: 13px; }

  .elecSourceBox { background: #f8f8fb; border-radius: var(--radius-sm); padding: 16px; margin-top: 16px; }
  .elecSourceBoxTitle {
    font-size: 10.5px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: 12px;
  }
  .elecSourceRow {
    display: grid; grid-template-columns: 66px 1fr 40px 32px; align-items: center; gap: 10px;
    padding: 6px 0; cursor: help;
  }
  .elecSourceLabel { font-size: 12.5px; color: var(--text-secondary); }
  .elecSourceTrack { background: #e7e8ec; border-radius: 999px; height: 6px; overflow: hidden; }
  .elecSourceFill { height: 100%; border-radius: 999px; transition: width 1s cubic-bezier(.16,1,.3,1); }
  .elecSourceCount { font-size: 12px; color: var(--text-muted); text-align: right; }
  .elecSourcePct { font-size: 12.5px; font-weight: 700; color: var(--text-primary); text-align: right; }

  /* Signal pills */
  .signalPillRow { display: flex; width: 100%; gap: 16px; }
  .signalPillRow > .barTooltipWrap { flex: 1; min-width: 0; }
  .signalPillCol { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: help; }
  .signalPill {
    width: 100%; height: 15px; border-radius: 6px; background: #eceef2;
    opacity: 0; transform: scaleX(0.6); transform-origin: center;
    transition: opacity 0.4s ease, transform 0.5s cubic-bezier(.16,1,.3,1), box-shadow 0.4s ease;
  }
  .signalPillRow.in .signalPill { opacity: 1; transform: scaleX(1); }
  .signalPill.active {
    background: #3ccb4d;
    box-shadow: 0 0 0 3px rgba(23, 166, 35, 0.07), 0 0 14px 2px rgba(24, 187, 60, 0.11);
  }
  .signalPillLabel { font-size: 15px; font-weight: 800; color: var(--text-muted); }
  .signalPillLabel.active { color: var(--text-primary); }

  .signalDistBox {
    background: #f8f8fb; border-radius: var(--radius-sm); padding: 16px; margin-top: 18px;
  }
  .signalDistTitle {
    font-size: 10.5px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: 10px;
  }
  .signalDistRow {
    display: flex; align-items: center; justify-content: space-between;
    padding: 7px 0; font-size: 13px; color: var(--text-primary);
  }
  .signalDistRight { display: flex; align-items: center; gap: 16px; }
  .signalDistCount { font-weight: 700; color: var(--text-secondary); min-width: 14px; text-align: right; }
  .signalDistPct { font-weight: 800; color: var(--text-primary); min-width: 34px; text-align: right; }
  .infraInternetRow { display: grid; grid-template-columns: 130px 1fr 44px; align-items: center; gap: 10px; margin-top: 18px; border-top: 1px dashed var(--border-strong); padding-top: 14px; }
  .infraInternetLabel { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
  .infraInternetTrack { background: #f0f1f4; border-radius: 999px; height: 12px; overflow: hidden; }
  .infraInternetFill { height: 100%; border-radius: 999px; background: linear-gradient(90deg,#2f6fed,#7c3aed); transition: width 1.1s cubic-bezier(.16,1,.3,1); }
  .infraInternetValue { font-size: 12px; font-weight: 700; text-align: right; }

  @media (max-width: 1200px) {
    .infraTwoCol { grid-template-columns: 1fr; }
    .infraFacilityRow { grid-template-columns: 130px 1fr 80px; gap: 8px; }
  }
  @media (max-width: 640px) {
    .infraWaffleWrap { flex-direction: column; }
  }
`;
