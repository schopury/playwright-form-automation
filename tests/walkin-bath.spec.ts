import { expect, Page, Locator, test } from "@playwright/test";
import { StepNumber, WalkInBathForm } from "../pages/walkInBathForm";

// ---------- Constants / Test Data ----------
const SERVICEABLE_ZIP = "68901";
const OUT_OF_AREA_ZIP = "11111";
const INVALID_ZIP = "1234";
const VALID_NAME = "John Smith";
const VALID_EMAIL = "john.smith@example.com";
const VALID_PHONE = "5551234567";
const STEP_2_PROGRESS_BUG =
  "Known bug: after step 2 submission, the progress indicator stays at 2 instead of updating to 3.";
const OUT_OF_AREA_PROGRESS_BUG =
  "Known bug: progress bar shows incomplete text '1 of' in the out-of-area flow.";

// ---------- Helper Functions (step helpers, validation helpers) ----------
async function completeStep1(form: WalkInBathForm, zip = SERVICEABLE_ZIP) {
  await form.fillZip(zip);
  await form.clickNext(1);
}

async function completeStep2(form: WalkInBathForm) {
  await form.selectInterest("Safety");
  await form.clickNext(2);
}

async function completeStep3(form: WalkInBathForm) {
  await form.selectProperty("owned");
  await form.clickNext(3);
}

async function completeStep4(
  form: WalkInBathForm,
  email = VALID_EMAIL,
  name = VALID_NAME,
) {
  await form.fillContact(name, email);
  await form.clickNext(4);
}

async function reachPhoneStep(form: WalkInBathForm, zip = SERVICEABLE_ZIP) {
  await completeStep1(form, zip);
  await completeStep2(form);
  await completeStep3(form);
  await completeStep4(form);
  await form.expectStepVisible(5);
}

async function expectThankYouPage(page: Page) {
  await expect(page).toHaveURL(/\/thankyou/i);
  await expect(
    page.getByRole("heading", { name: /thank you!/i }),
  ).toBeVisible();
  await expect(
    page.getByText(/calling within the next 10 minutes/i),
  ).toBeVisible();
  await expect(page.getByText(/not a sales call/i)).toBeVisible();
}

async function expectProgressStep(
  form: WalkInBathForm,
  stepNumber: StepNumber,
  options?: { knownBug?: string },
) {
  if (options?.knownBug) {
    test.info().annotations.push({
      type: "issue",
      description: options.knownBug,
    });
    return;
  }

  await form.expectProgressStep(stepNumber);
}

async function getInputValidity(locator: Locator) {
  return await locator.evaluate((el) => {
    const input = el as HTMLInputElement;

    return {
      valid: input.validity.valid,
      patternMismatch: input.validity.patternMismatch,
      tooShort: input.validity.tooShort,
      typeMismatch: input.validity.typeMismatch,
      valueMissing: input.validity.valueMissing,
    };
  });
}

// ---------- Test Suite ----------
test.describe("Walk-in bath multi-step form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("[P0] Submits successfully with a serviceable ZIP", async ({ page }) => {
    const form1 = new WalkInBathForm(page, "#form-container-1");

    await completeStep1(form1);
    await form1.expectStepVisible(2);
    await expectProgressStep(form1, 2);

    await form1.selectInterest("Safety");
    await form1.clickNext(2);
    await form1.expectStepVisible(3);
    await expectProgressStep(form1, 3, { knownBug: STEP_2_PROGRESS_BUG });

    await form1.selectProperty("owned");
    await form1.clickNext(3);
    await form1.expectStepVisible(4);
    await expectProgressStep(form1, 4);

    await form1.fillContact(VALID_NAME, VALID_EMAIL);
    await form1.clickNext(4);
    await form1.expectStepVisible(5);
    await expectProgressStep(form1, 5);

    await form1.fillPhone(VALID_PHONE);
    await form1.clickNext(5);

    await expectThankYouPage(page);
  });

  test("[P0] Out-of-area ZIP redirects user to email capture flow and allows notification request", async ({
    page,
  }) => {
    const form1 = new WalkInBathForm(page, "#form-container-1");

    await completeStep1(form1, OUT_OF_AREA_ZIP);
    await form1.expectSorryStepVisible();
    await expectProgressStep(form1, 2, { knownBug: OUT_OF_AREA_PROGRESS_BUG });

    await expect(form1.outOfAreaMessage()).toBeVisible();
    await expect(form1.outOfAreaMessage()).toContainText(
      /don’t yet install in your area/i,
    );
    await expect(form1.outOfAreaSuccessMessage()).toBeHidden();

    await form1.fillEmailOutOfArea(VALID_EMAIL);
    await form1.submitOutOfAreaEmail();

    await expect(form1.outOfAreaMessage()).toBeHidden();
    await expect(form1.outOfAreaSuccessMessage()).toBeVisible();
    await expect(form1.outOfAreaSuccessMessage()).toContainText(
      /Thank you for your interest/i,
    );
  });

  test("[P1] User with invalid ZIP format cannot proceed to next step", async ({
    page,
  }) => {
    const form1 = new WalkInBathForm(page, "#form-container-1");

    await completeStep1(form1, INVALID_ZIP);

    await form1.expectStepVisible(1);
    await expect(form1.step(2)).toBeHidden();
    await expect(form1.stepError(1)).toContainText(/wrong zip code/i);
  });

  const invalidPropertyTypes: Array<{
    label: string;
    property: "rental" | "mobile";
  }> = [
    {
      label: "Rental Property",
      property: "rental",
    },
    {
      label: "Mobile Home",
      property: "mobile",
    },
  ];

  invalidPropertyTypes.forEach(({ label, property }) => {
    // KNOWN PRODUCTION ISSUE: DOM metadata suggests rental/mobile homes
    // should be blocked, but the current UI flow allows users to continue.
    test.fixme(`[P1] User selecting ${label} receives error and cannot proceed`, async ({
      page,
    }) => {
      const form1 = new WalkInBathForm(page, "#form-container-1");

      await completeStep1(form1);
      await form1.expectStepVisible(2);

      await form1.selectInterest("Therapy");
      await form1.clickNext(2);
      await form1.expectStepVisible(3);

      await form1.selectProperty(property);
      await form1.clickNext(3);

      const errorBlock = form1.stepError(3);
      await expect(errorBlock).toContainText(
        /we don't install walk-in tubs in rental and mobile homes/i,
      );
      await form1.expectStepVisible(3);
    });
  });

  test("[P1] User with invalid email format cannot proceed to phone step", async ({
    page,
  }) => {
    const form1 = new WalkInBathForm(page, "#form-container-1");

    await completeStep1(form1);
    await completeStep2(form1);
    await completeStep3(form1);
    await completeStep4(form1, "invalid-email-no-at-sign");

    const validity = await getInputValidity(form1.emailInput());

    expect(validity.valid).toBe(false);
    expect(validity.typeMismatch).toBe(true);

    await form1.expectStepVisible(4);
    await expect(form1.phoneStep()).toBeHidden();
    await form1.expectNativeValidationError(form1.emailInput());
  });

  test("[P1] blocks submission when phone number is not exactly 10 digits", async ({
    page,
  }) => {
    const form1 = new WalkInBathForm(page, "#form-container-1");

    await reachPhoneStep(form1);

    const invalidPhone = "5551234";

    await form1.fillPhone(invalidPhone);
    await form1.clickNext(5);

    await expect(page).not.toHaveURL(/\/thankyou/i);
    await form1.expectStepVisible(5);
    await expect(form1.stepError(5)).toContainText(/wrong phone number/i);
  });
});
