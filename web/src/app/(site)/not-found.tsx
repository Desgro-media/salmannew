import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[80svh] flex-col items-center justify-center px-6 pt-16 text-center md:pt-20">
      <p className="eyebrow text-ink-soft">404</p>
      <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
        This page evaporated.
      </h1>
      <p className="mt-4 max-w-sm text-ink-soft">
        The page you&rsquo;re looking for doesn&rsquo;t exist, or has moved.
      </p>
      <div className="mt-8">
        <ButtonLink href="/">Back to Home</ButtonLink>
      </div>
    </div>
  );
}
