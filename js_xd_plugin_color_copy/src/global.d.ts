declare class Color {
  r: number
  g: number
  b: number
  a: number
  toHex(toSix?: boolean): string // 轉換為十六進制顏色 #xxxxxx
  toRgba(): { r: number; g: number; b: number; a: number /* 0-255 */ }
  constructor()
  constructor(hex: string)
  constructor(hex: string, opacity: number)
}

type GradientType = 'linear' | 'radial'

type ColorStop = {
  stop: number
  color: Color
}

type AssetsColor = {
  name?: string // 顏色名稱 (有改過名字才有)
  color?: Color // 顏色對象 (若是單色才有)
  gradientType?: GradientType // 漸層類型 (漸層才會有)
  colorStops?: ColorStop[] // 顏色停止點數組 (漸層才會有)
}