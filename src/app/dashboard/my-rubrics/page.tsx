// frontend/src/app/dashboard/my-rubrics/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";    
import { Loader2, Trash2, Eye } from "lucide-react";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from 'date-fns';

// Interface for rubric summary data - adjust fields to match GET /rubrics response
interface RubricSummary {
    id: number;
    title: string | null;
    assessment_title: string;
    assessment_type: string;
    class_level: string;
    created_at: string;
    updated_at: string;
}

export default function MyRubricsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, token, isAuthenticated, isLoading: isLoadingAuth } = useAuthStore();
    const [hasMounted, setHasMounted] = useState(false);
    const [rubrics, setRubrics] = useState<RubricSummary[]>([]); // State for rubrics
    const [isLoadingRubrics, setIsLoadingRubrics] = useState(true); // Loading state
    const [errorLoading, setErrorLoading] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // --- Mount and Auth Check ---
    useEffect(() => { setHasMounted(true); }, []);
    useEffect(() => {
        if (hasMounted && !isLoadingAuth && !isAuthenticated) {
            toast({ title: "Authentication Required", variant: "destructive" });
            router.push('/login');
        }
        if (hasMounted && !isLoadingAuth && isAuthenticated && user?.role !== 'teacher') {
           toast({ title: "Access Denied: Teachers Only", variant: "destructive" });
           router.push('/dashboard');
        }
    }, [hasMounted, isLoadingAuth, isAuthenticated, user, router, toast]);

    // --- Fetch Saved Rubrics ---
    useEffect(() => {
        const fetchRubrics = async () => {
            if (hasMounted && isAuthenticated && token) {
                setIsLoadingRubrics(true);
                setErrorLoading(null);
                try {
                    // Use the correct endpoint for fetching rubrics
                    const response = await fetch('http://localhost:3005/api/teacher-tools/rubrics', {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    if (!response.ok) {
                        let errorMsg = `Failed to fetch rubrics (Status: ${response.status})`;
                        try { 
                            const errorData = await response.json(); 
                            errorMsg = errorData.error || errorMsg; 
                        } catch (e) {}
                        throw new Error(errorMsg);
                    }
                    const data: RubricSummary[] = await response.json();
                    setRubrics(data); // Set rubrics state
                    console.log(`Fetched ${data.length} rubrics.`);
                } catch (error: any) {
                    console.error("Error fetching rubrics:", error);
                    const errorMsg = error.message || "Could not load your saved rubrics.";
                    setErrorLoading(errorMsg);
                    setRubrics([]);
                    toast({ title: "Loading Error", description: errorMsg, variant: "destructive" });
                } finally {
                    setIsLoadingRubrics(false);
                }
            } else if (hasMounted && !isLoadingAuth && !isAuthenticated) {
                setIsLoadingRubrics(false);
            }
        };
        fetchRubrics();
    }, [hasMounted, isAuthenticated, token, toast]);

    // --- Handle Delete Rubric ---
    const handleDeleteRubric = async (rubricId: number) => {
        if (!token || deletingId) return;
        setDeletingId(rubricId);
        try {
            // Use the correct endpoint for deleting rubrics
            const response = await fetch(`http://localhost:3005/api/teacher-tools/rubrics/${rubricId}`, {        
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                 let errorMsg = `Failed to delete rubric (Status: ${response.status})`;
                 try { 
                     const errorData = await response.json(); 
                     errorMsg = errorData.error || errorMsg; 
                 } catch(e) {}
                 throw new Error(errorMsg);
            }
            // Update state
            setRubrics(prev => prev.filter(r => r.id !== rubricId));
            toast({ title: "Success", description: "Rubric deleted successfully." });
        } catch (error: any) {
            console.error("Error deleting rubric:", error);
            toast({ 
                title: "Delete Error", 
                description: error.message || "Could not delete rubric.", 
                variant: "destructive" 
            });
        } finally {
            setDeletingId(null);
        }
    };

    // --- Render Logic ---
    if (!hasMounted || isLoadingAuth) { 
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
            </div>
        );
    }
    
    if (!isAuthenticated || !user || user.role !== 'teacher') { 
        return null; // Will redirect in useEffect
    }

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8">
             <header className="mb-6 flex justify-between items-center">
                 <div>
                     <h1 className="text-3xl font-bold text-brand-darkblue">My Saved Rubrics</h1>
                     <nav className="text-sm text-gray-500">
                         <Link href="/dashboard" className="hover:underline">Dashboard</Link>
                         {' / '}
                         <span>My Rubrics</span>
                     </nav>
                 </div>
                 <Button variant="outline" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>  
             </header>

            {/* Loading State */}
            {isLoadingRubrics && (
                <div className="flex justify-center items-center py-16">
                    <div className="text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-brand-orange mx-auto mb-4" />
                        <p className="text-gray-500">Loading your saved rubrics...</p>
                    </div>
                </div>
            )}
            
            {/* Error State */}
            {!isLoadingRubrics && errorLoading && (
                <Alert variant="destructive" className="mt-6">
                    <AlertTitle>Error Loading Rubrics</AlertTitle>
                    <AlertDescription>{errorLoading}</AlertDescription>
                </Alert>
            )}
            
            {/* No Rubrics State */}
             {!isLoadingRubrics && !errorLoading && rubrics.length === 0 && (
                 <Card className="text-center py-10 mt-6">
                     <CardHeader><CardTitle>No Saved Rubrics Yet</CardTitle></CardHeader>
                     <CardContent>
                         <CardDescription className="mb-4">
                            Generate a rubric using the AI Rubric Generator!
                         </CardDescription>
                         <Link href="/dashboard/rubric-generator">
                             <Button>Go to Rubric Generator</Button>
                         </Link>
                     </CardContent>
                 </Card>
             )}

            {/* Display Rubrics List */}
            {!isLoadingRubrics && !errorLoading && rubrics.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rubrics.map((rubric) => (
                        <Card key={rubric.id} className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-200">
                            <CardHeader>
                                <CardTitle className="text-lg truncate">
                                    {rubric.title || `Rubric: ${rubric.assessment_title?.substring(0, 30) ?? 'Untitled'}...`}
                                </CardTitle>
                                <CardDescription>
                                    {rubric.assessment_type} - {rubric.class_level}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-gray-600 line-clamp-2">
                                    For: {rubric.assessment_title}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                    Last Updated: {rubric.updated_at ? format(new Date(rubric.updated_at), 'PPp') : 'N/A'}
                                </p>
                            </CardContent>
                            <CardFooter className="flex justify-end space-x-2 border-t pt-4">
                                {/* Link to View/Edit Rubric Page (TODO: Create this page) */}
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    title="View or Edit Rubric" 
                                    onClick={() => alert(`View/Edit Rubric ID: ${rubric.id} - Page not implemented yet.`)}
                                >
                                    <Eye className="h-4 w-4 mr-1" /> View/Edit
                                </Button>

                                {/* Delete Button */}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <span> {/* Keep wrapper */}
                                            <Button 
                                                variant="destructive" 
                                                size="sm" 
                                                disabled={deletingId === rubric.id} 
                                                title="Delete Rubric" 
                                                className="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500"
                                            >      
                                                {deletingId === rubric.id ? 
                                                    <Loader2 className="h-4 w-4 animate-spin" /> : 
                                                    <Trash2 className="h-4 w-4" />
                                                }
                                            </Button>
                                        </span>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete the rubric for: <br />
                                                <strong className="break-words">
                                                    {rubric.title || rubric.assessment_title}
                                                </strong>
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction 
                                                onClick={(e) => { 
                                                    e.preventDefault(); 
                                                    handleDeleteRubric(rubric.id); 
                                                }} 
                                                className="bg-red-600 text-destructive-foreground hover:bg-red-700"
                                            >
                                                Delete Permanently
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
