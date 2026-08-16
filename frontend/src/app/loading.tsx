export default function Loading() {
  return <main className="bg-[#f7fbff]">
    <div className="min-h-[43rem] animate-pulse bg-gradient-to-br from-white via-sky-50 to-blue-100" />
    <div className="shell grid gap-5 py-16 md:grid-cols-3">
      {[1, 2, 3].map(item => <div className="h-72 animate-pulse rounded-3xl border border-blue-100 bg-white" key={item} />)}
    </div>
  </main>;
}
