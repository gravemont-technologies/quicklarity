import { useState } from 'react';
import { useUser, SignInButton, SignedIn, SignedOut } from '@clerk/clerk-react';
import { submitIntake } from '../utils/api';
import { useAnalytics } from '../hooks/useAnalytics';
import { useNavigate } from 'react-router-dom';

export default function QuizForm() {
  const { user } = useUser();
  const { trackEvent } = useAnalytics();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.fullName || '',
    email: user?.primaryEmailAddress?.emailAddress || '',
    company: '',
    stage: 'idea',
    founder_experience_years: 0,
    top_goals: [],
    tasks: [{ id: '1', title: '', description: '', effort: 'medium' }],
    biggest_unknowns: [],
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        ...formData,
        guest: !user,
      };
      
      trackEvent('intake_submitted', {
        isGuest: !user,
        taskCount: formData.tasks.filter(t => t.title).length,
      });
      
      const result = await submitIntake(payload);
      navigate(`/status/${result.jobId}`);
      
    } catch (error) {
      alert(`Error: ${error.message}`);
      setLoading(false);
    }
  };
  
  const addTask = () => {
    setFormData({
      ...formData,
      tasks: [...formData.tasks, { id: Date.now().toString(), title: '', description: '', effort: 'medium' }]
    });
  };
  
  const updateTask = (index, field, value) => {
    const newTasks = [...formData.tasks];
    newTasks[index][field] = value;
    setFormData({ ...formData, tasks: newTasks });
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Strategic Clarity in 5 Minutes</h1>
        <p className="text-gray-600 mb-8">Get your personalized strategic plan powered by GPT-5</p>
        
        <SignedOut>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm mb-2">Sign in for full features, or continue as guest</p>
            <SignInButton mode="modal">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Sign In with Clerk
              </button>
            </SignInButton>
          </div>
        </SignedOut>
        
        <SignedIn>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm">✅ Signed in as {user?.primaryEmailAddress?.emailAddress}</p>
          </div>
        </SignedIn>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Your Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="border rounded-lg px-4 py-2"
              required
            />
            <input
              type="email"
              placeholder="Email *"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="border rounded-lg px-4 py-2"
              required
            />
          </div>
          
          <input
            type="text"
            placeholder="Company Name"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full border rounded-lg px-4 py-2"
          />
          
          <select
            value={formData.stage}
            onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
            className="w-full border rounded-lg px-4 py-2"
          >
            <option value="idea">Idea Stage</option>
            <option value="pre-seed">Pre-Seed</option>
            <option value="seed">Seed</option>
            <option value="revenue">Generating Revenue</option>
          </select>
          
          {/* Tasks */}
          <div>
            <h3 className="font-semibold mb-3">Your Tasks *</h3>
            {formData.tasks.map((task, index) => (
              <div key={task.id} className="border rounded-lg p-4 mb-3">
                <input
                  type="text"
                  placeholder="Task Title *"
                  value={task.title}
                  onChange={(e) => updateTask(index, 'title', e.target.value)}
                  className="w-full border rounded px-3 py-2 mb-2"
                  required
                />
                <textarea
                  placeholder="Description (optional)"
                  value={task.description}
                  onChange={(e) => updateTask(index, 'description', e.target.value)}
                  className="w-full border rounded px-3 py-2 mb-2"
                  rows="2"
                />
                <select
                  value={task.effort}
                  onChange={(e) => updateTask(index, 'effort', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="low">Low Effort</option>
                  <option value="medium">Medium Effort</option>
                  <option value="high">High Effort</option>
                </select>
              </div>
            ))}
            <button
              type="button"
              onClick={addTask}
              className="text-blue-600 hover:underline"
            >
              + Add Another Task
            </button>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Generating Plan...' : 'Generate My Strategic Plan'}
          </button>
        </form>
      </div>
    </div>
  );
}

