// The text each policy page shows until the admin saves its own. The privacy text
// describes what this code actually does — if the site starts collecting or sharing
// something new, update it here and in any saved copy (Admin -> Policies).
// Formatting marks are explained in markup.ts, {{tags}} in placeholders.ts.

import type { PolicySlug } from "./pages";

export const DEFAULT_POLICIES_DATE = new Date("2026-11-28T00:00:00+05:30");

export interface PolicyText {
  body: string;
  summary: string | null;
}

const CONTACT_LINES = `- Email: [{{contact_email}}](mailto:{{contact_email}})
- Phone: [{{contact_phone}}](tel:{{contact_phone}})
- Address: {{address}}`;

const shipping = `## Where we deliver
We deliver within India only. Please give a complete address, a 6-digit pincode and a phone number that we or our delivery partner can reach you on.

## Delivery charges
{{delivery_charges}}

The charge for your order is shown at checkout before you place it.

## Delivery time
We estimate delivery about {{delivery_days}} days after you place your order. The estimated date is shown once your order is placed.

This is an estimate, not a guarantee. Delivery can take longer for remote pincodes, or because of holidays, weather, strikes or courier delays. If your order is running late, contact us and we'll check on it.

## How we deliver
Orders are delivered by our own delivery team or sent through India Post.

## Tracking your order
You can check your order on the [Track Order](/track) page with your order number and the email address you used at checkout. If your parcel is sent by India Post, its tracking number appears there once the shipment is booked. If you have an account, you can also see your orders on your [account page](/account).

## Cash on delivery
{{cash_on_delivery}}

## Changing your address
Check your address and phone number before you place the order. If something is wrong, contact us straight away. We can only change these details before the parcel is sent.

## Damaged parcels
If your order arrives damaged or leaking, or an item is wrong or missing, tell us within 7 days of delivery. See our [Return & Refund Policy](/return-policy).

## Contact us
${CONTACT_LINES}`;

const returns = `## In short
We accept returns only for products that arrive **damaged, leaking, wrong or missing**. Tell us within **7 days of delivery** and send us photos. We don't accept returns or exchanges because you changed your mind or don't like a scent.

## Reporting a problem
Contact us within 7 days of delivery. Email these to [{{contact_email}}](mailto:{{contact_email}}), or call [{{contact_phone}}](tel:{{contact_phone}}) first if you need help:

- your order number
- photos of the outer parcel, including the shipping label
- clear photos of the product showing the problem (for a missing item, photos of everything you received)

An unboxing video helps, but it isn't required. Please keep the product, its box and all packaging until we reply, and don't send anything back until we ask you to.

## What happens next
We'll check your photos and tell you whether the claim is approved. If we need the item back, we'll explain how to send it, and **we pay the return courier cost**.

For an approved claim we'll send a replacement or give you a refund. If we can't replace the item, we'll refund it. If the problem affects your whole order, the refund includes any delivery charge and cash on delivery fee you paid.

## When we can't accept a return
- you changed your mind, or the scent isn't what you expected
- you contact us more than 7 days after delivery
- the damage happened after delivery
- the product has been used more than was needed to find the problem

## Cancelling an order
You can cancel within **24 hours of placing your order**, as long as it hasn't been shipped. Contact us with your order number. After 24 hours, or once the order has shipped, it can't be cancelled.

If you cancel in time after paying online, we refund the full amount. With cash on delivery there is nothing to refund, because you haven't paid yet.

## If we cancel your order
Sometimes we may need to cancel an order, for example if a product is out of stock, a price was wrong, or we can't deliver to your address. We'll refund anything you have paid, in full.

## Refunds
- **Paid online:** the refund goes back to the payment method you used.
- **Paid by cash on delivery:** we pay you by bank transfer or UPI, and will ask for the details we need.
- We start the refund within **7 business days** of approving your return or cancellation. Your bank or payment provider may take a few more days to show it.

We will never ask for your card number, CVV, PIN, password or OTP.

## Contact us
${CONTACT_LINES}`;

const returnsSummary =
  "We accept returns only for damaged, leaking, wrong or missing items, reported within 7 days of delivery with photos.";

const privacy = `This policy explains what personal information Salman Perfumes collects when you use our website, why we collect it and who we share it with.

## Information you give us
- **Orders:** your name, email address, phone number, delivery address, city, state, pincode and what you ordered.
- **Account (optional):** your name, email address and password. We store the password only in scrambled (hashed) form. If you're signed in at checkout, we save your delivery details to fill them in next time.
- **Reviews (optional):** your rating, review text and any photos you add. Reviews are public and show your first name and the initial of your last name.
- **Messages:** whatever you send when you contact us.

## Payment information
Online payments are processed by Razorpay. You enter your card, UPI or bank details with Razorpay, and **we don't receive or store them**. We keep payment reference numbers and whether the payment succeeded. To take the payment, we share your order amount and order number with Razorpay, along with your name, email address and phone number.

## Advertising and measurement
We use the **Meta Pixel**, from the company behind Facebook and Instagram, to measure our ads and decide who sees them. It tells Meta what happens in our shop, such as the pages and products you view, items you add to your bag, starting checkout, going on to pay and completing a purchase. It uses cookies, and Meta also receives technical details such as your IP address and browser type.

When you place an order, our server may also send Meta a report of the purchase. It includes:

- your email address, phone number, name, city, state, pincode, country and, if you're signed in, your account ID, each converted to a coded (hashed) form first
- your IP address, browser details, Meta's cookie IDs and the address of the page you ordered from
- the order number, total, product codes, quantities and prices

Meta uses this to match purchases with its ads, under [Meta's privacy policy](https://www.facebook.com/privacy/policy/). You can control the ads you see in your Facebook or Instagram settings.

## Cookies and storage on your device
- **Sign-in cookie:** keeps you signed in to your account for up to 30 days.
- **Bag and saved items:** kept in your browser so they are still there when you come back.
- **Meta cookies:** used for the advertising described above.
- **Other services:** Razorpay (during payment) and Google Maps (on our [Contact](/contact) page) may set their own cookies.

You can block or delete cookies in your browser settings. Some features, such as staying signed in, may then stop working.

## How we use your information
- to take, deliver and support your orders, and let you track them
- to run your account and show your reviews
- to measure and improve our advertising
- to prevent fraud and keep the website secure
- to meet tax, accounting and other legal requirements

## Who we share it with
We **don't sell** your personal information. We share what is needed with:

- **Delivery:** our delivery team, India Post, and the service we use to book India Post parcels (your name, phone number, email address, delivery address and order details)
- **Payments:** Razorpay
- **Advertising:** Meta, as described above
- **Email:** Brevo, which delivers the email that tells our team about your order
- **Website services:** the companies that host our website, database and uploaded photos, whose technical logs can include your IP address
- **Maps:** Google, when you open the page with our map
- **Authorities:** when the law requires it

Some of these companies may process information outside India.

## How long we keep it
We keep order records for as long as we need them for delivery, customer support, accounts, tax and other legal requirements. We keep your account until you ask us to delete it. When an IP address and browser details are saved with an order for the Meta purchase report, we remove them once the report has been sent successfully.

## Security
We use reasonable measures to protect your information, such as encrypted (HTTPS) connections and hashed passwords. No website or system is completely secure.

## Your choices and rights
You can ask us to:

- show you the personal information we hold about you
- correct or update it
- delete it, including your account, unless the law requires us to keep it
- stop a use of it that you agreed to earlier

Email [{{contact_email}}](mailto:{{contact_email}}). We may need to confirm who you are first.

## Children
Our website isn't meant for anyone under 18 to buy from. If you are under 18, use it only with a parent or guardian.

## Changes to this policy
We may update this policy. The date at the top shows when it last changed.

## Questions and complaints
Contact us about your privacy or any complaint:

${CONTACT_LINES}

We acknowledge complaints within 48 hours and aim to resolve them within one month.`;

const terms = `These terms apply when you use the Salman Perfumes website or buy from it. By using the website or placing an order, you agree to them. Our [Shipping Policy](/shipping-policy), [Return & Refund Policy](/return-policy) and [Privacy Policy](/privacy-policy) also apply.

## Who we are
Salman Perfumes, {{address}}.

## Who can order
You must be at least 18, or use the website with a parent or guardian.

## Your account
Give accurate details and keep your password private. You are responsible for orders placed through your account. Tell us if you think someone else has used it.

## Products
We try to describe and photograph our products accurately. Colours and packaging may look different on your screen, or change over time. Scent is personal and can smell different from one person to another.

## Using our products safely
- Perfumes and oils are for external use only. Try a small amount on your skin first, and stop if you notice irritation. If you have allergies or sensitive skin, ask a doctor.
- Keep them away from your eyes and from broken skin.
- Alcohol-based perfumes catch fire easily. Keep them away from flames and heat.
- Bakhoor is made to be burned. Use a heat-safe burner on a steady surface, keep the room ventilated, never leave it unattended, and keep it away from children, pets and anything that can catch fire.
- Keep all products out of reach of children.

## Prices and payment
Prices are in Indian rupees (₹). Any delivery and cash on delivery charges are shown at checkout before you place your order. You can pay online through Razorpay, or by cash on delivery where it is offered. If a price or product detail is clearly wrong, we may cancel the order and refund anything you have paid.

## Orders
An order paid online is confirmed once the payment succeeds. A cash on delivery order is confirmed when you place it. We may refuse or cancel an order if a product is unavailable, we can't deliver to the address, a price was wrong, or we suspect fraud or misuse. If we do, we'll refund anything you have paid, in full.

## Delivery, cancellations and returns
See our [Shipping Policy](/shipping-policy) and [Return & Refund Policy](/return-policy).

## Reviews and photos
A review or photo you post must be honest, based on your own experience, and yours to share. Don't post anything unlawful, offensive or misleading, or anything with another person's private information. You allow us to show your review and photos on our website. We may hide or remove reviews that break these rules.

## Using the website
Don't misuse the website, try to get into accounts or areas you aren't allowed into, disrupt it or place fake orders.

## Our content
The Salman Perfumes name and logo, and the website's photos, text and design, belong to us or are used with permission. Don't copy them or use them commercially without our written consent.

## Our responsibility
We aren't responsible for delays or failures caused by things outside our reasonable control. As far as the law allows, our total responsibility for an order is limited to the amount you paid for it. Nothing in these terms takes away any right you have under consumer protection law in India.

## Law and disputes
The laws of India apply to these terms. Please contact us first so we can try to sort out any problem. The courts in Kozhikode, Kerala, handle disputes. This doesn't limit your right to take a complaint to a consumer commission where the law allows.

## Changes
We may update these terms. The terms shown when you place an order apply to that order.

## Contact and complaints
${CONTACT_LINES}

We acknowledge complaints within 48 hours and aim to resolve them within one month.`;

export const DEFAULT_POLICIES: Record<PolicySlug, PolicyText> = {
  shipping: { body: shipping, summary: null },
  returns: { body: returns, summary: returnsSummary },
  privacy: { body: privacy, summary: null },
  terms: { body: terms, summary: null },
};
