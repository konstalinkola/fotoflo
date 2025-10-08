"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PanelLeft,
  User,
  Key,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { User } from "@supabase/supabase-js";

interface Project {
  id: string;
  name: string;
  logo_url?: string;
}

export default function ProfilePage() {
	const router = useRouter();
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [supabaseClient, setSupabaseClient] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [projects, setProjects] = useState<Project[]>([]);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [deleteConfirm, setDeleteConfirm] = useState("");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		async function loadData() {
			const supabase = createSupabaseBrowserClient();
			setSupabaseClient(supabase);
			
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				router.push("/login");
				return;
			}
			setUser(user);

			// Load projects for sidebar
			const { data: projectsData } = await supabase
				.from("projects")
				.select("id, name, logo_url")
				.order("created_at", { ascending: false });
			setProjects(projectsData || []);
			
			setLoading(false);
		}
		loadData();
	}, [router]);

	async function updatePassword() {
		if (!currentPassword || !newPassword || !confirmPassword) {
			setError("Please fill in all fields");
			return;
		}

		if (newPassword !== confirmPassword) {
			setError("New passwords do not match");
			return;
		}

		if (newPassword.length < 6) {
			setError("New password must be at least 6 characters");
			return;
		}

		if (!supabaseClient) return;

		setActionLoading(true);
		setError("");
		setMessage("");

		try {
			// First verify current password by attempting to sign in
			const { error: signInError } = await supabaseClient.auth.signInWithPassword({
				email: user?.email || "",
				password: currentPassword
			});

			if (signInError) {
				setError("Current password is incorrect");
				return;
			}

			// Update password
			const { error: updateError } = await supabaseClient.auth.updateUser({
				password: newPassword
			});

			if (updateError) {
				setError(`Failed to update password: ${updateError.message}`);
			} else {
				setMessage("Password updated successfully!");
				setCurrentPassword("");
				setNewPassword("");
				setConfirmPassword("");
			}
		} catch (err) {
			console.error("Unexpected error:", err);
			setError("An unexpected error occurred");
		} finally {
			setActionLoading(false);
		}
	}

	async function linkGoogleAccount() {
		if (!supabaseClient) return;

		setActionLoading(true);
		setError("");
		setMessage("");

		try {
			const { error } = await supabaseClient.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://fotoflo.co'}/auth/callback`,
					scopes: "email profile openid",
				},
			});

			if (error) {
				setError(`Failed to link Google account: ${error.message}`);
			} else {
				setMessage("Google account linking initiated. Please complete the process in the popup window.");
			}
		} catch (err) {
			console.error("Unexpected error:", err);
			setError("An unexpected error occurred");
		} finally {
			setActionLoading(false);
		}
	}

	async function deleteAllData() {
		if (deleteConfirm !== "DELETE") {
			setError("Please type 'DELETE' to confirm");
			return;
		}

		if (!supabaseClient) return;

		setActionLoading(true);
		setError("");
		setMessage("");

		try {
			// Delete user account (this will delete all associated data)
			const { error } = await supabaseClient.auth.admin.deleteUser(user?.id || "");

			if (error) {
				setError(`Failed to delete account: ${error.message}`);
			} else {
				setMessage("Account and all data deleted successfully. You will be redirected to the login page.");
				setTimeout(() => {
					router.push("/login");
				}, 3000);
			}
		} catch (err) {
			console.error("Unexpected error:", err);
			setError("An unexpected error occurred");
		} finally {
			setActionLoading(false);
		}
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading profile...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-screen bg-gray-50">
			{/* Sidebar */}
			<Sidebar 
				collapsed={sidebarCollapsed}
				onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
				user={user}
				projects={projects}
				supabaseClient={supabaseClient}
			/>

			{/* Main Content */}
			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Header */}
				<div className="bg-white border-b border-gray-200 px-6 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
								className="p-2"
							>
								<PanelLeft className="h-4 w-4" />
							</Button>
							
							<Breadcrumb>
								<BreadcrumbList>
									<BreadcrumbItem>
										<BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
									</BreadcrumbItem>
									<BreadcrumbSeparator />
									<BreadcrumbItem>
										<BreadcrumbPage>Profile Settings</BreadcrumbPage>
									</BreadcrumbItem>
								</BreadcrumbList>
							</Breadcrumb>
						</div>
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-6">
					<div className="max-w-4xl mx-auto space-y-6">
						{/* Page Header */}
						<div className="flex items-center space-x-4">
							<div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
								<User className="w-6 h-6 text-blue-600" />
							</div>
							<div>
								<h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
								<p className="text-gray-600">{user?.email}</p>
							</div>
						</div>

						{/* Messages */}
						{message && (
							<div className="bg-green-50 border border-green-200 rounded-md p-4">
								<p className="text-sm text-green-600">{message}</p>
							</div>
						)}

						{error && (
							<div className="bg-red-50 border border-red-200 rounded-md p-4">
								<p className="text-sm text-red-600">{error}</p>
							</div>
						)}

						{/* Account Information */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<User className="w-5 h-5" />
									<span>Account Information</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label className="text-sm font-medium text-gray-700">Email</Label>
										<p className="text-sm text-gray-900 mt-1">{user?.email}</p>
									</div>
									<div>
										<Label className="text-sm font-medium text-gray-700">Account Created</Label>
										<p className="text-sm text-gray-900 mt-1">
											{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown"}
										</p>
									</div>
									<div>
										<Label className="text-sm font-medium text-gray-700">Last Sign In</Label>
										<p className="text-sm text-gray-900 mt-1">
											{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : "Never"}
										</p>
									</div>
									<div>
										<Label className="text-sm font-medium text-gray-700">Email Confirmed</Label>
										<p className="text-sm text-gray-900 mt-1">
											{user?.email_confirmed_at ? "Yes" : "No"}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Password Management */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Key className="w-5 h-5" />
									<span>Password Management</span>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<Label htmlFor="current-password" className="text-sm font-medium text-gray-700">
										Current Password
									</Label>
									<Input
										id="current-password"
										type="password"
										placeholder="Enter current password"
										value={currentPassword}
										onChange={(e) => setCurrentPassword(e.target.value)}
										className="mt-1"
									/>
								</div>

								<div>
									<Label htmlFor="new-password" className="text-sm font-medium text-gray-700">
										New Password
									</Label>
									<Input
										id="new-password"
										type="password"
										placeholder="Enter new password"
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										className="mt-1"
									/>
								</div>

								<div>
									<Label htmlFor="confirm-new-password" className="text-sm font-medium text-gray-700">
										Confirm New Password
									</Label>
									<Input
										id="confirm-new-password"
										type="password"
										placeholder="Confirm new password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										className="mt-1"
									/>
								</div>

								<Button
									onClick={updatePassword}
									disabled={actionLoading || !currentPassword || !newPassword || !confirmPassword}
									className="w-full sm:w-auto"
								>
									{actionLoading ? "Updating Password..." : "Update Password"}
								</Button>
							</CardContent>
						</Card>

						{/* Google Account Linking */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<svg className="w-5 h-5" viewBox="0 0 24 24">
										<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
										<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
										<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
										<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
									</svg>
									<span>Google Account</span>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center space-x-3">
									<span className="text-sm text-gray-700">
										{user?.app_metadata?.providers?.includes("google") ? "Linked to Google account" : "Not linked to Google account"}
									</span>
								</div>

								<Button
									onClick={linkGoogleAccount}
									disabled={actionLoading}
									variant="outline"
									className="w-full sm:w-auto"
								>
									{actionLoading ? "Linking..." : user?.app_metadata?.providers?.includes("google") ? "Re-link Google Account" : "Link Google Account"}
								</Button>
							</CardContent>
						</Card>

						{/* Danger Zone */}
						<Card className="border-red-200">
							<CardHeader>
								<CardTitle className="flex items-center space-x-2 text-red-600">
									<AlertTriangle className="w-5 h-5" />
									<span>Danger Zone</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="bg-red-50 border border-red-200 rounded-lg p-4">
									<h3 className="text-sm font-medium text-red-800 mb-2">Delete All Data</h3>
									<p className="text-sm text-red-700 mb-4">
										This will permanently delete your account and all associated data, including all uploaded photos and projects. This action cannot be undone.
									</p>
									
									<div className="space-y-3">
										<div>
											<Label htmlFor="delete-confirm" className="text-sm font-medium text-red-700">
												Type "DELETE" to confirm
											</Label>
											<Input
												id="delete-confirm"
												type="text"
												placeholder="DELETE"
												value={deleteConfirm}
												onChange={(e) => setDeleteConfirm(e.target.value)}
												className="mt-1 border-red-300"
											/>
										</div>

										<Button
											onClick={deleteAllData}
											disabled={actionLoading || deleteConfirm !== "DELETE"}
											variant="destructive"
											className="w-full sm:w-auto"
										>
											<Trash2 className="w-4 h-4 mr-2" />
											{actionLoading ? "Deleting..." : "Delete All Data"}
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
