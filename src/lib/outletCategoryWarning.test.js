const {
  outletCategoryModeWarning,
  outletCategoryMismatchWarning,
  outletCategoryWarnings,
} = require('./outletCategoryWarning.js');

describe('outletCategoryModeWarning', () => {
  it('warns for every merchant category chip', () => {
    expect(outletCategoryModeWarning('supermarket')).toMatch(/Clearance shelves only/);
    expect(outletCategoryModeWarning('bakery')).toMatch(/Rescue bags only/);
    expect(outletCategoryModeWarning('hybrid')).toMatch(/Both rescue bags/);
  });
});

describe('outletCategoryWarnings', () => {
  it('stacks mismatch for Bakehouse supermarket', () => {
    const msgs = outletCategoryWarnings('Bakehouse Kollupitiya', 'supermarket');
    expect(msgs.length).toBe(2);
    expect(outletCategoryMismatchWarning('Bakehouse Kollupitiya', 'supermarket')).toBeTruthy();
  });
});
