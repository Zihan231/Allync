import { BallIcon, DropZoneIcon, FlameIcon, SpikeIcon } from "@/components/icons";
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
  { id: "pubg", name: "PUBG", color: "#e08a3c", icon: DropZoneIcon, image: "/PUBG.webp", live: false },
  { id: "freefire", name: "Free Fire", color: "#ff6b4a", icon: FlameIcon, image: "/FreeFire.jpg", live: false },
  { id: "valorant", name: "Valorant", color: "#ff4d5e", icon: SpikeIcon, image: "/Valorant.jpg", live: false },
];

export function getGame(id: GameId): GameMeta {
  return games.find((g) => g.id === id) ?? games[0];
}
