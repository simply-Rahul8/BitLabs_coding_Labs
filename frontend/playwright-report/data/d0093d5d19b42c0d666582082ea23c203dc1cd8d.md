# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> BitLabs Coding Lab - E2E Testing Flow >> 1. Register Admin Account
- Location: tests\e2e.spec.ts:20:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Target page, context or browser has been closed
Call log:
  - waiting for locator('text=Sign up')

```

# Page snapshot

```yaml
- generic [ref=f1e4]:
  - generic [ref=f1e5]:
    - heading "BitLabs Coding Lab" [level=1] [ref=f1e9]
    - paragraph [ref=f1e10]: Sign in to your account
  - generic [ref=f1e11]:
    - generic [ref=f1e12]:
      - generic [ref=f1e13]:
        - generic [ref=f1e14]: Email address
        - textbox "Email address" [ref=f1e15]:
          - /placeholder: you@example.com
      - generic [ref=f1e16]:
        - generic [ref=f1e17]: Password
        - textbox "Password" [ref=f1e18]:
          - /placeholder: ••••••••
      - button "Sign in" [ref=f1e19] [cursor=pointer]
    - generic [ref=f1e20]:
      - text: Don't have an account?
      - button "Create one" [ref=f1e21] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('BitLabs Coding Lab - E2E Testing Flow', () => {
  4  |   // Use sequential mode for this suite so we can watch it happen in order
  5  |   test.describe.configure({ mode: 'serial' });
  6  | 
  7  |   let page: any;
  8  |   const adminEmail = `admin_${Date.now()}@test.com`;
  9  |   const candidateEmail = `candidate_${Date.now()}@test.com`;
  10 |   const password = 'password123';
  11 | 
  12 |   test.beforeAll(async ({ browser }) => {
  13 |     page = await browser.newPage();
  14 |   });
  15 | 
  16 |   test.afterAll(async () => {
  17 |     await page.close();
  18 |   });
  19 | 
  20 |   test('1. Register Admin Account', async () => {
  21 |     await page.goto('/');
  22 |     // Assuming there is a login/register link or redirect to /login
  23 |     await page.goto('/login');
  24 |     // We should implement registration if a UI exists, else just login if the DB is seeded.
  25 |     // For now, let's assume the user can click "Sign up" 
> 26 |     await page.click('text=Sign up');
     |                ^ Error: page.click: Target page, context or browser has been closed
  27 |     await page.fill('input[name="username"]', adminEmail);
  28 |     await page.fill('input[name="password"]', password);
  29 |     // Assuming there is a role selector for Recruiter
  30 |     await page.selectOption('select[name="role"]', 'recruiter');
  31 |     await page.click('button[type="submit"]');
  32 | 
  33 |     // Verify redirection to recruiter dashboard
  34 |     await expect(page.locator('text=Assessments')).toBeVisible({ timeout: 10000 });
  35 |   });
  36 | 
  37 |   test('2. Create Assessment (Admin Flow)', async () => {
  38 |     await page.click('text=Create Assessment');
  39 |     await page.fill('input[name="title"]', 'E2E Test Assessment');
  40 |     await page.fill('textarea[name="description"]', 'Write a function to return the sum of a and b.');
  41 |     await page.selectOption('select[name="language"]', 'python');
  42 |     await page.selectOption('select[name="difficulty"]', 'easy');
  43 |     
  44 |     // Test AI Generate Test Cases
  45 |     await page.click('text=Generate with AI');
  46 |     // Wait for tests to generate
  47 |     await expect(page.locator('text=AI-generated test cases')).toBeVisible({ timeout: 15000 });
  48 |     
  49 |     await page.click('button:has-text("Create Assessment")');
  50 |     // Verify it appears in list
  51 |     await expect(page.locator('text=E2E Test Assessment')).toBeVisible({ timeout: 10000 });
  52 |     
  53 |     // Logout
  54 |     await page.click('text=Logout');
  55 |   });
  56 | 
  57 |   test('3. Register Candidate Account', async () => {
  58 |     await page.goto('/login');
  59 |     await page.click('text=Sign up');
  60 |     await page.fill('input[name="username"]', candidateEmail);
  61 |     await page.fill('input[name="password"]', password);
  62 |     // Select Candidate role
  63 |     await page.selectOption('select[name="role"]', 'candidate');
  64 |     await page.click('button[type="submit"]');
  65 | 
  66 |     // Verify redirection to candidate dashboard
  67 |     await expect(page.locator('text=Available Assessments')).toBeVisible({ timeout: 10000 });
  68 |   });
  69 | 
  70 |   test('4. Practice Flow (Candidate)', async () => {
  71 |     await page.click('text=Practice');
  72 |     await page.fill('.monaco-editor textarea', 'print("Hello Practice")');
  73 |     await page.click('text=Run Code');
  74 |     
  75 |     // Verify output
  76 |     await expect(page.locator('text=Hello Practice')).toBeVisible({ timeout: 15000 });
  77 |   });
  78 | });
  79 | 
```