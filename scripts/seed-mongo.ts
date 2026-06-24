import { config } from "dotenv";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "Metavision2026!";

async function main() {
  const { connectDb } = await import("../src/lib/mongodb");
  const {
    UserModel,
    RestaurantModel,
    MenuItemModel,
    OrderModel,
    CustomerModel,
    InventoryModel,
    ReservationModel,
    NotificationModel,
    TableModel,
    StaffModel,
    SubscriptionModel,
    AdminClientModel,
    PlatformMetricModel,
    CompetitorRestaurantModel,
    CompetitorMenuItemModel,
    MarketTrendModel,
    SiteContentModel,
  } = await import("../src/lib/models");
  const { toJsonString } = await import("../src/lib/db/json-fields");

  await connectDb();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  let demoUser = await UserModel.findOneAndUpdate(
    { phone: "994501112223" },
    {
      $setOnInsert: {
        firstName: "Rəşad",
        lastName: "Əliyev",
        phone: "994501112223",
        email: "demo@metavision.az",
        password: passwordHash,
        role: "USER",
      },
    },
    { upsert: true, new: true },
  );

  let restaurant = await RestaurantModel.findOneAndUpdate(
    { userId: demoUser._id },
    {
      $setOnInsert: {
        userId: demoUser._id,
        name: "Metavision Tasting Room",
        address: "28 May küçəsi 15, Bakı",
        city: "Baku",
        openingHours: "10:00 – 23:00",
        phone: "+994 12 555 01 01",
        email: "info@metavision-restaurant.az",
        currency: "AZN",
        cuisine: toJsonString(["Azerbaijani", "Fusion", "European"]),
        paymentMethods: toJsonString(["card", "cash", "apple_pay"]),
      },
    },
    { upsert: true, new: true },
  );

  await OrderModel.deleteMany({ userId: demoUser._id });
  await MenuItemModel.deleteMany({ restaurantId: restaurant._id });

  const menuData = [
    { name: "Plov", category: "mains", description: "Ənənəvi azərbaycan plovu", price: 18.5, tags: toJsonString(["popular", "halal"]), featured: true, order: 1 },
    { name: "Dolma", category: "mains", description: "Yarpaq dolması", price: 14.0, tags: toJsonString(["traditional"]), order: 2 },
    { name: "Qutab", category: "appetizers", description: "Göyərti qutab", price: 6.5, tags: toJsonString(["vegetarian"]), order: 3 },
    { name: "Lülə kabab", category: "mains", description: "Təndir lülə", price: 22.0, tags: toJsonString(["grill"]), featured: true, order: 4 },
    { name: "Paxlava", category: "desserts", description: "Şəki paxlavası", price: 8.0, tags: toJsonString(["sweet"]), order: 5 },
  ];

  const menuItems = await MenuItemModel.insertMany(
    menuData.map((m) => ({ ...m, restaurantId: restaurant._id })),
  );

  const plov = menuItems.find((m) => m.name === "Plov")!;
  const dolma = menuItems.find((m) => m.name === "Dolma")!;

  await OrderModel.insertMany([
    {
      userId: demoUser._id,
      orderNumber: "#1042",
      status: "COMPLETED",
      total: 23.58,
      currency: "AZN",
      paymentMethod: "card",
      items: [{ menuItemId: plov._id, quantity: 1, price: 18.5 }],
    },
    {
      userId: demoUser._id,
      orderNumber: "#1041",
      status: "PENDING",
      total: 12.4,
      currency: "AZN",
      paymentMethod: "cash",
      items: [{ menuItemId: dolma._id, quantity: 1, price: 14.0 }],
    },
    {
      userId: demoUser._id,
      orderNumber: "#1040",
      status: "COMPLETED",
      total: 45.0,
      currency: "USD",
      paymentMethod: "card",
      items: [{ menuItemId: plov._id, quantity: 2, price: 22.5 }],
    },
    {
      userId: demoUser._id,
      orderNumber: "#1039",
      status: "COMPLETED",
      total: 28.0,
      currency: "EUR",
      paymentMethod: "apple_pay",
      items: [{ menuItemId: dolma._id, quantity: 2, price: 14.0 }],
    },
    {
      userId: demoUser._id,
      orderNumber: "#1038",
      status: "PREPARING",
      total: 9.5,
      currency: "AZN",
      paymentMethod: "qr",
      items: [{ menuItemId: menuItems[2]._id, quantity: 1, price: 6.5 }],
    },
  ]);

  await CustomerModel.deleteMany({ restaurantId: restaurant._id });
  await CustomerModel.insertMany([
    { restaurantId: restaurant._id, name: "Rəşad Əliyev", phone: "994501112223", visits: 15, totalSpent: 450.5, lastVisit: new Date("2024-06-20") },
    { restaurantId: restaurant._id, name: "Ayşə Məmmədova", phone: "994553344556", visits: 8, totalSpent: 280, lastVisit: new Date("2024-06-18") },
    { restaurantId: restaurant._id, name: "Tural Həsənov", phone: "994707788990", visits: 3, totalSpent: 95, lastVisit: new Date("2024-06-15") },
  ]);

  await InventoryModel.deleteMany({ restaurantId: restaurant._id });
  await InventoryModel.insertMany([
    { restaurantId: restaurant._id, name: "Tomatoes", category: "Vegetables", quantity: 25, unit: "kg", minQuantity: 10, costPerUnit: 2.5, status: "IN_STOCK" },
    { restaurantId: restaurant._id, name: "Lamb", category: "Meat", quantity: 8, unit: "kg", minQuantity: 15, costPerUnit: 18, status: "LOW_STOCK" },
    { restaurantId: restaurant._id, name: "Rice", category: "Grains", quantity: 40, unit: "kg", minQuantity: 20, costPerUnit: 3.2, status: "IN_STOCK" },
  ]);

  await ReservationModel.deleteMany({ restaurantId: restaurant._id });
  await NotificationModel.deleteMany({ userId: demoUser._id });
  await ReservationModel.insertMany([
    { userId: demoUser._id, restaurantId: restaurant._id, name: "Ali Hasanov", phone: "050 123 23 32", date: new Date("2026-06-21"), time: "22:00", partySize: 2, status: "CONFIRMED" },
    { userId: demoUser._id, restaurantId: restaurant._id, name: "Nigar Qasimli", phone: "055 680 89 84", date: new Date("2026-06-18"), time: "18:53", partySize: 4, status: "CONFIRMED" },
  ]);

  const competitors = [
    { slug: "sumakh", name: "Sumakh Restaurant", address: "Kiçik Qala 5", district: "İçərişəhər", cuisine: ["Azerbaijani"], rating: 4.6, reviewCount: 1240, priceRange: "MID", menu: [{ name: "Plov", category: "mains", price: 16, isPopular: true }] },
    { slug: "chayki", name: "Çayki", address: "Fountain Square", district: "Nizami", cuisine: ["Caucasian"], rating: 4.4, reviewCount: 890, priceRange: "BUDGET", menu: [{ name: "Plov", category: "mains", price: 12, isPopular: true }] },
    { slug: "mangal-steak", name: "Mangal Steak House", address: "Port Baku Mall", district: "White City", cuisine: ["Steakhouse"], rating: 4.7, reviewCount: 2100, priceRange: "PREMIUM", menu: [{ name: "Ribeye", category: "mains", price: 65, isPopular: true }] },
    { slug: "firuze", name: "Firuze Restaurant", address: "İçərişəhər", district: "İçərişəhər", cuisine: ["Azerbaijani"], rating: 4.5, reviewCount: 1560, priceRange: "MID", menu: [{ name: "Firuze plovu", category: "mains", price: 19, isPopular: true }] },
    { slug: "mari-vanna", name: "Mari Vanna", address: "Səməd Vurğun", district: "Nizami", cuisine: ["Russian"], rating: 4.3, reviewCount: 780, priceRange: "PREMIUM", menu: [{ name: "Borscht", category: "soups", price: 15 }] },
    { slug: "telegraph", name: "Teleqraf Küçə", address: "İlyas Əfəndiyev", district: "Yasamal", cuisine: ["European"], rating: 4.2, reviewCount: 650, priceRange: "MID", menu: [{ name: "Burger", category: "mains", price: 21 }] },
  ];

  for (const comp of competitors) {
    const { menu, cuisine, ...rest } = comp;
    const record = await CompetitorRestaurantModel.findOneAndUpdate(
      { slug: comp.slug },
      {
        $set: {
          ...rest,
          city: "Baku",
          currency: "AZN",
          cuisine: toJsonString(cuisine),
          advantages: toJsonString(["Yerli mətbəx"]),
          weaknesses: toJsonString(["Pik saat yüklənməsi"]),
          isActive: true,
        },
      },
      { upsert: true, new: true },
    );
    await CompetitorMenuItemModel.deleteMany({ competitorId: record._id });
    await CompetitorMenuItemModel.insertMany(
      menu.map((m) => ({ competitorId: record._id, ...m, currency: "AZN" })),
    );
  }

  await MarketTrendModel.deleteMany({ city: "Baku" });
  await MarketTrendModel.insertMany([
    { city: "Baku", region: "Absheron", cuisine: "Azerbaijani", momentum: 82, demandChange: 12, confidence: 88, avgDishPriceAzn: 18.5 },
    { city: "Baku", region: "Absheron", cuisine: "Steakhouse", momentum: 74, demandChange: 8, confidence: 85, avgDishPriceAzn: 45 },
    { city: "Baku", region: "Absheron", cuisine: "Fusion", momentum: 68, demandChange: 15, confidence: 79, avgDishPriceAzn: 28 },
    { city: "Baku", region: "Absheron", cuisine: "Fast casual", momentum: 61, demandChange: -3, confidence: 72, avgDishPriceAzn: 12 },
    { city: "Baku", region: "Absheron", cuisine: "Seafood", momentum: 70, demandChange: 6, confidence: 81, avgDishPriceAzn: 35 },
    { city: "Baku", region: "CIS", cuisine: "Spicy Noodles", momentum: 85, demandChange: 16, confidence: 89, avgDishPriceAzn: 14 },
    { city: "Ganja", region: "Ganja", cuisine: "Kebab", momentum: 71, demandChange: 9, confidence: 80, avgDishPriceAzn: 12 },
    { city: "Ganja", region: "Ganja", cuisine: "Azerbaijani", momentum: 68, demandChange: 5, confidence: 78, avgDishPriceAzn: 14 },
    { city: "Sumgayit", region: "Sumgayit", cuisine: "Fast casual", momentum: 58, demandChange: 2, confidence: 74, avgDishPriceAzn: 10 },
    { city: "Sumgayit", region: "Sumgayit", cuisine: "Pizza", momentum: 62, demandChange: 7, confidence: 76, avgDishPriceAzn: 11 },
  ]);

  const regionalCompetitors = [
    { slug: "ganja-kebab", name: "Gəncə Kabab Evi", address: "Atatürk pr.", district: "Mərkəz", city: "Ganja", cuisine: ["Kebab"], rating: 4.5, reviewCount: 420, priceRange: "BUDGET", menu: [{ name: "Lülə kabab", category: "mains", price: 11, isPopular: true }] },
    { slug: "ganja-garden", name: "Garden Restaurant", address: "Heydər Əliyev", district: "Ganja", city: "Ganja", cuisine: ["Azerbaijani"], rating: 4.3, reviewCount: 310, priceRange: "MID", menu: [{ name: "Dolma", category: "mains", price: 13 }] },
    { slug: "sumgait-pizza", name: "Sumqayıt Pizza", address: "Koroglu", district: "Sumgayit", city: "Sumgayit", cuisine: ["Pizza"], rating: 4.1, reviewCount: 280, priceRange: "BUDGET", menu: [{ name: "Marqarita", category: "mains", price: 9 }] },
    { slug: "sumgait-deniz", name: "Dəniz Restaurant", address: "Sahil", district: "Sumgayit", city: "Sumgayit", cuisine: ["Seafood"], rating: 4.4, reviewCount: 190, priceRange: "MID", menu: [{ name: "Balıq", category: "mains", price: 16 }] },
  ];

  for (const comp of regionalCompetitors) {
    const { menu, cuisine, city, ...rest } = comp;
    const record = await CompetitorRestaurantModel.findOneAndUpdate(
      { slug: comp.slug },
      {
        $set: {
          ...rest,
          city,
          currency: "AZN",
          cuisine: toJsonString(cuisine),
          advantages: toJsonString(["Regional mətbəx"]),
          weaknesses: toJsonString(["Məhdud çeşid"]),
          isActive: true,
        },
      },
      { upsert: true, new: true },
    );
    await CompetitorMenuItemModel.deleteMany({ competitorId: record._id });
    await CompetitorMenuItemModel.insertMany(
      menu.map((m) => ({ competitorId: record._id, ...m, currency: "AZN" })),
    );
  }

  await TableModel.deleteMany({ restaurantId: restaurant._id });
  await TableModel.insertMany([
    { restaurantId: restaurant._id, number: "1", capacity: 4, zone: "INDOOR", status: "AVAILABLE" },
    { restaurantId: restaurant._id, number: "2", capacity: 6, zone: "VIP", status: "OCCUPIED" },
    { restaurantId: restaurant._id, number: "3", capacity: 4, zone: "TERRACE", status: "RESERVED" },
    { restaurantId: restaurant._id, number: "4", capacity: 2, zone: "INDOOR", status: "AVAILABLE" },
    { restaurantId: restaurant._id, number: "5", capacity: 10, zone: "INDOOR", status: "OCCUPIED" },
    { restaurantId: restaurant._id, number: "6", capacity: 4, zone: "TERRACE", status: "AVAILABLE" },
  ]);

  await StaffModel.deleteMany({ restaurantId: restaurant._id });
  await StaffModel.insertMany([
    { restaurantId: restaurant._id, firstName: "Ali", lastName: "Hüseynov", phone: "994501234567", email: "ali@metavision.az", role: "MANAGER", status: "ACTIVE", hireDate: new Date("2023-01-15"), salary: 2500 },
    { restaurantId: restaurant._id, firstName: "Leyla", lastName: "Qasımova", phone: "994552223344", role: "CHEF", status: "ACTIVE", hireDate: new Date("2023-03-01"), salary: 2200 },
    { restaurantId: restaurant._id, firstName: "Orxan", lastName: "Babayev", phone: "994703334455", role: "WAITER", status: "ACTIVE", hireDate: new Date("2024-01-10"), salary: 900 },
  ]);

  await SubscriptionModel.findOneAndUpdate(
    { userId: demoUser._id },
    {
      $set: { plan: "GOLD", status: "ACTIVE" },
      $setOnInsert: {
        userId: demoUser._id,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2026-12-31"),
        autoRenew: true,
      },
    },
    { upsert: true },
  );

  await AdminClientModel.deleteMany({});
  await AdminClientModel.insertMany([
    { company: "Tech Solutions AZ", plan: "GOLD", startDate: new Date("2025-01-01"), monthlyPayment: 680, status: "ACTIVE", aiQueries: 4120 },
    { company: "BakuMart LLC", plan: "STANDARD", startDate: new Date("2025-01-15"), monthlyPayment: 390, status: "TRIAL", aiQueries: 1850 },
    { company: "Caspian Group", plan: "GOLD", startDate: new Date("2025-01-01"), monthlyPayment: 680, status: "ACTIVE", aiQueries: 8300 },
  ]);

  await PlatformMetricModel.deleteMany({});
  await PlatformMetricModel.create({
    activeClients: 48,
    activeClientsGrowth: 12,
    monthlyRevenue: 32460,
    revenueGrowth: 8.4,
    aiQueries: 18400,
    aiQueriesGrowth: 23,
    onboardingRate: 96,
    onboardingGrowth: 2,
    goldPlanCount: 37,
    standardPlanCount: 21,
  });

  const siteSections: Record<string, unknown> = {
    industries: [
      { id: "restaurants", label: "Restaurants" },
      { id: "retail-grocery", label: "Retail & Grocery" },
      { id: "ecommerce", label: "E commerce" },
    ],
    partners: [
      { id: "google", name: "Google", src: "/partners/google.png", width: 310, height: 135 },
      { id: "amazon", name: "Amazon", src: "/partners/amazon.png", width: 326, height: 135 },
    ],
    solutions: [
      { num: 1, title: "RSM · Restaurant Sales Manager", text: "AI-powered sales agent for your menu and orders." },
      { num: 2, title: "PSM · Product Sales Manager", text: "Real-time database recommendations." },
    ],
    timeline: [
      { num: 1, label: "Create special account for you" },
      { num: 2, label: "Build connection with your database" },
      { num: 3, label: "Prepare chatbot channels" },
      { num: 4, label: "24/7 support" },
    ],
    subscription_plans: [
      { plan: "gold", name: "Gold", monthlyPrice: 99, yearlyPrice: 990, popular: true, features: [{ name: "Full market intel", included: true }] },
      { plan: "standard", name: "Standard", monthlyPrice: 49, yearlyPrice: 490, features: [{ name: "TasteMind AI", included: true }] },
    ],
    delivery_platforms: [
      { id: "wolt", name: "Wolt", commissionPct: 30, avgDeliveryMin: 35, monthlyOrdersEst: 420, city: "Baku" },
      { id: "bolt", name: "Bolt Food", commissionPct: 25, avgDeliveryMin: 28, monthlyOrdersEst: 380, city: "Baku" },
    ],
  };

  for (const [section, items] of Object.entries(siteSections)) {
    await SiteContentModel.findOneAndUpdate(
      { section },
      { $set: { items: toJsonString(items), updatedAt: new Date() } },
      { upsert: true },
    );
  }

  console.log("MongoDB seed complete.");
  console.log(`Demo login: 994501112223 / ${DEMO_PASSWORD}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
