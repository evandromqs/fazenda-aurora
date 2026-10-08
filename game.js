'use strict';

if (!window.THREE) {
  document.getElementById('menu').hidden = true;
  document.getElementById('prompt').textContent = 'Não foi possível carregar o motor 3D. Mantenha three.min.js na pasta do jogo e recarregue.';
  throw new Error('Three.js indisponível');
}
const $ = id => document.getElementById(id);
const crops = [
  { name: 'Cenoura', color: 0xf3a13c, days: 1, price: 14, cost: 20 },
  { name: 'Tomate', color: 0xe96750, days: 2, price: 25, cost: 35 },
  { name: 'Abóbora', color: 0xe99730, days: 3, price: 42, cost: 50 }
];
const freshState = () => ({
  day: 1, money: 60, energy: 100, seeds: [8, 3, 2], bag: [0, 0, 0],
  plots: Array.from({ length: 24 }, () => ({ type: -1, age: 0, water: false })), won: false,
  character: 0, view: 0, coins: [], completed: [], earned: 0, position: [3, 6]
});
let state = freshState(), hasSave = false;
try {
  const s = JSON.parse(localStorage.getItem('aurora-v1'));
  if (s && Number.isFinite(s.day) && Number.isFinite(s.money) &&
    Number.isFinite(s.energy) && s.seeds?.length === 3 && s.bag?.length === 3 &&
    s.plots?.length === 24 && [...s.seeds, ...s.bag].every(n => Number.isFinite(n) && n >= 0) &&
    s.plots.every(p => p && Number.isInteger(p.type) && p.type >= -1 && p.type < 3 && Number.isFinite(p.age))) {
    state = { ...freshState(), ...s }; hasSave = true;
  }
} catch { /* Um salvamento inválido não impede começar um jogo novo. */ }
const safeCount = n => Number.isSafeInteger(n) && n >= 0;
state.day = Math.max(1, Math.floor(state.day));
state.money = safeCount(state.money) ? state.money : 60;
state.energy = Math.max(0, Math.min(100, Math.floor(state.energy)));
state.seeds = state.seeds.map(n => safeCount(n) ? n : 0);
state.bag = state.bag.map(n => safeCount(n) ? n : 0);
state.character = [0, 1, 2].includes(state.character) ? state.character : 0;
state.view = [0, 1, 2].includes(state.view) ? state.view : 0;
state.coins = Array.isArray(state.coins) ? state.coins.filter(n => Number.isInteger(n) && n >= 0 && n < 12) : [];
state.completed = Array.isArray(state.completed) ? state.completed.filter(n => n === 'lina' || n === 'bento') : [];
state.earned = safeCount(state.earned) ? state.earned : 0;
if (!Array.isArray(state.position) || state.position.length !== 2 || !state.position.every(Number.isFinite) || Math.abs(state.position[0]) > 21 || state.position[1] < -17 || state.position[1] > 16) state.position = [3, 6];
const characters = [
  { name: 'Aurora', detail: 'Chapéu de palha · Jardineira', shirt: 0x547b97, skin: 0xf2c79d, hat: 0xe4bd71 },
  { name: 'Caio', detail: 'Boné verde · Explorador', shirt: 0x718858, skin: 0xa86f48, hat: 0x395d48 },
  { name: 'Mel', detail: 'Chapéu lilás · Florista', shirt: 0xac6c7e, skin: 0xc58d66, hat: 0xb5a1ca }
];
let menuOpen = true, started = false, dialogNPC = null, cameraAngle = Math.atan2(19, 28);
const viewNames = ['Diorama', 'Próxima', 'Aérea'];
let saveWarned = false;
function save() {
  state.position = [player.position.x, player.position.z];
  hasSave = true;
  try { localStorage.setItem('aurora-v1', JSON.stringify(state)); }
  catch {
    if (!saveWarned) { saveWarned = true; toast('O navegador não permitiu salvar o progresso.'); }
  }
}

// Cena e iluminação.
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb8dbd0);
scene.fog = new THREE.Fog(0xb8dbd0, 42, 90);
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .1, 150);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xfff7df, 0x698550, 2.4));
const sun = new THREE.DirectionalLight(0xffe3ab, 3);
sun.position.set(-12, 25, 10); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30 });
sun.shadow.normalBias = .03; scene.add(sun);
const materials = new Map();
function mat(color) {
  if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .9 }));
  return materials.get(color);
}
function box(w, h, d, color, x, y, z, parent = scene) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh); return mesh;
}
function ball(r, color, x, y, z, parent = scene) {
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat(color));
  mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh;
}
function cone(r, h, color, x, y, z, parent = scene, sides = 7) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, sides), mat(color));
  mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh;
}
box(46, .8, 40, 0x7ea961, 0, -.5, 0);
box(46, .25, 40, 0x9b7754, 0, -1, 0);
box(3, .035, 35, 0xd9c18c, 6, -.065, 1);
box(21, .04, 2.8, 0xd9c18c, -2, -.04, -7);
box(9, .04, 3, 0xd9c18c, 11, -.04, 6);

// Casa e mercado.
box(6, 3.8, 4.5, 0xf0d5a0, -8, 1.9, -11);
const roof = cone(5, 2.7, 0xa95440, -8, 4.9, -11, scene, 4);
roof.rotation.y = Math.PI / 4;
box(1.25, 2.3, .15, 0x75533c, -8, 1.15, -8.7);
for (const x of [-10, -6]) {
  box(1.05, 1.1, .16, 0x77b5b4, x, 2, -8.7);
  box(1.25, .13, .3, 0xfdf0cc, x, 1.4, -8.65);
}
box(1, 2, 1, 0xa08068, -6, 5, -11.5);
box(6.8, .3, 1.3, 0xb88c61, -8, .1, -8);
box(4.5, 1.25, 2, 0xa9794d, 11, .63, 6);
for (const x of [8.8, 13.2]) box(.15, 3, .15, 0x755237, x, 1.5, 6);
for (let i = 0; i < 6; i++) box(.78, .18, 3.2, i % 2 ? 0xffe7ac : 0xc96c50, 9.05 + i * .78, 3, 6);
for (let i = 0; i < 8; i++) ball(.23, i % 2 ? 0xe7ae43 : 0xcf614a, 9.5 + i * .43, 1.48, 6);
function label(text, x, y, z) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#2b473a';
  ctx.roundRect(0, 0, 512, 128, 24); ctx.fill();
  ctx.fillStyle = '#fff1c9'; ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(text, 256, 82);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas) }));
  sprite.position.set(x, y, z); sprite.scale.set(4.8, 1.2, 1); scene.add(sprite);
}
label('MERCADO', 11, 4.2, 6); label('LAR DOCE LAR', -8, 6.8, -11);
const lake = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.4, .12, 40),
  new THREE.MeshStandardMaterial({ color: 0x68b9c3, roughness: .25, metalness: .15 }));
lake.scale.z = .7; lake.position.set(14, -.035, -10); scene.add(lake);
for (let i = 0; i < 18; i++) {
  const a = i / 18 * Math.PI * 2;
  ball(.5, 0xa5ad91, 14 + Math.cos(a) * 4.6, .12, -10 + Math.sin(a) * 3.3).scale.y = .55;
}
let randSeed = 47;
function rand() { randSeed = (randSeed * 16807) % 2147483647; return (randSeed - 1) / 2147483646; }
for (let i = 0; i < 38; i++) {
  const x = rand() * 42 - 21, z = rand() * 36 - 18;
  if (x > -14 && x < 18 && z > -15 && z < 13) continue;
  box(.5, 2, .5, 0x806347, x, .9, z);
  ball(1.55, 0x497b47, x, 2.7, z); ball(1.1, 0x68954c, x - .4, 3.6, z);
}
for (let i = 0; i < 100; i++) {
  const x = rand() * 42 - 21, z = rand() * 36 - 18;
  if (x > -14 && x < 17 && z > -15 && z < 12) continue;
  cone(.13, .45, 0x537d45, x, .15, z);
  if (i % 3 === 0) ball(.12, i % 2 ? 0xffd16c : 0xf6d8bf, x, .4, z);
}
for (let i = 0; i < 18; i++) {
  const x = -21 + i * 2.45;
  box(.15, 1.2, .15, 0xd8c59b, x, .55, 17.5);
  if (i < 17) box(2.45, .13, .13, 0xd8c59b, x + 1.22, .8, 17.5);
}

// Canteiros e crescimento.
const plots = [];
for (let row = 0; row < 4; row++) for (let col = 0; col < 6; col++) {
  const x = -10 + col * 2.05, z = -3 + row * 2.05;
  const soil = box(1.8, .15, 1.8, 0x8d6143, x, .025, z);
  const plants = new THREE.Group(); scene.add(plants); plots.push({ x, z, soil, plants });
}
function redraw() {
  plots.forEach((p, i) => {
    const s = state.plots[i]; p.soil.material = mat(s.water ? 0x594838 : 0x8d6143);
    while (p.plants.children.length) {
      const obj = p.plants.children[0]; p.plants.remove(obj); obj.geometry?.dispose();
    }
    if (s.type < 0) return;
    const crop = crops[s.type], t = Math.min(1, s.age / crop.days);
    for (const dx of [-.42, .42]) for (const dz of [-.42, .42]) {
      const h = .2 + t * .55;
      box(.08, h, .08, 0x4c8041, p.x + dx, h / 2 + .13, p.z + dz, p.plants);
      ball(.19 + t * .09, 0x6c9d46, p.x + dx + .12, h * .7 + .15, p.z + dz, p.plants).scale.set(1, .4, .7);
      if (t >= 1) {
        const fruit = ball(s.type === 2 ? .32 : .23, crop.color, p.x + dx, h + .12, p.z + dz, p.plants);
        if (s.type === 0) fruit.scale.set(.6, 1.3, .6);
      }
    }
  });
}
redraw();
function makePerson(colors) {
  const group = new THREE.Group();
  const shirt = box(.65, .7, .4, colors.shirt, 0, .95, 0, group);
  const head = ball(.34, colors.skin, 0, 1.55, 0, group);
  const brim = box(1, .12, .85, colors.hat, 0, 1.82, 0, group);
  const hat = box(.62, .28, .56, colors.hat, 0, 1.98, 0, group);
  const left = box(.22, .5, .25, 0x5a5146, -.18, .35, 0, group);
  const right = box(.22, .5, .25, 0x5a5146, .18, .35, 0, group);
  const arms = [-.44, .44].map(x => box(.18, .58, .2, colors.skin, x, 1, 0, group));
  for (const x of [-.11, .11]) ball(.035, 0x302d29, x, 1.6, .295, group);
  box(.28, .22, .045, 0xd4bc86, 0, .95, .23, group);
  group.userData = { shirt, head, brim, hat, arms, left, right };
  return group;
}
const player = makePerson(characters[state.character]); scene.add(player);
player.position.set(state.position[0], 0, state.position[1]);
const legL = player.userData.left, legR = player.userData.right;
function applyCharacter() {
  const c = characters[state.character], parts = player.userData;
  parts.shirt.material = mat(c.shirt); parts.head.material = mat(c.skin);
  parts.arms.forEach(arm => arm.material = mat(c.skin));
  parts.brim.material = mat(c.hat); parts.hat.material = mat(c.hat);
  parts.brim.scale.set(state.character === 1 ? .72 : 1, 1, state.character === 1 ? .8 : 1);
}
applyCharacter();
const npcs = [
  { id: 'lina', name: 'Lina', x: 4, z: -6, type: 0, quantity: 3, reward: 65, shirt: 0xc27f64, skin: 0xb88058, hat: 0xf1ca86,
    message: 'Quero preparar uma sopa para a vila. Você pode trazer 3 cenouras? Pago 65 moedas pela encomenda.' },
  { id: 'bento', name: 'Bento', x: 15, z: 10, type: 1, quantity: 2, reward: 75, shirt: 0x6b869f, skin: 0xe0ba8a, hat: 0x647151,
    message: 'Meus tomates acabaram! Traga 2 tomates frescos e você receberá 75 moedas.' }
];
npcs.forEach(npc => {
  npc.mesh = makePerson(npc); npc.mesh.position.set(npc.x, 0, npc.z); scene.add(npc.mesh);
  label(npc.name, npc.x, 3.2, npc.z);
});
const coinPositions = [[3, 9], [6, 11], [9, 10], [12, 12], [16, 4], [6, -3], [3, -9], [-2, -7], [-12, 8], [-9, 11], [-4, 12], [17, -3]];
const coinMeshes = coinPositions.map(([x, z], i) => {
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(.26, .26, .09, 16), new THREE.MeshStandardMaterial({ color: 0xffcc45, metalness: .65, roughness: .3, emissive: 0x8c5700, emissiveIntensity: .3 }));
  coin.position.set(x, .7, z); coin.rotation.x = Math.PI / 2;
  coin.visible = !state.coins.includes(i); scene.add(coin); return coin;
});
const chickens = [];
for (let i = 0; i < 4; i++) {
  const group = new THREE.Group(); scene.add(group);
  ball(.32, 0xfff2cf, 0, .42, 0, group); ball(.2, 0xfff2cf, 0, .66, .23, group);
  cone(.09, .22, 0xe0a247, 0, .64, .43, group, 4).rotation.x = Math.PI / 2;
  box(.12, .15, .1, 0xc85b48, 0, .88, .23, group); chickens.push(group);
}
const select = new THREE.Mesh(new THREE.RingGeometry(.9, 1.02, 4),
  new THREE.MeshBasicMaterial({ color: 0xffe29a, side: THREE.DoubleSide }));
select.rotation.x = -Math.PI / 2; select.rotation.z = Math.PI / 4;
select.position.y = .14; scene.add(select);
let selected = 0, near = -1, shopOpen = false, time = 0, toastTimer;
const keys = {};
function toast(text) {
  $('toast').textContent = text; $('toast').style.opacity = 1;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').style.opacity = 0, 3200);
}
function updateHUD() {
  $('stats').textContent = `Dia ${state.day} · Primavera · ${characters[state.character].name} | Energia ${state.energy}/100`;
  $('energyFill').style.width = `${state.energy}%`;
  $('wallet').textContent = `◉ ${state.money} moedas`;
  if ($('cameraText')) {
    $('cameraText').textContent = ` ${viewNames[state.view]} · V`;
  } else {
    $('cameraButton').textContent = `${viewNames[state.view]} · V`;
  }
  $('goal').value = Math.min(state.money, 500);
  $('goalText').textContent = state.won ? '✓ Meta de 500 moedas alcançada' : `${state.money} / 500 moedas na carteira`;
  $('questText').textContent = npcs.map(n => state.completed.includes(n.id) ? `✓ ${n.name}: entregue` : `${n.name}: ${n.quantity} ${crops[n.type].name.toLowerCase()} (${state.bag[n.type]}/${n.quantity})`).join(' · ');
  const cropIcons = ['🥕', '🍅', '🎃'];
  document.querySelectorAll('[data-seed]').forEach((button, i) => {
    button.classList.toggle('active', i === selected);
    const nameEl = button.querySelector('.crop-name');
    const qtyEl = button.querySelector('.crop-qty');
    if (nameEl && qtyEl) {
      nameEl.textContent = `${i + 1} · ${crops[i].name}`;
      qtyEl.textContent = `(${state.seeds[i]})`;
    } else {
      button.textContent = `${cropIcons[i]} ${i + 1} · ${crops[i].name} (${state.seeds[i]})`;
    }
  });
  $('shopStats').textContent = `${state.money} moedas · Colheita: ` + state.bag.map((n, i) => `${n} ${crops[i].name.toLowerCase()}`).join(', ');
  const sale = state.bag.reduce((sum, n, i) => sum + n * crops[i].price, 0);
  $('sell').textContent = `Vender toda a colheita · +${sale} moedas`;
  $('sell').disabled = !sale;
  document.querySelectorAll('[data-buy]').forEach(b => b.disabled = state.money < crops[+b.dataset.buy].cost);
  updateSoundButton();
}
function updateSoundButton() {
  const sb = $('soundButton');
  if (!sb) return;
  const muted = window.Sound ? window.Sound.isMuted() : false;
  const icon = muted ? '🔇' : '🔊';
  const text = muted ? ' Mudo' : ' Som';
  const iconEl = sb.querySelector('.btn-icon');
  const textEl = sb.querySelector('.btn-text');
  if (iconEl && textEl) {
    iconEl.textContent = icon;
    textEl.textContent = text;
  } else {
    sb.textContent = `${icon}${text}`;
  }
}
function distance(x, z) { return Math.hypot(player.position.x - x, player.position.z - z); }
function isPlaying() { return started && !menuOpen && !shopOpen && !dialogNPC; }
function clearKeys() { Object.keys(keys).forEach(k => keys[k] = false); }
function nearestNPC() { return npcs.find(npc => distance(npc.x, npc.z) < 2.2); }
function addMoney(amount, message) {
  state.money += amount; state.earned += amount;
  let text = `${message} · +${amount} moedas`;
  if (state.money >= 500 && !state.won) {
    state.won = true;
    text += ' · Meta de 500 moedas alcançada!';
    window.Sound?.victory();
  }
  updateHUD(); save(); toast(text);
}
function openConversation(npc) {
  dialogNPC = npc; clearKeys(); $('dialog').hidden = false;
  window.Sound?.dialog();
  $('dialogTitle').textContent = npc.name;
  const done = state.completed.includes(npc.id);
  $('dialogText').textContent = done ? 'Muito obrigado pela colheita! É bom ter você na vizinhança. Aproveite os caminhos: sempre aparecem moedas novas a cada dia.' : npc.message;
  $('deliver').hidden = done;
  $('deliver').disabled = state.bag[npc.type] < npc.quantity;
  $('deliver').textContent = `Entregar ${npc.quantity} ${crops[npc.type].name.toLowerCase()} · +${npc.reward} moedas`;
  $('dialogClose').focus();
}
$('deliver').onclick = () => {
  const npc = dialogNPC;
  if (!npc || state.completed.includes(npc.id) || state.bag[npc.type] < npc.quantity) return;
  state.bag[npc.type] -= npc.quantity; state.completed.push(npc.id);
  window.Sound?.sell();
  addMoney(npc.reward, 'Encomenda entregue'); openConversation(npc);
};
function closeConversation() { dialogNPC = null; $('dialog').hidden = true; clearKeys(); }
$('dialogClose').onclick = closeConversation;

function showMenu() {
  closeShop(); closeConversation(); menuOpen = true; clearKeys();
  $('menu').hidden = false; $('characters').hidden = true; $('instructions').hidden = true;
  $('resetConfirm').hidden = true; document.body.classList.add('menu-open');
  $('play').textContent = started ? 'Continuar jogando →' : hasSave ? 'Continuar minha fazenda →' : 'Entrar na fazenda →';
  $('menuSummary').textContent = `Dia ${state.day} · ${characters[state.character].name} · ${state.money} moedas`;
  $('play').focus();
}
function startGame() {
  menuOpen = false; started = true; clearKeys(); $('menu').hidden = true;
  $('characters').hidden = true; $('instructions').hidden = true;
  document.body.classList.remove('menu-open'); save();
  window.Sound?.click();
  if (!state.coins.length) toast('Explore os caminhos, recolha moedas e conheça Lina e Bento.');
}
function changeView() {
  state.view = (state.view + 1) % 3; updateHUD(); save();
  window.Sound?.click();
  toast(`Câmera: ${viewNames[state.view]} · Q/F para girar`);
}
$('play').onclick = startGame;
$('menuButton').onclick = showMenu;
$('cameraButton').onclick = () => { if (isPlaying()) changeView(); };
if ($('soundButton')) {
  $('soundButton').onclick = () => {
    if (window.Sound) {
      window.Sound.toggleMute();
      updateSoundButton();
    }
  };
}
$('charactersButton').onclick = () => {
  $('menu').hidden = true; $('characters').hidden = false; renderCharacters();
  $('characterList').querySelector('button').focus();
};
function renderCharacters() {
  $('characterList').replaceChildren();
  characters.forEach((c, i) => {
    const b = document.createElement('button'); b.className = 'character-card';
    b.classList.toggle('active', state.character === i); b.setAttribute('aria-pressed', state.character === i);
    const avatar = document.createElement('span'); avatar.className = 'avatar'; avatar.setAttribute('aria-hidden', 'true');
    for (const [property, color] of Object.entries({ skin: c.skin, shirt: c.shirt, hat: c.hat })) avatar.style.setProperty(`--${property}`, `#${color.toString(16).padStart(6, '0')}`);
    const name = document.createElement('strong'); name.textContent = c.name;
    const detail = document.createElement('small'); detail.textContent = c.detail;
    b.append(avatar, name, detail);
    b.onclick = () => {
      state.character = i; applyCharacter(); updateHUD(); save(); renderCharacters();
      window.Sound?.click();
      $('characterList').children[i].focus();
    };
    $('characterList').append(b);
  });
}
$('charactersBack').onclick = showMenu;
$('instructionsButton').onclick = () => { $('menu').hidden = true; $('instructions').hidden = false; $('instructionsBack').focus(); };
$('instructionsBack').onclick = showMenu;
$('newGame').onclick = () => { $('resetConfirm').hidden = false; $('cancelReset').focus(); };
$('cancelReset').onclick = () => { $('resetConfirm').hidden = true; $('newGame').focus(); };
$('confirmReset').onclick = () => {
  const character = state.character; state = freshState(); state.character = character;
  player.position.set(3, 0, 6); player.rotation.y = 0; selected = 0; time = 0;
  cameraAngle = Math.atan2(19, 28); coinMeshes.forEach(c => c.visible = true);
  applyCharacter(); redraw(); updateHUD(); startGame(); toast('Uma nova história começa. Boa colheita!');
};
function interact() {
  if (!isPlaying()) return;
  const npc = nearestNPC(); if (npc) { openConversation(npc); return; }
  if (distance(11, 6) < 3.7) {
    shopOpen = true; clearKeys(); $('shop').style.display = 'grid'; updateHUD();
    window.Sound?.dialog();
    $('close').focus(); return;
  }
  if (near < 0) { toast('Aproxime-se de um canteiro ou do mercado.'); return; }
  const p = state.plots[near];
  if (state.energy < 4) { toast('Hora de descansar! Vá até a casa e pressione R.'); return; }
  if (p.type < 0) {
    if (state.seeds[selected] <= 0) { toast('Compre mais sementes no mercado.'); return; }
    state.seeds[selected]--; p.type = selected; p.age = 0; p.water = false;
    window.Sound?.plant();
    toast('Semente plantada. Pressione Ação/E novamente para regar.');
  } else if (p.age >= crops[p.type].days) {
    state.bag[p.type]++;
    window.Sound?.harvest();
    toast(`${crops[p.type].name} colhida! Venda no mercado.`);
    p.type = -1; p.age = 0; p.water = false;
  } else if (!p.water) {
    p.water = true;
    window.Sound?.water();
    toast('Regado! A planta crescerá quando você dormir.');
  }
  else { toast('Já está regado. Durma para passar ao próximo dia.'); return; }
  state.energy -= 4; redraw(); updateHUD(); save();
}
function sleep() {
  if (!isPlaying()) return;
  if (distance(-8, -7.5) > 3.5) { toast('Vá até a porta de casa para dormir.'); return; }
  state.day++; state.energy = 100;
  state.coins = []; coinMeshes.forEach(c => c.visible = true);
  state.plots.forEach(p => { if (p.type >= 0 && p.water) p.age++; p.water = false; });
  time = 0; redraw(); updateHUD(); save();
  window.Sound?.sleep();
  toast(`Bom dia! Dia ${state.day}. Sua fazenda espera por você.`);
}

// Teclado
addEventListener('keydown', event => {
  if (event.key === 'Tab') {
    const modal = [...document.querySelectorAll('[role="dialog"]')].find(el => el.getClientRects().length > 0);
    if (modal) {
      const buttons = [...modal.querySelectorAll('button:not(:disabled)')].filter(b => b.getClientRects().length);
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }
  if (isPlaying() && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) event.preventDefault();
  if (isPlaying()) keys[event.key.toLowerCase()] = true;
  if (event.repeat) return;
  if (event.key === 'Escape') {
    if (shopOpen) closeShop();
    else if (dialogNPC) closeConversation();
    else if (menuOpen) { if (!$('characters').hidden || !$('instructions').hidden || !$('resetConfirm').hidden) showMenu(); else if (started) startGame(); }
    else showMenu();
    return;
  }
  if (!isPlaying()) return;
  if (event.key.toLowerCase() === 'e') interact();
  if (event.key.toLowerCase() === 'r') sleep();
  if (event.key.toLowerCase() === 'v') changeView();
  if (['1', '2', '3'].includes(event.key)) { selected = +event.key - 1; updateHUD(); window.Sound?.click(); }
});
addEventListener('keyup', event => keys[event.key.toLowerCase()] = false);
addEventListener('blur', () => { clearKeys(); if (isPlaying()) { save(); showMenu(); } });
addEventListener('pagehide', () => { if (started) save(); });
document.querySelectorAll('[data-seed]').forEach(button => button.onclick = () => {
  selected = +button.dataset.seed; updateHUD(); window.Sound?.click();
});
document.querySelectorAll('[data-buy]').forEach(button => button.onclick = () => {
  if (!shopOpen) return;
  const i = +button.dataset.buy;
  if (state.money < crops[i].cost) { toast('Moedas insuficientes.'); return; }
  state.money -= crops[i].cost; state.seeds[i] += 5; updateHUD(); save();
  window.Sound?.sell();
  toast('Sementes compradas!');
});
$('sell').onclick = () => {
  if (!shopOpen) return;
  const total = state.bag.reduce((sum, n, i) => sum + n * crops[i].price, 0);
  if (!total) { toast('Você ainda não tem colheitas para vender.'); return; }
  state.bag = [0, 0, 0];
  window.Sound?.sell();
  addMoney(total, 'Colheita vendida');
};
function closeShop() { shopOpen = false; $('shop').style.display = 'none'; $('close').blur(); clearKeys(); }
$('close').onclick = closeShop;

// 🕹️ Controles Touch / Mobile
let touchX = 0, touchZ = 0;
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 820);
if (isTouchDevice) document.body.classList.add('touch-active');

const touchJoy = $('touchJoy');
const touchKnob = $('touchKnob');
let joyTouchId = null, joyCenter = { x: 0, y: 0 };
const joyRadius = 45;

if (touchJoy && touchKnob) {
  touchJoy.addEventListener('touchstart', e => {
    e.preventDefault();
    if (joyTouchId !== null) return;
    const touch = e.changedTouches[0];
    joyTouchId = touch.identifier;
    const rect = touchJoy.getBoundingClientRect();
    joyCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    handleJoyMove(touch.clientX, touch.clientY);
  }, { passive: false });

  window.addEventListener('touchmove', e => {
    if (joyTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joyTouchId) {
        e.preventDefault();
        handleJoyMove(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  }, { passive: false });

  const endJoy = e => {
    if (joyTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joyTouchId) {
        joyTouchId = null;
        touchX = 0; touchZ = 0;
        touchKnob.style.transform = 'translate(0px, 0px)';
        break;
      }
    }
  };
  window.addEventListener('touchend', endJoy, { passive: true });
  window.addEventListener('touchcancel', endJoy, { passive: true });

  function handleJoyMove(cx, cy) {
    let dx = cx - joyCenter.x;
    let dy = cy - joyCenter.y;
    const dist = Math.hypot(dx, dy);
    if (dist > joyRadius) {
      dx = (dx / dist) * joyRadius;
      dy = (dy / dist) * joyRadius;
    }
    touchKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    touchX = dx / joyRadius;
    touchZ = dy / joyRadius;
  }
}

const touchActionBtn = $('touchActionBtn');
if (touchActionBtn) {
  touchActionBtn.addEventListener('click', e => { e.preventDefault(); interact(); });
  touchActionBtn.addEventListener('touchstart', e => { e.preventDefault(); interact(); }, { passive: false });
}
const touchSleepBtn = $('touchSleepBtn');
if (touchSleepBtn) {
  touchSleepBtn.addEventListener('click', e => { e.preventDefault(); sleep(); });
  touchSleepBtn.addEventListener('touchstart', e => { e.preventDefault(); sleep(); }, { passive: false });
}
const touchCamBtn = $('touchCamBtn');
if (touchCamBtn) {
  touchCamBtn.addEventListener('click', e => { e.preventDefault(); if (isPlaying()) changeView(); });
  touchCamBtn.addEventListener('touchstart', e => { e.preventDefault(); if (isPlaying()) changeView(); }, { passive: false });
}

// Movimento e animação.
const clock = new THREE.Clock(), target = new THREE.Vector3(), camPos = new THREE.Vector3();
const forward = new THREE.Vector3(), cameraOffset = new THREE.Vector3();
let saveElapsed = 0;
camera.position.set(19, 24, 28);
function blockedAt(x, z) {
  return (x > -11.5 && x < -4.5 && z > -13.7 && z < -8.6) ||
    (x > 8.3 && x < 13.7 && z > 4.6 && z < 7.4) || ((x - 14) ** 2 / 24 + (z + 10) ** 2 / 13 < 1);
}
if (blockedAt(player.position.x, player.position.z)) player.position.set(3, 0, 6);

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), .05), playing = isPlaying();
  if (playing) time += dt;
  let x = 0, z = 0;
  if (playing) {
    const kx = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
    const kz = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
    x = kx + touchX;
    z = kz + touchZ;
    cameraAngle += ((keys.f ? 1 : 0) - (keys.q ? 1 : 0)) * dt * 1.4;
  }
  const length = Math.hypot(x, z);
  if (length) {
    camera.getWorldDirection(forward); forward.y = 0; forward.normalize();
    const vx = (-forward.z * x - forward.x * z) / length;
    const vz = (forward.x * x - forward.z * z) / length;
    const speed = Math.min(length, 1);
    const nx = THREE.MathUtils.clamp(player.position.x + vx * dt * 5 * speed, -21, 21);
    const nz = THREE.MathUtils.clamp(player.position.z + vz * dt * 5 * speed, -17, 16);
    if (!blockedAt(nx, player.position.z)) player.position.x = nx;
    if (!blockedAt(player.position.x, nz)) player.position.z = nz;
    player.rotation.y = Math.atan2(vx, vz);
    legL.rotation.x = Math.sin(time * 12) * .6; legR.rotation.x = -legL.rotation.x;
    if (playing) window.Sound?.step();
  } else { legL.rotation.x = 0; legR.rotation.x = 0; }
  
  near = -1; let best = 2;
  plots.forEach((p, i) => { const d = distance(p.x, p.z); if (d < best) { best = d; near = i; } });
  select.visible = near >= 0 && playing;
  if (near >= 0) select.position.set(plots[near].x, .14, plots[near].z);
  
  const isTouch = document.body.classList.contains('touch-active');
  let hint = isTouch ? 'Arraste o joystick para andar' : 'Explore a fazenda · WASD para andar';
  if (near >= 0) {
    const p = state.plots[near];
    hint = p.type < 0 ? (isTouch ? `🌱 Plantar ${crops[selected].name}` : `E · Plantar ${crops[selected].name}`) :
      p.age >= crops[p.type].days ? (isTouch ? `🥕 Colher ${crops[p.type].name}` : `E · Colher ${crops[p.type].name}`) :
      !p.water ? (isTouch ? '💧 Regar canteiro' : 'E · Regar') : '⏳ Regado · Durma para crescer';
  }
  const nearHouse = distance(-8, -7.5) < 3.5;
  const nearMarket = distance(11, 6) < 3.7;
  const npc = nearestNPC();
  if (nearHouse) hint = isTouch ? '🛌 Dormir na casa e avançar o dia' : 'R · Dormir e começar um novo dia';
  if (nearMarket) hint = isTouch ? '🏪 Abrir o mercadinho' : 'E · Abrir o mercadinho';
  if (npc) hint = isTouch ? `💬 Conversar com ${npc.name}` : `E · Conversar com ${npc.name}`;
  $('prompt').textContent = hint;

  // Atualizar botões touch contextuais
  if (touchActionBtn) {
    if (near >= 0) {
      const p = state.plots[near];
      touchActionBtn.textContent = p.type < 0 ? '🌱 Plantar' : p.age >= crops[p.type].days ? '🥕 Colher' : !p.water ? '💧 Regar' : '⏳ Regado';
    } else if (nearMarket) {
      touchActionBtn.textContent = '🏪 Loja';
    } else if (npc) {
      touchActionBtn.textContent = '💬 Falar';
    } else {
      touchActionBtn.textContent = 'Ação';
    }
  }
  if (touchSleepBtn) {
    touchSleepBtn.hidden = !nearHouse;
  }

  chickens.forEach((group, i) => {
    const a = time * .25 + i * 1.8;
    group.position.set(1.8 + Math.sin(a) * 1.4, Math.abs(Math.sin(time * 4 + i)) * .045, 11 + i * .75 + Math.cos(a) * .5);
    group.rotation.y = Math.cos(a) > 0 ? Math.PI / 2 : -Math.PI / 2;
  });
  npcs.forEach(n => { if (playing && distance(n.x, n.z) < 4) n.mesh.rotation.y = Math.atan2(player.position.x - n.x, player.position.z - n.z); });
  coinMeshes.forEach((coin, i) => {
    coin.rotation.z = time * 2 + i; coin.position.y = .7 + Math.sin(time * 3 + i) * .13;
    if (playing && coin.visible && distance(coin.position.x, coin.position.z) < .7) {
      coin.visible = false; state.coins.push(i);
      window.Sound?.coin();
      addMoney(5, 'Moeda encontrada');
    }
  });
  const view = menuOpen ? 0 : state.view;
  const radius = [29, 11, 3][view], height = [25, 10, 38][view];
  target.set(player.position.x * (view === 0 ? .5 : 1), view === 1 ? 1 : 0, player.position.z * (view === 0 ? .5 : 1));
  cameraOffset.set(Math.sin(cameraAngle) * radius, height, Math.cos(cameraAngle) * radius);
  camPos.copy(target).add(cameraOffset);
  camera.position.lerp(camPos, 1 - Math.exp(-dt * 3)); camera.lookAt(target);
  if (playing) { saveElapsed += dt; if (saveElapsed >= 5) { saveElapsed = 0; save(); } }
  renderer.render(scene, camera);
}
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight);
});
updateHUD(); showMenu(); frame();
