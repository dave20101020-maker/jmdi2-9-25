import Layout from "@/components/shared/Layout.jsx";

import Dashboard from "@/pages/Dashboard";

import Track from "@/pages/Track";
import Community from "@/pages/Community";

import Analytics from "@/pages/Analytics";

import CoachSelect from "@/pages/CoachSelect";

import Coach from "@/pages/Coach";

import Profile from "@/pages/Profile";

import Sleep from "@/pages/Sleep";

import Diet from "@/pages/Diet";

import Exercise from "@/pages/Exercise";

import PhysicalHealth from "@/pages/PhysicalHealth";

import MentalHealth from "@/pages/MentalHealth";

import Finances from "@/pages/Finances";

import Social from "@/pages/Social";

import Spirituality from "@/pages/Spirituality";

// New Pillar Dashboards
import SleepDashboard from "@/pages/pillars/SleepDashboard";
import DietDashboard from "@/pages/pillars/DietDashboard";
import ExerciseDashboard from "@/pages/pillars/ExerciseDashboard";
import PhysicalHealthDashboard from "@/pages/pillars/PhysicalHealthDashboard";
import MentalHealthDashboard from "@/pages/pillars/MentalHealthDashboard";
import FinancesDashboard from "@/pages/pillars/FinancesDashboard";
import SocialDashboard from "@/pages/pillars/SocialDashboard";
import SpiritualityDashboard from "@/pages/pillars/SpiritualityDashboard";

import Onboarding from "@/pages/Onboarding";

import MyPlans from "@/pages/MyPlans";

import PlanDetail from "@/pages/PlanDetail";

import DailyProgress from "@/pages/DailyProgress";

import WeeklyReflection from "@/pages/WeeklyReflection";
import WeeklyReport from "@/pages/WeeklyReport";

import Upgrade from "@/pages/Upgrade";
import Pricing from "@/pages/Pricing";

import Goals from "@/pages/Goals";

import MyGrowth from "@/pages/MyGrowth";

import MoodTracker from "@/pages/MoodTracker";

import Habits from "@/pages/Habits";

import Friends from "@/pages/Friends";

import Milestones from "@/pages/Milestones";

import Connections from "@/pages/Connections";

import Feedback from "@/pages/Feedback";

import Meditation from "@/pages/Meditation";

import Achievements from "@/pages/Achievements";
import Messages from "@/pages/Messages";
import Notifications from "@/pages/Notifications";
import Timeline from "@/pages/Timeline";

import AdminDashboard from "@/pages/AdminDashboard";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Community: Community,
    Track: Track,
    
    Analytics: Analytics,
    
    CoachSelect: CoachSelect,
    
    Coach: Coach,
    
    Profile: Profile,
    
    Sleep: Sleep,
    
    Diet: Diet,
    
    Exercise: Exercise,
    
    PhysicalHealth: PhysicalHealth,
    
    MentalHealth: MentalHealth,
    
    Finances: Finances,
    
    Social: Social,
    
    Spirituality: Spirituality,
    
    Onboarding: Onboarding,
    
    MyPlans: MyPlans,
    
    PlanDetail: PlanDetail,
    
    DailyProgress: DailyProgress,
    
    WeeklyReflection: WeeklyReflection,
    
    Upgrade: Upgrade,
        Pricing: Pricing,
    
    Goals: Goals,
    
    MyGrowth: MyGrowth,
    
    MoodTracker: MoodTracker,
    
    Habits: Habits,
    
    Friends: Friends,
    
    Milestones: Milestones,
    
    Connections: Connections,
    
    Feedback: Feedback,
    
    Meditation: Meditation,
    
    Achievements: Achievements,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                <Route path="/Community" element={<Community />} />
                <Route path="/community" element={<Community />} />
                
                <Route path="/Track" element={<Track />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/CoachSelect" element={<CoachSelect />} />
                
                <Route path="/Coach" element={<Coach />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/Sleep" element={<Sleep />} />
                
                <Route path="/Diet" element={<Diet />} />
                
                <Route path="/Exercise" element={<Exercise />} />
                
                <Route path="/PhysicalHealth" element={<PhysicalHealth />} />
                
                <Route path="/MentalHealth" element={<MentalHealth />} />
                
                <Route path="/Finances" element={<Finances />} />
                
                <Route path="/Social" element={<Social />} />
                
                <Route path="/Spirituality" element={<Spirituality />} />
                
                {/* Pillar Dashboards */}
                <Route path="/pillar/sleep" element={<SleepDashboard />} />
                <Route path="/pillar/diet" element={<DietDashboard />} />
                <Route path="/pillar/exercise" element={<ExerciseDashboard />} />
                <Route path="/pillar/physical-health" element={<PhysicalHealthDashboard />} />
                <Route path="/pillar/mental-health" element={<MentalHealthDashboard />} />
                <Route path="/pillar/finances" element={<FinancesDashboard />} />
                <Route path="/pillar/social" element={<SocialDashboard />} />
                <Route path="/pillar/spirituality" element={<SpiritualityDashboard />} />
                
                <Route path="/Onboarding" element={<Onboarding />} />
                
                <Route path="/MyPlans" element={<MyPlans />} />
                
                <Route path="/PlanDetail" element={<PlanDetail />} />
                
                <Route path="/DailyProgress" element={<DailyProgress />} />
                
                <Route path="/WeeklyReflection" element={<WeeklyReflection />} />
                <Route path="/weekly-report" element={<WeeklyReport />} />
                <Route path="/WeeklyReport" element={<WeeklyReport />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/Messages" element={<Messages />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/Notifications" element={<Notifications />} />
                <Route path="/timeline" element={<Timeline />} />
                <Route path="/Timeline" element={<Timeline />} />
                
                <Route path="/Upgrade" element={<Upgrade />} />
                    <Route path="/Pricing" element={<Pricing />} />
                    <Route path="/pricing" element={<Pricing />} />
                
                <Route path="/Goals" element={<Goals />} />
                
                <Route path="/MyGrowth" element={<MyGrowth />} />
                
                <Route path="/MoodTracker" element={<MoodTracker />} />
                
                <Route path="/Habits" element={<Habits />} />
                
                <Route path="/Friends" element={<Friends />} />
                
                <Route path="/Milestones" element={<Milestones />} />
                
                <Route path="/Connections" element={<Connections />} />
                
                <Route path="/Feedback" element={<Feedback />} />
                
                <Route path="/Meditation" element={<Meditation />} />
                
                <Route path="/Achievements" element={<Achievements />} />
                
                {/* Admin */}
                <Route path="/admin" element={<AdminDashboard />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}