// src/App.jsx
import './App.css';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React from 'react';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Home from './pages/Home/Home';
import Dashboard from './pages/Dashboard/Dashboard';
import TaskList from './pages/Task/List';
import TaskDetail from './pages/Task/Detail';
import ProjectList from './pages/Project/List';
import ProjectDetail from './pages/Project/Detail';
import StaffList from './pages/Staff/List';
import StaffDetail from './pages/Staff/Detail';
import StatisticList from './pages/Statistic/List';
import FeedbackList from './pages/Feedback/Feedback';
import Setting from './pages/Setting/Setting';
import SignIn from './pages/Authencation/SignIn';
import SignOut from './pages/Authencation/SignOut';

const App = () => {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/sign-in" element={<SignIn />} />
                    <Route path="/sign-out" element={<SignOut />} />
                    <Route
                        path="/dashboard"
                        element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
                    />
                    <Route
                        path="/task-list"
                        element={<ProtectedRoute><TaskList /></ProtectedRoute>}
                    />
                    <Route
                        path="/task-add"
                        element={<ProtectedRoute><TaskDetail mode="add" /></ProtectedRoute>}
                    />
                    <Route
                        path="/task-view/:id"
                        element={<ProtectedRoute><TaskDetail mode="view" /></ProtectedRoute>}
                    />
                    <Route
                        path="/task-edit/:id"
                        element={<ProtectedRoute><TaskDetail mode="edit" /></ProtectedRoute>}
                    />
                    <Route
                        path="/project-list"
                        element={<ProtectedRoute><ProjectList /></ProtectedRoute>}
                    />
                    <Route
                        path="/project-add"
                        element={<ProtectedRoute><ProjectDetail mode="add" /></ProtectedRoute>}
                    />
                    <Route
                        path="/project-view/:id"
                        element={<ProtectedRoute><ProjectDetail mode="view" /></ProtectedRoute>}
                    />
                    <Route
                        path="/project-edit/:id"
                        element={<ProtectedRoute><ProjectDetail mode="edit" /></ProtectedRoute>}
                    />
                    <Route
                        path="/staff-list"
                        element={<ProtectedRoute><StaffList /></ProtectedRoute>}
                    />
                    <Route
                        path="/staff-add"
                        element={<ProtectedRoute><StaffDetail mode="add" /></ProtectedRoute>}
                    />
                    <Route
                        path="/staff-view/:id"
                        element={<ProtectedRoute><StaffDetail mode="view" /></ProtectedRoute>}
                    />
                    <Route
                        path="/staff-edit/:id"
                        element={<ProtectedRoute><StaffDetail mode="edit" /></ProtectedRoute>}
                    />
                    <Route
                        path="/statistic-list"
                        element={<ProtectedRoute><StatisticList /></ProtectedRoute>}
                    />
                    <Route
                        path="/feedback"
                        element={<ProtectedRoute><FeedbackList /></ProtectedRoute>}
                    />
                    <Route
                        path="/setting"
                        element={<ProtectedRoute><Setting /></ProtectedRoute>}
                    />
                </Routes>
            </AuthProvider>
        </Router>
    );
};

export default App;