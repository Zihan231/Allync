import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import {
  addComment,
  deleteComment,
  getComments,
  getFeed,
  getFollowStats,
  setFollow,
  setLike,
  setSave,
  type FeedComment,
  type FeedItem,
  type FeedPage,
  type FeedTab,
} from "@/lib/api/feed";

export const feedKeys = {
  all: ["feed"] as const,
  tab: (tab: FeedTab) => ["feed", tab] as const,
  comments: (postId: string) => ["feed", "comments", postId] as const,
  follow: (coachId: string) => ["feed", "follow", coachId] as const,
};

/** Endless feed: pages chain by cursor; the ranking stays as of the first page. */
export function useFeed(tab: FeedTab, enabled = true) {
  return useInfiniteQuery({
    queryKey: feedKeys.tab(tab),
    queryFn: ({ pageParam }) => getFeed(tab, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
    staleTime: 60_000,
  });
}

/** Applies a change to a post wherever it's cached (every tab, every page). */
function usePatchPost() {
  const qc = useQueryClient();
  return (match: (item: FeedItem) => boolean, patch: (item: FeedItem) => FeedItem) => {
    qc.setQueriesData<InfiniteData<FeedPage>>({ queryKey: feedKeys.all }, (data) =>
      data && "pages" in data
        ? { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.map((it) => (match(it) ? patch(it) : it)) })) }
        : data,
    );
  };
}

/** Like / save update on screen at once and roll back if the server says no. */
export function useToggleLike() {
  const patch = usePatchPost();
  return useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) => setLike(id, on),
    onMutate: ({ id, on }) => patch((it) => it.id === id, (it) => ({ ...it, likedByMe: on, likeCount: Math.max(0, it.likeCount + (on ? 1 : -1)) })),
    onError: (_e, { id, on }) => patch((it) => it.id === id, (it) => ({ ...it, likedByMe: !on, likeCount: Math.max(0, it.likeCount + (on ? -1 : 1)) })),
    onSuccess: (res, { id }) => patch((it) => it.id === id, (it) => ({ ...it, likeCount: res.likeCount })),
  });
}

export function useToggleSave() {
  const patch = usePatchPost();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) => setSave(id, on),
    onMutate: ({ id, on }) => patch((it) => it.id === id, (it) => ({ ...it, savedByMe: on, saveCount: Math.max(0, it.saveCount + (on ? 1 : -1)) })),
    onError: (_e, { id, on }) => patch((it) => it.id === id, (it) => ({ ...it, savedByMe: !on })),
    onSettled: () => void qc.invalidateQueries({ queryKey: feedKeys.tab("saved") }),
  });
}

export function useToggleFollow() {
  const patch = usePatchPost();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ coachId, on }: { coachId: string; on: boolean }) => setFollow(coachId, on),
    onMutate: ({ coachId, on }) =>
      patch((it) => it.coach.id === coachId, (it) => ({ ...it, coach: { ...it.coach, followedByMe: on } })),
    onError: (_e, { coachId, on }) =>
      patch((it) => it.coach.id === coachId, (it) => ({ ...it, coach: { ...it.coach, followedByMe: !on } })),
    onSuccess: (res, { coachId }) => {
      qc.setQueryData(feedKeys.follow(coachId), { followers: res.followers, followedByMe: res.following });
      void qc.invalidateQueries({ queryKey: feedKeys.tab("following") });
    },
  });
}

export function useFollowStats(coachId: string | undefined, enabled = true) {
  return useQuery({ queryKey: feedKeys.follow(coachId ?? ""), queryFn: () => getFollowStats(coachId!), enabled: Boolean(coachId) && enabled });
}

/** All comments of a post, older ones loaded on demand. */
export function useComments(postId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: feedKeys.comments(postId),
    queryFn: ({ pageParam }) => getComments(postId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextBefore ?? undefined,
    enabled,
  });
}

export function useAddComment(postId: string) {
  const qc = useQueryClient();
  const patch = usePatchPost();
  return useMutation({
    mutationFn: (body: string) => addComment(postId, body),
    onSuccess: (comment: FeedComment) => {
      patch((it) => it.id === postId, (it) => ({ ...it, commentCount: it.commentCount + 1, comments: [...it.comments, comment].slice(-2) }));
      void qc.invalidateQueries({ queryKey: feedKeys.comments(postId) });
    },
  });
}

export function useDeleteComment(postId: string) {
  const qc = useQueryClient();
  const patch = usePatchPost();
  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: (_r, commentId) => {
      patch(
        (it) => it.id === postId,
        (it) => ({ ...it, commentCount: Math.max(0, it.commentCount - 1), comments: it.comments.filter((c) => c.id !== commentId) }),
      );
      void qc.invalidateQueries({ queryKey: feedKeys.comments(postId) });
    },
  });
}
