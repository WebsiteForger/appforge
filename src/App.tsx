import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/clerk-react';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import EditorPage from './pages/Editor';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/editor/:projectId" element={<EditorPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route
          path="/sign-in/*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
              <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
            </div>
          }
        />
        <Route
          path="/sign-up/*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
              <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
