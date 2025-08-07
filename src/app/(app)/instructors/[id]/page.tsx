// src/app/(app)/instructors/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import { getMockInstructors, fetchReviewsForInstructor, getMockStudents } from '@/lib/mockData';
import type { Instructor, Review, User } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Star, Languages, ShieldCheck, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function InstructorProfilePage() {
    const params = useParams();
    const id = params.id as string;

    const [instructor, setInstructor] = useState<Instructor | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [students, setStudents] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        const fetchInstructorData = async () => {
            setLoading(true);
            try {
                const [instructors, fetchedReviews, allStudents] = await Promise.all([
                    getMockInstructors(),
                    fetchReviewsForInstructor(id),
                    getMockStudents(),
                ]);
                
                const foundInstructor = instructors.find(i => i.id === id);
                setInstructor(foundInstructor || null);
                setReviews(fetchedReviews);
                setStudents(allStudents);

            } catch (error) {
                console.error("Error fetching instructor details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInstructorData();
    }, [id]);
    
    const renderStars = (rating: number) => {
        const fullStars = Math.round(rating);
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(<Star key={i} className={cn("h-4 w-4", i <= fullStars ? "fill-yellow-400 text-yellow-500" : "fill-gray-300 text-gray-400")} />);
        }
        return <div className="flex items-center">{stars}</div>;
    };


    if (loading) {
        return (
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col items-center gap-4">
                    <Skeleton className="h-32 w-32 rounded-full" />
                    <div className="space-y-2 text-center">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-5 w-32" />
                    </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-48 w-full md:col-span-2" />
                </div>
            </div>
        );
    }
    
    if (!instructor) {
        return notFound();
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <div className="flex flex-col items-center gap-4">
                <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-lg">
                    <AvatarImage src={instructor.profilePictureUrl} alt={`Foto de ${instructor.name}`} data-ai-hint="instructor profile photo large"/>
                    <AvatarFallback className="text-5xl">{getInitials(instructor.name || '')}</AvatarFallback>
                </Avatar>
                <div className="space-y-1 text-center">
                    <h1 className="text-3xl font-bold">{instructor.name}</h1>
                    <p className="text-muted-foreground">Instructor de Pádel</p>
                </div>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Star className="mr-2 h-5 w-5 text-yellow-500" />Nivel y Estilo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p><strong>Nivel de Juego:</strong> {instructor.level}</p>
                        <p><strong>Categoría:</strong> {instructor.genderCategory === 'femenino' ? 'Femenina' : (instructor.genderCategory === 'masculino' ? 'Masculina' : 'Mixta')}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Languages className="mr-2 h-5 w-5 text-blue-500" />Idiomas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{(instructor.languages || ['Español']).join(', ')}</p>
                    </CardContent>
                </Card>
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center"><ShieldCheck className="mr-2 h-5 w-5 text-green-500" />Experiencia</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            {(instructor.experience || ['Más de 5 años de experiencia en la enseñanza de pádel a todos los niveles.']).map((exp, i) => (
                                <li key={i}>{exp}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
                 <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center"><MessageSquare className="mr-2 h-5 w-5 text-indigo-500" />Valoraciones de Alumnos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {reviews.length > 0 ? (
                            reviews.map(review => {
                                const student = students.find(s => s.id === review.userId);
                                return (
                                    <div key={review.id} className="flex items-start space-x-4 border-b pb-4 last:border-b-0 last:pb-0">
                                        <Avatar>
                                            <AvatarImage src={student?.profilePictureUrl} alt={student?.name} data-ai-hint="student avatar"/>
                                            <AvatarFallback>{getInitials(student?.name || 'U')}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold">{student?.name || 'Alumno Anónimo'}</p>
                                                {renderStars(review.rating)}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                                            <p className="text-xs text-muted-foreground/80 mt-2">{format(new Date(review.createdAt), "dd MMMM, yyyy", { locale: es })}</p>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <p className="text-muted-foreground italic text-center">Este instructor aún no tiene valoraciones.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
