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
import { Loader2, ShoppingBag, Sparkles, Clock, Package, PackageCheck, PackageX } from 'lucide-react';
import { cn } from '@/lib/utils';

const CountdownTimer = () => {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const endOfDay = new Date(now);
            endOfDay.setHours(23, 59, 59, 999);
            
            const difference = endOfDay.getTime() - now.getTime();
            
            let hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            let minutes = Math.floor((difference / 1000 / 60) % 60);
            let seconds = Math.floor((difference / 1000) % 60);
            
            setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return <div className="text-xl font-bold text-destructive">{timeLeft}</div>;
};

const ProductCard: React.FC<{ product: Product; onReserve: (productId: string) => void; isProcessing: boolean; processingId: string | null; }> = ({ product, onReserve, isProcessing, processingId }) => {
    const isThisProductProcessing = isProcessing && processingId === product.id;
    const isOutOfStock = product.stock !== undefined && product.stock <= 0;
    
    return (
        <Card className="overflow-hidden shadow-lg transition-transform hover:scale-105 flex flex-col">
            <CardHeader className="p-0 relative">
                <Image
                    src={product.images[0] || 'https://placehold.co/600x400.png'}
                    alt={product.name}
                    width={600}
                    height={400}
                    className="h-48 w-full object-cover"
                    data-ai-hint={product.aiHint}
                />
                 {product.stock !== undefined && (
                     <Badge variant={isOutOfStock ? "destructive" : "secondary"} className="absolute top-2 right-2">
                        {isOutOfStock ? <PackageX className="mr-1 h-3 w-3" /> : <PackageCheck className="mr-1 h-3 w-3" />}
                        {isOutOfStock ? 'Agotado' : `${product.stock} en stock`}
                    </Badge>
                 )}
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
                <Button onClick={() => onReserve(product.id)} disabled={isThisProductProcessing || isOutOfStock}>
                    {isThisProductProcessing ? <Loader2 className="animate-spin" /> : (isOutOfStock ? "Agotado" : "Reservar")}
                </Button>
            </CardFooter>
        </Card>
    );
};

const DealOfTheDayCard: React.FC<{ product: Product; onReserve: (productId: string) => void; isProcessing: boolean; processingId: string | null; }> = ({ product, onReserve, isProcessing, processingId }) => {
    const isThisProductProcessing = isProcessing && processingId === product.id;
    const isOutOfStock = product.stock !== undefined && product.stock <= 0;
    const discountPrice = product.offerPrice * (1 - (product.discountPercentage || 0) / 100);

    return (
        <Card className="overflow-hidden shadow-2xl border-2 border-amber-400 bg-amber-50/50 flex flex-col col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
            <div className="grid grid-cols-1 md:grid-cols-2 items-center">
                 <div className="p-4 md:p-6 order-2 md:order-1">
                     <CardHeader className="p-0 mb-4">
                        <Badge variant="outline" className="text-amber-700 border-amber-500 bg-white font-semibold text-sm self-start animate-pulse">
                             <Sparkles className="mr-2 h-4 w-4" /> Oferta del Día
                        </Badge>
                        <CardTitle className="text-2xl md:text-3xl font-bold mt-2">{product.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-destructive">{discountPrice.toFixed(2)}€</span>
                                <span className="text-lg font-semibold text-muted-foreground line-through">{product.offerPrice.toFixed(2)}€</span>
                            </div>
                            <Badge variant="destructive">-{product.discountPercentage}%</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-4">
                            <Clock className="h-5 w-5" />
                            <span>La oferta termina en:</span>
                            <CountdownTimer />
                        </div>
                         {product.stock !== undefined && (
                             <Badge variant={isOutOfStock ? "destructive" : "secondary"}>
                                {isOutOfStock ? <PackageX className="mr-1 h-3 w-3" /> : <PackageCheck className="mr-1 h-3 w-3" />}
                                {isOutOfStock ? 'Agotado' : `${product.stock} en stock`}
                            </Badge>
                         )}
                    </CardContent>
                    <CardFooter className="p-0 mt-4">
                         <Button size="lg" onClick={() => onReserve(product.id)} disabled={isThisProductProcessing || isOutOfStock}>
                            {isThisProductProcessing ? <Loader2 className="animate-spin" /> : (isOutOfStock ? "Agotado" : "Reservar Oferta")}
                        </Button>
                    </CardFooter>
                 </div>
                 <div className="order-1 md:order-2">
                     <Image
                        src={product.images[0] || 'https://placehold.co/600x400.png'}
                        alt={product.name}
                        width={800}
                        height={600}
                        className="h-64 w-full object-cover md:h-full md:rounded-r-lg"
                        data-ai-hint={product.aiHint}
                    />
                 </div>
            </div>
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
                 // Manually update the stock of the product in the local state
                 setProducts(prevProducts => prevProducts.map(p => 
                    p.id === productId ? { ...p, stock: (p.stock || 1) - 1 } : p
                 ));
            }
            setProcessingId(null);
        });
    };
    
    const dealOfTheDay = products.find(p => p.isDealOfTheDay);
    const regularProducts = products.filter(p => !p.isDealOfTheDay);

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
                    {dealOfTheDay && (
                        <DealOfTheDayCard
                           product={dealOfTheDay}
                           onReserve={handleReserveProduct}
                           isProcessing={isProcessing}
                           processingId={processingId}
                        />
                    )}
                    {regularProducts.map((product) => (
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
