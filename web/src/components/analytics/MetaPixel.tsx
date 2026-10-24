import Script from "next/script";

/**
 * Meta's base pixel, exactly as Events Manager hands it out, loaded on the
 * storefront only — it lives in the (site) layout, so /admin and /delivery
 * never report their staff's page views.
 *
 * It reports one PageView on load. It also reports one for every page the
 * visitor moves to afterwards: the library hooks history.pushState, which is
 * how Next.js navigates without reloading, so nothing here has to. (Set
 * `fbq.disablePushState = true` before `init` to turn that off.)
 *
 * The id is read here on the server, not inlined as a NEXT_PUBLIC_ variable,
 * for the same reason the Razorpay key is: it is configuration, and changing it
 * should be an env change alone. Unset it and nothing loads, which is what
 * local and preview deploys want — a pixel that is on there reports every test
 * checkout to Meta as a real sale.
 */
export function MetaPixel() {
  const pixelId = process.env.META_PIXEL_ID?.trim();
  if (!pixelId) return null;

  // It is written into a script below, so a stray quote or newline from a
  // careless paste would break the snippet rather than just the id.
  if (!/^\d+$/.test(pixelId)) {
    console.error("[meta-pixel] META_PIXEL_ID must be the numeric pixel id; the pixel is off.");
    return null;
  }

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
`}
      </Script>
      <noscript>
        {/* A 1px beacon for browsers with scripts off; next/image has no use here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
