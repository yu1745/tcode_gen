export function encodeTCode(value: number): string {
  if (value >= 1) {
    value = 0.9999;
  }
  const scaled = Math.floor(value * 10000);
  return `L0${scaled}`;
}