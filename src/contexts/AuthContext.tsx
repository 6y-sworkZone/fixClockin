import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { type User, getUserByUsername, addUser, initDB, updateUserGoal } from '../lib/db'

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  register: (username: string, password: string, dailyGoal: number) => Promise<boolean>
  logout: () => void
  updateGoal: (goal: number) => void
  updateUserGoal: typeof updateUserGoal
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initDB().then(() => {
      const savedUser = localStorage.getItem('fitness_user')
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      }
      setLoading(false)
    })
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    const existingUser = await getUserByUsername(username)
    if (existingUser && existingUser.password === password) {
      setUser(existingUser)
      localStorage.setItem('fitness_user', JSON.stringify(existingUser))
      return true
    }
    return false
  }

  const register = async (username: string, password: string, dailyGoal: number): Promise<boolean> => {
    const existingUser = await getUserByUsername(username)
    if (existingUser) {
      return false
    }
    const id = await addUser({ username, password, dailyGoal })
    const newUser = { id, username, password, dailyGoal, createdAt: new Date().toISOString() }
    setUser(newUser)
    localStorage.setItem('fitness_user', JSON.stringify(newUser))
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('fitness_user')
  }

  const updateGoal = (goal: number) => {
    if (user) {
      const updatedUser = { ...user, dailyGoal: goal }
      setUser(updatedUser)
      localStorage.setItem('fitness_user', JSON.stringify(updatedUser))
    }
  }

  const value = {
    user,
    login,
    register,
    logout,
    updateGoal,
    updateUserGoal,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
