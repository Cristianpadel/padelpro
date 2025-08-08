// src/app/(app)/store/page.tsx
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from '@/components/ui/skeleton';
import { fetchProductsByClub, getMockCurrentUser, reserveProductWithCredit } from '@/lib/mockData';
import type { Product, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShoppingBag } from 'lucide-react';

const ProductCard: React.FC<{ product: Product; onReserve: (productId: string) => void; isProcessing: boolean; processingId: string | null; }> = ({ product, onReserve, isProcessing, processingId }) => {
    const isThisProductProcessing = isProcessing && processingId === product.id;
    return (
        <Card className="overflow-hidden shadow-lg transition-transform hover:scale-105 flex flex-col">
            <CardHeader className="p-0">
                <Image
                    src={product.images[0] || 'https://placehold.co/600x400.png'}
                    alt={product.name}
                    width={600}
                    height={400}
                    className="h-48 w-full object-cover"
                    data-ai-hint={product.aiHint}
                />
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <CardTitle className="text-base font-semibold">{product.name}</CardTitle>
            </CardContent>
            <CardFooter className="flex items-center justify-between p-4 pt-0">
                <div className="flex flex-col">
                    {product.offerPrice < product.officialPrice && (
                        <Badge variant="secondary" className="text-xs font-normal line-through text-muted-foreground self-start mb-0.5">{product.officialPrice.toFixed(2)}€</Badge>
                    )}
                    <Badge variant="default" className="text-lg font-bold">{product.offerPrice.toFixed(2)}€</Badge>
                </div>
                <Button onClick={() => onReserve(product.id)} disabled={isThisProductProcessing}>
                    {isThisProductProcessing ? <Loader2 className="animate-spin" /> : "Reservar"}
                </Button>
            </CardFooter>
        </Card>
    );
};


export default function StorePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, startTransition] = useTransition();
    const [processingId, setProcessingId] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // In a multi-club setup, you'd get the clubId from context or URL
                const [fetchedProducts, user] = await Promise.all([
                    fetchProductsByClub('club-1'),
                    getMockCurrentUser()
                ]);
                setProducts(fetchedProducts);
                setCurrentUser(user);
            } catch (error) {
                console.error("Error loading store data:", error);
                toast({ title: "Error", description: "No se pudieron cargar los productos de la tienda.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [toast]);

    const handleReserveProduct = (productId: string) => {
        if (!currentUser) {
            toast({ title: "Acción Requerida", description: "Debes iniciar sesión para reservar productos.", variant: "default" });
            return;
        }
        setProcessingId(productId);
        startTransition(async () => {
            const result = await reserveProductWithCredit(currentUser.id, productId);
            if ('error' in result) {
                toast({ title: "Error en la Reserva", description: result.error, variant: "destructive" });
            } else {
                toast({
                    title: "¡Producto Reservado!",
                    description: `Se ha descontado la fianza. Tu nuevo saldo es ${result.newBalance.toFixed(2)}€.`,
                    className: 'bg-primary text-primary-foreground',
                });
                // Trigger a re-fetch of user data or update context if available
                 window.dispatchEvent(new CustomEvent('productReservationChanged'));
            }
            setProcessingId(null);
        });
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <header>
                <h1 className="font-headline text-3xl font-semibold">Tienda del Club</h1>
                <p className="text-muted-foreground">
                    Reserva tu material y recógelo en el club. Se cobrará una fianza de 1€ que se descontará del precio final.
                </p>
            </header>
            
            {loading ? (
                 <main className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                     {[...Array(4)].map((_, index) => (
                        <Card key={index} className="overflow-hidden">
                             <Skeleton className="h-48 w-full" />
                             <CardContent className="p-4 space-y-2">
                                 <Skeleton className="h-5 w-3/4" />
                             </CardContent>
                             <CardFooter className="flex items-center justify-between p-4 pt-0">
                                 <Skeleton className="h-8 w-20" />
                                 <Skeleton className="h-10 w-24" />
                             </CardFooter>
                        </Card>
                     ))}
                 </main>
            ) : products.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center text-center p-8 border-dashed border-2 rounded-lg mt-8">
                     <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold">Tienda Vacía</h2>
                    <p className="text-muted-foreground mt-2">Aún no hay productos disponibles en esta tienda.</p>
                </div>
            ) : (
                <main className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onReserve={handleReserveProduct}
                            isProcessing={isProcessing}
                            processingId={processingId}
                        />
                    ))}
                </main>
            )}
        </div>
    );
}
