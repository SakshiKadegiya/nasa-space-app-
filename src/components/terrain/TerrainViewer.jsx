
import TerrainSunlight from "./TerrainSunlight";
import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Stars,
} from "@react-three/drei";

import { getTerrain } from "../../services/api";
import TerrainMesh from "./TerrainMesh";
import "./TerrainViewer.css";

export default function TerrainViewer({ siteId, datetime }) {
  const [terrain, setTerrain] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [wireframe, setWireframe] = useState(false);

  useEffect(() => {
    if (!siteId) {
      setTerrain(null);
      return;
    }

    let cancelled = false;

    async function loadTerrain() {
      setLoading(true);
      setError("");
      setTerrain(null);

      try {
        const data = await getTerrain(siteId, 128);

        if (!Array.isArray(data.elevations)) {
          throw new Error("Invalid terrain response from backend.");
        }

        if (!cancelled) {
          setTerrain(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load lunar terrain.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTerrain();

    return () => {
      cancelled = true;
    };
  }, [siteId]);

  if (!siteId) {
    return (
      <div className="terrain-message">
        Select a lunar site to view its terrain.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="terrain-message">
        Loading NASA LOLA elevation data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="terrain-error">
        <h3>Unable to load lunar terrain</h3>
        <p>{error}</p>
        <small>
          Check the backend terrain endpoint and GeoTIFF file.
        </small>
      </div>
    );
  }

  if (!terrain) return null;

  return (
    <section className="terrain-viewer">
      <div className="terrain-toolbar">
        <div>
          <h2>3D Lunar Surface</h2>
          <p>
            NASA LOLA elevation model · Original source resolution: 5 m/pixel
          </p>
        </div>

        <button
          onClick={() => setWireframe((current) => !current)}
        >
          {wireframe ? "Surface View" : "Wireframe View"}
        </button>
      </div>

      <div className="terrain-canvas">
        <Canvas
          camera={{
            position: [9, 8, 11],
            fov: 45,
            near: 0.1,
            far: 100,
          }}
        >
          <color attach="background" args={["#080d18"]} />

          <ambientLight intensity={1.2} />

          <directionalLight
            position={[5, 10, 5]}
            intensity={2}
          />

          <Stars
            radius={70}
            depth={35}
            count={1200}
            factor={2}
            fade
          />

          <TerrainMesh
            terrain={terrain}
            wireframe={wireframe}
          />

          <gridHelper
            args={[12, 12, "#34445b", "#202c3c"]}
            position={[0, -0.05, 0]}
          />

          <OrbitControls
            makeDefault
            enableDamping
            minDistance={7}
            maxDistance={22}
            maxPolarAngle={Math.PI / 2.05}
          />
        </Canvas>
      </div>

      <div className="terrain-stats">
        <div>
          <span>Minimum elevation</span>
          <strong>{terrain.elevation_min_m.toFixed(2)} m</strong>
        </div>

        <div>
          <span>Maximum elevation</span>
          <strong>{terrain.elevation_max_m.toFixed(2)} m</strong>
        </div>

        <div>
          <span>Mean elevation</span>
          <strong>{terrain.elevation_mean_m.toFixed(2)} m</strong>
        </div>

        <div>
          <span>Grid resolution</span>
          <strong>
            {terrain.grid_width} × {terrain.grid_height}
          </strong>
        </div>
      </div>

      <p className="terrain-note">
        Terrain is vertically exaggerated for visualization.
        The displayed grid is downsampled from the original LOLA raster.
        Elevations are not shown at their true vertical-to-horizontal scale.
      </p>
    </section>
  );
}