type ToastProps = { message: string };

export function Toast({ message }: ToastProps) {
  return <div role="status" className="fixed inset-x-4 bottom-20 z-40 mx-auto w-fit max-w-[calc(100%-2rem)] border border-line bg-surface px-4 py-3 text-center text-sm shadow-lg lg:bottom-4">{message}</div>;
}
