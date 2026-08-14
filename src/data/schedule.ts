/**
 * Pujo 2026 itinerary — single source of truth for both the home-page preview
 * and the full /schedule page.
 *
 * Dates and tithi mapping are provisional, taken from the draft schedule
 * poster. Verify against the 2026 panjika before this goes public.
 */

export type EventIcon =
  | "anandamela"
  | "bodhon"
  | "aaroti"
  | "cultural"
  | "market"
  | "music"
  | "dandiya"
  | "bhog"
  | "bisorjon";

export type ScheduleEvent = {
  title: string;
  description: string;
  icon: EventIcon;
};

export type ScheduleDay = {
  /** Day number within the pujo, 1-indexed. */
  index: number;
  tithi: string;
  tithiBengali: string;
  /** Qualifier shown beside the tithi, e.g. the two-part Nabami. */
  part?: string;
  date: number;
  month: string;
  weekday: string;
  events: ScheduleEvent[];
};

export const scheduleMeta = {
  year: 2026,
  milestone: "20th Year Celebration",
  dateRange: "15 – 21 October 2026",
  venue: "Shriram Samruddhi Apartment, Bengaluru",
};

export const schedule: ScheduleDay[] = [
  {
    index: 1,
    tithi: "Panchami",
    tithiBengali: "পঞ্চমী",
    date: 15,
    month: "October",
    weekday: "Thursday",
    events: [
      {
        title: "Anandamela",
        description: "A festival of food, cooked and shared by our residents.",
        icon: "anandamela",
      },
    ],
  },
  {
    index: 2,
    tithi: "Shashthi",
    tithiBengali: "ষষ্ঠী",
    date: 16,
    month: "October",
    weekday: "Friday",
    events: [
      {
        title: "Bodhon",
        description: "Invocation of Maa Durga.",
        icon: "bodhon",
      },
      {
        title: "Aaroti at the Clubhouse",
        description: "Evening aaroti, together.",
        icon: "aaroti",
      },
      {
        title: "Cultural Function",
        description: "An evening of performances by our community artists.",
        icon: "cultural",
      },
    ],
  },
  {
    index: 3,
    tithi: "Saptami",
    tithiBengali: "সপ্তমী",
    date: 17,
    month: "October",
    weekday: "Saturday",
    events: [
      {
        title: "Flea Market",
        description: "Unique finds, and a hand for small businesses.",
        icon: "market",
      },
      {
        title: "Evening of Melodies",
        description: "A soulful evening of music.",
        icon: "music",
      },
    ],
  },
  {
    index: 4,
    tithi: "Ashtami",
    tithiBengali: "অষ্টমী",
    date: 18,
    month: "October",
    weekday: "Sunday",
    events: [
      {
        title: "Dandiya Night",
        description: "Spin to the beats and celebrate together, under the stars.",
        icon: "dandiya",
      },
    ],
  },
  {
    index: 5,
    tithi: "Nabami",
    tithiBengali: "নবমী",
    part: "Part A",
    date: 19,
    month: "October",
    weekday: "Monday",
    events: [
      {
        title: "Sandhi Pujo",
        description: "The sacred juncture puja.",
        icon: "bodhon",
      },
    ],
  },
  {
    index: 6,
    tithi: "Nabami",
    tithiBengali: "নবমী",
    part: "Part B",
    date: 20,
    month: "October",
    weekday: "Tuesday",
    events: [
      {
        title: "Bhog",
        description: "Prasad served to all devotees.",
        icon: "bhog",
      },
    ],
  },
  {
    index: 7,
    tithi: "Dashami",
    tithiBengali: "দশমী",
    date: 21,
    month: "October",
    weekday: "Wednesday",
    events: [
      {
        title: "Bisorjon",
        description: "A heartfelt farewell to Maa.",
        icon: "bisorjon",
      },
    ],
  },
];
