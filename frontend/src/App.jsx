import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from './pages/Home/Home'
import LogIn from './pages/LogIn/LogIn';
import SignUp from './pages/SignUp/SignUp';

const routes = (
  <Router>
    <Routes>
      <Route path='/' exact element={<Navigate to="/login" />} />
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


// import React from 'react';

// const App = () => {
//   return (
//     <h1 style={{ color: 'black', marginTop: '40px', textAlign: 'center' }}>
//       Hello from App
//     </h1>
//   );
// };

// export default App;
