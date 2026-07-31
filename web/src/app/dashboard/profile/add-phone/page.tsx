import React from 'react';
import { addPhone } from '@/app/actions/profile';
import Link from 'next/link';
import { Phone, ArrowLeft } from 'lucide-react';

export default function AddPhonePage() {
  return (
    <div className="max-w-md mx-auto pt-8">
      <Link href="/dashboard/profile" className="inline-flex items-center gap-1 text-sm font-medium text-sand-50/40 hover:text-turq-400 mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Profile
      </Link>
      
      <div className="mb-10">
        <div className="w-12 h-12 bg-turq-600/20 rounded-2xl flex items-center justify-center mb-6">
          <Phone className="h-6 w-6 text-turq-400" />
        </div>
        <h1 className="text-3xl font-display text-sand-50 mb-2">Add Phone Number</h1>
        <p className="text-sand-50/50">Associate a new contact number with your profile.</p>
      </div>

      <form action={addPhone} className="space-y-8">
        <div className="space-y-3">
          <label htmlFor="contactNumber" className="block text-sm font-medium text-sand-50/60 tracking-wide">
            Phone Number
          </label>
          <input 
            type="text" 
            id="contactNumber" 
            name="contactNumber" 
            required 
            placeholder="e.g. +1 555 000 0000"
            className="input-premium" 
          />
        </div>
        
        <button 
          type="submit"
          className="w-full bg-turq-600 text-ink-950 py-4 rounded-full font-medium text-sm hover:bg-turq-500 transition-colors"
        >
          Add Phone
        </button>
      </form>
    </div>
  );
}

