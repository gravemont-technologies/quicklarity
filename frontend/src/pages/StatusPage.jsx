import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { pollStatus, submitRating } from '../utils/api';
import { useAnalytics } from '../hooks/useAnalytics';

export default function StatusPage() {
  const { jobId } = useParams();
  const [status, setStatus] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const { trackEvent } = useAnalytics();
  
  useEffect(() => {
    let interval;
    
    const checkStatus = async () => {
      try {
        const data = await pollStatus(jobId);
        setStatus(data);
        
        if (data.status === 'done' || data.status === 'errored') {
          clearInterval(interval);
          
          if (data.status === 'done') {
            trackEvent('plan_viewed', { jobId });
          }
        }
      } catch (error) {
        console.error('Status poll error:', error);
      }
    };
    
    checkStatus();
    interval = setInterval(checkStatus, 3000);
    
    return () => clearInterval(interval);
  }, [jobId]);
  
  const handleRating = async (r) => {
    setRating(r);
    try {
      await submitRating(jobId, r, feedback);
      trackEvent('rating_submitted', { jobId, rating: r });
      alert('Thank you for your feedback!');
    } catch (error) {
      console.error('Rating error:', error);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-4">Strategic Plan Status</h1>
        
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${
              status?.status === 'done' ? 'bg-green-500' :
              status?.status === 'running' ? 'bg-yellow-500 animate-pulse' :
              status?.status === 'errored' ? 'bg-red-500' :
              'bg-gray-300'
            }`} />
            <span className="text-xl font-semibold capitalize">
              {status?.status || 'Loading...'}
            </span>
          </div>
        </div>
        
        {status?.status === 'done' && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-3">✅ Your Strategic Plan is Ready!</h2>
              
              {status.notion_url && (
                <a
                  href={status.notion_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 mb-4"
                >
                  📝 View in Notion
                </a>
              )}
              
              {status.result_summary && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Top Priorities:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {status.result_summary.top_5_titles?.map((title, i) => (
                      <li key={i}>{title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {status.ics_links && status.ics_links.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">📅 Calendar Events:</h3>
                <div className="space-y-2">
                  {status.ics_links.map((link, i) => (
                    <a
                      key={i}
                      href={link}
                      download={`strategic-event-${i + 1}.ics`}
                      className="block bg-gray-100 px-4 py-3 rounded-lg hover:bg-gray-200"
                    >
                      Download Event {i + 1} (.ics)
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            {/* Rating Widget */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">Rate this plan:</h3>
              <div className="flex gap-2 mb-3">
                {[1, 2, 3, 4, 5].map(r => (
                  <button
                    key={r}
                    onClick={() => handleRating(r)}
                    className={`text-3xl ${rating >= r ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Optional feedback..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                rows="3"
              />
            </div>
          </div>
        )}
        
        {status?.status === 'errored' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-600 mb-2">❌ Processing Error</h2>
            <p className="text-red-700">{status.error_message}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        )}
        
        {(status?.status === 'queued' || status?.status === 'running') && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Processing your strategic plan...</p>
            <p className="text-sm text-gray-500 mt-2">This usually takes 30-60 seconds</p>
          </div>
        )}
      </div>
    </div>
  );
}

