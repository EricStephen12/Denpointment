import { redirect } from "next/navigation";
import { getCurrentPerson, isAdmin, isReceptionist, isDentist } from "@/lib/auth";
import { currentUser } from "@clerk/nextjs/server";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import ReceptionistDashboard from "@/components/dashboards/ReceptionistDashboard";
import DentistDashboard from "@/components/dashboards/DentistDashboard";
import PatientDashboard from "@/components/dashboards/PatientDashboard";

export default async function DashboardRouter() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/");

  const dbUser = await getCurrentPerson();

  // Onboarding: no Person record (and no pending staff invite matched this email)
  if (!dbUser) {
    return (
      <div className="flex items-center justify-center px-4 py-24">
        <div className="dash-card p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-turq-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-turq-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-display text-sand-50">Complete Your Profile</h2>
            <p className="mt-2 text-sm text-sand-50/50">We need a few details to set up your patient record.</p>
          </div>
          <form action={async (formData) => {
            "use server";
            const { createPatientAccount } = await import('@/app/actions/onboarding');
            await createPatientAccount(formData);
          }}>
            <div className="mb-4">
              <label htmlFor="gender" className="block text-sm font-medium text-sand-50/70 mb-1">Gender</label>
              <select id="gender" name="gender" required className="dash-input">
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="mb-6">
              <label htmlFor="birthDate" className="block text-sm font-medium text-sand-50/70 mb-1">Birth Date</label>
              <input type="date" id="birthDate" name="birthDate" required className="dash-input" />
            </div>
            <button type="submit"
              className="w-full bg-turq-600 text-ink-950 py-3 rounded-full font-medium text-sm hover:bg-turq-500 transition-colors">
              Create Patient Account
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Routing logic based on roles
  const content = (() => {
    if (isAdmin(dbUser)) return <AdminDashboard user={dbUser} />;
    if (isReceptionist(dbUser)) return <ReceptionistDashboard user={dbUser} />;
    if (isDentist(dbUser)) return <DentistDashboard user={dbUser} />;
    return <PatientDashboard user={dbUser} />;
  })();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {content}
    </div>
  );
}
