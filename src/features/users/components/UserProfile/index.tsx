'use client'

import { useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import Loader from '@/shared/components/Loader'
import PageBackground from '@/shared/components/PageBackground'
import { EventProvider } from '@/features/events/contexts/EventContext'
import { useUserProfile } from '../../hooks/useUserProfile'
import { UserProfileProps } from '../../types'
import { getUserBadges } from '../../lib/badge-utils'

import ProfileTabs from './ProfileTabs'
import ProfileHeader from './ProfileHeader'
import StatsGrid from './StatsGrid'
import ProgressSection from './ProgressSection'
import SolvedChallenges from './SolvedChallenges'
import UnsolvedChallengesModal from './UnsolvedChallengesModal'
import UserStats from './UserStats'
import EditProfileModal from './EditProfileModal'
import { UserEmptyState } from '../ui/UserEmptyState'

function UserProfileInner({
  userId,
  loading,
  error,
  onBack,
  isCurrentUser = false,
}: UserProfileProps) {
  const {
    userDetail,
    setUserDetail,
    loadingDetail,
    initialLoading,
    activeTab,
    setActiveTab,
    profileEvents,
    effectiveSelectedEvent,
    setSelectedEvent,
    showMainOption,
    solvedChallenges,
    firstBloodIds,
    categoryTotals,
    difficultyTotals,
    teamInfo,
    authInfo,
    showAllModal,
    setShowAllModal,
    showUnsolvedModal,
    setShowUnsolvedModal,
    unsolvedChallenges,
    loadingUnsolved,
    handleShowUnsolved,
    refreshUserDetail,
  } = useUserProfile(userId, isCurrentUser)

  const hasError = error || !userDetail
  const avatarSrc = userDetail?.profile_picture_url || userDetail?.picture || null

  const completedCategoryCount = useMemo(() => {
    return categoryTotals.reduce((count, { category, total_challenges }) => {
      if (!total_challenges) return count
      const solvedInCategory = solvedChallenges.filter(c => c.category === category).length
      return solvedInCategory >= total_challenges ? count + 1 : count
    }, 0)
  }, [categoryTotals, solvedChallenges])

  const badges = useMemo(() => {
    return (userDetail && (solvedChallenges.length > 0 || firstBloodIds.length > 0 || (userDetail.rank && userDetail.rank > 0)))
      ? getUserBadges(userDetail.rank, firstBloodIds.length, solvedChallenges.length, completedCategoryCount)
      : []
  }, [userDetail, solvedChallenges, firstBloodIds, completedCategoryCount])

  if (initialLoading) {
    return (
      <PageBackground
        className="flex justify-center items-center overflow-hidden"
        selectionClassName="selection:bg-blue-500/30"
      >
        <Loader color="text-blue-500" />
      </PageBackground>
    )
  }

  if (hasError) {
    return (
      <PageBackground
        className="relative overflow-hidden"
        selectionClassName="selection:bg-blue-500/30"
      >
        <main className="relative z-10 mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-5xl items-center justify-center px-4 py-10 sm:px-6">
          <UserEmptyState
            icon={AlertTriangle}
            title={error || 'User not found'}
            description={isCurrentUser ? 'Failed to load your profile.' : 'User not found.'}
            action={onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-500/20 dark:text-blue-400"
              >
                Go Back
              </button>
            ) : null}
            className="w-full max-w-md"
          />
        </main>
      </PageBackground>
    )
  }

  return (
    <PageBackground
      className="relative overflow-hidden"
      selectionClassName="selection:bg-blue-500/30"
    >
      <main className="relative z-10 mx-auto w-full max-w-5xl space-y-4 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        {loading || loadingDetail ? (
          <div className="flex justify-center py-4 opacity-70">
            <Loader color="text-blue-500" />
          </div>
        ) : null}

        {userDetail && (
          <>
            <ProfileTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onBack={onBack}
              editAction={
                isCurrentUser && userDetail ? (
                  <EditProfileModal
                    userId={userDetail.id}
                    currentUsername={userDetail.username}
                    currentBio={userDetail.bio || ''}
                    currentProfilePictureUrl={userDetail.profile_picture_url || ''}
                    currentSosmed={userDetail.sosmed || {}}
                    onUsernameChange={username => setUserDetail({ ...userDetail, username })}
                    onProfileChange={({ username, bio, sosmed, profile_picture_url }) => {
                      const nextProfileUrl = profile_picture_url ?? userDetail.profile_picture_url ?? null
                      const isGooglePicture = !!userDetail.picture && userDetail.picture !== userDetail.profile_picture_url
                      const nextPicture = isGooglePicture ? userDetail.picture : (nextProfileUrl || null)
                      setUserDetail({
                        ...userDetail,
                        username,
                        bio,
                        sosmed,
                        profile_picture_url: nextProfileUrl,
                        picture: nextPicture,
                      })
                    }}
                    onSaved={refreshUserDetail}
                    authInfo={authInfo}
                  />
                ) : null
              }
            />

            <ProfileHeader
              userDetail={userDetail}
              avatarSrc={avatarSrc}
              badges={badges}
              effectiveSelectedEvent={effectiveSelectedEvent}
              setSelectedEvent={setSelectedEvent}
          profileEvents={profileEvents}
          showMainOption={showMainOption}
        />

            <StatsGrid
              userDetail={userDetail}
              solvedChallengesCount={solvedChallenges.length}
              firstBloodCount={firstBloodIds.length}
              teamInfo={teamInfo}
            />
          </>
        )}

        {activeTab === 'profile' ? (
          <div key="profile-content" className="space-y-5">
            <ProgressSection
              categoryTotals={categoryTotals}
              difficultyTotals={difficultyTotals}
              solvedChallenges={solvedChallenges}
            />

            <SolvedChallenges
              solvedChallenges={solvedChallenges}
              firstBloodIds={firstBloodIds}
              showAllModal={showAllModal}
              setShowAllModal={setShowAllModal}
              onShowUnsolved={handleShowUnsolved}
            />
          </div>
        ) : (
          <div key="stats-content">
            <UserStats
              solvedChallenges={solvedChallenges}
              firstBloodIds={firstBloodIds}
            />
          </div>
        )}

        <UnsolvedChallengesModal
          open={showUnsolvedModal}
          onOpenChange={setShowUnsolvedModal}
          loading={loadingUnsolved}
          unsolvedChallenges={unsolvedChallenges}
        />
      </main>
    </PageBackground>
  )
}

export default function UserProfile(props: UserProfileProps) {
  return (
    <EventProvider>
      <UserProfileInner {...props} />
    </EventProvider>
  )
}
