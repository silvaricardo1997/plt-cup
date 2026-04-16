'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex-1 bg-[#015484] text-white text-sm font-bold rounded-[10px] px-5 py-3 hover:opacity-90 transition-opacity"
    >
      Imprimir / Salvar PDF
    </button>
  )
}
