import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignupPage from './components/SignupPage';
import Welcome from './components/Welcome';
import LoginPage from './components/LoginPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignupPage/>}/>
        <Route path = "/login" element={<LoginPage/>} />
        <Route path = "/welcome" element={<Welcome/>} />
      </Routes>
    </Router>
  );
}

export default App;
