import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
	const supabase = createSupabaseServerClient();
	const { data: { user } } = await supabase.auth.getUser();

	const { data: projects } = await supabase
		.from("projects")
		.select("id, name, storage_bucket, storage_prefix, background_color, logo_url")
		.order("created_at", { ascending: false });

	return (
		<div className="p-8 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">Dashboard</h1>
				<Link className="underline" href="/project/new">New project</Link>
			</div>
			<p className="text-sm text-gray-600">Signed in as: {user?.email}</p>
			<div className="divide-y border rounded">
				{projects && projects.length > 0 ? projects.map((p) => (
					<div key={p.id} className="p-4 flex items-center justify-between gap-4">
						<div className="flex items-center gap-3">
							{p.logo_url ? <img src={p.logo_url} alt="logo" className="h-8 w-8 object-contain"/> : null}
							<div>
								<div className="font-medium">{p.name}</div>
								<div className="text-xs text-gray-500">{p.storage_bucket}{p.storage_prefix ? `/${p.storage_prefix}` : ""}</div>
							</div>
						</div>
						<div className="flex items-center gap-4">
							<Link className="underline" href={`/project/${p.id}`}>Edit</Link>
							<Link className="underline" href={`/public/${p.id}`} target="_blank">Public page</Link>
						</div>
					</div>
				)) : (
					<div className="p-4 text-gray-600">No projects yet. <Link className="underline" href="/project/new">Create one</Link>.</div>
				)}
			</div>
		</div>
	);
}
