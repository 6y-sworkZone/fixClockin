import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import { type WorkoutRecord, getWorkoutsByDateRange } from '../lib/db'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#6366F1', '#EF4444']

export default function Stats() {
  const { user } = useAuth()
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [user, period])

  const loadData = async () => {
    if (!user?.id) return
    setLoading(true)

    const endDate = new Date()
    const startDate = new Date()
    
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7)
    } else {
      startDate.setMonth(startDate.getMonth() - 1)
    }

    const data = await getWorkoutsByDateRange(
      user.id,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    )

    setWorkouts(data)
    setLoading(false)
  }

  const getDailyData = () => {
    const dailyMap: Record<string, number> = {}
    const days = period === 'week' ? 7 : 30

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dailyMap[dateStr] = 0
    }

    workouts.forEach(w => {
      if (dailyMap[w.date] !== undefined) {
        dailyMap[w.date] += w.calories
      }
    })

    return Object.entries(dailyMap).map(([date, calories]) => ({
      date: date.slice(5),
      calories
    }))
  }

  const getExerciseData = () => {
    const exerciseMap: Record<string, { count: number; calories: number }> = {}

    workouts.forEach(w => {
      if (!exerciseMap[w.exercise]) {
        exerciseMap[w.exercise] = { count: 0, calories: 0 }
      }
      exerciseMap[w.exercise].count++
      exerciseMap[w.exercise].calories += w.calories
    })

    return Object.entries(exerciseMap).map(([name, data], index) => ({
      name,
      ...data,
      fill: COLORS[index % COLORS.length]
    }))
  }

  const totalCalories = workouts.reduce((sum, w) => sum + w.calories, 0)
  const totalWorkouts = workouts.length
  const avgCaloriesPerWorkout = totalWorkouts > 0 ? Math.round(totalCalories / totalWorkouts) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  const dailyData = getDailyData()
  const exerciseData = getExerciseData()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">数据统计</h1>
          <div className="flex space-x-2 bg-white rounded-lg p-1 shadow">
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                period === 'week'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              周统计
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                period === 'month'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              月统计
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">总消耗</p>
                <p className="text-2xl font-bold text-gray-800">{totalCalories}</p>
                <p className="text-gray-500 text-sm">卡路里</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">打卡次数</p>
                <p className="text-2xl font-bold text-gray-800">{totalWorkouts}</p>
                <p className="text-gray-500 text-sm">次</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">平均每次</p>
                <p className="text-2xl font-bold text-gray-800">{avgCaloriesPerWorkout}</p>
                <p className="text-gray-500 text-sm">卡路里</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {period === 'week' ? '近7天' : '近30天'}卡路里消耗
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFF',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="calories" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">运动项目分布</h2>
            {exerciseData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={exerciseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {exerciseData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFF',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                暂无数据
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">运动项目详情</h2>
          {exerciseData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">运动项目</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">次数</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">总卡路里</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">平均卡路里</th>
                  </tr>
                </thead>
                <tbody>
                  {exerciseData.map((item, index) => (
                    <tr key={item.name} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium text-gray-800">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{item.count}</td>
                      <td className="py-3 px-4 text-gray-600">{item.calories}</td>
                      <td className="py-3 px-4 text-gray-600">{Math.round(item.calories / item.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              暂无数据
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
