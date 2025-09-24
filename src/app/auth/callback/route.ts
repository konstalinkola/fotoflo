import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get("code");
	const redirect = searchParams.get("redirect") || "/dashboard";

	if (code) {
		const supabase = createSupabaseServerClient();
		await supabase.auth.exchangeCodeForSession(code);
		return NextResponse.redirect(new URL(redirect, origin));
	}

	return NextResponse.redirect(new URL("/login", origin));
}
