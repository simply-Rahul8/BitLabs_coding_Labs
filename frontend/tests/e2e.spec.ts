import { test, expect } from '@playwright/test';

test.describe('BitLabs Coding Lab - E2E Testing Flow', () => {
  // Use sequential mode for this suite so we can watch it happen in order
  test.describe.configure({ mode: 'serial' });

  let page: any;
  const adminEmail = `admin_${Date.now()}@test.com`;
  const candidateEmail = `candidate_${Date.now()}@test.com`;
  const password = 'password123';

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('1. Register Admin Account', async () => {
    await page.goto('/');
    // Assuming there is a login/register link or redirect to /login
    await page.goto('/login');
    // We should implement registration if a UI exists, else just login if the DB is seeded.
    // For now, let's assume the user can click "Sign up" 
    await page.click('text=Sign up');
    await page.fill('input[name="username"]', adminEmail);
    await page.fill('input[name="password"]', password);
    // Assuming there is a role selector for Recruiter
    await page.selectOption('select[name="role"]', 'recruiter');
    await page.click('button[type="submit"]');

    // Verify redirection to recruiter dashboard
    await expect(page.locator('text=Assessments')).toBeVisible({ timeout: 10000 });
  });

  test('2. Create Assessment (Admin Flow)', async () => {
    await page.click('text=Create Assessment');
    await page.fill('input[name="title"]', 'E2E Test Assessment');
    await page.fill('textarea[name="description"]', 'Write a function to return the sum of a and b.');
    await page.selectOption('select[name="language"]', 'python');
    await page.selectOption('select[name="difficulty"]', 'easy');
    
    // Test AI Generate Test Cases
    await page.click('text=Generate with AI');
    // Wait for tests to generate
    await expect(page.locator('text=AI-generated test cases')).toBeVisible({ timeout: 15000 });
    
    await page.click('button:has-text("Create Assessment")');
    // Verify it appears in list
    await expect(page.locator('text=E2E Test Assessment')).toBeVisible({ timeout: 10000 });
    
    // Logout
    await page.click('text=Logout');
  });

  test('3. Register Candidate Account', async () => {
    await page.goto('/login');
    await page.click('text=Sign up');
    await page.fill('input[name="username"]', candidateEmail);
    await page.fill('input[name="password"]', password);
    // Select Candidate role
    await page.selectOption('select[name="role"]', 'candidate');
    await page.click('button[type="submit"]');

    // Verify redirection to candidate dashboard
    await expect(page.locator('text=Available Assessments')).toBeVisible({ timeout: 10000 });
  });

  test('4. Practice Flow (Candidate)', async () => {
    await page.click('text=Practice');
    await page.fill('.monaco-editor textarea', 'print("Hello Practice")');
    await page.click('text=Run Code');
    
    // Verify output
    await expect(page.locator('text=Hello Practice')).toBeVisible({ timeout: 15000 });
  });
});
