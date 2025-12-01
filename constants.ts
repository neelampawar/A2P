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
    image: 'https://cdn.pixabay.com/photo/2016/11/18/17/46/tomato-1835192_400.jpg',
    description: 'Fresh and juicy hybrid tomatoes.'
  },
  {
    id: '2',
    name: 'Red Onion',
    price: 45,
    originalPrice: 60,
    weight: '1kg',
    category: Category.VEGETABLES,
    image: 'https://cdn.pixabay.com/photo/2018/05/23/22/39/onion-3428179_400.jpg',
    description: 'High quality red onions.'
  },
  {
    id: '3',
    name: 'Potato (New Crop)',
    price: 32,
    originalPrice: 40,
    weight: '1kg',
    category: Category.VEGETABLES,
    image: 'https://cdn.pixabay.com/photo/2018/08/28/12/41/potato-3637521_400.jpg',
    description: 'Fresh new crop potatoes.'
  },
  // Dairy
  {
    id: '4',
    name: 'Amul Taaza Milk',
    price: 27,
    weight: '500ml',
    category: Category.DAIRY,
    image: 'https://cdn.pixabay.com/photo/2017/07/16/10/43/milk-2508667_400.jpg',
    description: 'Pasteurized toned milk.'
  },
  {
    id: '5',
    name: 'Brown Bread',
    price: 50,
    weight: '400g',
    category: Category.DAIRY,
    image: 'https://cdn.pixabay.com/photo/2016/03/27/18/10/bread-1284438_400.jpg',
    description: 'Whole wheat brown bread.'
  },
  {
    id: '6',
    name: 'Salted Butter',
    price: 58,
    weight: '100g',
    category: Category.DAIRY,
    image: 'https://cdn.pixabay.com/photo/2017/01/10/19/36/butter-1970514_400.jpg',
    description: 'Delicious salted butter.'
  },
  // Snacks
  {
    id: '7',
    name: 'Lays India\'s Magic Masala',
    price: 20,
    weight: '50g',
    category: Category.SNACKS,
    image: 'https://cdn.pixabay.com/photo/2015/04/19/08/32/chips-728639_400.jpg',
    description: 'Spicy masala potato chips.'
  },
  {
    id: '8',
    name: 'Doritos Cheese',
    price: 50,
    weight: '100g',
    category: Category.SNACKS,
    image: 'https://cdn.pixabay.com/photo/2015/04/19/08/33/chips-728640_400.jpg',
    description: 'Nacho cheese tortilla chips.'
  },
  // Drinks
  {
    id: '9',
    name: 'Coca Cola',
    price: 40,
    weight: '750ml',
    category: Category.DRINKS,
    image: 'https://cdn.pixabay.com/photo/2016/03/09/09/55/coca-cola-1245675_400.jpg',
    description: 'Refreshing carbonated soft drink.'
  },
  {
    id: '10',
    name: 'Real Mixed Fruit Juice',
    price: 110,
    weight: '1L',
    category: Category.DRINKS,
    image: 'https://cdn.pixabay.com/photo/2016/11/22/19/52/juice-1851348_400.jpg',
    description: 'Mixed fruit juice with no added preservatives.'
  },
  // Instant
  {
    id: '11',
    name: 'Maggi 2-Minute Noodles',
    price: 14,
    weight: '70g',
    category: Category.INSTANT,
    image: 'https://cdn.pixabay.com/photo/2017/01/31/13/57/instant-noodles-2024285_400.jpg',
    description: 'Classic masala noodles.'
  },
  {
    id: '12',
    name: 'Kissan Ketchup',
    price: 120,
    weight: '900g',
    category: Category.INSTANT,
    image: 'https://cdn.pixabay.com/photo/2016/03/09/10/01/ketchup-1245678_400.jpg',
    description: 'Fresh tomato ketchup.'
  }
];

export const CATEGORIES = Object.values(Category);
