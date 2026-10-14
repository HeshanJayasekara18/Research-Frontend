"use client";

import { useHealth } from "@/features/knowledge-assistant/hooks/useHealth";
import { useRecentSearches } from "@/features/knowledge-assistant/hooks/useRecentSearches";

import type { ResolvedAssets } from "../lib/assets";
import {
  ChannelOverview,
  ContentOpportunities,
  CreatorHero,
  FeatureCard,
  RecentActivity,
  RecentVideos,
  RecommendedActions,
} from "./sections";
import { SectionHeader } from "./parts";

/** Dashboard main body. The app shell (sidebar, header) is untouched and rendered by the layout. */
export function DashboardBody({ assets }: { assets: ResolvedAssets }) {
  const health = useHealth(); // C3 is currently the only connected backend
  const recent = useRecentSearches();
  const online = Boolean(health.health);

  return (
    <div className="mx-auto grid w-full max-w-[1760px] gap-5 md:gap-6">
      {/* A. Hero + channel overview (≈70 / 30) */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] 2xl:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
        <CreatorHero image={assets.hero} />
        <ChannelOverview health={health} />
      </div>

      {/* B. Creator tools gallery */}
      <section aria-labelledby="creator-tools" className="scroll-mt-6">
        <SectionHeader id="creator-tools" title="Explore your creator tools" description="Four research components, one workspace" />
        <div className="grid gap-4 grid-cols-1 min-[520px]:grid-cols-2 xl:grid-cols-4 2xl:gap-5">
          <FeatureCard href="/market-research" title="Market Research" description="Discover trends and content opportunities." image={assets.marketResearch} icon="market" tone="coral" status="soon" />
          <FeatureCard href="/video-prediction" title="Video Prediction" description="Explore predictions for your next video." image={assets.videoPrediction} icon="video" tone="violet" status="soon" />
          <FeatureCard href="/knowledge-assistant" title="Knowledge Assistant" description="Ask Youbeyo about your audience comments." image={assets.knowledgeAssistant} icon="chat" tone="indigo" status="live" containImage={assets.knowledgeAssistant === "/images/youbeyotube.png"} />
          <FeatureCard href="/analytics" title="Analytics" description="Understand your content performance." image={assets.analytics} icon="analytics" tone="teal" status="soon" />
        </div>
      </section>

      {/* C. Opportunities + recommendations */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] 2xl:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
        <ContentOpportunities />
        <RecommendedActions assistantOnline={online} checking={health.loading} />
      </div>

      {/* D + E. Recent videos + activity */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] 2xl:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
        <RecentVideos />
        <RecentActivity items={recent.items} />
      </div>
    </div>
  );
}
