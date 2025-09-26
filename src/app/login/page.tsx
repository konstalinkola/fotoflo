"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
	const supabase = createSupabaseBrowserClient();
	const [loading, setLoading] = useState(false);

	async function signInWithGoogle() {
		setLoading(true);
		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
					scopes: "email profile openid",
				},
			});
			if (error) alert(error.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-white flex">
			{/* Left side - Logo */}
			<div className="flex-1 flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="mb-4">
						<img
							src="/logo.png"
							alt="Kuvapalvelin"
							className="w-72 h-72 mx-auto object-contain"
						/>
					</div>
					<p className="text-xl font-bold text-gray-800">Instant photo sharing for event photographers</p>
				</div>
			</div>

			{/* Right side - Sign in form */}
			<div className="flex-1 flex items-center justify-center p-8">
				<div className="w-full max-w-sm">
					<div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
						<div className="text-center mb-8">
							<h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome back</h2>
							<p className="text-gray-600">Sign in to your account</p>
						</div>
						
						<button
							className="w-full h-12 rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-3"
							onClick={signInWithGoogle}
							disabled={loading}
						>
							{loading ? (
								<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
							) : (
								<>
									<svg className="w-5 h-5" viewBox="0 0 24 24">
										<path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
										<path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
										<path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
										<path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
									</svg>
									<span>Continue with Google</span>
								</>
							)}
						</button>
						
						<div className="mt-6 text-center">
							<p className="text-xs text-gray-500">
								By signing in, you agree to our Terms of Service and Privacy Policy
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
