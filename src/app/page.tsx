import { redirect } from "next/navigation";

export default function Home() {
	// Redirect to dashboard - beta access will be checked by middleware
	redirect("/dashboard");
}
