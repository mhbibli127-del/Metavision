export type Solution = {
  num: number;
  title: string;
  text: string;
};

export type TimelineStepData = {
  num: number;
  label: string;
};

export const solutions: Solution[] = [
  {
    num: 1,
    title: "RSM · Restaurant Sales Manager",
    text: "An AI-powered sales agent that presents your menu, handles orders, and shares all essential restaurant information — guiding every customer from the first message to the table",
  },
  {
    num: 2,
    title: "PSM · Product Sales Manager",
    text: "A smart digital agent that connects to your database in real time, displays available stock, and makes budget oriented recommendations based on the criteria you define",
  },
  {
    num: 3,
    title: "CSM · Course Sales Manager",
    text: "Built to automate course sales, recommend the most suitable package through targeted questions, and schedule consultation meetings — all within the chat",
  },
  {
    num: 4,
    title: "CASM · Company About Sales Manager",
    text: "Your brand's digital representative that answers every customer question and guides them to the next step — whether that's a meeting, an order, or a payment",
  },
];

export const timelineSteps: TimelineStepData[] = [
  { num: 1, label: "Create special account for you" },
  { num: 2, label: "Build connection with your database" },
  { num: 3, label: "Prepare chatbot channels for your company" },
  { num: 4, label: "We provide support all time for you" },
];
