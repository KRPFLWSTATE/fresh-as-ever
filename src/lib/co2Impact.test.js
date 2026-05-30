import {
  co2eKgFromBagRescue,
  co2eKgFromRescue,
  resolveBagFoodWeightKg,
} from './co2Impact';

describe('co2Impact', () => {
  it('uses estimated_weight_kg', () => {
    expect(
      resolveBagFoodWeightKg({ estimated_weight_kg: 2, retail_value_estimate: 800 }),
    ).toBe(2);
  });

  it('computes co2e from rescue', () => {
    expect(co2eKgFromRescue({ foodWeightKg: 2, quantity: 1 })).toBe(5);
    expect(co2eKgFromBagRescue({ estimated_weight_kg: 1.5 }, 2)).toBe(7.5);
  });
});
