// Meta's pixel is a plain <script> that hangs `fbq` off `window`, with no types
// of its own. Only the one call this app's code makes is declared — `init` is
// done by the inline snippet in MetaPixel, and everything else goes through
// lib/meta-pixel.ts. Optional because it does not exist when no pixel is
// configured, or when the script is blocked.

interface Window {
  fbq?: (
    command: "track",
    event: string,
    params?: Record<string, unknown>,
    options?: { eventID?: string },
  ) => void;
}
