import { test, expect } from '@playwright/test';

// Generate a random room ID to avoid collisions
const roomId = `room-${Date.now()}`;

// Helper function to log in a user
async function login(page, nickname, roomId) {
  await page.goto('/');
  await page.getByPlaceholder('输入你的昵称').fill(nickname);
  await page.getByPlaceholder('输入房间号').fill(roomId);
  await page.getByRole('button', { name: '进入房间' }).click();
  // Wait for connection
  await expect(page.getByText('已连接')).toBeVisible({ timeout: 10000 });
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
  // Verify Player 1 is waiting
  await expect(page1.getByText('等待玩家加入... (需至少2人开始)')).toBeVisible();

  // 2. Player 2 joins
  console.log('Player 2 joining...');
  await login(page2, 'Player2', roomId);

  // 3. Verify both players see each other
  // Player 1 should see Player 2 joined (count update or ready button appears)
  // When 2 players are present, the "Ready" button should appear
  await expect(page1.getByRole('button', { name: '准备开始' })).toBeVisible();
  await expect(page2.getByRole('button', { name: '准备开始' })).toBeVisible();

  // 4. Both players click Ready
  console.log('Player 1 clicking Ready...');
  await page1.getByRole('button', { name: '准备开始' }).click();
  await expect(page1.getByText('已准备 (等待开始...)')).toBeVisible();

  console.log('Player 2 clicking Ready...');
  await page2.getByRole('button', { name: '准备开始' }).click();
  // After both ready, game should start. The "Ready" button should disappear.
  await expect(page2.getByRole('button', { name: '已准备' })).toBeHidden({ timeout: 10000 });
  await expect(page1.getByRole('button', { name: '已准备' })).toBeHidden({ timeout: 10000 });

  // 5. Verify Game Started
  // Check for presence of cards or action panel enabled state
  // Someone should be the dealer, someone should be active
  console.log('Game started, checking turn...');

  // Check if at least one player has "轮到你了" in ActionPanel
  // ActionPanel has a text "轮到你了" or "等待中"
  // We need to wait a bit for the game start animation/state update
  
  // Use Promise.race or check both pages
  // We expect one of them to be active.
  
  // Let's wait for the "Pot" or "Blinds" to be posted, or just check ActionPanel status
  // ActionPanel is always visible.
  
  const p1Status = page1.locator('text=轮到你了');
  const p2Status = page2.locator('text=轮到你了');
  
  // Wait for either P1 or P2 to be active
  await Promise.any([
    p1Status.waitFor({ state: 'visible', timeout: 10000 }),
    p2Status.waitFor({ state: 'visible', timeout: 10000 })
  ]);

  const isP1Active = await p1Status.isVisible();
  console.log(`Player 1 active: ${isP1Active}`);
  
  if (isP1Active) {
      await expect(page2.locator('text=等待中')).toBeVisible();
      // Player 1 performs an action (e.g., Call or Check)
      const callBtn = page1.getByRole('button', { name: '跟注' });
      const checkBtn = page1.getByRole('button', { name: '过牌' });
      if (await callBtn.isVisible()) {
          await callBtn.click();
      } else {
          await checkBtn.click();
      }
      
      // Now it should be Player 2's turn
      await expect(p2Status).toBeVisible({ timeout: 5000 });
  } else {
      await expect(page1.locator('text=等待中')).toBeVisible();
      // Player 2 acts
      const callBtn = page2.getByRole('button', { name: '跟注' });
      const checkBtn = page2.getByRole('button', { name: '过牌' });
      if (await callBtn.isVisible()) {
          await callBtn.click();
      } else {
          await checkBtn.click();
      }
      // Now P1 should be active
      await expect(p1Status).toBeVisible({ timeout: 5000 });
  }

  console.log('Turn transition verified.');

  // Close contexts
  await context1.close();
  await context2.close();
});
