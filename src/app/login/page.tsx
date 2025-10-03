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
						redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
						scopes: "email profile openid",
					},
				});
			if (error) alert(error.message);
		} finally {
			setLoading(false);
		}
	}

	async function signInWithApple() {
		setLoading(true);
		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "apple",
				options: {
					redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
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
				// Redirect to dashboard on success
				window.location.href = "/dashboard";
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

	// Development helper function
	async function testLogin() {
		setLoading(true);
		try {
			console.log("Testing with demo credentials...");
			const { data, error } = await supabase.auth.signInWithPassword({
				email: "demo@example.com",
				password: "demo123456"
			});
			if (error) {
				console.error("Test login error:", error);
				alert(`Test login failed: ${error.message}\n\nThis is expected if the demo account doesn't exist.`);
			} else {
				console.log("Test login successful:", data);
				window.location.href = "/dashboard";
			}
		} catch (err) {
			console.error("Unexpected error:", err);
			alert("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	}

	return (
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
												<button className="text-sm text-blue-600 hover:text-blue-700">
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
								<Button 
									variant="outline" 
									className="w-full h-[36px] border-neutral-200 hover:bg-neutral-50"
									onClick={signInWithApple}
									disabled={loading}
								>
									<svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
										<path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
									</svg>
									Sign in with Apple
								</Button>
								
								{/* Development Test Button */}
								<Button 
									variant="outline" 
									className="w-full h-[36px] border-orange-200 hover:bg-orange-50 text-orange-600"
									onClick={testLogin}
									disabled={loading}
								>
									🧪 Test Login (Demo)
								</Button>
							</div>
						</div>
					</div>
				</div>

				{/* Right side - Hero content */}
				<div className="flex flex-col gap-[34px] items-end w-[471px]">
					<div className="aspect-[587/120] w-full relative">
						<Image
							src="/logo.png"
							alt="Kuvapalvelin"
							fill
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
	);
}
