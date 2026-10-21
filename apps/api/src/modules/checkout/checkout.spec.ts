import { calculateCommission, toMinorUnits, toMajorUnits, formatCurrency } from '@markethub/shared';

describe('Financial and Order Splitting Engine', () => {
  it('correctly calculates integer minor unit conversion without float drift', () => {
    expect(toMinorUnits(49.99)).toBe(4999);
    expect(toMinorUnits(1299.5)).toBe(129950);
    expect(toMajorUnits(4999)).toBe(49.99);
  });

  it('calculates platform commission and vendor net payout accurately', () => {
    // ₹1,000.00 subtotal (100,000 paise) with 10.00% commission (1,000 bps)
    const subtotal = 100000;
    const bps = 1000;
    const { commissionMinor, netPayoutMinor } = calculateCommission(subtotal, bps);

    expect(commissionMinor).toBe(10000); // ₹100.00 (10,000 paise)
    expect(netPayoutMinor).toBe(90000); // ₹900.00 (90,000 paise)
    expect(commissionMinor + netPayoutMinor).toBe(subtotal);
  });

  it('correctly splits multi-vendor order amounts and commissions', () => {
    const vendorAItems = [
      { priceMinor: 50000, quantity: 2 }, // ₹500 x 2 = ₹1,000
    ];
    const vendorBItems = [
      { priceMinor: 250000, quantity: 1 }, // ₹2,500 x 1 = ₹2,500
    ];

    const subtotalA = vendorAItems.reduce((acc, i) => acc + i.priceMinor * i.quantity, 0);
    const subtotalB = vendorBItems.reduce((acc, i) => acc + i.priceMinor * i.quantity, 0);
    const parentTotal = subtotalA + subtotalB;

    expect(subtotalA).toBe(100000);
    expect(subtotalB).toBe(250000);
    expect(parentTotal).toBe(350000); // ₹3,500 total

    // Vendor A commission 10% (1000 bps)
    const commA = calculateCommission(subtotalA, 1000);
    expect(commA.commissionMinor).toBe(10000);
    expect(commA.netPayoutMinor).toBe(90000);

    // Vendor B commission 12% (1200 bps)
    const commB = calculateCommission(subtotalB, 1200);
    expect(commB.commissionMinor).toBe(30000);
    expect(commB.netPayoutMinor).toBe(220000);

    // Platform total commission
    const totalPlatformCommission = commA.commissionMinor + commB.commissionMinor;
    expect(totalPlatformCommission).toBe(40000); // ₹400
  });

  it('formats currency correctly in Indian Rupee format', () => {
    const formatted = formatCurrency(499900); // ₹4,999.00
    expect(formatted).toContain('4,999.00');
  });
});
