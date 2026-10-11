// Dev helper: prints API responses for the kept cast (`E2E_KEEP=1`). Usage: npx tsx scripts/probe.ts <actorKey> <METHOD> <path> [json]
import { Api } from "../lib/api";
import { loadCast } from "../lib/cast";

const [key, method, path, body] = process.argv.slice(2);
const cast = loadCast();
const p = path.replace(/:alpha/g, cast.clubs.alpha).replace(/:beta/g, cast.clubs.beta).replace(/:community/g, cast.communityId);
const res = await new Api(key === "anon" ? undefined : cast.actors[key].token).raw(method, p, body ? JSON.parse(body) : undefined);
console.log(res.status, JSON.stringify(res.body, null, 1).slice(0, Number(process.env.MAX ?? 3000)));
