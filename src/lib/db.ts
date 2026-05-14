import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

export interface User {
  id?: number
  username: string
  password: string
  dailyGoal: number
  createdAt: string
}

export interface WorkoutRecord {
  id?: number
  userId: number
  exercise: string
  duration: number
  calories: number
  date: string
  createdAt: string
}

interface FitnessDB extends DBSchema {
  users: {
    key: number
    value: User
    indexes: { 'by-username': string }
  }
  workouts: {
    key: number
    value: WorkoutRecord
    indexes: { 'by-userId': number; 'by-date': string }
  }
}

let db: IDBPDatabase<FitnessDB> | null = null

export async function initDB() {
  if (db) return db

  db = await openDB<FitnessDB>('fitness-tracker', 1, {
    upgrade(db) {
      const userStore = db.createObjectStore('users', {
        keyPath: 'id',
        autoIncrement: true
      })
      userStore.createIndex('by-username', 'username', { unique: true })

      const workoutStore = db.createObjectStore('workouts', {
        keyPath: 'id',
        autoIncrement: true
      })
      workoutStore.createIndex('by-userId', 'userId')
      workoutStore.createIndex('by-date', 'date')
    }
  })

  return db
}

export async function getDB() {
  if (!db) {
    await initDB()
  }
  return db!
}

export async function addUser(user: Omit<User, 'id' | 'createdAt'>) {
  const db = await getDB()
  const now = new Date().toISOString()
  return db.add('users', { ...user, createdAt: now })
}

export async function getUserByUsername(username: string) {
  const db = await getDB()
  const tx = db.transaction('users', 'readonly')
  const index = tx.store.index('by-username')
  return index.get(username)
}

export async function updateUserGoal(userId: number, dailyGoal: number) {
  const db = await getDB()
  const user = await db.get('users', userId)
  if (user) {
    user.dailyGoal = dailyGoal
    return db.put('users', user)
  }
}

export async function addWorkout(workout: Omit<WorkoutRecord, 'id' | 'createdAt'>) {
  const db = await getDB()
  const now = new Date().toISOString()
  return db.add('workouts', { ...workout, createdAt: now })
}

export async function getWorkoutsByUser(
  userId: number,
  limit: number = 10,
  offset: number = 0
): Promise<WorkoutRecord[]> {
  const db = await getDB()
  const tx = db.transaction('workouts', 'readonly')
  const index = tx.store.index('by-userId')
  const results: WorkoutRecord[] = []
  let count = 0
  let skip = offset

  for await (const cursor of index.iterate(userId, 'prev')) {
    if (skip > 0) {
      skip--
      continue
    }
    if (count >= limit) break
    results.push(cursor.value)
    count++
  }

  return results
}

export async function getWorkoutsByDateRange(
  userId: number,
  startDate: string,
  endDate: string
): Promise<WorkoutRecord[]> {
  await getDB()
  const allWorkouts = await getWorkoutsByUser(userId, 1000, 0)
  return allWorkouts.filter(w => w.date >= startDate && w.date <= endDate)
}

export async function deleteWorkout(id: number) {
  const db = await getDB()
  return db.delete('workouts', id)
}

export async function getTotalWorkoutsCount(userId: number): Promise<number> {
  const db = await getDB()
  const tx = db.transaction('workouts', 'readonly')
  const index = tx.store.index('by-userId')
  let count = 0

  for await (const _cursor of index.iterate(userId)) {
    count++
  }

  return count
}
