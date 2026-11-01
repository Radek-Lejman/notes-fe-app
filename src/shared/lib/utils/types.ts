/** The values of a constant object: `ValueOf<typeof STATUS>` is the union of its strings. */
export type ValueOf<T> = T[keyof T];
