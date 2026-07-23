import TabIcon from './icons';

const MOCK_ACTIVITY = [
  {
    id: 1,
    user: 'Bernard Aligagay',
    time: '2d ago',
    action: 'Login',
    category: 'System',
    detail: 'User logged in: bernard.aligagay@southcotabato.gov.ph',
  },
  {
    id: 2,
    user: 'Bernard Aligagay',
    time: '3d ago',
    action: 'Login',
    category: 'System',
    detail: 'User logged in: bernard.aligagay@southcotabato.gov.ph',
  },
  {
    id: 3,
    user: 'Bernard Aligagay',
    time: 'Jul 13, 04:58 PM',
    action: 'Login',
    category: 'System',
    detail: 'User logged in: bernard.aligagay@southcotabato.gov.ph',
  },
  {
    id: 4,
    user: 'Bernard Aligagay',
    time: 'Jul 3, 09:31 PM',
    action: 'Login',
    category: 'System',
    detail: 'User logged in: bernard.aligagay@southcotabato.gov.ph',
  },
  {
    id: 5,
    user: 'Bernard Aligagay',
    time: 'Jul 3, 09:31 PM',
    action: 'Logout',
    category: 'System',
    detail: 'User logged out: bernard.aligagay@southcotabato.gov.ph',
  },
];

const MOCK_OUTDATED_SITIOS = [
  {
    id: 1,
    name: 'Sitio Campo Uno',
    location: 'LITTLE BAGUIO, SURALLAH',
    lastUpdated: 'Last updated 2 years ago',
    critical: true,
  },
  {
    id: 2,
    name: 'Sitio Riverside',
    location: 'NEW CUYAPO, TANTANGAN',
    lastUpdated: 'Last updated Over 1 year ago',
    critical: false,
  },
  {
    id: 3,
    name: 'Sitio Mabuhay',
    location: 'CACUB, KORONADAL',
    lastUpdated: 'Last updated Over 1 year ago',
    critical: false,
  },
  {
    id: 4,
    name: 'Sitio Upper Hills',
    location: 'EL NONOK, BANGA',
    lastUpdated: 'Last updated Over 1 year ago',
    critical: false,
  },
  {
    id: 5,
    name: 'Sitio Lower Valley',
    location: 'NEW ILOILO, TANTANGAN',
    lastUpdated: 'Last updated Over 1 year ago',
    critical: false,
  },
];

function ActionBadge({ action }) {
  const isLogout = action === 'Logout';
  return (
    <span className="actActionBadge">
      <TabIcon name={isLogout ? 'logout' : 'login'} />
      {action}
    </span>
  );
}

function ActivityRow({ item, isFirst }) {
  return (
    <div className={`actRow${isFirst ? ' actRowHighlight' : ''}`}>
      <div className="actAvatar">
        <TabIcon name="user" />
      </div>
      <div className="actRowBody">
        <div className="actRowTop">
          <span className="actUser">{item.user}</span>
          <span className="actTime">{item.time}</span>
        </div>
        <div className="actBadges">
          <ActionBadge action={item.action} />
          <span className="actCategoryBadge">{item.category}</span>
        </div>
        <div className="actDetail">{item.detail}</div>
      </div>
    </div>
  );
}

function OutdatedSitioRow({ sitio }) {
  return (
    <div className="outRow">
      <div className="outIcon">
        <TabIcon name="alert-triangle" />
      </div>
      <div className="outRowBody">
        <div className="outName">{sitio.name}</div>
        <div className="outLocation">{sitio.location}</div>
        <div className="outBadges">
          <span className={`outUpdatedBadge${sitio.critical ? ' outUpdatedBadgeCritical' : ''}`}>
            {sitio.lastUpdated}
          </span>
          {sitio.critical && <span className="outCriticalTag">Critical</span>}
        </div>
      </div>
    </div>
  );
}

export default function ActivityPanel() {
  return (
    <div className="activityGrid">
      <div className="activityCard">
        <div className="activityCardHeader">
          <div className="outHeaderTitleGroup">
            <span className="actHeaderIcon">
              <TabIcon name="activity" />
            </span>
            <h3 className="activityCardTitle">Recent Activity</h3>
          </div>
          <button type="button" className="activityViewAll">
            View All <TabIcon name="arrow-right" />
          </button>
        </div>
        <div className="activityCardBody">
          {MOCK_ACTIVITY.map((item, i) => (
            <ActivityRow key={item.id} item={item} isFirst={i === 0} />
          ))}
        </div>
      </div>

      <div className="activityCard">
        <div className="activityCardHeader">
          <div className="outHeaderTitleGroup">
            <span className="outHeaderIcon">
              <TabIcon name="alert-triangle" />
            </span>
            <div>
              <h3 className="activityCardTitle">Outdated Sitios</h3>
              <p className="outHeaderSub">Sitios that haven't been updated recently</p>
            </div>
          </div>
          <span className="outCountPill">{MOCK_OUTDATED_SITIOS.length} sitios</span>
        </div>
        <div className="activityCardBody">
          {MOCK_OUTDATED_SITIOS.map((sitio) => (
            <OutdatedSitioRow key={sitio.id} sitio={sitio} />
          ))}
        </div>
        <div className="outViewAllWrap">
          <button type="button" className="outViewAll">
            View all outdated sitios <TabIcon name="external-link" />
          </button>
        </div>
      </div>

      <style>{`
        .activityGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .activityGrid { grid-template-columns: 1fr; }
        }
        .activityCard {
          background: #fff;
          border: 1px solid #e7e9ee;
          border-radius: 14px;
          padding: 20px;
        }
        .activityCardHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .activityCardTitle {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: #1a1d29;
        }
        .actHeaderIcon {
          color: #4a5160;
          margin-top: 2px;
        }
        .activityViewAll {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: #5b6472;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        }
        .activityViewAll:hover { color: #2c313a; }
        .activityCardBody {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        /* Recent Activity rows */
        .actRow {
          display: flex;
          gap: 12px;
          padding: 12px;
          border-radius: 10px;
        }
        .actRowHighlight { background: #f4f6f9; }
        .actAvatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #eef1f6;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #6b7280;
        }
        .actRowBody { flex: 1; min-width: 0; }
        .actRowTop {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .actUser { font-weight: 600; font-size: 14px; color: #1a1d29; }
        .actTime { font-size: 12px; color: #9aa1ac; }
        .actBadges {
          display: flex;
          gap: 6px;
          margin: 6px 0;
        }
        .actActionBadge, .actCategoryBadge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 500;
          padding: 3px 9px;
          border-radius: 20px;
          border: 1px solid #e2e5ea;
          color: #4a5160;
          background: #fff;
        }
        .actDetail { font-size: 12.5px; color: #8b929d; }

        /* Outdated Sitios */
        .outHeaderTitleGroup {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .outHeaderIcon {
          color: #e8862c;
          margin-top: 2px;
        }
        .outHeaderSub {
          margin: 2px 0 0;
          font-size: 12.5px;
          color: #9aa1ac;
        }
        .outCountPill {
          background: #f4f6f9;
          color: #4a5160;
          font-size: 12.5px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 20px;
          white-space: nowrap;
        }
        .outRow {
          display: flex;
          gap: 12px;
          padding: 14px;
          border-radius: 10px;
          background: #fafbfc;
          border: 1px solid #eef0f3;
          margin-bottom: 10px;
        }
        .outIcon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: #fdf1e4;
          color: #e8862c;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .outRowBody { flex: 1; min-width: 0; }
        .outName { font-weight: 700; font-size: 14px; color: #1a1d29; }
        .outLocation {
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: #9aa1ac;
          margin: 2px 0 8px;
        }
        .outBadges { display: flex; gap: 6px; flex-wrap: wrap; }
        .outUpdatedBadge {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          background: #f1f2f5;
          color: #4a5160;
        }
        .outUpdatedBadgeCritical {
          background: #e0362f;
          color: #fff;
        }
        .outCriticalTag {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          background: #fdeceb;
          color: #e0362f;
        }
        .outViewAllWrap {
          text-align: center;
          margin-top: 4px;
        }
        .outViewAll {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          font-size: 13.5px;
          font-weight: 600;
          color: #1a1d29;
          cursor: pointer;
        }
        .outViewAll:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}