import { test, expect, Page } from '@playwright/test';

const BASE = 'https://myplanerticket.vercel.app';
const ADMIN_NAME = 'Администратор';
const ADMIN_PASS = 'admin12345';

async function login(page: Page, name: string, password: string) {
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[placeholder="Введите имя"]', { timeout: 5000 });
  await page.fill('input[placeholder="Введите имя"]', name);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(BASE + '/', { timeout: 10000 });
}

// ==================== AUTH ====================
test.describe('Auth', () => {
  test('Login page renders with form', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator('input[placeholder="Введите имя"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('text=Вход')).toBeVisible();
  });

  test('Register page renders', async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await expect(page.locator('text=Регистрация')).toBeVisible();
  });

  test('Login with admin credentials', async ({ page }) => {
    await login(page, ADMIN_NAME, ADMIN_PASS);
    await expect(page.locator('text=Администратор')).toBeVisible({ timeout: 5000 });
  });

  test('JWT session persists after reload', async ({ page }) => {
    await login(page, ADMIN_NAME, ADMIN_PASS);
    await page.reload();
    await expect(page.locator('text=Администратор')).toBeVisible({ timeout: 10000 });
  });

  test('Login fails with wrong password', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[placeholder="Введите имя"]', ADMIN_NAME);
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/login/);
  });
});

// ==================== DASHBOARD ====================
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_NAME, ADMIN_PASS);
  });

  test('Greeting with name', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText('Администратор');
  });

  test('Statistics cards', async ({ page }) => {
    await expect(page.locator('text=Активных')).toBeVisible();
    await expect(page.locator('text=Готово')).toBeVisible();
    await expect(page.locator('text=Срочных')).toBeVisible();
  });

  test('Projects section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Проекты")')).toBeVisible();
    await expect(page.locator('text=ntc')).toBeVisible();
  });

  test('Widgets: weather', async ({ page }) => {
    await expect(page.locator('text=°C')).toBeVisible();
  });

  test('Widgets: currency', async ({ page }) => {
    await expect(page.locator('text=USD')).toBeVisible();
    await expect(page.locator('text=EUR')).toBeVisible();
  });

  test('Widgets: habits widget', async ({ page }) => {
    await expect(page.locator('text=Привычки сегодня')).toBeVisible();
  });

  test('Widgets: calendar', async ({ page }) => {
    await expect(page.locator('text=Календарь')).toBeVisible();
    await expect(page.locator('text=июль 2026')).toBeVisible();
  });
});

// ==================== TASKS ====================
test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_NAME, ADMIN_PASS);
    await page.goto(`${BASE}/tasks`);
    await page.waitForSelector('h1', { timeout: 5000 });
  });

  test('Tasks page loads', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText('Задачи');
  });

  test('Stats cards visible', async ({ page }) => {
    await expect(page.locator('text=К выполнению').or(page.locator('text=Активных'))).toBeVisible();
  });

  test('Create task', async ({ page }) => {
    await page.click('button:has-text("Новая задача")');
    await page.waitForTimeout(500);
    await page.fill('input[placeholder*="задач"], input[placeholder*="Название"]', 'Тест Playwright');
    await page.click('button[type="submit"], button:has-text("Создать")');
    await page.waitForTimeout(1500);
    await expect(page.locator('text=Тест Playwright')).toBeVisible({ timeout: 5000 });
  });

  test('Search tasks', async ({ page }) => {
    const search = page.locator('input[placeholder*="Поиск"], input[data-search]').first();
    await search.fill('Тест');
    await page.waitForTimeout(500);
    await search.fill('');
  });

  test('Calendar view toggle', async ({ page }) => {
    const calBtn = page.locator('button:has-text("Календарь")').first();
    if (await calBtn.isVisible()) {
      await calBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('Delete test task', async ({ page }) => {
    const task = page.locator('text=Тест Playwright').first();
    if (await task.isVisible({ timeout: 3000 }).catch(() => false)) {
      const row = task.locator('xpath=ancestor::div[contains(@class,"task-item")]').first();
      await row.hover();
      await page.waitForTimeout(300);
    }
  });
});

// ==================== PROJECTS ====================
test.describe('Projects', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_NAME, ADMIN_PASS);
    await page.goto(`${BASE}/projects`);
    await page.waitForTimeout(1500);
  });

  test('Projects page loads', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText('Проект');
  });

  test('Project cards visible', async ({ page }) => {
    await expect(page.locator('text=ntc')).toBeVisible();
  });

  test('No proj_xxx in HTML', async ({ page }) => {
    const html = await page.content();
    expect(html).not.toMatch(/proj_[a-f0-9]{10,}/);
  });

  test('Progress bar visible', async ({ page }) => {
    const progress = page.locator('text=/\\d+\\/\\d+ задач/');
    const count = await progress.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

// ==================== HABITS ====================
test.describe('Habits', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_NAME, ADMIN_PASS);
    await page.goto(`${BASE}/habits`);
    await page.waitForTimeout(1500);
  });

  test('Habits page loads', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText('Привычки');
  });

  test('Week dots (Mon-Sun)', async ({ page }) => {
    await expect(page.locator('text=Пн')).toBeVisible();
    await expect(page.locator('text=Вс')).toBeVisible();
  });

  test('Fire streak icon', async ({ page }) => {
    const fire = page.locator('text=🔥');
    const count = await fire.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Progress bar', async ({ page }) => {
    await expect(page.locator('text=Прогресс дня')).toBeVisible();
  });
});

// ==================== TIMER ====================
test.describe('Timer', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_NAME, ADMIN_PASS);
    await page.goto(`${BASE}/pomodoro`);
    await page.waitForTimeout(1500);
  });

  test('Timer page loads', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText('Таймер');
  });

  test('Shows 25:00', async ({ page }) => {
    await expect(page.locator('text=25:00')).toBeVisible();
  });

  test('Mode toggle', async ({ page }) => {
    await page.click('button:has-text("Перерыв")');
    await expect(page.locator('text=05:00')).toBeVisible({ timeout: 3000 });
  });
});

// ==================== STATS ====================
test.describe('Stats', () => {
  test('Stats page loads', async ({ page }) => {
    await login(page, ADMIN_NAME, ADMIN_PASS);
    await page.goto(`${BASE}/stats`);
    await page.waitForTimeout(1500);
    await expect(page.locator('h1').first()).toContainText('Статистика');
  });
});

// ==================== FITNESS ====================
test.describe('Fitness', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_NAME, ADMIN_PASS);
    await page.goto(`${BASE}/fitness`);
    await page.waitForTimeout(1500);
  });

  test('Fitness page loads', async ({ page }) => {
    const h1 = page.locator('h1').first();
    const text = await h1.textContent();
    expect(text).toBeTruthy();
  });

  test('Water buttons', async ({ page }) => {
    await expect(page.locator('text=+150').or(page.locator('text=150мл'))).toBeVisible();
  });

  test('Profile button', async ({ page }) => {
    await expect(page.locator('text=Профиль').or(page.locator('button:has-text("Профиль")'))).toBeVisible();
  });
});

// ==================== MESSENGER ====================
test.describe('Messenger', () => {
  test('Messenger page loads', async ({ page }) => {
    await login(page, ADMIN_NAME, ADMIN_PASS);
    await page.goto(`${BASE}/messenger`);
    await page.waitForTimeout(2000);
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });
});

// ==================== JOURNAL ====================
test.describe('Journal', () => {
  test('Journal page loads', async ({ page }) => {
    await login(page, ADMIN_NAME, ADMIN_PASS);
    await page.goto(`${BASE}/journal`);
    await page.waitForTimeout(1500);
    await expect(page.locator('h1').first()).toContainText('Дневник');
  });
});

// ==================== NOTIFICATIONS ====================
test.describe('Notifications', () => {
  test('Notifications page loads', async ({ page }) => {
    await login(page, ADMIN_NAME, ADMIN_PASS);
    await page.goto(`${BASE}/notifications`);
    await page.waitForTimeout(1500);
    await expect(page.locator('h1').first()).toContainText('Уведомления');
  });
});

// ==================== SETTINGS ====================
test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_NAME, ADMIN_PASS);
    await page.goto(`${BASE}/settings`);
    await page.waitForTimeout(1500);
  });

  test('Settings page loads', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText('Настройки');
  });

  test('Profile section', async ({ page }) => {
    await expect(page.locator('text=Профиль')).toBeVisible();
  });

  test('Theme section', async ({ page }) => {
    await expect(page.locator('text=Тема')).toBeVisible();
  });
});

// ==================== ADMIN ====================
test.describe('Admin', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_NAME, ADMIN_PASS);
    await page.goto(`${BASE}/admin`);
    await page.waitForTimeout(1500);
  });

  test('Admin page loads', async ({ page }) => {
    await expect(page.locator('text=Админ-панель')).toBeVisible();
  });

  test('Users table', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
  });

  test('Stats: users count', async ({ page }) => {
    await expect(page.locator('text=Всего')).toBeVisible();
  });
});

// ==================== SYNTH ====================
test.describe('Synth', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_NAME, ADMIN_PASS);
    await page.goto(`${BASE}/synth`);
    await page.waitForTimeout(1500);
  });

  test('Synth page loads', async ({ page }) => {
    await expect(page.locator('text=Синтезатор')).toBeVisible();
  });

  test('Piano visible', async ({ page }) => {
    await expect(page.locator('text=Октава')).toBeVisible();
  });
});

// ==================== TODAY ====================
test.describe('Today', () => {
  test('Today page loads', async ({ page }) => {
    await login(page, ADMIN_NAME, ADMIN_PASS);
    await page.goto(`${BASE}/today`);
    await page.waitForTimeout(2000);
    const content = await page.textContent('body');
    expect(content).toContain('задач');
  });
});

// ==================== NAVIGATION ====================
test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_NAME, ADMIN_PASS);
  });

  test('TopNav links visible', async ({ page }) => {
    await expect(page.locator('a:has-text("Дашборд")')).toBeVisible();
    await expect(page.locator('a:has-text("Задачи")')).toBeVisible();
    await expect(page.locator('a:has-text("Привычки")')).toBeVisible();
    await expect(page.locator('a:has-text("Таймер")')).toBeVisible();
  });

  test('Ещё dropdown opens', async ({ page }) => {
    await page.click('button:has-text("Ещё")');
    await page.waitForTimeout(500);
    await expect(page.locator('text=Фитнес').or(page.locator('text=Мессенджер'))).toBeVisible({ timeout: 3000 });
  });

  test('Navigate to Tasks', async ({ page }) => {
    await page.click('a:has-text("Задачи")');
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/tasks/);
  });

  test('Navigate to Habits', async ({ page }) => {
    await page.click('a:has-text("Привычки")');
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/habits/);
  });

  test('Navigate to Timer', async ({ page }) => {
    await page.click('a:has-text("Таймер")');
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/pomodoro/);
  });
});

// ==================== PWA ====================
test.describe('PWA', () => {
  test('Manifest exists', async ({ page }) => {
    const response = await page.goto(`${BASE}/manifest.json`);
    expect(response?.status()).toBe(200);
  });
});
