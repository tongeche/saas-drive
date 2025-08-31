import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'e2e.tenant@example.com';
const TEST_PASS  = 'Fin0voE2E!';
const TEST_TENANT_SLUG = 'test-co';
const TEST_CLIENT = {
  name: 'E2E Client',
  email: 'client.e2e@example.com',
  phone: '+254700000999',
  address: 'Nairobi',
};

test.beforeAll(async () => {
  // seed via testing-only function
  const res = await fetch('http://localhost:8888/.netlify/functions/test-seed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASS,
      slug: TEST_TENANT_SLUG,
      business_name: 'Test Co Ltd',
      currency: 'KES',
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`seed failed: ${t}`);
  }
});

test('tenant can login, create client, create invoice, and get PDF link', async ({ page }) => {
  // 1) Login
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByLabel(/password/i).fill(TEST_PASS);
  await page.getByRole('button', { name: /log\s*in|sign\s*in/i }).click();

  // 2) Wait for dashboard/back office
  await expect(
    page.locator('text=Back Office').or(page.locator('text=Active Tenant'))
  ).toBeVisible({ timeout: 15000 });

  // 3) Create a client
  // Find "Add Client" form inputs by placeholders you use in App:
  await page.getByPlaceholder(/name \*/i).fill(TEST_CLIENT.name);
  await page.getByPlaceholder(/email/i).fill(TEST_CLIENT.email);
  await page.getByPlaceholder(/phone/i).fill(TEST_CLIENT.phone);
  await page.getByPlaceholder(/billing address/i).fill(TEST_CLIENT.address);
  await page.getByRole('button', { name: /create client/i }).click();

  // Optionally refresh client picker
  await page.getByRole('button', { name: /refresh clients/i }).click();

  // Select the new client by its email in the "Client" <select>
  await page.locator('label:has-text("Client") + * select, select').first().selectOption({ label: TEST_CLIENT.email });

  // 4) Create invoice
  await page.getByRole('button', { name: /create invoice \(supabase\)/i }).click();

  // Expect "Last invoice: INV-xxxxx" to show up
  const lastInvoice = page.locator('text=Last invoice: INV-');
  await expect(lastInvoice).toBeVisible({ timeout: 15000 });

  // 5) Send invoice (PDF)
  await page.getByRole('button', { name: /send invoice \(pdf\)/i }).click();

  // The pre area prints JSON with signedUrl
  const pre = page.locator('pre').first();
  await expect(pre).toContainText('"signedUrl"', { timeout: 30000 });

  // Optionally parse and log
  const raw = await pre.textContent();
  if (raw) {
    try {
      const json = JSON.parse(raw);
      console.log('PDF signedUrl:', json.signedUrl);
    } catch {}
  }
});
