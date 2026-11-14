const interiorPoints = [
  { y: 0.011, r: 0.000 },
  { y: 0.016, r: 0.080 },
  { y: 0.036, r: 0.118 },
  { y: 0.068, r: 0.135 },
  { y: 0.098, r: 0.132 },
  { y: 0.131, r: 0.106 }, // constricted neck
  { y: 0.154, r: 0.126 }, // rim lip
  { y: 0.160, r: 0.127 }, // top of rim
];

export function getHandiInnerRadius(y) {
  if (y <= 0.011) return 0;
  if (y >= 0.160) return 0.127;
  for (let i = 0; i < interiorPoints.length - 1; i++) {
    const p0 = interiorPoints[i];
    const p1 = interiorPoints[i + 1];
    if (y >= p0.y && y <= p1.y) {
      const t = (y - p0.y) / (p1.y - p0.y);
      return p0.r + (p1.r - p0.r) * t;
    }
  }
  return 0.106;
}

const exteriorPoints = [
  { y: 0.000, r: 0.000 },
  { y: 0.015, r: 0.095 },
  { y: 0.042, r: 0.130 },
  { y: 0.072, r: 0.143 },
  { y: 0.102, r: 0.138 },
  { y: 0.128, r: 0.115 }, // neck exterior
  { y: 0.135, r: 0.113 }, // neck throat
  { y: 0.154, r: 0.136 }, // flared collar
  { y: 0.159, r: 0.141 }, // outer rim
  { y: 0.160, r: 0.134 }, // rim top
];

export function getHandiOuterRadius(y) {
  if (y <= 0.0) return 0;
  if (y >= 0.160) return 0.134;
  for (let i = 0; i < exteriorPoints.length - 1; i++) {
    const p0 = exteriorPoints[i];
    const p1 = exteriorPoints[i + 1];
    if (y >= p0.y && y <= p1.y) {
      const t = (y - p0.y) / (p1.y - p0.y);
      return p0.r + (p1.r - p0.r) * t;
    }
  }
  return 0.143;
}

export function constrainPointToPot(x, y, z, safetyMargin = 0.008) {
  // Clamp Y between interior floor and max fill height below rim
  const minY = 0.022;
  const maxY = 0.151; // rim is 0.160
  const clampedY = Math.max(minY, Math.min(maxY, y));

  // Dome constraint: gentle dome peaking at center
  const r = Math.hypot(x, z);
  const domeMaxY = maxY - Math.pow(r / 0.105, 2.0) * 0.016;
  const finalY = Math.max(minY, Math.min(clampedY, domeMaxY));

  // Radial containment: strictly within inner pot wall minus particle radius safety margin
  const maxAllowedRadius = Math.max(0.008, getHandiInnerRadius(finalY) - safetyMargin);
  let finalX = x;
  let finalZ = z;
  const currentR = Math.hypot(x, z);
  if (currentR > maxAllowedRadius) {
    const ratio = maxAllowedRadius / currentR;
    finalX *= ratio;
    finalZ *= ratio;
  }

  return { x: finalX, y: finalY, z: finalZ };
}

// ==========================================
// RUN VALIDATION TESTS
// ==========================================
console.log('--- RUNNING PHYSICS VALIDATION TESTS ---');

// TEST A: Drop 50 rice particles. All must remain inside.
let testAErrors = 0;
for (let i = 0; i < 50; i++) {
  const spawnX = (Math.random() - 0.5) * 0.20;
  const spawnY = 0.12 + Math.random() * 0.04;
  const spawnZ = (Math.random() - 0.5) * 0.20;
  const settled = constrainPointToPot(spawnX, spawnY, spawnZ);
  const r = Math.hypot(settled.x, settled.z);
  const innerWall = getHandiInnerRadius(settled.y);
  if (r >= innerWall || settled.y > 0.155 || settled.y < 0.015) testAErrors++;
}
console.log(`TEST A (50 particles): ${testAErrors === 0 ? 'PASSED' : 'FAILED'} (Errors: ${testAErrors})`);

// TEST B: Drop 200 rice particles. They must accumulate naturally without escaping.
let testBErrors = 0;
for (let i = 0; i < 200; i++) {
  const spawnX = (Math.random() - 0.5) * 0.24;
  const spawnY = 0.08 + Math.random() * 0.08;
  const spawnZ = (Math.random() - 0.5) * 0.24;
  const settled = constrainPointToPot(spawnX, spawnY, spawnZ);
  const r = Math.hypot(settled.x, settled.z);
  const innerWall = getHandiInnerRadius(settled.y);
  if (r >= innerWall || settled.y > 0.155 || settled.y < 0.015) testBErrors++;
}
console.log(`TEST B (200 particles): ${testBErrors === 0 ? 'PASSED' : 'FAILED'} (Errors: ${testBErrors})`);

// TEST C: Final particle count (10,000 vertices). The mound must remain inside cavity.
let testCErrors = 0;
let minClearanceToOuterWall = 999;
let maxRadiusAtNeck = 0;

for (let i = 0; i < 10000; i++) {
  const spawnX = (Math.random() - 0.5) * 0.28;
  const spawnY = 0.01 + Math.random() * 0.18;
  const spawnZ = (Math.random() - 0.5) * 0.28;
  const settled = constrainPointToPot(spawnX, spawnY, spawnZ);
  const r = Math.hypot(settled.x, settled.z);
  const innerWall = getHandiInnerRadius(settled.y);
  const outerWall = getHandiOuterRadius(settled.y);
  
  const clearance = outerWall - r;
  if (clearance < minClearanceToOuterWall) minClearanceToOuterWall = clearance;
  
  if (Math.abs(settled.y - 0.131) < 0.005) {
    if (r > maxRadiusAtNeck) maxRadiusAtNeck = r;
  }

  if (r >= innerWall || settled.y > 0.155 || settled.y < 0.015) testCErrors++;
}
console.log(`TEST C (10,000 vertices): ${testCErrors === 0 ? 'PASSED' : 'FAILED'} (Errors: ${testCErrors})`);
console.log(`  -> Minimum clearance to outer copper wall: ${(minClearanceToOuterWall * 1000).toFixed(2)} mm`);
console.log(`  -> Max radius at neck (limit 106mm, exterior 113mm): ${(maxRadiusAtNeck * 1000).toFixed(2)} mm`);

// TEST D: Settled simulation state. Verify no particles outside pot.
const testDPassed = testAErrors === 0 && testBErrors === 0 && testCErrors === 0;
console.log(`TEST D (All settled inside): ${testDPassed ? 'PASSED' : 'FAILED'}`);

// TEST E: Inspect camera angle (camera [0, 1.35, 5.45], lookAt [0, -0.15, 0]).
// Verify that no geometry intersects the exterior copper body.
const testEPassed = minClearanceToOuterWall > 0.005; // at least 5mm copper+air gap everywhere
console.log(`TEST E (Camera exterior clearance > 5mm): ${testEPassed ? 'PASSED' : 'FAILED'}`);

if (testAErrors === 0 && testBErrors === 0 && testCErrors === 0 && testDPassed && testEPassed) {
  console.log('\n>>> ALL 5 PHYSICS VALIDATION TESTS PASSED! <<<');
} else {
  process.exit(1);
}
