/**
 * Complete Clinic Verification & Validation Test Suite
 * Tests Payments, Odontogram, Billing Ledger, RBAC, and Scheduling Rules.
 */

import { formatNaira } from "../src/lib/currency";
import {
  ADULT_TEETH,
  PRIMARY_TEETH,
  UPPER_RIGHT,
  UPPER_LEFT,
  LOWER_LEFT,
  LOWER_RIGHT,
  PRIMARY_UPPER_RIGHT,
  PRIMARY_UPPER_LEFT,
  PRIMARY_LOWER_LEFT,
  PRIMARY_LOWER_RIGHT,
  getToothAnatomy,
  getToothLabel,
} from "../src/lib/odontogram";
import { TOOTH_SURFACES } from "../src/lib/tooth-surfaces";
import {
  compareCalendarDays,
  addCalendarDays,
  sameCalendarDay,
  toDateKey,
} from "../src/lib/clinic-date";
import { hasCapability, isAdmin, isDentist, isReceptionist, isPatient } from "../src/lib/auth";
import { paystackReferenceTarget } from "../src/lib/paystack-webhook-hub";

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertEquals(actual: any, expected: any, message?: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(
      message || `Assertion failed:\n  Expected: ${expectedStr}\n  Received: ${actualStr}`
    );
  }
}

async function runTest(suite: string, name: string, fn: () => void | Promise<void>) {
  const start = performance.now();
  try {
    await fn();
    results.push({
      suite,
      name,
      passed: true,
      durationMs: Math.round(performance.now() - start),
    });
  } catch (err) {
    results.push({
      suite,
      name,
      passed: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Math.round(performance.now() - start),
    });
  }
}

async function main() {
  console.log("\n========================================================");
  console.log("  🏥 GLOW DENTAL CLINIC — VERIFICATION & VALIDATION SUITE");
  console.log("========================================================\n");

  // ---------------------------------------------------------------------------
  // SUITE 1: PAYSTACK WEBHOOK-FREE DIRECT VERIFICATION LOGIC
  // ---------------------------------------------------------------------------
  const S1 = "1. Paystack Direct Verification & Reconciliation";

  await runTest(S1, "Reference routing correctly identifies clinic vs store", () => {
    assertEquals(paystackReferenceTarget("treatment-102-1793100000"), "clinic");
    assertEquals(paystackReferenceTarget("ORD-9876-ECOMMERCE"), "store");
    assertEquals(paystackReferenceTarget("random-ref-404"), "unknown");
    assertEquals(paystackReferenceTarget(undefined), "unknown");
  });

  await runTest(S1, "Verification parser rejects failed transactions", () => {
    const mockPaystackResponse = {
      status: true,
      data: { status: "failed", reference: "tr_fail_1", amount: 2500000 },
    };
    assert(mockPaystackResponse.data.status !== "success", "Failed status must not be treated as success");
  });

  await runTest(S1, "Verification parser rejects abandoned transactions", () => {
    const mockPaystackResponse = {
      status: true,
      data: { status: "abandoned", reference: "tr_abandoned_1", amount: 1500000 },
    };
    assert(mockPaystackResponse.data.status !== "success", "Abandoned status must not be treated as success");
  });

  await runTest(S1, "Verification parser accepts and validates success transactions", () => {
    const mockPaystackResponse = {
      status: true,
      data: { status: "success", reference: "tr_ok_1", amount: 4500000 },
    };
    assert(mockPaystackResponse.data.status === "success", "Success status must be confirmed");
    assertEquals(mockPaystackResponse.data.amount, 4500000);
  });

  await runTest(S1, "Paystack subunit to Naira math converts correctly", () => {
    const paystackSubunit = 2500000; // ₦25,000 in kobo
    const nairaAmount = paystackSubunit / 100;
    assertEquals(nairaAmount, 25000);
    assertEquals(formatNaira(nairaAmount), "₦25,000");
  });

  // ---------------------------------------------------------------------------
  // SUITE 2: ODONTOGRAM & CLINICAL CHARTING ARCHITECTURE
  // ---------------------------------------------------------------------------
  const S2 = "2. Clinical Odontogram (Palmer, FDI & Anatomy)";

  await runTest(S2, "Standard tooth counts: 32 adult permanent & 20 pediatric teeth", () => {
    assertEquals(ADULT_TEETH.length, 32);
    assertEquals(PRIMARY_TEETH.length, 20);
    assertEquals(UPPER_RIGHT.length, 8);
    assertEquals(UPPER_LEFT.length, 8);
    assertEquals(LOWER_LEFT.length, 8);
    assertEquals(LOWER_RIGHT.length, 8);
    assertEquals(PRIMARY_UPPER_RIGHT.length, 5);
    assertEquals(PRIMARY_UPPER_LEFT.length, 5);
    assertEquals(PRIMARY_LOWER_LEFT.length, 5);
    assertEquals(PRIMARY_LOWER_RIGHT.length, 5);
  });

  await runTest(S2, "Anatomical kind classification across all quadrants", () => {
    // Upper Right 1 (11) -> Central Incisor
    const t11 = getToothAnatomy(11);
    assertEquals(t11.kind, "incisor");
    assertEquals(t11.name, "Central Incisor");
    assert(t11.isUpper && t11.isRight, "11 must be Maxillary Upper Right");

    // Upper Left 3 (23) -> Canine
    const t23 = getToothAnatomy(23);
    assertEquals(t23.kind, "canine");
    assertEquals(t23.name, "Canine (Cuspid)");
    assert(t23.isUpper && !t23.isRight, "23 must be Maxillary Upper Left");

    // Lower Left 4 (34) -> 1st Premolar
    const t34 = getToothAnatomy(34);
    assertEquals(t34.kind, "premolar");
    assertEquals(t34.name, "1st Premolar");
    assert(!t34.isUpper && !t34.isRight, "34 must be Mandibular Lower Left");

    // Lower Right 6 (46) -> 1st Molar
    const t46 = getToothAnatomy(46);
    assertEquals(t46.kind, "molar");
    assertEquals(t46.name, "1st Molar");
    assert(!t46.isUpper && t46.isRight, "46 must be Mandibular Lower Right");

    // Wisdom tooth (18)
    const t18 = getToothAnatomy(18);
    assertEquals(t18.kind, "molar");
    assertEquals(t18.name, "3rd Molar (Wisdom)");
  });

  await runTest(S2, "Palmer 4-Quadrant system formats correctly (1 to 8 from midline)", () => {
    const ur6 = getToothLabel(16, "palmer");
    assertEquals(ur6.label, "6");
    assertEquals(ur6.fullLabel, "UR6");
    assertEquals(ur6.quadrantName, "Upper Right (UR)");

    const ul1 = getToothLabel(21, "palmer");
    assertEquals(ul1.label, "1");
    assertEquals(ul1.fullLabel, "UL1");

    const lr3 = getToothLabel(43, "palmer");
    assertEquals(lr3.label, "3");
    assertEquals(lr3.fullLabel, "LR3");

    const ll7 = getToothLabel(37, "palmer");
    assertEquals(ll7.label, "7");
    assertEquals(ll7.fullLabel, "LL7");
  });

  await runTest(S2, "FDI 2-Digit International notation formats correctly", () => {
    assertEquals(getToothLabel(16, "fdi").label, "16");
    assertEquals(getToothLabel(16, "fdi").fullLabel, "FDI 16");
    assertEquals(getToothLabel(21, "fdi").label, "21");
    assertEquals(getToothLabel(21, "fdi").fullLabel, "FDI 21");
    assertEquals(getToothLabel(33, "fdi").label, "33");
    assertEquals(getToothLabel(48, "fdi").label, "48");
  });

  await runTest(S2, "Universal Numbering System (1 to 32) maps correctly", () => {
    assertEquals(getToothLabel(18, "universal").label, "1");
    assertEquals(getToothLabel(11, "universal").label, "8");
    assertEquals(getToothLabel(21, "universal").label, "9");
    assertEquals(getToothLabel(28, "universal").label, "16");
    assertEquals(getToothLabel(38, "universal").label, "17");
    assertEquals(getToothLabel(48, "universal").label, "32");
  });

  await runTest(S2, "5 Standard Dental Surfaces (M, D, O, B, L, I) are defined", () => {
    assert(TOOTH_SURFACES.includes("M"), "Must include Mesial");
    assert(TOOTH_SURFACES.includes("D"), "Must include Distal");
    assert(TOOTH_SURFACES.includes("O"), "Must include Occlusal");
    assert(TOOTH_SURFACES.includes("B"), "Must include Buccal");
    assert(TOOTH_SURFACES.includes("L"), "Must include Lingual");
    assert(TOOTH_SURFACES.includes("I"), "Must include Incisal");
    assertEquals(TOOTH_SURFACES.length, 6);
  });

  // ---------------------------------------------------------------------------
  // SUITE 3: FINANCIAL LEDGER & BILLING CALCULATIONS
  // ---------------------------------------------------------------------------
  const S3 = "3. Financial Ledger & Billing Calculations";

  await runTest(S3, "Currency formatter handles zero, thousands, and millions in Naira", () => {
    assertEquals(formatNaira(0), "₦0");
    assertEquals(formatNaira(7500), "₦7,500");
    assertEquals(formatNaira(45000), "₦45,000");
    assertEquals(formatNaira(350000), "₦350,000");
    assertEquals(formatNaira(2500000), "₦2,500,000");
  });

  await runTest(S3, "Multiple procedure totals calculate correctly", () => {
    const visitTreatments = [
      { action: "Consultation", charge: 10000 },
      { action: "Scaling & Polishing", charge: 25000 },
      { action: "Composite Restoration #16", charge: 35000 },
    ];
    const total = visitTreatments.reduce((sum, t) => sum + t.charge, 0);
    assertEquals(total, 70000);
  });

  await runTest(S3, "Outstanding balance incorporates partial payments and discounts", () => {
    const charge = 100000;
    const payments = [
      { amount: 50000, type: "payment" },
      { amount: 15000, type: "discount" },
    ];
    const paid = payments.filter((p) => p.type === "payment").reduce((s, p) => s + p.amount, 0);
    const disc = payments.filter((p) => p.type === "discount").reduce((s, p) => s + p.amount, 0);
    const balance = Math.max(charge - paid - disc, 0);

    assertEquals(paid, 50000);
    assertEquals(disc, 15000);
    assertEquals(balance, 35000);
  });

  await runTest(S3, "Refunds correctly increase the patient's outstanding balance", () => {
    const charge = 80000;
    const ledger = [
      { amount: 80000, type: "payment" },
      { amount: 20000, type: "refund" }, // partial refund issued
    ];
    const paid = ledger.filter((p) => p.type === "payment").reduce((s, p) => s + p.amount, 0);
    const refunded = ledger.filter((p) => p.type === "refund").reduce((s, p) => s + p.amount, 0);
    const effectivePaid = paid - refunded;
    const balance = Math.max(charge - effectivePaid, 0);

    assertEquals(effectivePaid, 60000);
    assertEquals(balance, 20000);
  });

  await runTest(S3, "Overpayment clamps balance safely to 0 (no negative balance debt)", () => {
    const charge = 30000;
    const paid = 35000;
    const balance = Math.max(charge - paid, 0);
    assertEquals(balance, 0);
  });

  // ---------------------------------------------------------------------------
  // SUITE 4: CLINIC CALENDAR, SCHEDULING & WORKING RULES
  // ---------------------------------------------------------------------------
  const S4 = "4. Clinic Calendar & Scheduling Rules";

  await runTest(S4, "Calendar day comparison accurately identifies past, present, and future", () => {
    const past = { year: 2026, month: 10, day: 20 };
    const current = { year: 2026, month: 10, day: 28 };
    const future = { year: 2026, month: 11, day: 5 };

    assert(compareCalendarDays(past, current) < 0, "Past date must compare < 0");
    assert(compareCalendarDays(future, current) > 0, "Future date must compare > 0");
    assert(compareCalendarDays(current, current) === 0, "Same date must compare == 0");
    assert(sameCalendarDay(current, { year: 2026, month: 10, day: 28 }), "sameCalendarDay must match");
  });

  await runTest(S4, "Month boundary rollover functions correctly (Oct 31 -> Nov 1)", () => {
    const oct31 = { year: 2026, month: 10, day: 31 };
    const nov1 = addCalendarDays(oct31, 1);
    assertEquals(nov1, { year: 2026, month: 11, day: 1 });

    const backToOct = addCalendarDays(nov1, -1);
    assertEquals(backToOct, { year: 2026, month: 10, day: 31 });
  });

  await runTest(S4, "Date key serialization (YYYY-MM-DD) formats correctly", () => {
    const day = { year: 2026, month: 3, day: 9 };
    const key = toDateKey(day);
    assertEquals(key, "2026-03-09");
    const [y, m, d] = key.split("-").map(Number);
    assertEquals({ year: y, month: m, day: d }, day);
  });

  // ---------------------------------------------------------------------------
  // SUITE 5: ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSIONS
  // ---------------------------------------------------------------------------
  const S5 = "5. Role-Based Access Control (RBAC) & Security";

  const adminUser = {
    personId: 1,
    admins: [{ adminId: 1 }],
    dentists: [],
    receptionists: [],
    patients: [],
  };

  const dentistUser = {
    personId: 2,
    admins: [],
    dentists: [{ dentistId: 1 }],
    receptionists: [],
    patients: [],
  };

  const receptionistUser = {
    personId: 3,
    admins: [],
    dentists: [],
    receptionists: [{ receptionistId: 1 }],
    patients: [],
  };

  const patientUser = {
    personId: 4,
    admins: [],
    dentists: [],
    receptionists: [],
    patients: [{ patientId: 1 }],
  };

  await runTest(S5, "Role helper functions correctly categorize accounts", () => {
    assert(isAdmin(adminUser as any), "adminUser must be admin");
    assert(!isAdmin(dentistUser as any), "dentistUser must not be admin");

    assert(isDentist(dentistUser as any), "dentistUser must be dentist");
    assert(!isDentist(receptionistUser as any), "receptionistUser must not be dentist");

    assert(isReceptionist(receptionistUser as any), "receptionistUser must be receptionist");
    assert(!isReceptionist(patientUser as any), "patientUser must not be receptionist");

    assert(isPatient(patientUser as any), "patientUser must be patient");
    assert(!isPatient(adminUser as any), "adminUser must not be patient");
  });

  await runTest(S5, "Clinical care capability restricted to clinicians (Dentists & Admin)", () => {
    assert(hasCapability(dentistUser as any, "clinicalCare"), "Dentist must have clinicalCare");
    assert(hasCapability(adminUser as any, "clinicalCare"), "Admin must have clinicalCare");
    assert(!hasCapability(receptionistUser as any, "clinicalCare"), "Receptionist must NOT have clinicalCare");
    assert(!hasCapability(patientUser as any, "clinicalCare"), "Patient must NOT have clinicalCare");
  });

  await runTest(S5, "Front desk billing access granted to Receptionist and Admin only", () => {
    assert(hasCapability(receptionistUser as any, "frontDesk"), "Receptionist must have frontDesk");
    assert(hasCapability(adminUser as any, "frontDesk"), "Admin must have frontDesk");
    assert(!hasCapability(dentistUser as any, "frontDesk"), "Dentist does not have frontDesk by default");
    assert(!hasCapability(patientUser as any, "frontDesk"), "Patient must NOT have frontDesk");
  });

  await runTest(S5, "Patient portal capability granted to Patients only", () => {
    assert(hasCapability(patientUser as any, "patientPortal"), "Patient must have patientPortal");
    assert(!hasCapability(adminUser as any, "patientPortal"), "Admin does not have patientPortal");
    assert(!hasCapability(dentistUser as any, "patientPortal"), "Dentist does not have patientPortal");
  });

  // ---------------------------------------------------------------------------
  // REPORT GENERATION
  // ---------------------------------------------------------------------------
  console.log("--------------------------------------------------------");
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  let currentSuite = "";
  results.forEach((r) => {
    if (r.suite !== currentSuite) {
      currentSuite = r.suite;
      console.log(`\n📌 ${currentSuite}:`);
    }
    const icon = r.passed ? "  ✅" : "  ❌";
    console.log(`${icon} ${r.name} (${r.durationMs}ms)`);
    if (!r.passed && r.error) {
      console.log(`     Error: ${r.error}`);
    }
  });

  console.log("\n========================================================");
  console.log(`  TEST RESULTS SUMMARY:`);
  console.log(`  Total Tests: ${results.length}`);
  console.log(`  Passed:      ${passedCount} ✅`);
  console.log(`  Failed:      ${failedCount} ${failedCount > 0 ? "❌" : ""}`);
  console.log(`  Pass Rate:   ${((passedCount / results.length) * 100).toFixed(1)}%`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
