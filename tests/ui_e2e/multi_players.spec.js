import { expect, test } from '@playwright/test';

const defaultCounts = '2,6,9';
const playerCounts = (process.env.E2E_UI_PLAYER_COUNTS || defaultCounts)
  .split(',')
  .map((n) => Number(n.trim()))
  .filter((n) => Number.isInteger(n) && n >= 2 && n <= 9);

function randomRoomId() {
  return `ui-e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

async function loginPlayer(page, nickname, roomId, maxPlayers) {
  await page.goto('/');
  await page.getByPlaceholder('输入你的昵称').fill(nickname);
  await page.getByPlaceholder('输入房间号').fill(roomId);
  await page.locator('input[placeholder="9"]').fill(String(maxPlayers));
  await page.getByRole('button', { name: '进入游戏' }).click();
  // 进入牌桌页面后，右上角退出按钮始终存在，可作为登录成功锚点。
  await expect(page.getByRole('button', { name: '退出游戏' })).toBeVisible({ timeout: 15000 });
}

async function findEnabledActionPage(pages, timeoutMs = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const enabled = [];
    for (const page of pages) {
      const foldBtn = page.getByRole('button', { name: '弃牌' });
      if (!(await foldBtn.isVisible())) {
        continue;
      }
      if (!(await foldBtn.isDisabled())) {
        enabled.push(page);
      }
    }
    if (enabled.length >= 1) {
      return enabled[0];
    }
    await pages[0].waitForTimeout(120);
  }
  throw new Error('未找到可操作玩家页面');
}

for (const playerCount of playerCounts) {
  test(`UI多前端流程（${playerCount}人）`, async ({ browser }) => {
    const roomId = randomRoomId();
    const contexts = [];
    const pages = [];
    try {
      for (let i = 0; i < playerCount; i += 1) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
        await loginPlayer(page, `U${i + 1}`, roomId, playerCount);
      }

      for (const page of pages) {
        await expect(page.getByRole('button', { name: '我准备好了' })).toBeVisible({ timeout: 15000 });
      }

      for (const page of pages) {
        await page.getByRole('button', { name: '我准备好了' }).click();
      }

      await expect(pages[0].getByRole('button', { name: '房主开始首局' })).toBeEnabled({ timeout: 12000 });
      await pages[0].getByRole('button', { name: '房主开始首局' }).click();

      for (const page of pages) {
        await expect(page.getByRole('button', { name: '弃牌' })).toBeVisible({ timeout: 20000 });
      }

      const activePage = await findEnabledActionPage(pages);
      const actionBtn = activePage.getByRole('button', { name: /(跟注|过牌)/ });
      await expect(actionBtn).toBeEnabled();
      await actionBtn.click();
    } finally {
      await Promise.all(contexts.map((ctx) => ctx.close()));
    }
  });
}
