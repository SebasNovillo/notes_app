import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from './pages/Home/Home'
import LogIn from './pages/LogIn/LogIn';
import SignUp from './pages/SignUp/SignUp';
import Profile from './pages/Profile/Profile';

const ProtectedRoute = ({ element }) => {
  const token = localStorage.getItem("token");
  return token ? element : <Navigate to="/login" replace />;
};

const AuthRoute = ({ element }) => {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/dashboard" replace /> : element;
};

const routes = (
  <Router>
    <Routes>
      <Route path='/' element={<Navigate to="/login" replace />} />
      <Route path='/dashboard' element={<ProtectedRoute element={<Home />} />} />
      <Route path='/login' element={<AuthRoute element={<LogIn />} />} />
      <Route path='/signup' element={<AuthRoute element={<SignUp />} />} />
      <Route path='/profile' element={<ProtectedRoute element={<Profile />} />} />
    </Routes>
  </Router>
);

const App = () => {
  return (
    <>
      {routes}
    </>
  )
}

export default App
