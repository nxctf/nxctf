"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { Loader } from "@/shared/components";
import { AppSidebarShell } from "@/shared/components/AppSidebarShell";
import PageBackground from "@/shared/components/PageBackground";
import { getChallengeGuideSeenSetting } from "@/shared/lib";
import { EventProvider } from "@/features/events/contexts/EventContext";
import { FilterProvider } from "../contexts/FilterContext";
import { SubChallengesProvider } from "../contexts/SubChallengesContext";
import { useChallengesPageData } from "../hooks/useChallengesPageData";
import {
  CHALLENGE_TOUR_RESTART_EVENT,
  CHALLENGE_TOUR_VERSION,
} from "../lib/challenge-tour-steps";
import ChallengesTabPanel from "./challenges-page/ChallengesTabPanel";
import EventsTabPanel from "./challenges-page/EventsTabPanel";
import DesktopChallengeFilterSidebar from "./challenge-filter-bar/DesktopChallengeFilterSidebar";

const ChallengeDialogs = dynamic(
  () => import("./challenges-page/ChallengeDialogs"),
  {
    ssr: false,
    loading: () => null,
  },
);

const ChallengeJoyride = dynamic(() => import("./ChallengeJoyride"), {
  ssr: false,
  loading: () => null,
});

function useIdleMount(delay = 1200) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mounted) return;

    const mount = () => setMounted(true);

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(mount, { timeout: delay });
      return () => window.cancelIdleCallback(id);
    }

    const id = globalThis.setTimeout(mount, delay);
    return () => globalThis.clearTimeout(id);
  }, [delay, mounted]);

  return mounted;
}

function ChallengesPageInner() {
  const data = useChallengesPageData();
  const renderDeferredDecorations = useIdleMount();
  const [renderJoyride, setRenderJoyride] = useState(false);
  const renderDialogs = data.isJoinDialogOpen || !!data.selectedChallenge;

  useEffect(() => {
    if (!data.user || data.currentTab !== "challenges") return;
    if (!window.matchMedia("(min-width: 1280px)").matches) return;

    const shouldRenderTour = !getChallengeGuideSeenSetting(
      data.user.id,
      CHALLENGE_TOUR_VERSION,
    );
    if (shouldRenderTour) setRenderJoyride(true);
  }, [data.currentTab, data.user]);

  useEffect(() => {
    const handleTourRestart = () => {
      if (!window.matchMedia("(min-width: 1280px)").matches) return;
      setRenderJoyride(true);
    };

    window.addEventListener(CHALLENGE_TOUR_RESTART_EVENT, handleTourRestart);
    return () =>
      window.removeEventListener(
        CHALLENGE_TOUR_RESTART_EVENT,
        handleTourRestart,
      );
  }, []);

  useEffect(() => {
    if (data.currentTab !== "challenges") return;

    const handleSearchShortcut = (event: KeyboardEvent) => {
      if (event.key !== "/") return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (isTyping) return;

      event.preventDefault();

      if (window.matchMedia("(min-width: 1280px)").matches) {
        document.dispatchEvent(new Event("challenge-search-open"));
        return;
      }

      document.getElementById("challenge-filter-search")?.focus();
    };

    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, [data.currentTab]);

  if (data.loading) return <Loader fullscreen />;
  if (!data.user) return null;

  return (
    <AppSidebarShell
      title="Challenges"
      subtitle="Browse and solve challenges across all categories."
      mobileSidebarTitle="Challenge Filters"
      sidebar={
        <DesktopChallengeFilterSidebar
          currentTab={data.currentTab}
          onTabChange={data.setCurrentTab}
          filters={data.filters}
          categories={data.categories}
          difficulties={data.difficulties}
          onFilterChange={data.setFilters}
        />
      }
    >
      <PageBackground className="flex flex-col">
        <div className="w-full pb-8 scrollbar-gutter-stable">
          {data.currentTab === "challenges" && (
            <ChallengesTabPanel data={data} />
          )}

          {data.currentTab === "events" && (
            <EventsTabPanel
              currentTab={data.currentTab}
              events={data.enrichedEvents}
              selectedEventId={data.eventId}
              onTabChange={data.setCurrentTab}
              onEventSelect={data.attemptEventSelect}
            />
          )}
        </div>
      {renderDialogs && <ChallengeDialogs data={data} />}
      {renderDeferredDecorations && renderJoyride && <ChallengeJoyride />}
      </PageBackground>
    </AppSidebarShell>
  );
}

export default function ChallengesPage() {
  return (
    <FilterProvider>
      <EventProvider>
        <SubChallengesProvider>
          <ChallengesPageInner />
        </SubChallengesProvider>
      </EventProvider>
    </FilterProvider>
  );
}
