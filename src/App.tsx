import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { GamificationProvider } from './contexts/GamificationContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Problems from './pages/Problems';
import ProblemDescription from './pages/ProblemDescription';
import CodingInterface from './pages/CodingInterface';
import Contests from './pages/Contests';
import InterviewHub from './pages/InterviewHub';
import MockAssessment from './pages/MockAssessment';
import MockResults from './pages/MockResults';
import OnlineInterview from './pages/OnlineInterview';
import AIInterview from './pages/AIInterview';
import { MockSessionProvider } from './contexts/MockSessionContext';
import Profile from './pages/Profile';
import Notes from './pages/Notes';
import Explore from './pages/Explore';
import Discuss from './pages/Discuss';
import NewDiscussion from './pages/NewDiscussion';
import DiscussionDetail from './pages/DiscussionDetail';
import RoadmapDetail from './pages/RoadmapDetail';
import Store from './pages/Store';
import Orders from './pages/Orders';
import Leaderboard from './pages/Leaderboard';
import Badges from './pages/Badges';
import Playground from './pages/Playground';
import Settings from './pages/Settings';
import CourseLab from './pages/CourseLab';
import ContestDetail from './pages/ContestDetail';
import BattleRoom from './pages/BattleRoom';
import Challenges from './pages/Challenges';
import Visualizer from './pages/Visualizer';
import MyCourses from './pages/MyCourses';
import Skills from './pages/Skills';
import Progress from './pages/Progress';
import MyLists from './pages/MyLists';



function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 dark:bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 dark:text-gray-600">Loading...</div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}



function AppContent() {
  const { user } = useAuth();

  return (
    <GamificationProvider user={user}>
      <MockSessionProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300">
            <Routes>
              <Route path="/" element={<><Navbar /><Landing /></>} />
              <Route path="/login" element={<><Navbar /><Login /></>} />
              <Route path="/signup" element={<><Navbar /><Signup /></>} />
              <Route path="/problems" element={<><Navbar /><Problems /></>} />
              <Route path="/problem/:id" element={<><Navbar /><ProblemDescription /></>} />
              <Route path="/solve/:id" element={<><Navbar /><CodingInterface /></>} />
              <Route path="/contests" element={<><Navbar /><Contests /></>} />
              <Route path="/contests/:slug" element={<><Navbar /><ContestDetail /></>} />
              <Route path="/battle/:id" element={<ProtectedRoute><BattleRoom /></ProtectedRoute>} />
              <Route path="/interview" element={<><Navbar /><InterviewHub /></>} />
              <Route path="/interview/mock" element={<ProtectedRoute><MockAssessment /></ProtectedRoute>} />
              <Route path="/interview/results" element={<ProtectedRoute><MockResults /></ProtectedRoute>} />
              <Route path="/interview/online/:roomId" element={<ProtectedRoute><OnlineInterview /></ProtectedRoute>} />
              <Route path="/interview/ai/:roleId" element={<ProtectedRoute><AIInterview /></ProtectedRoute>} />


              <Route path="/explore" element={<><Navbar /><Explore /></>} />
              <Route path="/explore/:slug" element={<><Navbar /><RoadmapDetail /></>} />
              <Route path="/discuss" element={<><Navbar /><Discuss /></>} />
              <Route path="/discuss/new" element={<ProtectedRoute><Navbar /><NewDiscussion /></ProtectedRoute>} />
              <Route path="/discuss/:id" element={<><Navbar /><DiscussionDetail /></>} />
              <Route path="/store" element={<><Navbar /><Store /></>} />
              <Route path="/leaderboard" element={<><Navbar /><Leaderboard /></>} />
              <Route path="/playground" element={<ProtectedRoute><Navbar /><Playground /></ProtectedRoute>} />
              <Route path="/badges" element={<ProtectedRoute><Navbar /><Badges /></ProtectedRoute>} />
              <Route path="/challenges" element={<ProtectedRoute><Navbar /><Challenges /></ProtectedRoute>} />
              <Route
                path="/notes"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <Notes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:username?"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <Orders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/course-lab/:courseId"
                element={
                  <ProtectedRoute>
                    <CourseLab />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/visualizer"
                element={
                  <ProtectedRoute>
                    <Visualizer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-courses"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <MyCourses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/skills"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <Skills />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/progress"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <Progress />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-lists"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <MyLists />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </BrowserRouter>
      </MockSessionProvider>
    </GamificationProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
