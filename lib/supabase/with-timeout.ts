export function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
  label: string,
): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `${label} timed out after ${ms}ms. Check DevTools → Network for requests to your-project.supabase.co (auth/v1).`,
          ),
        );
      }, ms);
    }),
  ]);
}
