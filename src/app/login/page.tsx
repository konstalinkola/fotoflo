"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import Image from "next/image";
import Lottie from "lottie-react";
import gradientAnimation from "../../../public/gradient-background.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
	const supabase = createSupabaseBrowserClient();
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [rememberMe, setRememberMe] = useState(false);
	const [showForgotPassword, setShowForgotPassword] = useState(false);

	// Test Supabase connection on component mount
	useEffect(() => {
		console.log("Supabase client created:", supabase);
		console.log("Environment check:", {
			url: process.env.NEXT_PUBLIC_SUPABASE_URL,
			hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
		});
	}, []);

	async function signInWithGoogle() {
		setLoading(true);
		try {
				const { error } = await supabase.auth.signInWithOAuth({
					provider: "google",
					options: {
						redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://fotoflo.vercel.app'}/auth/callback`,
						scopes: "email profile openid",
					},
				});
			if (error) alert(error.message);
		} finally {
			setLoading(false);
		}
	}


	async function signInWithEmail() {
		if (!email || !password) {
			alert("Please fill in all fields");
			return;
		}

		setLoading(true);
		try {
			console.log("Attempting to sign in with:", email);
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});
			if (error) {
				console.error("Sign in error:", error);
				console.error("Error details:", {
					message: error.message,
					status: error.status
				});
				
				// Provide more helpful error messages
				if (error.message.includes("Invalid login credentials")) {
					alert(`Sign in failed: ${error.message}\n\nPossible causes:\n1. Email not confirmed - check your email for confirmation link\n2. Wrong password\n3. Account doesn't exist\n\nCheck the browser console for more details.`);
				} else {
					alert(`Sign in failed: ${error.message}\n\nError code: ${error.status || 'Unknown'}`);
				}
			} else {
				console.log("Sign in successful:", data);
				// Set beta access cookie and redirect to dashboard
				document.cookie = "beta-access=true; path=/; max-age=86400; SameSite=Lax"; // 24 hours
				window.location.href = "/dashboard";
			}
		} catch (err) {
			console.error("Unexpected error:", err);
			alert("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	}

	async function resetPassword() {
		if (!email) {
			alert("Please enter your email address");
			return;
		}

		setLoading(true);
		try {
			console.log("Attempting to reset password for:", email);
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://fotoflo.co'}/auth/callback?type=recovery`,
			});
			
			if (error) {
				console.error("Password reset error:", error);
				alert(`Password reset failed: ${error.message}`);
			} else {
				console.log("Password reset email sent successfully");
				alert("Password reset email sent! Check your inbox and follow the instructions to set a new password.");
				setShowForgotPassword(false);
			}
		} catch (err) {
			console.error("Unexpected error:", err);
			alert("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	}

	async function signUpWithEmail() {
		if (!email || !password || !confirmPassword) {
			alert("Please fill in all fields");
			return;
		}

		if (password !== confirmPassword) {
			alert("Passwords do not match");
			return;
		}

		if (password.length < 6) {
			alert("Password must be at least 6 characters");
			return;
		}

		setLoading(true);
		try {
			console.log("Attempting to sign up with:", email);
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
			});
			if (error) {
				console.error("Sign up error:", error);
				console.error("Error details:", {
					message: error.message,
					status: error.status
				});
				alert(`Sign up failed: ${error.message}\n\nError code: ${error.status || 'Unknown'}`);
			} else {
				console.log("Sign up successful:", data);
				if (data.user && !data.user.email_confirmed_at) {
					alert("Account created! Check your email for the confirmation link, or try signing in directly.");
				} else {
					alert("Account created successfully! You can now sign in.");
				}
			}
		} catch (err) {
			console.error("Unexpected error:", err);
			alert("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	}


	return (
		<>
			<div className="fixed inset-0 w-full h-full bg-white flex items-center justify-center overflow-hidden">
			{/* Animated gradient background */}
			<div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
				<Lottie 
					animationData={gradientAnimation} 
					loop={true}
					style={{ 
						position: 'absolute',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						width: '100vw',
						height: '100vh',
						minWidth: '100vw',
						minHeight: '100vh',
						maxWidth: 'none',
						maxHeight: 'none'
					}}
					rendererSettings={{
						preserveAspectRatio: 'xMidYMid slice'
					}}
				/>
			</div>
			
			<div className="flex gap-[102px] items-center justify-center w-full max-w-7xl px-8 relative z-10">
				{/* Left side - Form */}
				<div className="bg-white border border-neutral-200 rounded-[10px] p-6 w-[400px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">
					<div className="space-y-6">
						{/* Header */}
						<div className="space-y-4">
							<div className="pb-2">
								<h1 className="text-[36px] font-extrabold leading-[40px] text-neutral-950">
									Get started
								</h1>
							</div>
							
							{/* Tabs */}
							<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
								<TabsList className="grid w-full grid-cols-2 bg-neutral-100 p-[3px] rounded-[10px] h-[36px]">
									<TabsTrigger 
										value="login" 
										className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-[8px] text-sm font-medium"
									>
										Log in
									</TabsTrigger>
									<TabsTrigger 
										value="signup" 
										className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-[8px] text-sm font-medium"
									>
										Create Account
									</TabsTrigger>
								</TabsList>

								{/* Login Form */}
								<TabsContent value="login" className="space-y-4 mt-6">
									<div className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="email" className="text-sm font-medium text-neutral-950">
												Email
											</Label>
											<Input 
												id="email" 
												type="email" 
												placeholder="Email or username"
												className="h-[36px]"
												value={email}
												onChange={(e) => setEmail(e.target.value)}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="password" className="text-sm font-medium text-neutral-950">
												Password
											</Label>
											<Input 
												id="password" 
												type="password" 
												placeholder="Password"
												className="h-[36px]"
												value={password}
												onChange={(e) => setPassword(e.target.value)}
											/>
											<div className="text-right">
												<button 
													type="button"
													onClick={() => setShowForgotPassword(true)}
													className="text-sm text-blue-600 hover:text-blue-700"
												>
													Forgot password?
												</button>
											</div>
										</div>
										<div className="flex items-center space-x-2">
											<Checkbox 
												id="keep-signed-in" 
												checked={rememberMe}
												onCheckedChange={(checked) => setRememberMe(checked === true)}
											/>
											<Label 
												htmlFor="keep-signed-in" 
												className="text-sm font-medium text-neutral-950"
											>
												Keep me signed in
											</Label>
										</div>
									</div>
								</TabsContent>

								{/* Signup Form */}
								<TabsContent value="signup" className="space-y-4 mt-6">
									<div className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="signup-email" className="text-sm font-medium text-neutral-950">
												Email
											</Label>
											<Input 
												id="signup-email" 
												type="email" 
												placeholder="Email or username"
												className="h-[36px]"
												value={email}
												onChange={(e) => setEmail(e.target.value)}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="signup-password" className="text-sm font-medium text-neutral-950">
												Password
											</Label>
											<Input 
												id="signup-password" 
												type="password" 
												placeholder="Password"
												className="h-[36px]"
												value={password}
												onChange={(e) => setPassword(e.target.value)}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="confirm-password" className="text-sm font-medium text-neutral-950">
												Confirm Password
											</Label>
											<Input 
												id="confirm-password" 
												type="password" 
												placeholder="Confirm password"
												className="h-[36px]"
												value={confirmPassword}
												onChange={(e) => setConfirmPassword(e.target.value)}
											/>
										</div>
									</div>
								</TabsContent>
							</Tabs>
						</div>

						{/* Action Buttons */}
						<div className="space-y-4">
							<Button 
								className="w-full h-[36px] bg-neutral-900 hover:bg-neutral-800 text-white"
								onClick={() => {
									if (activeTab === "login") {
										signInWithEmail();
									} else {
										signUpWithEmail();
									}
								}}
								disabled={loading}
							>
								{loading ? "Loading..." : (activeTab === "login" ? "Log in" : "Create Account")}
							</Button>

							{/* Divider */}
							<div className="relative">
								<Separator className="absolute inset-0" />
								<div className="relative flex justify-center text-xs">
									<span className="bg-white px-2 text-neutral-500">OR</span>
								</div>
							</div>

							{/* Social Login Buttons */}
							<div className="space-y-2">
								<Button 
									variant="outline" 
									className="w-full h-[36px] border-neutral-200 hover:bg-neutral-50"
									onClick={signInWithGoogle}
									disabled={loading}
								>
									<svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
										<path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
										<path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
										<path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
										<path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
									</svg>
									Sign in with Google
								</Button>
								
							</div>
						</div>
					</div>
				</div>

				{/* Right side - Hero content */}
				<div className="flex flex-col gap-[34px] items-end w-[471px]">
					<div className="aspect-[587/120] w-full relative">
						<Image
							src="/Fotoflo-logo-white.png"
							alt="Fotoflo"
							fill
							priority
							sizes="471px"
							className="object-contain"
						/>
					</div>
					<div className="pb-2">
						<h2 className="text-[30px] font-semibold leading-[36px] text-neutral-950">
							Instant photo sharing for professional photographers
						</h2>
					</div>
				</div>
			</div>
		</div>

		{/* Forgot Password Modal */}
		{showForgotPassword && (
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
					<h3 className="text-lg font-semibold text-gray-900 mb-4">Reset Password</h3>
					<p className="text-sm text-gray-600 mb-4">
						Enter your email address and we'll send you a link to reset your password.
					</p>
					<div className="space-y-4">
						<div>
							<Label htmlFor="reset-email" className="text-sm font-medium text-gray-700">
								Email Address
							</Label>
							<Input
								id="reset-email"
								type="email"
								placeholder="Enter your email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="mt-1"
							/>
						</div>
						<div className="flex space-x-3">
							<Button
								type="button"
								variant="outline"
								onClick={() => setShowForgotPassword(false)}
								className="flex-1"
								disabled={loading}
							>
								Cancel
							</Button>
							<Button
								type="button"
								onClick={resetPassword}
								className="flex-1"
								disabled={loading || !email}
							>
								{loading ? "Sending..." : "Send Reset Link"}
							</Button>
						</div>
					</div>
				</div>
			</div>
		)}
		</>
	);
}
