export function amountToRawAmount(amount: number, decimals: number) {
  return amount * 10 ** decimals;
}

export function rawAmountToAmount(rawAmount: number, decimals: number) {
  return rawAmount / 10 ** decimals;
}

export function safeBigIntToNumber(value: bigint, label?: string): number {
  const max = BigInt(Number.MAX_SAFE_INTEGER);
  const min = BigInt(Number.MIN_SAFE_INTEGER);

  if (value > max || value < min) {
    throw new Error(
      `Unsafe number conversion${label ? ` for ${label}` : ""}: bigint ${value} is outside JS safe integer range`
    );
  }

  return Number(value);
}
