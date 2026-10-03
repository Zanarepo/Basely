import { Navbar } from "@/components/landing/Navbar"
import { HeroSection } from "@/components/landing/HeroSection"
import { ShowcaseSection } from "@/components/landing/ShowcaseSection"
import { AiCapabilityShowcase } from "@/components/landing/AiCapabilityShowcase"
import { FeatureTabs } from "@/components/landing/FeatureTabs"
import { TrustProof } from "@/components/landing/TrustProof"
import { BentoGrid } from "@/components/landing/BentoGrid"
import { InteractiveDemo } from "@/components/landing/InteractiveDemo"
import { PricingSection } from "@/components/landing/PricingSection"
import { Footer } from "@/components/landing/Footer"
import { MobileCta } from "@/components/landing/MobileCta"

import { createClient } from "@/utils/supabase/server"

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  // Fetch public pricing tiers to feed dynamically into the landing page
  const { data: tiers } = await supabase
    .from('subscription_tiers')
    .select('*')
    .eq('billing_model', 'flat_rate')

  return (
    <div className="dark min-h-screen bg-app-bg text-app-fg selection:bg-violet-500/30 font-sans">
      <Navbar isLoggedIn={isLoggedIn} />
      <main>
        <HeroSection isLoggedIn={isLoggedIn} />
        <ShowcaseSection />
        <AiCapabilityShowcase />
        <FeatureTabs />
        <TrustProof />
        <BentoGrid />
        <InteractiveDemo />
        <PricingSection initialTiers={tiers || []} />
      </main>
      <Footer />
      <MobileCta isLoggedIn={isLoggedIn} />
    </div>
  )
}
