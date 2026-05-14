import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import { type WorkoutRecord, addWorkout, getWorkoutsByUser, getTotalWorkoutsCount, getWorkoutsByDateRange } from '../lib/db'

const EXERCISES = [
  '跑步', '游泳', '骑行', '健身操', '举重', '瑜伽', '跳绳', '篮球', '足球', '其他'
]

export default function Dashboard() {
  const { user, updateGoal, updateUserGoal } = useAuth()
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [todayCalories, setTodayCalories] = useState(0)

  const [showForm, setShowForm] = useState(false)
  const [exercise, setExercise] = useState('')
  const [duration, setDuration] = useState('')
  const [calories, setCalories] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [showGoalModal, setShowGoalModal] = useState(false)
  const [newGoal, setNewGoal] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const observer = useRef<IntersectionObserver | null>(null)
  const lastWorkoutRef = useCallback((node: HTMLDivElement) => {
    if (loadingMore) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore()
      }
    })
    if (node) observer.current.observe(node)
  }, [loadingMore, hasMore])

  useEffect(() => {
    loadInitialData()
  }, [user])

  const loadInitialData = async () => {
    if (!user?.id) return
    setLoading(true)

    const [initialWorkouts, count] = await Promise.all([
      getWorkoutsByUser(user.id, 10, 0),
      getTotalWorkoutsCount(user.id)
    ])

    setWorkouts(initialWorkouts)
    setTotalCount(count)
    setHasMore(initialWorkouts.length < count)
    setOffset(initialWorkouts.length)

    const today = new Date().toISOString().split('T')[0]
    const todayWorkouts = await getWorkoutsByDateRange(user.id, today, today)
    const todayTotal = todayWorkouts.reduce((sum, w) => sum + w.calories, 0)
    setTodayCalories(todayTotal)

    setLoading(false)
  }

  const loadMore = async () => {
    if (!user?.id || loadingMore || !hasMore) return
    setLoadingMore(true)

    const moreWorkouts = await getWorkoutsByUser(user.id, 10, offset)
    setWorkouts(prev => [...prev, ...moreWorkouts])
    setOffset(prev => prev + moreWorkouts.length)
    setHasMore(offset + moreWorkouts.length < totalCount)

    setLoadingMore(false)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!exercise) errors.exercise = '请选择运动项目'
    if (!duration || parseInt(duration) <= 0) errors.duration = '请输入有效的运动时长'
    if (!calories || parseInt(calories) <= 0) errors.calories = '请输入有效的消耗卡路里'
    if (!date) errors.date = '请选择日期'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !validateForm()) return

    await addWorkout({
      userId: user.id,
      exercise,
      duration: parseInt(duration),
      calories: parseInt(calories),
      date
    })

    setSuccessMessage('打卡成功！')
    setTimeout(() => setSuccessMessage(''), 3000)

    setShowForm(false)
    setExercise('')
    setDuration('')
    setCalories('')
    setDate(new Date().toISOString().split('T')[0])

    loadInitialData()
  }

  const handleUpdateGoal = async () => {
    const goal = parseInt(newGoal)
    if (goal > 0 && user?.id) {
      updateGoal(goal)
      await updateUserGoal(user.id, goal)
      setShowGoalModal(false)
      setNewGoal('')
    }
  }

  const isGoalAchieved = user && todayCalories >= user.dailyGoal
  const goalProgress = user ? Math.min((todayCalories / user.dailyGoal) * 100, 100) : 0

  if (loading && workouts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {successMessage && (
          <div className="fixed top-24 right-6 bg-green-500 text-white px-8 py-4 rounded-xl shadow-xl z-50 animate-pulse">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className={`bg-white rounded-3xl shadow-xl p-8 ${isGoalAchieved ? 'ring-4 ring-green-400' : ''}`}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-gray-500 text-sm mb-1">今日消耗</p>
                <p className="text-4xl font-bold text-gray-800 mb-1">{todayCalories}</p>
                <p className="text-gray-500 text-sm">卡路里</p>
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isGoalAchieved ? 'bg-green-100' : 'bg-blue-100'}`}>
                <svg className={`w-7 h-7 ${isGoalAchieved ? 'text-green-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${isGoalAchieved ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-3">目标: {user?.dailyGoal} 卡</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-gray-500 text-sm mb-1">累计打卡</p>
                <p className="text-4xl font-bold text-gray-800 mb-1">{totalCount}</p>
                <p className="text-gray-500 text-sm">次</p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl shadow-xl p-8 text-white">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-blue-100 text-sm mb-1">每日目标</p>
                <p className="text-4xl font-bold mb-1">{user?.dailyGoal}</p>
                <p className="text-blue-100 text-sm">卡路里</p>
              </div>
              <button
                onClick={() => { setShowGoalModal(true); setNewGoal(user?.dailyGoal.toString() || '') }}
                className="text-white/80 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-5 rounded-2xl font-semibold text-xl shadow-xl hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center justify-center space-x-3"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>添加打卡记录</span>
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">添加打卡记录</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">运动项目</label>
                  <select
                    value={exercise}
                    onChange={(e) => setExercise(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${formErrors.exercise ? 'border-red-300' : 'border-gray-300'}`}
                  >
                    <option value="">请选择运动项目</option>
                    {EXERCISES.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                  </select>
                  {formErrors.exercise && <p className="text-red-500 text-sm mt-1">{formErrors.exercise}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">时长（分钟）</label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${formErrors.duration ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="30"
                    />
                    {formErrors.duration && <p className="text-red-500 text-sm mt-1">{formErrors.duration}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">卡路里</label>
                    <input
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${formErrors.calories ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="200"
                    />
                    {formErrors.calories && <p className="text-red-500 text-sm mt-1">{formErrors.calories}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">日期</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${formErrors.date ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {formErrors.date && <p className="text-red-500 text-sm mt-1">{formErrors.date}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all mt-4"
                >
                  确认打卡
                </button>
              </form>
            </div>
          </div>
        )}

        {showGoalModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">设置每日目标</h2>
              <input
                type="number"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none mb-4"
                placeholder="请输入目标卡路里"
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleUpdateGoal}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">打卡记录</h2>
          {workouts.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-xl p-16 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">还没有打卡记录，开始您的第一次打卡吧！</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workouts.map((workout, index) => {
                const isHighCalories = workout.calories >= 300
                return (
                  <div
                    key={workout.id}
                    ref={index === workouts.length - 1 ? lastWorkoutRef : undefined}
                    className={`bg-white rounded-3xl shadow-xl p-8 transition-all hover:shadow-2xl ${isHighCalories ? 'ring-2 ring-orange-400' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center space-x-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isHighCalories ? 'bg-orange-100' : 'bg-blue-100'}`}>
                          <svg className={`w-7 h-7 ${isHighCalories ? 'text-orange-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{workout.exercise}</h3>
                          <p className="text-sm text-gray-500">{workout.date}</p>
                        </div>
                      </div>
                      {isHighCalories && (
                        <span className="px-3 py-1.5 bg-orange-100 text-orange-600 text-xs font-medium rounded-full">
                          高效燃脂
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-3xl font-bold text-gray-800">{workout.duration}</p>
                        <p className="text-sm text-gray-500 mt-1">分钟</p>
                      </div>
                      <div>
                        <p className={`text-3xl font-bold ${isHighCalories ? 'text-orange-600' : 'text-blue-600'}`}>{workout.calories}</p>
                        <p className="text-sm text-gray-500 mt-1">卡路里</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {loadingMore && (
            <div className="text-center py-12">
              <div className="inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-gray-500">加载更多...</p>
            </div>
          )}

          {!hasMore && workouts.length > 0 && (
            <div className="text-center py-12 text-gray-500">
              没有更多记录了
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
