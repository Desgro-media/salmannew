import { Hero } from "@/components/home/Hero";
import { Marquee } from "@/components/home/Marquee";
import { BestSellers } from "@/components/home/BestSellers";
import { SignatureCollections } from "@/components/home/SignatureCollections";
import { FeatureSpotlight } from "@/components/home/FeatureSpotlight";
import { InstagramReels } from "@/components/home/InstagramReels";
import { NewsletterBand } from "@/components/home/NewsletterBand";
import { Reviews } from "@/components/home/Reviews";

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <BestSellers />
      <InstagramReels />
      <SignatureCollections />
      <FeatureSpotlight />
      <NewsletterBand />
      <Reviews />
    </>
  );
}
