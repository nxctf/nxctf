import type { Step } from 'react-joyride'

export const CHALLENGE_TOUR_VERSION = 4
export const CHALLENGE_TOUR_RESTART_EVENT = 'challenge-tour-restart'

export function buildChallengeTourSteps(): Step[] {
  return [
    {
      target: 'body',
      content: 'Welcome to Challenges. This quick desktop tour covers the sticky tab switcher, event pills, sidebar filters, tools, and challenge list.',
      placement: 'center',
          },
    {
      target: '[data-tour="challenge-page-tabs"]',
      content: 'This sticky switcher moves between Challenges and Events. It stays visible above the desktop filter rail while you scroll.',
      placement: 'right',
    },
    {
      target: '[data-tour="challenge-event-selector"]',
      content: 'Pick All, Main, or a specific event from this single-row selector. If there are many events, use the side arrows to move through them.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="challenge-filter-bar"]',
      content: 'The top bar now stays compact: event pills on the left, then clear, sort, layout, and settings tools on the right.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="challenge-sidebar-filters"]',
      content: 'Desktop filters live in this sticky sidebar. Use it for search, status, feature type, difficulty, and categories.',
      placement: 'right',
    },
    {
      target: '[data-tour="challenge-sidebar-search-filter"]',
      content: 'Open search here to find challenges by title or description. You can also press / anywhere on the challenges page for quick search.',
      placement: 'right',
    },
    {
      target: '[data-tour="challenge-sidebar-status-filter"]',
      content: 'Cycle status between All Status, Unsolved, and Solved without opening a dropdown.',
      placement: 'right',
    },
    {
      target: '[data-tour="challenge-sidebar-feature-filter"]',
      content: 'Cycle feature type between All Features, Tasks, and Services. Challenges with both still appear in Tasks or Services.',
      placement: 'right',
    },
    {
      target: '[data-tour="challenge-sidebar-difficulty-filter"]',
      content: 'Pick a difficulty here. The gauge icon marks this as the difficulty filter even when it is set to All Difficulties.',
      placement: 'right',
    },
    {
      target: '[data-tour="challenge-sort-toggle"]',
      content: 'Toggle sorting between the default challenge order and newest-first.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="challenge-layout-toggle"]',
      content: 'Cycle between grouped, category compact, and compact layouts. Category compact keeps category ordering without category headers.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="challenge-filter-settings"]',
      content: 'Open settings to hide maintenance challenges, control team-solve highlighting, or reset this tutorial later.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="challenge-card"]',
      content: 'Open a challenge card to read the prompt, use services or tasks when available, and submit flags.',
      placement: 'top',
    },
  ]
}

export function getAvailableChallengeTourSteps(steps: Step[]): Step[] {
  if (typeof document === 'undefined') return []

  return steps.filter((step) => {
    if (step.target === 'body') return true
    if (typeof step.target !== 'string') return false
    return Boolean(document.querySelector(step.target))
  })
}

