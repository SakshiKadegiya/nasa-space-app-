
import {
  Activity,
  Compass,
  Layers3,
  Satellite,
  Settings2,
  Mountain,
} from "lucide-react";

const items = [
  {
    id: "overview",
    icon: Compass,
    label: "Mission overview",
  },
  {
    id: "comparison",
    icon: Layers3,
    label: "Site comparison",
  },
  {
    id: "timeline",
    icon: Activity,
    label: "Lighting timeline",
  },
  {
    id: "communications",
    icon: Satellite,
    label: "Communications",
  },
  {
    id: "terrain",
    icon: Mountain,
    label: "3D Lunar Terrain",
  },
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="side-label">WORKSPACE</div>

      <nav>
        {items.map(({ id, icon: Icon, label }) => {
          const active = activePage === id;

          return (
            <button
              type="button"
              key={id}
              className={`nav-item ${active ? "active" : ""}`}
              onClick={() => onNavigate(id)}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={19} />

              <span>{label}</span>

              {active && <i />}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="side-label">PROJECT</div>

        <div className="project-chip">
          <div className="project-icon">
            <Settings2 size={16} />
          </div>

          <div>
            <b>South Pole Study</b>
            <small>Geometry workspace</small>
          </div>
        </div>

        <div className="version">
          POLARVIEW v1.0 · PROTOTYPE
        </div>
      </div>
    </aside>
  );
}