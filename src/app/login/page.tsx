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
		<div className="min-h-screen flex items-center justify-center p-8">
			<div className="max-w-sm w-full space-y-6">
				<h1 className="text-2xl font-semibold">Sign in</h1>
				<button
					className="w-full h-10 rounded bg-black text-white hover:opacity-90 disabled:opacity-50"
					onClick={signInWithGoogle}
					disabled={loading}
				>
					Continue with Google
				</button>
			</div>
		</div>
	);
}
