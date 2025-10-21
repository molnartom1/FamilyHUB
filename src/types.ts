export type Member = {
  uid: string
  name: string
  color: string
  avatarUrl?: string
  birthday?: string // YYYY-MM-DD
}

export type Household = {
  id: string
  name: string
  createdAt: number
  ownerUid: string
}

export type Task = {
  id: string
  title: string
  done: boolean
  date: string // YYYY-MM-DD (napi teendők)
  assignedTo?: string // uid
  createdAt: number
}

export type ShoppingItem = {
  id: string
  title: string
  qty?: string
  done: boolean
  createdAt: number
  addedBy?: string // uid
}

export type EventItem = {
  id: string
  title: string
  date: string // YYYY-MM-DD
  time?: string // HH:mm optional
  createdAt: number
  createdBy?: string
  type?: "event" | "birthday"
  assignedTo?: string
}

export type Note = {
  id: string
  text: string
  createdAt: number
  createdBy?: string
}

export type Invite = {
  id: string
  email?: string
  code: string
  createdAt: number
  createdBy: string
  acceptedBy?: string
}
