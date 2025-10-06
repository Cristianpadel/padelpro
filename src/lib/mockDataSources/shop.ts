// src/lib/mockDataSources/shop.ts

import type { Product } from '@/types';
import * as state from './index';

export const fetchProductsByClub = async (clubId: string): Promise<Product[]> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    return state.getMockShopProducts().filter(product => product.clubId === clubId);
};

export const addProduct = async (productData: Omit<Product, 'id'>): Promise<Product | { error: string }> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  if (!productData.name || !productData.clubId) {
    return { error: 'El nombre y el club son obligatorios.' };
  }
  
  const newProduct: Product = {
    ...productData,
    id: `prod-${Date.now()}`,
    stock: productData.stock ?? 0,
  };

  state.addProductToState(newProduct);
  return newProduct;
};

export const updateProduct = async (productId: string, updates: Partial<Product>): Promise<Product | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const updatedProduct = state.updateProductInState(productId, updates);
    if (!updatedProduct) {
        return { error: 'Producto no encontrado.' };
    }
    return updatedProduct;
};

export const deleteProduct = async (productId: string): Promise<{ success: true } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const success = state.removeProductFromState(productId);
    if (!success) {
        return { error: 'Producto no encontrado.' };
    }
    return { success: true };
};
