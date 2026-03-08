import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { AlertTriangle, Clock, Pill, Home, ArrowRight, Brain, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

export function TriageResult() {
  const location = useLocation();
  const { 
    category = 'White', 
    suggestion = 'No data', 
    confidence,
    probabilities,
    inferenceTime,
  } = location.state || {};

  const getColor = (cat: string) => {
    switch (cat) {
      case 'Red': return 'bg-red-500 text-white';
      case 'Orange': return 'bg-orange-500 text-white';
      case 'Yellow': return 'bg-yellow-500 text-white';
      default: return 'bg-slate-100 text-slate-800 border border-slate-200';
    }
  };

  const getIcon = (cat: string) => {
    switch (cat) {
      case 'Red': return <AlertTriangle className="h-16 w-16 mb-4" />;
      case 'Orange': return <Clock className="h-16 w-16 mb-4" />;
      case 'Yellow': return <Pill className="h-16 w-16 mb-4" />;
      default: return <Home className="h-16 w-16 mb-4" />;
    }
  };

  const getBarColor = (cat: string) => {
    switch (cat) {
      case 'Red': return 'bg-red-500';
      case 'Orange': return 'bg-orange-500';
      case 'Yellow': return 'bg-yellow-400';
      case 'White': return 'bg-slate-300';
      default: return 'bg-slate-300';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12 text-center">
      {/* Main Result Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`p-12 rounded-3xl shadow-xl max-w-lg w-full flex flex-col items-center ${getColor(category)}`}
      >
        {getIcon(category)}
        <h1 className="text-4xl font-bold uppercase tracking-wider">{category} TAG</h1>
        <p className="mt-4 text-lg font-medium opacity-90">{suggestion}</p>
        
        {/* Confidence Badge */}
        {confidence != null && (
          <div className="mt-6 bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="font-bold text-lg">{confidence}%</span>
            <span className="text-sm opacity-80">confidence</span>
          </div>
        )}
      </motion.div>

      {/* Probability Breakdown */}
      {probabilities && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-lg w-full"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-slate-500" />
            <h3 className="font-semibold text-slate-900">AI Model Probability Breakdown</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(probabilities as Record<string, number>).map(([label, prob]) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{label}</span>
                  <span className="text-slate-500">{prob}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${prob}%` }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className={`h-full rounded-full ${getBarColor(label)}`}
                  />
                </div>
              </div>
            ))}
          </div>
          {inferenceTime && (
            <p className="mt-4 text-xs text-slate-400 text-right">
              Inference time: {inferenceTime}ms
            </p>
          )}
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="space-y-4 max-w-md w-full">
        {category === 'Red' && (
          <Link 
            to="/patient/hospitals?filter=emergency" 
            className="flex items-center justify-center w-full py-4 px-6 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg transition-transform hover:scale-105"
          >
            Find Nearby Emergency <ArrowRight className="ml-2" />
          </Link>
        )}
        
        {category === 'Orange' && (
          <Link 
            to="/patient/hospitals?filter=appointment" 
            className="flex items-center justify-center w-full py-4 px-6 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 shadow-lg transition-transform hover:scale-105"
          >
            Book Appointment Now <ArrowRight className="ml-2" />
          </Link>
        )}

        {category === 'Yellow' && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-yellow-800 text-sm">
            Your prescription has been generated by AI and sent to a doctor for verification. You will be notified once approved.
          </div>
        )}

        <Link to="/patient/dashboard" className="block text-slate-500 hover:text-slate-800 font-medium">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
