import { useMemo, useEffect } from 'react';
import TabIcon from './icons';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import {
  pct,
  useInView,
  CountUp,
  CornerTooltip,
  BarTooltip,
  StatCard,
  MUNI_COORDS,
} from './dashboard';

/* =========================================================================
   AREA PANEL — Section A: Geographic & Area Profile
   Covers: municipality/barangay/sitio identification, GPS coordinates,
   GIDA status, conflict classification, main access type, and common
   transportation modes. Includes a stylized province-wide bubble map
   that drills down as the toolbar filters narrow (municipality ->
   barangay -> individual sitio).
========================================================================= */

const GIDA_TONES = [
  { max: 15, color: '#17a673' },
  { max: 35, color: '#eab308' },
  { max: 101, color: '#e0392f' },
];
function gidaTone(pctValue) {
  return (GIDA_TONES.find((t) => pctValue <= t.max) || GIDA_TONES[GIDA_TONES.length - 1]).color;
}

/* ===== Leaflet pin helpers ===== */

function makeDivIcon(color, size = 22, alert = false) {
  const pad = alert ? size * 0.8 : 0;
  const total = size + pad * 2;
  return L.divIcon({
    className: 'leafletColorPin',
    html: `
      <span style="position:relative;display:block;width:${total}px;height:${total}px;">
        ${alert ? `<span class="pinAlertRing" style="background:${color};"></span>` : ''}
        <span style="
          position:absolute; top:${pad}px; left:${pad}px;
          display:block;width:${size}px;height:${size}px;border-radius:50%;
          background:${color};border:2px solid #fff;
          box-shadow:0 2px 6px rgba(16,24,40,0.35); z-index:2;
        "></span>
      </span>`,
    iconSize: [total, total],
    iconAnchor: [total / 2, total / 2],
  });
}

function pinColorFor(point, isSitio) {
  if (isSitio) {
    if (point.conflictClassification === 'CAA') return '#e0392f';
    if (point.conflictClassification === 'CVA') return '#f97316';
    if (point.gida) return '#eab308';
    return '#2f6fed';
  }
  return gidaTone(point.gidaPct);
}

/* Re-fits the map viewport to whatever points are currently shown —
   zooms to a municipality/barangay/sitio automatically as filters change. */
function MapAutoFit({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: points.length === 1 ? 14 : 12 });
  }, [points, map]);
  return null;
}

const ACCESS_COLORS = [
  'linear-gradient(90deg,#2f6fed,#60a5fa)',
  'linear-gradient(90deg,#eab308,#fbbf24)',
  'linear-gradient(90deg,#7c3aed,#c084fc)',
  'linear-gradient(90deg,#0ea5e9,#67e8f9)',
];
const TRANSPORT_COLORS = [
  'linear-gradient(90deg,#17a673,#4ade80)',
  'linear-gradient(90deg,#2f6fed,#60a5fa)',
  'linear-gradient(90deg,#f97316,#fdba74)',
  'linear-gradient(90deg,#7c3aed,#c084fc)',
  'linear-gradient(90deg,#0ea5e9,#67e8f9)',
];

/* ===== Aggregation hooks ===== */

function useAreaStats(sitios) {
  return useMemo(() => {
    const total = sitios.length;
    const gidaCount = sitios.filter((s) => s.gida).length;
    const caaCount = sitios.filter((s) => s.conflictClassification === 'CAA').length;
    const cvaCount = sitios.filter((s) => s.conflictClassification === 'CVA').length;
    const neitherCount = total - caaCount - cvaCount;

    const accessCounts = {};
    sitios.forEach((s) => {
      accessCounts[s.mainAccessType] = (accessCounts[s.mainAccessType] || 0) + 1;
    });
    const pavedCount = accessCounts['Paved road'] || 0;

    const transportCounts = {};
    sitios.forEach((s) => {
      (s.transportModes || []).forEach((m) => {
        transportCounts[m] = (transportCounts[m] || 0) + 1;
      });
    });

    return {
      total,
      gidaCount,
      gidaPct: pct(gidaCount, total),
      caaCount,
      cvaCount,
      neitherCount,
      caaPct: pct(caaCount, total),
      cvaPct: pct(cvaCount, total),
      neitherPct: pct(neitherCount, total),
      accessCounts,
      pavedCount,
      pavedPct: pct(pavedCount, total),
      transportCounts,
    };
  }, [sitios]);
}

function useMunicipalityAgg(sitios) {
  return useMemo(() => {
    const map = new Map();
    sitios.forEach((s) => {
      if (!map.has(s.municipality)) {
        map.set(s.municipality, { key: s.municipality, label: s.municipality, count: 0, gida: 0, caa: 0, cva: 0 });
      }
      const row = map.get(s.municipality);
      row.count += 1;
      if (s.gida) row.gida += 1;
      if (s.conflictClassification === 'CAA') row.caa += 1;
      if (s.conflictClassification === 'CVA') row.cva += 1;
    });
    return Array.from(map.values())
      .filter((row) => MUNI_COORDS[row.key])
      .map((row) => ({
        ...row,
        gidaPct: pct(row.gida, row.count),
        lat: MUNI_COORDS[row.key].lat,
        lng: MUNI_COORDS[row.key].lng,
      }))
      .sort((a, b) => b.count - a.count);
  }, [sitios]);
}

function useBarangayAgg(sitios, municipality) {
  return useMemo(() => {
    if (!municipality) return [];
    const map = new Map();
    sitios.forEach((s) => {
      if (s.municipality !== municipality) return;
      if (!map.has(s.barangay)) {
        map.set(s.barangay, { key: s.barangay, label: s.barangay, count: 0, gida: 0, caa: 0, cva: 0, latSum: 0, lngSum: 0 });
      }
      const row = map.get(s.barangay);
      row.count += 1;
      if (s.gida) row.gida += 1;
      if (s.conflictClassification === 'CAA') row.caa += 1;
      if (s.conflictClassification === 'CVA') row.cva += 1;
      row.latSum += s.gpsLatitude;
      row.lngSum += s.gpsLongitude;
    });
    return Array.from(map.values())
      .map((row) => ({
        ...row,
        gidaPct: pct(row.gida, row.count),
        lat: row.latSum / row.count,
        lng: row.lngSum / row.count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [sitios, municipality]);
}

/* ===== Local bar row (mirrors dashboard's BarRow, with a color prop) ===== */

function AreaBarRow({ label, count, widthPct, index, total, color }) {
  const visible = useInView(index * 60 + 120);
  const ofTotalPct = total ? pct(count, total) : 0;
  return (
    <div className="barRow">
      <div className="barRowLabel">{label}</div>
      <BarTooltip text={`${count.toLocaleString()} sitios · ${ofTotalPct.toFixed(1)}% of total`}>
        <div className="barTrack">
          <div
            className="barFill"
            style={{ width: visible ? `${widthPct}%` : 0, background: color, transitionDelay: `${index * 50}ms` }}
          />
        </div>
      </BarTooltip>
      <div className="barRowValue"><CountUp value={count} duration={800} /></div>
    </div>
  );
}

/* ===== Main panel ===== */

export default function AreaPanel({ sitios = [], hasFilters, onClearFilters, municipality, barangay }) {
  const stats = useAreaStats(sitios);
  const municipalityAgg = useMunicipalityAgg(sitios);
  const barangayAgg = useBarangayAgg(sitios, municipality);

  const level = barangay ? 'sitio' : municipality ? 'barangay' : 'municipality';

  const mapPoints = useMemo(() => {
    if (level === 'sitio') {
      return sitios.map((s) => ({
        key: s.id,
        label: s.sitioName,
        lat: s.gpsLatitude,
        lng: s.gpsLongitude,
        barangay: s.barangay,
        municipality: s.municipality,
        gida: s.gida,
        conflictClassification: s.conflictClassification,
        mainAccessType: s.mainAccessType,
      }));
    }
    if (level === 'barangay') return barangayAgg;
    return municipalityAgg;
  }, [level, sitios, barangayAgg, municipalityAgg]);

  const accessRows = useMemo(
    () => Object.entries(stats.accessCounts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
    [stats.accessCounts]
  );
  const transportRows = useMemo(
    () => Object.entries(stats.transportCounts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
    [stats.transportCounts]
  );

  if (!stats.total) {
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
      <style>{AREA_CSS}</style>

      {/* ===== KPI cards (stacked) + Province map, side by side ===== */}
      <div className="areaTopGrid">
        <div className="sectionCard mapSectionCard">
          <CornerTooltip
            title="Location Data Sources"
            text="Municipality, barangay, and sitio names follow PSA's Philippine Standard Geographic Code (PSGC). Sitio-level GPS coordinates are referenced against NAMRIA mapping standards. Pin positions are approximate and stylized for visualization — not a surveyed map."
            linkHref="https://psa.gov.ph/classification/psgc"
            linkLabel="psa.gov.ph/classification/psgc"
            whyTitle="Why This Map"
            whyText="Proportional symbols (pin size/color) are used instead of shaded municipality polygons because sitio counts are raw totals, not standardized rates — choropleth shading is only considered valid for normalized data. Sizing by count avoids the visual bias where a physically larger municipality looks more significant regardless of how many sitios it actually has."
            whyLinkHref="https://www.axismaps.com/guide/proportional-symbols"
            whyLinkLabel="Axis Maps: Proportional Symbols"
            trigger="click"
          />
          <div className="overviewCardHead">
            <div className="overviewCardIcon" style={{ background: 'linear-gradient(135deg,#2f6fed,#0ea5e9)', color: '#fff' }}>
              <TabIcon name="pin" />
            </div>
            <div>
              <div className="overviewCardTitle">South Cotabato — Sitio Distribution Map</div>
              <div className="overviewCardSub">
                {level === 'municipality' && 'All 10 municipalities · select one from the toolbar to drill into barangays'}
                {level === 'barangay' && `Barangays in ${municipality} · select a barangay to see individual sitios`}
                {level === 'sitio' && `Individual sitios in ${barangay}, ${municipality}`}
              </div>
            </div>
          </div>

          <div className="mapCanvasWrap">
            <MapContainer
              center={[6.35, 124.8]}
              zoom={10}
              scrollWheelZoom
              style={{ width: '100%', aspectRatio: '4 / 3', borderRadius: 14 }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapAutoFit points={mapPoints} />
              {mapPoints.map((p) => (
                <Marker
                  key={p.key}
                  position={[p.lat, p.lng]}
                  icon={makeDivIcon(
                    pinColorFor(p, level === 'sitio'),
                    level === 'sitio' ? 14 : 26,
                    level === 'sitio' ? p.conflictClassification === 'CAA' : p.caa > 0
                  )}
                  eventHandlers={{
                    mouseover: (e) => e.target.openPopup(),
                    mouseout: (e) => e.target.closePopup(),
                  }}
                >
                  <Popup autoPan={false} closeButton={false}>
                    <strong>{p.label}</strong>
                    <br />
                    {level === 'sitio' ? (
                      <>
                        {p.barangay}, {p.municipality}
                        <br />
                        GIDA: {p.gida ? 'Yes' : 'No'} &middot; {p.conflictClassification}
                        <br />
                        Access: {p.mainAccessType}
                        <br />
                        {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                      </>
                    ) : (
                      <>
                        {p.count.toLocaleString()} sitios profiled
                        <br />
                        {p.gidaPct.toFixed(1)}% GIDA &middot; {p.caa} CAA / {p.cva} CVA
                      </>
                    )}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="mapLegend">
            {level !== 'sitio' ? (
              <>
                <span className="mapLegendItem"><span className="dot" style={{ background: '#17a673' }} />Low GIDA share (&le;15%)</span>
                <span className="mapLegendItem"><span className="dot" style={{ background: '#eab308' }} />Moderate GIDA share (16&ndash;35%)</span>
                <span className="mapLegendItem"><span className="dot" style={{ background: '#e0392f' }} />High GIDA share (&gt;35%)</span>
                <span className="mapLegendNote">Pin size reflects number of profiled sitios</span>
              </>
            ) : (
              <>
                <span className="mapLegendItem"><span className="dot" style={{ background: '#e0392f' }} />Conflict-Affected (CAA)</span>
                <span className="mapLegendItem"><span className="dot" style={{ background: '#f97316' }} />Conflict-Vulnerable (CVA)</span>
                <span className="mapLegendItem"><span className="dot" style={{ background: '#eab308' }} />GIDA sitio</span>
                <span className="mapLegendItem"><span className="dot" style={{ background: '#2f6fed' }} />Standard sitio</span>
              </>
            )}
          </div>
        </div>

        <div className="areaStatsCol">
          <StatCard index={0} icon="pin" grad="linear-gradient(135deg,#2f6fed,#6366f1)" label="Sitios Profiled" value={stats.total} sub="in current filter" />
          <StatCard
            index={1} icon="pin" grad="linear-gradient(135deg,#eab308,#f59e0b)" label="GIDA Sitios"
            value={stats.gidaPct} decimals={1} suffix="%" sub={`${stats.gidaCount.toLocaleString()} of ${stats.total.toLocaleString()} sitios`}
            cornerTooltip={{ title: 'GIDA', text: 'Per DOH Administrative Order No. 2020-0023 — limited access to basic services due to distance, terrain, or road conditions.' }}
            cornerTooltipTrigger="click"
          />
          <StatCard
            index={2} icon="shield" grad="linear-gradient(135deg,#e0392f,#f97316)" label="Conflict-Affected (CAA)"
            value={stats.caaCount} sub={`${stats.cvaCount.toLocaleString()} additionally Conflict-Vulnerable (CVA)`}
            cornerTooltip={{ title: 'Conflict Classification', text: 'Per the PAMANA Program Manual of Operations, OPAPRU.' }}
            cornerTooltipTrigger="click"
          />
          <StatCard
            index={3} icon="building" grad="linear-gradient(135deg,#7c3aed,#a855f7)" label="Paved Road Access"
            value={stats.pavedPct} decimals={1} suffix="%" sub={`${stats.pavedCount.toLocaleString()} sitios with paved main access`}
            cornerTooltip={{ title: 'Access Classification', text: 'Per the DPWH Road Classification System.' }}
            cornerTooltipTrigger="click"
          />
        </div>
      </div>

      {/* ===== GIDA + Conflict classification ===== */}
      <div className="overviewGrid">
        <div className="overviewCard">
          <CornerTooltip
            title="GIDA Classification"
            text="Per DOH Administrative Order No. 2020-0023 — areas with limited access to basic services due to distance, terrain, or road conditions."
            whyTitle="Why This Chart"
            whyText="A single proportional split bar is used because this is a 2-category comparison (GIDA vs. non-GIDA), and position/length judgments along a common baseline are read more accurately than pie-chart angle judgments (Cleveland & McGill, 1984)."
            whyLinkHref="https://flowingdata.com/2010/03/20/graphical-perception-learn-the-fundamentals-first/"
            whyLinkLabel="Cleveland & McGill (1984) — explained"
            trigger="click"
          />
          <div className="overviewCardHead">
            <div className="overviewCardIcon" style={{ background: 'linear-gradient(135deg,#eab308,#f59e0b)', color: '#fff' }}>
              <TabIcon name="pin" />
            </div>
            <div>
              <div className="overviewCardTitle">Geographically Isolated &amp; Disadvantaged Areas</div>
              <div className="overviewCardSub">Sitios with limited access to basic services</div>
            </div>
          </div>
          <div className="genderSplit">
            <div className="genderSplitHead">
              <span><span className="dot" style={{ background: '#eab308' }} /> GIDA &middot; {stats.gidaPct.toFixed(1)}%</span>
              <span><span className="dot" style={{ background: '#d8dbe2' }} /> Non-GIDA &middot; {(100 - stats.gidaPct).toFixed(1)}%</span>
            </div>
            <div className="genderSplitTrack">
              <BarTooltip text={`${stats.gidaCount.toLocaleString()} GIDA sitios · ${stats.gidaPct.toFixed(1)}%`} style={{ width: `${stats.gidaPct}%` }}>
                <div className="genderSplitFill" style={{ background: 'linear-gradient(90deg,#eab308,#f59e0b)' }} />
              </BarTooltip>
              <BarTooltip text={`${(stats.total - stats.gidaCount).toLocaleString()} non-GIDA sitios · ${(100 - stats.gidaPct).toFixed(1)}%`} style={{ width: `${100 - stats.gidaPct}%` }}>
                <div className="genderSplitFill" style={{ background: '#d8dbe2' }} />
              </BarTooltip>
            </div>
          </div>
          <div className="miniStatRow">
            <div className="miniStat"><div className="miniStatValue"><CountUp value={stats.gidaCount} /></div><div className="miniStatLabel">GIDA sitios</div></div>
            <div className="miniStat"><div className="miniStatValue"><CountUp value={stats.total - stats.gidaCount} /></div><div className="miniStatLabel">Non-GIDA sitios</div></div>
            <div className="miniStat"><div className="miniStatValue">{stats.gidaPct.toFixed(1)}%</div><div className="miniStatLabel">Share of total</div></div>
          </div>
        </div>

        <div className="overviewCard">
          <CornerTooltip
            title="Conflict Classification"
            text="Per the PAMANA Program Manual of Operations (OPAPRU). CAA: active armed encounters or armed-group dominance. CVA: at risk due to proximity or valuable resources."
            whyTitle="Why This Chart"
            whyText="A 100% stacked bar is used for this 3-category split (CAA / CVA / Neither) because that category count sits in the recommended 2-to-5-category sweet spot for stacked/donut-style part-to-whole charts, and bar length is judged more accurately than pie-slice angle for the same comparison (Cleveland & McGill, 1984)."
            whyLinkHref="https://dataviz.unhcr.org/chart-types/part-to-a-whole/"
            whyLinkLabel="UNHCR Data Viz: Part-to-Whole Charts"
            trigger="click"
          />
          <div className="overviewCardHead">
            <div className="overviewCardIcon" style={{ background: 'linear-gradient(135deg,#e0392f,#f97316)', color: '#fff' }}>
              <TabIcon name="shield" />
            </div>
            <div>
              <div className="overviewCardTitle">Conflict Classification</div>
              <div className="overviewCardSub">Conflict-affected vs. conflict-vulnerable sitios</div>
            </div>
          </div>
          <div className="foodSplitWrap">
            <div className="foodSplitTrack">
              <BarTooltip text={`Neither / Not applicable · ${stats.neitherPct.toFixed(1)}%`} style={{ width: `${stats.neitherPct}%` }}>
                <div className="foodSplitFill" style={{ background: 'linear-gradient(90deg,#94a3b8,#cbd5e1)' }} />
              </BarTooltip>
              <BarTooltip text={`Conflict-Vulnerable (CVA) · ${stats.cvaPct.toFixed(1)}%`} style={{ width: `${stats.cvaPct}%` }}>
                <div className="foodSplitFill" style={{ background: 'linear-gradient(90deg,#f97316,#fdba74)' }} />
              </BarTooltip>
              <BarTooltip text={`Conflict-Affected (CAA) · ${stats.caaPct.toFixed(1)}%`} style={{ width: `${stats.caaPct}%` }}>
                <div className="foodSplitFill" style={{ background: 'linear-gradient(90deg,#e0392f,#f87171)' }} />
              </BarTooltip>
            </div>
            <div className="foodSplitLegend">
              <span><span className="dot" style={{ background: '#e0392f' }} />CAA &middot; {stats.caaCount} ({stats.caaPct.toFixed(1)}%)</span>
              <span><span className="dot" style={{ background: '#f97316' }} />CVA &middot; {stats.cvaCount} ({stats.cvaPct.toFixed(1)}%)</span>
              <span><span className="dot" style={{ background: '#94a3b8' }} />Neither &middot; {stats.neitherCount} ({stats.neitherPct.toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Access + Transportation ===== */}
      <div className="sectionCard">
        <CornerTooltip
          title="Access & Transportation"
          text="Main access type and common transportation modes are classified per the DPWH Road Classification System."
          linkHref="https://www.dpwh.gov.ph"
          linkLabel="dpwh.gov.ph"
          whyTitle="Why This Chart"
          whyText="Horizontal bar charts, sorted by count, are used here rather than a pie or donut because both fields have more than 5 categories — length comparisons stay accurate at any category count, while pie/donut slices become hard to distinguish past about five (Cleveland & McGill, 1984)."
          whyLinkHref="https://climbtheladder.com/what-to-use-instead-of-a-pie-chart-better-alternatives/"
          whyLinkLabel="Bar charts vs. pie charts"
          trigger="click"
        />
        <div className="overviewCardHead">
          <div className="overviewCardIcon" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff' }}>
            <TabIcon name="building" />
          </div>
          <div>
            <div className="overviewCardTitle">Access &amp; Transportation</div>
            <div className="overviewCardSub">How sitios connect to the rest of the municipality</div>
          </div>
        </div>
        <div className="accessGrid">
          <div>
            <div className="accessColTitle">Main access to the sitio</div>
            <div className="barChart">
              {accessRows.map((row, i) => (
                <AreaBarRow
                  key={row.label}
                  label={row.label}
                  count={row.count}
                  widthPct={pct(row.count, accessRows[0]?.count || 1)}
                  index={i}
                  total={stats.total}
                  color={ACCESS_COLORS[i % ACCESS_COLORS.length]}
                />
              ))}
            </div>
          </div>
          <div>
            <div className="accessColTitle">Common transportation modes</div>
            <div className="barChart">
              {transportRows.map((row, i) => (
                <AreaBarRow
                  key={row.label}
                  label={row.label}
                  count={row.count}
                  widthPct={pct(row.count, transportRows[0]?.count || 1)}
                  index={i}
                  total={stats.total}
                  color={TRANSPORT_COLORS[i % TRANSPORT_COLORS.length]}
                />
              ))}
            </div>
            <div className="accessColNote">Sitios may report more than one mode, so shares can add up to over 100%.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const AREA_CSS = `
  /* CornerTooltip needs a positioned ancestor — Overview only used it inside
     .selfReportedCard and .statCard, both already position:relative. Area
     uses it on .overviewCard / .sectionCard too, so make those relative
     globally (harmless — doesn't change layout, just tooltip anchoring). */
  .overviewCard, .sectionCard { position: relative; }

  .areaTopGrid { display: grid; grid-template-columns: 1fr 260px; gap: 16px; align-items: stretch; }
  .areaStatsCol { display: flex; flex-direction: column; gap: 16px; }
  .areaStatsCol .statCard { flex: 1; }

  .mapCanvasWrap { width: 100%; margin-top: 4px; position: relative; z-index: 0; isolation: isolate; }
  .mapCanvasWrap .leaflet-container {
    border-radius: 14px; border: 1px solid var(--border); font-family: inherit;
  }
  .mapCanvasWrap .leaflet-popup-content { font-size: 12.5px; line-height: 1.5; }
  .mapCanvasWrap .leaflet-popup-content strong { font-size: 13px; }

  .pinAlertRing {
    position: absolute; inset: 0; border-radius: 50%;
    opacity: 0.55; animation: pinAlertPulse 1.6s ease-out infinite; z-index: 1;
    pointer-events: none;
  }
  @keyframes pinAlertPulse {
    0% { transform: scale(0.5); opacity: 0.6; }
    70% { transform: scale(1.35); opacity: 0; }
    100% { transform: scale(1.35); opacity: 0; }
  }

  .mapLegend { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 16px; font-size: 12px; color: var(--text-secondary); align-items: center; }
  .mapLegendItem { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; }
  .mapLegendItem .dot { width: 9px; height: 9px; border-radius: 999px; display: inline-block; }
  .mapLegendNote { font-size: 11px; color: var(--text-muted); font-style: italic; }

  .accessGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .accessColTitle { font-size: 12.5px; font-weight: 700; color: var(--text-primary); margin-bottom: 10px; }
  .accessColNote { font-size: 11px; color: var(--text-muted); margin-top: 8px; font-style: italic; }

  @media (max-width: 1200px) {
    .accessGrid { grid-template-columns: 1fr; }
  }

  @media (max-width: 900px) {
    .areaTopGrid { grid-template-columns: 1fr; }
    .areaStatsCol { flex-direction: row; flex-wrap: wrap; }
    .areaStatsCol .statCard { flex: 1 1 45%; }
  }
`;