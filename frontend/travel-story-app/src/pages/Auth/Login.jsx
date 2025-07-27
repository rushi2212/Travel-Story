import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, MapPin, Plane, Camera, Mountain, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { validateEmail } from '../../utils/helper';
import axiosInstance from '../../utils/axiosInstance';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post("/login", {
        email: email,
        password: password,
      });

      if (response.data && response.data.accessToken) {
        localStorage.setItem("token", response.data.accessToken);
        navigate("/dashboard");
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-16 left-16 text-gray-200/10 animate-bounce">
          <Plane size={40} className="rotate-45" />
        </div>
        <div className="absolute top-32 right-24 text-gray-200/10 animate-pulse">
          <Mountain size={35} />
        </div>
        <div className="absolute bottom-24 left-12 text-gray-200/10 animate-bounce delay-300">
          <Camera size={30} />
        </div>
        <div className="absolute bottom-16 right-16 text-gray-200/10 animate-pulse delay-500">
          <Compass size={45} className="animate-spin" style={{ animationDuration: '8s' }} />
        </div>
        <div className="absolute top-1/2 left-8 text-gray-200/10 animate-bounce delay-700">
          <MapPin size={25} />
        </div>
      </div>

      {/* Login Card */}
      <div
        className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 w-full max-w-md relative z-10 border border-gray-200/50"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
        }}
      >
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-md">
            <MapPin className="text-white" size={30} />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Travel Stories</h1>
          <p className="text-gray-600 text-sm mt-1">Sign in to continue your journey</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <div className="space-y-6">
          {/* Email Field */}
          <div className="relative group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input
                type="email"
                name="email"
                value={email}
                onChange={({ target }) => setEmail(target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/80 text-gray-900 placeholder-gray-400"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="relative group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={({ target }) => setPassword(target.value)}
                className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/80 text-gray-900 placeholder-gray-400"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <Plane size={16} className="transform rotate-45" />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/80 text-gray-500">or</span>
            </div>
          </div>

          {/* Create Account Button */}
          <button
            onClick={() => navigate("/signup")}
            className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <span>Create Account</span>
            <Camera size={16} />
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Explore the world with Travel Stories
          </p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-12 left-1/3 w-24 h-24 bg-blue-200/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-12 right-1/3 w-32 h-32 bg-indigo-200/10 rounded-full blur-2xl"></div>
    </div>
  );
};

export default Login;