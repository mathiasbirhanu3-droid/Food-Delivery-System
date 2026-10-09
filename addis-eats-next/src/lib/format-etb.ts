const etb = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'ETB', minimumFractionDigits: 0, maximumFractionDigits: 2,
});

/** Feature 26 — prices are consistently formatted as Ethiopian Birr. */
export const formatETB = (amount: number) => etb.format(amount);