import { createBrowserRouter } from "react-router";
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