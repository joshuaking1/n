// frontend/src/app/dashboard/my-tos/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from "@/hooks/use-toast"; // Fixed import path
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from 'date-fns';

// Interface for TOS data
interface TableOfSpecsDetail {
    id: number;
    title: string | null;
    subject: string;
    grade_level: string;
    topics: string[];
    content: string; // This will be the markdown content
    created_at: string;
    updated_at: string;
}

export default function ViewTosPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const { user, token, isAuthenticated, isLoading: isLoadingAuth } = useAuthStore();
    const [hasMounted, setHasMounted] = useState(false);
    const [tos, setTos] = useState<TableOfSpecsDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const tosId = params.id as string;

    // --- Mount and Auth Check ---
    useEffect(() => { setHasMounted(true); }, []);
    useEffect(() => {
        if (hasMounted && !isLoadingAuth && !isAuthenticated) {
            toast({ title: "Authentication Required", variant: "destructive" });
            router.push('/login');
        }
    }, [hasMounted, isLoadingAuth, isAuthenticated, router, toast]);

    // --- Fetch TOS Details ---
    useEffect(() => {
        const fetchTosDetails = async () => {
            if (hasMounted && isAuthenticated && token && tosId) {
                setIsLoading(true);
                setError(null);
                try {
                    const response = await fetch(`http://localhost:3005/api/teacher-tools/tos/${tosId}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    if (!response.ok) {
                        let errorMsg = `Failed to fetch TOS details (Status: ${response.status})`;
                        try { const d = await response.json(); errorMsg = d.error || errorMsg; } catch {}
                        throw new Error(errorMsg);
                    }
                    const data: TableOfSpecsDetail = await response.json();
                    setTos(data);
                } catch (error: any) {
                    console.error("Error fetching TOS details:", error);
                    setError(error.message || "Could not load the Table of Specifications.");
                    toast({ title: "Loading Error", description: error.message, variant: "destructive" });
                } finally {
                    setIsLoading(false);
                }
            } else if (hasMounted && !isLoadingAuth && !isAuthenticated) {
                setIsLoading(false);
            }
        };
        fetchTosDetails();
    }, [hasMounted, isAuthenticated, token, tosId, toast]);

    // --- Render Logic ---
    if (!hasMounted || isLoadingAuth) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-100">
                <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-brand-darkblue">Table of Specifications</h1>
                    <nav className="text-sm text-gray-500">
                        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
                        {' / '}
                        <Link href="/dashboard/my-tos" className="hover:underline">My Tables of Specs</Link>
                        {' / '}
                        <span>View TOS</span>
                    </nav>
                </div>
                <Button 
                    variant="outline" 
                    onClick={() => router.push('/dashboard/my-tos')}
                    className="flex items-center"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to My TOS
                </Button>
            </header>

            {/* Loading State */}
            {isLoading && (
                <div className="flex justify-center items-center py-16">
                    <div className="text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-brand-orange mx-auto mb-4" />
                        <p className="text-gray-500">Loading table of specifications...</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {!isLoading && error && (
                <Alert variant="destructive" className="mt-6">
                    <AlertTitle>Error Loading Table of Specifications</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* TOS Display */}
            {!isLoading && !error && tos && (
                <Card className="mt-6 shadow-md">
                    <CardHeader className="border-b">
                        <CardTitle className="text-2xl">{tos.title || "Untitled Table of Specifications"}</CardTitle>
                        <CardDescription>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2">
                                <div>
                                    <span className="font-medium">Subject:</span> {tos.subject} | 
                                    <span className="font-medium ml-2">Grade Level:</span> {tos.grade_level}
                                </div>
                                <div className="text-sm text-gray-500 mt-2 sm:mt-0">
                                    Created: {format(new Date(tos.created_at), 'PPp')}
                                </div>
                            </div>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="mb-4">
                            <h3 className="text-lg font-medium mb-2">Topics Covered:</h3>
                            <div className="flex flex-wrap gap-2">
                                {tos.topics.map((topic, index) => (
                                    <span 
                                        key={index} 
                                        className="bg-slate-200 text-slate-800 px-3 py-1 rounded-full text-sm"
                                    >
                                        {topic}
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        <div className="mt-6">
                            <h3 className="text-lg font-medium mb-4">Table of Specifications:</h3>
                            <div className="prose max-w-none">
                                {/* This would ideally be a markdown renderer */}
                                <pre className="whitespace-pre-wrap bg-slate-50 p-4 rounded border text-sm">
                                    {tos.content}
                                </pre>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
