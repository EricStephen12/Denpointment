import React from 'react';
import { redirect } from "next/navigation";
import Link from 'next/link';
import { prisma } from "@/lib/prisma";
import { getCurrentPerson } from "@/lib/auth";
import { deleteAddress, deletePhone, deleteDisease } from '@/app/actions/profile';
import { Phone, MapPin, Activity, Plus, Trash2, Mail, Calendar, User as UserIcon } from 'lucide-react';

export default async function ProfilePage() {
  const currentPerson = await getCurrentPerson();
  if (!currentPerson) redirect("/");

  const dbPerson = await prisma.person.findUnique({
    where: { personId: currentPerson.personId },
    include: {
      addresses: true,
      contacts: true,
      diseases: true,
    }
  });

  if (!dbPerson) redirect("/dashboard");

  const initials = `${dbPerson.firstName[0]}${dbPerson.lastName[0]}`;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* ── Profile Header ── */}
      <div className="dash-card p-8 sm:p-10 mb-12 relative overflow-hidden flex flex-col sm:flex-row items-center gap-8">
        {/* Background ambient gradient */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-turq-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Large Avatar */}
        <div className="h-28 w-28 rounded-full bg-gradient-to-br from-turq-500 to-turq-700 flex items-center justify-center text-ink-950 font-display text-4xl shadow-lg shadow-turq-700/30 shrink-0">
          {initials}
        </div>

        {/* Info */}
        <div className="text-center sm:text-left flex-1 relative z-10">
          <h1 className="text-3xl font-display text-sand-50 mb-4">
            {dbPerson.firstName} {dbPerson.lastName}
          </h1>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 text-sm text-sand-50/50">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-turq-400" />
              {dbPerson.email}
            </div>
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-turq-400" />
              <span className="capitalize">{dbPerson.gender}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-turq-400" />
              {dbPerson.birthDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sections ── */}
      <div className="space-y-12">
        {/* Chronic Diseases */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-500/20 rounded-xl">
              <Activity className="h-5 w-5 text-red-400" />
            </div>
            <h2 className="text-xl font-display text-sand-50">Medical History</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {dbPerson.diseases.map(d => (
              <div key={d.chronicDisease} className="dash-card p-5 flex items-start justify-between gap-3 group hover:border-red-500/30 transition-colors">
                <p className="font-medium text-sand-50 text-sm leading-relaxed">{d.chronicDisease}</p>
                <form action={deleteDisease}>
                  <input type="hidden" name="chronicDisease" value={d.chronicDisease} />
                  <button type="submit" className="text-sand-50/20 hover:text-red-400 transition-colors p-1" aria-label="Delete condition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ))}
            <Link href="/dashboard/profile/add-chronic-disease" className="min-h-[5rem] rounded-2xl border-2 border-dashed border-sand-50/10 hover:border-turq-400/50 hover:bg-turq-600/8 flex flex-col items-center justify-center gap-2 text-sand-50/30 hover:text-turq-400 transition-all cursor-pointer">
              <Plus className="h-5 w-5" />
              <span className="text-xs font-medium uppercase tracking-widest">Add Condition</span>
            </Link>
          </div>
        </section>

        {/* Phones */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-turq-600/20 rounded-xl">
              <Phone className="h-5 w-5 text-turq-400" />
            </div>
            <h2 className="text-xl font-display text-sand-50">Phone Numbers</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {dbPerson.contacts.map(c => (
              <div key={c.contactNumber} className="dash-card p-5 flex items-center justify-between gap-3 group hover:border-turq-400/30 transition-colors">
                <p className="font-medium text-sand-50 text-sm">{c.contactNumber}</p>
                <form action={deletePhone}>
                  <input type="hidden" name="contactNumber" value={c.contactNumber} />
                  <button type="submit" className="text-sand-50/20 hover:text-red-400 transition-colors p-1" aria-label="Delete phone">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ))}
            <Link href="/dashboard/profile/add-phone" className="min-h-[5rem] rounded-2xl border-2 border-dashed border-sand-50/10 hover:border-turq-400/50 hover:bg-turq-600/8 flex flex-col items-center justify-center gap-2 text-sand-50/30 hover:text-turq-400 transition-all cursor-pointer">
              <Plus className="h-5 w-5" />
              <span className="text-xs font-medium uppercase tracking-widest">Add Phone</span>
            </Link>
          </div>
        </section>

        {/* Addresses */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-500/20 rounded-xl">
              <MapPin className="h-5 w-5 text-orange-400" />
            </div>
            <h2 className="text-xl font-display text-sand-50">Addresses</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dbPerson.addresses.map(a => (
              <div key={a.addressId} className="dash-card p-6 flex items-start justify-between gap-4 group hover:border-orange-500/30 transition-colors">
                <div>
                  <p className="font-medium text-sand-50 mb-1">{a.street}</p>
                  <p className="text-sm text-sand-50/50">{a.city}, {a.zipCode}</p>
                </div>
                <form action={deleteAddress}>
                  <input type="hidden" name="addressId" value={a.addressId} />
                  <button type="submit" className="text-sand-50/20 hover:text-red-400 transition-colors p-1 mt-1" aria-label="Delete address">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ))}
            <Link href="/dashboard/profile/add-address" className="min-h-[6rem] rounded-2xl border-2 border-dashed border-sand-50/10 hover:border-turq-400/50 hover:bg-turq-600/8 flex flex-col items-center justify-center gap-2 text-sand-50/30 hover:text-turq-400 transition-all cursor-pointer">
              <Plus className="h-5 w-5" />
              <span className="text-xs font-medium uppercase tracking-widest">Add Address</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
