import React from 'react'
import { BrowserRouter as Router ,Routes, Route, Navigate } from 'react-router-dom'

import Home from './pages/Home/Home'
import Login from './pages/Auth/Login'
import SignUp from './pages/Auth/SignUp'


const App = () => {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/dashboard" element={<Home />} />
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App