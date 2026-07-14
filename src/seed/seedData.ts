import { Family } from '../modules/families/domain/entities/Family';
import { Product, ProductFormat } from '../modules/products/domain/entities/Product';

export type SeedFamily = {
  id: string;
  name: string;
};

export type SeedProduct = {
  id: string;
  name: string;
  code: string;
  price: number;
  stock: number;
  format: ProductFormat;
  familyId: string;
};

const now = new Date().toISOString();

export const seedFamilies: SeedFamily[] = [
  { id: 'fam_bebidas', name: 'Bebidas y jugos' },
  { id: 'fam_lacteos', name: 'Lácteos y huevos' },
  { id: 'fam_panaderia', name: 'Panadería y pastelería' },
  { id: 'fam_carnes', name: 'Carnes y embutidos' },
  { id: 'fam_verduras', name: 'Frutas y verduras' },
  { id: 'fam_despensa', name: 'Despensa y enlatados' },
  { id: 'fam_congelados', name: 'Congelados' },
  { id: 'fam_aseo', name: 'Aseo y limpieza' },
];

export const seedProducts: SeedProduct[] = [
  // Bebidas y jugos (13)
  { id: 'prd_01', name: 'Coca-Cola 1.5L', code: 'BEB001', price: 2150, stock: 24, format: 'unit', familyId: 'fam_bebidas' },
  { id: 'prd_02', name: 'Sprite 1.5L', code: 'BEB002', price: 2100, stock: 18, format: 'unit', familyId: 'fam_bebidas' },
  { id: 'prd_03', name: 'Fanta Naranja 1.5L', code: 'BEB003', price: 2100, stock: 15, format: 'unit', familyId: 'fam_bebidas' },
  { id: 'prd_04', name: 'Agua mineral Cielo 1.5L', code: 'BEB004', price: 1200, stock: 36, format: 'unit', familyId: 'fam_bebidas' },
  { id: 'prd_05', name: 'Jugo del Valle Naranja 1L', code: 'BEB005', price: 2450, stock: 12, format: 'unit', familyId: 'fam_bebidas' },
  { id: 'prd_06', name: 'Bilz Papaya 1.5L', code: 'BEB006', price: 2100, stock: 20, format: 'unit', familyId: 'fam_bebidas' },
  { id: 'prd_07', name: 'Gatorade Naranja 600ml', code: 'BEB007', price: 1800, stock: 30, format: 'unit', familyId: 'fam_bebidas' },
  { id: 'prd_08', name: 'Pack Coca-Cola 6x350ml', code: 'BEB008', price: 8900, stock: 8, format: 'pack', familyId: 'fam_bebidas' },
  { id: 'prd_09', name: 'Agua tonica Canada Dry', code: 'BEB009', price: 1950, stock: 10, format: 'unit', familyId: 'fam_bebidas' },
  { id: 'prd_10', name: 'Monster Energy 500ml', code: 'BEB010', price: 2500, stock: 12, format: 'unit', familyId: 'fam_bebidas' },
  { id: 'prd_11', name: 'Jugo en polvo Tang Naranja 30g', code: 'BEB011', price: 650, stock: 40, format: 'unit', familyId: 'fam_bebidas' },
  { id: 'prd_12', name: 'Vino tinto Concha y Toro 750ml', code: 'BEB012', price: 5990, stock: 6, format: 'unit', familyId: 'fam_bebidas' },
  { id: 'prd_13', name: 'Cerveza Cristal 6x330ml', code: 'BEB013', price: 7990, stock: 10, format: 'pack', familyId: 'fam_bebidas' },

  // Lacteos y huevos (12)
  { id: 'prd_14', name: 'Leche entera Soprole 1L', code: 'LAC001', price: 1250, stock: 30, format: 'unit', familyId: 'fam_lacteos' },
  { id: 'prd_15', name: 'Leche semidescremada Colun 1L', code: 'LAC002', price: 1300, stock: 24, format: 'unit', familyId: 'fam_lacteos' },
  { id: 'prd_16', name: 'Yogurt batido Soprole frutilla 1kg', code: 'LAC003', price: 2890, stock: 10, format: 'unit', familyId: 'fam_lacteos' },
  { id: 'prd_17', name: 'Queso laminar Colun 12 unid', code: 'LAC004', price: 3450, stock: 8, format: 'pack', familyId: 'fam_lacteos' },
  { id: 'prd_18', name: 'Mantequilla Soprole 250g', code: 'LAC005', price: 2150, stock: 15, format: 'unit', familyId: 'fam_lacteos' },
  { id: 'prd_19', name: 'Crema de leche Colun 200ml', code: 'LAC006', price: 1650, stock: 12, format: 'unit', familyId: 'fam_lacteos' },
  { id: 'prd_20', name: 'Huevos color 30 unid', code: 'LAC007', price: 5990, stock: 6, format: 'box', familyId: 'fam_lacteos' },
  { id: 'prd_21', name: 'Leche condensada La Lechera 395g', code: 'LAC008', price: 2450, stock: 10, format: 'unit', familyId: 'fam_lacteos' },
  { id: 'prd_22', name: 'Manjar Colun 500g', code: 'LAC009', price: 3650, stock: 8, format: 'unit', familyId: 'fam_lacteos' },
  { id: 'prd_23', name: 'Yogurt griego Soprole natural 150g', code: 'LAC010', price: 1350, stock: 18, format: 'unit', familyId: 'fam_lacteos' },
  { id: 'prd_24', name: 'Leche en polvo Colun 1kg', code: 'LAC011', price: 7990, stock: 5, format: 'unit', familyId: 'fam_lacteos' },
  { id: 'prd_25', name: 'Huevos de codorniz 12 unid', code: 'LAC012', price: 3490, stock: 8, format: 'pack', familyId: 'fam_lacteos' },

  // Panaderia y pasteleria (12)
  { id: 'prd_26', name: 'Pan molde blanco 750g', code: 'PAN001', price: 2350, stock: 15, format: 'unit', familyId: 'fam_panaderia' },
  { id: 'prd_27', name: 'Pan molde integral 750g', code: 'PAN002', price: 2650, stock: 10, format: 'unit', familyId: 'fam_panaderia' },
  { id: 'prd_28', name: 'Hallulla 1kg', code: 'PAN003', price: 1890, stock: 20, format: 'unit', familyId: 'fam_panaderia' },
  { id: 'prd_29', name: 'Pan de hamburguesa 6 unid', code: 'PAN004', price: 2150, stock: 12, format: 'pack', familyId: 'fam_panaderia' },
  { id: 'prd_30', name: 'Pan de completo 6 unid', code: 'PAN005', price: 1950, stock: 12, format: 'pack', familyId: 'fam_panaderia' },
  { id: 'prd_31', name: 'Kuchen de manzana 500g', code: 'PAN006', price: 5990, stock: 5, format: 'unit', familyId: 'fam_panaderia' },
  { id: 'prd_32', name: 'Empanada de pino 10 unid', code: 'PAN007', price: 8990, stock: 8, format: 'pack', familyId: 'fam_panaderia' },
  { id: 'prd_33', name: 'Berlines 4 unid', code: 'PAN008', price: 3990, stock: 10, format: 'pack', familyId: 'fam_panaderia' },
  { id: 'prd_34', name: 'Marraqueta 1kg', code: 'PAN009', price: 1690, stock: 25, format: 'unit', familyId: 'fam_panaderia' },
  { id: 'prd_35', name: 'Pizza familiar prehorneada', code: 'PAN010', price: 6990, stock: 4, format: 'unit', familyId: 'fam_panaderia' },
  { id: 'prd_36', name: 'Torta de chocolate 500g', code: 'PAN011', price: 8990, stock: 3, format: 'unit', familyId: 'fam_panaderia' },
  { id: 'prd_37', name: 'Galletas de mantequilla 200g', code: 'PAN012', price: 1850, stock: 15, format: 'unit', familyId: 'fam_panaderia' },

  // Carnes y embutidos (13)
  { id: 'prd_38', name: 'Pollo entero 1.8kg aprox', code: 'CAR001', price: 6990, stock: 10, format: 'unit', familyId: 'fam_carnes' },
  { id: 'prd_39', name: 'Pechuga de pollo 1kg', code: 'CAR002', price: 7990, stock: 8, format: 'unit', familyId: 'fam_carnes' },
  { id: 'prd_40', name: 'Posta rosada 1kg', code: 'CAR003', price: 8990, stock: 6, format: 'unit', familyId: 'fam_carnes' },
  { id: 'prd_41', name: 'Carne molida 1kg', code: 'CAR004', price: 7490, stock: 12, format: 'unit', familyId: 'fam_carnes' },
  { id: 'prd_42', name: 'Costillar de cerdo 1kg', code: 'CAR005', price: 6490, stock: 8, format: 'unit', familyId: 'fam_carnes' },
  { id: 'prd_43', name: 'Vienesas 10 unid', code: 'CAR006', price: 3990, stock: 15, format: 'pack', familyId: 'fam_carnes' },
  { id: 'prd_44', name: 'Jamón de pollo 300g', code: 'CAR007', price: 3150, stock: 10, format: 'unit', familyId: 'fam_carnes' },
  { id: 'prd_45', name: 'Salame 200g', code: 'CAR008', price: 4250, stock: 8, format: 'unit', familyId: 'fam_carnes' },
  { id: 'prd_46', name: 'Chorizo parrillero 1kg', code: 'CAR009', price: 7990, stock: 6, format: 'unit', familyId: 'fam_carnes' },
  { id: 'prd_47', name: 'Tocino ahumado 250g', code: 'CAR010', price: 3890, stock: 10, format: 'unit', familyId: 'fam_carnes' },
  { id: 'prd_48', name: 'Pulpa de cerdo 1kg', code: 'CAR011', price: 5990, stock: 7, format: 'unit', familyId: 'fam_carnes' },
  { id: 'prd_49', name: 'Patas de pollo 1kg', code: 'CAR012', price: 2990, stock: 12, format: 'unit', familyId: 'fam_carnes' },
  { id: 'prd_50', name: 'Longaniza 500g', code: 'CAR013', price: 4990, stock: 8, format: 'unit', familyId: 'fam_carnes' },

  // Frutas y verduras (13)
  { id: 'prd_51', name: 'Plátano 1kg', code: 'VER001', price: 1490, stock: 20, format: 'unit', familyId: 'fam_verduras' },
  { id: 'prd_52', name: 'Manzana roja 1kg', code: 'VER002', price: 1890, stock: 15, format: 'unit', familyId: 'fam_verduras' },
  { id: 'prd_53', name: 'Naranja 1kg', code: 'VER003', price: 1590, stock: 18, format: 'unit', familyId: 'fam_verduras' },
  { id: 'prd_54', name: 'Palta Hass 1kg', code: 'VER004', price: 4990, stock: 8, format: 'unit', familyId: 'fam_verduras' },
  { id: 'prd_55', name: 'Tomate 1kg', code: 'VER005', price: 1890, stock: 14, format: 'unit', familyId: 'fam_verduras' },
  { id: 'prd_56', name: 'Lechuga escarola unid', code: 'VER006', price: 1250, stock: 10, format: 'unit', familyId: 'fam_verduras' },
  { id: 'prd_57', name: 'Zanahoria 1kg', code: 'VER007', price: 990, stock: 22, format: 'unit', familyId: 'fam_verduras' },
  { id: 'prd_58', name: 'Papas 2kg', code: 'VER008', price: 2890, stock: 12, format: 'unit', familyId: 'fam_verduras' },
  { id: 'prd_59', name: 'Cebolla 1kg', code: 'VER009', price: 1190, stock: 16, format: 'unit', familyId: 'fam_verduras' },
  { id: 'prd_60', name: 'Limón 1kg', code: 'VER010', price: 2590, stock: 10, format: 'unit', familyId: 'fam_verduras' },
  { id: 'prd_61', name: 'Uva red globe 1kg', code: 'VER011', price: 3990, stock: 6, format: 'unit', familyId: 'fam_verduras' },
  { id: 'prd_62', name: 'Frutilla 500g', code: 'VER012', price: 3490, stock: 8, format: 'unit', familyId: 'fam_verduras' },
  { id: 'prd_63', name: 'Bandeja de verduras surtidas 500g', code: 'VER013', price: 2450, stock: 10, format: 'unit', familyId: 'fam_verduras' },

  // Despensa y enlatados (13)
  { id: 'prd_64', name: 'Arroz grado 2 1kg', code: 'DES001', price: 1490, stock: 25, format: 'unit', familyId: 'fam_despensa' },
  { id: 'prd_65', name: 'Fideos tallarines 400g', code: 'DES002', price: 990, stock: 20, format: 'unit', familyId: 'fam_despensa' },
  { id: 'prd_66', name: 'Lentejas 1kg', code: 'DES003', price: 1990, stock: 15, format: 'unit', familyId: 'fam_despensa' },
  { id: 'prd_67', name: 'Atun en aceite 2x180g', code: 'DES004', price: 3890, stock: 12, format: 'pack', familyId: 'fam_despensa' },
  { id: 'prd_68', name: 'Porotos negros 1kg', code: 'DES005', price: 2290, stock: 10, format: 'unit', familyId: 'fam_despensa' },
  { id: 'prd_69', name: 'Aceite vegetal 1L', code: 'DES006', price: 2890, stock: 14, format: 'unit', familyId: 'fam_despensa' },
  { id: 'prd_70', name: 'Sal fina 1kg', code: 'DES007', price: 890, stock: 30, format: 'unit', familyId: 'fam_despensa' },
  { id: 'prd_71', name: 'Azúcar blanca 1kg', code: 'DES008', price: 1290, stock: 25, format: 'unit', familyId: 'fam_despensa' },
  { id: 'prd_72', name: 'Harina con polvos 1kg', code: 'DES009', price: 1490, stock: 18, format: 'unit', familyId: 'fam_despensa' },
  { id: 'prd_73', name: 'Conserva de durazno 820g', code: 'DES010', price: 3150, stock: 8, format: 'unit', familyId: 'fam_despensa' },
  { id: 'prd_74', name: 'Mayonesa Hellmanns 500g', code: 'DES011', price: 3450, stock: 10, format: 'unit', familyId: 'fam_despensa' },
  { id: 'prd_75', name: 'Ketchup Heinz 500g', code: 'DES012', price: 2990, stock: 10, format: 'unit', familyId: 'fam_despensa' },
  { id: 'prd_76', name: 'Te Lipton 100 unid', code: 'DES013', price: 4990, stock: 6, format: 'box', familyId: 'fam_despensa' },

  // Congelados (12)
  { id: 'prd_77', name: 'Papas fritas congeladas 1kg', code: 'CON001', price: 3990, stock: 10, format: 'unit', familyId: 'fam_congelados' },
  { id: 'prd_78', name: 'Arvejas congeladas 500g', code: 'CON002', price: 1990, stock: 12, format: 'unit', familyId: 'fam_congelados' },
  { id: 'prd_79', name: 'Helado de vainilla 1L', code: 'CON003', price: 4990, stock: 8, format: 'unit', familyId: 'fam_congelados' },
  { id: 'prd_80', name: 'Helado de chocolate 1L', code: 'CON004', price: 4990, stock: 8, format: 'unit', familyId: 'fam_congelados' },
  { id: 'prd_81', name: 'Pescado merluza congelado 500g', code: 'CON005', price: 5990, stock: 6, format: 'unit', familyId: 'fam_congelados' },
  { id: 'prd_82', name: 'Pizza congelada familiar', code: 'CON006', price: 7990, stock: 5, format: 'unit', familyId: 'fam_congelados' },
  { id: 'prd_83', name: 'Brócoli congelado 500g', code: 'CON007', price: 2450, stock: 10, format: 'unit', familyId: 'fam_congelados' },
  { id: 'prd_84', name: 'Nuggets de pollo congelados 500g', code: 'CON008', price: 4490, stock: 8, format: 'unit', familyId: 'fam_congelados' },
  { id: 'prd_85', name: 'Postre helado 4 unid', code: 'CON009', price: 3490, stock: 10, format: 'pack', familyId: 'fam_congelados' },
  { id: 'prd_86', name: 'Camarones congelados 400g', code: 'CON010', price: 8990, stock: 4, format: 'unit', familyId: 'fam_congelados' },
  { id: 'prd_87', name: 'Choclo congelado 500g', code: 'CON011', price: 2190, stock: 12, format: 'unit', familyId: 'fam_congelados' },
  { id: 'prd_88', name: 'Papas duquesa congeladas 500g', code: 'CON012', price: 3490, stock: 8, format: 'unit', familyId: 'fam_congelados' },

  // Aseo y limpieza (12)
  { id: 'prd_89', name: 'Cloro gel 1L', code: 'ASE001', price: 1650, stock: 15, format: 'unit', familyId: 'fam_aseo' },
  { id: 'prd_90', name: 'Detergente liquido Omo 1L', code: 'ASE002', price: 5490, stock: 8, format: 'unit', familyId: 'fam_aseo' },
  { id: 'prd_91', name: 'Lavaloza Quix 750ml', code: 'ASE003', price: 2890, stock: 10, format: 'unit', familyId: 'fam_aseo' },
  { id: 'prd_92', name: 'Papel higiénico Elite 12 rollos', code: 'ASE004', price: 6990, stock: 6, format: 'pack', familyId: 'fam_aseo' },
  { id: 'prd_93', name: 'Toalla Nova 3 unid', code: 'ASE005', price: 3890, stock: 8, format: 'pack', familyId: 'fam_aseo' },
  { id: 'prd_94', name: 'Desinfectante Pinol 1L', code: 'ASE006', price: 1950, stock: 12, format: 'unit', familyId: 'fam_aseo' },
  { id: 'prd_95', name: 'Limpiavidrios 500ml', code: 'ASE007', price: 2150, stock: 10, format: 'unit', familyId: 'fam_aseo' },
  { id: 'prd_96', name: 'Esponja de cocina 5 unid', code: 'ASE008', price: 1250, stock: 14, format: 'pack', familyId: 'fam_aseo' },
  { id: 'prd_97', name: 'Bolsas de basura 30L 10 unid', code: 'ASE009', price: 2990, stock: 12, format: 'pack', familyId: 'fam_aseo' },
  { id: 'prd_98', name: 'Jabón líquido manos 300ml', code: 'ASE010', price: 2350, stock: 10, format: 'unit', familyId: 'fam_aseo' },
  { id: 'prd_99', name: 'Shampoo Pantene 400ml', code: 'ASE011', price: 5990, stock: 6, format: 'unit', familyId: 'fam_aseo' },
  { id: 'prd_100', name: 'Desodorante Rexona spray 150ml', code: 'ASE012', price: 4490, stock: 8, format: 'unit', familyId: 'fam_aseo' },
];

export function buildFamilies(overrides?: Partial<Family>[]): Family[] {
  return seedFamilies.map((f, i) => ({
    id: f.id,
    name: f.name,
    createdAt: now,
    updatedAt: now,
    ...(overrides?.[i] ?? {}),
  }));
}

export function buildProducts(families: Family[], overrides?: Partial<Product>[]): Product[] {
  return seedProducts.map((p, i) => ({
    id: p.id,
    name: p.name,
    code: p.code,
    price: p.price,
    stock: p.stock,
    format: p.format,
    photoUri: undefined,
    familyId: p.familyId,
    createdAt: now,
    updatedAt: now,
    ...(overrides?.[i] ?? {}),
  }));
}
