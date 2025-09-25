import { redirect } from "next/navigation";

export default function Home() {
	// Redirect to beta access page
	redirect("/beta-access");
}
