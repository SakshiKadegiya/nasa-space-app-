
import { useState } from "react";

import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import SiteTimePanel from "./components/SiteTimePanel";
import { ErrorNotice } from "./components/Notice";

import MissionOverview from "./pages/MissionOverview";
import SiteComparison from "./pages/SiteComparison";
import LightingTimeline from "./pages/LightingTimeline";
import Communications from "./pages/Communications";

import TerrainViewer from "./components/terrain/TerrainViewer";

import { useMissionData } from "./hooks/useMissionData";

export default function App() {
  const [activePage, setActivePage] = useState("overview");

  const {
    sites,
    selectedSite,
    siteId,
    setSiteId,
    datetime,
    setDatetime,
    geometry,
    comparison,
    health,
    loading,
    error,
    refresh,
  } = useMissionData();

  const renderPage = () => {
    switch (activePage) {
      case "overview":
        return (
          <MissionOverview
            selectedSite={selectedSite}
            geometry={geometry}
            error={error}
            loading={loading}
            comparison={comparison}
            datetime={datetime}
          />
        );

      case "comparison":
        return (
          <SiteComparison
            sites={sites}
            siteId={siteId}
            setSiteId={setSiteId}
            comparison={comparison}
            loading={loading}
          />
        );

      case "timeline":
        return (
          <LightingTimeline
            siteId={siteId}
            selectedSite={selectedSite}
            datetime={datetime}
          />
        );

      case "communications":
        return (
          <Communications
            selectedSite={selectedSite}
            geometry={geometry}
            comparison={comparison}
          />
        );

     case "terrain":
  return (
    <TerrainViewer
      siteId={siteId}
      datetime={datetime}
    />
  );

      default:
        return <MissionOverview
          selectedSite={selectedSite}
          geometry={geometry}
          error={error}
          loading={loading}
          comparison={comparison}
          datetime={datetime}
        />;
    }
  };

  return (
    <div className="app-shell">
      <TopBar apiStatus={health} />

      <div className="app-body">
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
        />

        <main className="main-content">
          <div className="main-inner">

            <SiteTimePanel
              sites={sites}
              siteId={siteId}
              onSiteChange={setSiteId}
              datetime={datetime}
              onDatetimeChange={setDatetime}
              onRefresh={refresh}
              loading={loading}
            />

            {activePage !== "overview" && activePage !== "terrain" && (
              <ErrorNotice message={error} />
            )}

            {renderPage()}

            <footer className="footer">
              <span>
                POLARVIEW · CLPS LUNAR MISSION BROWSER
              </span>

              <span>
                Decision support prototype · Not for operational mission use
              </span>
            </footer>

          </div>
        </main>
      </div>
    </div>
  );
}
