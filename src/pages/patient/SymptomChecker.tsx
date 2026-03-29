import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, TriageCategory } from '@/context/AppContext';
import { predict as apiPredict } from '@/services/api';
import { Stethoscope, Brain, AlertCircle } from 'lucide-react';

const COMMON_SYMPTOMS = [
  'Fever', 'Headache', 'Cough', 'Chest Pain', 
  'Breathing Difficulty', 'Stomach Pain', 'Dizziness', 'Bleeding',
  'Nausea', 'Fatigue', 'Body Pain', 'Sore Throat'
];

export function SymptomChecker() {
  const navigate = useNavigate();
  const { addPrescription, currentUser } = useApp();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleAnalyze = async () => {
    if (selectedSymptoms.length === 0 && !description) return;
    setIsAnalyzing(true);
    setError('');

    // Build the text to send to the model
    const allSymptoms = [...selectedSymptoms];
    let fullText = allSymptoms.join(', ');
    if (description.trim()) {
      fullText = fullText ? `${fullText}. ${description}` : description;
    }

    try {
      const result = await apiPredict(fullText);

      const category = result.prediction as TriageCategory;
      const confidence = result.confidence;
      const probabilities = result.probabilities;

      // Generate appropriate suggestion based on model prediction
      let suggestion = '';
      switch (category) {
        case 'Red':
          suggestion = 'Immediate medical attention required. Please proceed to the nearest emergency ward.';
          break;
        case 'Orange':
          suggestion = 'Please visit a doctor within 24 hours. Booking an appointment is recommended.';
          break;
        case 'Yellow':
          suggestion = 'Mild condition detected. AI has generated a prescription for doctor verification.';
          break;
        default:
          suggestion = 'No serious symptoms detected. Home remedies: Drink warm water, take rest.';
      }

      // If Yellow, create a pending prescription for doctor verification
      if (category === 'Yellow' && currentUser) {
        addPrescription({
          patientId: currentUser.id,
          patientName: currentUser.name,
          symptoms: [...selectedSymptoms, description].filter(Boolean),
          aiSuggestion: suggestion,
          triageCategory: category
        });
      }

      setIsAnalyzing(false);
      navigate('/patient/result', { 
        state: { 
          category, 
          suggestion, 
          confidence,
          probabilities,
          symptoms: [...selectedSymptoms, description].filter(Boolean),
          inferenceTime: result.inference_time_ms,
        } 
      });
    } catch (err: any) {
      setIsAnalyzing(false);
      setError(err.message || 'Failed to analyze symptoms. Is the backend server running?');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full border border-blue-100 mb-2">
          <Brain className="h-3.5 w-3.5" />
          Powered by BERT Deep Learning Model
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Symptom Checker</h1>
        <p className="text-slate-500">Select your symptoms or describe how you feel. Our AI model will analyze them.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">Common Symptoms</label>
          <div className="flex flex-wrap gap-2">
            {COMMON_SYMPTOMS.map(symptom => (
              <button
                key={symptom}
                onClick={() => toggleSymptom(symptom)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedSymptoms.includes(symptom)
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {symptom}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Detailed Description</label>
          <textarea
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            rows={4}
            placeholder="Describe your pain, duration, or any other details... (e.g., 'I have crushing chest pain radiating to my left arm and jaw, I'm sweating profusely')"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Analysis Failed</p>
              <p>{error}</p>
              <p className="mt-1 text-red-500 text-xs">Make sure the backend server is running: <code className="bg-red-100 px-1 py-0.5 rounded">python server/main.py</code></p>
            </div>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || (selectedSymptoms.length === 0 && !description)}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all ${
            isAnalyzing ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isAnalyzing ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              AI is analyzing...
            </span>
          ) : (
            <>
              <Stethoscope className="w-5 h-5" /> Analyze with AI Model
            </>
          )}
        </button>
      </div>
    </div>
  );
}
