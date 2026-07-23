import TabIcon from './icons';

export default function MapsPanel() {
  return (
    <div className="panelEmpty">
      <div className="panelEmptyIcon"><TabIcon name="map" /></div>
      <div className="panelEmptyTitle">Maps</div>
      <div className="panelEmptySub">Geographic view of sitios goes here.</div>
    </div>
  );
}