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
  transferCommunityPresidentRequest,
  addClubToCommunityRequest,
  removeClubFromCommunityRequest,
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
      input: {
        name: string;
        rules: string;
        joinPolicy: Community["joinPolicy"];
        dpUrl?: string | null;
        coverUrl?: string | null;
        location: string;
      };
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
        dpUrl: input.dpUrl,
        coverUrl: input.coverUrl,
        location: input.location,
      });

      const community: Community = {
        id: backendComm.id,
        name: backendComm.name,
        color: backendComm.color || color,
        initials: backendComm.initials || initials,
        dpUrl: backendComm.dpUrl ?? input.dpUrl ?? null,
        coverUrl: backendComm.coverUrl ?? input.coverUrl ?? null,
        rules: backendComm.rules || input.rules,
        points: backendComm.points ?? 0,
        joinPolicy: input.joinPolicy,
        memberClubIds: backendComm.memberClubIds || [],
        freeAgentCount: backendComm.freeAgentCount ?? 0,
        tournamentIds: [],
        tier: (backendComm.tier as Community["tier"]) || "New",
        location: backendComm.location ?? input.location,
      };

      applyCommunityCreated(community, creatorPersonId);
      return community;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}

export function useUpdateCommunity(communityId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name?: string;
      rules?: string;
      dpUrl?: string | null;
      coverUrl?: string | null;
      joinPolicy?: Community["joinPolicy"];
      location?: string;
    }) => {
      const updated = await updateCommunityRequest(communityId, payload);
      applyCommunityUpdated(communityId, {
        name: updated.name,
        rules: updated.rules,
        dpUrl: updated.dpUrl ?? payload.dpUrl ?? null,
        coverUrl: updated.coverUrl ?? payload.coverUrl ?? null,
        joinPolicy: (updated.joinPolicy || "instant") as Community["joinPolicy"],
        location: updated.location ?? payload.location,
      });
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.detail(communityId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}

export function useJoinCommunity(communityId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => joinCommunityRequest(communityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.detail(communityId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.members(communityId) });
    },
  });
}

export function useLeaveCommunity(communityId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => leaveCommunityRequest(communityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.detail(communityId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.members(communityId) });
    },
  });
}
export function useCommunity(communityId: string) {
  return useQuery({
    queryKey: communityKeys.detail(communityId),
    queryFn: async () => {
      const bc = await getCommunity(communityId);
      const mapped: Community = {
        id: bc.id,
        name: bc.name,
        creatorId: (bc as any).creatorId ?? null,
        dpUrl: bc.dpUrl ?? null,
        coverUrl: bc.coverUrl ?? null,
        rules: bc.rules || "",
        points: bc.points ?? 0,
        joinPolicy: (bc.joinPolicy || "instant") as Community["joinPolicy"],
        memberClubIds: bc.memberClubIds || [],
        freeAgentCount: bc.freeAgentCount ?? 0,
        tournamentIds: [],
        color: bc.color || "#4c8dff",
        initials: bc.initials || "CM",
        tier: (bc.tier || "New") as Community["tier"],
        location: bc.location ?? undefined,
        motto: bc.motto ?? undefined,
        facebookUrl: bc.facebookUrl ?? undefined,
      };
      return mapped;
    },
    enabled: Boolean(communityId),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCommunityMembers(communityId: string) {
  return useQuery({
    queryKey: communityKeys.members(communityId),
    queryFn: () => getCommunityMembersRequest(communityId),
    enabled: Boolean(communityId),
    staleTime: 1000 * 60 * 2,
  });
}

export function useTransferCommunityPresident(communityId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { targetUserId?: string; targetProfileId?: string }) =>
      transferCommunityPresidentRequest(communityId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.detail(communityId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.members(communityId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}

export function useDeleteCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (communityId: string) => {
      await deleteCommunityRequest(communityId);
      applyCommunityDeleted(communityId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}

export function useAddClubToCommunity(communityId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clubId: string) => addClubToCommunityRequest(communityId, clubId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.detail(communityId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
      queryClient.invalidateQueries({ queryKey: ["community-requests", communityId] });
      queryClient.invalidateQueries({ queryKey: ["community-clubs", communityId] });
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
  });
}

export function useRemoveClubFromCommunity(communityId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clubId: string) => removeClubFromCommunityRequest(communityId, clubId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.detail(communityId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
      queryClient.invalidateQueries({ queryKey: ["community-clubs", communityId] });
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
  });
}
