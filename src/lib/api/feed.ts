import { api } from "./axios";
import type { CoachPostMedia } from "./coaching";

export type FeedTab = "for_you" | "following" | "saved";

export type FeedComment = {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string; dpUrl: string | null };
  mine: boolean;
};

export type FeedItem = {
  id: string;
  body: string;
  links: string[];
  media: CoachPostMedia[];
  createdAt: string;
  likeCount: number;
  commentCount: number;
  saveCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  /** The author: a coach, or (role "sponsor") a sponsor, shown with their brand. */
  coach: { id: string; name: string; dpUrl: string | null; headline: string; specialities: string[]; followedByMe: boolean };
  author?: { role: "coach" | "sponsor"; brand: { name: string; logoUrl: string | null; verified: boolean } | null };
  comments: FeedComment[];
};

export type FeedPage = { items: FeedItem[]; nextCursor: string | null };

export async function getFeed(tab: FeedTab, cursor?: string, limit = 8): Promise<FeedPage> {
  return (await api.get("/feed", { params: { tab, cursor, limit } })).data;
}

export async function setLike(postId: string, on: boolean) {
  return (await (on ? api.post(`/feed/posts/${postId}/like`, {}) : api.delete(`/feed/posts/${postId}/like`))).data as {
    likeCount: number;
  };
}

export async function setSave(postId: string, on: boolean) {
  return (await (on ? api.post(`/feed/posts/${postId}/save`, {}) : api.delete(`/feed/posts/${postId}/save`))).data as {
    saveCount: number;
  };
}

export async function getComments(postId: string, before?: string): Promise<{ items: FeedComment[]; nextBefore: string | null }> {
  return (await api.get(`/feed/posts/${postId}/comments`, { params: { before, limit: 20 } })).data;
}

export async function addComment(postId: string, body: string): Promise<FeedComment> {
  return (await api.post(`/feed/posts/${postId}/comments`, { body })).data;
}

export async function deleteComment(commentId: string) {
  return (await api.delete(`/feed/comments/${commentId}`)).data;
}

export async function setFollow(coachUserId: string, on: boolean): Promise<{ following: boolean; followers: number }> {
  return (await (on ? api.post(`/feed/coaches/${coachUserId}/follow`, {}) : api.delete(`/feed/coaches/${coachUserId}/follow`))).data;
}

export async function getFollowStats(coachUserId: string): Promise<{ followers: number; followedByMe: boolean }> {
  return (await api.get(`/feed/coaches/${coachUserId}/follow`)).data;
}

export async function markSeen(postIds: string[]) {
  return (await api.post("/feed/seen", { postIds })).data;
}
