import { test, expect } from '@playwright/test';

// Generate a random room ID to avoid collisions
const roomId = `room-${Date.now()}`;

// Helper function to log in a user
async function login(page, nickname, roomId) {
  await page.goto('/');
  await page.getByPlaceholder('输入你的昵称').fill(nickname);
  await page.getByPlaceholder('输入房间号').fill(roomId);
  await page.getByRole('button', { name: '进入游戏' }).click();
  await expect(page.getByText('等待玩家加入...')).toBeVisible({ timeout: 10000 });
}

test('Multiplayer flow: Join, Ready, and Start Game', async ({ browser }) => {
  // Create two separate browser contexts
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  // 1. Player 1 joins
  console.log('Player 1 joining...');
  await login(page1, 'Player1', roomId);
  await expect(page1.getByText('至少需要2名玩家开始游戏')).toBeVisible();

  // 2. Player 2 joins
  console.log('Player 2 joining...');
  await login(page2, 'Player2', roomId);

  await expect(page1.getByRole('button', { name: '我准备好了' })).toBeVisible();
  await expect(page2.getByRole('button', { name: '我准备好了' })).toBeVisible();

  console.log('Player 1 clicking Ready...');
  await page1.getByRole('button', { name: '我准备好了' }).click();

  console.log('Player 2 clicking Ready...');
  await page2.getByRole('button', { name: '我准备好了' }).click();
  await expect(page1.getByText('等待玩家加入...')).toBeHidden({ timeout: 10000 });
  await expect(page2.getByText('等待玩家加入...')).toBeHidden({ timeout: 10000 });

  // Close contexts
  await context1.close();
  await context2.close();
});
