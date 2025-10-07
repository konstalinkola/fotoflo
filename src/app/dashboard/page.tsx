"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import UserOnboarding from "@/components/UserOnboarding";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  PanelLeft, 
  Plus, 
  Search, 
  ChevronDown, 
  Trash2, 
  Link as LinkIcon, 
  Calendar,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Project {
	id: string;
	name: string;
	storage_bucket: string;
	storage_prefix: string;
	background_color: string;
	logo_url: string;
	created_at: string;
	display_mode?: 'single' | 'collection';
	image_count?: number;
	collection_count?: number;
	latest_upload_date?: string | null;
	latest_image_url?: string | null;
	latest_collection_cover_url?: string | null;
}

export default function DashboardPage() {
	const [user, setUser] = useState<{id: string; email?: string} | null>(null);
	const [projects, setProjects] = useState<Project[]>([]);
	const [loading, setLoading] = useState(true);
	const [showOnboarding, setShowOnboarding] = useState(false);
	const [creatingProject, setCreatingProject] = useState(false);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [supabaseClient, setSupabaseClient] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
	const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
	const [deletingProjects, setDeletingProjects] = useState(false);
	const router = useRouter();

	useEffect(() => {
		async function loadData() {
			const supabase = createSupabaseBrowserClient();
			setSupabaseClient(supabase);
			const { data: { user } } = await supabase.auth.getUser();

			if (!user) {
				router.push("/login?redirect=/dashboard");
				return;
			}

			setUser(user);

			// Get user's projects
			const { data: projectsData } = await supabase
				.from("projects")
				.select("id, name, storage_bucket, storage_prefix, background_color, logo_url, created_at, display_mode")
				.order("created_at", { ascending: false });

			// Fetch image counts, collection counts, and latest content for each project
			if (projectsData && projectsData.length > 0) {
				const projectsWithData = await Promise.all(
					projectsData.map(async (project) => {
						let image_count = 0;
						let collection_count = 0;
						let latest_upload_date: string | null = null;
						let latest_image_url: string | null = null;
						let latest_collection_cover_url: string | null = null;

						// Get image count and latest image
						const { data: images, count: imageCount } = await supabase
							.from("images")
							.select("storage_path, uploaded_at")
							.eq("project_id", project.id)
							.order("uploaded_at", { ascending: false });

						if (images && images.length > 0) {
							image_count = imageCount || images.length;
							latest_upload_date = images[0].uploaded_at;

							// Generate signed URL for latest image
							if (images[0].storage_path) {
								try {
									const response = await fetch('/api/signed-urls', {
										method: 'POST',
										headers: { 'Content-Type': 'application/json' },
										body: JSON.stringify({
											bucket: project.storage_bucket,
											path: images[0].storage_path
										})
									});
									
									if (response.ok) {
										const { signedUrl } = await response.json();
										latest_image_url = signedUrl;
									} else {
										// Fallback to public URL
										latest_image_url = supabase.storage
											.from(project.storage_bucket)
											.getPublicUrl(images[0].storage_path).data.publicUrl;
									}
								} catch (error) {
									console.error(`Exception generating signed URL for ${project.name}:`, error);
									// Fallback to public URL
									latest_image_url = supabase.storage
										.from(project.storage_bucket)
										.getPublicUrl(images[0].storage_path).data.publicUrl;
								}
							}
						}

						// Get collection count and latest collection
						const { data: collections, count: collectionCount } = await supabase
							.from("collections")
							.select(`
								id,
								created_at,
								collection_images (
									images (
										storage_path
									)
								)
							`)
							.eq("project_id", project.id)
							.order("created_at", { ascending: false });

						if (collections && collections.length > 0) {
							collection_count = collectionCount || collections.length;

							// Get cover image from latest collection
							const latestCollection = collections[0];
							const firstImage = latestCollection.collection_images?.[0]?.images?.[0];
							if (firstImage?.storage_path) {
								try {
									const response = await fetch('/api/signed-urls', {
										method: 'POST',
										headers: { 'Content-Type': 'application/json' },
										body: JSON.stringify({
											bucket: project.storage_bucket,
											path: firstImage.storage_path
										})
									});
									
									if (response.ok) {
										const { signedUrl } = await response.json();
										latest_collection_cover_url = signedUrl;
									} else {
										// Fallback to public URL
										latest_collection_cover_url = supabase.storage
											.from(project.storage_bucket)
											.getPublicUrl(firstImage.storage_path).data.publicUrl;
									}
								} catch (error) {
									console.error(`Exception generating signed URL for collection cover:`, error);
									// Fallback to public URL
									latest_collection_cover_url = supabase.storage
										.from(project.storage_bucket)
										.getPublicUrl(firstImage.storage_path).data.publicUrl;
								}
							}

							// Update latest upload date if collection is newer
							if (!latest_upload_date || new Date(latestCollection.created_at) > new Date(latest_upload_date)) {
								latest_upload_date = latestCollection.created_at;
							}
						}

						return {
							...project,
							image_count,
							collection_count,
							latest_upload_date,
							latest_image_url,
							latest_collection_cover_url
						};
					})
				);

				setProjects(projectsWithData);
			} else {
				setProjects(projectsData || []);
			}

			
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

	const createBlankProject = async () => {
		setCreatingProject(true);
		try {
			const response = await fetch("/api/projects/create-blank", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Failed to create project");
			}

			// Redirect to the new project settings to configure mode
			router.push(`/project/${result.projectId}/settings`);
		} catch (error) {
			alert(error instanceof Error ? error.message : "Failed to create project");
		} finally {
			setCreatingProject(false);
		}
	};

	// Handle project selection
	const handleProjectSelect = (projectId: string, checked: boolean) => {
		if (checked) {
			setSelectedProjects(prev => [...prev, projectId]);
		} else {
			setSelectedProjects(prev => prev.filter(id => id !== projectId));
		}
	};

	// Handle select all
	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			setSelectedProjects(projects.map(p => p.id));
		} else {
			setSelectedProjects([]);
		}
	};

	// Handle project deletion
	const handleDeleteProjects = async () => {
		if (selectedProjects.length === 0) return;

		if (!confirm(`Are you sure you want to delete ${selectedProjects.length} project(s)? This action cannot be undone.`)) {
			return;
		}

		setDeletingProjects(true);
		try {
			const deletePromises = selectedProjects.map(projectId => 
				fetch(`/api/projects/${projectId}`, { method: "DELETE" })
			);
			
			const responses = await Promise.all(deletePromises);
			
			// Check if all deletions were successful
			const failedDeletions = responses.filter(response => !response.ok);
			if (failedDeletions.length > 0) {
				throw new Error(`Failed to delete ${failedDeletions.length} project(s)`);
			}

			// Remove deleted projects from state
			setProjects(prev => prev.filter(p => !selectedProjects.includes(p.id)));
			setSelectedProjects([]);
			
			// Reload data to ensure consistency
			window.location.reload();
		} catch (error) {
			alert(error instanceof Error ? error.message : "Failed to delete projects");
		} finally {
			setDeletingProjects(false);
		}
	};

	// Navigate to project
	const navigateToProject = (projectId: string) => {
		router.push(`/project/${projectId}`);
	};

	if (loading) return (
		<div className="min-h-screen bg-white flex">
			<Sidebar 
				collapsed={sidebarCollapsed} 
				onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
				user={user}
				projects={projects}
			/>
			<div className="flex-1 p-8">Loading…</div>
		</div>
	);

	if (showOnboarding) {
		return (
			<div className="min-h-screen bg-white flex">
				<Sidebar 
					collapsed={sidebarCollapsed} 
					onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
					user={user}
					projects={projects}
					supabaseClient={supabaseClient}
				/>
				<div className="flex-1">
					<UserOnboarding onComplete={handleOnboardingComplete} />
				</div>
			</div>
		);
	}

	const latestProject = projects[0];

	return (
		<div className="min-h-screen bg-white flex">
			<Sidebar 
				collapsed={sidebarCollapsed} 
				onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
				user={user}
				projects={projects}
			/>
			
			<div className="flex-1 flex flex-col">
				{/* Header */}
				<div className="h-16 border-b border-neutral-200 flex items-center px-6">
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="sm" className="w-7 h-7 p-0">
							<PanelLeft className="w-4 h-4" />
						</Button>
						<div className="w-px h-4 bg-neutral-200" />
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem>
									<BreadcrumbPage>Home</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
					</div>
				</div>

				{/* Page Header */}
				<div className="border-b border-neutral-200 p-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-[30px] font-bold leading-[36px] text-neutral-950">
								Home
							</h1>
						</div>
						<div className="flex items-center gap-3">
							<Button 
								onClick={createBlankProject}
								disabled={creatingProject}
								className="bg-neutral-900 hover:bg-neutral-800 text-white h-9 px-4"
							>
								<Plus className="w-4 h-4 mr-2" />
								{creatingProject ? "Creating..." : "New project"}
							</Button>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className="flex-1 p-6 overflow-auto">
					<div className="flex gap-6 w-full">
						{/* Latest Project Card */}
						{latestProject && (
							<div className="w-[353px] shrink-0">
								<h3 className="text-xl font-semibold text-neutral-950 mb-2.5">
									Latest project
								</h3>
								<Card className="border border-neutral-200 rounded-[14px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
									<CardContent className="p-3.5">
										<div className="space-y-3">
											<div className="flex items-start justify-between gap-4">
												<div className="flex-1 min-w-0">
													<h4 className="text-lg font-semibold text-neutral-950 mb-2 truncate">
														{latestProject.name}
													</h4>
													<div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
														<div className="flex items-center gap-1">
															<Calendar className="w-4 h-4" />
															<span>
																{latestProject.latest_upload_date 
																	? new Date(latestProject.latest_upload_date).toLocaleDateString()
																	: new Date(latestProject.created_at).toLocaleDateString()
																}
															</span>
														</div>
														<span>
															{latestProject.display_mode === 'collection' 
																? `${latestProject.collection_count || 0} collections`
																: `${latestProject.image_count || 0} images`
															}
														</span>
													</div>
												</div>
												<Link href={`/public/${latestProject.id}`} target="_blank">
													<Button size="sm" className="w-9 h-9 p-0 rounded-full bg-neutral-900 hover:bg-neutral-800 shrink-0">
														<LinkIcon className="w-4 h-4 text-white" />
													</Button>
												</Link>
											</div>
											<div className="aspect-square w-full bg-neutral-100 rounded-lg overflow-hidden flex items-center justify-center">
												{latestProject.display_mode === 'collection' && latestProject.latest_collection_cover_url ? (
													<Image 
														src={latestProject.latest_collection_cover_url} 
														alt={`${latestProject.name} collection cover`}
														width={325}
														height={325}
														priority
														className="w-full h-full object-cover"
													/>
												) : latestProject.latest_image_url ? (
													<Image 
														src={latestProject.latest_image_url} 
														alt={latestProject.name}
														width={325}
														height={325}
														priority
														className="w-full h-full object-cover"
													/>
												) : latestProject.logo_url ? (
													<Image 
														src={latestProject.logo_url} 
														alt={latestProject.name}
														width={325}
														height={325}
														className="w-full h-full object-cover"
													/>
												) : (
													<div className="text-neutral-400 text-sm">No image yet</div>
												)}
											</div>
										</div>
									</CardContent>
								</Card>
							</div>
						)}

						{/* Projects Table */}
						<div className="flex-1 min-w-0">
							<div className="space-y-2.5">
								<h3 className="text-xl font-semibold text-neutral-950">
									All projects
								</h3>
								
								{/* Table Header */}
								<div className="flex items-center justify-between">
									<div className="w-[373px]">
										<div className="relative">
											<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500" />
											<Input 
												placeholder="Search projects"
												className="pl-10 h-9"
											/>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<Button variant="outline" className="h-9">
											Status: All projects
											<ChevronDown className="w-4 h-4 ml-2" />
										</Button>
										<Button 
											variant="outline" 
											className="h-9"
											disabled={selectedProjects.length === 0 || deletingProjects}
											onClick={handleDeleteProjects}
										>
											<Trash2 className="w-4 h-4 mr-2" />
											{deletingProjects ? "Deleting..." : `Delete (${selectedProjects.length})`}
										</Button>
									</div>
								</div>

								{/* Table */}
								<div className="border border-neutral-200 rounded-lg">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="w-10">
													<input 
														type="checkbox" 
														className="w-4 h-4"
														checked={selectedProjects.length === projects.length && projects.length > 0}
														onChange={(e) => handleSelectAll(e.target.checked)}
													/>
												</TableHead>
												<TableHead className="w-[118px]">#</TableHead>
												<TableHead>Project name</TableHead>
												<TableHead className="w-[195px]">Mode</TableHead>
												<TableHead className="w-[120px]">Count</TableHead>
												<TableHead className="w-[117px] text-right">Public url</TableHead>
												<TableHead className="w-16"></TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{projects.map((project, index) => (
												<TableRow key={project.id}>
													<TableCell>
														<input 
															type="checkbox" 
															className="w-4 h-4"
															checked={selectedProjects.includes(project.id)}
															onChange={(e) => handleProjectSelect(project.id, e.target.checked)}
														/>
													</TableCell>
													<TableCell className="font-mono text-sm">
														<button
															onClick={() => navigateToProject(project.id)}
															className="text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
														>
															#{2999 - index}
														</button>
													</TableCell>
													<TableCell>
														<button
															onClick={() => navigateToProject(project.id)}
															className="hover:bg-neutral-50 p-1 -m-1 rounded cursor-pointer w-full text-left"
														>
															<span className="font-medium">{project.name}</span>
														</button>
													</TableCell>
													<TableCell>
														<div className="flex flex-col gap-1">
															<Badge variant="secondary">QR code</Badge>
															<Badge 
																variant={project.display_mode === 'collection' ? 'default' : 'outline'}
																className="text-xs"
															>
																{project.display_mode === 'collection' ? 'Collection' : 'Single'}
															</Badge>
														</div>
													</TableCell>
													<TableCell>
														<span className="text-sm font-medium">
															{project.display_mode === 'collection' 
																? `${project.collection_count || 0} collections`
																: `${project.image_count || 0} images`
															}
														</span>
													</TableCell>
													<TableCell className="text-right">
														<Link 
															href={`/public/${project.id}`}
															target="_blank"
															className="text-blue-600 hover:text-blue-700 text-sm"
														>
															URL
														</Link>
													</TableCell>
													<TableCell>
														<Button variant="ghost" size="sm" className="w-8 h-8 p-0">
															<MoreHorizontal className="w-4 h-4" />
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>

								{/* Pagination */}
								<div className="flex justify-end">
									<Pagination>
										<PaginationContent>
											<PaginationItem>
												<PaginationPrevious href="#" />
											</PaginationItem>
											<PaginationItem>
												<PaginationLink href="#">1</PaginationLink>
											</PaginationItem>
											<PaginationItem>
												<PaginationLink href="#" isActive>2</PaginationLink>
											</PaginationItem>
											<PaginationItem>
												<PaginationLink href="#">3</PaginationLink>
											</PaginationItem>
											<PaginationItem>
												<span className="px-3 py-2">...</span>
											</PaginationItem>
											<PaginationItem>
												<PaginationNext href="#" />
											</PaginationItem>
										</PaginationContent>
									</Pagination>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}