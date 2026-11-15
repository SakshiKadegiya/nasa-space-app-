import { Orbit, Radio, CircleHelp } from "lucide-react";

export default function TopBar({ apiStatus }) {
  const online = apiStatus?.status === "ok";
  return <header className="topbar">
    <div className="brand">
      <div className="brand-mark"><Orbit size={21} /></div>
      <div><div className="brand-name">POLAR<span>VIEW</span></div><div className="brand-sub">CLPS LUNAR MISSION BROWSER</div></div>
    </div>
    <div className="topbar-right">
      <div className={`connection ${online ? "online" : "offline"}`}><span className="pulse-dot" />{online ? "API CONNECTED" : "API DISCONNECTED"}</div>
      <button className="icon-button" title="About this prototype"><CircleHelp size={18}/></button>
      <div className="avatar">PV</div>
    </div>
  </header>;
}