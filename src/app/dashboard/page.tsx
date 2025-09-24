import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
	const supabase = createSupabaseServerClient();
	const { data: { user } } = await supabase.auth.getUser();

	return (
		<div className="p-8 space-y-6">
			<h1 className="text-2xl font-semibold">Dashboard</h1>
			<p>Signed in as: {user?.email}</p>
			<div className="space-x-4">
				<Link className="underline" href="/project/new">Create project</Link>
				<Link className="underline" href="/public/demo">Open public demo</Link>
			</div>
		</div>
	);
}
