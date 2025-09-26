"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import UserOnboarding from "@/components/UserOnboarding";
import Navbar from "@/components/Navbar";

interface Project {
	id: string;
	name: string;
	storage_bucket: string;
	storage_prefix: string;
	background_color: string;
	logo_url: string;
}

export default function DashboardPage() {
	const [user, setUser] = useState<{id: string; email?: string} | null>(null);
	const [projects, setProjects] = useState<Project[]>([]);
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

	if (loading) return (
		<div className="min-h-screen bg-white">
			<Navbar />
			<div className="p-8">Loading…</div>
		</div>
	);

	if (showOnboarding) {
		return (
			<div className="min-h-screen bg-white">
				<Navbar />
				<UserOnboarding onComplete={handleOnboardingComplete} />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white">
			<Navbar />
			<div className="p-8 space-y-6">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-semibold">Dashboard</h1>
					<Link 
						href="/project/new"
						className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
					>
						New project
					</Link>
				</div>
				<p className="text-sm text-gray-600">Signed in as: {user?.email}</p>
				<div className="divide-y border rounded-lg bg-white">
					{projects && projects.length > 0 ? projects.map((p) => (
						<div key={p.id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
							<div className="flex items-center gap-3">
								{p.logo_url ? (
									<Image 
										src={p.logo_url} 
										alt="logo" 
										width={32} 
										height={32} 
										className="h-8 w-8 object-contain"
									/>
								) : (
									<div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
										<span className="text-gray-500 text-xs font-medium">
											{p.name?.charAt(0)?.toUpperCase() || 'P'}
										</span>
									</div>
								)}
								<div>
									<div className="font-medium">{p.name}</div>
									<div className="text-xs text-gray-500">
										{p.storage_bucket}{p.storage_prefix ? `/${p.storage_prefix}` : ""}
									</div>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<Link 
									href={`/project/${p.id}`}
									className="text-blue-600 hover:text-blue-700 font-medium"
								>
									Edit
								</Link>
								<Link 
									href={`/public/${p.id}`} 
									target="_blank"
									className="text-green-600 hover:text-green-700 font-medium"
								>
									Public page
								</Link>
							</div>
						</div>
					)) : (
						<div className="p-8 text-center text-gray-600">
							<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
								</svg>
							</div>
							<p className="text-lg font-medium mb-2">No projects yet</p>
							<p className="text-sm mb-4">Create your first project to start sharing photos</p>
							<Link 
								href="/project/new"
								className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
							>
								Create Project
							</Link>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}