import { Hero } from "@/components/sections/Hero";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { CocosFitIntro } from "@/components/sections/CocosFitIntro";
import { ThreeStepSection } from "@/components/sections/ThreeStepSection";
import { MaterialSection } from "@/components/sections/MaterialSection";
import { PortfolioSection } from "@/components/sections/PortfolioSection";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { ReviewSection } from "@/components/sections/ReviewSection";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { scrollToId } from "@/lib/router";

interface LandingPageProps {
  onNavigate: (to: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <main>
      <Hero
        onNavigate={onNavigate}
        onScrollToPortfolio={() => scrollToId("portfolio")}
      />
      <ProblemSection />
      <CocosFitIntro onNavigate={onNavigate} />
      <ThreeStepSection />
      <MaterialSection />
      <PortfolioSection />
      <ProcessSection />
      <ReviewSection />
      <FinalCTA onNavigate={onNavigate} />
    </main>
  );
}
