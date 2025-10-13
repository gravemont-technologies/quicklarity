import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAnalytics } from './hooks/useAnalytics';
import QuizForm from './components/QuizForm';
import StatusPage from './pages/StatusPage';
import PricingSection from './components/PricingSection';

function App() {
  const { trackEvent } = useAnalytics();
  
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<QuizForm />} />
          <Route path="/status/:jobId" element={<StatusPage />} />
          <Route path="/pricing" element={<PricingSection />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

