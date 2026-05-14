
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-800">健身打卡</span>
            </div>

            <div className="hidden md:flex space-x-4">
              <Link
                to="/dashboard"
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive('/dashboard')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                打卡记录
              </Link>
              <Link
                to="/stats"
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive('/stats')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                数据统计
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-700">{user?.username}</p>
              <p className="text-xs text-gray-500">目标: {user?.dailyGoal} 卡/天</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
            >
              退出
            </button>
          </div>
        </div>
      </div>

      <div className="md:hidden border-t">
        <div className="flex justify-around py-2">
          <Link
            to="/dashboard"
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              isActive('/dashboard') ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
            }`}
          >
            打卡记录
          </Link>
          <Link
            to="/stats"
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              isActive('/stats') ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
            }`}
          >
            数据统计
          </Link>
        </div>
      </div>
    </nav>
  )
}
