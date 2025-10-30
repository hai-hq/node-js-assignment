/**
 * Product model interface
 */
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Input type for creating a product
 */
export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category?: string;
}

/**
 * Input type for updating a product
 */
export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  category?: string;
}

/**
 * Filter options for listing products
 */
export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationMeta;
}

