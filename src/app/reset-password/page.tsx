"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
	const supabase = createSupabaseBrowserClient();
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		// Check if user is authenticated (should be from the recovery link)
		const checkAuth = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				router.push("/login?error=invalid-recovery-link");
			}
		};
		checkAuth();
	}, [supabase.auth, router]);

	async function updatePassword() {
		if (!password || !confirmPassword) {
			setError("Please fill in all fields");
			return;
		}

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		if (password.length < 6) {
			setError("Password must be at least 6 characters");
			return;
		}

		setLoading(true);
		setError("");

		try {
			console.log("Updating password...");
			const { error } = await supabase.auth.updateUser({
				password: password
			});

			if (error) {
				console.error("Password update error:", error);
				setError(`Failed to update password: ${error.message}`);
			} else {
				console.log("Password updated successfully");
				setSuccess(true);
				
				// Redirect to dashboard after a short delay
				setTimeout(() => {
					router.push("/dashboard");
				}, 2000);
			}
		} catch (err) {
			console.error("Unexpected error:", err);
			setError("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	}

	if (success) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-8">
				<div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
					<div className="text-center">
						<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<h1 className="text-2xl font-bold text-gray-900 mb-2">Password Updated!</h1>
						<p className="text-gray-600 mb-4">
							Your password has been successfully updated. You will be redirected to the dashboard shortly.
						</p>
						<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-8">
			<div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
				<div className="text-center mb-6">
					<h1 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h1>
					<p className="text-gray-600">
						Enter your new password below
					</p>
				</div>

				{error && (
					<div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
						<p className="text-sm text-red-600">{error}</p>
					</div>
				)}

				<div className="space-y-4">
					<div>
						<Label htmlFor="password" className="text-sm font-medium text-gray-700">
							New Password
						</Label>
						<Input
							id="password"
							type="password"
							placeholder="Enter new password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="mt-1"
						/>
					</div>

					<div>
						<Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
							Confirm New Password
						</Label>
						<Input
							id="confirm-password"
							type="password"
							placeholder="Confirm new password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							className="mt-1"
						/>
					</div>

					<Button
						onClick={updatePassword}
						disabled={loading || !password || !confirmPassword}
						className="w-full"
					>
						{loading ? "Updating Password..." : "Update Password"}
					</Button>

					<div className="text-center">
						<button
							type="button"
							onClick={() => router.push("/login")}
							className="text-sm text-blue-600 hover:text-blue-700"
						>
							Back to Login
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
