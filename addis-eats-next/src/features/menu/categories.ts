export const CATEGORIES = ['Ethiopian', 'Pizza', 'Burgers', 'Drinks'] as const;
export type Category = (typeof CATEGORIES)[number];