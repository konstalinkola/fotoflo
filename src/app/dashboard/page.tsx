"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import UserOnboarding from "@/components/UserOnboarding";

export default function DashboardPage() {
	const [user, setUser] = useState(null);
	const [projects, setProjects] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showOnboarding, setShowOnboarding] = useState(false);
	const router = useRouter();

	useEffect(() => {
		async function loadData() {
			const supabase = createSupabaseBrowserClient();
			const { data: { user } } = await supabase.auth.getUser();

			if (!user) {
				router.push("/login?redirect=/dashboard");
				return;
			}

			setUser(user);

			const { data: projectsData } = await supabase
				.from("projects")
				.select("id, name, storage_bucket, storage_prefix, background_color, logo_url")
				.order("created_at", { ascending: false });

			setProjects(projectsData || []);
			setLoading(false);

			// Show onboarding for new users (no projects yet)
			if (!projectsData || projectsData.length === 0) {
				const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
				if (!hasSeenOnboarding) {
					setShowOnboarding(true);
				}
			}
		}

		loadData();
	}, [router]);

	const handleOnboardingComplete = () => {
		setShowOnboarding(false);
		localStorage.setItem("hasSeenOnboarding", "true");
	};

	if (loading) {
		return <div className="p-8">Loading...</div>;
	}

	return (
		<>
			{showOnboarding && <UserOnboarding onComplete={handleOnboardingComplete} />}
			
			<div className="p-8 space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-semibold">Dashboard</h1>
						<p className="text-sm text-gray-600">Signed in as: {user?.email}</p>
					</div>
					<Link 
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" 
						href="/project/new"
					>
						New Project
					</Link>
				</div>

				{projects && projects.length > 0 ? (
					<div className="space-y-4">
						<h2 className="text-lg font-medium">Your Projects</h2>
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{projects.map((p) => (
								<div key={p.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
									<div className="flex items-center gap-3 mb-3">
										{p.logo_url ? (
											<Image 
												src={p.logo_url} 
												alt="logo" 
												width={32} 
												height={32} 
												className="h-8 w-8 object-contain"
											/>
										) : (
											<div className="h-8 w-8 bg-gray-200 rounded"></div>
										)}
										<div className="flex-1">
											<div className="font-medium">{p.name}</div>
											<div className="text-xs text-gray-500">
												{p.storage_bucket}{p.storage_prefix ? `/${p.storage_prefix}` : ""}
											</div>
										</div>
									</div>
									<div className="flex gap-2">
										<Link 
											className="flex-1 text-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors" 
											href={`/project/${p.id}`}
										>
											Manage
										</Link>
										<Link 
											className="flex-1 text-center px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm transition-colors" 
											href={`/public/${p.id}`} 
											target="_blank"
										>
											View QR
										</Link>
									</div>
								</div>
							))}
						</div>
					</div>
				) : (
					<div className="text-center py-12">
						<div className="mb-4">
							<svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
							</svg>
						</div>
						<h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
						<p className="text-gray-600 mb-4">Create your first project to start sharing photos via QR codes.</p>
						<Link 
							className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" 
							href="/project/new"
						>
							Create Your First Project
						</Link>
					</div>
				)}
			</div>
		</>
	);
}
