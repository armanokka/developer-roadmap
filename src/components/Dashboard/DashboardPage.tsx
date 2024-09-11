import { useEffect, useState } from 'react';
import { httpGet } from '../../lib/http';
import { useToast } from '../../hooks/use-toast';
import { useStore } from '@nanostores/react';
import { $teamList } from '../../stores/team';
import type { TeamListResponse } from '../TeamDropdown/TeamDropdown';
import { DashboardTab } from './DashboardTab';
import { PersonalDashboard, type BuiltInRoadmap } from './PersonalDashboard';
import { TeamDashboard } from './TeamDashboard';
import { getUser } from '../../lib/jwt';

type DashboardPageProps = {
  builtInRoleRoadmaps?: BuiltInRoadmap[];
  builtInSkillRoadmaps?: BuiltInRoadmap[];
  builtInBestPractices?: BuiltInRoadmap[];
};

export function DashboardPage(props: DashboardPageProps) {
  const { builtInRoleRoadmaps, builtInBestPractices, builtInSkillRoadmaps } =
    props;

  const currentUser = getUser();
  const toast = useToast();
  const teamList = useStore($teamList);

  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string>();

  async function getAllTeams() {
    if (teamList.length > 0) {
      return;
    }

    const { response, error } = await httpGet<TeamListResponse>(
      `${import.meta.env.PUBLIC_API_URL}/v1-get-user-teams`,
    );
    if (error || !response) {
      toast.error(error?.message || 'Something went wrong');
      return;
    }

    $teamList.set(response);
  }

  useEffect(() => {
    getAllTeams().finally(() => setIsLoading(false));
  }, []);

  const userAvatar =
    currentUser?.avatar && !isLoading
      ? `${import.meta.env.PUBLIC_AVATAR_BASE_URL}/${currentUser.avatar}`
      : '/images/default-avatar.png';

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-8">
      <div className="container">
        <div className="mb-8 flex flex-wrap items-center gap-1.5">
          <DashboardTab
            label="Personal"
            isActive={!selectedTeamId}
            onClick={() => setSelectedTeamId(undefined)}
            avatar={userAvatar}
          />
          {isLoading && (
            <>
              <DashboardTabSkeleton />
              <DashboardTabSkeleton />
            </>
          )}

          {!isLoading && (
            <>
              {teamList.map((team) => {
                const { avatar } = team;
                const avatarUrl = avatar
                  ? `${import.meta.env.PUBLIC_AVATAR_BASE_URL}/${avatar}`
                  : '/images/default-avatar.png';
                return (
                  <DashboardTab
                    key={team._id}
                    label={team.name}
                    isActive={team._id === selectedTeamId}
                    {...(team.status === 'invited'
                      ? {
                          href: `/respond-invite?i=${team.memberId}`,
                        }
                      : {
                          onClick: () => {
                            setSelectedTeamId(team._id);
                          },
                        })}
                    avatar={avatarUrl}
                  />
                );
              })}
              <DashboardTab
                label="+ Create Team"
                isActive={false}
                href="/team/new"
                className="border bg-transparent border-dashed text-gray-500 border-gray-300 text-sm px-3 hover:border-gray-600 hover:text-black text-[13px]"
              />
            </>
          )}
        </div>

        {!selectedTeamId && (
          <PersonalDashboard
            builtInRoleRoadmaps={builtInRoleRoadmaps}
            builtInSkillRoadmaps={builtInSkillRoadmaps}
            builtInBestPractices={builtInBestPractices}
          />
        )}
        {selectedTeamId && <TeamDashboard teamId={selectedTeamId} />}
      </div>
    </div>
  );
}

function DashboardTabSkeleton() {
  return (
    <div className="h-[30px] w-[114px] animate-pulse rounded-md border bg-white"></div>
  );
}
