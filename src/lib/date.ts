export const todayStr = () => new Date().toISOString().slice(0,10)
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n*86400000)
export const withinNextDays = (dateStr: string, days=7) => {
  const target = new Date(dateStr + "T00:00:00")
  const now = new Date()
  const diff = (target.getTime() - (new Date(now.toDateString())).getTime())/86400000
  return diff >= 0 && diff <= days
}
