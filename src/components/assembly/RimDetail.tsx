import * as THREE from "three";

const RIM_Y = 0.162;
const RIM_R = 0.142; // matched to hammered copper handi mouth radius

export function RimDetail() {
  return (
    <group>
      {/* Thick rolled copper lip on the vessel mouth */}
      <mesh position={[0, RIM_Y, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[RIM_R, 0.0055, 24, 160]} />
        <meshStandardMaterial
          color="#b8683a"
          metalness={1}
          roughness={0.28}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Dark interior neck sleeve preventing hollow vessel gaps from steep angles */}
      <mesh position={[0, RIM_Y - 0.025, 0]}>
        <cylinderGeometry args={[RIM_R - 0.003, RIM_R - 0.02, 0.05, 96, 1, true]} />
        <meshStandardMaterial
          color="#2a1208"
          metalness={0.9}
          roughness={0.55}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Traditional atta dough seal ring applied around the outer mouth rim */}
      <mesh
        position={[0, RIM_Y + 0.002, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[1, 1, 0.8]}
      >
        <torusGeometry args={[RIM_R + 0.005, 0.0045, 16, 160]} />
        <meshStandardMaterial color="#d9b88a" roughness={0.95} metalness={0} />
      </mesh>
    </group>
  );
}
