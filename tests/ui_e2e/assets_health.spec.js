import { expect, test } from '@playwright/test';

const criticalAssetSuffixes = [
  'assets/img/cards.png',
  'assets/img/card_backs.png',
  'assets/fonts/m6x11plus.ttf',
  'assets/snd/chips1.ogg',
  'assets/snd/chips2.ogg',
  'assets/snd/cardSlide1.ogg',
  'assets/snd/cardSlide2.ogg',
  'assets/snd/coin1.ogg',
  'assets/snd/button.ogg',
];

test('关键游戏素材可访问（含音频）', async ({ page, request, baseURL }) => {
  const failedAssetResponses = [];
  const candidatePrefixes = ['/', '/pokerfontend/'];

  page.on('response', (response) => {
    const url = response.url();
    if (!url.includes('/assets/')) {
      return;
    }
    if (!response.ok()) {
      failedAssetResponses.push(`${response.status()} ${url}`);
    }
  });

  await page.goto('/');
  await expect(page.getByRole('button', { name: '进入游戏' })).toBeVisible();

  for (const suffix of criticalAssetSuffixes) {
    const candidates = candidatePrefixes.map((prefix) => {
      const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
      return new URL(`${normalizedPrefix}${suffix}`, baseURL).toString();
    });

    let found = false;
    for (const assetUrl of candidates) {
      const response = await request.get(assetUrl);
      if (response.ok()) {
        found = true;
        break;
      }
    }

    expect(found, `素材不可访问（已尝试多个路径）: ${suffix}`).toBeTruthy();
  }

  expect(
    failedAssetResponses,
    `页面加载阶段出现 assets 请求失败:\n${failedAssetResponses.join('\n')}`
  ).toEqual([]);
});
