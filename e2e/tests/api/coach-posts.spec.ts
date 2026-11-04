import { test, expect } from "@playwright/test";
import { anon, countNotes } from "../../lib/api";
import { castApis, type RoleKey } from "../../lib/cast";

/**
 * A coach's tutorial from submission to the feed: staff review (the coach is told either
 * way), then likes, saves and comments, who gets notified, who can delete what, and
 * the feed's own rules. coach2 is the author.
 */
const { as, actor } = castApis();
const coach = () => as("coach2");
const coachId = () => actor("coach2").userId;
const API = process.env.E2E_API_URL ?? "http://localhost:3001";

/** Submits a post as coach2 (the endpoint is multipart, which the JSON client can't send). */
async function submit(body: string, links = "") {
  const form = new FormData();
  form.append("body", body);
  if (links) form.append("links", links);
  const res = await fetch(`${API}/coaching/me/posts`, { method: "POST", headers: { authorization: `Bearer ${actor("coach2").token}` }, body: form });
  return { status: res.status, post: res.status === 201 ? await res.json() : null };
}

async function notified(code: string, users: RoleKey[], action: () => Promise<unknown>): Promise<Record<string, number>> {
  const before = await Promise.all(users.map((u) => countNotes(as(u), code)));
  await action();
  const after = await Promise.all(users.map((u) => countNotes(as(u), code)));
  return Object.fromEntries(users.map((u, i) => [u, after[i] - before[i]]));
}

const visibleTo = async (who: RoleKey | "guest", postId: string) => {
  const profile = who === "guest" ? await anon.get(`/coaching/coaches/${coachId()}`) : await as(who).get(`/coaching/coaches/${coachId()}`);
  return profile.posts.map((p: any) => p.id).includes(postId);
};

test.describe.configure({ mode: "serial" });

let approvedId = "";
let rejectedId = "";
let pendingId = "";

test.describe("staff review: the coach hears either way", () => {
  test("two new posts wait; only the coach and staff can see them", async () => {
    const a = await submit("E2E tutorial: build-up under pressure", "https://youtu.be/dQw4w9WgXcQ");
    const b = await submit("E2E tutorial: this one will be rejected");
    const c = await submit("E2E tutorial: still waiting");
    for (const r of [a, b, c]) expect(r.status).toBe(201);
    [approvedId, rejectedId, pendingId] = [a.post.id, b.post.id, c.post.id];
    for (const id of [approvedId, rejectedId, pendingId]) {
      expect(await visibleTo("guest", id)).toBe(false);
      expect(await visibleTo("entrant1", id)).toBe(false);
      expect(await visibleTo("coach2", id)).toBe(true);
    }
    const queue = (await as("moderator").get("/admin/coaching/posts?status=pending&author=coach")).data.map((p: any) => p.id);
    expect(queue).toEqual(expect.arrayContaining([approvedId, rejectedId, pendingId]));
  });

  test("approving tells the coach and makes the post public", async () => {
    const got = await notified("coaching.postApproved", ["coach2", "entrant1"], () => as("moderator").post(`/admin/coaching/posts/${approvedId}/review`, { approve: true }));
    expect(got).toEqual({ coach2: 1, entrant1: 0 });
    expect(await visibleTo("guest", approvedId)).toBe(true);
  });

  test("rejecting needs a reason; the coach is told why and the post stays hidden", async () => {
    expect((await as("moderator").raw("POST", `/admin/coaching/posts/${rejectedId}/review`, { approve: false, reason: "   " })).status).toBe(400);
    const got = await notified("coaching.postRejected", ["coach2"], () =>
      as("moderator").post(`/admin/coaching/posts/${rejectedId}/review`, { approve: false, reason: "No sources for the claim" }),
    );
    expect(got.coach2).toBe(1);
    const note = (await coach().notifications()).find((n) => n.code === "coaching.postRejected");
    expect(note?.message).toContain("No sources for the claim");

    const mine = (await coach().get("/coaching/me")).posts.find((p: any) => p.id === rejectedId);
    expect(mine.status).toBe("rejected");
    expect(mine.rejectReason).toBe("No sources for the claim");
    expect(await visibleTo("guest", rejectedId)).toBe(false);
  });

  test("a staff member can change their mind; the queue counts follow", async () => {
    await as("admin").post(`/admin/coaching/posts/${rejectedId}/review`, { approve: true });
    expect(await visibleTo("guest", rejectedId)).toBe(true);
    await as("admin").post(`/admin/coaching/posts/${rejectedId}/review`, { approve: false, reason: "Changed my mind" });
    const counts = (await as("moderator").get("/admin/coaching/posts?status=approved&author=coach")).counts;
    expect(counts.approved).toBeGreaterThanOrEqual(1);
    expect(counts.pending).toBeGreaterThanOrEqual(1);
  });

  test("nobody else can review; a post that doesn't exist is a 404", async () => {
    for (const key of ["coach2", "alphaPresident", "entrant1"] as RoleKey[]) {
      expect((await as(key).raw("POST", `/admin/coaching/posts/${pendingId}/review`, { approve: true })).status, key).toBe(403);
    }
    expect((await as("moderator").raw("POST", "/admin/coaching/posts/00000000-0000-4000-8000-000000000000/review", { approve: true })).status).toBe(404);
  });
});

test.describe("likes, saves and comments", () => {
  test("only an approved post can be reacted to", async () => {
    for (const id of [pendingId, rejectedId]) {
      expect((await as("entrant1").raw("POST", `/feed/posts/${id}/like`, {})).status).toBe(404);
      expect((await as("entrant1").raw("POST", `/feed/posts/${id}/save`, {})).status).toBe(404);
      expect((await as("entrant1").raw("POST", `/feed/posts/${id}/comments`, { body: "hi" })).status).toBe(404);
    }
  });

  test("a like tells the author once; liking again changes nothing; unliking never goes below zero", async () => {
    const got = await notified("coaching.postLiked", ["coach2"], async () => {
      const first = await as("entrant1").post(`/feed/posts/${approvedId}/like`, {});
      expect(first).toMatchObject({ liked: true, likeCount: 1 });
      const again = await as("entrant1").post(`/feed/posts/${approvedId}/like`, {});
      expect(again.likeCount).toBe(1);
    });
    expect(got.coach2).toBe(1);

    const off = await as("entrant1").del(`/feed/posts/${approvedId}/like`);
    expect(off).toMatchObject({ liked: false, likeCount: 0 });
    expect((await as("entrant1").del(`/feed/posts/${approvedId}/like`)).likeCount).toBe(0);
  });

  test("liking your own post tells nobody", async () => {
    const got = await notified("coaching.postLiked", ["coach2"], () => coach().post(`/feed/posts/${approvedId}/like`, {}));
    expect(got.coach2).toBe(0);
    await coach().del(`/feed/posts/${approvedId}/like`);
  });

  test("saving is private: no notification, and it shows under Saved", async () => {
    const got = await notified("coaching.postLiked", ["coach2"], async () => {
      expect(await as("entrant2").post(`/feed/posts/${approvedId}/save`, {})).toMatchObject({ saved: true });
    });
    expect(got.coach2).toBe(0);
    const saved = await as("entrant2").get("/feed?tab=saved");
    expect(JSON.stringify(saved)).toContain(approvedId);
    await as("entrant2").del(`/feed/posts/${approvedId}/save`);
    expect(JSON.stringify(await as("entrant2").get("/feed?tab=saved"))).not.toContain(approvedId);
  });

  let commentId = "";
  test("a comment tells the author; a blank one is refused; your own comment tells nobody", async () => {
    expect((await as("entrant1").raw("POST", `/feed/posts/${approvedId}/comments`, { body: "   " })).status).toBe(400);
    const got = await notified("coaching.postComment", ["coach2"], async () => {
      const c = await as("entrant1").post(`/feed/posts/${approvedId}/comments`, { body: "Great tutorial!" });
      commentId = c.id;
      expect(c.id).toBeTruthy();
    });
    expect(got.coach2).toBe(1);
    const own = await notified("coaching.postComment", ["coach2"], () => coach().post(`/feed/posts/${approvedId}/comments`, { body: "Thanks all" }));
    expect(own.coach2).toBe(0);

    const list = await anon.get(`/feed/posts/${approvedId}/comments`);
    expect(list.items.map((c: any) => c.id)).toContain(commentId);
  });

  test("a comment can be deleted by its author, the post's author or staff, and nobody else", async () => {
    expect((await as("entrant2").raw("DELETE", `/feed/comments/${commentId}`)).status).toBe(403);
    // The post's author removes it.
    expect((await coach().raw("DELETE", `/feed/comments/${commentId}`)).ok).toBe(true);

    const mine = await as("entrant1").post(`/feed/posts/${approvedId}/comments`, { body: "Second comment" });
    expect((await as("entrant1").raw("DELETE", `/feed/comments/${mine.id}`)).ok).toBe(true);
    const staffTarget = await as("entrant1").post(`/feed/posts/${approvedId}/comments`, { body: "Third comment" });
    expect((await as("moderator").raw("DELETE", `/feed/comments/${staffTarget.id}`)).ok).toBe(true);
  });
});

test.describe("the feed", () => {
  test("Following shows the coach's approved posts only after following; Saved and Following need a sign-in", async () => {
    await as("entrant2").del(`/feed/coaches/${coachId()}/follow`).catch(() => undefined);
    expect(JSON.stringify(await as("entrant2").get("/feed?tab=following"))).not.toContain(approvedId);
    await as("entrant2").post(`/feed/coaches/${coachId()}/follow`, {});
    const feed = await as("entrant2").get("/feed?tab=following");
    expect(JSON.stringify(feed)).toContain(approvedId);
    expect(JSON.stringify(feed)).not.toContain(pendingId);
    expect(JSON.stringify(feed)).not.toContain(rejectedId);
    await as("entrant2").del(`/feed/coaches/${coachId()}/follow`);

    expect((await anon.raw("GET", "/feed?tab=following")).status).toBe(403);
    expect((await anon.raw("GET", "/feed?tab=saved")).status).toBe(403);
    expect((await anon.raw("GET", "/feed")).status).toBe(200);
  });

  test("a bad cursor or a bad limit is refused, and a page never repeats a post", async () => {
    expect((await as("entrant1").raw("GET", "/feed?cursor=not-a-cursor")).status).toBe(400);
    expect((await as("entrant1").raw("GET", "/feed?limit=0")).status).toBe(400);
    expect((await as("entrant1").raw("GET", "/feed?limit=21")).status).toBe(400);
    const first = await as("entrant1").get("/feed?limit=3");
    if (first.nextCursor) {
      const second = await as("entrant1").get(`/feed?limit=3&cursor=${encodeURIComponent(first.nextCursor)}`);
      const ids = [...first.items, ...second.items].map((p: any) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  test("a post that was marked seen is accepted; too many ids are refused", async () => {
    expect((await as("entrant1").post("/feed/seen", { postIds: [approvedId] })).seen).toBe(1);
    const many = Array.from({ length: 51 }, () => "00000000-0000-4000-8000-000000000000");
    expect((await as("entrant1").raw("POST", "/feed/seen", { postIds: many })).status).toBe(400);
  });
});

test.describe("deleting a post", () => {
  test("only the author can delete; afterwards it is gone for everyone", async () => {
    expect((await as("entrant1").raw("DELETE", `/coaching/me/posts/${pendingId}`)).status).toBe(403);
    expect((await as("alphaPresident").raw("DELETE", `/coaching/me/posts/${approvedId}`)).status).toBe(403);

    expect((await coach().del(`/coaching/me/posts/${approvedId}`)).deleted).toBe(true);
    expect(await visibleTo("guest", approvedId)).toBe(false);
    expect((await as("entrant1").raw("POST", `/feed/posts/${approvedId}/like`, {})).status).toBe(404);
    // Deleting it twice is a 404.
    expect((await coach().raw("DELETE", `/coaching/me/posts/${approvedId}`)).status).toBe(404);
    // The rest are cleaned up too.
    await coach().del(`/coaching/me/posts/${pendingId}`);
    await coach().del(`/coaching/me/posts/${rejectedId}`);
  });
});
