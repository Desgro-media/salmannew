// The few formatting marks a policy can use, parsed into plain data that
// PolicyBody renders as React elements. No HTML is ever read or written, so
// whatever is typed into the admin can only come out as text, headings, lists,
// bold and links to the kinds of address allowed below.
//
//   ## Heading        ### Smaller heading
//   - list item
//   **bold**          [link text](/contact)
//   a blank line starts a new paragraph
//
// Pure and free of server imports: the admin's live preview runs it in the browser.

export type Inline =
  | { type: "text"; value: string }
  | { type: "bold"; children: Inline[] }
  | { type: "link"; href: string; children: Inline[] };

export type Block =
  | { type: "heading"; level: 2 | 3; content: Inline[] }
  | { type: "list"; items: Inline[][] }
  | { type: "paragraph"; lines: Inline[][] };

/** The address a link may point at, or null if it is not one we will link to. */
export function safeHref(raw: string): string | null {
  const href = raw.trim();
  // Phone numbers are written with spaces; the link itself cannot have them.
  if (/^tel:/i.test(href)) return href.replace(/\s+/g, "");
  if (/\s/.test(href)) return null;
  // A page on this site. "//host" and "/\host" leave the site, so they don't count.
  if (/^\/(?![/\\])/.test(href)) return href;
  if (/^(https?:\/\/|mailto:)/i.test(href)) return href;
  return null;
}

export function parseInline(text: string): Inline[] {
  const token = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  const out: Inline[] = [];
  let last = 0;

  const pushText = (value: string) => {
    if (!value) return;
    const previous = out[out.length - 1];
    if (previous?.type === "text") previous.value += value;
    else out.push({ type: "text", value });
  };

  for (let match = token.exec(text); match; match = token.exec(text)) {
    pushText(text.slice(last, match.index));
    last = match.index + match[0].length;

    const [whole, bold, label, target] = match;
    if (bold !== undefined) {
      out.push({ type: "bold", children: parseInline(bold) });
      continue;
    }
    const href = safeHref(target);
    // An address we won't link to stays on the page as typed, so it gets noticed.
    if (href) out.push({ type: "link", href, children: parseInline(label) });
    else pushText(whole);
  }

  pushText(text.slice(last));
  return out;
}

export function parsePolicy(text: string): Block[] {
  const blocks: Block[] = [];
  // The paragraph or list still being added to; a blank line or a heading ends it.
  let open: Extract<Block, { type: "list" | "paragraph" }> | null = null;

  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();

    if (!line) {
      open = null;
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      // The page title is the only first-level heading, so "#" counts as "##".
      blocks.push({ type: "heading", level: heading[1].length === 3 ? 3 : 2, content: parseInline(heading[2]) });
      open = null;
      continue;
    }

    const item = /^[-•]\s+(.+)$/.exec(line);
    if (item) {
      if (open?.type !== "list") {
        open = { type: "list", items: [] };
        blocks.push(open);
      }
      open.items.push(parseInline(item[1]));
      continue;
    }

    if (open?.type !== "paragraph") {
      open = { type: "paragraph", lines: [] };
      blocks.push(open);
    }
    open.lines.push(parseInline(line));
  }

  return blocks;
}
