import { redirect } from "next/navigation";

/** The old mock Organizer area now lives in the staff admin panel. */
export default function OrganizerRedirect() {
  redirect("/dashboard/admin");
}
