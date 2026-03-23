import { expect, test } from '@playwright/test';

function randomRoomId() {
  return `audio-e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

async function loginPlayer(page, nickname, roomId, maxPlayers) {
  await page.goto('/');
  await page.getByPlaceholder('输入你的昵称').fill(nickname);
  await page.getByPlaceholder('输入房间号').fill(roomId);
  await page.locator('input[placeholder="9"]').fill(String(maxPlayers));
  await page.getByRole('button', { name: '进入游戏' }).click();
  await expect(page.getByRole('button', { name: '退出游戏' })).toBeVisible({ timeout: 15000 });
}

function attachSoundResponseObserver(page, label, soundResponses, failedSoundResponses) {
  page.on('response', (response) => {
    const url = response.url();
    if (!url.includes('/assets/snd/')) {
      return;
    }

    const line = `${response.status()} [${label}] ${url}`;
    soundResponses.push(line);
    if (!response.ok()) {
      failedSoundResponses.push(line);
    }
  });
}

test('交互阶段音频请求无404（发牌/下注后）', async ({ browser }) => {
  const roomId = randomRoomId();
  const contexts = [];
  const pages = [];
  const soundResponses = [];
  const failedSoundResponses = [];

  try {
    for (let i = 0; i < 2; i += 1) {
      const context = await browser.newContext();
      const page = await context.newPage();
      contexts.push(context);
      pages.push(page);
      attachSoundResponseObserver(page, `P${i + 1}`, soundResponses, failedSoundResponses);
      await loginPlayer(page, `S${i + 1}`, roomId, 2);
    }

    for (const page of pages) {
      await expect(page.getByRole('button', { name: '我准备好了' })).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: '我准备好了' }).click();
    }

    await expect(pages[0].getByRole('button', { name: '房主开始首局' })).toBeEnabled({ timeout: 12000 });
    await pages[0].getByRole('button', { name: '房主开始首局' }).click();

    for (const page of pages) {
      await expect(page.getByRole('button', { name: '弃牌' })).toBeVisible({ timeout: 20000 });
    }

    const actionPage = pages[0];
    const actionBtn = actionPage.getByRole('button', { name: /(跟注|过牌)/ });
    await expect(actionBtn).toBeEnabled({ timeout: 10000 });
    await actionBtn.click();

    // 给交互触发的音效请求留出时间窗口
    await pages[0].waitForTimeout(1800);

    expect(
      soundResponses.length,
      '未捕获到任何音频请求，无法验证交互阶段音频状态'
    ).toBeGreaterThan(0);

    expect(
      failedSoundResponses,
      `交互阶段存在音频请求失败:\n${failedSoundResponses.join('\n')}`
    ).toEqual([]);
  } finally {
    await Promise.all(contexts.map((ctx) => ctx.close()));
  }
});
