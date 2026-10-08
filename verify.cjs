const { chromium } = require('C:/Users/evand/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async () => {
  let browser;
  try { browser = await chromium.launch({ headless: true }); }
  catch { browser = await chromium.launch({ headless: true, channel: 'msedge' }); }
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(path.join(__dirname, 'index.html')).href);
    await page.waitForFunction(() => typeof scene !== 'undefined' && document.querySelector('canvas'), { timeout: 30000 });
    assert(await page.locator('#menu').isVisible());
    await page.screenshot({ path: path.join(__dirname, 'menu-preview.png') });
    await page.click('#charactersButton');
    await page.locator('.character-card').nth(2).click();
    assert.equal(await page.evaluate(() => state.character), 2);
    await page.click('#charactersBack'); await page.click('#play');
    for (let i = 1; i <= 3; i++) {
      await page.keyboard.press('v');
      assert.equal(await page.evaluate(() => state.view), i % 3);
    }
    // Pausa bloqueia movimento e coleta.
    await page.keyboard.press('Escape');
    const pos = await page.evaluate(() => [player.position.x, player.position.z]);
    await page.keyboard.down('w'); await page.waitForTimeout(150); await page.keyboard.up('w');
    assert.deepEqual(await page.evaluate(() => [player.position.x, player.position.z]), pos);
    await page.click('#play');
    // Plantio, rega, descanso e colheita através dos controles reais.
    await page.evaluate(() => player.position.set(-10, 0, -3));
    await page.waitForTimeout(100); await page.keyboard.press('e'); await page.keyboard.press('e');
    assert.equal(await page.evaluate(() => state.plots[0].water), true);
    await page.evaluate(() => player.position.set(-8, 0, -7));
    await page.keyboard.press('r');
    assert.equal(await page.evaluate(() => state.plots[0].age), 1);
    await page.evaluate(() => player.position.set(-10, 0, -3));
    await page.waitForTimeout(100); await page.keyboard.press('e');
    assert.equal(await page.evaluate(() => state.bag[0]), 1);
    // Coleta não se repete enquanto o jogador permanece sobre a moeda.
    const before = await page.evaluate(() => state.money);
    await page.evaluate(() => player.position.set(3, 0, 9)); await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => state.money), before + 5);
    await page.waitForTimeout(200); assert.equal(await page.evaluate(() => state.money), before + 5);
    // Venda e compra usam os valores exibidos; saldo insuficiente bloqueia compra.
    await page.evaluate(() => player.position.set(11, 0, 8)); await page.waitForTimeout(100);
    await page.keyboard.press('e'); assert(await page.locator('#shop').isVisible());
    await page.click('#sell'); assert.equal(await page.evaluate(() => state.money), before + 19);
    const seeds = await page.evaluate(() => state.seeds[0]);
    await page.click('[data-buy="0"]'); assert.equal(await page.evaluate(() => state.seeds[0]), seeds + 5);
    await page.evaluate(() => { state.money = 0; updateHUD(); });
    assert(await page.locator('[data-buy="0"]').isDisabled());
    await page.click('#close');
    // Encomendas pagam uma única vez e consomem a quantidade correta.
    await page.evaluate(() => { state.bag[0] = 3; player.position.set(4, 0, -4.5); });
    await page.keyboard.press('e'); await page.click('#deliver');
    assert.equal(await page.evaluate(() => state.money), 65);
    assert.equal(await page.evaluate(() => state.bag[0]), 0);
    assert(await page.locator('#deliver').isHidden());
    await page.click('#dialogClose');
    await page.keyboard.press('e'); assert(await page.locator('#deliver').isHidden());
    await page.click('#dialogClose');
    // Salvamento e recarga preservam seleção, moedas e encomendas.
    await page.evaluate(() => save()); await page.reload();
    await page.waitForFunction(() => typeof state !== 'undefined');
    assert.equal(await page.evaluate(() => state.character), 2);
    assert.equal(await page.evaluate(() => state.money), 65);
    assert.deepEqual(await page.evaluate(() => state.completed), ['lina']);
    await page.click('#play'); await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(__dirname, 'game-preview.png') });
    // Reinício pede confirmação e reconstitui o estado inicial.
    await page.click('#menuButton'); await page.click('#newGame');
    await page.click('#cancelReset'); assert.equal(await page.evaluate(() => state.money), 65);
    await page.click('#newGame'); await page.click('#confirmReset');
    assert.equal(await page.evaluate(() => state.money), 60);
    assert.equal(await page.evaluate(() => state.day), 1);
    assert.equal(await page.evaluate(() => state.completed.length), 0);
    assert.equal(await page.evaluate(() => state.coins.length), 0);
    // Movimento deve manter W para frente em todas as visões, mesmo após girar.
    for (const view of [0, 1, 2]) {
      await page.evaluate(v => { state.view = v; player.position.set(0, 0, 10); cameraAngle = 1.5; }, view);
      await page.waitForTimeout(900);
      const beforeMove = await page.evaluate(() => {
        const f = new THREE.Vector3(); camera.getWorldDirection(f); f.y = 0; f.normalize();
        return { x: player.position.x, z: player.position.z, fx: f.x, fz: f.z };
      });
      await page.keyboard.down('w'); await page.waitForTimeout(250); await page.keyboard.up('w');
      const afterMove = await page.evaluate(() => ({ x: player.position.x, z: player.position.z }));
      assert((afterMove.x - beforeMove.x) * beforeMove.fx + (afterMove.z - beforeMove.z) * beforeMove.fz > .1);
    }
    // Migração de um salvamento do jogo original.
    await page.evaluate(() => {
      const legacy = { day: 4, money: 123, energy: 80, seeds: [2, 3, 4], bag: [1, 0, 0], plots: Array.from({length: 24}, () => ({type: -1, age: 0, water: false})), won: false };
      started = false;
      localStorage.setItem('aurora-v1', JSON.stringify(legacy));
    });
    await page.reload(); await page.waitForFunction(() => document.querySelector('canvas'));
    assert.equal(await page.evaluate(() => state.money), 123);
    assert.equal(await page.evaluate(() => state.day), 4);
    assert.equal(await page.evaluate(() => state.character), 0);
    assert.deepEqual(await page.evaluate(() => state.coins), []);
    assert.deepEqual(errors, []);
    console.log('PASS: menus, personagens, câmeras, movimento relativo à câmera, pausa, plantio, colheita, moedas, loja, encomendas, salvamento, migração e reinício.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
