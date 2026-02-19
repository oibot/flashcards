export type Deck = {
  id: string
  title: string
  cards: number
  description: string
}

export const decks: Deck[] = [
  {
    id: "spanish-basics",
    title: "Spanish Basics",
    cards: 24,
    description: "Common verbs, nouns, and greetings.",
  },
  {
    id: "react-native",
    title: "React Native Fundamentals",
    cards: 18,
    description: "Components, hooks, and layout essentials.",
  },
  {
    id: "world-capitals",
    title: "World Capitals",
    cards: 32,
    description: "Geography drill for quick recall.",
  },
]
