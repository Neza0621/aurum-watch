/**
 * AURUM — Calibre I | 3D Procedural Horology & Cinematic Scroll Engine
 * Reglas aplicadas:
 * - ai-ui-ux-motion-engine: Geometría procedural, PBR física de metales, scrub con inercia,
 *   motion safety (prefers-reduced-motion), pausa en pestaña oculta, zero assets externos.
 * - frontend-design: Interacciones disciplinadas, sin artificios innecesarios.
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. Detección de Preferencias y Capacidades del Sistema
  // =========================================================================
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth <= 768;

  // Quitar clase de carga inicial
  window.addEventListener('DOMContentLoaded', () => {
    document.body.classList.remove('is-loading');
  });

  // =========================================================================
  // 2. Inicialización de la Escena Three.js
  // =========================================================================
  const container = document.getElementById('webgl-container');
  const canvas = document.getElementById('webgl-canvas');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050608);
  scene.fog = new THREE.FogExp2(0x050608, 0.08);

  const camera = new THREE.PerspectiveCamera(
    isMobile ? 50 : 38,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, isMobile ? 9.5 : 7.6);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    powerPreference: 'high-performance',
    alpha: false
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.outputEncoding = THREE.sRGBEncoding;

  // =========================================================================
  // 3. Mapa de Entorno de Estudio Procedural (Reflejos de Relojería de Lujo)
  // =========================================================================
  function generateStudioEnvTexture() {
    const envCanvas = document.createElement('canvas');
    envCanvas.width = 512;
    envCanvas.height = 256;
    const ctx = envCanvas.getContext('2d');

    // Gradiente de fondo abisal
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 256);
    bgGrad.addColorStop(0, '#15171d');
    bgGrad.addColorStop(0.5, '#050608');
    bgGrad.addColorStop(1, '#0e1014');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 512, 256);

    // Luces de softbox verticales difusas (producen reflejos satinados en el bisel)
    ctx.fillStyle = '#ffffff';
    ctx.filter = 'blur(10px)';
    ctx.fillRect(60, 20, 50, 216);
    ctx.fillRect(260, 30, 40, 196);
    ctx.fillRect(390, 20, 60, 216);

    // Acento cálido dorado en el borde superior
    ctx.fillStyle = '#e5c378';
    ctx.fillRect(160, 10, 45, 140);
    ctx.fillRect(320, 120, 35, 110);

    const texture = new THREE.CanvasTexture(envCanvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    return texture;
  }

  const studioEnvMap = generateStudioEnvTexture();
  scene.environment = studioEnvMap;

  // =========================================================================
  // 4. Iluminación Cinemática
  // =========================================================================
  const ambientLight = new THREE.AmbientLight(0xfffaed, 0.9);
  scene.add(ambientLight);

  // Luz principal cálida (Key light)
  const keyLight = new THREE.DirectionalLight(0xfff0d0, 3.2);
  keyLight.position.set(4, 5, 6);
  scene.add(keyLight);

  // Luz de relleno lateral (Fill light)
  const fillLight = new THREE.DirectionalLight(0xe5c378, 1.8);
  fillLight.position.set(-5, -2, 3);
  scene.add(fillLight);

  // Luz de recorte fría posterior (Rim light para definir siluetas contra el negro)
  const rimLight = new THREE.DirectionalLight(0xa5c4e8, 1.6);
  rimLight.position.set(0, -6, -4);
  scene.add(rimLight);

  // =========================================================================
  // 5. Materiales PBR Físicos de Alta Relojería
  // =========================================================================
  // Oro pulido especular (18k Champagne Gold)
  const goldPolishedMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe5c378,
    metalness: 0.92,
    roughness: 0.16,
    clearcoat: 0.4,
    clearcoatRoughness: 0.1,
    reflectivity: 1.0,
    envMapIntensity: 1.6
  });

  // Oro satinado cepillado (Bridges y Platinas)
  const goldBrushedMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xd9b363,
    metalness: 0.88,
    roughness: 0.38,
    envMapIntensity: 1.1
  });

  // Oro oscuro / sombras de engranaje
  const goldDarkMaterial = new THREE.MeshStandardMaterial({
    color: 0x9e7b39,
    metalness: 0.85,
    roughness: 0.45,
    envMapIntensity: 0.8
  });

  // Acero templado azulado (Tornillería clásica de alta relojería suiza)
  const bluedSteelMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x1d3f72,
    metalness: 0.95,
    roughness: 0.12,
    clearcoat: 0.6,
    clearcoatRoughness: 0.05
  });

  // Rubí sintético de pivote (Corindón rojo profundo translúcido)
  const rubyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x8b0021,
    emissive: 0x3d000c,
    metalness: 0.1,
    roughness: 0.08,
    transmission: 0.75,
    ior: 1.77,
    thickness: 0.5,
    transparent: true,
    opacity: 0.95
  });

  // Cristal de zafiro antirreflejos
  const sapphireGlassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.03,
    transmission: 0.95,
    ior: 1.76,
    transparent: true,
    opacity: 0.25
  });

  // =========================================================================
  // 6. Generadores de Geometría Procedural
  // =========================================================================
  
  // Función para tallar engranajes dentados mecánicos
  function createGearGeometry(outerRadius, innerRadius, teethCount, toothDepth, thickness) {
    const shape = new THREE.Shape();
    const step = (Math.PI * 2) / teethCount;

    for (let i = 0; i < teethCount; i++) {
      const a0 = i * step;
      const a1 = a0 + step * 0.22;
      const a2 = a0 + step * 0.62;
      const a3 = a0 + step * 0.88;

      const rRoot = outerRadius - toothDepth;
      const rTip = outerRadius;

      if (i === 0) {
        shape.moveTo(Math.cos(a0) * rRoot, Math.sin(a0) * rRoot);
      } else {
        shape.lineTo(Math.cos(a0) * rRoot, Math.sin(a0) * rRoot);
      }
      shape.lineTo(Math.cos(a1) * rTip, Math.sin(a1) * rTip);
      shape.lineTo(Math.cos(a2) * rTip, Math.sin(a2) * rTip);
      shape.lineTo(Math.cos(a3) * rRoot, Math.sin(a3) * rRoot);
    }
    shape.closePath();

    // Orificio central del eje
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
    shape.holes.push(holePath);

    return new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.015,
      bevelThickness: 0.015
    });
  }

  // Tornillo relojero con ranura para destornillador
  function createHorologyScrew() {
    const screwGroup = new THREE.Group();
    const headGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.03, 16);
    const headMesh = new THREE.Mesh(headGeo, bluedSteelMaterial);
    headMesh.rotation.x = Math.PI / 2;
    screwGroup.add(headMesh);

    // Ranura oscura
    const slotGeo = new THREE.BoxGeometry(0.1, 0.018, 0.02);
    const slotMesh = new THREE.Mesh(slotGeo, new THREE.MeshBasicMaterial({ color: 0x030303 }));
    slotMesh.position.z = 0.012;
    screwGroup.add(slotMesh);

    return screwGroup;
  }

  // Cojinete de rubí montado en engaste de oro
  function createRubyBearing() {
    const bearingGroup = new THREE.Group();
    // Chatón de oro
    const chatonGeo = new THREE.TorusGeometry(0.09, 0.03, 12, 24);
    const chatonMesh = new THREE.Mesh(chatonGeo, goldPolishedMaterial);
    bearingGroup.add(chatonMesh);

    // Gema de rubí
    const gemGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16);
    const gemMesh = new THREE.Mesh(gemGeo, rubyMaterial);
    gemMesh.rotation.x = Math.PI / 2;
    bearingGroup.add(gemMesh);

    return bearingGroup;
  }

  // Espiral de volante (Hairspring Archimedian Spiral)
  function createHairspringGeometry(turns, maxRadius) {
    const points = [];
    const totalPoints = 280;
    for (let i = 0; i <= totalPoints; i++) {
      const t = i / totalPoints;
      const angle = t * Math.PI * 2 * turns;
      const r = 0.08 + t * (maxRadius - 0.08);
      points.push(new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, 0));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 220, 0.008, 6, false);
  }

  // =========================================================================
  // 7. Construcción de Capas del Calibre Horológico (Vista Explotada)
  // =========================================================================
  const caliberMaster = new THREE.Group();
  scene.add(caliberMaster);

  // Registro de capas para animación de separación axial
  const layers = [];

  // -------------------------------------------------------------------------
  // CAPA 0: Bisel Trasero & Fondo Visto de Exposición
  // -------------------------------------------------------------------------
  const layer0_caseback = new THREE.Group();
  layer0_caseback.userData = { restingZ: -0.65, explodedZ: -3.4 };

  // Anillo exterior con muescas de fondo roscado
  const casebackRingGeo = new THREE.TorusGeometry(2.35, 0.16, 20, 64);
  const casebackRing = new THREE.Mesh(casebackRingGeo, goldPolishedMaterial);
  layer0_caseback.add(casebackRing);

  // Anillo biselado estriado
  const casebackBevelGeo = new THREE.CylinderGeometry(2.38, 2.45, 0.1, 48, 1, true);
  const casebackBevel = new THREE.Mesh(casebackBevelGeo, goldBrushedMaterial);
  casebackBevel.rotation.x = Math.PI / 2;
  layer0_caseback.add(casebackBevel);

  // Cristal de zafiro de fondo
  const sapphireBackGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.03, 48);
  const sapphireBack = new THREE.Mesh(sapphireBackGeo, sapphireGlassMaterial);
  sapphireBack.rotation.x = Math.PI / 2;
  layer0_caseback.add(sapphireBack);

  // Tornillos de fondo perimetrales
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const screw = createHorologyScrew();
    screw.position.set(Math.cos(angle) * 2.28, Math.sin(angle) * 2.28, 0.05);
    layer0_caseback.add(screw);
  }

  caliberMaster.add(layer0_caseback);
  layers.push(layer0_caseback);

  // -------------------------------------------------------------------------
  // CAPA 1: Platina Principal & Puentes Esqueletados
  // -------------------------------------------------------------------------
  const layer1_mainplate = new THREE.Group();
  layer1_mainplate.userData = { restingZ: -0.38, explodedZ: -2.1 };

  // Anillo estructural de la platina
  const plateBorderGeo = new THREE.TorusGeometry(2.15, 0.12, 16, 48);
  const plateBorder = new THREE.Mesh(plateBorderGeo, goldBrushedMaterial);
  layer1_mainplate.add(plateBorder);

  // Puente arqueado superior (Tourbillon Bridge)
  const archBridgeShape = new THREE.Shape();
  archBridgeShape.moveTo(-1.8, -0.2);
  archBridgeShape.lineTo(1.8, -0.2);
  archBridgeShape.lineTo(1.4, 0.45);
  archBridgeShape.lineTo(-1.4, 0.45);
  archBridgeShape.closePath();

  const archHole1 = new THREE.Path();
  archHole1.absarc(-0.8, 0.1, 0.35, 0, Math.PI * 2, true);
  archBridgeShape.holes.push(archHole1);

  const archHole2 = new THREE.Path();
  archHole2.absarc(0.7, 0.1, 0.45, 0, Math.PI * 2, true);
  archBridgeShape.holes.push(archHole2);

  const archBridgeGeo = new THREE.ExtrudeGeometry(archBridgeShape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.02,
    bevelThickness: 0.02
  });
  const archBridge = new THREE.Mesh(archBridgeGeo, goldBrushedMaterial);
  archBridge.position.z = -0.03;
  layer1_mainplate.add(archBridge);

  // Rubíes sobre la platina
  const rubyPositions = [
    [-0.8, 0.1],
    [0.7, 0.1],
    [0.0, -0.9],
    [-0.5, -1.2],
    [0.9, -0.8]
  ];
  rubyPositions.forEach(([rx, ry]) => {
    const bearing = createRubyBearing();
    bearing.position.set(rx, ry, 0.04);
    layer1_mainplate.add(bearing);
  });

  caliberMaster.add(layer1_mainplate);
  layers.push(layer1_mainplate);

  // -------------------------------------------------------------------------
  // CAPA 2: Tren de Engranajes Concéntricos (Gear Train & Barrel)
  // -------------------------------------------------------------------------
  const layer2_geartrain = new THREE.Group();
  layer2_geartrain.userData = { restingZ: -0.15, explodedZ: -0.8 };

  // 1. Barrilete de muelle real / Rueda de rochete grande (Soleillage dorado)
  const barrelGearGeo = createGearGeometry(1.05, 0.22, 38, 0.08, 0.05);
  const barrelGear = new THREE.Mesh(barrelGearGeo, goldPolishedMaterial);
  barrelGear.position.set(-0.8, 0.5, 0);
  layer2_geartrain.add(barrelGear);

  // Tapa del barrilete con radios calados
  for (let i = 0; i < 5; i++) {
    const spokeAngle = (i / 5) * Math.PI * 2;
    const spokeGeo = new THREE.BoxGeometry(0.65, 0.04, 0.04);
    const spoke = new THREE.Mesh(spokeGeo, goldDarkMaterial);
    spoke.position.set(-0.8 + Math.cos(spokeAngle) * 0.45, 0.5 + Math.sin(spokeAngle) * 0.45, 0.04);
    spoke.rotation.z = spokeAngle;
    layer2_geartrain.add(spoke);
  }

  // 2. Rueda de centro (Centro dorado de transmisión)
  const centerGearGeo = createGearGeometry(0.85, 0.15, 30, 0.07, 0.04);
  const centerGear = new THREE.Mesh(centerGearGeo, goldPolishedMaterial);
  centerGear.position.set(0.1, -0.2, 0);
  layer2_geartrain.add(centerGear);

  // 3. Rueda intermedia (Tercera rueda)
  const intermediateGearGeo = createGearGeometry(0.65, 0.12, 24, 0.06, 0.04);
  const intermediateGear = new THREE.Mesh(intermediateGearGeo, goldBrushedMaterial);
  intermediateGear.position.set(0.9, -0.6, 0.02);
  layer2_geartrain.add(intermediateGear);

  // 4. Rueda de escape (Dientes angulares horológicos característicos)
  const escapeGearGeo = createGearGeometry(0.48, 0.08, 16, 0.09, 0.03);
  const escapeGear = new THREE.Mesh(escapeGearGeo, goldPolishedMaterial);
  escapeGear.position.set(0.2, -1.25, 0.03);
  layer2_geartrain.add(escapeGear);

  caliberMaster.add(layer2_geartrain);
  layers.push(layer2_geartrain);

  // -------------------------------------------------------------------------
  // CAPA 3: Órgano Regulador (Volante de Inercia, Espiral & Tourbillon Cage)
  // -------------------------------------------------------------------------
  const layer3_regulator = new THREE.Group();
  layer3_regulator.userData = { restingZ: 0.12, explodedZ: 0.85 };

  // Subgrupo rotatorio del volante para oscilación a 4Hz
  const balanceWheel = new THREE.Group();
  balanceWheel.position.set(0, 0, 0);

  // Aro exterior del volante (Rim de alta masa periférica)
  const balanceRimGeo = new THREE.TorusGeometry(1.22, 0.045, 16, 64);
  const balanceRim = new THREE.Mesh(balanceRimGeo, goldPolishedMaterial);
  balanceWheel.add(balanceRim);

  // 4 radios curvos aerodinámicos
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const spokeArmGeo = new THREE.BoxGeometry(1.15, 0.035, 0.02);
    const spokeArm = new THREE.Mesh(spokeArmGeo, goldPolishedMaterial);
    spokeArm.position.set(Math.cos(angle) * 0.58, Math.sin(angle) * 0.58, 0);
    spokeArm.rotation.z = angle;
    balanceWheel.add(spokeArm);
  }

  // Tornillos de inercia de oro en la periferia del volante (Regulación micrómétrica)
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const inertiaScrewGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.05, 12);
    const inertiaScrew = new THREE.Mesh(inertiaScrewGeo, goldPolishedMaterial);
    inertiaScrew.position.set(Math.cos(angle) * 1.25, Math.sin(angle) * 1.25, 0);
    inertiaScrew.rotation.z = angle + Math.PI / 2;
    balanceWheel.add(inertiaScrew);
  }

  // Espiral de volante dorado
  const hairspringGeo = createHairspringGeometry(5.5, 0.65);
  const hairspring = new THREE.Mesh(hairspringGeo, goldPolishedMaterial);
  balanceWheel.add(hairspring);

  // Pivote central de rubí en el eje del volante
  const balanceRuby = createRubyBearing();
  balanceRuby.position.set(0, 0, 0.02);
  balanceWheel.add(balanceRuby);

  layer3_regulator.add(balanceWheel);

  caliberMaster.add(layer3_regulator);
  layers.push(layer3_regulator);

  // -------------------------------------------------------------------------
  // CAPA 4: Esfera Esqueletada Flotante & Índices Horarios
  // -------------------------------------------------------------------------
  const layer4_dial = new THREE.Group();
  layer4_dial.userData = { restingZ: 0.35, explodedZ: 2.1 };

  // Anillo de capítulos (Chapter Ring en oro cepillado)
  const dialRingGeo = new THREE.RingGeometry(1.9, 2.22, 64);
  const dialRing = new THREE.Mesh(dialRingGeo, goldBrushedMaterial);
  layer4_dial.add(dialRing);

  // 12 Índices facetados aplicados en oro pulido
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const isMainHour = i % 3 === 0;
    const markerLength = isMainHour ? 0.22 : 0.14;
    const markerWidth = isMainHour ? 0.045 : 0.025;
    
    const markerGeo = new THREE.BoxGeometry(markerLength, markerWidth, 0.04);
    const marker = new THREE.Mesh(markerGeo, goldPolishedMaterial);
    
    const r = 2.05;
    marker.position.set(Math.cos(angle) * r, Math.sin(angle) * r, 0.02);
    marker.rotation.z = angle;
    layer4_dial.add(marker);
  }

  // Apertura biselada del tourbillon
  const tourbillonRingGeo = new THREE.TorusGeometry(1.35, 0.03, 16, 48);
  const tourbillonRing = new THREE.Mesh(tourbillonRingGeo, goldPolishedMaterial);
  tourbillonRing.position.set(0, 0, 0.01);
  layer4_dial.add(tourbillonRing);

  caliberMaster.add(layer4_dial);
  layers.push(layer4_dial);

  // -------------------------------------------------------------------------
  // CAPA 5: Agujas Facetadas Estilo Dauphine
  // -------------------------------------------------------------------------
  const layer5_hands = new THREE.Group();
  layer5_hands.userData = { restingZ: 0.48, explodedZ: 2.85 };

  function createDauphineHand(length, baseWidth, isHour) {
    const handGroup = new THREE.Group();
    const shape = new THREE.Shape();
    shape.moveTo(0, -baseWidth * 0.7);
    shape.lineTo(baseWidth, 0);
    shape.lineTo(0, length);
    shape.lineTo(-baseWidth, 0);
    shape.closePath();

    const handGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.025,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.01,
      bevelThickness: 0.015
    });

    const handMesh = new THREE.Mesh(handGeo, goldPolishedMaterial);
    handGroup.add(handMesh);

    // Eje central de remache
    const hubGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.04, 24);
    const hubMesh = new THREE.Mesh(hubGeo, goldPolishedMaterial);
    hubMesh.rotation.x = Math.PI / 2;
    hubMesh.position.z = 0.02;
    handGroup.add(hubMesh);

    return handGroup;
  }

  const hourHand = createDauphineHand(1.1, 0.085, true);
  hourHand.rotation.z = -Math.PI / 6; // Apuntando a las 2:00
  layer5_hands.add(hourHand);

  const minuteHand = createDauphineHand(1.65, 0.07, false);
  minuteHand.rotation.z = Math.PI * 0.45; // Apuntando a las 10:10 clásica
  layer5_hands.add(minuteHand);

  caliberMaster.add(layer5_hands);
  layers.push(layer5_hands);

  // -------------------------------------------------------------------------
  // CAPA 6: Bisel Frontal & Cristal de Zafiro Convexo
  // -------------------------------------------------------------------------
  const layer6_frontBezel = new THREE.Group();
  layer6_frontBezel.userData = { restingZ: 0.62, explodedZ: 3.75 };

  // Bisel octogonal suavizado o facetado de alta presencia
  const bezelRingGeo = new THREE.TorusGeometry(2.38, 0.18, 24, 64);
  const bezelRing = new THREE.Mesh(bezelRingGeo, goldPolishedMaterial);
  layer6_frontBezel.add(bezelRing);

  // Corona estriada de cuerda exterior a las 3
  const crownGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.28, 24);
  const crown = new THREE.Mesh(crownGeo, goldPolishedMaterial);
  crown.rotation.z = Math.PI / 2;
  crown.position.set(2.65, 0, 0);
  layer6_frontBezel.add(crown);

  // Cristal de zafiro superior abombado
  const frontGlassGeo = new THREE.SphereGeometry(2.6, 32, 16, 0, Math.PI * 2, 0, 0.35);
  const frontGlass = new THREE.Mesh(frontGlassGeo, sapphireGlassMaterial);
  frontGlass.position.z = -0.55;
  layer6_frontBezel.add(frontGlass);

  caliberMaster.add(layer6_frontBezel);
  layers.push(layer6_frontBezel);

  // Posicionar inicialmente las capas en su posición de reposo
  layers.forEach((layer) => {
    layer.position.z = layer.userData.restingZ;
  });

  // -------------------------------------------------------------------------
  // Partículas de Polvo Dorado en el Vacío (Micro-destellos estelares)
  // -------------------------------------------------------------------------
  const particleCount = isMobile ? 60 : 120;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    particlePositions[i] = (Math.random() - 0.5) * 14;
    particlePositions[i + 1] = (Math.random() - 0.5) * 14;
    particlePositions[i + 2] = (Math.random() - 0.5) * 10;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: 0xe5c378,
    size: 0.045,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending
  });
  const particleSystem = new THREE.Points(particleGeo, particleMat);
  scene.add(particleSystem);

  // =========================================================================
  // 8. Sincronización Cinemática del Scroll con GSAP + ScrollTrigger
  // =========================================================================
  gsap.registerPlugin(ScrollTrigger);

  // Objeto de control de interpolación para Three.js
  const sceneState = {
    explodeProgress: 0.0,
    calibreRotX: 0.12,
    calibreRotY: -0.25,
    calibreRotZ: 0.0,
    camX: 0.0,
    camY: 0.0,
    camZ: isMobile ? 9.5 : 7.6,
    keyLightIntensity: 3.2
  };

  if (!prefersReducedMotion) {
    // Master Timeline de ScrollTrigger con Scrub e inercia suave
    const masterTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: '.story-wrapper',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2, // Suave con inercia cinemática
        onUpdate: (self) => {
          // Actualizar barra de progreso vertical
          const progEl = document.querySelector('.scroll-progression');
          if (progEl) {
            progEl.style.height = `${(self.progress * 100).toFixed(1)}%`;
          }
        }
      }
    });

    // FASE 1: Del Hero a la Vista Explotada (Despiece)
    masterTimeline
      .to(sceneState, {
        explodeProgress: 1.0,
        calibreRotX: 0.58, // Inclinación para ver entre los planos
        calibreRotY: -0.65,
        camX: 0.6,
        camY: 0.2,
        camZ: isMobile ? 6.8 : 5.4,
        ease: 'power2.inOut',
        duration: 2.5
      }, 'phase1')
      
      // FASE 2: Macro Inspección del Corazón Oscilante
      .to(sceneState, {
        explodeProgress: 0.85,
        calibreRotX: 0.25,
        calibreRotY: 0.45,
        camX: 0.1,
        camY: -0.15,
        camZ: isMobile ? 4.5 : 3.4, // Macro zoom dramático
        keyLightIntensity: 4.2,
        ease: 'power2.inOut',
        duration: 3.0
      }, 'phase2')

      // FASE 3: Reensamblaje Monolítico (Cierre de capas con ajuste cero)
      .to(sceneState, {
        explodeProgress: 0.0, // Vuelve a cero: ensamblaje total
        calibreRotX: -0.15,
        calibreRotY: -0.35,
        camX: -0.5,
        camY: 0.1,
        camZ: isMobile ? 8.2 : 6.4,
        keyLightIntensity: 3.5,
        ease: 'power3.out',
        duration: 3.0
      }, 'phase3')

      // FASE 4: Cierre Solemne & Contemplativo
      .to(sceneState, {
        explodeProgress: 0.0,
        calibreRotX: 0.05,
        calibreRotY: 0.1,
        camX: 0.0,
        camY: 0.0,
        camZ: isMobile ? 9.0 : 7.2,
        keyLightIntensity: 3.0,
        ease: 'power2.out',
        duration: 2.0
      }, 'phase4');

    // Revelación individual de las tarjetas de texto (sin fade genérico en loop)
    const cards = [
      { id: '#despiece', target: '#despiece .content-card' },
      { id: '#mecanismo', target: '#mecanismo .content-card' },
      { id: '#ensamblaje', target: '#ensamblaje .content-card' }
    ];

    cards.forEach((cardInfo) => {
      ScrollTrigger.create({
        trigger: cardInfo.id,
        start: 'top 65%',
        end: 'bottom 35%',
        onEnter: () => {
          document.querySelector(cardInfo.target)?.classList.add('is-active');
        },
        onLeave: () => {
          document.querySelector(cardInfo.target)?.classList.remove('is-active');
        },
        onEnterBack: () => {
          document.querySelector(cardInfo.target)?.classList.add('is-active');
        },
        onLeaveBack: () => {
          document.querySelector(cardInfo.target)?.classList.remove('is-active');
        }
      });
    });

    // Animación tipográfica de entrada del Hero
    gsap.from('.hero-title .char-wrap', {
      opacity: 0,
      y: 40,
      stagger: 0.08,
      duration: 1.4,
      ease: 'power3.out',
      delay: 0.3
    });

    gsap.from('.super-title, .hero-subtitle, .hero-specs-row', {
      opacity: 0,
      y: 20,
      duration: 1.2,
      stagger: 0.15,
      ease: 'power2.out',
      delay: 0.7
    });

  } else {
    // Modo Accesibilidad: prefers-reduced-motion
    // Posición estática noble y equilibrada sin scrub mareante
    sceneState.explodeProgress = 0.2;
    sceneState.calibreRotX = 0.2;
    sceneState.calibreRotY = -0.3;
  }

  // =========================================================================
  // 9. Bucle de Renderizado (60 FPS & Pausa Inteligente)
  // =========================================================================
  let isPageVisible = true;
  document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
  });

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    // Optimización ai-ui-ux-motion-engine: pausar GPU cuando la pestaña está en segundo plano
    if (!isPageVisible) return;

    const elapsedTime = clock.getElapsedTime();

    // 1. Oscilación del órgano regulador a 4Hz (28,800 A/h)
    // El volante gira hacia delante y atrás en sincronía armónica
    const tickFrequency = 16.0; // 4Hz en radianes aprox
    balanceWheel.rotation.z = Math.sin(elapsedTime * tickFrequency) * 0.42;

    // 2. Rotación lenta y coordinada de engranajes
    barrelGear.rotation.z = elapsedTime * 0.05;
    centerGear.rotation.z = -elapsedTime * 0.18;
    intermediateGear.rotation.z = elapsedTime * 0.32;
    escapeGear.rotation.z = -elapsedTime * 0.85;

    // 3. Giro microscópico de las agujas
    minuteHand.rotation.z -= 0.0002;
    hourHand.rotation.z -= 0.0002 / 12;

    // 4. Polvo en suspensión oscilando
    particleSystem.rotation.y = elapsedTime * 0.015;
    particleSystem.rotation.x = Math.sin(elapsedTime * 0.02) * 0.05;

    // 5. Aplicar estados de interpolación de capas
    const exp = sceneState.explodeProgress;
    layers.forEach((layer) => {
      const rest = layer.userData.restingZ;
      const exploded = layer.userData.explodedZ;
      // Interpolación suave de Z
      layer.position.z = THREE.MathUtils.lerp(rest, exploded, exp);
    });

    // 6. Rotación general del calibre
    // Leve flotación viva añadida a la rotación controlada por scroll
    const subtleBreath = Math.sin(elapsedTime * 0.8) * 0.02;
    caliberMaster.rotation.x = sceneState.calibreRotX + subtleBreath;
    caliberMaster.rotation.y = sceneState.calibreRotY + (prefersReducedMotion ? elapsedTime * 0.04 : 0);
    caliberMaster.rotation.z = sceneState.calibreRotZ;

    // 7. Cámara y Luces
    camera.position.x = sceneState.camX;
    camera.position.y = sceneState.camY;
    camera.position.z = sceneState.camZ;
    camera.lookAt(0, 0, 0);

    keyLight.intensity = sceneState.keyLightIntensity;

    // Renderizar frame
    renderer.render(scene, camera);
  }

  animate();

  // =========================================================================
  // 10. Gestión de Redimensionamiento Responsive
  // =========================================================================
  window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const mobileNow = width <= 768;

    camera.aspect = width / height;
    camera.fov = mobileNow ? 50 : 38;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    ScrollTrigger.refresh();
  });

  // =========================================================================
  // 11. Interacción: Modal de Asignación Privada
  // =========================================================================
  const dialog = document.getElementById('inquiry-dialog');
  const btnInquire = document.getElementById('btn-inquire');
  const btnClose = document.getElementById('dialog-close-btn');

  if (btnInquire && dialog) {
    btnInquire.addEventListener('click', () => {
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    });
  }

  if (btnClose && dialog) {
    btnClose.addEventListener('click', () => {
      dialog.close();
    });
  }

  // Cerrar al pulsar fuera del diálogo
  dialog?.addEventListener('click', (e) => {
    const rect = dialog.getBoundingClientRect();
    const isInDialog = (
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width
    );
    if (!isInDialog) {
      dialog.close();
    }
  });

  // Manejador del formulario de solicitud
  window.handleFormSubmit = function () {
    const notice = document.getElementById('form-notice');
    if (notice) {
      notice.textContent = 'Solicitud registrada con éxito. La cancillería privada de AURUM se comunicará con discreción.';
      notice.style.color = '#e5c378';
    }
    setTimeout(() => {
      dialog?.close();
    }, 2400);
  };

})();
