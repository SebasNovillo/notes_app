import React from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from './pages/Home/Home'
import LogIn from './pages/LogIn/LogIn';
import SignUp from './pages/SignUp/SignUp';

const routes = (
  <Router>
    <Routes>
      <Route path='/dashboard' exact element={<Home />} />
      <Route path='/login' exact element={<LogIn />} />
      <Route path='/signup' exact element={<SignUp />} />
    </Routes>
  </Router>
);

const App = () => {
  return (
    <>
      {/* <Home /> */}
      {routes}
    </>
  )
}

export default App