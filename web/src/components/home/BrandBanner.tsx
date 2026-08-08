import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";

export function BrandBanner() {
  return (
    <section className="container-grid py-16 sm:py-24 md:py-32">
      <Reveal>
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-ink">
          <Image
            src="/logo/mark-gold-transparent.png"
            alt=""
            fill
            className="object-contain p-6 opacity-90 sm:p-12 md:p-24"
          />
        </div>
      </Reveal>

      <div className="mt-10 flex justify-center">
        <ButtonLink href="/shop">Shop Now</ButtonLink>
      </div>
    </section>
  );
}
