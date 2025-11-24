import { Category, Product } from './types';

export const MOCK_PRODUCTS: Product[] = [
  // Vegetables
  {
    id: '1',
    name: 'Fresh Tomato Hybrid',
    price: 38,
    originalPrice: 50,
    weight: '500g',
    category: Category.VEGETABLES,
    image: 'https://picsum.photos/200/200?random=1',
    description: 'Fresh and juicy hybrid tomatoes.'
  },
  {
    id: '2',
    name: 'Red Onion',
    price: 45,
    originalPrice: 60,
    weight: '1kg',
    category: Category.VEGETABLES,
    image: 'https://picsum.photos/200/200?random=2',
    description: 'High quality red onions.'
  },
  {
    id: '3',
    name: 'Potato (New Crop)',
    price: 32,
    originalPrice: 40,
    weight: '1kg',
    category: Category.VEGETABLES,
    image: 'https://picsum.photos/200/200?random=3',
    description: 'Fresh new crop potatoes.'
  },
  // Dairy
  {
    id: '4',
    name: 'Amul Taaza Milk',
    price: 27,
    weight: '500ml',
    category: Category.DAIRY,
    image: 'https://picsum.photos/200/200?random=4',
    description: 'Pasteurized toned milk.'
  },
  {
    id: '5',
    name: 'Brown Bread',
    price: 50,
    weight: '400g',
    category: Category.DAIRY,
    image: 'https://picsum.photos/200/200?random=5',
    description: 'Whole wheat brown bread.'
  },
  {
    id: '6',
    name: 'Salted Butter',
    price: 58,
    weight: '100g',
    category: Category.DAIRY,
    image: 'https://picsum.photos/200/200?random=6',
    description: 'Delicious salted butter.'
  },
  // Snacks
  {
    id: '7',
    name: 'Lays India\'s Magic Masala',
    price: 20,
    weight: '50g',
    category: Category.SNACKS,
    image: 'https://picsum.photos/200/200?random=7',
    description: 'Spicy masala potato chips.'
  },
  {
    id: '8',
    name: 'Doritos Cheese',
    price: 50,
    weight: '100g',
    category: Category.SNACKS,
    image: 'https://picsum.photos/200/200?random=8',
    description: 'Nacho cheese tortilla chips.'
  },
  // Drinks
  {
    id: '9',
    name: 'Coca Cola',
    price: 40,
    weight: '750ml',
    category: Category.DRINKS,
    image: 'https://picsum.photos/200/200?random=9',
    description: 'Refreshing carbonated soft drink.'
  },
  {
    id: '10',
    name: 'Real Mixed Fruit Juice',
    price: 110,
    weight: '1L',
    category: Category.DRINKS,
    image: 'https://picsum.photos/200/200?random=10',
    description: 'Mixed fruit juice with no added preservatives.'
  },
  // Instant
  {
    id: '11',
    name: 'Maggi 2-Minute Noodles',
    price: 14,
    weight: '70g',
    category: Category.INSTANT,
    image: 'https://picsum.photos/200/200?random=11',
    description: 'Classic masala noodles.'
  },
  {
    id: '12',
    name: 'Kissan Ketchup',
    price: 120,
    weight: '900g',
    category: Category.INSTANT,
    image: 'https://picsum.photos/200/200?random=12',
    description: 'Fresh tomato ketchup.'
  }
];

export const CATEGORIES = Object.values(Category);
