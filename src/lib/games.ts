import { BallIcon } from "@/components/icons";
import type { GameId } from "@/lib/session/SessionContext";

export type GameMeta = {
  id: GameId;
  name: string;
  color: string;
  icon: (props: { className?: string; style?: React.CSSProperties }) => React.ReactElement;
  image: string;
  live: boolean;
};

export const games: GameMeta[] = [
  { id: "efootball", name: "eFootball", color: "#3fbf7f", icon: BallIcon, image: "/efootball.png", live: true },
];

export function getGame(id: GameId): GameMeta {
  return games.find((g) => g.id === id) ?? games[0];
}
