import { useMemo } from 'react';
import TabIcon from './icons';
import { useInView, CountUp, pct, CornerTooltip, BarTooltip } from './dashboard';

/* =========================================================================
   SAFETY PANEL — Section E: Safety & Risk
   Q56 Environmental hazards (type + 12-month frequency)
   Q58-61 Dog/cat population & rabies vaccination coverage
========================================================================= */

/* ---- small inline icons (kept local so we don't touch icons.jsx) ---- */
function WaveIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
      <path d="M2 14c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
    </svg>
  );
}
function MountainIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 19 9 7l4 6 3-4 5 10z" />
    </svg>
  );
}
function DropletIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />
    </svg>
  );
}
/* Replaces the old WindIcon — earthquake was incorrectly using wind gusts before */
function EarthquakeIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 15h4l2-5 3 9 2-6 2 3h7" />
    </svg>
  );
}
function OtherHazardIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    </svg>
  );
}
function PawIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={color} stroke="none">
      <circle cx="7" cy="8" r="2" />
      <circle cx="12" cy="6" r="2" />
      <circle cx="17" cy="8" r="2" />
      <path d="M12 12c-3.5 0-6.5 2.2-6.5 5a2.5 2.5 0 0 0 4 2c1-1 1.6-1.5 2.5-1.5s1.5.5 2.5 1.5a2.5 2.5 0 0 0 4-2c0-2.8-3-5-6.5-5z" />
    </svg>
  );
}

const HAZARD_TYPES = [
  { key: 'flood', label: 'Flood', color: '#2f6fed', bg: '#e8f0fe', Icon: WaveIcon },
  { key: 'landslide', label: 'Landslide', color: '#c2650a', bg: '#fdecd8', Icon: MountainIcon },
  { key: 'drought', label: 'Drought', color: '#eab308', bg: '#fefbe8', Icon: DropletIcon },
  { key: 'earthquake', label: 'Earthquake', color: '#e0392f', bg: '#fdecea', Icon: EarthquakeIcon },
  { key: 'other', label: 'Other Hazards', color: '#63666f', bg: '#f0f1f4', Icon: OtherHazardIcon },
];

function useSafetyStats(sitios) {
  return useMemo(() => {
    const totalSitios = sitios.length;

    const hazardTotals = {};
    const hazardSitioCounts = {};
    HAZARD_TYPES.forEach(({ key }) => {
      hazardTotals[key] = 0;
      hazardSitioCounts[key] = 0;
    });
    sitios.forEach((s) => {
      HAZARD_TYPES.forEach(({ key }) => {
        const v = s.hazards?.[key] || 0;
        hazardTotals[key] += v;
        if (v > 0) hazardSitioCounts[key] += 1;
      });
    });

    const totalDogs = sitios.reduce((sum, s) => sum + (s.dogCount || 0), 0);
    const totalCats = sitios.reduce((sum, s) => sum + (s.catCount || 0), 0);
    const totalVaccinatedDogs = sitios.reduce((sum, s) => sum + (s.vaccinatedDogs || 0), 0);
    const totalVaccinatedCats = sitios.reduce((sum, s) => sum + (s.vaccinatedCats || 0), 0);
    const dogVaxPct = pct(totalVaccinatedDogs, totalDogs);
    const catVaxPct = pct(totalVaccinatedCats, totalCats);
    const totalPets = totalDogs + totalCats;
    const totalVaccinated = totalVaccinatedDogs + totalVaccinatedCats;
    const overallVaxPct = pct(totalVaccinated, totalPets);

    const foodCounts = { secure: 0, seasonal: 0, chronic: 0 };
    sitios.forEach((s) => {
      if (foodCounts[s.foodSecurity] !== undefined) foodCounts[s.foodSecurity] += 1;
    });
    const foodSecurePct = pct(foodCounts.secure, totalSitios);
    const foodSeasonalPct = pct(foodCounts.seasonal, totalSitios);
    const foodChronicPct = pct(foodCounts.chronic, totalSitios);
    const hazardExposedPct = pct(sitios.filter((s) => s.hazardExposed).length, totalSitios);

    const hazardRanked = HAZARD_TYPES
      .map((h) => ({
        ...h,
        affected: hazardSitioCounts[h.key],
        totalEvents: hazardTotals[h.key],
        avgPerSitio: totalSitios ? hazardTotals[h.key] / totalSitios : 0,
        exposurePct: pct(hazardSitioCounts[h.key], totalSitios),
      }))
      .sort((a, b) => b.exposurePct - a.exposurePct);

    return {
      totalSitios,
      hazardRanked,
      totalDogs,
      totalCats,
      totalVaccinatedDogs,
      totalVaccinatedCats,
      dogVaxPct,
      catVaxPct,
      totalPets,
      totalVaccinated,
      overallVaxPct,
      foodSecurePct,
      foodSeasonalPct,
      foodChronicPct,
      hazardExposedPct,
    };
  }, [sitios]);
}

/* Compact ranked row — replaces the old tall HazardCard grid */
function HazardRow({ Icon, color, bg, label, affected, totalEvents, avgPerSitio, exposurePct, totalSitios, index }) {
  const visible = useInView(index * 60 + 100);
  return (
    <div className={`hazardRow${visible ? ' in' : ''}`} style={{ transitionDelay: `${index * 50}ms` }}>
      <div className="hazardRowIcon" style={{ background: bg }}>
        <Icon color={color} />
      </div>
      <div className="hazardRowBody">
        <div className="hazardRowTop">
          <span className="hazardRowLabel">{label}</span>
          <span className="hazardRowPct" style={{ color }}>{exposurePct.toFixed(0)}%</span>
        </div>
        <div className="hazardRowTrack">
          <div className="hazardRowFill" style={{ width: visible ? `${exposurePct}%` : 0, background: color }} />
        </div>
        <div className="hazardRowCaption">
          {affected.toLocaleString()} of {totalSitios.toLocaleString()} sitios · {totalEvents.toLocaleString()} events · {avgPerSitio.toFixed(1)} avg/sitio
        </div>

      </div>
    </div>
  );
}

function PetTypeCard({ tone, Icon, color, label, total, vaccinated, vaxPct, index }) {
  const visible = useInView(index * 80 + 160);
  return (
    <div className={`petTypeCard tone-${tone}${visible ? ' in' : ''}`}>
      <div className="petTypeHead">
        <div className="petTypeIcon">
          <Icon color={color} />
        </div>
        <div>
          <div className="petTypeTitle">{label}</div>
          <div className="petTypeSub">{total.toLocaleString()} total</div>
        </div>

      </div>
      <div className="petVaxRow">
        <span>Vaccination Coverage</span>
        <span className="petVaxPct">{vaxPct.toFixed(1)}%</span>
      </div>
      <div className="petVaxTrack">
        <div className="petVaxFill" style={{ width: visible ? `${vaxPct}%` : 0 }} />
      </div>
      <div className="petVaxSub">{vaccinated.toLocaleString()} vaccinated</div>
    </div>
  );
}

export default function SafetyPanel({ sitios, hasFilters, onClearFilters }) {
  const stats = useSafetyStats(sitios);

  if (!stats.totalSitios) {
    return (
      <>
        <style>{SAFETY_CSS}</style>
        <div className="panelEmpty">
          <div className="panelEmptyIcon"><TabIcon name="shield" /></div>
          <div className="panelEmptyTitle">No sitios match these filters</div>
          <div className="panelEmptySub">Try a different municipality, barangay, or search term.</div>
          {hasFilters ? (
            <button type="button" className="clearFiltersBtn" onClick={onClearFilters}>Clear filters</button>
          ) : null}
        </div>
      </>
    );
  }

  const topHazard = stats.hazardRanked[0];

  return (
    <>
      <style>{SAFETY_CSS}</style>
      <div className="panelStack">
        <div className="safetyTwoCol">

          {/* ===== Environmental Hazards (Q56) — compact ranked rows ===== */}
          <div className="safeSectionCard">
            <CornerTooltip
              title="Source"
              text="NDRRMC hazard advisories; barangay disaster risk reduction (DRRM) records — hazard type and 12-month occurrence frequency (Q56)."
              linkHref="https://ndrrmc.gov.ph"
              linkLabel="ndrrmc.gov.ph"
              whyTitle="Why This Chart"
              whyText="Ranked bars were used because position/length along a common scale is the most accurately-judged encoding for comparing exposure rate across hazard types (Cleveland & McGill, 1984)."
              whyLinkHref="https://www.tandfonline.com/doi/abs/10.1080/01621459.1984.10478080"
              whyLinkLabel="Cleveland & McGill (1984), JASA"
              trigger="click"
            />
            <div className="overviewCardHead">
              <div className="overviewCardIcon" style={{ background: '#fdecea', color: '#e0392f' }}>
                <TabIcon name="shield" />
              </div>
              <div>
                <div className="overviewCardTitle">Environmental Hazards</div>
                <div className="overviewCardSub">Ranked by exposure rate across sitios (past 12 months)</div>
              </div>
            </div>
            <div className="hazardRowList">
              {stats.hazardRanked.map((h, i) => (
                <HazardRow
                  key={h.key}
                  Icon={h.Icon}
                  color={h.color}
                  bg={h.bg}
                  label={h.label}
                  affected={h.affected}
                  totalEvents={h.totalEvents}
                  avgPerSitio={h.avgPerSitio}
                  exposurePct={h.exposurePct}
                  totalSitios={stats.totalSitios}
                  index={i}
                />
              ))}
            </div>
            {topHazard ? (
              <div className="overviewInsight" style={{ marginTop: 16 }}>
                <strong>{topHazard.label}</strong> is the most widespread hazard, affecting {topHazard.exposurePct.toFixed(0)}% of sitios
                ({topHazard.affected.toLocaleString()} of {stats.totalSitios.toLocaleString()}) — a natural priority for early-warning systems
                and DRRM resource pre-positioning.
              </div>
            ) : null}
          </div>

          {/* ===== Household Pets / Animal Health (Q58-61) ===== */}
          <div className="safeSectionCard">
            <CornerTooltip
              title="Source"
              text="Municipal/City Veterinary Office — Anti-Rabies Program records; pet population and vaccination coverage (Q58-61)."
              linkHref="https://www.da.gov.ph"
              linkLabel="da.gov.ph"
              whyTitle="Why This Chart"
              whyText="Progress bars were used here instead of a bar chart because each card shows one value's progress toward a 100% target (vaccination coverage) — this is the purpose-built pattern for target-based metrics, known as a bullet graph (Few, 2006)."
              whyLinkHref="https://www.perceptualedge.com/articles/misc/Bullet_Graph_Design_Spec.pdf"
              whyLinkLabel="Few, Bullet Graph Design Spec (PDF)"
              trigger="click"
            />
            <div className="overviewCardHead">
              <div className="overviewCardIcon" style={{ background: '#f2e9fb', color: '#7c3aed' }}>
                <PawIcon color="#7c3aed" />
              </div>
              <div>
                <div className="overviewCardTitle">Household Pets</div>
                <div className="overviewCardSub">Pet population and rabies vaccination coverage</div>
              </div>
            </div>

            <div className="petsStack">
              <div className="petsTotalCard">
                <div>
                  <div className="petsTotalLabel">Total Pets</div>
                  <div className="petsTotalValue"><CountUp value={stats.totalPets} /></div>
                  <div className="petsTotalSub">across all households</div>
                </div>
                <div className="petsTotalIcon">
                  <PawIcon color="#7c3aed" />
                </div>
              </div>

              <PetTypeCard
                tone="yellow"
                Icon={PawIcon}
                color="#c2650a"
                label="Dogs"
                total={stats.totalDogs}
                vaccinated={stats.totalVaccinatedDogs}
                vaxPct={stats.dogVaxPct}
                index={0}
              />
              <PetTypeCard
                tone="orange"
                Icon={PawIcon}
                color="#c2410c"
                label="Cats"
                total={stats.totalCats}
                vaccinated={stats.totalVaccinatedCats}
                vaxPct={stats.catVaxPct}
                index={1}
              />

              <div className="vaxSummaryCard">
                <div className="vaxSummaryIcon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m18 2 4 4-9.5 9.5-4 1 1-4z" />
                    <path d="m14.5 5.5 4 4" />
                  </svg>
                </div>
                <div className="vaxSummaryTitle">Vaccination Summary</div>
                <div className="vaxSummaryStats">
                  <div className="vaxSummaryStat">
                    <div className="vaxSummaryStatValue"><CountUp value={stats.totalVaccinated} /></div>
                    <div className="vaxSummaryStatLabel">Total Vaccinated</div>
                  </div>
                  <div className="vaxSummaryStat">
                    <div className="vaxSummaryStatValue">{stats.overallVaxPct.toFixed(1)}%</div>
                    <div className="vaxSummaryStatLabel">Overall Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ===== Safety & Food Security ===== */}
        <div className="sectionCard safetyFoodSecurityCard" style={{ position: 'relative' }}>
          <CornerTooltip
            title="Source"
            text="Q57 — Food security status (secure / seasonal scarcity / chronic shortage), based on the Household Food Insecurity Access Scale (HFIAS) used in FNRI-DOST's National Nutrition Survey, aligned with the Integrated Food Security Phase Classification (IPC) chronic food insecurity levels tracked for the Philippines."
            linkHref="https://www.fnri.dost.gov.ph/images/45thFSS/TS1-FoodSecurity.pdf"
            linkLabel="fnri.dost.gov.ph — Food Security Survey"
            whyTitle="Why This Chart"
            whyText="A single 100%-stacked bar is used because the three status categories are mutually exclusive and must sum to the full sitio count — the story here is the mix of secure/seasonal/chronic sitios, not the size of any one segment on its own, which is exactly the case a stacked composition bar is built for."
            whyLinkHref="https://affine.pro/blog/when-to-use-a-stacked-bar-chart"
            whyLinkLabel="AFFiNE — When to use a stacked bar chart"
            trigger="click"
          />
          <div className="overviewCardHead">
            <div className="overviewCardIcon" style={{ background: 'linear-gradient(135deg,#e0392f,#f97316)', color: '#fff' }}>
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
                <BarTooltip text={`Food secure · ${stats.foodSecurePct.toFixed(1)}%`} style={{ width: `${stats.foodSecurePct}%` }}><div className="foodSplitFill secure" /></BarTooltip>
                <BarTooltip text={`Seasonal scarcity · ${stats.foodSeasonalPct.toFixed(1)}%`} style={{ width: `${stats.foodSeasonalPct}%` }}><div className="foodSplitFill seasonal" /></BarTooltip>
                <BarTooltip text={`Chronic shortage · ${stats.foodChronicPct.toFixed(1)}%`} style={{ width: `${stats.foodChronicPct}%` }}><div className="foodSplitFill chronic" /></BarTooltip>
              </div>
              <div className="foodSplitLegend">
                <span><span className="dot" style={{ background: '#22c55e' }} />Food secure &middot; {stats.foodSecurePct.toFixed(1)}%</span>
                <span><span className="dot" style={{ background: '#eab308' }} />Seasonal scarcity &middot; {stats.foodSeasonalPct.toFixed(1)}%</span>
                <span><span className="dot" style={{ background: '#e0392f' }} />Chronic shortage &middot; {stats.foodChronicPct.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const SAFETY_CSS = `
  .safetyTwoCol {
    display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 16px; align-items: start;
  }
  @media (max-width: 1100px) {
    .safetyTwoCol { grid-template-columns: 1fr; }
  }

  .safeSectionCard {
    position: relative; background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 24px; box-shadow: var(--shadow-sm);
    height: 100%;
  }
  .safetyFoodSecurityCard { margin-top: 16px; }

  /* ===== Hazard rows — compact ranked list replacing the old tall cards ===== */
  .hazardRowList {
    display: flex; flex-direction: column; gap: 10px; margin-top: 16px;
  }
  .hazardRow {
    display: flex; align-items: center; gap: 12px;
    background: #fafafc; border: 1px solid var(--border); border-radius: var(--radius-sm);
    padding: 10px 14px; opacity: 0; transform: translateY(8px);
    transition: opacity 0.45s ease, transform 0.45s ease, box-shadow 0.2s ease;
  }
  .hazardRow.in { opacity: 1; transform: translateY(0); }
  .hazardRow.in:hover { box-shadow: 0 4px 14px rgba(16,24,40,0.08); }
  .hazardRowIcon {
    width: 32px; height: 32px; border-radius: 8px; display: flex;
    align-items: center; justify-content: center; flex-shrink: 0;
  }
  .hazardRowBody { flex: 1; min-width: 0; }
  .hazardRowTop { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px; }
  .hazardRowLabel { font-size: 13px; font-weight: 700; }
  .hazardRowPct { font-size: 13px; font-weight: 800; }
  .hazardRowTrack { background: #eef0f4; border-radius: 999px; height: 5px; overflow: hidden; margin-bottom: 5px; }
  .hazardRowFill { height: 100%; border-radius: 999px; transition: width 1.1s cubic-bezier(.16,1,.3,1); }
  .hazardRowCaption { font-size: 10.5px; color: var(--text-muted); }

  .petsStack { display: flex; flex-direction: column; gap: 12px; margin-top: 18px; }

  .petsTotalCard {
    background: linear-gradient(135deg, #f2e9fb, #efe6fb); border-radius: var(--radius-sm);
    padding: 18px 20px; display: flex; align-items: center; justify-content: space-between;
  }
  .petsTotalLabel { font-size: 11px; font-weight: 700; color: var(--purple-text); text-transform: uppercase; letter-spacing: 0.04em; }
  .petsTotalValue { font-size: 28px; font-weight: 800; margin-top: 4px; }
  .petsTotalSub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
  .petsTotalIcon {
    width: 40px; height: 40px; border-radius: 999px; background: #fff; display: flex;
    align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(16,24,40,0.08); flex-shrink: 0;
  }

  .petTypeCard {
    border-radius: var(--radius-sm); padding: 14px 16px; opacity: 0; transform: translateY(8px);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }
  .petTypeCard.in { opacity: 1; transform: translateY(0); }
  .petTypeCard.tone-yellow { background: #fefbe8; }
  .petTypeCard.tone-orange { background: #fdecd8; }
  .petTypeHead { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .petTypeIcon { width: 30px; height: 30px; border-radius: 8px; background: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .petTypeTitle { font-size: 13.5px; font-weight: 700; }
  .petTypeSub { font-size: 11px; color: var(--text-muted); }
  .petVaxRow { display: flex; align-items: center; justify-content: space-between; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 5px; }
  .petVaxPct { font-weight: 800; color: var(--green); }
  .petVaxTrack { background: rgba(255,255,255,0.6); border-radius: 999px; height: 8px; overflow: hidden; margin-bottom: 7px; }
  .petVaxFill { height: 100%; border-radius: 999px; background: linear-gradient(90deg,#17a673,#22c55e); transition: width 1.1s cubic-bezier(.16,1,.3,1); }
  .petVaxSub { font-size: 11px; color: var(--text-muted); }

  .vaxSummaryCard {
    background: #f8f8fb; border-radius: var(--radius-sm); padding: 14px 16px;
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  }
  .vaxSummaryIcon { width: 30px; height: 30px; border-radius: 8px; background: var(--green-bg); color: var(--green); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .vaxSummaryTitle { font-size: 13px; font-weight: 700; flex: 1; min-width: 100px; }
  .vaxSummaryStats { display: flex; gap: 18px; }
  .vaxSummaryStat { text-align: center; }
  .vaxSummaryStatValue { font-size: 17px; font-weight: 800; }
  .vaxSummaryStatLabel { font-size: 10px; color: var(--text-muted); margin-top: 2px; }
`;