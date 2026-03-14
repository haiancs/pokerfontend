import { test, expect } from '@playwright/test';

test('should allow user to login and join a room', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('输入你的昵称').fill('TestUser');
  await page.getByPlaceholder('输入房间号').fill('123456');
  await page.getByRole('button', { name: '进入游戏' }).click();
  await expect(page.getByText('等待玩家加入...')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('至少需要2名玩家开始游戏')).toBeVisible();
  await expect(page.getByText('TestUser')).toBeVisible();
});
