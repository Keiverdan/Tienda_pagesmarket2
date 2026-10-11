export interface Product {
  id: number;
  titulo: string;
  marca: string;
  peso: string;
  categoria: string;
  precioUSD: number;
  imagen: string;
}

export interface Category {
  id: string;
  nombre: string;
  icono: string;
}

export interface BankConfig {
  codigo: string;
  cedula: string;
  telefono: string;
}

export interface StoreConfig {
  tienda: string;
  whatsapp: string;
  whatsappVisible: string;
  tasaBCV: number;
  banco: BankConfig;
}

export interface StoreData {
  config: StoreConfig;
  categorias: Category[];
  productos: Product[];
}

export interface AppState {
  customerName: string;
  quantities: Record<number, number>;
  refNumber: string;
  category: string;
  query: string;
}
