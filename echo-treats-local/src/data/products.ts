import cake1 from "@/assets/product-cake-1.jpg";
import cake2 from "@/assets/product-cake-2.jpg";
import cake3 from "@/assets/product-cake-3.jpg";
import cupcake1 from "@/assets/product-cupcake-1.jpg";
import cupcake2 from "@/assets/product-cupcake-2.jpg";
import cookies1 from "@/assets/product-cookies-1.jpg";
import chocolate1 from "@/assets/product-chocolate-1.jpg";
import cheesecake1 from "@/assets/product-cheesecake-1.jpg";
import tub1 from "@/assets/product-tub-1.jpg";
import custom1 from "@/assets/product-custom-1.jpg";
import type { Product } from "@/components/ProductCard";

export const cakeProducts: Product[] = [
  { id: "c1", name: "Chocolate Berry Layer Cake", description: "Rich chocolate sponge with fresh berries", price: "From ₹1,200", image: cake1, tags: ["Best Seller"] },
  { id: "c2", name: "Strawberry Dream Cake", description: "Vanilla cream with fresh strawberries", price: "From ₹1,100", image: cake2, tags: ["New"] },
  { id: "c3", name: "Floral Buttercream Cake", description: "Hand-piped sugar flowers", price: "From ₹1,500", image: cake3, tags: ["Customise"] },
  { id: "c4", name: "Bespoke Wedding Cake", description: "Multi-tier custom celebration cake", price: "From ₹4,500", image: custom1, tags: ["Customise", "Festive"] },
];

export const cupcakeProducts: Product[] = [
  { id: "cp1", name: "Rose Petal Cupcakes", description: "Pink buttercream with edible flowers", price: "From ₹150", image: cupcake1, tags: ["Best Seller"] },
  { id: "cp2", name: "Gold Dust Celebration Box", description: "6 premium cupcakes with gold accents", price: "From ₹899", image: cupcake2, tags: ["Limited"] },
  { id: "cp3", name: "Classic Vanilla Cupcakes", description: "Light vanilla sponge, swirl frosting", price: "From ₹120", image: cupcake1, tags: ["Customise"] },
  { id: "cp4", name: "Themed Party Cupcakes", description: "Custom themed designs for events", price: "From ₹180", image: cupcake2, tags: ["Customise"] },
];

export const cookieProducts: Product[] = [
  { id: "bk1", name: "Chunky Chocolate Chip Cookies", description: "Loaded with Belgian chocolate chips", price: "From ₹350", image: cookies1, tags: ["Best Seller"] },
  { id: "bk2", name: "Premium Butter Cookie Box", description: "Assorted butter cookies gift set", price: "From ₹499", image: cookies1, tags: ["Festive"] },
  { id: "bk3", name: "Tea-Time Biscuit Tin", description: "Classic biscuits for every occasion", price: "From ₹399", image: cookies1, tags: ["New"] },
  { id: "bk4", name: "Filled Cookie Collection", description: "Cream & jam filled artisan cookies", price: "From ₹450", image: cookies1, tags: ["Limited"] },
];

export const chocolateProducts: Product[] = [
  { id: "ch1", name: "Handcrafted Truffle Box", description: "Assorted luxury truffles", price: "From ₹750", image: chocolate1, tags: ["Best Seller"] },
  { id: "ch2", name: "Festive Chocolate Gift Pack", description: "Curated festive chocolate selection", price: "From ₹999", image: chocolate1, tags: ["Festive"] },
  { id: "ch3", name: "Dark Chocolate Bonbons", description: "Single origin dark chocolate bites", price: "From ₹599", image: chocolate1, tags: ["New"] },
  { id: "ch4", name: "Custom Gift Box", description: "Build your own chocolate box", price: "From ₹850", image: chocolate1, tags: ["Customise"] },
];

export const cheesecakeProducts: Product[] = [
  { id: "cs1", name: "Berry Bliss Cheesecake", description: "Creamy cheesecake with mixed berry compote", price: "From ₹600", image: cheesecake1, tags: ["Best Seller"] },
  { id: "cs2", name: "Mini Cheesecake Tub", description: "Individual cheesecake in a jar", price: "From ₹250", image: cheesecake1, tags: ["New"] },
  { id: "cs3", name: "Baked NY Cheesecake", description: "Classic New York style baked", price: "From ₹800", image: cheesecake1, tags: ["Customise"] },
  { id: "cs4", name: "Sliced Cheesecake Box", description: "4 assorted cheesecake slices", price: "From ₹700", image: cheesecake1, tags: ["Festive"] },
];

export const tubProducts: Product[] = [
  { id: "t1", name: "Oreo Mousse Jar", description: "Layered chocolate mousse with cookie crumble", price: "From ₹220", image: tub1, tags: ["Best Seller"] },
  { id: "t2", name: "Tiramisu Tub", description: "Classic tiramisu layered in a jar", price: "From ₹280", image: tub1, tags: ["New"] },
  { id: "t3", name: "Pudding Jar Collection", description: "Assorted pudding jars set of 4", price: "From ₹750", image: tub1, tags: ["Festive"] },
  { id: "t4", name: "Lotus Biscoff Jar", description: "Caramel cream with biscoff crumble", price: "From ₹250", image: tub1, tags: ["Limited"] },
];
