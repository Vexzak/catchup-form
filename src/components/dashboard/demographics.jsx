import { useMemo } from 'react';
import TabIcon from './icons';
import {
  pct,
  useInView,
  CountUp,
  CornerTooltip,
  BarTooltip,
  StatCard,
  GaugeChart,
} from './dashboard';

/* =========================================================================
   Demographics Panel — Section B: Population & Social Profile

   Design pass (this revision):
   - Flatter, tinted-icon-circle rows replace gradient-badge rows for
     Moro/IP, cutting visual noise.
   - Municipality bar chart gets rank badges (1, 2, 3…) instead of relying
     on bar length alone to convey order.
   - Every source tooltip anchors to the true top-right corner of its
     own card (via the `Card` wrapper's position:relative), matching the
     KPI StatCards exactly — not to an inner header strip.
   - Age Structure and Education cards each show their numbers exactly
     once (split bar + one legend that carries both the raw count and
     the percentage) instead of repeating in a separate mini-stat grid.
   - Welfare Sector bars carry a coverage-rate subtext against their own
     population base, so the bar means something beyond "biggest wins".
========================================================================= */
const WHY_BAR = {
  whyTitle: 'Why a bar / split-bar chart',
  whyText: 'A single segmented bar (rather than a pie) is used because position and length along a common baseline are the most accurately-judged visual encoding for comparing magnitudes — the classic finding in graphical perception research.',
  whyLinkHref: 'https://www.jstor.org/stable/2288400',
  whyLinkLabel: 'Cleveland & McGill (1984), JASA',
};

const WHY_DONUT = {
  whyTitle: 'Why a donut chart',
  whyText: 'A donut chart is used here because its ring segments are judged by arc length rather than angle, which perception studies found participants read nearly as accurately as bar charts for part-to-whole comparisons across a small number of categories — while the open center can still hold a clear grand total, which a bar chart cannot show as compactly.',
  whyLinkHref: 'https://doi.org/10.1111/cgf.12888',
  whyLinkLabel: 'Skau & Kosara (2016), Computer Graphics Forum',
};

const WHY_RANKED_BAR = {
  whyTitle: 'Why a ranked bar chart',
  whyText: 'Bars are sorted highest-to-lowest and numbered because, on top of position/length being the most accurately-judged encoding, ordering the bars by magnitude removes the extra step of scanning for the largest value — a practice recommended across government and institutional data-visualization style guides for ranking use cases.',
  whyLinkHref: 'https://designsystem.digital.gov/components/data-visualizations/',
  whyLinkLabel: 'U.S. Web Design System — Data Visualizations',
};

const WHY_KPI_CARD = {
  whyTitle: 'Why a single stat card',
  whyText: 'A single large number with a short label is used for headline totals that stand on their own (a raw count with no internal breakdown), following the "KPI card" pattern for dashboards: the value is given strong visual weight so it is the first thing scanned, with a supporting line for context instead of a full chart.',
  whyLinkHref: 'https://www.oreilly.com/library/view/data-visualization-with/9781098152772/ch08.html',
  whyLinkLabel: 'Data Visualization with Python & JS — "KPI Cards"',
};

const WHY_TINT_ROWS = {
  whyTitle: 'Why tinted stat rows (not a chart)',
  whyText: 'With only two categories to compare (Moro and Indigenous Peoples population), a chart would add visual overhead without adding precision — two numbers are read faster from labeled rows than from bars or arcs. This follows KPI-card guidance to keep small, discrete counts as direct, high-contrast numbers rather than forcing them into a chart form built for more categories.',
  whyLinkHref: 'https://www.oreilly.com/library/view/data-visualization-with/9781098152772/ch08.html',
  whyLinkLabel: 'Data Visualization with Python & JS — "KPI Cards"',
};

const WHY_TWO_SEGMENT_BAR = {
  whyTitle: 'Why a single 100%-stacked bar',
  whyText: 'Employed vs. unemployed is a two-part whole, so a single bar split into two proportional segments shows both the share and the total in one shape — position/length along a shared baseline stays the most accurately-judged encoding for this comparison, the same principle behind the other split bars in this panel.',
  whyLinkHref: 'https://www.jstor.org/stable/2288400',
  whyLinkLabel: 'Cleveland & McGill (1984), JASA',
};

const WHY_BULLET_BENCHMARK = {
  whyTitle: 'Why a benchmark (bullet-style) bar',
  whyText: 'Comparing a local rate to a national benchmark is exactly what the bullet graph was designed for: a compact bar-chart variant, created by Stephen Few as a more precise, space-efficient alternative to circular gauges, for showing an actual value directly against a reference value.',
  whyLinkHref: 'https://en.wikipedia.org/wiki/Bullet_graph',
  whyLinkLabel: 'Few — Bullet Graph specification',
};

const SOURCES = {
  population: {
    title: 'Source · Q10–12',
    text: 'Total population, age group breakdown, and total households. Sourced from the PSA CBMS Household Profile Questionnaire (HPQ), per RA 11315 (Community-Based Monitoring System Act).',
    linkHref: 'https://cbms.psa.gov.ph',
    linkLabel: 'cbms.psa.gov.ph',
    ...WHY_BAR,
  },
  households: {
    title: 'Source · Q10–12',
    text: 'Total households, from the same population count as Population & Age Structure. Sourced from the PSA CBMS Household Profile Questionnaire (HPQ), per RA 11315 (Community-Based Monitoring System Act).',
    linkHref: 'https://cbms.psa.gov.ph',
    linkLabel: 'cbms.psa.gov.ph',
    ...WHY_KPI_CARD,
  },
  moro: {
    title: 'Source · Q13',
    text: 'Moro population estimate. Sourced from the National Commission on Muslim Filipinos (NCMF), per RA 11054 (Bangsamoro Organic Law).',
    linkHref: 'https://ncmf.gov.ph',
    linkLabel: 'ncmf.gov.ph',
  },
  ip: {
    title: 'Source · Q14',
    text: 'Indigenous Peoples population estimate. Sourced from the National Commission on Indigenous Peoples (NCIP).',
    linkHref: 'https://ncip.gov.ph',
    linkLabel: 'ncip.gov.ph',
  },
  civilReg: {
    title: 'Source · Q15',
    text: 'Individuals without a birth certificate or a National ID. Sourced from PSA Civil Registration and Vital Statistics, per RA 11055 (PhilSys Act).',
    linkHref: 'https://psa.gov.ph',
    linkLabel: 'psa.gov.ph (Civil Registration)',
    ...WHY_DONUT,
  },
  education: {
    title: 'Source · Q16–17',
    text: 'School attendance and Out-of-School Children and Youth (OSCY). Sourced from PSA CBMS and DepEd BEIS, using the PSA-FLEMMS OSCY definition.',
    linkHref: 'https://beis.deped.gov.ph',
    linkLabel: 'beis.deped.gov.ph',
    ...WHY_BAR,
  },
  labor: {
    title: 'Source · Q18–20',
    text: 'Labor force count, age brackets, and estimated unemployed persons. Sourced from the PSA Labor Force Survey (LFS).',
    linkHref: 'https://psa.gov.ph',
    linkLabel: 'psa.gov.ph (LFS)',
    ...WHY_KPI_CARD,
  },
  laborForceAgeGroup: {
    title: 'Source · Q18–20',
    text: 'PSA Labor Force Survey (LFS) — age bracket breakdown of the labor force.',
    linkHref: 'https://psa.gov.ph',
    linkLabel: 'psa.gov.ph (LFS)',
    ...WHY_DONUT,
  },
  employmentDistribution: {
    title: 'Source · Q18–20',
    text: 'Employed vs. unemployed split of the labor force. Sourced from the PSA Labor Force Survey (LFS).',
    linkHref: 'https://psa.gov.ph',
    linkLabel: 'psa.gov.ph (LFS)',
    ...WHY_TWO_SEGMENT_BAR,
  },
  voters: {
    title: 'Source · Q21',
    text: 'Registered voters. Sourced from COMELEC Voter Registration Records.',
    linkHref: 'https://comelec.gov.ph',
    linkLabel: 'comelec.gov.ph',
  },
  moroIp: {
    title: 'Source · Q13–Q14',
    text: 'Moro population estimate sourced from the National Commission on Muslim Filipinos (NCMF), per RA 11054 (Bangsamoro Organic Law). Indigenous Peoples population estimate sourced from the National Commission on Indigenous Peoples (NCIP).',
    links: [
      { href: 'https://ncmf.gov.ph', label: 'NCMF · ncmf.gov.ph' },
      { href: 'https://ncip.gov.ph', label: 'NCIP · ncip.gov.ph' },
    ],
    ...WHY_TINT_ROWS,
  },
  welfare: {
    title: 'Source · Q22',
    text: 'Social welfare beneficiary sectors — children, senior citizens, PWD, and solo parents. Sourced from DSWD Social Welfare and Development Indicators (SWDI) and NCDA, per RA 10754 (PWD Act).',
    linkHref: 'https://ncda.gov.ph',
    linkLabel: 'ncda.gov.ph (RA 10754)',
    ...WHY_BAR,
  },
  philhealth: {
    title: 'Source · Q23–24',
    text: 'PhilHealth Direct and Indirect Contributors. Sourced from PhilHealth Membership Categories, per RA 11223 (Universal Health Care Act).',
    linkHref: 'https://www.philhealth.gov.ph/members',
    linkLabel: 'philhealth.gov.ph/members',
    ...WHY_BAR,
  },
  fourPs: {
    title: 'Source · Q25',
    text: '4Ps beneficiary count. Sourced from the DSWD Pantawid Pamilyang Pilipino Program.',
    linkHref: 'https://pantawid.dswd.gov.ph',
    linkLabel: 'pantawid.dswd.gov.ph',
    ...WHY_KPI_CARD,
  },
  dependency: {
    title: 'How this is calculated',
    text: '(Children 0–14 + Seniors 65+) ÷ Working-age population (15–64) × 100. A derived DSS planning metric — not a raw form field, so it has no government source citation.',
  },
};



// ADD after the SOURCES object closes
SOURCES.laborBenchmark = {
  title: 'National Benchmarks',
  text: 'Unemployment benchmark: 4.2% national annual average, 2025 (PSA Labor Force Survey Annual Report). Dependency ratio benchmark: 50 dependents per 100 working-age persons, 2024 (PSA Census of Population, POPCEN 2024).',
  linkHref: 'https://psa.gov.ph/statistics/labor-force-survey',
  linkLabel: 'psa.gov.ph (LFS / POPCEN 2024)',
  ...WHY_BULLET_BENCHMARK,
};

// Population by Municipality reuses the population source (Q10-12) but
// needs its own "why" — it's a ranked bar list, not the split bar used
// on the Population & Age Structure card.
SOURCES.populationByMuni = {
  title: 'Source · Q10–12',
  text: 'Total population per municipality, aggregated from the PSA CBMS Household Profile Questionnaire (HPQ), per RA 11315 (Community-Based Monitoring System Act).',
  linkHref: 'https://cbms.psa.gov.ph',
  linkLabel: 'cbms.psa.gov.ph',
  ...WHY_RANKED_BAR,
};

const NATIONAL_BENCHMARKS = {
  unemploymentRate: 4.2,   // PSA LFS, 2025 annual average
  dependencyRatio: 50.0,   // PSA POPCEN 2024
};

function SourceTag({ id }) {
  const s = SOURCES[id];
  if (!s) return null;
  return (
    <CornerTooltip
      title={s.title}
      text={s.text}
      linkHref={s.linkHref}
      linkLabel={s.linkLabel}
      links={s.links}
      whyTitle={s.whyTitle}
      whyText={s.whyText}
      whyLinkHref={s.whyLinkHref}
      whyLinkLabel={s.whyLinkLabel}
      trigger="click"
    />
  );
}

/* Card shell — the single `position: relative` owner for its corner
   tooltip, so the tooltip always pins to the real card edge. */
function Card({ className = 'overviewCard', sourceId, style, children }) {
  return (
    <div className={className} style={{ position: 'relative', ...style }}>
      {sourceId ? <SourceTag id={sourceId} /> : null}
      {children}
    </div>
  );
}

function SectionHead({ icon, tint, title, sub }) {
  return (
    <div className="demoHead">
      <div className="demoHeadIcon" style={{ background: tint.bg, color: tint.fg }}>
        <TabIcon name={icon} />
      </div>
      <div>
        <div className="overviewCardTitle">{title}</div>
        <div className="overviewCardSub">{sub}</div>
      </div>
    </div>
  );
}

/* Generic n-segment split bar (age structure, education, health coverage).
   Each segment is its own BarTooltip so hovering shows only its value. */
function SplitBar({ segments, total, height = 14 }) {
  const visible = useInView(120);
  const denom = total || 1;
  return (
    <div className="demoSplitTrack" style={{ height }}>
      {segments.map((seg, i) => {
        const segPct = pct(seg.value, denom);
        return (
          <BarTooltip
            key={seg.label}
            text={`${seg.label} · ${seg.value.toLocaleString()} · ${segPct.toFixed(1)}%`}
            style={{
              width: visible ? `${segPct}%` : 0,
              transition: `width 1.05s cubic-bezier(.16,1,.3,1) ${i * 90}ms`,
            }}
          >
            <div className="demoSplitFill" style={{ background: seg.color }} />
          </BarTooltip>
        );
      })}
    </div>
  );
}

/* Legend that IS the numeric readout for the split bar above it — the
   only place these figures are printed, so nothing repeats downstream. */
function SplitLegend({ segments, total }) {
  const denom = total || 1;
  return (
    <div className="demoSplitLegend">
      {segments.map((seg) => (
        <div className="demoSplitLegendItem" key={seg.label}>
          <span className="demoSplitLegendHead">
            <span className="dot" style={{ background: seg.color }} />
            {seg.label}
          </span>
          <span className="demoSplitLegendValue">
            <CountUp value={seg.value} />
            <span className="demoSplitLegendPct">{pct(seg.value, denom).toFixed(1)}%</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/* Tinted icon-circle row — replaces the old gradient classRow pattern
   for Moro/IP: flatter, and the tint itself carries the category color
   so the row doesn't need a separate colored background block. */
function TintRow({ tint, title, sub, count, pctValue, sourceId, index = 0 }) {
  const visible = useInView(index * 70 + 120);
  return (
    <div
      className={`tintRow${visible ? ' in' : ''}`}
      style={{ transitionDelay: `${index * 60}ms`, position: 'relative', background: tint.bg }}
    >
      {sourceId ? <SourceTag id={sourceId} /> : null}
      <div className="tintRowText">
        <div className="tintRowTitle">{title}</div>
        <div className="tintRowSub">{sub}</div>
      </div>
      <div className="tintRowRight">
        <div className="tintRowCount" style={{ color: tint.fg }}><CountUp value={count} /></div>
        <div className="tintRowPct">{pctValue.toFixed(1)}%</div>
      </div>
    </div>
  );
}

/* Ranked bar row for the municipality chart — a numbered badge conveys
   order directly instead of relying on eyeballing bar length. */
function RankBarRow({ rank, name, count, widthPct, index = 0, hoverText }) {
  const visible = useInView(index * 60 + 120);
  return (
    <div className="rankBarRow">
      <div className="rankBadge">{rank}</div>
      <div className="rankBarLabel">{name}</div>
      <BarTooltip text={hoverText}>
        <div className="rankBarTrack">
          <div
            className="rankBarFill"
            style={{ width: visible ? `${widthPct}%` : 0, transitionDelay: `${index * 45}ms` }}
          />
        </div>
      </BarTooltip>
      <div className="rankBarValue"><CountUp value={count} duration={800} /></div>
    </div>
  );
}

/* Colored KPI tile for the Labor & Employment section header row —
   mirrors the old dashboard's tinted mini-cards (Labor Force / Employed
   / Unemployed / Senior Workers). */
function LaborKpiTile({ icon, tint, label, value, decimals = 0, sub, index = 0 }) {
  const visible = useInView(index * 70 + 100);
  return (
    <div className={`laborKpiTile${visible ? ' in' : ''}`} style={{ background: tint.bg, transitionDelay: `${index * 60}ms` }}>
      <div className="laborKpiTop" style={{ color: tint.fg }}>
        <TabIcon name={icon} />
        <span>{label}</span>
      </div>
      <div className="laborKpiValue">
        {decimals ? value.toFixed(decimals) : <CountUp value={value} />}
      </div>
      <div className="laborKpiSub">{sub}</div>
    </div>
  );
}

/* Single pill-shaped two-color bar with a centered percent label on the
   dominant segment — the "Employment Distribution" bar from the old UI. */
function EmploymentDistributionBar({ employed, unemployed, total }) {
  const visible = useInView(150);
  const employedPct = pct(employed, total);
  const unemployedPct = pct(unemployed, total);
  return (
    <div className="empDistWrap">
      <div className="empDistTrack">
        <BarTooltip
          text={`Employed · ${employed.toLocaleString()} · ${employedPct.toFixed(1)}%`}
          style={{
            width: visible ? `${employedPct}%` : 0,
            transition: 'width 1.05s cubic-bezier(.16,1,.3,1)',
          }}
        >
          <div className="empDistFill employed">
            {employedPct >= 12 ? `${employedPct.toFixed(0)}%` : null}
          </div>
        </BarTooltip>
        <BarTooltip
          text={`Unemployed · ${unemployed.toLocaleString()} · ${unemployedPct.toFixed(1)}%`}
          style={{
            width: visible ? `${unemployedPct}%` : 0,
            transition: 'width 1.05s cubic-bezier(.16,1,.3,1) 90ms',
          }}
        >
          <div className="empDistFill unemployed" />
        </BarTooltip>
      </div>
      <div className="empDistLegend">
        <span><span className="empDot employed" />Employed ({employed.toLocaleString()})</span>
        <span><span className="empDot unemployed" />Unemployed ({unemployed.toLocaleString()})</span>
      </div>
    </div>
  );
}

/* Cream "Economic Dependency" box — gauge + a plain stat tile, matching
   the old UI's two-card layout. */
function EconomicDependencyBox({ dependencyRatio, dependentPopulation }) {
  return (
    <div className="econDepBox">
      <SectionHead icon="pulse" tint={TINT.amber} title="Economic Dependency" sub="Population economic support structure" />
      <div className="econDepGrid">
        <div className="econDepGaugeCard">
          <div className="econDepGaugeScale">
            <GaugeChart
              index={0}
              gradientId="gauge-demo-dependency"
              colorFrom="#f59e0b"
              colorTo="#fbbf24"
              value={dependencyRatio}
              max={100}
              valueDisplay={dependencyRatio.toFixed(1)}
              label="Dependency Ratio"
              hoverText={`${dependencyRatio.toFixed(1)} dependents per 100 working-age residents`}
            />
          </div>
          <div className="econDepGaugeCaption">per 100 workers</div>
        </div>
        <div className="econDepStatCard">
          <div className="econDepStatIcon"><TabIcon name="users" /></div>
          <div className="econDepStatValue"><CountUp value={dependentPopulation} /></div>
          <div className="econDepStatLabel">Dependent Population</div>
          <div className="econDepStatSub">non-working residents</div>
        </div>
      </div>
    </div>
  );
}

/* Local-vs-national benchmark row — two stacked thin bars + a
   higher/lower badge, cited to PSA figures via NATIONAL_BENCHMARKS. */
function BenchmarkRow({ label, localValue, localDisplay, benchmarkValue, benchmarkDisplay, benchmarkLabel, higherIsWorse = true, index = 0 }) {
  const visible = useInView(index * 80 + 100);
  const maxScale = Math.max(localValue, benchmarkValue, 1) * 1.15;
  const isHigher = localValue > benchmarkValue;
  const isWarn = isHigher === higherIsWorse;
  return (
    <div className="benchRow">
      <div className="benchRowHead">
        <span className="benchRowLabel">{label}</span>
        <span className={`benchRowBadge ${isWarn ? 'warn' : 'ok'}`}>
          {isHigher ? '↑' : '↓'} {isHigher ? 'Higher' : 'Lower'}
        </span>
      </div>
      <div className="benchRowValues">
        <span className="benchRowLocal">{localDisplay}</span>
        <span className="benchRowVs">vs {benchmarkDisplay}</span>
      </div>
      <div className="benchBarTrack">
        <div className="benchBarFill local" style={{ width: visible ? `${pct(localValue, maxScale)}%` : 0 }} />
      </div>
      <div className="benchBarTrack sub">
        <div className="benchBarFill benchmark" style={{ width: visible ? `${pct(benchmarkValue, maxScale)}%` : 0 }} />
      </div>
      <div className="benchRowFoot">Local · {benchmarkLabel}</div>
    </div>
  );
}

/* Small self-contained donut chart — replaces GaugeChart's half-arc
   shape for compact 3-across rows. Pure SVG, so size/stroke are fully
   controllable instead of fighting an opaque component's internals. */
function DonutChart({ percent, colorFrom, colorTo, valueDisplay, label, hoverText, gradientId, size = 110, strokeWidth = 12, index = 0 }) {
  const visible = useInView(index * 80 + 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference - (visible ? clamped / 100 : 0) * circumference;
  return (
    <div className="donutChartWrap">
      <BarTooltip text={hoverText}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colorFrom} />
              <stop offset="100%" stopColor={colorTo} />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eef0f4" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.16,1,.3,1)' }}
          />
          <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="donutChartValue">
            {clamped.toFixed(1)}%
          </text>
          <text x="50%" y="63%" textAnchor="middle" dominantBaseline="middle" className="donutChartValueSmall">
            {valueDisplay}
          </text>
        </svg>
      </BarTooltip>
      <div className="donutChartLabel">{label}</div>
    </div>
  );
}

/* Multi-segment donut with a centered total + legend list — same visual
   language as an "Income Diversification" style breakdown. Used for the
   Labor Force Age Group Breakdown, replacing the old dependency gauge. */
function AgeGroupDonutCard({ segments, total }) {
  const visible = useInView(150);
  const size = 150;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const denom = total || 1;

  const MIN_VISIBLE_PCT = 0.03; // floor so tiny slices (e.g. senior workers) stay visible/hoverable

  // Real percentages first, then apply a floor and rescale so everything
  // still sums to exactly 100% of the ring (legend values stay untouched).
  const rawPcts = segments.map((seg) => seg.value / denom);
  const floored = rawPcts.map((p) => (p > 0 ? Math.max(p, MIN_VISIBLE_PCT) : 0));
  const flooredSum = floored.reduce((s, p) => s + p, 0) || 1;
  const displayPcts = floored.map((p) => p / flooredSum);

  let cumulative = 0;
  const arcs = segments.map((seg, i) => {
    const segPct = displayPcts[i];
    const dash = visible ? segPct * circumference : 0;
    const gap = circumference - dash;
    const offset = -cumulative * circumference;
    cumulative += segPct;
    return { ...seg, dash, gap, offset };
  });

  return (
    <div className="ageDonutCard" style={{ position: 'relative' }}>
      <SourceTag id="laborForceAgeGroup" />
      <SectionHead icon="users" tint={TINT.purple} title="Labor Force Age Group Breakdown" sub="Working population by age bracket" />
      <div className="ageDonutBody">
        <div className="ageDonutChartWrap">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eef0f4" strokeWidth={strokeWidth} />
            {arcs.map((a) => (
              <circle
                key={a.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={a.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${a.dash} ${a.gap}`}
                strokeDashoffset={a.offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-dasharray 1.05s cubic-bezier(.16,1,.3,1)' }}
              >
                <title>{`${a.label} · ${a.value.toLocaleString()} · ${pct(a.value, denom).toFixed(1)}%`}</title>
              </circle>
            ))}
          </svg>
          <div className="ageDonutCenter">
            <div className="ageDonutCenterLabel">Total</div>
            <div className="ageDonutCenterValue"><CountUp value={total} /></div>
          </div>
        </div>
        <div className="ageDonutLegend">
          {segments.map((seg) => (
            <div className="ageDonutLegendItem" key={seg.label}>
              <span className="ageDonutLegendHead">
                <span className="dot" style={{ background: seg.color }} />
                {seg.label}
              </span>
              <span className="ageDonutLegendValue"><CountUp value={seg.value} /></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Magnitude bar row for labor-force brackets and welfare sectors. An
   optional `note` line adds context (e.g. a coverage rate) so a bar
   never has to be re-explained in a separate stat elsewhere. */
function MagnitudeBarRow({ label, count, widthPct, color, index = 0, hoverText, note }) {
  const visible = useInView(index * 55 + 100);
  return (
    <div className="magBarRow">
      <div className="magBarLabel">
        <span>{label}</span>
        {note ? <span className="magBarNote">{note}</span> : null}
      </div>
      <BarTooltip text={hoverText}>
        <div className="magBarTrack">
          <div
            className="magBarFill"
            style={{ width: visible ? `${widthPct}%` : 0, background: color, transitionDelay: `${index * 45}ms` }}
          />
        </div>
      </BarTooltip>
      <div className="magBarValue"><CountUp value={count} duration={800} /></div>
    </div>
  );
}

function useDemographicsStats(sitios) {
  return useMemo(() => {
    const totalSitios = sitios.length;
    const sum = (key) => sitios.reduce((s, x) => s + (x[key] || 0), 0);

    const totalMale = sum('populationMale');
    const totalFemale = sum('populationFemale');
    const totalPopulation = totalMale + totalFemale;
    const totalHouseholds = sum('households');
    const totalMoro = sum('moroPopulation');
    const totalIP = sum('ipPopulation');

    const totalChildren = sum('populationChildren');
    const totalWorkingAge = sum('populationWorkingAge');
    const totalSenior = sum('populationSenior');
    const dependencyRatio = totalWorkingAge ? ((totalChildren + totalSenior) / totalWorkingAge) * 100 : 0;

    const totalWithoutBirthCert = sum('withoutBirthCert');
    const totalWithoutPhilsysId = sum('withoutPhilsysId');
    const withoutBirthCertPct = pct(totalWithoutBirthCert, totalPopulation);
    const withoutPhilsysPct = pct(totalWithoutPhilsysId, totalPopulation);

    const totalSchoolAge = sum('schoolAgePopulation');
    const totalAttending = sum('attendingSchool');
    const totalOSCY = sum('oscyCount');

    const totalVotingAge = sum('votingAgePopulation');
    const totalLaborForce = sum('laborForceCount');
    const totalUnemployed = sum('unemployedCount');
    const lfpr = pct(totalLaborForce, totalVotingAge);
    const unemploymentRate = pct(totalUnemployed, totalLaborForce);
    const lf15to24 = sum('laborForce15to24');
    const lf25to54 = sum('laborForce25to54');
    const lf55to64 = sum('laborForce55to64');
    const lf65plus = sum('laborForce65plus');

    const totalRegisteredVoters = sum('registeredVoters');
    const voterRegistrationRate = pct(totalRegisteredVoters, totalVotingAge);

    const welfareChildren = sum('welfareChildren');
    const welfareSeniors = sum('welfareSeniors');
    const welfarePWD = sum('welfarePWD');
    const welfareSoloParents = sum('welfareSoloParents');
    const welfareChildrenRate = pct(welfareChildren, totalChildren);
    const welfareSeniorsRate = pct(welfareSeniors, totalSenior);
    const welfarePWDRate = pct(welfarePWD, totalPopulation);
    const welfareSoloParentsRate = pct(welfareSoloParents, totalHouseholds);

    const philhealthDirect = sum('philhealthDirect');
    const philhealthIndirect = sum('philhealthIndirect');
    const philhealthCovered = philhealthDirect + philhealthIndirect;
    const philhealthCoverageRate = pct(philhealthCovered, totalHouseholds);

    const fourPsBeneficiaries = sum('fourPsBeneficiaries');
    const fourPsCoverageRate = pct(fourPsBeneficiaries, totalHouseholds);

    const muniPop = {};
    sitios.forEach((s) => {
      muniPop[s.municipality] = (muniPop[s.municipality] || 0) + (s.populationMale || 0) + (s.populationFemale || 0);
    });
    const populationByMunicipality = Object.entries(muniPop)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      totalSitios,
      totalPopulation,
      totalMale,
      totalFemale,
      totalHouseholds,
      totalMoro,
      totalIP,
      moroPct: pct(totalMoro, totalPopulation),
      ipPct: pct(totalIP, totalPopulation),
      totalChildren,
      totalWorkingAge,
      totalSenior,
      dependencyRatio,
      totalWithoutBirthCert,
      totalWithoutPhilsysId,
      withoutBirthCertPct,
      withoutPhilsysPct,
      totalSchoolAge,
      totalAttending,
      totalOSCY,
      totalVotingAge,
      totalLaborForce,
      totalUnemployed,
      lfpr,
      unemploymentRate,
      lf15to24,
      lf25to54,
      lf55to64,
      lf65plus,
      totalRegisteredVoters,
      voterRegistrationRate,
      welfareChildren,
      welfareSeniors,
      welfarePWD,
      welfareSoloParents,
      welfareChildrenRate,
      welfareSeniorsRate,
      welfarePWDRate,
      welfareSoloParentsRate,
      philhealthDirect,
      philhealthIndirect,
      philhealthCovered,
      philhealthCoverageRate,
      fourPsBeneficiaries,
      fourPsCoverageRate,
      populationByMunicipality,
    };
  }, [sitios]);
}

/* Flat tint pairs (bg + fg) used by TintRow / SectionHead icon chips —
   deliberately not the app's usual icon gradients, so this panel reads
   calmer next to the denser bar/legend content it's paired with. */
const TINT = {
  blue: { bg: '#e6f1fb', fg: '#185fa5' },
  purple: { bg: '#f2e9fb', fg: '#7c3aed' },
  amber: { bg: '#fdecd8', fg: '#c2650a' },
  yellow: { bg: '#fdf6d8', fg: '#a16a00' },
  green: { bg: '#e4f8ef', fg: '#0f9d58' },
  red: { bg: '#fdecea', fg: '#c0392b' },
};

export default function DemographicsPanel({ sitios, hasFilters, onClearFilters }) {
  const stats = useDemographicsStats(sitios);

  if (!stats.totalSitios) {
    return (
      <div className="panelEmpty">
        <div className="panelEmptyIcon"><TabIcon name="users" /></div>
        <div className="panelEmptyTitle">No sitios match these filters</div>
        <div className="panelEmptySub">Try a different municipality, barangay, or search term.</div>
        {hasFilters ? (
          <button type="button" className="clearFiltersBtn" onClick={onClearFilters}>Clear filters</button>
        ) : null}
      </div>
    );
  }

  const maxMuniPop = stats.populationByMunicipality[0]?.value || 1;
  const maxWelfare = Math.max(stats.welfareChildren, stats.welfareSeniors, stats.welfarePWD, stats.welfareSoloParents) || 1;

  return (
    <div className="panelStack">
      <style>{DEMO_CSS}</style>


      {/* ===== Population & Age Structure + Moro/Indigenous Population ===== */}
      <div className="overviewGrid">
        <Card sourceId="population">
          <SectionHead icon="users" tint={TINT.blue} title="Population & Age Structure" sub="Age group breakdown across all recorded sitios" />
          <SplitBar
            segments={[
              { label: 'Children (0–14)', value: stats.totalChildren, color: '#60a5fa' },
              { label: 'Working-age (15–64)', value: stats.totalWorkingAge, color: '#2f6fed' },
              { label: 'Senior (65+)', value: stats.totalSenior, color: '#1e3a8a' },
            ]}
            total={stats.totalPopulation}
          />
          <SplitLegend
            segments={[
              { label: 'Children (0–14)', value: stats.totalChildren, color: '#60a5fa' },
              { label: 'Working-age (15–64)', value: stats.totalWorkingAge, color: '#2f6fed' },
              { label: 'Senior (65+)', value: stats.totalSenior, color: '#1e3a8a' },
            ]}
            total={stats.totalPopulation}
          />
          <div className="demoTotalGrid">
            <div className="demoTotalCard male">
              <div className="demoTotalCardLabel">MALE</div>
              <div className="demoTotalCardValue"><CountUp value={stats.totalMale} /></div>
              <div className="demoTotalCardSub">{pct(stats.totalMale, stats.totalPopulation).toFixed(1)}% of population</div>
            </div>
            <div className="demoTotalCard female">
              <div className="demoTotalCardLabel">FEMALE</div>
              <div className="demoTotalCardValue"><CountUp value={stats.totalFemale} /></div>
              <div className="demoTotalCardSub">{pct(stats.totalFemale, stats.totalPopulation).toFixed(1)}% of population</div>
            </div>
            <div className="demoTotalCard total">
              <div className="demoTotalCardLabel">TOTAL POPULATION</div>
              <div className="demoTotalCardValue"><CountUp value={stats.totalPopulation} /></div>
              <div className="demoTotalCardSub">{stats.totalHouseholds.toLocaleString()} households</div>
            </div>
          </div>
        </Card>

        <div className="moroStack">
          <div className="demoSmallStatCard" style={{ position: 'relative' }}>
            <SourceTag id="households" />
            <div className="demoSmallStatLeft">
              <div className="demoSmallStatIcon" style={{ background: TINT.blue.bg, color: TINT.blue.fg }}>
                <TabIcon name="building" />
              </div>
              <div className="demoSmallStatLabel">Number of Households</div>
            </div>
            <div className="demoSmallStatValue"><CountUp value={stats.totalHouseholds} /></div>
          </div>

          <Card sourceId="moroIp">
          <SectionHead icon="pin" tint={TINT.blue} title="Moro & Indigenous Population" sub="Cultural community population estimates" />
          <div className="tintRowList">
            <TintRow
              index={0}
              tint={TINT.yellow}
              title="Moro Population"
              sub="NCMF · RA 11054"
              count={stats.totalMoro}
              pctValue={stats.moroPct}
            />
            <TintRow
              index={1}
              tint={TINT.green}
              title="Indigenous Peoples Population"
              sub="NCIP"
              count={stats.totalIP}
              pctValue={stats.ipPct}
            />
          </div>
        </Card>
        </div>
      </div>

      {/* ===== Civil Registration & Digital ID Gap ===== */}
      <Card className="sectionCard" sourceId="civilReg">
        <SectionHead icon="doc" tint={TINT.amber} title="Civil Registration & Identification" sub="Population lacking foundational identity documents · registered voters shown for comparison" />
        <div className="donutGrid">
          <DonutChart
            index={0}
            gradientId="donut-demo-birthcert"
            colorFrom="#f97316"
            colorTo="#eab308"
            percent={stats.withoutBirthCertPct}
            valueDisplay={stats.totalWithoutBirthCert.toLocaleString()}
            label="Without a birth certificate"
            hoverText={`${stats.totalWithoutBirthCert.toLocaleString()} · ${stats.withoutBirthCertPct.toFixed(1)}% of total population`}
          />
          <DonutChart
            index={1}
            gradientId="donut-demo-philsys"
            colorFrom="#7c3aed"
            colorTo="#a855f7"
            percent={stats.withoutPhilsysPct}
            valueDisplay={stats.totalWithoutPhilsysId.toLocaleString()}
            label="Without a PhilSys National ID"
            hoverText={`${stats.totalWithoutPhilsysId.toLocaleString()} · ${stats.withoutPhilsysPct.toFixed(1)}% of total population`}
          />
          <DonutChart
            index={2}
            gradientId="donut-demo-voters"
            colorFrom="#2f6fed"
            colorTo="#60a5fa"
            percent={stats.voterRegistrationRate}
            valueDisplay={stats.totalRegisteredVoters.toLocaleString()}
            label="Registered Voters"
            hoverText={`${stats.totalRegisteredVoters.toLocaleString()} · ${stats.voterRegistrationRate.toFixed(1)}% of voting-age population`}
          />
        </div>
        <div className="overviewInsight">
          Missing civil registration is a common upstream blocker for PhilHealth, 4Ps, and voter
          registration enrollment — sitios with high gaps here are worth prioritizing for mobile
          civil registration / PhilSys outreach.
        </div>
      </Card>

      {/* ===== Education Participation + Labor & Employment (left) / Population by Municipality (right) ===== */}
      <div className="overviewGrid" style={{ gridTemplateColumns: '1.6fr 1fr', alignItems: 'start' }}>
        <div className="eduLaborStack">
          <Card sourceId="education">
            <SectionHead icon="doc" tint={TINT.green} title="Education Participation" sub={`Among an estimated ${stats.totalSchoolAge.toLocaleString()} school-age residents`} />
            <SplitBar
              segments={[
                { label: 'Currently attending', value: stats.totalAttending, color: '#22c55e' },
                { label: 'Out of school (OSCY)', value: stats.totalOSCY, color: '#e0392f' },
              ]}
              total={stats.totalSchoolAge}
            />
            <SplitLegend
              segments={[
                { label: 'Currently attending', value: stats.totalAttending, color: '#22c55e' },
                { label: 'Out of school (OSCY)', value: stats.totalOSCY, color: '#e0392f' },
              ]}
              total={stats.totalSchoolAge}
            />
          </Card>

          <Card className="sectionCard laborHalfCard" sourceId="labor">
            <SectionHead icon="briefcase" tint={TINT.purple} title="Labor & Employment" sub="Workforce statistics and economic dependency" />

            <div className="laborKpiGrid">
              <LaborKpiTile
                index={0}
                icon="users"
                tint={TINT.purple}
                label="Labor Force"
                value={stats.totalLaborForce}
                sub={`${pct(stats.totalLaborForce, stats.totalPopulation).toFixed(0)}% of population`}
              />
              <LaborKpiTile
                index={1}
                icon="trend"
                tint={TINT.green}
                label="Employed"
                value={stats.totalLaborForce - stats.totalUnemployed}
                sub={`${(100 - stats.unemploymentRate).toFixed(0)}% rate`}
              />
              <LaborKpiTile
                index={2}
                icon="pulse"
                tint={TINT.red}
                label="Unemployed"
                value={stats.totalUnemployed}
                sub={`${stats.unemploymentRate.toFixed(1)}% of labor force`}
              />
              <LaborKpiTile
                index={3}
                icon="shield"
                tint={TINT.amber}
                label="Senior Workers"
                value={stats.lf65plus}
                sub={`${pct(stats.lf65plus, stats.totalLaborForce).toFixed(1)}% of workforce`}
              />
            </div>

            <div className="empDistSection" style={{ position: 'relative' }}>
              <SourceTag id="employmentDistribution" />
              <div className="empDistTitle">Employment Distribution</div>
              <EmploymentDistributionBar
                employed={stats.totalLaborForce - stats.totalUnemployed}
                unemployed={stats.totalUnemployed}
                total={stats.totalLaborForce}
              />
            </div>

            <AgeGroupDonutCard
              total={stats.totalLaborForce}
              segments={[
                { label: '15–24 yrs old', value: stats.lf15to24, color: '#2f6fed' },
                { label: '25–54 yrs old', value: stats.lf25to54, color: '#22c55e' },
                { label: '55–64 yrs old', value: stats.lf55to64, color: '#ef980b' },
                { label: '65+ yrs old (still working)', value: stats.lf65plus, color: '#e0392f' },
              ]}
            />

            <Card className="sectionCard benchmarkBox" sourceId="laborBenchmark">
              <SectionHead icon="trend" tint={TINT.blue} title="Labor & Employment" sub="Aggregated vs. Philippine Benchmarks" />
              <div className="benchGrid">
                <BenchmarkRow
                  label="Unemployment"
                  localValue={stats.unemploymentRate}
                  localDisplay={`${stats.unemploymentRate.toFixed(1)}%`}
                  benchmarkValue={NATIONAL_BENCHMARKS.unemploymentRate}
                  benchmarkDisplay={`${NATIONAL_BENCHMARKS.unemploymentRate}%`}
                  benchmarkLabel="PH Annual Avg. (2025)"
                  higherIsWorse
                />
                <BenchmarkRow
                  label="Dependency"
                  localValue={stats.dependencyRatio}
                  localDisplay={stats.dependencyRatio.toFixed(1)}
                  benchmarkValue={NATIONAL_BENCHMARKS.dependencyRatio}
                  benchmarkDisplay={NATIONAL_BENCHMARKS.dependencyRatio.toFixed(1)}
                  benchmarkLabel="PH Avg. (POPCEN 2024)"
                  higherIsWorse
                />
              </div>
              <div className="benchSources">
                <span className="benchSourcesLabel">Data Sources:</span>
                <a href="https://tradingeconomics.com/philippines/unemployment-rate" target="_blank" rel="noreferrer" className="benchSourceLink">PSA Labor Force Survey ↗</a>
                <a href="https://www.worldeconomics.com/Demographics/Age-Dependency-Ratio-Total/Philippines.aspx" target="_blank" rel="noreferrer" className="benchSourceLink">World Bank Data ↗</a>
              </div>
            </Card>
          </Card>
        </div>

        <div className="muniStack">
          <Card sourceId="populationByMuni">
            <SectionHead icon="building" tint={TINT.blue} title="Population by Municipality" sub="Total recorded population per municipality" />
            <div className="rankBarList">
              {stats.populationByMunicipality.map((m, i) => (
                <RankBarRow
                  key={m.name}
                  index={i}
                  rank={i + 1}
                  name={m.name}
                  count={m.value}
                  widthPct={pct(m.value, maxMuniPop)}
                  hoverText={`${m.value.toLocaleString()} residents · ${pct(m.value, stats.totalPopulation).toFixed(1)}% of total population`}
                />
              ))}
            </div>
          </Card>

          <Card sourceId="philhealth">
            <SectionHead icon="shield" tint={TINT.blue} title="PhilHealth Coverage" sub="Direct vs. indirect contributor households" />
            <SplitBar
              segments={[
                { label: 'Direct contributors', value: stats.philhealthDirect, color: '#2f6fed' },
                { label: 'Indirect / sponsored', value: stats.philhealthIndirect, color: '#93c5fd' },
              ]}
              total={stats.totalHouseholds}
            />
            <SplitLegend
              segments={[
                { label: 'Direct contributors', value: stats.philhealthDirect, color: '#2f6fed' },
                { label: 'Indirect / sponsored', value: stats.philhealthIndirect, color: '#93c5fd' },
              ]}
              total={stats.totalHouseholds}
            />
            <div className="overviewInsight">
              <strong>{stats.philhealthCoverageRate.toFixed(1)}%</strong> of households have at least one
              PhilHealth contributor on record; the remainder is a UHC Act enrollment gap.
            </div>
          </Card>

          <Card sourceId="fourPs">
            <SectionHead icon="pulse" tint={TINT.green} title="4Ps Beneficiaries" sub="Pantawid Pamilyang Pilipino Program coverage" />
            <div className="teaserTile" style={{ padding: '22px 14px' }}>
              <div className="teaserValue" style={{ fontSize: 28 }}>
                <CountUp value={stats.fourPsBeneficiaries} />
              </div>
              <div className="teaserLabel">households enrolled as 4Ps beneficiaries</div>
            </div>
            <div className="overviewInsight">
              4Ps coverage sits at <strong>{stats.fourPsCoverageRate.toFixed(1)}%</strong> of households —
              cross-reference with GIDA status and civil registration gaps to spot sitios that may be
              under-enrolled relative to need.
            </div>
          </Card>
        </div>
      </div>

      {/* ===== Social Welfare Beneficiary Sectors ===== */}
      <Card className="sectionCard" sourceId="welfare">
        <SectionHead icon="shield" tint={TINT.red} title="Social Welfare Beneficiary Sectors" sub="Beneficiary counts, each shown against a coverage rate for its own population" />
        <div className="magBarList">
          <MagnitudeBarRow
            index={0}
            label="Children"
            note={`${stats.welfareChildrenRate.toFixed(1)}% of all children`}
            count={stats.welfareChildren}
            widthPct={pct(stats.welfareChildren, maxWelfare)}
            color="linear-gradient(90deg,#7c3aed,#c084fc)"
            hoverText={`${stats.welfareChildren.toLocaleString()} child beneficiaries · ${stats.welfareChildrenRate.toFixed(1)}% of all children`}
          />
          <MagnitudeBarRow
            index={1}
            label="Senior Citizens"
            note={`${stats.welfareSeniorsRate.toFixed(1)}% of all seniors`}
            count={stats.welfareSeniors}
            widthPct={pct(stats.welfareSeniors, maxWelfare)}
            color="linear-gradient(90deg,#7c3aed,#c084fc)"
            hoverText={`${stats.welfareSeniors.toLocaleString()} senior citizen beneficiaries · ${stats.welfareSeniorsRate.toFixed(1)}% of all seniors`}
          />
          <MagnitudeBarRow
            index={2}
            label="Persons with Disability"
            note={`${stats.welfarePWDRate.toFixed(1)}% of total population`}
            count={stats.welfarePWD}
            widthPct={pct(stats.welfarePWD, maxWelfare)}
            color="linear-gradient(90deg,#7c3aed,#c084fc)"
            hoverText={`${stats.welfarePWD.toLocaleString()} PWD beneficiaries · ${stats.welfarePWDRate.toFixed(1)}% of total population`}
          />
          <MagnitudeBarRow
            index={3}
            label="Solo Parents"
            note={`${stats.welfareSoloParentsRate.toFixed(1)}% of all households`}
            count={stats.welfareSoloParents}
            widthPct={pct(stats.welfareSoloParents, maxWelfare)}
            color="linear-gradient(90deg,#7c3aed,#c084fc)"
            hoverText={`${stats.welfareSoloParents.toLocaleString()} solo parent beneficiaries · ${stats.welfareSoloParentsRate.toFixed(1)}% of all households`}
          />
        </div>
      </Card>

      </div>
  );
}

/* Additions to the app's shared CSS surface — the parent Dashboard
   already injects :root variables and all .overviewCard / .miniStat /
   .gaugeGrid / .teaserTile classes this panel reuses. Everything below
   is new to this revision: the flat icon-chip header, the tinted rows,
   the ranked bar chart, and the combined legend+value rows. */
const DEMO_CSS = `
  .demoHead { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 18px; }
  .demoHeadIcon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

  .demoSplitTrack { display: flex; border-radius: 999px; overflow: hidden; background: #f0f1f4; }
  .demoSplitFill { height: 100%; width: 100%; transition: filter 0.15s ease; }

  .demoSplitLegend { display: flex; flex-direction: column; gap: 2px; margin-top: 14px; }
  .demoSplitLegendItem { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 9px 12px; border-radius: var(--radius-sm); }
  .demoSplitLegendItem:nth-child(odd) { background: #f8f8fb; }
  .demoSplitLegendHead { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); }
  .demoSplitLegendHead .dot { width: 9px; height: 9px; border-radius: 999px; display: inline-block; flex-shrink: 0; }
  .demoSplitLegendValue { display: flex; align-items: baseline; gap: 8px; font-size: 14px; font-weight: 800; color: var(--text-primary); }
  .demoSplitLegendPct { font-size: 11.5px; font-weight: 700; color: var(--text-muted); background: #fff; border-radius: 999px; padding: 2px 8px; }

  .tintRowList { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
  .tintRow {
    display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--radius-sm);
    opacity: 0; transform: translateX(-8px);
    transition: opacity 0.45s ease, transform 0.45s ease, box-shadow 0.2s ease;
  }
  .tintRow.in { opacity: 1; transform: translateX(0); }
  .tintRow.in:hover { box-shadow: 0 4px 14px rgba(16,24,40,0.10); }
  .tintRowText { flex: 1; min-width: 0; }
  .tintRowTitle { font-size: 13.5px; font-weight: 700; }
  .tintRowSub { font-size: 11.5px; color: var(--text-muted); }
  .tintRowRight { text-align: right; flex-shrink: 0; }
  .tintRowCount { font-size: 15px; font-weight: 800; }
  .tintRowPct { font-size: 11px; font-weight: 700; color: var(--text-muted); }

  .rankBarList { display: flex; flex-direction: column; gap: 10px; }
  .rankBarRow { display: grid; grid-template-columns: 22px 96px 1fr 60px; align-items: center; gap: 10px; }
  .rankBadge {
    width: 20px; height: 20px; border-radius: 999px; background: #f0f1f4; color: var(--text-secondary);
    font-size: 10.5px; font-weight: 800; display: flex; align-items: center; justify-content: center;
  }
  .rankBarLabel { font-size: 12px; font-weight: 700; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rankBarTrack { background: #f2f3f6; border-radius: 6px; height: 20px; overflow: hidden; }
  .rankBarFill { height: 100%; border-radius: 6px; background: linear-gradient(90deg,#2f6fed,#60a5fa); transition: width 1s cubic-bezier(.16,1,.3,1); }
  .rankBarValue { font-size: 12px; font-weight: 700; text-align: right; }

  .laborGrid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 24px; align-items: center; margin-top: 4px; }
  .laborMiniStats { grid-template-columns: repeat(2, 1fr); align-content: start; }

  .magBarList { display: flex; flex-direction: column; gap: 14px; }
  .magBarRow { display: grid; grid-template-columns: 160px 1fr 70px; align-items: center; gap: 10px; }
  .magBarLabel { display: flex; flex-direction: column; gap: 1px; font-size: 12px; font-weight: 700; color: var(--text-secondary); }
  .magBarNote { font-size: 10px; font-weight: 600; color: var(--text-muted); }
  .magBarTrack { background: #f2f3f6; border-radius: 6px; height: 22px; overflow: hidden; }
  .magBarFill { height: 100%; border-radius: 6px; transition: width 1s cubic-bezier(.16,1,.3,1); }
  .magBarValue { font-size: 12.5px; font-weight: 700; text-align: right; }

  @media (max-width: 1200px) {
    .laborGrid { grid-template-columns: 1fr; }
    .rankBarRow { grid-template-columns: 18px 84px 1fr 50px; }
    .magBarRow { grid-template-columns: 130px 1fr 60px; }
  
  
  }

  .laborKpiGrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
  .laborKpiTile { border-radius: var(--radius-sm); padding: 14px 16px; opacity: 0; transform: translateY(6px); transition: opacity 0.45s ease, transform 0.45s ease; }
  .laborKpiTile.in { opacity: 1; transform: translateY(0); }
  .laborKpiTop { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; margin-bottom: 8px; }
  .laborKpiValue { font-size: 22px; font-weight: 800; color: var(--text-primary); line-height: 1; margin-bottom: 4px; }
  .laborKpiSub { font-size: 11px; color: var(--text-muted); font-weight: 600; }

  .empDistSection { background: #fff; border: 1px solid var(--border-light,#eceef2); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 20px; }
  .empDistTitle { font-size: 13px; font-weight: 800; margin-bottom: 12px; }
  .empDistTrack { display: flex; border-radius: 999px; overflow: hidden; height: 34px; background: #f0f1f4; }
  .empDistFill { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: #fff; font-size: 12.5px; font-weight: 800; white-space: nowrap; }
  .empDistFill.employed { background: linear-gradient(90deg,#17a673,#22c55e); }
  .empDistFill.unemployed { background: linear-gradient(90deg,#e0392f,#f472a3); }
  .empDistLegend { display: flex; gap: 22px; margin-top: 12px; font-size: 12px; font-weight: 700; color: var(--text-secondary); }
  .empDistLegend span { display: flex; align-items: center; gap: 6px; }
  .empDot { width: 9px; height: 9px; border-radius: 999px; display: inline-block; }
  .empDot.employed { background: #17a673; }
  .empDot.unemployed { background: #e0392f; }

  .econDepBox { background: #fdf6e8; border: 1px solid #f3e2b8; border-radius: var(--radius-sm); padding: 14px; margin-bottom: 20px; }
  .econDepGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 4px; align-items: stretch; }
  .econDepGaugeCard, .econDepStatCard { background: #fff; border-radius: var(--radius-sm); padding: 10px; text-align: center; max-height: 190px; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .econDepGaugeScale { transform: scale(1.05); transform-origin: center; margin: 6px 0; }
  .econDepGaugeScale * { background: transparent !important; box-shadow: none !important; border: none !important; }
  .econDepGaugeCaption { font-size: 11px; color: var(--text-muted); font-weight: 600; margin-top: -8px; }
  .econDepStatCard { display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .econDepStatIcon { width: 36px; height: 36px; border-radius: 999px; background: #fdecd8; color: #c2650a; display: flex; align-items: center; justify-content: center; margin-bottom: 6px; }
  .econDepStatValue { font-size: 22px; font-weight: 800; }
  .econDepStatLabel { font-size: 12.5px; font-weight: 700; color: #c2650a; margin-top: 2px; }
  .econDepStatSub { font-size: 10.5px; color: var(--text-muted); }

  .benchmarkBox { background: #f4f7fd !important; box-shadow: inset 0 0 0 1px #e9edf7 !important; }
  .benchGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 4px 0 16px; }
  .benchRow { background: #fff; border: 1px solid #dbe4f5; border-radius: var(--radius-sm); padding: 14px 16px; }
  .benchRowHead { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .benchRowLabel { font-size: 12.5px; font-weight: 700; color: var(--text-secondary); }
  .benchRowBadge { font-size: 10.5px; font-weight: 800; padding: 2px 8px; border-radius: 999px; }
  .benchRowBadge.warn { background: #fdecea; color: #c0392b; }
  .benchRowBadge.ok { background: #e4f8ef; color: #0f9d58; }
  .benchRowValues { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
  .benchRowLocal { font-size: 19px; font-weight: 800; }
  .benchRowVs { font-size: 11.5px; color: var(--text-muted); font-weight: 600; }
  .benchBarTrack { height: 6px; border-radius: 4px; background: #f0f1f4; overflow: hidden; margin-bottom: 4px; }
  .benchBarTrack.sub { opacity: 0.7; }
  .benchBarFill { height: 100%; border-radius: 4px; transition: width 1s cubic-bezier(.16,1,.3,1); }
  .benchBarFill.local { background: #e0392f; }
  .benchBarFill.benchmark { background: #2f6fed; }
  .benchRowFoot { font-size: 10px; color: var(--text-muted); font-weight: 600; text-align: center; margin-top: 4px; }
  .benchSources { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding-top: 12px; border-top: 1px solid #e3e8f2; }
  .benchSourcesLabel { font-size: 11.5px; font-weight: 700; color: var(--text-muted); }
  .benchSourceLink { font-size: 11.5px; font-weight: 700; color: #2f6fed; background: #fff; border: 1px solid #dbe4f5; border-radius: 999px; padding: 3px 10px; text-decoration: none; }

  @media (max-width: 1200px) {
    .laborKpiGrid { grid-template-columns: repeat(2, 1fr); }
    .econDepGrid, .benchGrid { grid-template-columns: 1fr; }
  }

  /* Since the card is now half-width, tighten its internal grids so they
     don't get cramped at 4/2 columns inside a narrower box. */
  .laborHalfCard .laborKpiGrid { grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 1400px) {
    .laborHalfCard .laborKpiGrid { grid-template-columns: repeat(4, 1fr); }
  }
  .donutGrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 4px; }
  .donutChartWrap { background: #f8f8fb; border-radius: var(--radius-sm); padding: 18px 12px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .donutChartValue { font-size: 15px; font-weight: 800; fill: var(--text-primary); }
  .donutChartValueSmall { font-size: 10.5px; font-weight: 700; fill: var(--text-muted); }
  .donutChartLabel { font-size: 11.5px; font-weight: 700; color: var(--text-secondary); text-align: center; line-height: 1.3; }

  @media (max-width: 900px) {
    .donutGrid { grid-template-columns: 1fr; }
  }
  .demoTotalGrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 12px; }
  .demoTotalCard { padding: 12px 10px; border-radius: var(--radius-sm); text-align: center; border: 1px solid #dbe4f5; }
  .demoTotalCard.male { background: linear-gradient(135deg,#eef3fd,#f7f9fe); }
  .demoTotalCard.female { background: linear-gradient(135deg,#fdeef6,#fef7fa); border-color: #f6d9e8; }
  .demoTotalCard.total { background: linear-gradient(135deg,#eef0fd,#f8f8fe); border-color: #dee0f5; }
  .demoTotalCardLabel { font-size: 9.5px; font-weight: 800; letter-spacing: 0.06em; margin-bottom: 2px; }
  .demoTotalCard.male .demoTotalCardLabel { color: #2f6fed; }
  .demoTotalCard.female .demoTotalCardLabel { color: #d6336c; }
  .demoTotalCard.total .demoTotalCardLabel { color: #6c3fed; }
  .demoTotalCardValue { font-size: 18px; font-weight: 900; color: var(--text-primary); line-height: 1.1; }
  .demoTotalCardSub { font-size: 10px; color: var(--text-muted); font-weight: 600; margin-top: 2px; }

  @media (max-width: 640px) {
    .demoTotalGrid { grid-template-columns: 1fr; }
  }

  .muniStack { display: flex; flex-direction: column; gap: 20px; }

  .ageDonutCard { background: #fff; border: 1px solid var(--border-light,#eceef2); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 20px; }
  .ageDonutBody { display: flex; align-items: center; gap: 28px; margin-top: 4px; }
  .ageDonutChartWrap { position: relative; flex-shrink: 0; }
  .ageDonutCenter { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); text-align: center; }
  .ageDonutCenterLabel { font-size: 10.5px; color: var(--text-muted); font-weight: 700; }
  .ageDonutCenterValue { font-size: 18px; font-weight: 900; color: var(--text-primary); }
  .ageDonutLegend { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .ageDonutLegendItem { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 9px 12px; border-radius: var(--radius-sm); background: #f8f8fb; }
  .ageDonutLegendHead { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 700; color: var(--text-secondary); }
  .ageDonutLegendHead .dot { width: 10px; height: 10px; border-radius: 999px; display: inline-block; flex-shrink: 0; }
  .ageDonutLegendValue { font-size: 14px; font-weight: 800; color: var(--text-primary); }

  @media (max-width: 640px) {
    .ageDonutBody { flex-direction: column; align-items: flex-start; }
  }

  .moroStack { display: flex; flex-direction: column; gap: 12px; }
  .demoSmallStatCard { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 20px; border-radius: var(--radius-sm); background: #fff; border: 1px solid var(--border-light,#eceef2); box-shadow: 0 1px 3px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.04); }
  .demoSmallStatLeft { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
  .demoSmallStatIcon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .demoSmallStatLabel { font-size: 16px; font-weight: 700; color: var(--text-primary); }
  .demoSmallStatValue { font-size: 18px; font-weight: 800; color: var(--text-primary); margin-right: 8px; flex-shrink: 0; }
`;