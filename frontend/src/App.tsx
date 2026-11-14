import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createSavedAnalysis, getComparison, getSavedAnalyses, removeSavedAnalysis, type SavedAnalysis } from "./services/analysisApi";
import type { SiteAnalysis, TimelinePoint } from "./types/analysis";
import { TimeSeriesCurve } from "./components/TimeSeriesCurve";

const lunarTerrain =
  "https://images.unsplash.com/photo-1447433589675-4aaa569f3e05?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=90&w=1800";
const homeHeroTerrain =
  "https://images.unsplash.com/photo-1777276516321-e50733992e40?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=90&w=1800";

type IconName =
  | "home"
  | "analyze"
  | "explore"
  | "compare"
  | "save"
  | "settings"
  | "help"
  | "database"
  | "sun"
  | "earth"
  | "terrain"
  | "clock"
  | "chevron"
  | "reset"
  | "zoom"
  | "orbit"
  | "pan"
  | "calendar"
  | "pin"
  | "info";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const icons: Record<IconName, ReactNode> = {
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10M9 20v-6h6v6" />
      </>
    ),
    analyze: <path d="M3 12h4l2-6 4 13 3-7h5" />,
    explore: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15 9-2 4-4 2 2-4 4-2Z" />
      </>
    ),
    compare: (
      <>
        <path d="M8 7h11M16 4l3 3-3 3M16 17H5M8 14l-3 3 3 3" />
      </>
    ),
    save: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.7 9a2.4 2.4 0 1 1 3.4 2.2c-.8.4-1.1.9-1.1 1.8M12 17h.01" />
      </>
    ),
    database: (
      <>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2 12h2M20 12h2M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5" />
      </>
    ),
    earth: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3.5 9h5l2-3 3 1 1 3 5.5 1M7 17l2-3 4 1 1 5" />
      </>
    ),
    terrain: <path d="m3 20 7-13 4 7 2-3 5 9H3Z" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    reset: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
      </>
    ),
    zoom: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4M11 8v6M8 11h6" />
      </>
    ),
    orbit: (
      <>
        <circle cx="12" cy="12" r="3" />
        <ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-25 12 12)" />
      </>
    ),
    pan: (
      <>
        <path d="M12 2v20M2 12h20M12 2l-3 3M12 2l3 3M22 12l-3-3M22 12l-3 3M12 22l-3-3M12 22l3-3M2 12l3-3M2 12l3 3" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6M12 7h.01" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name]}
    </svg>
  );
}

const nav = [
  ["home", "Home"],
  ["analyze", "Analyze"],
  ["explore", "Explore Sites"],
  ["compare", "Compare Sites"],
  ["save", "Saved Analyses"],
] as const;

type Page = "home" | "select" | "define" | "analysis" | "explore" | "compare" | "saved";

type MissionConfig = {
  site: string;
  coordinates: string;
  month: number;
  startDay: number;
  endDay: number;
};

const siteCoordinates: Record<string, string> = {
  Haworth: "86.7680° S · 20.5140° W",
  "Malapert Massif": "85.9420° S · 0.9440° W",
  "Nobile Rim 1": "85.2950° S · 36.9170° E",
  "de Gerlache Rim 2": "88.3890° S · 68.8650° W",
  "Compare All Sites": "Synchronized candidate set",
};

const pageForNav: Record<string, Page> = {
  Home: "home",
  Analyze: "select",
  "Explore Sites": "explore",
  "Compare Sites": "compare",
  "Saved Analyses": "saved",
};

function Sidebar({ active, navigate }: { active: string; navigate: (page: Page) => void }) {
  return (
    <aside className="sidebar">
      <button className="side-brand" onClick={() => navigate("home")} aria-label="SELENIX — Home">
        <img className="selenix-sidebar-logo" src="/selenix-logo.webp" alt="SELENIX — Where to land. When to go." />
        <span className="brand-orbit selenix-mobile-brand" aria-hidden="true"><i /></span>
      </button>
      <nav>
        {nav.map(([icon, label]) => (
          <button
            className={label === active ? "active" : ""}
            key={label}
            onClick={() => navigate(pageForNav[label])}
          >
            <Icon name={icon} size={17} />
            <span>{label}</span>
            {label === active && <i />}
          </button>
        ))}
      </nav>
      <div className="side-bottom">
        <button>
          <Icon name="settings" size={17} /> Settings
        </button>
        <button>
          <Icon name="help" size={17} /> Help
        </button>
        <div className="system-state">
          <span>
            <i /> SYSTEMS NOMINAL
          </span>
          <small>DATA SYNC · 12:00 UTC</small>
        </div>
      </div>
    </aside>
  );
}

function ProductHeader({
  profileOpen,
  setProfileOpen,
}: {
  profileOpen: boolean;
  setProfileOpen: (open: boolean) => void;
}) {
  return (
    <header className="product-header">
      <div>
        <span>
          <i /> PUBLIC DATA ONLINE
        </span>
        <strong>South Pole Operations</strong>
      </div>
      <div className="product-account">
        <div className="public-data">
          <Icon name="database" size={15} />
          <span>
            <small>DATA ATTRIBUTION</small>Powered by NASA Public Data
          </span>
        </div>
        <i className="account-separator" />
        <button className="profile" onClick={() => setProfileOpen(!profileOpen)}>
          <span>NN</span>
          <div>
            <strong>Nada Nasser</strong>
            <small>Mission Planner</small>
          </div>
          <Icon name="chevron" size={14} />
        </button>
        {profileOpen && (
          <div className="account-menu">
            <strong>Nada Nasser</strong>
            <small>MISSION PLANNER · ACTIVE</small>
            <button>Account settings</button>
            <button>Data preferences</button>
            <button>Sign out</button>
          </div>
        )}
      </div>
    </header>
  );
}

const homeSites = [
  {
    name: "Haworth",
    region: "South Pole Region",
    coords: siteCoordinates.Haworth,
    sun: "N/A",
    earth: "N/A",
  },
  {
    name: "Malapert Massif",
    region: "Near-side ridge",
    coords: siteCoordinates["Malapert Massif"],
    sun: "N/A",
    earth: "N/A",
  },
  {
    name: "Nobile Rim 1",
    region: "Nobile crater",
    coords: siteCoordinates["Nobile Rim 1"],
    sun: "N/A",
    earth: "N/A",
  },
  {
    name: "de Gerlache Rim 2",
    region: "South Pole Region",
    coords: siteCoordinates["de Gerlache Rim 2"],
    sun: "N/A",
    earth: "N/A",
  },
];

function useSitePreviews() {
  const [previewSites, setPreviewSites] = useState<SiteAnalysis[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    getComparison("2028-01-01", 7, controller.signal)
      .then(response => setPreviewSites(response.sites))
      .catch(() => { /* N/A when API is offline, never show invented values. */ });
    return () => controller.abort();
  }, []);
  return previewSites;
}


function useSavedPreviews() {
  const [items, setItems] = useState<SavedAnalysis[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    getSavedAnalyses(controller.signal).then(setItems).catch(() => { /* Saved list handles API errors separately. */ });
    return () => controller.abort();
  }, []);
  return items;
}

function HomeDashboard({ navigate }: { navigate: (page: Page) => void }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState("");
  const previewSites = useSitePreviews();
  const recentSaved = useSavedPreviews();
  return (
    <div className="mission-app">
      <Sidebar active="Home" navigate={navigate} />
      <main className="home-main">
        <ProductHeader profileOpen={profileOpen} setProfileOpen={setProfileOpen} />
        <div className="home-content">
          <section className="home-hero">
            <div className="home-copy">
              <img className="selenix-home-logo" src="/selenix-logo.webp" alt="SELENIX — Where to land. When to go." />
              <small className="section-kicker">SOUTH POLE OPERATIONS</small>
              <h1>
                Lunar Landing
                <br />
                Site Navigator
              </h1>
              <p>
                Explore, analyze, and compare illumination, Earth visibility, and terrain conditions
                across candidate lunar south pole landing sites.
              </p>
              <div className="home-workflow">
                {["SELECT", "DEFINE DATE", "ANALYZE", "COMPARE", "DECIDE"].map((step, index) => (
                  <span key={step}>
                    <b className={index === 0 ? "active" : ""}>{step}</b>
                    {index < 4 && <i>→</i>}
                  </span>
                ))}
              </div>
              <div className="hero-actions">
                <button className="glass-action primary" onClick={() => navigate("select")}>
                  New Analysis <Icon name="chevron" size={14} />
                </button>
                <button className="glass-action" onClick={() => navigate("explore")}>
                  Explore Landing Sites <Icon name="explore" size={14} />
                </button>
              </div>
            </div>
            <button className="terrain-preview" onClick={() => navigate("explore")}>
              <img src={homeHeroTerrain} alt="Shadowed crater terrain near the lunar south pole" />
            </button>
          </section>

          <div className="home-dashboard-grid">
            <div>
              <section className="home-section">
                <div className="home-section-title">
                  <div>
                    <small>MISSION WORKFLOWS</small>
                    <h2>Quick Start</h2>
                  </div>
                  <span>Choose an operation</span>
                </div>
                <div className="quick-grid">
                  <button
                    className={`quick-card ${selectedCard === "new" ? "selected" : ""}`}
                    onMouseDown={() => setSelectedCard("new")}
                    onClick={() => navigate("select")}
                  >
                    <span className="quick-icon">
                      <Icon name="analyze" size={20} />
                    </span>
                    <small>01 · SITE ANALYSIS</small>
                    <h3>New Analysis</h3>
                    <p>
                      Start a new landing-site analysis by selecting a candidate site and mission
                      period.
                    </p>
                    <b>
                      Start Analysis <Icon name="chevron" size={13} />
                    </b>
                  </button>
                  <button
                    className={`quick-card window ${selectedCard === "window" ? "selected" : ""}`}
                    onMouseDown={() => setSelectedCard("window")}
                    onClick={() => navigate("define")}
                  >
                    <span className="quick-icon">
                      <Icon name="clock" size={20} />
                    </span>
                    <small>02 · WINDOW SEARCH</small>
                    <h3>Find Best Window</h3>
                    <p>
                      Search available mission periods and identify the strongest operational
                      window.
                    </p>
                    <div className="mini-indicators">
                      <span>
                        <Icon name="sun" size={12} /> Solar
                      </span>
                      <span>
                        <Icon name="earth" size={12} /> Earth
                      </span>
                      <span>
                        <Icon name="terrain" size={12} /> Terrain
                      </span>
                    </div>
                    <b>
                      Find Window <Icon name="chevron" size={13} />
                    </b>
                  </button>
                  <button
                    className={`quick-card compare ${selectedCard === "compare" ? "selected" : ""}`}
                    onMouseDown={() => setSelectedCard("compare")}
                    onClick={() => navigate("compare")}
                  >
                    <span className="quick-icon">
                      <Icon name="compare" size={20} />
                    </span>
                    <small>03 · SITE COMPARISON</small>
                    <h3>Compare Sites</h3>
                    <p>
                      Compare all available candidate landing sites using synchronized mission
                      conditions.
                    </p>
                    <b>
                      Compare Sites <Icon name="chevron" size={13} />
                    </b>
                  </button>
                </div>
              </section>

              <section className="home-section">
                <div className="home-section-title">
                  <div>
                    <small>RECENT WORK</small>
                    <h2>Recent Analyses</h2>
                  </div>
                  <button onClick={() => navigate("saved")}>
                    View all analyses <Icon name="chevron" size={13} />
                  </button>
                </div>
                <div className="recent-grid">
                  {recentSaved.length === 0 && (
                    <div className="saved-empty-small">
                      No analyses saved yet. Select a site, run an analysis, and press “Save Analysis”.
                    </div>
                  )}
                  {recentSaved.slice(0, 3).map((item) => (
                    <button className="recent-card" key={item.id} onClick={() => navigate("saved")}>
                      <div className="recent-top"><span>ANL-{item.id}</span><b>SAVED</b></div>
                      <h3>{item.title}</h3>
                      <p><Icon name="pin" size={11} /> {item.site_name}</p>
                      <div className="analysis-window"><small>ANALYSIS WINDOW</small><strong>{item.start_date} · {item.days} days UTC</strong></div>
                      <div className="recent-metrics">
                        <span><Icon name="sun" size={12} /><small>Solar</small><b>{item.solar_percent.toFixed(1)}%</b></span>
                        <span><Icon name="earth" size={12} /><small>Earth</small><b>{item.earth_percent.toFixed(1)}%</b></span>
                        <span><i /><small>Combined</small><b>{item.combined_percent.toFixed(1)}%</b></span>
                      </div>
                      <em>View saved analyses <Icon name="chevron" size={12} /></em>
                    </button>
                  ))}
                </div>
              </section>

              <section className="home-section saved-sites-section">
                <div className="home-section-title">
                  <div>
                    <small>CANDIDATE LOCATIONS</small>
                    <h2>Candidate Sites</h2><small>JAN 01–07, 2028 · SAMPLE</small>
                  </div>
                  <button onClick={() => navigate("explore")}>
                    View all sites <Icon name="chevron" size={13} />
                  </button>
                </div>
                <div className="home-saved-grid">
                  {homeSites.slice(0, 3).map((site, index) => (
                    <button
                      className="home-site-card"
                      key={site.name}
                      onClick={() => navigate("explore")}
                    >
                      <img
                        src={lunarTerrain}
                        alt={`${site.name} lunar terrain`}
                        style={{ objectPosition: `${25 + index * 30}% ${35 + index * 17}%` }}
                      />
                      <div>
                        <h3>{site.name}</h3>
                        <p>{site.region}</p>
                        <small>{site.coords}</small>
                        <span>
                          <b>
                            <Icon name="sun" size={11} /> {previewSites.find(item => item.name === site.name)?.solar ?? "N/A"}{previewSites.some(item => item.name === site.name) ? "%" : ""}
                          </b>
                          <b>
                            <Icon name="earth" size={11} /> {previewSites.find(item => item.name === site.name)?.earth ?? "N/A"}{previewSites.some(item => item.name === site.name) ? "%" : ""}
                          </b>
                          <b className="terrain-low">LOLA</b>
                        </span>
                      </div>
                      <em>
                        Explore Site <Icon name="chevron" size={12} />
                      </em>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
          <footer>
            DATA: NASA LRO / LROC · LOLA · JPL HORIZONS <span>Public data attribution</span>
            <span>SELENIX · WHERE TO LAND. WHEN TO GO.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

const monthNames = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

function DefinePeriodPage({
  navigate,
  missionConfig,
  setMissionConfig,
}: {
  navigate: (page: Page) => void;
  missionConfig: MissionConfig;
  setMissionConfig: (config: MissionConfig) => void;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [mode, setMode] = useState<"specific" | "best">("specific");
  const [month, setMonth] = useState(missionConfig.month);
  const [startDay, setStartDay] = useState<number | null>(missionConfig.startDay);
  const [endDay, setEndDay] = useState<number | null>(missionConfig.endDay);
  const [criteria, setCriteria] = useState(["solar", "earth", "terrain", "combined"]);
  const [searchScope, setSearchScope] = useState("Selected Site");
  const [recommended, setRecommended] = useState(false);
  const daysInMonth = new Date(2028, month + 1, 0).getDate();
  const firstWeekday = new Date(2028, month, 1).getDay();
  const validSpecific = startDay !== null && endDay !== null;
  const canContinue = mode === "specific" ? validSpecific : false;

  const selectDate = (day: number) => {
    if (day > 7) return;
    if (startDay === null || endDay !== null) {
      setStartDay(day);
      setEndDay(null);
      return;
    }
    setEndDay(Math.max(startDay, day));
    setStartDay(Math.min(startDay, day));
  };

  const toggleCriterion = (criterion: string) => {
    setCriteria((items) =>
      items.includes(criterion)
        ? items.length > 1
          ? items.filter((item) => item !== criterion)
          : items
        : [...items, criterion],
    );
    setRecommended(false);
  };

  const formattedDate = (day: number | null) =>
    day ? `${monthNames[month].slice(0, 3)} ${String(day).padStart(2, "0")}, 2028` : "NOT SELECTED";

  return (
    <div className="mission-app">
      <Sidebar active="Analyze" navigate={navigate} />
      <main className="home-main">
        <ProductHeader profileOpen={profileOpen} setProfileOpen={setProfileOpen} />
        <div className="flow-content period-page">
          <div className="flow-breadcrumb">
            <button onClick={() => navigate("home")}>Home</button>
            <span>/</span>
            <button onClick={() => navigate("select")}>New Analysis</button>
            <span>/</span>
            <strong>Define Mission Period</strong>
          </div>
          <div className="flow-workflow">
            {["SELECT", "DEFINE DATE", "ANALYZE", "COMPARE", "DECIDE"].map((step) => (
              <span className={step === "DEFINE DATE" ? "active" : ""} key={step}>
                {step}
              </span>
            ))}
          </div>
          <header>
            <small>NEW ANALYSIS · STEP 02</small>
            <h1>Define Mission Period</h1>
            <p>
              Select a mission analysis period or let SELENIX identify the strongest available
              operational window.
            </p>
          </header>

          <section className="period-modes">
            <button
              className={mode === "specific" ? "selected" : ""}
              onClick={() => setMode("specific")}
            >
              <span className="mode-index">MODE 01</span>
              <span className="mode-icon">
                <Icon name="calendar" size={19} />
              </span>
              <div>
                <h2>Specific Period</h2>
                <p>Select a custom analysis start and end date.</p>
              </div>
              <i>{mode === "specific" ? "✓" : ""}</i>
            </button>
            <button className={mode === "best" ? "selected" : ""} onClick={() => setMode("best")}>
              <span className="mode-index">MODE 02</span>
              <span className="mode-icon">
                <Icon name="analyze" size={19} />
              </span>
              <div>
                <h2>Find Best Period</h2>
                <p>
                  Let SELENIX evaluate available dates and recommend the strongest operational
                  window.
                </p>
              </div>
              <i>{mode === "best" ? "✓" : ""}</i>
            </button>
          </section>

          {mode === "specific" ? (
            <section className="calendar-layout">
              <article className="calendar-card">
                <div className="calendar-toolbar">
                  <div className="month-title">
                    <label>
                      <small>MONTH</small>
                      <select
                        value={month}
                        onChange={(event) => {
                          setMonth(Number(event.target.value));
                          setStartDay(1);
                          setEndDay(7);
                          setRecommended(false);
                        }}
                        aria-label="Analysis month"
                      >
                        {monthNames.map((name, index) => (
                          <option value={index} key={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <small>YEAR</small>
                      <select value="2028" aria-label="Analysis year">
                        <option>2028</option>
                      </select>
                    </label>
                  </div>
                </div>
                <div className="calendar-availability">
                  <i /> PROTOTYPE ANALYSIS WINDOWS AVAILABLE · FIRST 7 DAYS OF EACH MONTH
                </div>
                <div className="calendar-weekdays">
                  {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                <div className="calendar-grid">
                  {Array.from({ length: firstWeekday }).map((_, index) => (
                    <span className="empty" key={`empty-${index}`} />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
                    const available = day <= 7;
                    const isStart = day === startDay;
                    const isEnd = day === endDay;
                    const inRange =
                      startDay !== null && endDay !== null && day > startDay && day < endDay;
                    return (
                      <button
                        disabled={!available}
                        className={`${isStart ? "range-start" : ""} ${isEnd ? "range-end" : ""} ${inRange ? "in-range" : ""}`}
                        onClick={() => selectDate(day)}
                        key={day}
                      >
                        <span>{String(day).padStart(2, "0")}</span>
                        {available && <i />}
                      </button>
                    );
                  })}
                </div>
              </article>

              <aside className="period-summary">
                <div className="period-summary-heading">
                  <span>
                    <Icon name="calendar" size={18} />
                  </span>
                  <div>
                    <small>MISSION CONFIGURATION</small>
                    <h2>Selected Analysis Window</h2>
                  </div>
                </div>
                <div className="date-selection-status">
                  <span className={startDay ? "complete" : ""}>
                    <i>1</i>
                    <div>
                      <small>Start</small>
                      <strong>{formattedDate(startDay)}</strong>
                    </div>
                  </span>
                  <b />
                  <span className={endDay ? "complete" : ""}>
                    <i>2</i>
                    <div>
                      <small>End</small>
                      <strong>{formattedDate(endDay)}</strong>
                    </div>
                  </span>
                </div>
                <div className="period-facts">
                  <span>
                    <small>Duration</small>
                    <strong>
                      {startDay && endDay ? endDay - startDay + 1 : "—"} <b>DAYS</b>
                    </strong>
                  </span>
                  <span>
                    <small>Time Reference</small>
                    <strong>UTC</strong>
                  </span>
                  <span>
                    <small>Available Window</small>
                    <strong>01–07</strong>
                  </span>
                </div>
                <p>
                  Select the start date first, then choose an end date within the available
                  seven-day prototype window.
                </p>
              </aside>
            </section>
          ) : (
            <section className="period-search-card">
              <div className="search-config">
                <div className="search-config-heading">
                  <span>
                    <Icon name="analyze" size={21} />
                  </span>
                  <div>
                    <small>AUTOMATED WINDOW EVALUATION</small>
                    <h2>Search Available Windows</h2>
                    <p>
                      SELENIX will compare the available 2028 analysis windows and identify the
                      strongest period based on the selected mission conditions.
                    </p>
                  </div>
                </div>
                <div className="search-parameters">
                  <span>
                    <small>Search Range</small>
                    <strong>JAN–DEC 2028</strong>
                  </span>
                  <span>
                    <small>Available Analysis Windows</small>
                    <strong>12 MONTHLY WINDOWS</strong>
                  </span>
                  <span>
                    <small>Mission Site</small>
                    <select
                      value={searchScope}
                      onChange={(event) => {
                        setSearchScope(event.target.value);
                        setRecommended(false);
                      }}
                      aria-label="Mission site search scope"
                    >
                      <option>Selected Site</option>
                      <option>All Candidate Sites</option>
                    </select>
                  </span>
                </div>
                <div className="criteria-heading">
                  <small>SEARCH CRITERIA</small>
                  <span>{criteria.length} / 4 ACTIVE</span>
                </div>
                <div className="search-criteria">
                  {[
                    ["solar", "sun", "Solar Availability"],
                    ["earth", "earth", "Earth Visibility"],
                    ["terrain", "terrain", "Terrain Horizon"],
                    ["combined", "analyze", "Combined Operational Window"],
                  ].map(([id, icon, label]) => (
                    <button
                      className={criteria.includes(id) ? "selected" : ""}
                      onClick={() => toggleCriterion(id)}
                      key={id}
                    >
                      <span>
                        <Icon name={icon as IconName} size={17} />
                      </span>
                      {label}
                      <i>{criteria.includes(id) ? "✓" : ""}</i>
                    </button>
                  ))}
                </div>
                <button className="find-period-action" disabled title="A verified multi-month solar-only search is not implemented yet">
                  Automatic Window Search — Not Available <Icon name="info" size={14} />
                </button>
              </div>
              <aside className="search-result">
                {false ? (
                  <>
                    <span className="result-check">✓</span>
                    <small>RECOMMENDED WINDOW</small>
                    <h2>MAR 01–07, 2028</h2>
                    <p>Strongest balanced conditions across the available prototype windows.</p>
                    <div>
                      <span>
                        <Icon name="sun" size={13} /> <b>84.6%</b>
                      </span>
                      <span>
                        <Icon name="earth" size={13} /> <b>91.2%</b>
                      </span>
                      <span>
                        <Icon name="terrain" size={13} /> <b>LOW</b>
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="search-placeholder-icon">
                      <Icon name="clock" size={24} />
                    </span>
                    <small>SEARCH RESULT</small>
                    <h2>Awaiting Evaluation</h2>
                    <p>Configure the search criteria and run the available-window analysis.</p>
                  </>
                )}
              </aside>
            </section>
          )}

          <div className="period-actions">
            <button onClick={() => navigate("select")}>← Back</button>
            <div>
              {!canContinue && (
                <span>
                  {mode === "best" ? "Run window search to continue" : "Select a valid date range"}
                </span>
              )}
              <button
                disabled={!canContinue}
                className="glass-action primary"
                onClick={() => {
                  setMissionConfig({
                    ...missionConfig,
                    month: recommended ? 2 : month,
                    startDay: recommended ? 1 : (startDay ?? 1),
                    endDay: recommended ? 7 : (endDay ?? 7),
                  });
                  navigate("analysis");
                }}
              >
                Run Analysis <Icon name="analyze" size={14} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function FlowPage({
  page,
  navigate,
  missionConfig,
  setMissionConfig,
}: {
  page: Page;
  navigate: (page: Page) => void;
  missionConfig: MissionConfig;
  setMissionConfig: (config: MissionConfig) => void;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [selected, setSelected] = useState(page === "select" ? missionConfig.site : "Haworth");
  const configs: Record<
    string,
    {
      eyebrow: string;
      title: string;
      subtitle: string;
      options: string[];
      next?: Page;
      action?: string;
    }
  > = {
    select: {
      eyebrow: "NEW ANALYSIS · STEP 01",
      title: "Select Landing Site",
      subtitle: "Choose a candidate location or compare all available sites.",
      options: [
        "Haworth",
        "Malapert Massif",
        "Nobile Rim 1",
        "de Gerlache Rim 2",
        "Compare All Sites",
      ],
      next: "define",
      action: "Continue to Mission Period",
    },
    compare: {
      eyebrow: "SYNCHRONIZED CONDITIONS",
      title: "Site Comparison",
      subtitle: "Compare candidate locations using the same mission window and priorities.",
      options: [
        "Haworth · Score N/A",
        "Malapert Massif · Score N/A",
        "Nobile Rim 1 · Score N/A",
        "de Gerlache Rim 2 · Score N/A",
      ],
      next: "select",
      action: "Start Comparative Analysis",
    },
    saved: {
      eyebrow: "MISSION ARCHIVE",
      title: "Saved Analyses",
      subtitle: "Return to saved missions, reports, and candidate assessments.",
      options: ["Haworth Solar Study", "Nobile Rim Analysis", "Malapert Communication Study"],
      next: "analysis",
      action: "Open Selected Analysis",
    },
  };
  if (page === "explore") return <ExplorePage navigate={navigate} />;
  const config = configs[page] ?? configs.select;
  return (
    <div className="mission-app">
      <Sidebar
        active={
          page === "compare" ? "Compare Sites" : page === "saved" ? "Saved Analyses" : "Analyze"
        }
        navigate={navigate}
      />
      <main className="home-main">
        <ProductHeader profileOpen={profileOpen} setProfileOpen={setProfileOpen} />
        <div className="flow-content">
          <div className="flow-breadcrumb">
            <button onClick={() => navigate("home")}>Home</button>
            <span>/</span>
            <strong>{config.title}</strong>
          </div>
          <div className="flow-workflow">
            {["SELECT", "DEFINE DATE", "ANALYZE", "COMPARE", "DECIDE"].map((step) => (
              <span className={page === "select" && step === "SELECT" ? "active" : ""} key={step}>
                {step}
              </span>
            ))}
          </div>
          <header>
            <small>{config.eyebrow}</small>
            <h1>{config.title}</h1>
            <p>{config.subtitle}</p>
          </header>
          <section className={`flow-options ${page}`}>
            {config.options.map((option, index) => (
              <button
                className={
                  selected === option || (index === 0 && !config.options.includes(selected))
                    ? "selected"
                    : ""
                }
                onClick={() => {
                  setSelected(option);
                  if (page === "select") {
                    setMissionConfig({
                      ...missionConfig,
                      site: option,
                      coordinates: siteCoordinates[option],
                    });
                  }
                }}
                key={option}
              >
                {page === "select" && index < 4 ? (
                  <img src={lunarTerrain} alt={`${option} terrain`} />
                ) : (
                  <span className="option-symbol">
                    <Icon
                      name={page === "compare" ? "compare" : page === "saved" ? "save" : "clock"}
                      size={20}
                    />
                  </span>
                )}
                <div>
                  <small>{String(index + 1).padStart(2, "0")}</small>
                  <h3>{option}</h3>
                  <p>
                    {page === "select"
                      ? index === 4
                        ? "Evaluate every candidate using synchronized conditions."
                        : "South Pole Candidate Region"
                      : "Scientific mission configuration"}
                  </p>
                </div>
                <i>{selected === option ? "✓" : "→"}</i>
              </button>
            ))}
          </section>
          <div className="flow-actions">
            <button onClick={() => navigate("home")}>Back to Home</button>
            <button
              className="glass-action primary"
              onClick={() => navigate(page === "select" && missionConfig.site === "Compare All Sites" ? "compare" : (config.next ?? "analysis"))}
            >
              {config.action} <Icon name="chevron" size={14} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function ExplorePage({ navigate }: { navigate: (page: Page) => void }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [site, setSite] = useState("Haworth");
  const previewSites = useSitePreviews();
  const preview = previewSites.find(item => item.name === site);
  return (
    <div className="mission-app">
      <Sidebar active="Explore Sites" navigate={navigate} />
      <main className="home-main">
        <ProductHeader profileOpen={profileOpen} setProfileOpen={setProfileOpen} />
        <div className="flow-content explore-content">
          <header>
            <small>ANNOTATED LUNAR REGION OVERVIEW</small>
            <h1>Explore Landing Sites</h1>
            <p>
              Inspect the annotated south-pole map, select a study site, and review illumination and Earth line-of-sight.
            </p>
          </header>
          <div className="explore-layout">
            <section className="explore-map-panel" aria-label="Lunar south pole region overview and site selection">
              <div className="explore-map">
                <img
                  className="explore-reference-image"
                  src="/lunar-south-pole-regions.webp"
                  alt="Annotated lunar south pole overview showing Haworth, Malapert Massif, de Gerlache Rim 2, Nobile Rim 2 and the lunar south pole"
                />
                <span className="explore-map-eyebrow"><Icon name="pin" size={13} /> SOUTH POLE REGION · REFERENCE OVERVIEW</span>
                <div className="map-readout">ANNOTATED REFERENCE IMAGE · NOT A GEOREFERENCED MAP</div>
              </div>
              <div className="explore-site-picker">
                <small>CHOOSE A SITE TO INSPECT</small>
                <div className="explore-site-buttons">
                  {homeSites.map((item) => (
                    <button
                      type="button"
                      className={site === item.name ? "active" : ""}
                      aria-pressed={site === item.name}
                      key={item.name}
                      onClick={() => setSite(item.name)}
                    >
                      <span className="explore-site-dot" aria-hidden="true" />
                      {item.name}
                    </button>
                  ))}
                </div>
                <p className="explore-map-note">
                  The reference image labels Nobile Rim 2; the analysis dataset covers Nobile Rim 1. They are different candidate locations.
                </p>
              </div>
            </section>
            <aside>
              <small>SELECTED CANDIDATE</small>
              <h2>{site}</h2>
              <p>{homeSites.find((s) => s.name === site)?.coords}</p>
              <small>JAN 01–07, 2028 · HOURLY SAMPLE</small>
              <div>
                <span>
                  <Icon name="sun" size={15} /> Solar <b>{preview ? `${preview.solar}%` : "N/A"}</b>
                </span>
                <span>
                  <Icon name="earth" size={15} /> Earth <b>{preview?.earth == null ? "N/A" : `${preview.earth}%`}</b>
                </span>
                <span>
                  <Icon name="terrain" size={15} /> Terrain <b>Local LOLA</b>
                </span>
              </div>
              <button className="glass-action primary" onClick={() => navigate("select")}>
                Analyze This Site <Icon name="chevron" size={14} />
              </button>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

const comparisonSiteOptions = [
  { id: "haworth", name: "Haworth" },
  { id: "malapert", name: "Malapert Massif" },
  { id: "nobile", name: "Nobile Rim 1" },
  { id: "gerlache", name: "de Gerlache Rim 2" },
];

function ComparisonMetric({
  type,
  value,
  window,
  compact,
  expanded,
  onClick,
  site,
}: {
  type: "solar" | "earth" | "combined" | "terrain";
  site: SiteAnalysis;
  value: string;
  window: string;
  compact: boolean;
  expanded: boolean;
  onClick: () => void;
}) {
  const config = {
    solar: {
      icon: "sun" as IconName,
      title: "Solar Availability",
      color: "#FFD84D",
      label: "Average Elevation",
      secondary: "Maximum Elevation",
      a: site.solarAverageElevation == null ? "N/A" : `${site.solarAverageElevation}°`,
      b: site.solarMaximumElevation == null ? "N/A" : `${site.solarMaximumElevation}°`,
    },
    earth: {
      icon: "earth" as IconName,
      title: "Earth Visibility",
      color: "#32C7FF",
      label: "Average Elevation",
      secondary: "Maximum Elevation",
      a: site.earthAverageElevation == null ? "N/A" : `${site.earthAverageElevation}°`,
      b: site.earthMaximumElevation == null ? "N/A" : `${site.earthMaximumElevation}°`,
    },
    combined: {
      icon: "analyze" as IconName,
      title: "Combined Window",
      color: "#35E27A",
      label: "Best Continuous Window",
      secondary: "Longest Duration",
      a: site.jointWindowStart ? new Date(site.jointWindowStart).toLocaleString("en-GB", { month: "short", day: "2-digit", hour: "2-digit", timeZone: "UTC", hour12: false }) + " UTC" : "No joint interval",
      b: window,
    },
    terrain: {
      icon: "terrain" as IconName,
      title: "Local Terrain Horizon",
      color: "#8FA1B5",
      label: "Maximum Horizon",
      secondary: "Average Obstruction",
      a: `${site.obstruction}°`,
      b: window,
    },
  }[type];
  return (
    <button className={`comparison-metric ${type} ${expanded ? "expanded" : ""}`} onClick={onClick}>
      <div className="comparison-metric-title">
        <span style={{ color: config.color }}>
          <Icon name={config.icon} size={14} />
        </span>
        <small>{config.title}</small>
        <i>{compact ? "+" : "›"}</i>
      </div>
      <strong style={{ color: config.color }}>{value}</strong>
      {type === "terrain" ? (
        <div className="terrain-placeholder">LOLA-derived local horizon · 10 km maximum range</div>
      ) : (
        <TimeSeriesCurve
          points={site.points}
          color={config.color}
          valueKey={type === "solar" ? "solarElevation" : type === "earth" ? "earthElevation" : "combinedVisible"}
        />
      )}
      <div className="metric-support">
        <span>
          <small>{config.label}</small>
          <b>{config.a}</b>
        </span>
        <span>
          <small>{config.secondary}</small>
          <b>{config.b}</b>
        </span>
      </div>
    </button>
  );
}

function CompareDashboard({ navigate }: { navigate: (page: Page) => void }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(["haworth", "malapert"]);
  const [viewMode, setViewMode] = useState<"data" | "map" | "3d">("data");
  const [timeline, setTimeline] = useState(39);
  const [expanded, setExpanded] = useState("");
  const [startDate, setStartDate] = useState("2028-01-01");
  const [comparisonSites, setComparisonSites] = useState<SiteAnalysis[]>([]);
  const [apiStatus, setApiStatus] = useState<"loading" | "ready" | "error">("loading");
  const [apiError, setApiError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setApiStatus("loading");
    getComparison(startDate, 7, controller.signal).then(response => {
      setComparisonSites(response.sites);
      setApiStatus("ready");
    }).catch(error => {
      if (controller.signal.aborted) return;
      setApiStatus("error");
      setApiError(error instanceof Error ? error.message : "Unknown API error");
    });
    return () => controller.abort();
  }, [startDate, retry]);
  const selected = comparisonSites.filter((site) => selectedIds.includes(site.id));
  const best = [...selected].sort((a, b) => b.solar - a.solar)[0];
  const bestSolar = [...selected].sort((a, b) => b.solar - a.solar)[0];
  const bestEarth = [...selected].sort((a, b) => (b.earth ?? -1) - (a.earth ?? -1))[0];
  const bestCombined = [...selected].sort((a, b) => (b.combined ?? -1) - (a.combined ?? -1))[0];
  const timelineIndex = (points: TimelinePoint[]) => Math.min(points.length - 1, Math.round(timeline / 100 * (points.length - 1)));
  const totalHours = Math.round((timeline / 100) * 167);
  const hour = totalHours % 24;
  const currentDate = new Date(`${startDate}T00:00:00Z`);
  currentDate.setUTCHours(currentDate.getUTCHours() + totalHours);
  const compareTime = `${currentDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" }).toUpperCase()} · ${String(currentDate.getUTCHours()).padStart(2, "0")}:00 UTC`;

  const toggleSite = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 2) setSelectedIds((ids) => ids.filter((item) => item !== id));
    } else if (selectedIds.length < 4) {
      setSelectedIds((ids) => [...ids, id]);
    }
  };

  if (apiStatus !== "ready" || selected.length === 0) {
    return <div className="mission-app"><Sidebar active="Compare Sites" navigate={navigate} />
      <main className="home-main compare-main"><div className="compare-content">
        <h1>Site Comparison</h1>
        <section className="comparison-conditions" style={{ marginTop: 24, display: "block" }}>
          <strong>{apiStatus === "loading" ? "Calculating comparison..." : "Cannot reach analysis API"}</strong>
          {apiStatus === "error" && <><p style={{ margin: "12px 0", color: "#f7ab83" }}>{apiError}. Start the Python backend on port 8000.</p><button onClick={() => setRetry(i => i + 1)}>Retry</button></>}
        </section>
      </div></main></div>;
  }
  return (
    <div className="mission-app">
      <Sidebar active="Compare Sites" navigate={navigate} />
      <main className="home-main compare-main">
        <ProductHeader profileOpen={profileOpen} setProfileOpen={setProfileOpen} />
        <div className="compare-content">
          <header className="compare-heading">
            <div>
              <div className="flow-breadcrumb">
                <span>Compare Sites</span>
                <b>›</b>
                <strong>Mission Comparison</strong>
              </div>
              <h1>Site Comparison</h1>
              <p>
                Compare illumination, Earth visibility, terrain horizon, and operational conditions
                across candidate lunar landing sites.
              </p>
            </div>
            <div className="view-toggle">
              {(["data", "map", "3d"] as const).map((mode) => (
                <button
                  className={viewMode === mode ? "active" : ""}
                  onClick={() => setViewMode(mode)}
                  key={mode}
                >
                  {mode === "3d" ? "3D View" : `${mode[0].toUpperCase()}${mode.slice(1)} View`}
                </button>
              ))}
            </div>
          </header>

          <section className="comparison-conditions">
            <div className="conditions-name">
              <small>SHARED CONFIGURATION</small>
              <strong>Site Comparison Conditions</strong>
            </div>
            <div>
              <small>Analysis Period</small>
              <select aria-label="Comparison start date" value={startDate} onChange={event => setStartDate(event.target.value)} className="comparison-date">{Array.from({ length: 12 }, (_, index) => { const date = `2028-${String(index + 1).padStart(2, "0")}-01`; return <option key={date} value={date}>{new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })} · Days 1–7</option>; })}</select>
            </div>
            <div>
              <small>Current Time</small>
              <strong>{compareTime.split("·")[1]}</strong>
            </div>
            <div>
              <small>Evaluation Mode</small>
              <strong>JPL Sun + Earth + LOLA Horizon</strong>
            </div>
            <span>Hourly JPL Sun + Earth angles · LOLA local horizon · not flight-validated</span>
            <button onClick={() => setStartDate("2028-01-01")}>Reset Date</button>
          </section>

          <section className="site-selector">
            <div>
              <small>COMPARISON SET</small>
              <h2>Select Sites to Compare</h2>
              <p>Choose a minimum of 2 and maximum of 4 candidate locations.</p>
            </div>
            <div className="site-chips">
              {comparisonSiteOptions.map((site) => (
                <button
                  className={selectedIds.includes(site.id) ? "selected" : ""}
                  onClick={() => toggleSite(site.id)}
                  key={site.id}
                >
                  <i>{selectedIds.includes(site.id) ? "✓" : "+"}</i>
                  {site.name}
                </button>
              ))}
            </div>
            <strong>
              {selected.length} / 4 <small>SITES SELECTED</small>
            </strong>
          </section>

          {viewMode === "data" && (
            <section className={`comparison-columns count-${selected.length}`}>
              {selected.map((site) => {
                const isBest = site.id === best.id;
                const live = site.points[timelineIndex(site.points)];
                const liveSolar = live?.solarElevation ?? 0;
                const liveEarth = live?.earthElevation;
                
                return (
                  <article className={`comparison-column ${isBest ? "best" : ""}`} key={site.id}>
                    <div className="comparison-site-head">
                      <div className="compare-image">
                        <img
                          src={lunarTerrain}
                          alt={`${site.name} lunar terrain`}
                          style={{ objectPosition: site.imagePosition }}
                        />
                        {isBest && <span>HIGHEST SOLAR AVAILABILITY</span>}
                      </div>
                      <div className="compare-site-title">
                        <div>
                          <small>{site.status.toUpperCase()}</small>
                          <h2>{site.name}</h2>
                          <p>{site.coords}</p>
                        </div>
                        <strong>
                          {site.solar}%
                          <small> SUN</small>
                        </strong>
                      </div>
                      <div className="live-condition">
                        <span className={live?.solarVisible ? "available" : "limited"}>
                          <i /> {live?.solarVisible ? "SUNLIT" : "SHADED"}
                        </span>
                        <div className="current-values">
                          <span>
                            SUN <b>{liveSolar.toFixed(1)}°</b>
                          </span>
                          <span>
                            EARTH <b>{liveEarth == null ? "N/A" : `${liveEarth.toFixed(1)}°`}</b>
                          </span>
                          <span>
                            HORIZON <b>{live?.terrainHorizon?.toFixed(1) ?? "N/A"}°</b>
                          </span>
                        </div>
                      </div>
                      <button onClick={() => navigate("explore")}>
                        View Site <Icon name="chevron" size={12} />
                      </button>
                    </div>
                    <ComparisonMetric
                      site={site}
                      type="solar"
                      value={`${site.solar}%`}
                      window={site.solarWindow}
                      compact={selected.length === 4}
                      expanded={expanded === `${site.id}-solar`}
                      onClick={() =>
                        setExpanded(expanded === `${site.id}-solar` ? "" : `${site.id}-solar`)
                      }
                    />
                    <ComparisonMetric
                      site={site}
                      type="earth"
                      value={site.earth == null ? "N/A" : `${site.earth}%`}
                      window={site.earthWindow}
                      compact={selected.length === 4}
                      expanded={expanded === `${site.id}-earth`}
                      onClick={() =>
                        setExpanded(expanded === `${site.id}-earth` ? "" : `${site.id}-earth`)
                      }
                    />
                    <ComparisonMetric
                      site={site}
                      type="combined"
                      value={site.combined == null ? "N/A" : `${site.combined}%`}
                      window={site.operationalWindow}
                      compact={selected.length === 4}
                      expanded={expanded === `${site.id}-combined`}
                      onClick={() =>
                        setExpanded(expanded === `${site.id}-combined` ? "" : `${site.id}-combined`)
                      }
                    />
                    <ComparisonMetric
                      site={site}
                      type="terrain"
                      value={site.horizon}
                      window={`${site.obstruction}°`}
                      compact={selected.length === 4}
                      expanded={expanded === `${site.id}-terrain`}
                      onClick={() =>
                        setExpanded(expanded === `${site.id}-terrain` ? "" : `${site.id}-terrain`)
                      }
                    />
                    {isBest && (
                      <div className="why-best">
                        <strong>Solar visibility leader</strong>
                        <p>Highest solar visibility among selected sites in this hourly sample. Earth and joint visibility are displayed separately; mission suitability is not scored.</p>
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          )}

          {viewMode === "map" && (
            <section className="comparison-map panel">
              <img src={lunarTerrain} alt="Selected landing sites on lunar south pole map" />
              <div className="preview-grid" />
              {selected.map((site, index) => (
                <button
                  style={{
                    left: `${20 + index * (60 / Math.max(1, selected.length - 1))}%`,
                    top: `${32 + (index % 2) * 24}%`,
                  }}
                  key={site.id}
                  onClick={() => navigate("explore")}
                >
                  <i />
                  <span>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    {site.name}
                    <small>{site.coords}</small>
                  </span>
                </button>
              ))}
              <div className="comparison-map-legend">
                SELECTED SITES · ILLUSTRATIVE LOCATIONS · NOT A GEOREFERENCED LROC MAP
              </div>
            </section>
          )}

          {viewMode === "3d" && (
            <section className={`terrain-comparison count-${selected.length}`}>
              {(selected.length === 2 ? selected : [best]).map((site) => (
                <article key={site.id}>
                  <div>
                    <small>TERRAIN MODEL</small>
                    <h2>{selected.length === 2 ? site.name : "Shared South Pole Terrain"}</h2>
                  </div>
                  <div className="terrain-model">
                    <img
                      src={lunarTerrain}
                      alt={`${site.name} terrain model`}
                      style={{ objectPosition: site.imagePosition }}
                    />
                    <div className="topo-lines" />
                    {selected.length > 2 ? (
                      selected.map((marker, index) => (
                        <span
                          className="terrain-marker"
                          style={{ left: `${20 + index * 20}%`, top: `${35 + (index % 2) * 25}%` }}
                          key={marker.id}
                        >
                          <i />
                          {marker.name}
                        </span>
                      ))
                    ) : (
                      <span className="terrain-marker" style={{ left: "52%", top: "45%" }}>
                        <i />
                        {site.name}
                      </span>
                    )}
                  </div>
                  <p>Illustrative terrain image only · No measured LOLA elevation model is loaded</p>
                </article>
              ))}
            </section>
          )}

          <section className="synchronized-timeline panel">
            <div className="sync-heading">
              <div>
                <small>TEMPORAL COMPARISON</small>
                <h2>Synchronized Mission Timeline</h2>
                <p>Compare changing mission conditions across all selected landing sites.</p>
              </div>
              <div>
                <small>CURRENT COMPARISON TIME</small>
                <strong>{compareTime}</strong>
              </div>
            </div>
            <div className="sync-body">
              <div className="sync-labels">
                {selected.map((site) => (
                  <div key={site.id}>
                    <strong>{site.name}</strong>
                    <span>
                      <i className="yellow" />
                      Solar
                    </span>
                    <span>
                      <i className="cyan" />
                      Earth
                    </span>
                    <span>
                      <i className="green" />
                      Combined
                    </span>
                  </div>
                ))}
              </div>
              <div className="sync-tracks">
                <div className="sync-cursor" style={{ left: `${timeline}%` }}>
                  <i />
                  <span>{String(hour).padStart(2, "0")}:00</span>
                </div>
                {selected.map((site) => (
                  <div className="site-track-group" key={site.id}>
                    <div className="sync-track solar">
                      {site.points.slice(0, -1).map((p, i) => p.solarVisible ? <span key={i} style={{ left: `${i / (site.points.length - 1) * 100}%`, width: `${100 / (site.points.length - 1) + 0.1}%` }} /> : null)}
                    </div>
                    <div className="sync-track earth">
                      {site.points.slice(0, -1).map((p, i) => p.earthVisible ? <span key={i} style={{ left: `${i / (site.points.length - 1) * 100}%`, width: `${100 / (site.points.length - 1) + 0.1}%` }} /> : null)}
                    </div>
                    <div className="sync-track combined">
                      {site.points.slice(0, -1).map((p, i) => p.combinedVisible ? <span key={i} style={{ left: `${i / (site.points.length - 1) * 100}%`, width: `${100 / (site.points.length - 1) + 0.1}%` }} /> : null)}
                    </div>
                  </div>
                ))}
                <input
                  aria-label="Synchronized comparison time"
                  type="range"
                  min="0"
                  max="100"
                  value={timeline}
                  onChange={(event) => setTimeline(Number(event.target.value))}
                />
                <div className="sync-days">
                  {Array.from({ length: 7 }, (_, i) => { const d = new Date(`${startDate}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + i); return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" }).toUpperCase(); }).map(
                    (date) => (
                      <span key={date}>{date}</span>
                    ),
                  )}
                </div>
              </div>
            </div>
            <div className="comparison-logic">
              <span>SAME TIME</span>
              <i>↓</i>
              <span>DIFFERENT LOCATIONS</span>
              <i>↓</i>
              <span>DIFFERENT CONDITIONS</span>
            </div>
          </section>

          <section className="comparison-summary panel">
            <div className="summary-intro">
              <small>DECISION SUPPORT</small>
              <h2>Comparison Summary</h2>
              <p>
                {best.name} has the highest solar availability in this 7-day sample.
                Sun and Earth apparent angles come from the supplied JPL data; both are checked against the same LOLA-derived local horizon. This is not a mission ranking.
              </p>
            </div>
            <div className="summary-results">
              <span>
                <small>Best Solar Conditions</small>
                <strong>{bestSolar.name}</strong>
                <b>{bestSolar.solar}%</b>
              </span>
              <span>
                <small>Best Earth Visibility</small>
                <strong>{bestEarth.name}</strong>
                <b>{bestEarth.earth == null ? "N/A" : `${bestEarth.earth}%`}</b>
              </span>
              <span>
                <small>Highest Simultaneous Visibility</small>
                <strong>{bestCombined.name}</strong>
                <b>{bestCombined.combined == null ? "N/A" : `${bestCombined.combined}% · ${bestCombined.operationalWindow} longest`}</b>
              </span>
              <span>
                <small>Terrain Obstruction</small>
                <strong>LOLA local horizon</strong>
                <b>10 km max sampled range</b>
              </span>
              <span className="overall">
                <small>Highest Solar Availability (not mission ranking)</small>
                <strong>{best.name}</strong>
                <b>{best.solar}% Sun</b>
              </span>
            </div>
          </section>
          <footer>
            SUN + EARTH: SUPPLIED JPL HORIZONS + LOLA LOCAL HORIZON · NOT FLIGHT VALIDATED <span>2028 · 7 DAYS/MONTH</span>
            <span>SELENIX · WHERE TO LAND. WHEN TO GO.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function MissionAnalysisDashboard({
  navigate,
  missionConfig,
}: {
  navigate: (page: Page) => void;
  missionConfig: MissionConfig;
}) {
  const [timeline, setTimeline] = useState(39);
  const [layer, setLayer] = useState("Terrain");
  const [view, setView] = useState({ scale: 1, x: 0, rotate: 0 });
  const [details, setDetails] = useState(false);
  const selectedMonth = monthNames[missionConfig.month];
  const selectedMonthShort = selectedMonth.slice(0, 3);
  const selectedMonthTitle = `${selectedMonth[0]}${selectedMonth.slice(1).toLowerCase()}`;
  const analysisWindow = `${selectedMonthTitle} ${String(missionConfig.startDay).padStart(2, "0")}–${String(missionConfig.endDay).padStart(2, "0")}, 2028`;
  const timelineDays = Array.from(
    { length: missionConfig.endDay - missionConfig.startDay + 1 },
    (_, index) =>
      `${selectedMonthShort} ${String(missionConfig.startDay + index).padStart(2, "0")}`,
  );

  const [siteData, setSiteData] = useState<SiteAnalysis | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<"loading" | "ready" | "error">("loading");
  const [analysisError, setAnalysisError] = useState("");
  const [retryAnalysis, setRetryAnalysis] = useState(0);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  const saveCurrentAnalysis = async () => {
    if (!siteData || saveState === "saving") return;
    setSaveState("saving");
    setSaveError("");
    try {
      const startDate = `2028-${String(missionConfig.month + 1).padStart(2, "0")}-${String(missionConfig.startDay).padStart(2, "0")}`;
      await createSavedAnalysis({
        title: `${siteData.name} · ${startDate}`,
        siteId: siteData.id,
        startDate,
        days: missionConfig.endDay - missionConfig.startDay + 1,
      });
      setSaveState("saved");
    } catch (error) {
      setSaveState("error");
      setSaveError(error instanceof Error ? error.message : "Could not save analysis");
    }
  };
  useEffect(() => { setSaveState("idle"); setSaveError(""); }, [missionConfig.site, missionConfig.month, missionConfig.startDay, missionConfig.endDay]);


  useEffect(() => {
    const controller = new AbortController();
    const date = `2028-${String(missionConfig.month + 1).padStart(2, "0")}-${String(missionConfig.startDay).padStart(2, "0")}`;
    const days = missionConfig.endDay - missionConfig.startDay + 1;
    setAnalysisStatus("loading");
    setSiteData(null);
    getComparison(date, days, controller.signal).then((response) => {
      const match = response.sites.find((site) => site.name === missionConfig.site);
      if (!match) throw new Error(`Site not found in scientific dataset: ${missionConfig.site}`);
      if (controller.signal.aborted) return;
      setSiteData(match);
      setAnalysisStatus("ready");
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      setAnalysisError(error instanceof Error ? error.message : "Unknown API error");
      setAnalysisStatus("error");
    });
    return () => controller.abort();
  }, [missionConfig.site, missionConfig.month, missionConfig.startDay, missionConfig.endDay, retryAnalysis]);

  const livePoint = siteData?.points.length
    ? siteData.points[Math.min(siteData.points.length - 1, Math.floor(timeline / 100 * siteData.points.length))]
    : null;
  const live = {
    time: livePoint
      ? new Date(livePoint.time).toLocaleString("en-GB", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "UTC", hour12: false }).toUpperCase() + " UTC"
      : "N/A",
    sunEl: livePoint?.solarElevation.toFixed(1) ?? "N/A",
    sunAz: livePoint?.sunAzimuth?.toFixed(1) ?? "N/A",
    earthEl: livePoint?.earthElevation?.toFixed(1) ?? "N/A",
    earthAz: livePoint?.earthAzimuth?.toFixed(1) ?? "N/A",
    obstruction: livePoint?.terrainHorizon?.toFixed(1) ?? "N/A",
    earthObstruction: livePoint?.earthTerrainHorizon?.toFixed(1) ?? "N/A",
    sunVisible: livePoint?.solarVisible ?? null,
    earthVisible: livePoint?.earthVisible ?? null,
  };
  const nextJointChange = useMemo(() => {
    if (!siteData?.points.length) return "N/A";
    const index = Math.min(siteData.points.length - 1, Math.floor(timeline / 100 * siteData.points.length));
    const now = siteData.points[index].combinedVisible;
    const change = siteData.points.findIndex((point, i) => i > index && point.combinedVisible !== now);
    return change < 0 ? "None in window" : `${change - index}h`;
  }, [siteData, timeline]);
  const longestSolar = useMemo(() => {
    const points = siteData?.points ?? [];
    let currentStart = 0, currentLength = 0, bestStart = -1, bestLength = 0;
    for (let i = 0; i < points.length; i++) {
      if (points[i].solarVisible) {
        if (!currentLength) currentStart = i;
        currentLength++;
        if (currentLength > bestLength) { bestLength = currentLength; bestStart = currentStart; }
      } else { currentLength = 0; }
    }
    return bestStart < 0 ? null : { startIndex: bestStart, length: bestLength };
  }, [siteData]);
  const horizonLimits = useMemo(() => {
    const profile = siteData?.horizonProfile ?? [];
    return { low: Math.min(-5, ...profile), high: Math.max(10, ...profile) };
  }, [siteData]);
  const terrainHorizonPath = useMemo(() => {
    const profile = siteData?.horizonProfile ?? [];
    if (!profile.length) return "";
    return profile.map((angle, i) => {
      const x = i / (profile.length - 1) * 420;
      const y = 175 - (angle - horizonLimits.low) / (horizonLimits.high - horizonLimits.low || 1) * 145;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(" ");
  }, [siteData, horizonLimits]);
  const terrainMiniPath = useMemo(() => {
    const profile = siteData?.horizonProfile ?? [];
    return profile.map((angle, i) => {
      const x = i / Math.max(1, profile.length - 1) * 240;
      const y = 37 - (angle - horizonLimits.low) / (horizonLimits.high - horizonLimits.low || 1) * 30;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");
  }, [siteData, horizonLimits]);

  if (analysisStatus !== "ready" || !siteData) {
    return <div className="mission-app"><Sidebar active="Analyze" navigate={navigate} />
      <main className="mission-main"><div className="mission-content">
        <h1>Mission Analysis</h1>
        <section className="conditions-row" style={{ display: "block", marginTop: 20 }}>
          <strong>{analysisStatus === "loading" ? "Loading NASA-source solar and terrain observations..." : "Analysis data could not be loaded"}</strong>
          {analysisStatus === "error" && <><p style={{ color: "#ff8a82", margin: "12px 0" }}>{analysisError}. Check that the Python backend is running on port 8000.</p><button onClick={() => setRetryAnalysis(n => n + 1)}>Retry analysis</button></>}
        </section>
      </div></main>
    </div>;
  }

  const adjustView = (action: string) => {
    if (action === "Reset View") setView({ scale: 1, x: 0, rotate: 0 });
    if (action === "Zoom") setView((v) => ({ ...v, scale: v.scale >= 1.3 ? 1 : v.scale + 0.15 }));
    if (action === "Orbit") setView((v) => ({ ...v, rotate: v.rotate + 6 }));
    if (action === "Pan") setView((v) => ({ ...v, x: v.x >= 24 ? 0 : v.x + 12 }));
  };

  return (
    <div className="mission-app">
      <Sidebar active="Analyze" navigate={navigate} />

      <main className="mission-main">
        <header className="mission-header">
          <div className="header-top">
            <div>
              <div className="breadcrumb">
                <span>Analyze</span>
                <b>/</b>
                <strong>Mission Analysis</strong>
              </div>
              <h1>Mission Analysis</h1>
              <p>
                  NASA-source Sun and Earth observer samples evaluated against LOLA-derived local terrain horizons for the selected lunar landing site.
                </p>
              <div className="result-actions">
                <button onClick={() => navigate("explore")}>Explore 3D Terrain</button>
                <button onClick={() => navigate("compare")}>Compare Sites</button>
                <button onClick={saveCurrentAnalysis} disabled={saveState !== "idle" && saveState !== "error"}>{saveState === "saving" ? "Saving..." : saveState === "saved" ? "✓ Saved to Database" : "Save Analysis"}</button>
                <button onClick={() => window.print()}>Export Report</button>
              </div>
              {saveState === "saved" && <p className="saved-message" role="status">Saved in SQLite. Open “Saved Analyses” to view or delete it.</p>}
              {saveState === "error" && <p className="saved-error" role="alert">Save failed: {saveError}</p>}
            </div>
            <div className="header-account">
              <button className="data-source">
                <Icon name="database" size={16} />
                <span>
                  <small>CONNECTED</small>NASA Data Sources
                </span>
              </button>
              <div className="profile">
                <span>NN</span>
                <div>
                  <strong>Nada Nasser</strong>
                  <small>Mission Planner</small>
                </div>
                <Icon name="chevron" size={14} />
              </div>
            </div>
          </div>
          <div className="site-bar">
            <div>
              <small>Site</small>
              <strong>{missionConfig.site}</strong>
            </div>
            <div>
              <small>Coordinates</small>
              <strong>{siteData.coords}</strong>
            </div>
            <div>
              <small>Analysis Window</small>
              <strong>{analysisWindow}</strong>
            </div>
            <div>
              <small>Current Time</small>
              <strong>{live.time.replace("JAN ", "Jan ")}</strong>
            </div>
            <button onClick={() => navigate("define")}>
              <Icon name="calendar" size={15} /> Change Window
            </button>
          </div>
        </header>

        <div className="mission-content">
          <section className="conditions-row">
            <div className="conditions-title">
              <span>
                <i />
              </span>
              <div>
                <small>MISSION CONDITIONS</small>
                <h2>Sun + Earth Visibility Modeled</h2>
                <p>
                  Both Sun and Earth line of sight are estimated for the selected period. A mission suitability score requires user-defined power and communication constraints.
                </p>
              </div>
            </div>
            <div className="score-gauge">
              <div>
                <svg viewBox="0 0 80 45">
                  <path d="M8 40a32 32 0 0 1 64 0" fill="none" stroke="#213247" strokeWidth="7" />

                </svg>
                <strong>N/A</strong>
              </div>
              <span>
                MISSION SCORE<small>NOT DEFINED</small>
              </span>
            </div>
          </section>

          <section className="analysis-cards">
            <article className="analysis-card solar-card">
              <div className="card-label">
                <span>
                  <Icon name="sun" size={16} />
                </span>
                Solar Analysis<small>01</small>
              </div>
              <div className="primary-value">
                <strong>{siteData.solar.toFixed(1)}%</strong>
                <span>Solar Availability</span>
              </div>
              <TimeSeriesCurve color="#FFD84D" points={siteData.points} valueKey="solarElevation" />
              <div className="card-metrics">
                <span>
                  <small>Elevation</small>
                  <b>{live.sunEl}°</b>
                </span>
                <span>
                  <small>Azimuth</small>
                  <b>{live.sunAz}°</b>
                </span>
                <span>
                  <small>Longest Window</small>
                  <b>{siteData.solarWindow}</b>
                </span>
              </div>
            </article>
            <article className="analysis-card earth-card">
              <div className="card-label">
                <span>
                  <Icon name="earth" size={16} />
                </span>
                Earth Visibility<small>02</small>
              </div>
              <div className="primary-value">
                <strong>{siteData.earth == null ? "N/A" : `${siteData.earth.toFixed(1)}%`}</strong>
                <span>Direct Earth Visibility</span>
              </div>
              <TimeSeriesCurve color="#32C7FF" points={siteData.points} valueKey="earthElevation" />
              <div className="card-metrics">
                <span>
                  <small>Elevation</small>
                  <b>{live.earthEl === "N/A" ? "N/A" : `${live.earthEl}°`}</b>
                </span>
                <span>
                  <small>Azimuth</small>
                  <b>{live.earthAz === "N/A" ? "N/A" : `${live.earthAz}°`}</b>
                </span>
                <span>
                  <small>Longest Visible</small>
                  <b>{siteData.earthWindow}</b>
                </span>
              </div>
            </article>
            <article className="analysis-card combined-card">
              <div className="card-label">
                <span>
                  <Icon name="analyze" size={16} />
                </span>
                Combined Window<small>03</small>
              </div>
              <div className="primary-value">
                <strong>{siteData.combined == null ? "N/A" : `${siteData.combined.toFixed(1)}%`}</strong>
                <span>Sun + Earth Available</span>
              </div>
              <TimeSeriesCurve color="#35E27A" points={siteData.points} valueKey="combinedVisible" />
              <div className="card-metrics">
                <span>
                  <small>Best Window (UTC)</small>
                  <b>{siteData.jointWindowStart ? new Date(siteData.jointWindowStart).toLocaleString("en-GB", { month: "short", day: "2-digit", hour: "2-digit", timeZone: "UTC", hour12: false }) : "No joint interval"}</b>
                </span>
                <span>
                  <small>Longest Duration</small>
                  <b>{siteData.operationalWindow}</b>
                </span>
                <span>
                  <small>Next Change</small>
                  <b>{nextJointChange}</b>
                </span>
              </div>
            </article>
            <article className="analysis-card horizon-card">
              <div className="card-label">
                <span>
                  <Icon name="terrain" size={16} />
                </span>
                Local Terrain Horizon<small>04</small>
              </div>
              <div className="horizon-status">
                <strong>{live.sunVisible ? "Solar Line Clear" : "Solar Line Blocked"}</strong>
                <span>
                  <i /> CURRENT LINE OF SIGHT
                </span>
              </div>
              <svg className="terrain-mini" viewBox="0 0 240 42" preserveAspectRatio="none" role="img" aria-label="Measured local azimuth horizon profile">
                <path d={`${terrainMiniPath} L240 42 L0 42Z`} fill="#1c2d3d" />
                <path d={terrainMiniPath} fill="none" stroke="#71879c" />
              </svg>
              <div className="card-metrics four">
                <span>
                  <small>Max Horizon</small>
                  <b>{siteData.obstruction.toFixed(1)}°</b>
                </span>
                <span>
                  <small>Obstruction</small>
                  <b>{live.obstruction}°</b>
                </span>
                <span>
                  <small>Sun</small>
                  <b className={live.sunVisible ? "good" : ""}>{live.sunVisible ? "Visible" : "Blocked"}</b>
                </span>
                <span>
                  <small>Earth</small>
                  <b className={live.earthVisible ? "good" : ""}>{live.earthVisible ? "Visible" : "Blocked"}</b>
                </span>
              </div>
            </article>
          </section>

          <section className="spatial-section">
            <article className="viewer-panel panel">
              <div className="panel-heading">
                <div>
                  <small>SPATIAL ANALYSIS</small>
                  <h2>3D Lunar South Pole</h2>
                </div>
                <span className="viewer-coords">
                  <Icon name="pin" size={12} /> {siteData.coords}
                </span>
              </div>
              <div className={`lunar-view ${layer.toLowerCase().replace(" ", "-")}`}>
                <img
                  src={lunarTerrain}
                  alt="Illustrative lunar terrain scene, not a measured site-specific elevation model"
                  style={{
                    transform: `translateX(${view.x}px) scale(${view.scale}) rotate(${view.rotate}deg)`,
                  }}
                />
                <div className="topo-lines" />
                <div className="viewer-vignette" />
                <div className="site-marker">
                  <span>
                    <i />
                  </span>
                  <b>{missionConfig.site.toUpperCase()}</b>
                  <small>SELECTED SITE</small>
                </div>
                <div
                  className="direction sun-direction"
                  style={{ transform: `rotate(${(livePoint?.sunAzimuth ?? 0) * 0.1 - 9}deg)` }}
                >
                  <span>
                    <Icon name="sun" size={15} /> SUN
                  </span>
                  <i />
                </div>

                <div className="viewer-source">ILLUSTRATIVE IMAGE · NOT A GEOREFERENCED 3D MODEL</div>
              </div>
              <div className="viewer-controls">
                <div>
                  {["Orbit", "Zoom", "Pan", "Reset View"].map((item) => (
                    <button key={item} onClick={() => adjustView(item)}>
                      <Icon
                        name={item === "Reset View" ? "reset" : (item.toLowerCase() as IconName)}
                        size={14}
                      />{" "}
                      {item}
                    </button>
                  ))}
                </div>
                <div className="layer-tabs">
                  {["Terrain", "Sunlight", "Topography"].map((item) => (
                    <button
                      className={layer === item ? "active" : ""}
                      onClick={() => setLayer(item)}
                      key={item}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </article>

            <article className="horizon-panel panel">
              <div className="panel-heading">
                <div>
                  <small>LINE-OF-SIGHT MODEL</small>
                  <h2>Local Horizon View</h2>
                </div>
                <button aria-label="Horizon information">
                  <Icon name="info" size={16} />
                </button>
              </div>
              <div className="horizon-diagram">
                <div className="horizon-grid" />
                <svg viewBox="0 0 420 195" preserveAspectRatio="none" aria-label="LOLA-derived horizon angle by azimuth" role="img">
                  {terrainHorizonPath && <>
                    <path d={`${terrainHorizonPath} L420 195 L0 195Z`} fill="#172535" />
                    <path d={terrainHorizonPath} fill="none" stroke="#6d8296" strokeWidth="1.5" />
                  </>}
                </svg>
                <div
                  className="horizon-object sun-object"
                  style={{
                    left: `${(livePoint?.sunAzimuth ?? 0) / 360 * 100}%`,
                    bottom: `${Math.max(12, Math.min(195, (20 + (Number(live.sunEl) - horizonLimits.low) / (horizonLimits.high - horizonLimits.low || 1) * 145) * 0.97))}px`,
                  }}
                >
                  <Icon name="sun" size={18} />
                  <span>
                    SUN <b>{live.sunEl}° EL</b>
                  </span>
                </div>
                <div
                  className="horizon-object earth-object"
                  style={{
                    left: `${(livePoint?.earthAzimuth ?? 0) / 360 * 100}%`,
                    bottom: `${Math.max(12, Math.min(195, (20 + (Number(live.earthEl) - horizonLimits.low) / (horizonLimits.high - horizonLimits.low || 1) * 145) * 0.97))}px`,
                  }}
                >
                  <Icon name="earth" size={18} />
                  <span>EARTH <b>{live.earthEl}° EL</b></span>
                </div>
                <div className="observer">
                  <i />
                  <span>{missionConfig.site.toUpperCase()} OBSERVER</span>
                </div>
                <span className="axis zero">0° AZ</span>
                <span className="axis high">360° AZ · LOCAL PROFILE</span>
              </div>
              <div className="object-readouts">
                <div>
                  <span className="readout-icon sun">
                    <Icon name="sun" size={17} />
                  </span>
                  <div>
                    <small>Sun</small>
                    <strong className={live.sunVisible ? "visible" : "blocked"}>
                      {live.sunVisible ? "Visible" : "Blocked"}
                    </strong>
                  </div>
                  <p>
                    <span>
                      Elevation <b>{live.sunEl}°</b>
                    </span>
                    <span>
                      Azimuth <b>{live.sunAz}°</b>
                    </span>
                  </p>
                </div>
                <div>
                  <span className="readout-icon earth">
                    <Icon name="earth" size={17} />
                  </span>
                  <div>
                    <small>Earth</small>
                    <strong className={live.earthVisible ? "visible" : "blocked"}>{live.earthVisible ? "Visible" : "Blocked"}</strong>
                  </div>
                  <p>
                    <span>
                      Elevation <b>{live.earthEl === "N/A" ? "N/A" : `${live.earthEl}°`}</b>
                    </span>
                    <span>
                      Azimuth <b>{live.earthAz === "N/A" ? "N/A" : `${live.earthAz}°`}</b>
                    </span>
                  </p>
                </div>
              </div>
            </article>
          </section>

          <section className="timeline-panel panel">
            <div className="timeline-heading">
              <div>
                <small>TEMPORAL ANALYSIS</small>
                <h2>Mission Timeline</h2>
                <p>
                  Combined view of changing lunar conditions across the selected analysis window.
                </p>
              </div>
              <div className="date-range">
                <span>
                  {selectedMonthShort} {String(missionConfig.startDay).padStart(2, "0")}, 2028
                </span>
                <i />
                <span>
                  {selectedMonthShort} {String(missionConfig.endDay).padStart(2, "0")}, 2028
                </span>
              </div>
            </div>
            <div className="timeline-body">
              <div className="timeline-labels">
                <span>
                  <i className="yellow" />
                  Solar Availability
                </span>
                <span>
                  <i className="cyan" />
                  Earth Visibility
                </span>
                <span>
                  <i className="green" />
                  Combined Window
                </span>
                <span>
                  <i className="red" />
                  Sun Below Horizon
                </span>
              </div>
              <div className="tracks">
                {longestSolar && <div className="best-window" style={{ left: `${longestSolar.startIndex / siteData.points.length * 100}%`, width: `${longestSolar.length / siteData.points.length * 100}%` }}>
                  <span>LONGEST SOLAR WINDOW</span>
                </div>}
                <div className="cursor" style={{ left: `${timeline}%` }}>
                  <b>{live.time}</b><i />
                </div>
                <div className="track solar-track">
                  {siteData.points.map((point, i) => point.solarVisible ? <span key={i} className="segment" style={{ left: `${i / siteData.points.length * 100}%`, width: `${100 / siteData.points.length + 0.15}%` }} /> : null)}
                </div>
                <div className="track earth-track">
                  {siteData.points.map((point, i) => point.earthVisible ? <span key={i} className="segment" style={{ left: `${i / siteData.points.length * 100}%`, width: `${100 / siteData.points.length + 0.15}%` }} /> : null)}
                </div>
                <div className="track combined-track">
                  {siteData.points.map((point, i) => point.combinedVisible ? <span key={i} className="segment" style={{ left: `${i / siteData.points.length * 100}%`, width: `${100 / siteData.points.length + 0.15}%` }} /> : null)}
                </div>
                <div className="track obstruction-track">
                  {siteData.points.map((point, i) => !point.solarVisible ? <span key={i} className="segment" style={{ left: `${i / siteData.points.length * 100}%`, width: `${100 / siteData.points.length + 0.15}%` }} /> : null)}
                </div>
                <input
                  aria-label="Mission timeline cursor"
                  type="range"
                  min="0"
                  max="100"
                  step=".1"
                  value={timeline}
                  onChange={(e) => setTimeline(Number(e.target.value))}
                />
                <div className="day-labels">
                  {timelineDays.map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="timeline-link">
              <span>TIME</span>
              <i>→</i>
              <span>SUN POSITION</span>
              <i>→</i>
              <span>LOCAL HORIZON</span>
              <i>→</i>
              <span>SUN + EARTH JOINT VISIBILITY</span>
            </div>
          </section>

          <section className="window-summary panel">
            <div className="window-title">
              <span><Icon name="clock" size={18} /></span>
              <div>
                <small>LONGEST SOLAR-VISIBLE INTERVAL (HOURLY SAMPLE)</small>
                <h2>{longestSolar
                  ? new Date(siteData.points[longestSolar.startIndex].time).toLocaleString("en-GB", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "UTC", hour12: false }) + " UTC"
                  : "No sunlit hours in this observation window"}</h2>
                <p>Sunlit interval (hourly sampled). Joint Sun + Earth availability is shown below and in the green timeline.</p>
              </div>
              <strong>{siteData.solarWindow}<small>LONGEST SUNLIT DURATION</small></strong>
            </div>
            <div className="window-metrics">
              <span><small>Solar Availability</small><b>{siteData.solar.toFixed(1)}%</b></span>
              <span><small>Sun Average Elevation*</small><b>{siteData.solarAverageElevation == null ? "N/A" : `${siteData.solarAverageElevation.toFixed(1)}°`}</b></span>
              <span><small>Earth Visibility</small><b>{siteData.earth == null ? "N/A" : `${siteData.earth.toFixed(1)}%`}</b></span>
              <span><small>Combined Availability</small><b>{siteData.combined == null ? "N/A" : `${siteData.combined.toFixed(1)}%`}</b></span>
            </div>
            <button onClick={() => setDetails(!details)}>Data Limitations <Icon name="chevron" size={14} /></button>
            {details && <div className="details-note">* Mean elevation during solar-visible samples. JPL Sun and Earth observer angles + local LOLA horizon: hourly samples, max 10 km terrain rays; line of sight is not an RF link budget, power estimate, or flight-certified analysis.</div>}
          </section>
          <footer>
            DATA: Supplied JPL HORIZONS Sun + Earth / NASA GSFC LOLA local horizon <span>Research prototype v5 · SQLite + joint line-of-sight</span>
            <span>SELENIX · WHERE TO LAND. WHEN TO GO.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function SavedAnalysesPage({
  navigate,
  openSaved,
}: {
  navigate: (page: Page) => void;
  openSaved: (entry: SavedAnalysis) => void;
}) {
  const [items, setItems] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    getSavedAnalyses(controller.signal)
      .then(data => { setItems(data); setError(""); })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Unable to load saved analyses");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  const remove = async (entry: SavedAnalysis) => {
    if (!window.confirm(`Delete saved analysis “${entry.title}”? This cannot be undone.`)) return;
    setDeletingId(entry.id);
    try {
      await removeSavedAnalysis(entry.id);
      setItems(old => old.filter(item => item.id !== entry.id));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete saved analysis");
    } finally { setDeletingId(null); }
  };
  return (
    <div className="mission-app">
      <Sidebar active="Saved Analyses" navigate={navigate} />
      <main className="home-main">
        <ProductHeader profileOpen={profileOpen} setProfileOpen={setProfileOpen} />
        <div className="flow-content">
          <div className="flow-breadcrumb"><button onClick={() => navigate("home")}>Home</button><span>/</span><strong>Saved Analyses</strong></div>
          <header className="saved-page-title"><small>SQLITE · PERSISTENT ARCHIVE</small><h1>Saved Analyses</h1>
            <p>Saved locally in the project database, with the original calculation percentages and dataset version.</p>
          </header>
          <div className="saved-page-tools">
            <span>{loading ? "Loading saved analyses..." : `${items.length} saved ${items.length === 1 ? "analysis" : "analyses"}`}</span>
            <button className="glass-action" onClick={() => setRefresh(x => x + 1)}>Refresh</button>
            <button className="glass-action primary" onClick={() => navigate("select")}>+ New Analysis</button>
          </div>
          {error && <div className="saved-error" role="alert">{error} — make sure the Python backend is running on port 8000.</div>}
          {!loading && !error && items.length === 0 && <div className="saved-empty">No saved analyses yet. Start a new analysis, select a 2028 observation period, then click “Save Analysis”.</div>}
          <div className="saved-results-grid">
            {items.map(item => (
              <article className="saved-result-card" key={item.id}>
                <div className="saved-card-top"><span>ANL-{item.id} · SAVED</span><small>{new Date(item.created_at_utc).toLocaleString()}</small></div>
                <h2>{item.title}</h2><p>{item.site_name} · {item.start_date} · {item.days} day(s)</p>
                <div className="saved-stats">
                  <div><small>SOLAR</small><strong className="solar-color">{item.solar_percent.toFixed(1)}%</strong></div>
                  <div><small>EARTH</small><strong className="earth-color">{item.earth_percent.toFixed(1)}%</strong></div>
                  <div><small>COMBINED</small><strong className="combined-color">{item.combined_percent.toFixed(1)}%</strong></div>
                </div>
                <div className="saved-card-actions">
                  <button className="glass-action primary" onClick={() => openSaved(item)}>Open Analysis</button>
                  <button className="glass-action" disabled={deletingId === item.id} onClick={() => void remove(item)}>
                    {deletingId === item.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
                <small className="saved-record-source">Model: {item.model_version}<br />Dataset SHA-256: {item.source_sha256.slice(0, 16)}…</small>
              </article>
            ))}
          </div>
          <p className="saved-record-note">The cards preserve their original calculated percentages. Opening one re-runs the same site and observation period against the current local dataset.</p>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [missionConfig, setMissionConfig] = useState<MissionConfig>({
    site: "Haworth",
    coordinates: siteCoordinates.Haworth,
    month: 0,
    startDay: 1,
    endDay: 7,
  });
  const navigate = (next: Page) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (page === "saved") return <SavedAnalysesPage navigate={navigate} openSaved={(entry) => {
    const start = new Date(`${entry.start_date}T00:00:00Z`);
    setMissionConfig({
      site: entry.site_name,
      coordinates: siteCoordinates[entry.site_name] ?? "",
      month: start.getUTCMonth(),
      startDay: start.getUTCDate(),
      endDay: start.getUTCDate() + entry.days - 1,
    });
    navigate("analysis");
  }} />;
  if (page === "home") return <HomeDashboard navigate={navigate} />;
  if (page === "analysis")
    return <MissionAnalysisDashboard navigate={navigate} missionConfig={missionConfig} />;
  if (page === "compare") return <CompareDashboard navigate={navigate} />;
  if (page === "define")
    return (
      <DefinePeriodPage
        navigate={navigate}
        missionConfig={missionConfig}
        setMissionConfig={setMissionConfig}
      />
    );
  return (
    <FlowPage
      page={page}
      navigate={navigate}
      missionConfig={missionConfig}
      setMissionConfig={setMissionConfig}
    />
  );
}
