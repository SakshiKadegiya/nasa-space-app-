
import { useMemo } from "react";
import {
  BufferGeometry,
  Float32BufferAttribute,
} from "three";

export default function TerrainMesh({
  terrain,
  wireframe = false,
}) {
  const geometry = useMemo(() => {
    const rows = terrain?.elevations?.length ?? 0;
    const cols = terrain?.elevations?.[0]?.length ?? 0;

    if (rows < 2 || cols < 2) return null;

    const elevations = terrain.elevations;
    const validMask = terrain.valid_mask;

    const validValues = elevations.flat().filter(
      (value) => Number.isFinite(value)
    );

    if (!validValues.length) return null;

    const min = Math.min(...validValues);
    const max = Math.max(...validValues);
    const range = Math.max(max - min, 1);

    const positions = [];
    const colors = [];
    const indices = [];

    const width = 10;
    const depth = 10;
    const verticalScale = 2.2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const elevation = elevations[row][col];
        const valid = validMask?.[row]?.[col] !== false;
        const normalized = valid
          ? (elevation - min) / range
          : 0;

        positions.push(
          (col / (cols - 1) - 0.5) * width,
          normalized * verticalScale,
          (row / (rows - 1) - 0.5) * depth
        );

        const shade = 0.25 + normalized * 0.55;

        colors.push(
          shade,
          0.18 + normalized * 0.32,
          0.12 + normalized * 0.18
        );
      }
    }

    for (let row = 0; row < rows - 1; row++) {
      for (let col = 0; col < cols - 1; col++) {
        const a = row * cols + col;
        const b = a + 1;
        const c = a + cols;
        const d = c + 1;

        indices.push(a, c, b, b, c, d);
      }
    }

    const result = new BufferGeometry();

    result.setAttribute(
      "position",
      new Float32BufferAttribute(positions, 3)
    );

    result.setAttribute(
      "color",
      new Float32BufferAttribute(colors, 3)
    );

    result.setIndex(indices);
    result.computeVertexNormals();

    return result;
  }, [terrain]);

  if (!geometry) return null;

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <meshStandardMaterial
        vertexColors
        roughness={0.95}
        metalness={0}
        wireframe={wireframe}
        side={2}
      />
    </mesh>
  );
}