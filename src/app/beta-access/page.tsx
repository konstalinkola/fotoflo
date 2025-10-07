"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BetaAccessPage() {
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const response = await fetch("/api/beta-access", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password }),
			});

			if (response.ok) {
				// Set beta access cookie and redirect to login
				document.cookie = "beta-access=true; path=/; max-age=86400"; // 24 hours
				router.push("/login");
			} else {
				const data = await response.json();
				setError(data.error || "Invalid password");
			}
		} catch {
			setError("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div className="text-center">
					<h2 className="mt-6 text-3xl font-extrabold text-gray-900">
						Fotoflo Beta Access
					</h2>
					<p className="mt-2 text-sm text-gray-600">
						This is a private beta. Please enter the access password to continue.
					</p>
				</div>
				<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
					<div>
						<label htmlFor="password" className="sr-only">
							Beta Access Password
						</label>
						<input
							id="password"
							name="password"
							type="password"
							required
							className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
							placeholder="Enter beta access password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</div>

					{error && (
						<div className="text-red-600 text-sm text-center">{error}</div>
					)}

					<div>
						<button
							type="submit"
							disabled={loading}
							className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
						>
							{loading ? "Verifying..." : "Access Beta"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
