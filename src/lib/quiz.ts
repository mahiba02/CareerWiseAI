export type QuizQuestion = {
  id: "q1" | "q2" | "q3" | "q4" | "q5";
  text: string;
  options: { value: string; label: string }[];
};

export const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    text: "When tackling a complex project, you prefer to:",
    options: [
      { value: "a", label: "Work independently to find a solution" },
      { value: "b", label: "Collaborate closely with a small, focused team" },
      { value: "c", label: "Lead and coordinate a larger group effort" },
    ],
  },
  {
    id: "q2",
    text: "You find yourself most energized by tasks that involve:",
    options: [
      { value: "a", label: "Solving intricate, abstract problems" },
      { value: "b", label: "Creating visually appealing and user-friendly designs" },
      { value: "c", label: "Building robust, scalable, and efficient systems" },
    ],
  },
  {
    id: "q3",
    text: "Which type of task do you enjoy the most?",
    options: [
      { value: "a", label: "Creative and open-ended challenges" },
      { value: "b", label: "Logical, structured, and data-driven work" },
      { value: "c", label: "Hands-on, practical, and tangible building" },
    ],
  },
  {
    id: "q4",
    text: "When faced with a new technology or environment, you tend to:",
    options: [
      { value: "a", label: "Analyze and understand the fundamentals before diving in" },
      { value: "b", label: "Jump in, experiment, and learn by doing" },
      { value: "c", label: "Seek out documentation and expert guidance" },
    ],
  },
  {
    id: "q5",
    text: "Ideally, your future career would offer:",
    options: [
      { value: "a", label: "Stability, security, and a well-defined career path" },
      { value: "b", label: "Continuous learning, new challenges, and innovation" },
      { value: "c", label: "High-impact leadership and strategic decision-making" },
    ],
  },
];
