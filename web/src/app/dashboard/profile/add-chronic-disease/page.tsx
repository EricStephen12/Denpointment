import React from 'react';
import { addDisease } from '@/app/actions/profile';
import Link from 'next/link';
import { Activity, ArrowLeft } from 'lucide-react';

export default function AddChronicDiseasePage() {
  return (
    <div className="max-w-md mx-auto pt-8">
      <Link href="/dashboard/profile" className="inline-flex items-center gap-1 text-sm font-medium text-sand-50/40 hover:text-red-400 mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Profile
      </Link>
      
      <div className="mb-10">
        <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6">
          <Activity className="h-6 w-6 text-red-400" />
        </div>
        <h1 className="text-3xl font-display text-sand-50 mb-2">Add Condition</h1>
        <p className="text-sand-50/50">Log a medical condition to your health record.</p>
      </div>

      <form action={addDisease} className="space-y-8">
        <div className="space-y-3">
          <label htmlFor="chronicDisease" className="block text-sm font-medium text-sand-50/60 tracking-wide">
            Condition Name
          </label>
          <input 
            type="text" 
            id="chronicDisease" 
            name="chronicDisease" 
            required 
            placeholder="e.g. Diabetes Type 2"
            className="input-premium" 
          />
        </div>
        
        <button 
          type="submit"
          className="w-full bg-turq-600 text-ink-950 py-4 rounded-full font-medium text-sm hover:bg-turq-500 transition-colors"
        >
          Add Condition
        </button>
      </form>
    </div>
  );
}

