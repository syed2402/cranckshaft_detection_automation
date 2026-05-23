import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import BreadCrumb from "./components/BreadCrumb";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import DecisionPage from "./pages/DecisionPage";
import FeaturePage from "./pages/FeaturePage";
import GraphPage from "./pages/GraphPage";
import OverridePage from "./pages/OverridePage";
import ThresholdPage from "./pages/ThresholdPage";
import TrendPage from "./pages/TrendPage";
import UploadPage from "./pages/UploadPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f8f9fa]">
        <TopBar />
        <Sidebar />
        <main className="ml-[240px] min-h-screen overflow-y-auto bg-[#f8f9fa] pt-16">
          <div className="mx-auto max-w-[1240px] px-8 py-7">
            <BreadCrumb />
            <Routes>
              <Route path="/" element={<Navigate to="/upload" replace />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/graph" element={<GraphPage />} />
              <Route path="/features" element={<FeaturePage />} />
              <Route path="/decision" element={<DecisionPage />} />
              <Route path="/trend" element={<TrendPage />} />
              <Route path="/overrides" element={<OverridePage />} />
              <Route path="/thresholds" element={<ThresholdPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
