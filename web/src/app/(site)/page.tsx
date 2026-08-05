import { Hero } from "@/components/home/Hero";
import { Marquee } from "@/components/home/Marquee";
import { CollectionGrid } from "@/components/home/CollectionGrid";
import { FeatureSpotlight } from "@/components/home/FeatureSpotlight";
import { BrandStory } from "@/components/home/BrandStory";
import { NewsletterBand } from "@/components/home/NewsletterBand";

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <CollectionGrid />
      <FeatureSpotlight />
      <BrandStory />
      <NewsletterBand />
    </>
  );
}
