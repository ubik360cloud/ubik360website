import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import SignIn from './pages/SignIn.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Apollo from './pages/Apollo.jsx';
import Drafts from './pages/Drafts.jsx';
import Leads from './pages/Leads.jsx';
import Flows from './pages/Flows.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/apollo" element={<ProtectedRoute><Apollo /></ProtectedRoute>} />
      <Route path="/drafts" element={<ProtectedRoute><Drafts /></ProtectedRoute>} />
      <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
      <Route path="/flows" element={<ProtectedRoute><Flows /></ProtectedRoute>} />
    </Routes>
  );
}
