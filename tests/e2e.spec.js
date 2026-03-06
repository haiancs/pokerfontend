import { test, expect } from '@playwright/test';

test('should allow user to login and join a room', async ({ page }) => {
  // Go to the home page
  await page.goto('/');

  // Fill in the nickname
  await page.getByPlaceholder('输入你的昵称').fill('TestUser');

  // Fill in the room ID
  await page.getByPlaceholder('输入房间号').fill('123456');

  // Click the join button
  await page.getByRole('button', { name: '进入房间' }).click();

  // Wait for the "Connected" indicator
  // The text is "已连接"
  await expect(page.getByText('已连接')).toBeVisible({ timeout: 10000 });

  // Check if the user is in the room
  // Use a more specific locator or regex to avoid strict mode violation
  await expect(page.getByText('等待玩家加入... (需至少2人开始)')).toBeVisible();
  
  // Verify the user's nickname is displayed on the screen (in the player list or stats)
  await expect(page.getByText('TestUser')).toBeVisible();
});
