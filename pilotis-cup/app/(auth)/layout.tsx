export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4 bg-[#fbf8ec]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-[#201b54] tracking-widest">
            PILOTIS
          </h1>
          <p className="font-[family-name:var(--font-caveat)] text-[#f68721] text-base mt-1">
            cafés especiais
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
