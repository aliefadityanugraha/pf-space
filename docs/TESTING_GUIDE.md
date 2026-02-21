# 🧪 Testing Guide

Panduan lengkap untuk testing PF Space project.

## 📋 Table of Contents

- [Testing Strategy](#testing-strategy)
- [Unit Tests](#unit-tests)
- [Integration Tests](#integration-tests)
- [E2E Tests](#e2e-tests)
- [Manual Testing](#manual-testing)
- [Performance Testing](#performance-testing)

## 🎯 Testing Strategy

### Test Pyramid

```
        /\
       /  \      E2E Tests (Few)
      /____\
     /      \    Integration Tests (Some)
    /________\
   /          \  Unit Tests (Many)
  /____________\
```

### Coverage Goals

- Unit Tests: 80%+
- Integration Tests: 60%+
- E2E Tests: Critical paths only

## 🔬 Unit Tests

### Frontend Unit Tests

#### Setup

```bash
cd frontend
pnpm install
```

#### Run Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch

# Run specific file
pnpm test useFilmDraft
```

#### Test Structure

```javascript
// frontend/src/composables/__tests__/useFilmDraft.test.js
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useFilmDraft } from "../useFilmDraft";

describe("useFilmDraft", () => {
  beforeEach(() => {
    // Setup before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Cleanup after each test
    localStorage.clear();
  });

  it("should save draft to localStorage", () => {
    const { saveDraft } = useFilmDraft();
    const formData = { judul: "Test Film" };

    saveDraft(formData);

    const saved = localStorage.getItem("film_draft");
    expect(saved).toBeTruthy();
    expect(JSON.parse(saved)).toEqual(formData);
  });
});
```

#### Writing Good Tests

**DO**:

- ✅ Test one thing per test
- ✅ Use descriptive test names
- ✅ Setup and cleanup properly
- ✅ Test edge cases
- ✅ Mock external dependencies

**DON'T**:

- ❌ Test implementation details
- ❌ Write flaky tests
- ❌ Ignore failing tests
- ❌ Test third-party libraries

### Backend Unit Tests

#### Setup

```bash
cd backend
npm install
```

#### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific file
npm test -- film.controller.test.js
```

#### Example Test

```javascript
// backend/tests/unit/film.controller.test.js
import { describe, it, expect, beforeEach } from "vitest";
import { FilmController } from "../../src/controllers/film.controller.js";

describe("FilmController", () => {
  let controller;

  beforeEach(() => {
    controller = new FilmController();
  });

  it("should create film successfully", async () => {
    const mockRequest = {
      body: {
        judul: "Test Film",
        category_id: 1,
      },
      user: { id: "user123" },
    };

    const mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await controller.createFilm(mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(201);
  });
});
```

## 🔗 Integration Tests

### API Integration Tests

#### Setup

```bash
cd backend
npm install
```

#### Run Tests

```bash
# Run integration tests
npm run test:integration

# Run specific suite
npm run test:integration -- auth
```

#### Example Test

```javascript
// backend/tests/integration/auth.test.js
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { build } from "../../src/app.js";

describe("Auth Integration", () => {
  let app;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should register new user", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/sign-up/email",
      payload: {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toHaveProperty("user");
  });
});
```

## 🌐 E2E Tests

### Setup Playwright

```bash
cd frontend
pnpm install -D @playwright/test
npx playwright install
```

### Run E2E Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run in headed mode
pnpm test:e2e --headed

# Run specific test
pnpm test:e2e upload.spec.js
```

### Example E2E Test

```javascript
// frontend/tests/e2e/upload.spec.js
import { test, expect } from "@playwright/test";

test.describe("Film Upload", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("http://localhost:5173/login");
    await page.fill('[name="email"]', "creator@example.com");
    await page.fill('[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("http://localhost:5173/");
  });

  test("should upload film with draft recovery", async ({ page }) => {
    // Navigate to upload page
    await page.goto("http://localhost:5173/upload");

    // Fill form
    await page.fill('[name="judul"]', "Test Film E2E");
    await page.fill('[name="sinopsis"]', "Test sinopsis");

    // Wait for auto-save
    await page.waitForTimeout(3500);

    // Refresh page
    await page.reload();

    // Check draft banner appears
    await expect(page.locator("text=Draft Ditemukan")).toBeVisible();

    // Restore draft
    await page.click("text=Pulihkan Draft");

    // Verify form filled
    await expect(page.locator('[name="judul"]')).toHaveValue("Test Film E2E");
  });
});
```

## 🖱️ Manual Testing

### Draft System Testing

#### Test Case 1: Auto-save Draft

**Steps**:

1. Login sebagai creator
2. Navigate ke `/upload`
3. Isi form:
   - Judul: "Test Film Manual"
   - Sinopsis: "Test sinopsis manual"
4. Tunggu 3 detik
5. Check localStorage: `film_draft` harus ada

**Expected**:

- ✅ Draft tersimpan di localStorage
- ✅ Indicator "Draft tersimpan" muncul

#### Test Case 2: Restore Draft

**Steps**:

1. Lanjutkan dari Test Case 1
2. Refresh browser (F5)
3. Banner "Draft Ditemukan" muncul
4. Klik "Pulihkan Draft"

**Expected**:

- ✅ Banner muncul dengan timestamp
- ✅ Form terisi dengan data draft
- ✅ Banner hilang setelah restore

#### Test Case 3: Discard Draft

**Steps**:

1. Lanjutkan dari Test Case 1
2. Refresh browser
3. Klik "Abaikan" di banner

**Expected**:

- ✅ Banner hilang
- ✅ Form kosong
- ✅ localStorage cleared

#### Test Case 4: Submit Clear Draft

**Steps**:

1. Isi form lengkap
2. Upload file
3. Submit form
4. Check localStorage

**Expected**:

- ✅ Form submitted successfully
- ✅ Draft cleared dari localStorage
- ✅ Redirect ke halaman lain

### Resumable Upload Testing

#### Test Case 5: Resume After Network Failure

**Steps**:

1. Login sebagai creator
2. Navigate ke `/upload`
3. Pilih video file besar (>100MB)
4. Mulai upload
5. Saat progress 50%, matikan WiFi
6. Tunggu 5 detik
7. Nyalakan WiFi

**Expected**:

- ✅ Upload pause saat WiFi mati
- ✅ Upload resume otomatis saat WiFi nyala
- ✅ Progress continue dari 50%
- ✅ Upload selesai tanpa error

#### Test Case 6: Resume After Browser Refresh

**Steps**:

1. Mulai upload video besar
2. Saat progress 30%, refresh browser
3. Pilih file yang sama lagi
4. Mulai upload

**Expected**:

- ✅ Tus client detect previous upload
- ✅ Upload resume dari 30%
- ✅ Upload selesai

### Cross-browser Testing

Test di browser:

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

### Mobile Testing

Test di device:

- [ ] Android Chrome
- [ ] iOS Safari
- [ ] Responsive design

## 📊 Performance Testing

### Load Testing

#### Setup Artillery

```bash
npm install -g artillery
```

#### Run Load Test

```bash
# Test API endpoints
artillery run backend/tests/load/api-load.yml

# Test upload endpoint
artillery run backend/tests/load/upload-load.yml
```

#### Example Config

```yaml
# backend/tests/load/api-load.yml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"

scenarios:
  - name: "Get films"
    flow:
      - get:
          url: "/api/films"
```

### Lighthouse Testing

```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse http://localhost:5173 --view
```

**Target Scores**:

- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 90+

## 🐛 Debugging Tests

### Frontend Debug

```javascript
// Add debugger
it("should save draft", () => {
  debugger; // Browser will pause here
  const { saveDraft } = useFilmDraft();
  saveDraft({ judul: "Test" });
});
```

### Backend Debug

```javascript
// Add console.log
it("should create film", async () => {
  console.log("Request:", mockRequest);
  await controller.createFilm(mockRequest, mockReply);
  console.log("Response:", mockReply.send.mock.calls);
});
```

### E2E Debug

```bash
# Run with debug mode
pnpm test:e2e --debug

# Take screenshot on failure
await page.screenshot({ path: 'error.png' })
```

## 📝 Test Reports

### Generate Coverage Report

```bash
# Frontend
cd frontend
pnpm test:coverage
open coverage/index.html

# Backend
cd backend
npm run test:coverage
open coverage/index.html
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v2
```

## ✅ Testing Checklist

Before merging PR:

- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] E2E critical paths tested
- [ ] Manual testing completed
- [ ] Coverage meets threshold
- [ ] No console errors
- [ ] Performance acceptable

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Jest Documentation](https://jestjs.io/)

## 🆘 Troubleshooting

### Tests Failing Randomly

**Cause**: Race conditions, timing issues

**Solution**:

- Use `waitFor` for async operations
- Increase timeout for slow operations
- Mock time-dependent functions

### localStorage Not Available

**Cause**: Tests running in Node environment

**Solution**:

```javascript
// Mock localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
```

### Database Connection Issues

**Cause**: Test database not setup

**Solution**:

```bash
# Create test database
mysql -u root -p -e "CREATE DATABASE si_film_archive_test"

# Run migrations
NODE_ENV=test npm run migrate
```

---

Happy Testing! 🎉
