import { Fragment } from "react";
import Link from "next/link";
import { parsePolicy, type Inline } from "@/lib/policies/markup";

// No "use client" and no server imports: the public pages render this on the
// server and the admin editor renders the same thing as its live preview.

const linkClass = "font-medium underline underline-offset-4 hover:text-gold-ink";

function InlineContent({ parts }: { parts: Inline[] }) {
  return parts.map((part, i) => {
    if (part.type === "text") return <Fragment key={i}>{part.value}</Fragment>;
    if (part.type === "bold") {
      return (
        <strong key={i} className="font-semibold text-ink">
          <InlineContent parts={part.children} />
        </strong>
      );
    }
    if (part.href.startsWith("/")) {
      return (
        <Link key={i} href={part.href} className={linkClass}>
          <InlineContent parts={part.children} />
        </Link>
      );
    }
    const external = /^https?:/i.test(part.href);
    return (
      <a
        key={i}
        href={part.href}
        className={linkClass}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        <InlineContent parts={part.children} />
      </a>
    );
  });
}

export function PolicyBody({ text }: { text: string }) {
  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-ink-soft [overflow-wrap:break-word]">
      {parsePolicy(text).map((block, i) => {
        if (block.type === "heading") {
          const Tag = block.level === 2 ? "h2" : "h3";
          return (
            <Tag
              key={i}
              className={
                block.level === 2
                  ? "pt-6 text-xl font-black tracking-tight text-ink first:pt-0 md:text-2xl"
                  : "pt-2 text-base font-semibold text-ink first:pt-0"
              }
            >
              <InlineContent parts={block.content} />
            </Tag>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={i} className="list-disc space-y-2 pl-5">
              {block.items.map((item, n) => (
                <li key={n}>
                  <InlineContent parts={item} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {block.lines.map((line, n) => (
              <Fragment key={n}>
                {n > 0 && <br />}
                <InlineContent parts={line} />
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
