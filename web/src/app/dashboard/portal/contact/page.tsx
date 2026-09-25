import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isPatient } from "@/lib/auth";
import { addPhone, deletePhone, addAddress, deleteAddress } from "@/app/actions/profile";
import { Phone, MapPin, ArrowLeft, Plus, Trash2 } from "lucide-react";

export default async function UpdateContactPage() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isPatient(dbUser)) redirect("/dashboard");

  const person = await prisma.person.findUnique({
    where: { personId: dbUser.personId },
    include: { contacts: true, addresses: true },
  });
  if (!person) redirect("/dashboard");

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/dashboard/profile"
        className="inline-flex items-center gap-1.5 text-xs text-sand-50/40 hover:text-turq-400 mb-6 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Profile
      </Link>

      <div className="mb-8">
        <p className="text-xs font-medium text-turq-400 uppercase tracking-widest mb-3">My Account</p>
        <h1 className="text-3xl font-display text-sand-50">Update Contact Info</h1>
        <p className="mt-2 text-sm text-sand-50/50">Keep your contact details accurate so we can reach you.</p>
      </div>

      {/* Phone numbers */}
      <div className="dash-surface p-5 mb-5">
        <h2 className="text-sm font-semibold text-sand-50 mb-4 flex items-center gap-2">
          <Phone className="h-4 w-4 text-turq-400" /> Phone Numbers
        </h2>
        {person.contacts.length > 0 ? (
          <ul className="space-y-2 mb-4">
            {person.contacts.map((c) => (
              <li key={c.contactNumber} className="flex items-center justify-between text-sm text-sand-50/70">
                <span>{c.contactNumber}</span>
                <form action={deletePhone}>
                  <input type="hidden" name="contactNumber" value={c.contactNumber} />
                  <button type="submit" className="text-sand-50/25 hover:text-red-400 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-sand-50/30 mb-4">No phone numbers on file.</p>
        )}
        <form action={addPhone} className="flex gap-2">
          <input
            type="tel"
            name="contactNumber"
            placeholder="+234 801 234 5678"
            required
            className="dash-input flex-1"
          />
          <button type="submit" className="inline-flex items-center gap-1 text-xs bg-turq-600 hover:bg-turq-500 text-ink-950 px-3 py-2 rounded-lg font-semibold transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </form>
      </div>

      {/* Addresses */}
      <div className="dash-surface p-5">
        <h2 className="text-sm font-semibold text-sand-50 mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-turq-400" /> Address
        </h2>
        {person.addresses.length > 0 ? (
          <ul className="space-y-2 mb-4">
            {person.addresses.map((a) => (
              <li key={a.addressId} className="flex items-center justify-between text-sm text-sand-50/70">
                <span>{a.street}, {a.city}{a.zipCode ? ` ${a.zipCode}` : ""}</span>
                <form action={deleteAddress}>
                  <input type="hidden" name="addressId" value={a.addressId} />
                  <button type="submit" className="text-sand-50/25 hover:text-red-400 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-sand-50/30 mb-4">No address on file.</p>
        )}
        <form action={addAddress} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input type="text" name="street" placeholder="Street / Area" required className="dash-input" />
            <input type="text" name="city" placeholder="City" defaultValue="Abuja" required className="dash-input" />
          </div>
          <input type="text" name="zipCode" placeholder="Zip / Postal code (optional)" className="dash-input" />
          <button type="submit" className="inline-flex items-center gap-1 text-xs bg-turq-600 hover:bg-turq-500 text-ink-950 px-3 py-2 rounded-lg font-semibold transition-colors">
            <Plus className="h-3.5 w-3.5" /> Save Address
          </button>
        </form>
      </div>
    </div>
  );
}
