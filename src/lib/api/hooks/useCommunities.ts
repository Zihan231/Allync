import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCommunityRequest,
  updateCommunityRequest,
  deleteCommunityRequest,
  getCommunities,
  getCommunity,
  getCommunityMembersRequest,
  joinCommunityRequest,
  leaveCommunityRequest,
} from "@/lib/api/communities";
import {
  applyCommunityCreated,
  applyCommunityUpdated,
  applyCommunityDeleted,
} from "@/lib/mock/communityStore";
import type { Community } from "@/lib/mock/types";
import { colorFromString } from "@/lib/colorHash";

export const communityKeys = {
  all: ["communities"] as const,
  detail: (communityId: string) => ["communities", communityId] as const,
  members: (communityId: string) => ["communities", communityId, "members"] as const,
};

export function useCreateCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      input,
      creatorPersonId,
    }: {
      input: { name: string; rules: string; joinPolicy: Community["joinPolicy"] };
      creatorPersonId: string;
    }) => {
      const initials = input.name
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      const color = colorFromString(input.name);

      const backendComm = await createCommunityRequest({
        name: input.name,
        rules: input.rules,
        joinPolicy: input.joinPolicy,
        color,
        initials,
      });

      const community: Community = {
        id: backendComm.id,
        name: backendComm.name,
        color: backendComm.color || color,
        initials: backendComm.initials || initials,
        dpUrl: backendComm.dpUrl ?? null,
        coverUrl: backendComm.coverUrl ?? null,
        rules: backendComm.rules || input.rules,
        points: backendComm.points ?? 0,
        joinPolicy: input.joinPolicy,
        memberClubIds: backendComm.memberClubIds || [],
        freeAgentCount: backendComm.freeAgentCount ?? 0,
        tournamentIds: [],
        tier: (backendComm.tier as Community["tier"]) || "New",
      };

      applyCommunityCreated(community, creatorPersonId);
      return community;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}
