import { useMutation } from "@tanstack/react-query";
import { createClubRequest, updateClubRequest, deleteClubRequest } from "@/lib/api/clubs";
import {
  getPerson,
  applyClubCreated,
  applyClubUpdated,
  applyClubDeleted,
} from "@/lib/mock/communityStore";
import type { Club } from "@/lib/mock/types";

const CLUB_PATCH_FIELDS = [
  "name",
  "description",
  "dpUrl",
  "coverUrl",
  "joinPolicy",
  "color",
  "motto",
  "location",
  "facebookUrl",
  "minRoster",
  "maxRoster",
  "communityIds",
  "stage",
] as const;

export function useCreateClub() {
  return useMutation({
    mutationFn: async ({
      input,
      creatorPersonId,
    }: {
      input: { name: string; description: string; color: string; joinPolicy: Club["joinPolicy"] };
      creatorPersonId: string;
    }) => {
      const person = getPerson(creatorPersonId);
      if (person?.clubId) {
        throw new Error(
          "You are already a member of a club. You cannot create a new club while belonging to an existing one.",
        );
      }

      const initials = input.name
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      const backendClub = await createClubRequest({
        name: input.name,
        description: input.description,
        color: input.color,
        initials,
        joinPolicy: input.joinPolicy,
      });

      const club: Club = {
        id: backendClub.id,
        name: input.name,
        color: input.color,
        initials,
        dpUrl: backendClub?.dpUrl ?? null,
        coverUrl: backendClub?.coverUrl ?? null,
        description: input.description,
        points: 0,
        joinPolicy: input.joinPolicy,
        minRoster: 4,
        maxRoster: 8,
        communityIds: [],
        stage: "Foundation",
      };

      applyClubCreated(club, creatorPersonId);
      return club;
    },
  });
}

export function useUpdateClub(clubId: string) {
  return useMutation({
    mutationFn: async (patch: Partial<Club>) => {
      const backendPatch: Record<string, unknown> = {};
      for (const field of CLUB_PATCH_FIELDS) {
        if (patch[field] !== undefined) backendPatch[field] = patch[field];
      }
      await updateClubRequest(clubId, backendPatch);
      applyClubUpdated(clubId, patch);
    },
  });
}

export function useDeleteClub() {
  return useMutation({
    mutationFn: async (clubId: string) => {
      await deleteClubRequest(clubId);
      applyClubDeleted(clubId);
    },
  });
}
