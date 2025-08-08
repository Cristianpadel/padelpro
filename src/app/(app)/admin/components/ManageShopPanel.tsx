// src/app/(app)/admin/components/ManageShopPanel.tsx
"use client";

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import type { Club, Product, ProductCategory } from '@/types';
import { productCategories } from '@/types';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PlusCircle, ListChecks, Edit, Trash2, ShoppingBag, Euro, ImageIcon, FileQuestion, BarChart, Loader2, Image as LucideImage, Sparkles, Settings, Package } from 'lucide-react';
import { fetchProductsByClub, addProduct, updateProduct, deleteProduct, updateClub } from '@/lib/mockData';
import Image from 'next/image';
import ManageDealOfTheDayPanel from './ManageDealOfTheDayPanel';
import { Badge } from '@/components/ui/badge';


interface ManageShopPanelProps {
  club: Club;
  onClubSettingsUpdated: (updatedClub: Club) => void;
}

const productFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  category: z.enum(productCategories.map(c => c.value) as [ProductCategory, ...ProductCategory[]]),
  status: z.enum(['in-stock', 'on-order']),
  officialPrice: z.coerce.number().min(0, "El precio debe ser un número positivo."),
  offerPrice: z.coerce.number().min(0, "El precio debe ser un número positivo."),
  stock: z.coerce.number().int().min(0, "El stock no puede ser negativo.").optional(),
  aiHint: z.string().min(2, "La pista para la IA es necesaria.").max(50, "Máximo 50 caracteres."),
  images: z.array(z.string().url("Debe ser una URL válida.").or(z.literal(""))).min(1, "Se requiere al menos una imagen.").max(3, "Máximo 3 imágenes."),
});

type ProductFormData = z.infer<typeof productFormSchema>;


// --- AddProductForm Component (local to ManageShopPanel) ---
const AddProductForm: React.FC<{ clubId: string; onProductAdded: () => void }> = ({ clubId, onProductAdded }) => {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      category: "pala",
      status: "in-stock",
      officialPrice: 0,
      offerPrice: 0,
      stock: 10,
      aiHint: "",
      images: ["", "", ""],
    },
  });

  const onSubmit = (values: ProductFormData) => {
    startTransition(async () => {
      const productData = {
        ...values,
        clubId,
        images: values.images.filter(img => img.trim() !== ''),
      };
      if (productData.images.length === 0) {
        form.setError("images", { type: 'manual', message: 'Se requiere al menos una imagen.' });
        return;
      }
      const result = await addProduct(productData);
      if ('error' in result) {
        toast({ title: "Error al añadir producto", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "¡Producto añadido!", description: `${result.name} ha sido añadido a la tienda.` });
        form.reset();
        onProductAdded();
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg"><PlusCircle className="mr-2 h-5 w-5 text-primary"/>Añadir Producto</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Categoría</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{productCategories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="in-stock">En Stock</SelectItem><SelectItem value="on-order">Bajo Pedido</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="stock" render={({ field }) => (<FormItem><FormLabel>Stock</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="officialPrice" render={({ field }) => (<FormItem><FormLabel className="text-xs">Precio Oficial</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="offerPrice" render={({ field }) => (<FormItem><FormLabel className="text-xs">Precio Oferta</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="aiHint" render={({ field }) => (<FormItem><FormLabel>Pista para IA</FormLabel><FormControl><Input {...field} placeholder="Ej: Bullpadel Vertex" /></FormControl><FormMessage /></FormItem>)} />
            <div>
              <FormLabel>Imágenes (URLs)</FormLabel>
              {form.getValues('images').map((_, index) => (
                <FormField key={index} control={form.control} name={`images.${index}`} render={({ field }) => (<FormItem className="mt-1"><FormControl><Input {...field} placeholder={`URL Imagen ${index + 1}`}/></FormControl><FormMessage /></FormItem>)} />
              ))}
            </div>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? <Loader2 className="animate-spin" /> : "Añadir Producto"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};


// --- EditProductDialog Component (local to ManageShopPanel) ---
const EditProductDialog: React.FC<{ product: Product; isOpen: boolean; onClose: (updated?: boolean) => void }> = ({ product, isOpen, onClose }) => {
    // ... Similar implementation to AddProductForm but inside a Dialog, pre-filled with `product` data.
    // This is omitted for brevity but would be a Dialog with a Form component inside.
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Funcionalidad en Desarrollo</DialogTitle>
                    <DialogDescription>
                        La edición de productos estará disponible próximamente.
                    </DialogDescription>
                </DialogHeader>
                 <DialogFooter>
                    <Button onClick={() => onClose()}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


// --- ProductList Component (local to ManageShopPanel) ---
const ProductList: React.FC<{ products: Product[]; onEdit: (product: Product) => void; onDelete: (productId: string) => void; isLoading: boolean; error: string | null }> = ({ products, onEdit, onDelete, isLoading, error }) => {
  // ... Implementation for displaying the list, similar to InstructorList or ClubList.
    if (isLoading) {
        return <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;
    }
    if (error) return <p className="text-destructive text-center">{error}</p>;
    if (products.length === 0) return <p className="text-muted-foreground text-center italic mt-4">No hay productos en esta tienda.</p>;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center text-lg"><ListChecks className="mr-2 h-5 w-5 text-primary"/>Productos de la Tienda</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[500px] pr-3">
                    <div className="space-y-3">
                    {products.map(p => (
                        <div key={p.id} className="flex items-center p-2 border rounded-lg">
                           <Image src={p.images[0] || 'https://placehold.co/64x64.png'} alt={p.name} width={48} height={48} className="rounded-md object-cover mr-3" data-ai-hint={p.aiHint}/>
                           <div className="flex-grow">
                               <p className="font-semibold text-sm line-clamp-1">{p.name}</p>
                               <div className="flex items-center gap-2">
                                    <p className="text-xs text-muted-foreground">{p.offerPrice.toFixed(2)}€</p>
                                    <Badge variant="outline" className="text-xs">Stock: {p.stock ?? 0}</Badge>
                               </div>
                           </div>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => onEdit(p)}><Edit className="h-4 w-4"/></Button>
                           <AlertDialog>
                               <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4"/></Button></AlertDialogTrigger>
                               <AlertDialogContent>
                                   <AlertDialogHeader><AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle><AlertDialogDescription>¿Estás seguro de que quieres eliminar "{p.name}"? Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                                   <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(p.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter>
                               </AlertDialogContent>
                           </AlertDialog>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

// --- ShopSettingsForm Component (local) ---
const shopSettingsSchema = z.object({
  shopReservationFee: z.coerce.number().min(0, "La tarifa no puede ser negativa."),
});
type ShopSettingsFormData = z.infer<typeof shopSettingsSchema>;

const ShopSettingsForm: React.FC<{ club: Club; onSettingsUpdated: (updatedClub: Club) => void; }> = ({ club, onSettingsUpdated }) => {
  const [isSaving, startTransition] = useTransition();
  const { toast } = useToast();
  const form = useForm<ShopSettingsFormData>({
    resolver: zodResolver(shopSettingsSchema),
    defaultValues: {
      shopReservationFee: club.shopReservationFee ?? 1,
    }
  });

  const onSubmit = (data: ShopSettingsFormData) => {
    startTransition(async () => {
      const result = await updateClub(club.id, { shopReservationFee: data.shopReservationFee });
      if ('error' in result) {
        toast({ title: "Error al guardar", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Configuración guardada", description: "La tarifa de reserva ha sido actualizada." });
        onSettingsUpdated(result);
        form.reset({ shopReservationFee: result.shopReservationFee });
      }
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center text-lg"><Settings className="mr-2 h-5 w-5 text-primary" />Configuración General de la Tienda</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="shopReservationFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tarifa de Reserva de Producto (€)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.5" {...field} />
                  </FormControl>
                  <FormDescription>Esta cantidad se descontará del saldo del usuario al reservar un producto para pagarlo en el club.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar Configuración"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};


// --- Main ManageShopPanel Component ---
const ManageShopPanel: React.FC<ManageShopPanelProps> = ({ club, onClubSettingsUpdated }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedProducts = await fetchProductsByClub(club.id);
      setProducts(fetchedProducts);
    } catch (err) {
      setError("No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  }, [club.id]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts, refreshKey]);

  const handleProductAdded = () => {
    setRefreshKey(prev => prev + 1);
     // Dispatch a global event so other components (like the nav bar) can update
    window.dispatchEvent(new CustomEvent('productReservationChanged'));
  };
  
  const handleSettingsUpdated = (updatedClub: Club) => {
    onClubSettingsUpdated(updatedClub);
    setRefreshKey(prev => prev + 1); // Also refresh if settings change
  };


  const handleEditProduct = (product: Product) => {
    // For now, let's just log it, as the edit dialog is a placeholder.
    console.log("Editing product (functionality in development):", product);
    toast({ title: "Función en Desarrollo", description: "La edición de productos estará disponible próximamente." });
    // setEditingProduct(product);
  };

  const handleDeleteProduct = async (productId: string) => {
    const result = await deleteProduct(productId);
    if ('error' in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Producto Eliminado" });
      setRefreshKey(prev => prev + 1);
       window.dispatchEvent(new CustomEvent('productReservationChanged'));
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AddProductForm clubId={club.id} onProductAdded={handleProductAdded} />
        </div>
        <div className="lg:col-span-2">
          <ProductList
            products={products}
            isLoading={loading}
            error={error}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
          />
        </div>
        <div className="lg:col-span-3">
             <ManageDealOfTheDayPanel club={club} allClubProducts={products} onSettingsUpdated={handleSettingsUpdated} />
        </div>
         <div className="lg:col-span-3">
            <ShopSettingsForm club={club} onSettingsUpdated={handleSettingsUpdated} />
        </div>
      </div>
      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          isOpen={!!editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </>
  );
};

export default ManageShopPanel;
