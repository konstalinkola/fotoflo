"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();
	const supabase = createSupabaseBrowserClient();

	useEffect(() => {
		async function getUser() {
			const { data: { user } } = await supabase.auth.getUser();
			setUser(user);
			setLoading(false);
		}
		getUser();
	}, [supabase.auth]);

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		router.push("/login");
	};

	if (loading) {
		return (
			<nav className="bg-white border-b border-gray-200 px-6 py-4">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<div className="flex items-center space-x-8">
						<div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
						<div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
					</div>
					<div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
				</div>
			</nav>
		);
	}

	return (
		<nav className="bg-white border-b border-gray-200 px-6 py-4">
			<div className="max-w-7xl mx-auto flex items-center justify-between">
				<div className="flex items-center space-x-8">
					{/* Logo */}
					<Link href="/dashboard" className="flex items-center">
						<Image
							src="/logo.png"
							alt="Kuvapalvelin"
							width={32}
							height={32}
							className="h-8 w-auto"
						/>
					</Link>
					
					{/* Projects Button */}
					<Link 
						href="/dashboard"
						className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
					>
						Projects
					</Link>
				</div>

				{/* Sign Out */}
				<div className="flex items-center space-x-4">
					{user && (
						<span className="text-sm text-gray-600">
							{user.email}
						</span>
					)}
					<button
						onClick={handleSignOut}
						className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
					>
						Sign out
					</button>
				</div>
			</div>
		</nav>
	);
}
