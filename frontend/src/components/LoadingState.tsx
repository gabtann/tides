export function LoadingState({ message }: { message: string }) {
  return (
    <p role="status" className="border-l-2 border-l-line pl-3 text-muted">
      {message}
    </p>
  )
}
