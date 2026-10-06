/**
 * Seed the official MondoCoffee menu (categories + items) into the connected
 * DATABASE_URL.
 *
 * Safe to run repeatedly: categories/items are matched by their natural keys
 * (restaurant + name / category + name) and updated in place, so re-running
 * never creates duplicates. Existing orders are not touched.
 *
 * Run: npm run db:seed:mondo   (from the repo root: npm run db:seed:mondo)
 * or:  npx tsx scripts/seed-mondo-menu.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const RESTAURANT_SLUG = "MondoCoffee";

type SeedItem = {
  name: string;
  price: number;
  description?: string;
};

type SeedCategory = {
  name: string;
  items: SeedItem[];
};

const MENU: SeedCategory[] = [
  {
    name: "Desserts",
    items: [
      { name: "Lotus Pancakes", price: 1150, description: "Served with lotus sauce" },
      { name: "Original Pancakes", price: 800, description: "Served with butter and maple syrup" },
      { name: "Fluffy Pancakes", price: 950, description: "Served with nutella sauce" },
      { name: "French Toast", price: 1050, description: "Served with nutella sauce" },
      { name: "Chocolate Brownie", price: 550, description: "Served with ice cream" },
      {
        name: "Churros with Hot Chocolate",
        price: 750,
        description: "Golden, crispy, deep-fried pastry dusted with cinnamon sugar",
      },
      {
        name: "Burnt Peach Cheese Cake",
        price: 750,
        description: "Decadent burnt cheese cake served with caramelized sauce",
      },
      { name: "Chocolate Cookie", price: 450, description: "Served with coffee ice cream" },
      { name: "Double Chocolate Cookie", price: 550, description: "Served with coffee ice cream" },
      { name: "Lava Cake", price: 1150, description: "Served with ice cream" },
    ],
  },
  {
    name: "Waffles",
    items: [
      {
        name: "Seasonal Waffle",
        price: 1090,
        description: "Light, crisp, and fluffy batter-based dish with fruits",
      },
      {
        name: "Nutella Waffle",
        price: 1190,
        description: "Light, crisp, and fluffy batter-based dish with nutella",
      },
      {
        name: "Lotus Waffle",
        price: 1290,
        description: "Light, crisp, and fluffy batter-based dish with lotus",
      },
    ],
  },
  {
    name: "Bakery",
    items: [
      { name: "New York Cheese Cake", price: 690 },
      { name: "Blueberry Muffin", price: 550 },
      { name: "Chocolate Chip Muffin", price: 550 },
      { name: "Nutella Banana Bread", price: 450 },
      { name: "Chocolate Malt Cake", price: 590 },
      { name: "Chocolate Tart", price: 850 },
      { name: "Lemon Tart", price: 850 },
      { name: "Lindt Macaron", price: 350 },
    ],
  },
  {
    name: "Frappé",
    items: [
      { name: "Italian Vanilla Frappe", price: 800 },
      { name: "Caramel Popcorn Frappe", price: 850 },
      { name: "Ferrero Frappe", price: 850 },
      { name: "White Chocolate Frappe", price: 850 },
      { name: "Pistachio Frappe", price: 980 },
      { name: "Bounty Frappe", price: 830 },
      { name: "Lotus Frappe", price: 950 },
      { name: "Strawberry Cheesecake Frappe", price: 730 },
      { name: "Blueberry Cheesecake Frappe", price: 730 },
    ],
  },
  {
    name: "Matcha",
    items: [
      { name: "Spanish Matcha", price: 710 },
      { name: "French Vanilla Matcha", price: 780 },
      { name: "Strawberry Matcha Bliss", price: 830 },
      { name: "Matcha Blueberry Dream", price: 880 },
      { name: "Lavender Heaven Matcha", price: 820 },
    ],
  },
  {
    name: "Green Teas",
    items: [
      { name: "Moroccan Mint", price: 580 },
      { name: "Jasmine Pearl", price: 580 },
      { name: "Ginger Mint", price: 580 },
      { name: "Chamomile Lavender", price: 580 },
      { name: "Ginseng Peppermint", price: 580 },
      { name: "Lemon & Honey", price: 580 },
    ],
  },
  {
    name: "Iced Tea",
    items: [
      { name: "Iced Peach Tea", price: 530 },
      { name: "Passionfruit Tea", price: 530 },
      { name: "Strawberry Tea", price: 530 },
    ],
  },
  {
    name: "Extras",
    items: [
      { name: "Espresso", price: 200 },
      { name: "Syrup", price: 100 },
      { name: "Whipped Cream", price: 100 },
      { name: "Water", price: 90 },
    ],
  },
  {
    name: "Mojito",
    items: [
      { name: "Strawberry Mojito", price: 680 },
      { name: "Sunrise Mojito", price: 680 },
      { name: "Blackberry Mojito", price: 680 },
    ],
  },
  {
    name: "Hot",
    items: [
      { name: "Americano", price: 450 },
      { name: "Hot Chocolate", price: 550 },
      { name: "Cafe Latte", price: 520 },
      { name: "Cappuccino", price: 520 },
      { name: "Cortado", price: 530 },
      { name: "Spanish Latte", price: 580 },
      { name: "Italian Vanilla Latte", price: 630 },
      { name: "Salted Caramel Latte", price: 630 },
      { name: "Coconut Dream Latte", price: 650 },
      { name: "Cinnamon Dolce Latte", price: 650 },
      { name: "Honey Almond Latte", price: 650 },
      { name: "Lavender Latte", price: 620 },
      { name: "White Chocolate Latte", price: 650 },
      { name: "Pistachio Latte", price: 800 },
    ],
  },
  {
    name: "Iced",
    items: [
      { name: "Iced Americano", price: 510 },
      { name: "Iced Spanish Latte", price: 680 },
      { name: "Iced Vanilla Latte", price: 730 },
      { name: "Iced Salted Caramel Latte", price: 760 },
      { name: "Iced Coconut Dream Latte", price: 760 },
      { name: "Iced Cinnamon Dolce Latte", price: 760 },
      { name: "Iced Honey Almond Latte", price: 760 },
      { name: "Iced Lavender Latte", price: 730 },
      { name: "Iced White Chocolate Latte", price: 760 },
      { name: "Iced Pistachio Latte", price: 930 },
      { name: "Iced Hazelnut Latte", price: 900 },
      { name: "Iced Tiramisu Latte", price: 850 },
    ],
  },
  {
    name: "V60",
    items: [
      { name: "V60 Costa Rica - Hot", price: 730 },
      { name: "V60 Costa Rica - Cold", price: 780 },
      { name: "Costa Rica Spiked - Cold", price: 850 },
    ],
  },
  {
    name: "Breakfast",
    items: [
      {
        name: "Cheese Mushroom Omelette",
        price: 1290,
        description:
          "Savory dish made with eggs, sautéed mushrooms, and melted cheese served with bread slice, hash brown, jam, honey and butter",
      },
      {
        name: "Stuffed Cheese Chicken Omelette",
        price: 1450,
        description:
          "Fluffy omelette filled with tender chicken and cheese, topped with rich and creamy benedict sauce. Served with roasted potatoes, roasted tomatoes, kidney beans and sausages",
      },
      {
        name: "Fluffy Scrambled Egg With Salmon",
        price: 1540,
        description:
          "Creamy scrambled eggs paired with tender and flavorful salmon. Served with roasted potatoes and roasted tomatoes (choice of brown or white bread)",
      },
      {
        name: "Mexican Omelette",
        price: 1390,
        description:
          "Savory dish made with eggs, sautéed mushrooms, and melted cheese served with bread slice, hash brown, jam, honey and butter",
      },
      {
        name: "Egg Benedict With Crispy Chicken",
        price: 1490,
        description:
          "Served with hollandaise sauce served with roasted potatoes, roasted tomatoes, sausages, caesar dressing and croissant on the side",
      },
      {
        name: "Pakistani Omelette",
        price: 1190,
        description:
          "Pakistani omelette stuffed with onions, tomatoes, green chilies & coriander.",
      },
      {
        name: "Avocado Toastie Bread",
        price: 1090,
        description:
          "Creamy mashed avocado spread over crispy toast, topped with a sprinkle of salt, and a drizzle of olive oil.",
      },
      {
        name: "Cheesy Sunrise Croissant",
        price: 1290,
        description: "Stuffed with fluffy scrambled eggs and grilled chicken served with fries",
      },
    ],
  },
  {
    name: "Pasta",
    items: [
      {
        name: "Fettuccine Alfredo Pasta",
        price: 1590,
        description:
          "Fettuccine noodles coated in a rich sauce of butter, cream, and parmesan cheese. Served with garlic bread.",
      },
      {
        name: "Meaty Stuffed Pasta",
        price: 1690,
        description:
          "Spaghetti smothered in rich, tangy red sauce mixed with minced beef. Served with garlic bread.",
      },
      {
        name: "Tornado Pasta",
        price: 1590,
        description:
          "Chicken breasts stuffed with a flavorful filling, paired with creamy fettuccine pasta and topped with a rich, savory red sauce. Served with garlic bread.",
      },
      {
        name: "Country Chicken Parmesan Pasta",
        price: 1690,
        description:
          "Fettuccine pasta coated in a creamy parmesan sauce with crispy, golden-brown chicken coated in a flavorful parmesan crust. Served with garlic bread.",
      },
    ],
  },
  {
    name: "Sandwich",
    items: [
      {
        name: "New York Club Sandwich",
        price: 1590,
        description:
          "A hearty New York-style club sandwich featuring layers of tender chicken, savory beef, creamy gouda cheese. Together with a flavorful herb mayo",
      },
      {
        name: "Mondo Special Sandwich",
        price: 1790,
        description:
          "A hearty sourdough sandwich filled with tender grilled chicken and drizzled with a sweet and tangy honey mustard sauce",
      },
      {
        name: "Beef Chimichurri Sandwich",
        price: 1890,
        description:
          "Succulent beef slices marinated in zesty chimichurri sauce, nestled between soft focaccia bread and complemented by sweet caramelized onions",
      },
      {
        name: "Chicken Mushroom Wrap",
        price: 1290,
        description:
          "Crispy chicken and fluffy scrambled eggs, all enveloped in a rich, buttery sauce",
      },
      {
        name: "Croissant Grilled Chicken Sandwich",
        price: 1480,
        description:
          "A flaky, buttery croissant envelops tender grilled chicken, complemented by a tangy honey mustard sauce.",
      },
      {
        name: "Cheesy Croissant Sandwich",
        price: 1290,
        description:
          "A succulent chicken breast stuffed with melted cheese, nestled inside a flaky croissant, and drizzled with spicy habanero sauce",
      },
      {
        name: "Chicken Parmesan Panini",
        price: 1590,
        description: "Stuffed with crispy parmesan chicken and cheese served with french fries",
      },
    ],
  },
  {
    name: "Croissant",
    items: [
      { name: "Butter Croissant", price: 480 },
      { name: "Almond Croissant", price: 620 },
      { name: "Nutella Croissant", price: 550 },
      { name: "Strawberry Croissant", price: 580 },
      { name: "Lotus Croissant", price: 580 },
    ],
  },
];

async function main() {
  console.log("Seeding MondoCoffee menu...");

  let restaurant = await prisma.restaurant.findUnique({ where: { slug: RESTAURANT_SLUG } });
  if (!restaurant) {
    restaurant = await prisma.restaurant.create({
      data: { name: "MondoCoffee", slug: RESTAURANT_SLUG },
    });
    console.log("Created restaurant:", restaurant.slug);
  }

  let categoryCount = 0;
  let itemCount = 0;

  for (let categoryIndex = 0; categoryIndex < MENU.length; categoryIndex++) {
    const seedCategory = MENU[categoryIndex];

    // Match by natural key (restaurant + name) so re-runs update instead of duplicate.
    const existingCategory = await prisma.menuCategory.findFirst({
      where: { restaurantId: restaurant.id, name: seedCategory.name },
      select: { id: true },
    });

    const category = existingCategory
      ? await prisma.menuCategory.update({
          where: { id: existingCategory.id },
          data: { sortOrder: categoryIndex },
        })
      : await prisma.menuCategory.create({
          data: {
            restaurantId: restaurant.id,
            name: seedCategory.name,
            sortOrder: categoryIndex,
          },
        });
    categoryCount++;

    for (let itemIndex = 0; itemIndex < seedCategory.items.length; itemIndex++) {
      const seedItem = seedCategory.items[itemIndex];
      const description = seedItem.description?.trim() ? seedItem.description : null;

      const existingItem = await prisma.menuItem.findFirst({
        where: { categoryId: category.id, name: seedItem.name },
        select: { id: true },
      });

      if (existingItem) {
        await prisma.menuItem.update({
          where: { id: existingItem.id },
          data: {
            restaurantId: restaurant.id,
            description,
            price: seedItem.price,
            sortOrder: itemIndex,
            available: true,
          },
        });
      } else {
        await prisma.menuItem.create({
          data: {
            restaurantId: restaurant.id,
            categoryId: category.id,
            name: seedItem.name,
            description,
            price: seedItem.price,
            sortOrder: itemIndex,
            available: true,
          },
        });
      }
      itemCount++;
    }

    // Remove items that are no longer part of this category in the seed.
    const seededItemNames = seedCategory.items.map((item) => item.name);
    const removedItems = await prisma.menuItem.deleteMany({
      where: { categoryId: category.id, name: { notIn: seededItemNames } },
    });
    if (removedItems.count > 0) {
      console.log(`  Removed ${removedItems.count} stale item(s) from ${seedCategory.name}`);
    }
  }

  // Remove categories that are no longer part of the official menu.
  const seededCategoryNames = MENU.map((category) => category.name);
  const removedCategories = await prisma.menuCategory.deleteMany({
    where: { restaurantId: restaurant.id, name: { notIn: seededCategoryNames } },
  });
  if (removedCategories.count > 0) {
    console.log(`Removed ${removedCategories.count} stale categor(ies).`);
  }

  console.log(`Seeded ${categoryCount} categories, ${itemCount} items.`);
}

main()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error
        ? error.message.replace(/postgres(?:ql)?:\/\/\S+/gi, "[database URL redacted]")
        : error
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
