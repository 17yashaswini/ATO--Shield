export default function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
      <div className="w-5 h-5 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
