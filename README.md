# 🧪 Walk-In Bath Form Automation (Playwright + TypeScript)

This project contains automated end-to-end tests for a multi-step lead generation form using **Playwright** and **TypeScript**. The test suite validates critical user journeys including form validation, business rule enforcement, conditional routing based on ZIP code, and successful form submission flows.

**Test Page:** https://test-qa.capslock.global/

## 🧩 Form Overview

The application is a 5-step form wizard:

1. ZIP code (service availability)
2. Interest selection (multi-select checkboxes)
3. Property type (radio buttons)
4. Contact info (name + email)
5. Phone number → submission

Special Behavior

- ZIP determines flow:
  - 68901 → full flow (service available)
  - 11111 → out-of-area flow
- Page contains two synchronized forms

## ⚙️ Setup & Execution

### Install dependencies

```bash
npm install
```

### Install Playwright browsers

```bash
npx playwright install chromium
```

### Run all tests

```bash
npm test
```

### Run tests in interactive UI mode

```bash
npm run test:ui
```

### Run tests in headed mode

```bash
npm run test:headed
```

### View HTML report after test run

```bash
npm run report
```

### Run lint checks:

```bash
npm run lint
```

## 📋 Full Scenario List

Below are all identified end-to-end user scenarios for comprehensive test coverage of the walk-in bath form:

### Functional flow scenarios

1. User completes full happy path with service-available ZIP and owned property → redirected to Thank You page with successful request submission
2. User enters out-of-area ZIP → routed to “sorry / notify me” flow
3. User enters invalid ZIP with fewer than 5 digits → validation error, cannot proceed
4. User enters invalid ZIP with more than 5 digits → validation error, cannot proceed
5. User enters ZIP with non-digit characters → validation error, cannot proceed
6. User leaves ZIP empty → validation error, cannot proceed

### Step 2 validation scenarios

7. User clicks Next on “Why are you interested…” without selecting any checkbox → no validation error, can proceed successfully
8. User selects one checkbox and proceeds successfully
9. User selects multiple checkboxes and proceeds successfully

### Step 3 validation / branching scenarios

10. User selects “Owned House / Condo” → proceeds to next step
11. User selects “Rental Property” → blocked with correct error message
12. User selects “Mobile Home” → blocked with correct error message
13. Only one property option can be selected at a time -> selecting a new option automatically deselects the previous selection.
14. User clicks Next on step 3 without selecting property type → validation error, cannot proceed

### Step 4 validation scenarios

15. User leaves Name empty → validation error, cannot proceed
16. User leaves Email empty → native HTML5 validation blocks submission
17. User enters invalid email format → native HTML5 validation blocks submission
18. User enters only first/last name → validation error, cannot proceed
19. User enters valid name and valid email → proceeds to phone step

### Step 5 validation scenarios

20. User leaves Phone empty → validation error, cannot submit
21. User enters fewer than 10 digits → validation error, cannot submit
22. User enters more than 10 digits → only first 10 digits are taken
23. User enters non-digit characters in phone → input field remains empty
24. User enters exactly 10 digits → successful submission

### End-state / navigation scenarios

25. Successful submission redirects to Thank You page
26. Failed validation on any step keeps user on current step
27. Progress indicator updates correctly on each step

### Out-of-area ZIP flow scenarios

28. User enters out-of-area ZIP and proceed to Sorry page with email submission oportunity
29. User leaves Email empty → validation error, cannot submit
30. User enters invalid email format → native HTML5 validation blocks submission
31. User enters valid email and sees Thank you message

### Multi-form / page consistency scenarios

32. Form container 1 works correctly
33. Form container 2 works correctly
34. If both forms are meant to stay synchronized, step progression is synchronized correctly
35. Hidden steps are not interactable before they become active

### Additional scenarios

36. Form usability on mobile viewport (fields visible, no overlap, CTA accessible)
37. Multi-step navigation works correctly on small screens
38. Network/API failure handling
39. Retry/idempotency behavior
40. Paste/trimming behavior
41. Cross-form race-condition checks

## ⭐ Top Priority Scenarios for Automation

The following scenarios were selected for automation based on **business impact**, **risk**, and **frequency**:

| #   | Scenario                                              | Priority      | Test Status            |
| --- | ----------------------------------------------------- | ------------- | ---------------------- |
| 1   | Happy Path - Service Available                        | P0 - Critical | ✅ Passing             |
| 2   | Out-of-Area ZIP Flow                                  | P0 - Critical | ✅ Passing             |
| 3   | Empty ZIP                                             | P1 - High     | ✅ Passing             |
| 4   | Invalid Property Type (Rental/Mobile) - Parameterized | P1 - High     | ⚠️ Skipped (Defect #1) |
| 5   | Invalid Email Validation                              | P1 - High     | ✅ Passing             |
| 6   | Invalid Phone Number Validation                       | P1 - High     | ✅ Passing             |

**Test Execution Count:** 6 test scenarios = 7 test executions (Test #4 runs twice with different parameters)

### 🎯 Prioritization Logic

**Why these scenarios were chosen:**

#### **1. Happy Path - Service Available with Owned Property** (Scenario #1)

- **Priority:** P0 - Critical
- **Business Impact:** 🔴 CRITICAL - This is the primary revenue-generating flow. If broken, no leads are captured.
- **Risk:** High - Directly impacts business operations and revenue
- **ROI:** Highest - Protects core business functionality
- **Additional Coverage:** Also validates form synchronization between two form instances

**Selected because:** This is the money-making flow. Every bug here directly costs revenue.

---

#### **2. Out-of-Area ZIP Code Flow** (Scenario #2)

- **Priority:** P0 - Critical
- **Business Impact:** 🔴 CRITICAL - Captures potential future leads in non-serviceable areas for expansion planning
- **Risk:** High - Missing these leads means lost expansion opportunities and competitor advantage
- **ROI:** High - Builds prospect database for future service area expansion

**Selected because:** Strategic lead capture. While these users can't convert today, capturing their contact information:

---

#### **3. Empty ZIP Code Validation** (Scenario #6)

- **Priority:** P1 - High
- **Business Impact:** 🟠 HIGH - Ensures data integrity for all leads entering the system
- **Risk:** Medium - Empty ZIP codes prevent service area routing and lead qualification
- **ROI:** Medium-High - Prevents incomplete leads, ensures clean data for CRM

**Selected because:** Data integrity at entry point. The ZIP code is the first and most critical piece of information:

---

#### **4. Invalid Property Type Rejection (Rental/Mobile)** (Scenarios #11 & #12 - Parameterized)

- **Priority:** P1 - High
- **Business Impact:** 🟠 HIGH - Enforces business policy; company doesn't service rentals/mobile homes
- **Risk:** Medium-High - Policy violation could lead to operational issues and unhappy customers
- **ROI:** Medium-High - Prevents invalid leads entering pipeline
- **Current Status:** ⚠️ Test reveals validation is not implemented (Defect #1)

**Selected because:** Business rule enforcement. Company policy states no installations in rentals/mobile homes.

**Note:** Implemented as parameterized test to cover both property types efficiently.

---

#### **5. Invalid Email Validation** (Scenario #16)

- **Priority:** P1 - High
- **Business Impact:** 🟠 HIGH - Ensures lead contact quality for follow-up
- **Risk:** Medium - Invalid emails = lost leads and wasted follow-up effort
- **ROI:** Medium-High - Protects data quality and follow-up success rate

**Selected because:** Data quality. Email is the primary follow-up channel. Invalid emails mean lost opportunities.

---

#### **6. Invalid Phone number Validation** (Scenario #20)

- **Priority:** P1 - High
- **Business Impact:** 🟠 HIGH - Ensures lead contact quality for follow-up

## 🐛 Defects Found

### Defect #1: Property Type Validation Not Implemented

Rental & Mobile should be blocked
DOM indicates validation exists (data-error-text)

```html
<form
  name="type_of_property"
  data-error-text="Unfortunately, we don't install walk-in tubs in rental and mobile homes."
></form>
```

**Property type inputs have distinguishing attributes:**

- `data-type-of-property="1"` for Owned House/Condo (valid)
- `data-type-of-property="0"` for Rental Property (should be invalid)
- `data-type-of-property="0"` for Mobile Home (should be invalid)

Handling: test.fixme

Actual behavior allows progression

### Defect #2: Progress Bar Bug in step 3

Displays incorrect text 2 of 5 though user is in step 3
Does not affect functionality

Handling: test annotation about the issue

### Defect #3: Progress Bar Broken view

Progress bar is broken (1 of) when user landed to Sorry page after submitting Out of Area ZIP
Does not affect functionality

Handling: test annotation about the issue

### Defect #4: Form Context Switch After ZIP Submission

When a user enters a ZIP code in Form 2 and clicks Next, the application unexpectedly switches context to Form 1, and the user continues the flow there.

### Defect #5: Out-of-area email field does not use native HTML5 validation

In the out-of-area ZIP flow, the email input is rendered as type="text" instead of type="email", resulting in missing native HTML5 validation.

## 🚀 Future Improvements

### 1. API Contract Testing

- Validate request/response structure between frontend and backend
- Ensure correct data is submitted (ZIP, email, phone)
- Detect breaking API changes early

### 2. Extract Shared Helpers

- Move reusable helper methods into a dedicated `utils/` module
- Reduce duplication and improve readability as the test suite grows

### 3. Test Data Management with Fixtures

- Use Playwright fixtures to centralize test data (ZIPs, emails, phone numbers)
- Improve maintainability and consistency across tests

### 4. Visual Regression Testing

- Add snapshot-based UI validation to detect layout regressions
- Ensure consistent user experience across releases
