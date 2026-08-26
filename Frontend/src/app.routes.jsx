import { createBrowserRouter, Navigate } from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Protected from "./features/auth/components/Protected";
import Home from "./features/interview/pages/Home";
import Interview from "./features/interview/pages/Interview";
import Dashboard from "./features/interview/pages/Dashboard";
import PracticeHub from "./features/interview/pages/PracticeHub";
import PracticeSession from "./features/interview/pages/PracticeSession";
import PracticeResults from "./features/interview/pages/PracticeResults";
import Profile from "./features/interview/pages/Profile";
import Progress from "./features/interview/pages/Progress";
import Readiness from "./features/interview/pages/Readiness";
import Applications from "./features/interview/pages/Applications";
import Achievements from "./features/interview/pages/Achievements";

export const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "/",
        element: <Protected><Home /></Protected>
    },
    {
        path: "/dashboard",
        element: <Protected><Dashboard /></Protected>
    },
    {
        path: "/progress",
        element: <Protected><Progress /></Protected>
    },
    {
        path: "/readiness",
        element: <Protected><Readiness /></Protected>
    },
    {
        path: "/readiness/:reportId",
        element: <Protected><Readiness /></Protected>
    },
    {
        path: "/applications",
        element: <Protected><Applications /></Protected>
    },
    {
        path: "/resumes",
        element: <Navigate to="/" replace />
    },
    {
        path: "/resumes/:reportId",
        element: <Navigate to="/" replace />
    },
    {
        path: "/achievements",
        element: <Protected><Achievements /></Protected>
    },
    {
        path: "/profile",
        element: <Protected><Profile /></Protected>
    },
    {
        path: "/interview/:interviewId",
        element: <Protected><Interview /></Protected>
    },
    {
        path: "/practice",
        element: <Protected><PracticeHub /></Protected>
    },
    {
        path: "/practice/session/:sessionId",
        element: <Protected><PracticeSession /></Protected>
    },
    {
        path: "/practice/results/:sessionId",
        element: <Protected><PracticeResults /></Protected>
    }
]);