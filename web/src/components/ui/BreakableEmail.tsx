/**
 * An email address with one place it is allowed to wrap: just before the "@".
 *
 * An address is a single unbreakable word, so one that is wider than its column
 * runs on into whatever sits beside it. Offering a break point lets a long one
 * fold tidily — "salmanperfume.com" over "@gmail.com" — and only when it has to.
 * <wbr> adds no character, so selecting or copying the address still gives the
 * plain address.
 */
export function BreakableEmail({ value }: { value: string }) {
  const at = value.indexOf("@");
  // No "@", or one at the very start (an Instagram handle): nothing to break at.
  if (at < 1) return <>{value}</>;

  return (
    <>
      {value.slice(0, at)}
      <wbr />
      {value.slice(at)}
    </>
  );
}
