/**
 * AI Module Examples - Test Requests
 */

// Example 1: Chat with AI
export const EXAMPLE_CHAT_REQUEST = {
  userId: 'user_abc123',
  message: 'What are the best trending dishes today?',
  restaurantId: 'rest_xyz789',
  context: {
    userPreferences: ['spicy', 'vegetarian'],
  },
};

// Example 2: Get Insights - Revenue
export const EXAMPLE_INSIGHT_REVENUE = {
  restaurantId: 'rest_xyz789',
  dataType: 'revenue',
  timeRange: 'weekly',
};

// Example 3: Get Insights - Menu
export const EXAMPLE_INSIGHT_MENU = {
  restaurantId: 'rest_xyz789',
  dataType: 'menu',
  timeRange: 'monthly',
};

// Example 4: Get Insights - Orders
export const EXAMPLE_INSIGHT_ORDERS = {
  restaurantId: 'rest_xyz789',
  dataType: 'orders',
};

// Example 5: Get Insights - Trends
export const EXAMPLE_INSIGHT_TRENDS = {
  restaurantId: 'rest_xyz789',
  dataType: 'trends',
};

// Example 6: Get Recommendations
export const EXAMPLE_RECOMMENDATION_REQUEST = {
  userId: 'user_abc123',
  restaurantId: 'rest_xyz789',
  limit: 5,
};

// Example 7: Get Forecast
export const EXAMPLE_FORECAST_REQUEST = {
  restaurantId: 'rest_xyz789',
  days: 14,
};

// Example 8: Expected Chat Response
export const EXAMPLE_CHAT_RESPONSE = {
  userId: 'user_abc123',
  message: 'What are the best trending dishes today?',
  response: 'Based on your preferences and recent orders, I recommend...',
  context: {
    user: {
      id: 'user_abc123',
      email: 'user@example.com',
      name: 'John Doe',
      role: 'user',
    },
    restaurant: {
      id: 'rest_xyz789',
      name: 'Italian Bistro',
      address: '123 Main St',
    },
    history: {
      totalOrders: 25,
      totalSpent: 1250.5,
      averageOrderValue: 50.02,
      lastOrderDate: '2026-06-15T19:30:00Z',
    },
    timestamp: '2026-06-21T14:25:00Z',
    season: 'summer',
    timeOfDay: 'afternoon',
  },
  conversationId: 'chat:user_abc123:1718975100000',
  timestamp: '2026-06-21T14:25:00Z',
};

// Example 9: Expected Recommendations Response
export const EXAMPLE_RECOMMENDATIONS_RESPONSE = [
  {
    id: 'item_001',
    name: 'Margherita Pizza',
    description: 'Classic Italian pizza with fresh mozzarella',
    price: 16.99,
    category: 'Pizza',
    recommendationScore: 0.92,
    reason: 'You frequently order pizza',
  },
  {
    id: 'item_002',
    name: 'Pasta Carbonara',
    description: 'Creamy pasta with guanciale and pecorino',
    price: 18.5,
    category: 'Pasta',
    recommendationScore: 0.87,
    reason: 'Popular choice based on your preferences',
  },
  {
    id: 'item_003',
    name: 'Tiramisu',
    description: 'Traditional Italian dessert',
    price: 8.99,
    category: 'Dessert',
    recommendationScore: 0.75,
    reason: 'Complements pasta dishes you usually order',
  },
];

// Example 10: Expected Forecast Response
export const EXAMPLE_FORECAST_RESPONSE = {
  restaurantId: 'rest_xyz789',
  days: 7,
  forecast: [
    {
      date: '2026-06-22',
      predictedOrders: 45,
      predictedRevenue: 1250.5,
      confidence: 0.85,
    },
    {
      date: '2026-06-23',
      predictedOrders: 52,
      predictedRevenue: 1425.75,
      confidence: 0.82,
    },
    {
      date: '2026-06-24',
      predictedOrders: 38,
      predictedRevenue: 980.25,
      confidence: 0.78,
    },
  ],
  generatedAt: '2026-06-21T14:25:00Z',
  modelVersion: '1.0',
};

// Example 11: Expected Behavior Analysis Response
export const EXAMPLE_BEHAVIOR_RESPONSE = {
  userId: 'user_abc123',
  totalOrders: 25,
  orderFrequencyPerMonth: 8.3,
  categoryPreferences: [
    { category: 'Pizza', orders: 10 },
    { category: 'Pasta', orders: 8 },
    { category: 'Salad', orders: 4 },
    { category: 'Dessert', orders: 3 },
  ],
  spendingTrend: 'stable',
  topRestaurants: [
    { restaurantId: 'rest_xyz789', orders: 12 },
    { restaurantId: 'rest_abc123', orders: 8 },
    { restaurantId: 'rest_def456', orders: 5 },
  ],
  avgOrderValue: 50.02,
  lastOrderDaysAgo: 6,
};

// Example 12: Expected Insights Response
export const EXAMPLE_INSIGHTS_RESPONSE = {
  restaurantId: 'rest_xyz789',
  dataType: 'revenue',
  timeRange: 'monthly',
  insights: [
    {
      type: 'performance',
      message: 'Leverage popular items during peak hours',
      confidence: 0.85,
    },
    {
      type: 'opportunity',
      message: 'Bundle slow-moving items with popular ones',
      confidence: 0.72,
    },
    {
      type: 'trend',
      message: 'Evening orders trending up by 15% this month',
      confidence: 0.91,
    },
  ],
  generatedAt: '2026-06-21T14:25:00Z',
};
