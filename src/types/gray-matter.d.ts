declare module 'gray-matter' {
  interface GrayMatterResult<T = Record<string, unknown>> {
    data: T;
    content: string;
    excerpt?: string;
    empty?: boolean;
  }

  function matter<T = Record<string, unknown>>(
    input: string,
    options?: Record<string, unknown>
  ): GrayMatterResult<T>;

  export = matter;
}
