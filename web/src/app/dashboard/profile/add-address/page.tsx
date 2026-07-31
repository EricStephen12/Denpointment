import React from 'react';
import { addAddress } from '@/app/actions/profile';
import Link from 'next/link';
import { MapPin, ArrowLeft } from 'lucide-react';

export default function AddAddressPage() {
  return (
    <div className="max-w-md mx-auto pt-8">
      <Link href="/dashboard/profile" className="inline-flex items-center gap-1 text-sm font-medium text-sand-50/40 hover:text-orange-400 mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Profile
      </Link>
      
      <div className="mb-10">
        <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-6">
          <MapPin className="h-6 w-6 text-orange-400" />
        </div>
        <h1 className="text-3xl font-display text-sand-50 mb-2">Add Address</h1>
        <p className="text-sand-50/50">Associate a new address with your profile.</p>
      </div>

      <form action={addAddress} className="space-y-6">
        <div className="space-y-3">
          <label htmlFor="street" className="block text-sm font-medium text-sand-50/60 tracking-wide">
            Street Address
          </label>
          <input 
            type="text" 
            id="street" 
            name="street" 
            required 
            placeholder="e.g. 123 Main St"
            className="input-premium" 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label htmlFor="city" className="block text-sm font-medium text-sand-50/60 tracking-wide">
              City
            </label>
            <input 
              type="text" 
              id="city" 
              name="city" 
              required 
              placeholder="e.g. New York"
              className="input-premium" 
            />
          </div>
          <div className="space-y-3">
            <label htmlFor="zipCode" className="block text-sm font-medium text-sand-50/60 tracking-wide">
              ZIP Code
            </label>
            <input 
              type="text" 
              id="zipCode" 
              name="zipCode" 
              required 
              placeholder="e.g. 10001"
              className="input-premium" 
            />
          </div>
        </div>
        
        <div className="pt-4">
          <button 
            type="submit"
            className="w-full bg-turq-600 text-ink-950 py-4 rounded-full font-medium text-sm hover:bg-turq-500 transition-colors"
          >
            Add Address
          </button>
        </div>
      </form>
    </div>
  );
}

