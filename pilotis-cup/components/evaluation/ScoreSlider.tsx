'use client'

import { useState } from 'react'

interface ScoreSliderProps {
  name: string
  label: string
  defaultValue?: number
}

export function ScoreSlider({ name, label, defaultValue = 8 }: ScoreSliderProps) {
  const [value, setValue] = useState(defaultValue)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor={name}
          className="text-[10px] font-bold uppercase tracking-widest text-[#506a6e]"
        >
          {label}
        </label>
        <span className="text-[16px] font-black text-[#015484] tabular-nums">
          {value.toFixed(2)}
        </span>
      </div>
      <input
        id={name}
        type="range"
        name={name}
        min="6"
        max="10"
        step="0.25"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-[#e8e5e2] accent-[#015484] cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-[#aa9577]">
        <span>6.00</span>
        <span>8.00</span>
        <span>10.00</span>
      </div>
    </div>
  )
}
