import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { toJsonString } from "../src/lib/db/json-fields";

const prisma = new PrismaClient();

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "Metavision2026!";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const demoUser = await prisma.user.upsert({
    where: { phone: "994501112223" },
    update: {},
    create: {
      firstName: "Rəşad",
      lastName: "Əliyev",
      phone: "994501112223",
      email: "demo@metavision.az",
      password: passwordHash,
      role: "USER",
    },
  });

  const restaurant = await prisma.restaurant.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
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
  });

  // OrderItem → MenuItem FK: əvvəl sifarişləri sil
  await prisma.order.deleteMany({ where: { userId: demoUser.id } });
  await prisma.menuItem.deleteMany({ where: { restaurantId: restaurant.id } });
  await prisma.menuItem.createMany({
    data: [
      { restaurantId: restaurant.id, name: "Plov", category: "mains", description: "Ənənəvi azərbaycan plovu", price: 18.5, tags: toJsonString(["popular", "halal"]), featured: true, order: 1 },
      { restaurantId: restaurant.id, name: "Dolma", category: "mains", description: "Yarpaq dolması", price: 14.0, tags: toJsonString(["traditional"]), order: 2 },
      { restaurantId: restaurant.id, name: "Qutab", category: "appetizers", description: "Göyərti qutab", price: 6.5, tags: toJsonString(["vegetarian"]), order: 3 },
      { restaurantId: restaurant.id, name: "Lülə kabab", category: "mains", description: "Təndir lülə", price: 22.0, tags: toJsonString(["grill"]), featured: true, order: 4 },
      { restaurantId: restaurant.id, name: "Paxlava", category: "desserts", description: "Şəki paxlavası", price: 8.0, tags: toJsonString(["sweet"]), order: 5 },
    ],
  });

  const menuItems = await prisma.menuItem.findMany({ where: { restaurantId: restaurant.id } });
  const plov = menuItems.find((m) => m.name === "Plov")!;
  const dolma = menuItems.find((m) => m.name === "Dolma")!;

  await prisma.order.create({
    data: {
      userId: demoUser.id,
      orderNumber: "#1042",
      status: "COMPLETED",
      total: 23.58,
      items: { create: [{ menuItemId: plov.id, quantity: 1, price: 18.5 }] },
    },
  });
  await prisma.order.create({
    data: {
      userId: demoUser.id,
      orderNumber: "#1041",
      status: "PENDING",
      total: 12.4,
      items: { create: [{ menuItemId: dolma.id, quantity: 1, price: 14.0 }] },
    },
  });

  await prisma.customer.deleteMany({ where: { restaurantId: restaurant.id } });
  await prisma.customer.createMany({
    data: [
      { restaurantId: restaurant.id, name: "Rəşad Əliyev", phone: "994501112223", visits: 15, totalSpent: 450.5, lastVisit: new Date("2024-06-20") },
      { restaurantId: restaurant.id, name: "Ayşə Məmmədova", phone: "994553344556", visits: 8, totalSpent: 280, lastVisit: new Date("2024-06-18") },
      { restaurantId: restaurant.id, name: "Tural Həsənov", phone: "994707788990", visits: 3, totalSpent: 95, lastVisit: new Date("2024-06-15") },
    ],
  });

  await prisma.inventory.deleteMany({ where: { restaurantId: restaurant.id } });
  await prisma.inventory.createMany({
    data: [
      { restaurantId: restaurant.id, name: "Tomatoes", category: "Vegetables", quantity: 25, unit: "kg", minQuantity: 10, costPerUnit: 2.5, status: "IN_STOCK" },
      { restaurantId: restaurant.id, name: "Lamb", category: "Meat", quantity: 8, unit: "kg", minQuantity: 15, costPerUnit: 18, status: "LOW_STOCK" },
      { restaurantId: restaurant.id, name: "Rice", category: "Grains", quantity: 40, unit: "kg", minQuantity: 20, costPerUnit: 3.2, status: "IN_STOCK" },
    ],
  });

  await prisma.reservation.deleteMany({ where: { restaurantId: restaurant.id } });
  await prisma.notification.deleteMany({ where: { userId: demoUser.id } });
  await prisma.reservation.createMany({
    data: [
      { userId: demoUser.id, restaurantId: restaurant.id, name: "Ali Hasanov", phone: "050 123 23 32", date: new Date("2026-06-21"), time: "22:00", partySize: 2, status: "CONFIRMED" },
      { userId: demoUser.id, restaurantId: restaurant.id, name: "Nigar Qasimli", phone: "055 680 89 84", date: new Date("2026-06-18"), time: "18:53", partySize: 4, status: "CONFIRMED" },
    ],
  });

  // Baku competitor restaurants
  const competitors = [
    {
      slug: "sumakh",
      name: "Sumakh Restaurant",
      address: "Kiçik Qala 5, İçərişəhər",
      district: "İçərişəhər",
      cuisine: ["Azerbaijani", "Traditional"],
      rating: 4.6,
      reviewCount: 1240,
      priceRange: "MID" as const,
      advantages: ["Mərkəzi lokasiya", "Ənənəvi interyer", "Yerli mətbəx"],
      weaknesses: ["Növbə pik saatlarda", "Parkinq məhdud"],
      menu: [
        { name: "Plov", category: "mains", price: 16, isPopular: true },
        { name: "Qutab mix", category: "appetizers", price: 9 },
        { name: "Dograma", category: "soups", price: 12 },
        { name: "Kabab set", category: "mains", price: 28, isPopular: true },
      ],
    },
    {
      slug: "chayki",
      name: "Çayki",
      address: "Fountain Square, Bakı",
      district: "Nizami",
      cuisine: ["Caucasian", "Tea house"],
      rating: 4.4,
      reviewCount: 890,
      priceRange: "BUDGET" as const,
      advantages: ["Sürətli servis", "Aşağı qiymət", "Mərkəz"],
      weaknesses: ["Məkan kiçik", "Menyu məhdud"],
      menu: [
        { name: "Çay seti", category: "beverages", price: 5 },
        { name: "Plov", category: "mains", price: 12, isPopular: true },
        { name: "Şəkərbura", category: "desserts", price: 3 },
      ],
    },
    {
      slug: "mangal-steak",
      name: "Mangal Steak House",
      address: "Port Baku Mall",
      district: "White City",
      cuisine: ["Steakhouse", "Grill"],
      rating: 4.7,
      reviewCount: 2100,
      priceRange: "PREMIUM" as const,
      advantages: ["Premium ət", "Müasir interyer", "Geniş menyu"],
      weaknesses: ["Yüksək qiymət", "Rezervasiya tələb olunur"],
      menu: [
        { name: "Ribeye steak", category: "mains", price: 65, isPopular: true },
        { name: "Tomahawk", category: "mains", price: 120 },
        { name: "Caesar salad", category: "appetizers", price: 18 },
      ],
    },
    {
      slug: "firuze",
      name: "Firuze Restaurant",
      address: "İçərişəhər, Bakı",
      district: "İçərişəhər",
      cuisine: ["Azerbaijani"],
      rating: 4.5,
      reviewCount: 1560,
      priceRange: "MID" as const,
      advantages: ["Tarixi atmosfer", "Canlı musiqi", "Yerli şirniyyat"],
      weaknesses: ["Turistlərə yönəlik qiymətlər"],
      menu: [
        { name: "Firuze plovu", category: "mains", price: 19, isPopular: true },
        { name: "Ləvəngi", category: "mains", price: 24 },
        { name: "Baklava", category: "desserts", price: 10 },
      ],
    },
    {
      slug: "mari-vanna",
      name: "Mari Vanna",
      address: "Səməd Vurğun küçəsi",
      district: "Nizami",
      cuisine: ["Russian", "European"],
      rating: 4.3,
      reviewCount: 780,
      priceRange: "PREMIUM" as const,
      advantages: ["Unikal dekor", "Premium kokteyllər"],
      weaknesses: ["Yüksək orta çek"],
      menu: [
        { name: "Borscht", category: "soups", price: 15 },
        { name: "Beef Stroganoff", category: "mains", price: 32, isPopular: true },
        { name: "Pelmeni", category: "mains", price: 22 },
      ],
    },
    {
      slug: "telegraph",
      name: "Teleqraf Küçə",
      address: "İlyas Əfəndiyev küçəsi",
      district: "Yasamal",
      cuisine: ["European", "Bistro"],
      rating: 4.2,
      reviewCount: 650,
      priceRange: "MID" as const,
      advantages: ["Terras", "Brunch menyu"],
      weaknesses: ["Servis dəyişkən"],
      menu: [
        { name: "Burger", category: "mains", price: 21 },
        { name: "Pasta carbonara", category: "mains", price: 19, isPopular: true },
        { name: "Tiramisu", category: "desserts", price: 12 },
      ],
    },
  ];

  for (const comp of competitors) {
    const { menu, cuisine, advantages, weaknesses, ...rest } = comp;
    const record = await prisma.competitorRestaurant.upsert({
      where: { slug: comp.slug },
      update: {
        ...rest,
        city: "Baku",
        currency: "AZN",
        cuisine: toJsonString(cuisine),
        advantages: toJsonString(advantages),
        weaknesses: toJsonString(weaknesses),
      },
      create: {
        ...rest,
        city: "Baku",
        currency: "AZN",
        cuisine: toJsonString(cuisine),
        advantages: toJsonString(advantages),
        weaknesses: toJsonString(weaknesses),
      },
    });
    await prisma.competitorMenuItem.deleteMany({ where: { competitorId: record.id } });
    await prisma.competitorMenuItem.createMany({
      data: menu.map((m) => ({
        competitorId: record.id,
        name: m.name,
        category: m.category,
        price: m.price,
        currency: "AZN",
        isPopular: m.isPopular ?? false,
      })),
    });
  }

  await prisma.marketTrend.deleteMany({ where: { city: "Baku" } });
  await prisma.marketTrend.createMany({
    data: [
      { city: "Baku", region: "Absheron", cuisine: "Azerbaijani", momentum: 82, demandChange: 12, confidence: 88, avgDishPriceAzn: 18.5 },
      { city: "Baku", region: "Absheron", cuisine: "Steakhouse", momentum: 74, demandChange: 8, confidence: 85, avgDishPriceAzn: 45 },
      { city: "Baku", region: "Absheron", cuisine: "Fusion", momentum: 68, demandChange: 15, confidence: 79, avgDishPriceAzn: 28 },
      { city: "Baku", region: "Absheron", cuisine: "Fast casual", momentum: 61, demandChange: -3, confidence: 72, avgDishPriceAzn: 12 },
      { city: "Baku", region: "Absheron", cuisine: "Seafood", momentum: 70, demandChange: 6, confidence: 81, avgDishPriceAzn: 35 },
      { city: "Baku", region: "CIS", cuisine: "Spicy Noodles", momentum: 85, demandChange: 16, confidence: 89, avgDishPriceAzn: 14 },
    ],
  });

  // Tables
  await prisma.table.deleteMany({ where: { restaurantId: restaurant.id } });
  const tableData = [
    { number: "1", capacity: 4, zone: "INDOOR" as const, status: "AVAILABLE" as const },
    { number: "2", capacity: 6, zone: "VIP" as const, status: "OCCUPIED" as const },
    { number: "3", capacity: 4, zone: "TERRACE" as const, status: "RESERVED" as const },
    { number: "4", capacity: 2, zone: "INDOOR" as const, status: "AVAILABLE" as const },
    { number: "5", capacity: 10, zone: "INDOOR" as const, status: "OCCUPIED" as const },
    { number: "6", capacity: 4, zone: "TERRACE" as const, status: "AVAILABLE" as const },
    { number: "7", capacity: 6, zone: "VIP" as const, status: "RESERVED" as const },
    { number: "8", capacity: 4, zone: "INDOOR" as const, status: "AVAILABLE" as const },
  ];
  await prisma.table.createMany({
    data: tableData.map((t) => ({
      restaurantId: restaurant.id,
      number: t.number,
      capacity: t.capacity,
      zone: t.zone,
      shape: "ROUND",
      status: t.status,
    })),
  });

  // Staff
  await prisma.staff.deleteMany({ where: { restaurantId: restaurant.id } });
  await prisma.staff.createMany({
    data: [
      { restaurantId: restaurant.id, firstName: "Ali", lastName: "Hüseynov", phone: "994501234567", email: "ali@metavision.az", role: "MANAGER", status: "ACTIVE", hireDate: new Date("2023-01-15"), salary: 2500 },
      { restaurantId: restaurant.id, firstName: "Leyla", lastName: "Qasımova", phone: "994552223344", role: "CHEF", status: "ACTIVE", hireDate: new Date("2023-03-01"), salary: 2200 },
      { restaurantId: restaurant.id, firstName: "Orxan", lastName: "Babayev", phone: "994703334455", role: "WAITER", status: "ACTIVE", hireDate: new Date("2024-01-10"), salary: 900 },
      { restaurantId: restaurant.id, firstName: "Nərgiz", lastName: "Soltanova", phone: "994554445566", role: "HOST", status: "ON_LEAVE", hireDate: new Date("2023-06-20"), salary: 1100 },
    ],
  });

  // Subscription
  await prisma.subscription.upsert({
    where: { userId: demoUser.id },
    update: { plan: "GOLD", status: "ACTIVE" },
    create: {
      userId: demoUser.id,
      plan: "GOLD",
      status: "ACTIVE",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2026-12-31"),
      autoRenew: true,
    },
  });

  // Admin clients (SaaS tenants)
  await prisma.adminClient.deleteMany();
  await prisma.adminClient.createMany({
    data: [
      { company: "Tech Solutions AZ", plan: "GOLD", startDate: new Date("2025-01-01"), monthlyPayment: 680, status: "ACTIVE", aiQueries: 4120 },
      { company: "BakuMart LLC", plan: "STANDARD", startDate: new Date("2025-01-15"), monthlyPayment: 390, status: "TRIAL", aiQueries: 1850 },
      { company: "Caspian Group", plan: "GOLD", startDate: new Date("2025-01-01"), monthlyPayment: 680, status: "ACTIVE", aiQueries: 8300 },
      { company: "AzerFinance", plan: "STANDARD", startDate: new Date("2025-01-20"), monthlyPayment: 390, status: "ACTIVE", aiQueries: 2940 },
      { company: "Nar Restaurant Chain", plan: "ENTERPRISE", startDate: new Date("2024-11-01"), monthlyPayment: 1200, status: "ACTIVE", aiQueries: 15200 },
    ],
  });

  await prisma.platformMetric.deleteMany();
  await prisma.platformMetric.create({
    data: {
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
    },
  });

  // Landing CMS
  const siteSections = {
    industries: [
      { id: "ecommerce", label: "E commerce" },
      { id: "education", label: "Education sector" },
      { id: "marketplaces", label: "Marketplaces" },
      { id: "retail-grocery", label: "Retail & Grocery" },
      { id: "restaurants", label: "Restaurants" },
    ],
    partners: [
      { id: "amazon", name: "Amazon", src: "/partners/amazon.png", width: 326, height: 135, imageHeightClass: "h-[48px] sm:h-[56px] lg:h-[66px]", imageScaleClass: "origin-center scale-[1.08]" },
      { id: "google-analytics", name: "Google Analytics", src: "/partners/google-analytics.png", width: 340, height: 135, imageHeightClass: "h-[48px] sm:h-[56px] lg:h-[66px]", imageScaleClass: "origin-center scale-[1.02]" },
      { id: "make", name: "Make", src: "/partners/make.png", width: 324, height: 135, imageHeightClass: "h-[48px] sm:h-[56px] lg:h-[66px]", imageScaleClass: "origin-center scale-[1.03]" },
      { id: "google", name: "Google", src: "/partners/google.png", width: 310, height: 135, imageHeightClass: "h-[48px] sm:h-[56px] lg:h-[66px]", imageScaleClass: "origin-center scale-[1.0]" },
    ],
    solutions: [
      { num: 1, title: "RSM · Restaurant Sales Manager", text: "An AI-powered sales agent that presents your menu, handles orders, and shares all essential restaurant information." },
      { num: 2, title: "PSM · Product Sales Manager", text: "A smart digital agent that connects to your database in real time and makes budget-oriented recommendations." },
      { num: 3, title: "CSM · Course Sales Manager", text: "Automates course sales and schedules consultation meetings within the chat." },
      { num: 4, title: "CASM · Company About Sales Manager", text: "Your brand's digital representative that answers questions and guides to the next step." },
    ],
    timeline: [
      { num: 1, label: "Create special account for you" },
      { num: 2, label: "Build connection with your database" },
      { num: 3, label: "Prepare chatbot channels for your company" },
      { num: 4, label: "We provide support all time for you" },
    ],
    subscription_plans: [
      { plan: "trial", name: "Trial", monthlyPrice: 0, yearlyPrice: 0, features: [{ name: "Basic menu", included: true }] },
      { plan: "standard", name: "Standard", monthlyPrice: 49, yearlyPrice: 490, popular: false, features: [{ name: "TasteMind AI", included: true }, { name: "Competitive intel", included: true }] },
      { plan: "gold", name: "Gold", monthlyPrice: 99, yearlyPrice: 990, popular: true, features: [{ name: "Full market intel", included: true }, { name: "API access", included: true }] },
      { plan: "enterprise", name: "Enterprise", monthlyPrice: 299, yearlyPrice: 2990, features: [{ name: "Multi-location", included: true }, { name: "Dedicated support", included: true }] },
    ],
    delivery_platforms: [
      { id: "wolt", name: "Wolt", commissionPct: 30, avgDeliveryMin: 35, monthlyOrdersEst: 420, city: "Baku" },
      { id: "bolt", name: "Bolt Food", commissionPct: 25, avgDeliveryMin: 28, monthlyOrdersEst: 380, city: "Baku" },
      { id: "umico", name: "Umico Market", commissionPct: 22, avgDeliveryMin: 40, monthlyOrdersEst: 120, city: "Baku" },
      { id: "direct", name: "Direct / WhatsApp", commissionPct: 0, avgDeliveryMin: 0, monthlyOrdersEst: 200, city: "Baku" },
    ],
  };

  for (const [section, items] of Object.entries(siteSections)) {
    const payload = toJsonString(items);
    await prisma.siteContent.upsert({
      where: { section },
      update: { items: payload },
      create: { section, items: payload },
    });
  }

  console.log("Seed complete.");
  console.log(`Demo login: 994501112223 / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
