import { expect, Locator, Page } from "@playwright/test";

export type FormContainerId = "#form-container-1" | "#form-container-2";
export type InterestOption = "Safety" | "Independence" | "Therapy" | "Other";
export type PropertyOption = "owned" | "rental" | "mobile";
export type StepNumber = 1 | 2 | 3 | 4 | 5;

const interestIds: Record<InterestOption, string> = {
  Safety: "why-interested-safety",
  Independence: "why-interested-independence",
  Therapy: "why-interested-therapy",
  Other: "why-interested-other",
};

const propertyIds: Record<PropertyOption, string> = {
  owned: "homeowner-owned",
  rental: "homeowner-rental",
  mobile: "homeowner-mobile",
};

export class WalkInBathForm {
  readonly root: Locator;
  readonly instanceSuffix: "1" | "2";

  constructor(
    readonly page: Page,
    readonly containerId: FormContainerId,
  ) {
    this.root = this.page.locator(this.containerId);
    this.instanceSuffix = containerId.endsWith("1") ? "1" : "2";
  }

  step(stepNumber: StepNumber): Locator {
    return this.root.locator(`.steps.step-${stepNumber}`);
  }

  stepError(stepNumber: StepNumber): Locator {
    return this.step(stepNumber).locator("[data-error-block]");
  }

  progressCurrentStep(): Locator {
    return this.root.locator("[data-form-progress-current-step]");
  }

  nextButton(stepNumber: StepNumber): Locator {
    return this.root.locator(`[data-tracking="btn-step-${stepNumber}"]`);
  }

  zipInput(): Locator {
    return this.root.locator("[data-zip-code-input]");
  }

  nameInput(): Locator {
    return this.root.locator("[data-name-input]");
  }

  emailInput(): Locator {
    return this.root.locator('input[name="email"][type="email"]');
  }

  outOfAreaEmailInput(): Locator {
    return this.root.locator('input[data-email-input][name="email"]');
  }

  outOfAreaMessage(): Locator {
    return this.root.locator("[data-sorry-fade-out]");
  }

  outOfAreaSuccessMessage(): Locator {
    return this.root.locator("[data-sorry-fade-in]");
  }

  sorryStep(): Locator {
    return this.root.locator("[data-sorry-step]");
  }

  phoneInput(): Locator {
    return this.root.locator("[data-phone-input]");
  }

  phoneStep(): Locator {
    return this.root.locator("[data-phone-step]");
  }

  interestInput(option: InterestOption): Locator {
    return this.root.locator(`#${interestIds[option]}-${this.instanceSuffix}`);
  }

  propertyInput(option: PropertyOption): Locator {
    return this.root.locator(`#${propertyIds[option]}-${this.instanceSuffix}`);
  }

  private optionLabel(inputId: string): Locator {
    return this.root.locator(`label[for="${inputId}"]`);
  }

  async clickNext(stepNumber: StepNumber) {
    const button = this.nextButton(stepNumber);
    await button.scrollIntoViewIfNeeded();
    await button.click();
  }

  async fillZip(zip: string) {
    await this.zipInput().fill(zip);
  }

  async selectInterest(option: InterestOption) {
    const input = this.interestInput(option);
    const inputId = await input.getAttribute("id");
    if (!inputId) {
      throw new Error(`Missing interest input id for ${option}`);
    }
    await this.optionLabel(inputId).click();
    await expect(input).toBeChecked();
  }

  async selectProperty(option: PropertyOption) {
    const input = this.propertyInput(option);
    const inputId = await input.getAttribute("id");
    if (!inputId) {
      throw new Error(`Missing property input id for ${option}`);
    }
    await this.optionLabel(inputId).click();
    await expect(input).toBeChecked();
  }

  async fillContact(name: string, email: string) {
    await this.nameInput().fill(name);
    await this.emailInput().fill(email);
  }

  async fillPhone(phone: string) {
    await this.phoneInput().fill(phone);
  }

  async fillEmailOutOfArea(email: string) {
    await this.outOfAreaEmailInput().fill(email);
  }

  async submitOutOfAreaEmail() {
    await this.root.getByRole("button", { name: /submit/i }).click();
  }

  async expectStepVisible(stepNumber: StepNumber) {
    await expect(this.step(stepNumber)).toBeVisible();
  }

  async expectSorryStepVisible() {
    await expect(this.sorryStep()).toBeVisible();
  }

  async expectProgressStep(stepNumber: StepNumber) {
    await expect(this.progressCurrentStep()).toHaveText(String(stepNumber));
  }

  async expectNativeValidationError(field: Locator) {
    await expect
      .poll(async () =>
        field.evaluate(
          (element) =>
            (element as { validationMessage?: string }).validationMessage ?? "",
        ),
      )
      .not.toBe("");
  }
}
