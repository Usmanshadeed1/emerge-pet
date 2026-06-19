export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600 text-2xl animate-pulse">
          🐾
        </div>
        <div className="h-1.5 w-32 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div className="h-full w-full rounded-full bg-green-600 animate-[shrink_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
