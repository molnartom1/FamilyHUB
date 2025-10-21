export type Member = { id: string; name: string; color: string; birthday?: string }
export type Task = { id: string; title: string; done: boolean; date: string }
export type Shopping = { id: string; title: string; done: boolean }
export type EventItem = { id: string; title: string; date: string }
export type Note = { id: string; text: string; createdAt: number }
export type DB = {
  members: Member[]
  tasks: Task[]
  shopping: Shopping[]
  events: EventItem[]
  notes: Note[]
}
