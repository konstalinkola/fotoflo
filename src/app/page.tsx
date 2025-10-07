import { redirect } from "next/navigation";

export default function Home() {
	// Redirect to login page for cleaner UX
	redirect("/login");
}
