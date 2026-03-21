// ============================================================
// buildPaymentLink
// Generates payment app deep links for Venmo, CashApp, PayPal, Zelle.
// amountCents is integer cents; formatted as dollars in URL only.
// ============================================================

export function buildPaymentLink(
  app: string,
  username: string,
  amountCents: number,
  note: string
): string {
  const formattedAmount = (amountCents / 100).toFixed(2);
  const encodedNote = encodeURIComponent(note);

  switch (app) {
    case 'venmo':
      return `venmo://paycharge?txn=pay&recipients=${username}&amount=${formattedAmount}&note=${encodedNote}`;
    case 'cashapp':
      return `cashapp://cash.app/$${username}/${formattedAmount}`;
    case 'paypal':
      return `https://www.paypal.com/paypalme/${username}/${formattedAmount}`;
    case 'zelle':
      // Zelle does not have a universal deep link — opens banking app instead
      return `zellepay://`;
    default:
      return '';
  }
}
